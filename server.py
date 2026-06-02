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
                # Indice navi: una riga per (giocatore, nave) coi suoi totali
                # Random. Aggiornando la riga, niente doppi conteggi quando un
                # giocatore viene ricercato piu' volte. Le medie attese si
                # ricavano aggregando tutte le righe per nave.
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS ship_index (
                        account_id BIGINT,
                        ship_id    BIGINT,
                        battles    BIGINT,
                        wins       BIGINT,
                        damage     DOUBLE PRECISION,
                        frags      DOUBLE PRECISION,
                        PRIMARY KEY (account_id, ship_id)
                    )
                """)
                cur.execute("CREATE INDEX IF NOT EXISTS idx_ship ON ship_index (ship_id)")
                # Riepilogo clan: una riga per clan, salvata quando si apre
                # un clan nella pagina Clans. Medie pesate per battaglie.
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS clans (
                        clan_id      BIGINT PRIMARY KEY,
                        tag          TEXT,
                        name         TEXT,
                        members      INTEGER,
                        active        INTEGER,
                        battles      BIGINT,
                        avg_wr       DOUBLE PRECISION,
                        avg_damage   DOUBLE PRECISION,
                        avg_frags    DOUBLE PRECISION,
                        ts           BIGINT
                    )
                """)
                # Valutazione Clan Battles per clan (Strada A: API ufficiale).
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS clan_cb (
                        clan_id    BIGINT PRIMARY KEY,
                        tag        TEXT,
                        name       TEXT,
                        nation     TEXT,
                        season_id  INTEGER,
                        rating     INTEGER,
                        league     INTEGER,
                        division   INTEGER,
                        div_rating INTEGER,
                        battles    BIGINT,
                        wins       BIGINT,
                        ts         BIGINT
                    )
                """)
                cur.execute("CREATE INDEX IF NOT EXISTS idx_clan_cb_rating ON clan_cb (rating)")
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


def db_index_ships(account_id, ships):
    """Salva/aggiorna i totali Random per nave di un giocatore.

    `ships` = lista di dict {ship_id, battles, wins, damage, frags}.
    Usa upsert per (account_id, ship_id): re-indicizzare aggiorna senza
    gonfiare i totali aggregati.
    """
    if not DATABASE_URL or not ships:
        return False
    with _db_lock:
        if not db_init():
            return False
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.executemany("""
                        INSERT INTO ship_index (account_id, ship_id, battles, wins, damage, frags)
                        VALUES (%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (account_id, ship_id) DO UPDATE SET
                            battles=EXCLUDED.battles, wins=EXCLUDED.wins,
                            damage=EXCLUDED.damage, frags=EXCLUDED.frags
                    """, [(account_id, s["ship_id"], s["battles"], s["wins"],
                           s["damage"], s["frags"]) for s in ships])
                conn.commit()
            return True
        except Exception as e:  # noqa
            sys.stderr.write("db_index_ships fallita: %s\n" % e)
            return False


def db_expected():
    """Calcola le medie attese per nave aggregando l'indice.

    Ritorna {ship_id: {average_damage_dealt, average_frags, win_rate, _players, _battles}}.
    Solo navi con un minimo di battaglie totali, per evitare rumore.
    """
    if not DATABASE_URL:
        return {}
    # cache breve dedicata (le medie si arricchiscono di continuo)
    with _cache_lock:
        item = _cache.get("db_expected")
        if item and (time.time() - item[0]) < 300:  # 5 minuti
            return item[1]
    out = {}
    with _db_lock:
        if not db_init():
            return {}
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT ship_id,
                               COUNT(*)        AS players,
                               SUM(battles)    AS b,
                               SUM(wins)       AS w,
                               SUM(damage)     AS d,
                               SUM(frags)      AS f
                        FROM ship_index
                        GROUP BY ship_id
                        HAVING SUM(battles) >= 50
                    """)
                    for ship_id, players, b, w, d, f in cur.fetchall():
                        if not b:
                            continue
                        out[str(ship_id)] = {
                            "average_damage_dealt": d / b,
                            "average_frags": f / b,
                            "win_rate": w / b * 100.0,
                            "_players": players,
                            "_battles": int(b),
                        }
        except Exception as e:  # noqa
            sys.stderr.write("db_expected fallita: %s\n" % e)
            out = {}
    # cache breve: si aggiorna spesso ma non a ogni richiesta
    with _cache_lock:
        _cache["db_expected"] = (time.time(), out)
    return out


