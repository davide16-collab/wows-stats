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
# CONFIGURAZIONE
# ---------------------------------------------------------------------------
APPLICATION_ID = os.environ.get("WG_APP_ID", "62317bb080e94322b11585d4c2bf3a6c")

# Realm -> dominio API.  Default: Europe.
REALMS = {
    "eu":   "https://api.worldofwarships.eu",
    "na":   "https://api.worldofwarships.com",
    "asia": "https://api.worldofwarships.asia",
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


# Endpoint che vivono nel namespace 'wgn' (Wargaming Network) invece di 'wows'.
# In World of Warships le info clan di un account stanno sotto /wgn/.
WGN_ENDPOINTS = ("clans/accountinfo", "clans/info", "clans/list",
                 "clans/membersinfo", "clans/glossary")


def build_wg_url(realm, endpoint, params):
    """Costruisce l'URL completo verso l'API Wargaming."""
    params = dict(params)
    params["application_id"] = APPLICATION_ID
    flat = {k: (v[0] if isinstance(v, list) else v) for k, v in params.items()}
    qs = urlencode(flat)
    endpoint = endpoint.strip("/")
    namespace = "wgn" if endpoint in WGN_ENDPOINTS else "wows"
    return f"{api_base(realm)}/{namespace}/{endpoint}/?{qs}"


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
    """Scarica i valori attesi per il Personal Rating da wows-numbers.

    wows-numbers blocca le richieste che non sembrano un browser (403),
    quindi inviamo header realistici. Se fallisce, ritorna {} senza bloccare
    il resto del sito (il PR resterà semplicemente non calcolato).
    """
    cached = _cache_get("expected")
    if cached is not None:
        return cached
    headers = {
        "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/124.0 Safari/537.36"),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://wows-numbers.com/personal/rating/",
    }
    table = {}
    try:
        req = Request(EXPECTED_URL, headers=headers)
        with urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", "replace")
        data = json.loads(raw)
        table = data.get("data") or {}
    except Exception as e:  # noqa
        sys.stderr.write("get_expected fallita: %s\n" % e)
        table = {}
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
                                "app_id_tail": APPLICATION_ID[-6:]})
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
