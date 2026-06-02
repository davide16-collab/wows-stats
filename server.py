#!/usr/bin/env python3
"""
Wows Stats - server proxy locale per l'API Wargaming (World of Warships).

L'API Wargaming non invia header CORS, quindi non puo' essere chiamata
direttamente dal browser. Questo server fa due cose:
  1. serve i file statici del frontend (cartella ./public)
  2. inoltra ("proxy") le richieste all'API aggiungendo la tua application_id

Avvio:
    python3 server.py
poi apri:   http://localhost:8000

Nessuna dipendenza esterna: usa solo la libreria standard di Python 3.
"""

import json
import os
import sys
import time
import threading
from urllib.parse import urlparse, parse_qs, urlencode
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# ---------------------------------------------------------------------------
# DATABASE (opzionale) - "progresso dall'ultima visita"
# ---------------------------------------------------------------------------
# Se la variabile DATABASE_URL e' impostata (es. Neon Postgres), il server
# salva una "fotografia" delle statistiche di ogni giocatore cercato e puo'
# calcolare quanto e' cambiato dall'ultima volta. Se non c'e', la funzione e'
# semplicemente disattivata e il resto del sito funziona uguale.
DATABASE_URL = os.environ.get("DATABASE_URL")
_db_ready = False
_db_lock = threading.Lock()

def _db_conn():
    import psycopg  # importato solo se serve
    return psycopg.connect(DATABASE_URL, connect_timeout=10)