def db_leaderboard_ship(ship_id, offset=0, limit=50):
    """Giocatori indicizzati su una nave, paginati.

    Restituisce {rows, total}: la pagina richiesta + il numero totale di
    giocatori che soddisfano il filtro (per calcolare quante pagine ci sono).
    Ordino per danno medio (proxy del PR). Il PR esatto lo calcola il frontend.
    """
    if not DATABASE_URL:
        return {"rows": [], "total": 0}
    with _db_lock:
        if not db_init():
            return {"rows": [], "total": 0}
        rows = []
        total = 0
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT COUNT(*) FROM ship_index
                        WHERE ship_id = %s AND battles >= 50
                    """, (ship_id,))
                    total = int(cur.fetchone()[0] or 0)
                    cur.execute("""
                        SELECT si.account_id, s.nickname,
                               si.battles, si.wins, si.damage, si.frags
                        FROM ship_index si
                        LEFT JOIN snapshots s ON s.account_id = si.account_id
                        WHERE si.ship_id = %s AND si.battles >= 50
                        ORDER BY (si.damage / NULLIF(si.battles,0)) DESC
                        OFFSET %s LIMIT %s
                    """, (ship_id, offset, limit))
                    for acc, nick, b, w, d, f in cur.fetchall():
                        rows.append({"account_id": acc, "nickname": nick or str(acc),
                                     "battles": int(b), "wins": int(w),
                                     "damage": d, "frags": f})
        except Exception as e:  # noqa
            sys.stderr.write("db_leaderboard_ship fallita: %s\n" % e)
        return {"rows": rows, "total": total}


def db_leaderboard_players(offset=0, limit=50):
    """Giocatori indicizzati (globale), paginati.

    Restituisce {rows, total}. Usa la tabella snapshots (totali account),
    ordinati per danno medio. Il frontend mostra i dati e calcola il rank.
    """
    if not DATABASE_URL:
        return {"rows": [], "total": 0}
    with _db_lock:
        if not db_init():
            return {"rows": [], "total": 0}
        rows = []
        total = 0
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT COUNT(*) FROM snapshots WHERE battles >= 100")
                    total = int(cur.fetchone()[0] or 0)
                    cur.execute("""
                        SELECT account_id, nickname, battles, wins, damage, frags
                        FROM snapshots
                        WHERE battles >= 100
                        ORDER BY (damage / NULLIF(battles,0)) DESC
                        OFFSET %s LIMIT %s
                    """, (offset, limit))
                    for acc, nick, b, w, d, f in cur.fetchall():
                        rows.append({"account_id": acc, "nickname": nick or str(acc),
                                     "battles": int(b), "wins": int(w),
                                     "damage": d, "frags": f})
        except Exception as e:  # noqa
            sys.stderr.write("db_leaderboard_players fallita: %s\n" % e)
        return {"rows": rows, "total": total}


def db_rank_player(nick):
    """Posizione di un giocatore (per nick) nella classifica globale.

    Ritorna {found, rank, total, nickname, avg_damage} oppure {found:False}.
    Il rank = quanti giocatori hanno danno medio strettamente superiore, +1.
    """
    if not DATABASE_URL or not nick:
        return {"found": False}
    with _db_lock:
        if not db_init():
            return {"found": False}
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT account_id, nickname, battles, damage
                        FROM snapshots
                        WHERE LOWER(nickname)=LOWER(%s) AND battles >= 100
                        LIMIT 1
                    """, (nick,))
                    row = cur.fetchone()
                    if not row:
                        return {"found": False}
                    acc, nm, b, d = row
                    avg = d / b if b else 0
                    cur.execute("""
                        SELECT COUNT(*) FROM snapshots
                        WHERE battles >= 100 AND (damage / NULLIF(battles,0)) > %s
                    """, (avg,))
                    higher = int(cur.fetchone()[0] or 0)
                    cur.execute("SELECT COUNT(*) FROM snapshots WHERE battles >= 100")
                    total = int(cur.fetchone()[0] or 0)
                    return {"found": True, "rank": higher + 1, "total": total,
                            "nickname": nm, "avg_damage": avg, "account_id": acc}
        except Exception as e:  # noqa
            sys.stderr.write("db_rank_player fallita: %s\n" % e)
            return {"found": False}


def db_rank_ship(ship_id, nick):
    """Posizione di un giocatore su una nave specifica (per nick)."""
    if not DATABASE_URL or not nick or not ship_id:
        return {"found": False}
    with _db_lock:
        if not db_init():
            return {"found": False}
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    # trovo l'account dal nick (via snapshots) e poi la sua riga nave
                    cur.execute("SELECT account_id FROM snapshots WHERE LOWER(nickname)=LOWER(%s) LIMIT 1", (nick,))
                    arow = cur.fetchone()
                    if not arow:
                        return {"found": False}
                    acc = arow[0]
                    cur.execute("""
                        SELECT battles, damage FROM ship_index
                        WHERE account_id=%s AND ship_id=%s AND battles >= 50
                    """, (acc, ship_id))
                    srow = cur.fetchone()
                    if not srow:
                        return {"found": False}
                    b, d = srow
                    avg = d / b if b else 0
                    cur.execute("""
                        SELECT COUNT(*) FROM ship_index
                        WHERE ship_id=%s AND battles >= 50 AND (damage / NULLIF(battles,0)) > %s
                    """, (ship_id, avg))
                    higher = int(cur.fetchone()[0] or 0)
                    cur.execute("SELECT COUNT(*) FROM ship_index WHERE ship_id=%s AND battles >= 50", (ship_id,))
                    total = int(cur.fetchone()[0] or 0)
                    return {"found": True, "rank": higher + 1, "total": total,
                            "avg_damage": avg, "account_id": acc}
        except Exception as e:  # noqa
            sys.stderr.write("db_rank_ship fallita: %s\n" % e)
            return {"found": False}


def db_save_clan(clan_id, tag, name, members, active, battles, avg_wr, avg_damage, avg_frags):
    """Salva/aggiorna il riepilogo di un clan (per la classifica clan)."""
    if not DATABASE_URL or not clan_id:
        return False
    with _db_lock:
        if not db_init():
            return False
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO clans (clan_id, tag, name, members, active, battles,
                                           avg_wr, avg_damage, avg_frags, ts)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (clan_id) DO UPDATE SET
                            tag=EXCLUDED.tag, name=EXCLUDED.name, members=EXCLUDED.members,
                            active=EXCLUDED.active, battles=EXCLUDED.battles,
                            avg_wr=EXCLUDED.avg_wr, avg_damage=EXCLUDED.avg_damage,
                            avg_frags=EXCLUDED.avg_frags, ts=EXCLUDED.ts
                    """, (clan_id, tag, name, members, active, battles,
                          avg_wr, avg_damage, avg_frags, int(time.time())))
                conn.commit()
            return True
        except Exception as e:  # noqa
            sys.stderr.write("db_save_clan fallita: %s\n" % e)
            return False


def db_leaderboard_clans(offset=0, limit=50, sort="wr"):
    """Classifica dei clan indicizzati, paginata. sort: wr|dmg."""
    if not DATABASE_URL:
        return {"rows": [], "total": 0}
    order = "avg_damage" if sort == "dmg" else "avg_wr"
    with _db_lock:
        if not db_init():
            return {"rows": [], "total": 0}
        rows = []
        total = 0
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT COUNT(*) FROM clans WHERE active >= 3")
                    total = int(cur.fetchone()[0] or 0)
                    cur.execute("""
                        SELECT clan_id, tag, name, members, active, battles,
                               avg_wr, avg_damage, avg_frags
                        FROM clans
                        WHERE active >= 3
                        ORDER BY %s DESC
                        OFFSET %%s LIMIT %%s
                    """ % order, (offset, limit))
                    for cid, tag, nm, mem, act, b, wr, d, f in cur.fetchall():
                        rows.append({"clan_id": cid, "tag": tag, "name": nm,
                                     "members": mem, "active": act, "battles": int(b or 0),
                                     "avg_wr": wr, "avg_damage": d, "avg_frags": f})
        except Exception as e:  # noqa
            sys.stderr.write("db_leaderboard_clans fallita: %s\n" % e)
        return {"rows": rows, "total": total}


def db_save_clan_cb(clan_id, tag, name, nation, cb):
    """Salva/aggiorna la valutazione Clan Battles di un clan."""
    if not DATABASE_URL or not clan_id or not cb:
        return False
    with _db_lock:
        if not db_init():
            return False
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO clan_cb (clan_id, tag, name, nation, season_id,
                                             rating, league, division, div_rating,
                                             battles, wins, ts)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (clan_id) DO UPDATE SET
                            tag=EXCLUDED.tag, name=EXCLUDED.name,
                            nation=COALESCE(EXCLUDED.nation, clan_cb.nation),
                            season_id=EXCLUDED.season_id, rating=EXCLUDED.rating,
                            league=EXCLUDED.league, division=EXCLUDED.division,
                            div_rating=EXCLUDED.div_rating, battles=EXCLUDED.battles,
                            wins=EXCLUDED.wins, ts=EXCLUDED.ts
                    """, (clan_id, tag, name, nation, cb.get("season_id"),
                          int(cb.get("public_rating") or 0), cb.get("league"),
                          cb.get("division"), int(cb.get("division_rating") or 0),
                          int(cb.get("battles") or 0), int(cb.get("wins") or 0),
                          int(time.time())))
                conn.commit()
            return True
        except Exception as e:  # noqa
            sys.stderr.write("db_save_clan_cb fallita: %s\n" % e)
            return False