def db_init():
    """Crea la tabella degli snapshot se non esiste. Chiamata una volta."""
    global _db_ready
    if not DATABASE_URL or _db_ready:
        return _db_ready
    try:
        with _db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS snapshots (
                        account_id BIGINT PRIMARY KEY,
                        nickname   TEXT,
                        ts         BIGINT,
                        battles    BIGINT,
                        wins       BIGINT,
                        damage     DOUBLE PRECISION,
                        frags      DOUBLE PRECISION
                    )
                """)
            conn.commit()
        _db_ready = True
    except Exception as e:  # noqa
        sys.stderr.write("db_init fallita: %s\n" % e)
        _db_ready = False
    return _db_ready

def db_progress(account_id, nickname, battles, wins, damage, frags):
    """Restituisce lo snapshot precedente (o None) e salva quello nuovo.

    Ritorna un dict {previous: {...}|None} cosi' il frontend calcola la
    differenza. Tutto entro un lock per evitare corse tra richieste.
    """
    if not DATABASE_URL:
        return {"enabled": False, "previous": None}
    with _db_lock:
        if not db_init():
            return {"enabled": False, "previous": None}
        prev = None
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT nickname, ts, battles, wins, damage, frags "
                        "FROM snapshots WHERE account_id=%s", (account_id,))
                    row = cur.fetchone()
                    if row:
                        prev = {"nickname": row[0], "ts": row[1],
                                "battles": row[2], "wins": row[3],
                                "damage": row[4], "frags": row[5]}
                    # salva/aggiorna lo snapshot corrente
                    cur.execute("""
                        INSERT INTO snapshots (account_id, nickname, ts, battles, wins, damage, frags)
                        VALUES (%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (account_id) DO UPDATE SET
                            nickname=EXCLUDED.nickname, ts=EXCLUDED.ts,
                            battles=EXCLUDED.battles, wins=EXCLUDED.wins,
                            damage=EXCLUDED.damage, frags=EXCLUDED.frags
                    """, (account_id, nickname, int(time.time()),
                          battles, wins, damage, frags))
                conn.commit()
        except Exception as e:  # noqa
            sys.stderr.write("db_progress fallita: %s\n" % e)
            return {"enabled": True, "previous": None, "error": str(e)}
        return {"enabled": True, "previous": prev}


# ---------------------------------------------------------------------------
# CONFIGURAZIONE
# ---------------------------------------------------------------------------
APPLICATION_ID = os.environ.get("WG_APP_ID", "62317bb080e94322b11585d4c2bf3a6c")

# Realm -> dominio API.  Default: Europe.
REALMS = {
    "eu":   "https://api.worldofwarships.eu",
    "na":   "https://api.worldofwarships.com",
    "asia": "https://api.worldofwarships.asia",
}
# Gli endpoint del namespace WGN (Wargaming Network, es. info clan) NON vivono
# sul dominio worldofwarships ma sul dominio storico worldoftanks.
REALMS_WGN = {
    "eu":   "https://api.worldoftanks.eu",
    "na":   "https://api.worldoftanks.com",
    "asia": "https://api.worldoftanks.asia",
}
DEFAULT_REALM = os.environ.get("WG_REALM", "eu")

# Valori attesi per il calcolo del Personal Rating (pubblicati da wows-numbers).
# Nota: wows-numbers rifiuta le richieste che non sembrano un browser, quindi
# la chiamata usa header da browser (vedi get_expected).
EXPECTED_URL = "https://wows-numbers.com/personal/rating/expected/json/"

PORT = int(os.environ.get("PORT", "8000"))
# In locale: 127.0.0.1 (solo questo PC). Online (Render): HOST=0.0.0.0
HOST = os.environ.get("HOST", "127.0.0.1")
HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(HERE, "public")

# Cache in memoria (riduce le chiamate all'API per dati che cambiano di rado)
_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 6 * 60 * 60  # 6 ore


def _cache_get(key):
    with _cache_lock:
        item = _cache.get(key)
        if item and (time.time() - item[0]) < CACHE_TTL:
            return item[1]
    return None


def _cache_set(key, value):
    with _cache_lock:
        _cache[key] = (time.time(), value)


def fetch_json(url):
    """Scarica un URL e ritorna il JSON come dict.

    Se l'API risponde con testo non-JSON (es. 'Not Found'), non solleva
    un'eccezione criptica ma restituisce un errore in formato standard.
    """
    req = Request(url, headers={"User-Agent": "WowsStats/1.0"})
    with urlopen(req, timeout=20) as resp:
        raw = resp.read().decode("utf-8", "replace").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        msg = raw[:200] if raw else "risposta vuota dall'API"
        return {"status": "error", "error": {"message": f"Risposta non valida dall'API: {msg}"}}


def api_base(realm):
    return REALMS.get(realm, REALMS[DEFAULT_REALM])


# In World of Warships gli endpoint clan (clans/list, clans/info,
# clans/accountinfo) vivono sotto il namespace 'wows' sul dominio
# worldofwarships, NON sotto 'wgn'. Quindi la lista WGN qui è vuota:
# nessuno degli endpoint che usiamo va dirottato su wgn/worldoftanks.
WGN_ENDPOINTS = ()


def build_wg_url(realm, endpoint, params):
    """Costruisce l'URL completo verso l'API Wargaming."""
    params = dict(params)
    params["application_id"] = APPLICATION_ID
    flat = {k: (v[0] if isinstance(v, list) else v) for k, v in params.items()}
    qs = urlencode(flat)
    endpoint = endpoint.strip("/")
    if endpoint in WGN_ENDPOINTS:
        base = REALMS_WGN.get(realm, REALMS_WGN[DEFAULT_REALM])
        namespace = "wgn"
    else:
        base = api_base(realm)
        namespace = "wows"
    return f"{base}/{namespace}/{endpoint}/?{qs}"


def get_ships_meta(realm):
    """Scarica tutta l'enciclopedia delle navi (paginata) e la fonde in un dict."""
    cache_key = f"ships_meta:{realm}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    fields = "ship_id,name,tier,type,nation,is_premium,is_special"
    merged = {}
    page = 1
    while True:
        url = build_wg_url(realm, "encyclopedia/ships", {
            "fields": fields, "language": "en", "limit": 100, "page_no": page,
        })
        data = fetch_json(url)
        if data.get("status") != "ok":
            break
        chunk = data.get("data") or {}
        merged.update(chunk)
        meta = data.get("meta") or {}
        total_pages = meta.get("page_total") or 1
        if page >= total_pages:
            break
        page += 1

    _cache_set(cache_key, merged)
    return merged


def get_expected():
    """Restituisce i valori attesi per il Personal Rating.

    Priorità:
    1. File locale 'expected.json' nella radice del progetto (generato dalla
       pagina /build-expected.html campionando giocatori reali). È la fonte
       principale: nessuna dipendenza da servizi esterni.
    2. In mancanza del file, ritorna {} (il PR resta non calcolato).

    Il vecchio download da wows-numbers è stato rimosso: il loro server è
    inaffidabile/offline e blocca le richieste non-browser.
    """
    cached = _cache_get("expected")
    if cached is not None:
        return cached

    table = {}
    local_path = os.path.join(HERE, "expected.json")
    if os.path.isfile(local_path):
        try:
            with open(local_path, "r", encoding="utf-8") as f:
                doc = json.load(f)
            # accetta sia {data:{...}} sia direttamente {...}
            table = doc.get("data") if isinstance(doc, dict) and "data" in doc else doc
            if not isinstance(table, dict):
                table = {}
        except Exception as e:  # noqa
            sys.stderr.write("Lettura expected.json fallita: %s\n" % e)
            table = {}
    else:
        sys.stderr.write("expected.json non presente: PR non calcolato.\n")

    _cache_set("expected", table)
    return table


class Handler(BaseHTTPRequestHandler):
    server_version = "WowsStats/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    # -- utilita' di risposta ------------------------------------------------
    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, path):
        ctypes = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
        }
        ext = os.path.splitext(path)[1]
        try:
            with open(path, "rb") as f:
                body = f.read()
        except OSError:
            self.send_error(404, "Not found")
            return
        self.send_response(200)
        self.send_header("Content-Type", ctypes.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # -- routing -------------------------------------------------------------
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)
        realm = (qs.pop("realm", [DEFAULT_REALM])[0] or DEFAULT_REALM).lower()

        try:
            if path.startswith("/api/wg/"):
                endpoint = path[len("/api/wg/"):]
                url = build_wg_url(realm, endpoint, qs)
                self.send_json(fetch_json(url))
                return

            if path == "/api/ships_meta":
                self.send_json({"status": "ok", "data": get_ships_meta(realm)})
                return

            if path == "/api/expected":
                self.send_json({"status": "ok", "data": get_expected()})
                return

            if path == "/api/config":
                self.send_json({"realm": DEFAULT_REALM,
                                "realms": list(REALMS.keys()),
                                "app_id_tail": APPLICATION_ID[-6:],
                                "progress_enabled": bool(DATABASE_URL)})
                return

            if path == "/api/progress":
                def num(name, default=0):
                    try: return float(qs.get(name, [default])[0])
                    except Exception: return default
                acc = int(num("account_id"))
                nick = (qs.get("nickname", [""])[0])
                res = db_progress(acc, nick, int(num("battles")), int(num("wins")),
                                  num("damage"), num("frags"))
                self.send_json({"status": "ok", **res})
                return

            # file statici
            rel = path.lstrip("/")
            if rel == "" or rel == "/":
                rel = "index.html"
            full = os.path.normpath(os.path.join(PUBLIC_DIR, rel))
            if not full.startswith(PUBLIC_DIR):
                self.send_error(403, "Forbidden")
                return
            if os.path.isfile(full):
                self.send_file(full)
            else:
                self.send_file(os.path.join(PUBLIC_DIR, "index.html"))

        except HTTPError as e:
            self.send_json({"status": "error",
                            "error": {"message": f"HTTP {e.code} dall'API Wargaming"}}, 502)
        except URLError as e:
            self.send_json({"status": "error",
                            "error": {"message": f"Rete non raggiungibile: {e.reason}"}}, 502)
        except Exception as e:  # noqa
            self.send_json({"status": "error", "error": {"message": str(e)}}, 500)


def main():
    if not os.path.isdir(PUBLIC_DIR):
        print(f"Cartella 'public' non trovata in {HERE}", file=sys.stderr)
        sys.exit(1)
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print("=" * 56)
    print("  WOWS STATS")
    print(f"  Realm di default : {DEFAULT_REALM.upper()}")
    print(f"  Application ID   : ...{APPLICATION_ID[-6:]}")
    print(f"  Apri il browser  : http://localhost:{PORT}")
    print("  (Ctrl+C per fermare)")
    print("=" * 56)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nArrivederci.")
        httpd.shutdown()


if __name__ == "__main__":
    main()