def db_cb_leaderboard(nation=None, offset=0, limit=50):
    """Classifica Clan Battles dei clan indicizzati (per rating). Filtro nazione opzionale."""
    if not DATABASE_URL:
        return {"rows": [], "total": 0}
    with _db_lock:
        if not db_init():
            return {"rows": [], "total": 0}
        rows, total = [], 0
        where = "WHERE battles > 0"
        wargs = []
        if nation:
            where += " AND nation = %s"
            wargs = [nation]
        try:
            with _db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT COUNT(*) FROM clan_cb " + where, wargs)
                    total = int(cur.fetchone()[0] or 0)
                    cur.execute("""
                        SELECT clan_id, tag, name, nation, league, division,
                               div_rating, rating, battles, wins
                        FROM clan_cb """ + where + """
                        ORDER BY rating DESC, wins DESC
                        OFFSET %s LIMIT %s
                    """, wargs + [offset, limit])
                    for cid, tag, nm, nat, lg, dv, dr, rt, b, w in cur.fetchall():
                        rows.append({"clan_id": cid, "tag": tag, "name": nm, "nation": nat,
                                     "league": lg, "division": dv, "div_rating": dr,
                                     "rating": rt, "battles": int(b or 0), "wins": int(w or 0),
                                     "wr": (w / b * 100.0) if b else 0})
        except Exception as e:  # noqa
            sys.stderr.write("db_cb_leaderboard fallita: %s\n" % e)
        return {"rows": rows, "total": total}


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


def fetch_json_browser(url):
    """Come fetch_json ma con header da browser: alcuni siti (es. wows-numbers)
    rifiutano le richieste che non sembrano provenire da un browser."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
    }
    req = Request(url, headers=headers)
    with urlopen(req, timeout=20) as resp:
        raw = resp.read().decode("utf-8", "replace").strip()
    return json.loads(raw)


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
    """Valori attesi per il Personal Rating.

    Base: i valori della community (wows-numbers, EXPECTED_URL), che coprono
    tutte le navi sull'intera popolazione e si auto-aggiornano. Se la rete non
    risponde, si ripiega sul file locale 'expected.json' (se presente).

    Sopra la base si integra l'indice locale del database SOLO per riempire le
    navi che la base non copre, oppure quando l'indice ha un campione enorme
    (piu' affidabile della base). Cosi' pochi giocatori indicizzati non possono
    "sporcare" valori gia' accurati.

    Il fallback per tier+classe sulle navi senza dati lo applica il frontend.
    """
    EXPECTED_TTL = 24 * 3600          # i valori attesi cambiano di rado
    DB_OVERRIDE_MIN_BATTLES = 150000  # la base community vince fino a campioni enormi

    # base con cache lunga dedicata
    with _cache_lock:
        item = _cache.get("expected_base")
        base = item[1] if item and (time.time() - item[0]) < EXPECTED_TTL else None

    if base is None:
        base = {}
        # 1) fonte community (auto-aggiornante)
        try:
            doc = fetch_json_browser(EXPECTED_URL)
            data = doc.get("data") if isinstance(doc, dict) and "data" in doc else doc
            if isinstance(data, dict):
                base = {str(k): v for k, v in data.items()
                        if isinstance(v, dict) and v.get("average_damage_dealt")}
        except Exception as e:  # noqa
            sys.stderr.write("Fetch valori attesi community fallito: %s\n" % e)
        # 2) ripiego: file locale 'expected.json'
        if not base:
            local_path = os.path.join(HERE, "expected.json")
            if os.path.isfile(local_path):
                try:
                    with open(local_path, "r", encoding="utf-8") as f:
                        doc = json.load(f)
                    data = doc.get("data") if isinstance(doc, dict) and "data" in doc else doc
                    if isinstance(data, dict):
                        base = {str(k): v for k, v in data.items() if isinstance(v, dict)}
                except Exception as e:  # noqa
                    sys.stderr.write("Lettura expected.json fallita: %s\n" % e)
        with _cache_lock:
            _cache["expected_base"] = (time.time(), base)

    table = dict(base)

    # integra col database: riempi i buchi; sovrascrivi solo con campione enorme
    db_vals = db_expected()
    for sid, v in db_vals.items():
        if sid not in table or v.get("_battles", 0) >= DB_OVERRIDE_MIN_BATTLES:
            table[sid] = v
    return table


# ---------------------------------------------------------------------------
# CLAN BATTLES (Strada A: API ufficiale clans/season + clans/seasonstats)
# ---------------------------------------------------------------------------
CB_LEAGUES = {0: "Hurricane", 1: "Typhoon", 2: "Storm", 3: "Gale", 4: "Squall"}

# La nazionalita' dei clan non esiste nell'API: lista curata, estendibile con
# un file 'clan_nations.json' in radice -> { "TAG": "it", ... } (tag MAIUSCOLO).
CLAN_NATIONS_DEFAULT = {"SN41": "it"}


def clan_nations():
    table = dict(CLAN_NATIONS_DEFAULT)
    path = os.path.join(HERE, "clan_nations.json")
    if os.path.isfile(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                doc = json.load(f)
            if isinstance(doc, dict):
                for k, v in doc.items():
                    table[str(k).upper()] = str(v).lower()
        except Exception as e:  # noqa
            sys.stderr.write("Lettura clan_nations.json fallita: %s\n" % e)
    return table


def get_cb_season(realm):
    """Id della stagione di Clan Battles piu' recente (cache lunga)."""
    ckey = "cb_season:" + realm
    cached = _cache_get(ckey)
    if cached is not None:
        return cached
    season_id = None
    try:
        doc = fetch_json(build_wg_url(realm, "clans/season", {}))
        data = doc.get("data") if isinstance(doc, dict) else None
        ids = []
        if isinstance(data, dict):
            for k, v in data.items():
                try:
                    ids.append(int(k))
                except Exception:
                    if isinstance(v, dict) and v.get("season_id") is not None:
                        ids.append(int(v["season_id"]))
        elif isinstance(data, list):
            for v in data:
                if isinstance(v, dict) and v.get("season_id") is not None:
                    ids.append(int(v["season_id"]))
        if ids:
            season_id = max(ids)
    except Exception as e:  # noqa
        sys.stderr.write("get_cb_season fallita: %s\n" % e)
    _cache_set(ckey, season_id)
    return season_id


def fetch_clan_cb(realm, clan_id, season_id):
    """Valutazione Clan Battles di un clan per la stagione data. Parsing difensivo
    (i nomi esatti dei campi si confermano via /api/cb/debug). Dict o None."""
    if not clan_id:
        return None
    try:
        doc = fetch_json(build_wg_url(realm, "clans/seasonstats", {"clan_id": clan_id}))
    except Exception as e:  # noqa
        sys.stderr.write("fetch_clan_cb fallita: %s\n" % e)
        return None
    if not isinstance(doc, dict) or doc.get("status") != "ok":
        return None
    data = doc.get("data") or {}
    entry = data.get(str(clan_id)) if isinstance(data, dict) else None
    if entry is None:
        return None

    # raccogli ricorsivamente le voci stagione/squadra in una lista piatta
    cand = []

    def collect(x):
        if isinstance(x, list):
            for it in x:
                collect(it)
        elif isinstance(x, dict):
            if "season_id" in x or "public_rating" in x or "league" in x:
                cand.append(x)
            else:
                for v in x.values():
                    collect(v)

    collect(entry)
    if season_id is not None:
        filt = [x for x in cand if str(x.get("season_id")) == str(season_id)]
        if filt:
            cand = filt
    if not cand:
        return None

    def g(x, *keys):
        for k in keys:
            v = x.get(k)
            if isinstance(v, (int, float)):
                return v
        return None

    def rating_of(x):
        r = g(x, "public_rating", "rating", "division_rating")
        return r if r is not None else -1

    best = max(cand, key=rating_of)
    sid = g(best, "season_id")
    return {
        "season_id": sid if sid is not None else season_id,
        "public_rating": g(best, "public_rating", "rating") or 0,
        "league": g(best, "league"),
        "division": g(best, "division"),
        "division_rating": g(best, "division_rating") or 0,
        "battles": int(g(best, "battles_count", "battles") or 0),
        "wins": int(g(best, "wins_count", "wins") or 0),
    }


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

            if path == "/api/leaderboard/cb":
                nation = (qs.get("nation", [""])[0] or "").lower().strip() or None
                try:
                    offset = max(0, int(qs.get("offset", ["0"])[0]))
                    limit = min(100, max(1, int(qs.get("limit", ["50"])[0])))
                except Exception:
                    offset, limit = 0, 50
                res = db_cb_leaderboard(nation, offset, limit)
                self.send_json({"status": "ok", "enabled": bool(DATABASE_URL),
                                "season_id": get_cb_season(realm),
                                "rows": res["rows"], "total": res["total"]})
                return

            if path == "/api/cb/debug":
                try:
                    cid = int(qs.get("clan_id", ["0"])[0])
                except Exception:
                    cid = 0
                tag = (qs.get("tag", [""])[0] or "").strip()
                search_raw = None
                if not cid and tag:
                    try:
                        search_raw = fetch_json(build_wg_url(realm, "clans/list", {"search": tag, "limit": 10}))
                        for c in (search_raw.get("data") or []):
                            if str(c.get("tag", "")).upper() == tag.upper():
                                cid = int(c.get("clan_id") or 0)
                                break
                        if not cid and (search_raw.get("data") or []):
                            cid = int(search_raw["data"][0].get("clan_id") or 0)
                    except Exception as e:  # noqa
                        search_raw = {"error": str(e)}
                season = get_cb_season(realm)
                seasonstats_raw = None
                if cid:
                    try:
                        seasonstats_raw = fetch_json(build_wg_url(realm, "clans/seasonstats", {"clan_id": cid}))
                    except Exception as e:  # noqa
                        seasonstats_raw = {"error": str(e)}
                self.send_json({"status": "ok", "clan_id": cid, "season_id": season,
                                "search_raw": search_raw,
                                "season_raw": fetch_json(build_wg_url(realm, "clans/season", {})),
                                "seasonstats_raw": seasonstats_raw,
                                "parsed": fetch_clan_cb(realm, cid, season) if cid else None})
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

            if path == "/api/leaderboard/ship":
                try:
                    sid = int(qs.get("ship_id", ["0"])[0])
                except Exception:
                    sid = 0
                try:
                    offset = max(0, int(qs.get("offset", ["0"])[0]))
                    limit = min(100, max(1, int(qs.get("limit", ["50"])[0])))
                except Exception:
                    offset, limit = 0, 50
                res = db_leaderboard_ship(sid, offset, limit) if sid else {"rows": [], "total": 0}
                self.send_json({"status": "ok", "enabled": bool(DATABASE_URL),
                                "rows": res["rows"], "total": res["total"]})
                return

            if path == "/api/leaderboard/players":
                try:
                    offset = max(0, int(qs.get("offset", ["0"])[0]))
                    limit = min(100, max(1, int(qs.get("limit", ["50"])[0])))
                except Exception:
                    offset, limit = 0, 50
                res = db_leaderboard_players(offset, limit)
                self.send_json({"status": "ok", "enabled": bool(DATABASE_URL),
                                "rows": res["rows"], "total": res["total"]})
                return

            if path == "/api/leaderboard/clans":
                try:
                    offset = max(0, int(qs.get("offset", ["0"])[0]))
                    limit = min(100, max(1, int(qs.get("limit", ["50"])[0])))
                except Exception:
                    offset, limit = 0, 50
                sort = (qs.get("sort", ["wr"])[0])
                res = db_leaderboard_clans(offset, limit, sort)
                self.send_json({"status": "ok", "enabled": bool(DATABASE_URL),
                                "rows": res["rows"], "total": res["total"]})
                return

            if path == "/api/leaderboard/rank_player":
                nick = (qs.get("nickname", [""])[0]).strip()
                res = db_rank_player(nick)
                self.send_json({"status": "ok", "enabled": bool(DATABASE_URL), **res})
                return

            if path == "/api/leaderboard/rank_ship":
                nick = (qs.get("nickname", [""])[0]).strip()
                try:
                    sid = int(qs.get("ship_id", ["0"])[0])
                except Exception:
                    sid = 0
                res = db_rank_ship(sid, nick)
                self.send_json({"status": "ok", "enabled": bool(DATABASE_URL), **res})
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

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path not in ("/api/index", "/api/clan_summary"):
            self.send_json({"status": "error", "error": {"message": "Not found"}}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length else b"{}"
            data = json.loads(body.decode("utf-8", "replace"))

            if parsed.path == "/api/clan_summary":
                cid = int(data.get("clan_id", 0))
                ok = db_save_clan(
                    cid, data.get("tag", ""), data.get("name", ""),
                    int(data.get("members", 0)), int(data.get("active", 0)),
                    int(data.get("battles", 0)), float(data.get("avg_wr", 0)),
                    float(data.get("avg_damage", 0)), float(data.get("avg_frags", 0)),
                ) if cid else False
                if cid:
                    try:
                        season = get_cb_season(DEFAULT_REALM)
                        cb = fetch_clan_cb(DEFAULT_REALM, cid, season) if season is not None else None
                        if cb:
                            nat = clan_nations().get(str(data.get("tag", "")).upper())
                            db_save_clan_cb(cid, data.get("tag", ""), data.get("name", ""), nat, cb)
                    except Exception:
                        pass
                self.send_json({"status": "ok", "saved": ok, "enabled": bool(DATABASE_URL)})
                return

            acc = int(data.get("account_id", 0))
            ships = data.get("ships", [])
            # normalizza e filtra navi con almeno qualche battaglia
            clean = []
            for s in ships:
                try:
                    b = int(s.get("battles", 0))
                    if b <= 0:
                        continue
                    clean.append({
                        "ship_id": int(s["ship_id"]),
                        "battles": b,
                        "wins": int(s.get("wins", 0)),
                        "damage": float(s.get("damage", 0)),
                        "frags": float(s.get("frags", 0)),
                    })
                except Exception:
                    continue
            ok = db_index_ships(acc, clean) if acc and clean else False
            self.send_json({"status": "ok", "indexed": len(clean) if ok else 0,
                            "enabled": bool(DATABASE_URL)})
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
