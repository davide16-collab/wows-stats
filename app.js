"use strict";

/* ---------- multilingua ---------- */
/* Termini di gioco affermati (Win rate, Personal Rating, Random/Ranked/Co-op)
   restano in inglese in tutte le lingue, come fa la community WoWS. */
const I18N = {
  en: {
    locale: "en-GB",
    searchPlaceholder: "Search a player\u2026",
    searchBtn: "SEARCH",
    heroTitle1: "World of Warships", heroTitle2: "Statistics",
    heroSub: "Search a commander by nickname and analyse their rating, win rates and every ship.",
    heroPlaceholder: "e.g. PotatoSquad",
    results: "Results",
    searchingFor: n => `Searching for \u201c${n}\u201d\u2026`,
    noPlayer: n => `No player found for \u201c${n}\u201d.`,
    minChars: "Enter at least 3 characters.",
    loadingStats: n => `Loading statistics for ${n}\u2026`,
    errorPrefix: "Error: ",
    profileUnavailable: "Profile unavailable.",
    accountCreated: "Account created", lastBattle: "Last battle",
    serviceLevel: "Service level", id: "ID",
    hiddenProfile: "\u26a0 Hidden profile: detailed statistics unavailable.",
    battles: "Battles", winRate: "Win rate", avgDamage: "Avg. damage",
    avgFrags: "Avg. frags", survival: "Survival", avgXp: "Avg. XP",
    kd: "K/D", wins: "Wins",
    noBattlesIn: m => `No battles recorded in ${m}.`,
    shipsPlayed: n => `Ships played (${n})`,
    all: "All", ship: "Ship", tier: "Tier", type: "Type",
    shipsNoMode: "Per-ship statistics are not available for this mode via the API.",
    footer: 'Wows Stats \u2014 data via Wargaming Public API. Personal Rating &amp; expected values: <a href="https://wows-numbers.com/personal/rating/" target="_blank" rel="noopener">WoWS Numbers</a>.',
    types: { Destroyer: "Destroyer", Cruiser: "Cruiser", Battleship: "Battleship", AirCarrier: "Aircraft Carrier", Submarine: "Submarine" },
    prLabels: ["\u2014", "Bad", "Below average", "Average", "Good", "Very good", "Great", "Unicum", "Super unicum"],
  },
  it: {
    locale: "it-IT",
    searchPlaceholder: "Cerca un giocatore\u2026",
    searchBtn: "CERCA",
    heroTitle1: "World of Warships", heroTitle2: "Statistiche",
    heroSub: "Cerca un comandante per nickname e analizza il suo rating, le percentuali di vittoria e ogni nave.",
    heroPlaceholder: "es. PotatoSquad",
    results: "Risultati",
    searchingFor: n => `Ricerca di \u201c${n}\u201d\u2026`,
    noPlayer: n => `Nessun giocatore trovato per \u201c${n}\u201d.`,
    minChars: "Inserisci almeno 3 caratteri.",
    loadingStats: n => `Carico le statistiche di ${n}\u2026`,
    errorPrefix: "Errore: ",
    profileUnavailable: "Profilo non disponibile.",
    accountCreated: "Account creato", lastBattle: "Ultima battaglia",
    serviceLevel: "Service level", id: "ID",
    hiddenProfile: "\u26a0 Profilo nascosto: statistiche dettagliate non disponibili.",
    battles: "Battaglie", winRate: "Win rate", avgDamage: "Danno medio",
    avgFrags: "Frag medi", survival: "Sopravvivenza", avgXp: "XP media",
    kd: "K/D", wins: "Vittorie",
    noBattlesIn: m => `Nessuna battaglia registrata in ${m}.`,
    shipsPlayed: n => `Navi giocate (${n})`,
    all: "Tutti", ship: "Nave", tier: "Tier", type: "Tipo",
    shipsNoMode: "Le statistiche per nave non sono disponibili per questa modalit\u00e0 tramite l'API.",
    footer: 'Wows Stats \u2014 dati via Wargaming Public API. Personal Rating e valori attesi: <a href="https://wows-numbers.com/personal/rating/" target="_blank" rel="noopener">WoWS Numbers</a>.',
    types: { Destroyer: "Cacciatorpediniere", Cruiser: "Incrociatore", Battleship: "Corazzata", AirCarrier: "Portaerei", Submarine: "Sottomarino" },
    prLabels: ["\u2014", "Pessimo", "Sotto media", "Nella media", "Buono", "Molto buono", "Ottimo", "Unicum", "Super unicum"],
  },
  fr: {
    locale: "fr-FR",
    searchPlaceholder: "Rechercher un joueur\u2026",
    searchBtn: "CHERCHER",
    heroTitle1: "World of Warships", heroTitle2: "Statistiques",
    heroSub: "Recherchez un commandant par pseudo et analysez son rating, ses taux de victoire et chaque navire.",
    heroPlaceholder: "ex. PotatoSquad",
    results: "R\u00e9sultats",
    searchingFor: n => `Recherche de \u201c${n}\u201d\u2026`,
    noPlayer: n => `Aucun joueur trouv\u00e9 pour \u201c${n}\u201d.`,
    minChars: "Saisissez au moins 3 caract\u00e8res.",
    loadingStats: n => `Chargement des statistiques de ${n}\u2026`,
    errorPrefix: "Erreur\u00a0: ",
    profileUnavailable: "Profil indisponible.",
    accountCreated: "Compte cr\u00e9\u00e9 le", lastBattle: "Derni\u00e8re bataille",
    serviceLevel: "Service level", id: "ID",
    hiddenProfile: "\u26a0 Profil masqu\u00e9 : statistiques d\u00e9taill\u00e9es indisponibles.",
    battles: "Batailles", winRate: "Win rate", avgDamage: "D\u00e9g\u00e2ts moyens",
    avgFrags: "Frags moyens", survival: "Survie", avgXp: "XP moyenne",
    kd: "K/D", wins: "Victoires",
    noBattlesIn: m => `Aucune bataille enregistr\u00e9e en ${m}.`,
    shipsPlayed: n => `Navires jou\u00e9s (${n})`,
    all: "Tous", ship: "Navire", tier: "Tier", type: "Type",
    shipsNoMode: "Les statistiques par navire ne sont pas disponibles pour ce mode via l'API.",
    footer: 'Wows Stats \u2014 donn\u00e9es via Wargaming Public API. Personal Rating et valeurs attendues : <a href="https://wows-numbers.com/personal/rating/" target="_blank" rel="noopener">WoWS Numbers</a>.',
    types: { Destroyer: "Destroyer", Cruiser: "Croiseur", Battleship: "Cuirass\u00e9", AirCarrier: "Porte-avions", Submarine: "Sous-marin" },
    prLabels: ["\u2014", "Mauvais", "Sous la moyenne", "Moyen", "Bon", "Tr\u00e8s bon", "Excellent", "Unicum", "Super unicum"],
  },
  de: {
    locale: "de-DE",
    searchPlaceholder: "Spieler suchen\u2026",
    searchBtn: "SUCHEN",
    heroTitle1: "World of Warships", heroTitle2: "Statistiken",
    heroSub: "Suche einen Kommandanten per Nickname und analysiere Rating, Siegrate und jedes Schiff.",
    heroPlaceholder: "z.\u00a0B. PotatoSquad",
    results: "Ergebnisse",
    searchingFor: n => `Suche nach \u201e${n}\u201c\u2026`,
    noPlayer: n => `Kein Spieler gefunden f\u00fcr \u201e${n}\u201c.`,
    minChars: "Gib mindestens 3 Zeichen ein.",
    loadingStats: n => `Lade Statistiken von ${n}\u2026`,
    errorPrefix: "Fehler: ",
    profileUnavailable: "Profil nicht verf\u00fcgbar.",
    accountCreated: "Konto erstellt", lastBattle: "Letzte Schlacht",
    serviceLevel: "Service level", id: "ID",
    hiddenProfile: "\u26a0 Verstecktes Profil: detaillierte Statistiken nicht verf\u00fcgbar.",
    battles: "Gefechte", winRate: "Win rate", avgDamage: "\u00d8 Schaden",
    avgFrags: "\u00d8 Frags", survival: "\u00dcberleben", avgXp: "\u00d8 EP",
    kd: "K/D", wins: "Siege",
    noBattlesIn: m => `Keine Gefechte in ${m} verzeichnet.`,
    shipsPlayed: n => `Gespielte Schiffe (${n})`,
    all: "Alle", ship: "Schiff", tier: "Tier", type: "Typ",
    shipsNoMode: "Schiffsbezogene Statistiken sind f\u00fcr diesen Modus \u00fcber die API nicht verf\u00fcgbar.",
    footer: 'Wows Stats \u2014 Daten via Wargaming Public API. Personal Rating &amp; erwartete Werte: <a href="https://wows-numbers.com/personal/rating/" target="_blank" rel="noopener">WoWS Numbers</a>.',
    types: { Destroyer: "Zerst\u00f6rer", Cruiser: "Kreuzer", Battleship: "Schlachtschiff", AirCarrier: "Flugzeugtr\u00e4ger", Submarine: "U-Boot" },
    prLabels: ["\u2014", "Schlecht", "Unterdurchschnittlich", "Durchschnittlich", "Gut", "Sehr gut", "Hervorragend", "Unicum", "Super-Unicum"],
  },
  es: {
    locale: "es-ES",
    searchPlaceholder: "Buscar un jugador\u2026",
    searchBtn: "BUSCAR",
    heroTitle1: "World of Warships", heroTitle2: "Estad\u00edsticas",
    heroSub: "Busca un comandante por nombre y analiza su rating, porcentajes de victoria y cada barco.",
    heroPlaceholder: "p.\u00a0ej. PotatoSquad",
    results: "Resultados",
    searchingFor: n => `Buscando \u201c${n}\u201d\u2026`,
    noPlayer: n => `Ning\u00fan jugador encontrado para \u201c${n}\u201d.`,
    minChars: "Introduce al menos 3 caracteres.",
    loadingStats: n => `Cargando estad\u00edsticas de ${n}\u2026`,
    errorPrefix: "Error: ",
    profileUnavailable: "Perfil no disponible.",
    accountCreated: "Cuenta creada", lastBattle: "\u00daltima batalla",
    serviceLevel: "Service level", id: "ID",
    hiddenProfile: "\u26a0 Perfil oculto: estad\u00edsticas detalladas no disponibles.",
    battles: "Batallas", winRate: "Win rate", avgDamage: "Da\u00f1o medio",
    avgFrags: "Frags medios", survival: "Supervivencia", avgXp: "XP media",
    kd: "K/D", wins: "Victorias",
    noBattlesIn: m => `Sin batallas registradas en ${m}.`,
    shipsPlayed: n => `Barcos jugados (${n})`,
    all: "Todos", ship: "Barco", tier: "Tier", type: "Tipo",
    shipsNoMode: "Las estad\u00edsticas por barco no est\u00e1n disponibles para este modo v\u00eda API.",
    footer: 'Wows Stats \u2014 datos via Wargaming Public API. Personal Rating y valores esperados: <a href="https://wows-numbers.com/personal/rating/" target="_blank" rel="noopener">WoWS Numbers</a>.',
    types: { Destroyer: "Destructor", Cruiser: "Crucero", Battleship: "Acorazado", AirCarrier: "Portaaviones", Submarine: "Submarino" },
    prLabels: ["\u2014", "Malo", "Bajo la media", "Medio", "Bueno", "Muy bueno", "Excelente", "Unicum", "S\u00faper unicum"],
  },
};

let LANG = (localStorage_getLang());
function localStorage_getLang() {
  try { const v = window.localStorage.getItem("wowsstats_lang"); if (v && I18N[v]) return v; } catch (_) {}
  // prova la lingua del browser, altrimenti inglese
  const nav = (navigator.language || "en").slice(0, 2);
  return I18N[nav] ? nav : "en";
}
function setLang(l) {
  if (!I18N[l]) return;
  LANG = l;
  try { window.localStorage.setItem("wowsstats_lang", l); } catch (_) {}
}
function t(key, ...args) {
  const dict = I18N[LANG] || I18N.en;
  let v = dict[key];
  if (v == null) v = (I18N.en[key]);
  return typeof v === "function" ? v(...args) : v;
}

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };
const fmt = (n, d = 0) => (n == null || isNaN(n)) ? "\u2014" :
  Number(n).toLocaleString((I18N[LANG] || I18N.en).locale, { minimumFractionDigits: d, maximumFractionDigits: d });
const dateFromTs = ts => ts ? new Date(ts * 1000).toLocaleDateString((I18N[LANG] || I18N.en).locale,
  { day: "2-digit", month: "short", year: "numeric" }) : "\u2014";

let REALM = "eu";

/* ---------- chiamate API (via proxy locale) ---------- */
async function wg(endpoint, params = {}) {
  const q = new URLSearchParams({ ...params, realm: REALM });
  const r = await fetch(`/api/wg/${endpoint}?${q}`);
  const j = await r.json();
  if (j.status !== "ok") {
    throw new Error((j.error && j.error.message) || "Errore API");
  }
  return j.data;
}
async function getShipsMeta() {
  try {
    const r = await fetch(`/api/ships_meta?realm=${REALM}`);
    const j = await r.json();
    return j.data || {};
  } catch (_) { return {}; }
}
async function getExpected() {
  // I valori attesi servono solo per il Personal Rating. Se la fonte non
  // risponde, il sito deve funzionare comunque: torniamo un oggetto vuoto.
  try {
    const r = await fetch(`/api/expected`);
    if (!r.ok) return {};
    const j = await r.json();
    return j.data || {};
  } catch (_) { return {}; }
}

/* cache dati statici per sessione */
let _shipsMeta = null, _expected = null;
async function loadStatic() {
  if (!_shipsMeta) _shipsMeta = await getShipsMeta();
  if (!_expected) _expected = await getExpected();
}

/* ---------- modalità di gioco ---------- */
/* key = nome del campo che usiamo internamente; label = etichetta del tab.
   Random arriva da account/info; Ranked viene aggregato da seasons/accountinfo. */
const MODES = [
  { key: "pvp", label: "Random" },
  { key: "rank_solo", label: "Ranked" },
];

/* ---------- scale colori ---------- */
/* terzo valore = indice nell'array prLabels (tradotto per lingua) */
const PR_SCALE = [
  [0, "#a0a0a0", 0],
  [1, "#fe0e00", 1],
  [750, "#fe7903", 2],
  [1100, "#ffc71f", 3],
  [1350, "#44b300", 4],
  [1550, "#318000", 5],
  [1750, "#02c9b3", 6],
  [2100, "#d042f3", 7],
  [2450, "#a00dc5", 8],
];
function prColor(pr) {
  let c = PR_SCALE[0];
  for (const row of PR_SCALE) if (pr >= row[0]) c = row;
  const labels = t("prLabels");
  return { color: c[1], label: labels[c[2]] || "" };
}
const WR_SCALE = [
  [0, "#a0a0a0"], [0.001, "#fe0e00"], [47, "#fe7903"], [50, "#ffc71f"],
  [52, "#44b300"], [54, "#318000"], [56, "#02c9b3"], [60, "#d042f3"], [65, "#a00dc5"],
];
function wrColor(wr) {
  let c = WR_SCALE[0][1];
  for (const row of WR_SCALE) if (wr >= row[0]) c = row[1];
  return c;
}

/* ---------- Personal Rating ---------- */
/* Formula standard (Wahzehd / wows-numbers).                              */
function computePR(shipStats) {
  let aDmg = 0, aFrags = 0, aWins = 0;       // valori reali (somme)
  let eDmg = 0, eFrags = 0, eWins = 0;       // valori attesi (pesati per battaglie)
  for (const s of shipStats) {
    const pvp = s.pvp; if (!pvp || !pvp.battles) continue;
    const exp = _expected[String(s.ship_id)];
    if (!exp || !exp.average_damage_dealt) continue;
    const b = pvp.battles;
    aDmg += pvp.damage_dealt;
    aFrags += pvp.frags;
    aWins += pvp.wins * 100;                  // in scala percentuale
    eDmg += exp.average_damage_dealt * b;
    eFrags += exp.average_frags * b;
    eWins += exp.win_rate * b;                // win_rate è già in %
  }
  if (eDmg === 0) return null;
  const rDmg = aDmg / eDmg, rFrags = aFrags / eFrags, rWins = aWins / eWins;
  const nDmg = Math.max(0, (rDmg - 0.4) / 0.6);
  const nFrags = Math.max(0, (rFrags - 0.1) / 0.9);
  const nWins = Math.max(0, (rWins - 0.7) / 0.3);
  return 700 * nDmg + 300 * nFrags + 150 * nWins;
}
/* PR di una singola nave */
function shipPR(s) {
  const pvp = s.pvp; if (!pvp || !pvp.battles) return null;
  const exp = _expected[String(s.ship_id)];
  if (!exp || !exp.average_damage_dealt) return null;
  const rDmg = (pvp.damage_dealt / pvp.battles) / exp.average_damage_dealt;
  const rFrags = (pvp.frags / pvp.battles) / exp.average_frags;
  const rWins = (pvp.wins / pvp.battles * 100) / exp.win_rate;
  const nDmg = Math.max(0, (rDmg - 0.4) / 0.6);
  const nFrags = Math.max(0, (rFrags - 0.1) / 0.9);
  const nWins = Math.max(0, (rWins - 0.7) / 0.3);
  return 700 * nDmg + 300 * nFrags + 150 * nWins;
}

/* ---------- viste ---------- */
const els = {
  hero: $("#hero"), results: $("#results"), resultsList: $("#resultsList"),
  profile: $("#profile"), status: $("#status"),
};
function showStatus(html, isError = false) {
  els.status.innerHTML = html;
  els.status.className = "status" + (isError ? " error" : "");
}
function hide(...nodes) { nodes.forEach(n => n.classList.add("hidden")); }
function show(...nodes) { nodes.forEach(n => n.classList.remove("hidden")); }

function goHome() {
  hide(els.results, els.profile, els.status);
  show(els.hero);
  $("#searchInput").value = "";
  history.replaceState(null, "", location.pathname);
}

/* ---------- ricerca ---------- */
async function search(name) {
  name = (name || "").trim();
  if (name.length < 3) { showStatus(t("minChars"), true); show(els.status); hide(els.hero, els.results, els.profile); return; }
  hide(els.hero, els.results, els.profile);
  show(els.status);
  showStatus(`<div class="spinner"></div>${t("searchingFor", name)}`);
  try {
    const list = await wg("account/list", { search: name, limit: 10 });
    if (!list || !list.length) { showStatus(t("noPlayer", name), true); return; }
    if (list.length === 1) { hide(els.status); return loadPlayer(list[0].account_id, list[0].nickname); }
    // più risultati: mostra lista
    hide(els.status);
    els.resultsList.innerHTML = "";
    list.forEach(p => {
      const li = el("li");
      li.innerHTML = `<span class="nick">${p.nickname}</span><span class="id">${t("id")} ${p.account_id}</span>`;
      li.onclick = () => loadPlayer(p.account_id, p.nickname);
      els.resultsList.appendChild(li);
    });
    show(els.results);
  } catch (e) {
    showStatus(t("errorPrefix") + e.message, true); show(els.status);
  }
}

/* ---------- caricamento giocatore ---------- */
async function loadPlayer(accountId, nick) {
  hide(els.hero, els.results, els.profile);
  show(els.status);
  showStatus(`<div class="spinner"></div>${t("loadingStats", nick || accountId)}`);
  try {
    await loadStatic();
    // Chiedo l'oggetto 'statistics' completo: così l'API restituisce solo le
    // modalità che esistono per quel giocatore, senza errori INVALID_FIELDS.
    const info = await wg("account/info", {
      account_id: accountId,
      fields: "nickname,account_id,created_at,last_battle_time,hidden_profile,leveling_tier,statistics",
    });
    const player = info[String(accountId)];
    if (!player) throw new Error(t("profileUnavailable"));

    // Ranked: l'endpoint seasons/accountinfo contiene le stagioni; sommiamo
    // tutte le stagioni (solo rank_solo) in un unico totale e lo aggiungiamo
    // a statistics come 'rank_solo', così i tab lo trovano automaticamente.
    try {
      if (!player.hidden_profile) {
        const sea = await wg("seasons/accountinfo", { account_id: accountId });
        const node = sea[String(accountId)];
        const seasons = node && node.seasons;
        if (seasons) {
          const tot = { battles: 0, wins: 0, damage_dealt: 0, frags: 0, survived_battles: 0, xp: 0 };
          for (const sid in seasons) {
            const variants = seasons[sid];
            for (const v in variants) {
              const rs = variants[v] && variants[v].rank_solo;
              if (rs && rs.battles) {
                tot.battles += rs.battles; tot.wins += rs.wins;
                tot.damage_dealt += rs.damage_dealt; tot.frags += rs.frags;
                tot.survived_battles += rs.survived_battles; tot.xp += rs.xp;
              }
            }
          }
          if (tot.battles > 0) {
            player.statistics = player.statistics || {};
            player.statistics.rank_solo = tot;
          }
        }
      }
    } catch (_) { /* ranked opzionale */ }

    // clan
    let clanTag = null;
    try {
      const ca = await wg("clans/accountinfo", { account_id: accountId, fields: "clan_id" });
      const cid = ca[String(accountId)] && ca[String(accountId)].clan_id;
      if (cid) {
        const ci = await wg("clans/info", { clan_id: cid, fields: "tag" });
        clanTag = ci[String(cid)] && ci[String(cid)].tag;
      }
    } catch (_) { /* clan opzionale */ }

    let ships = [];
    if (!player.hidden_profile) {
      // Navi in Random (ships/stats dà solo pvp per nave).
      try {
        const ss = await wg("ships/stats", { account_id: accountId, fields: "ship_id,last_battle_time,pvp" });
        ships = (ss[String(accountId)] || []);
      } catch (_) { ships = []; }

      // Navi in Ranked: seasons/shipstats dà le stagioni per nave.
      // Aggrego le stagioni (rank_solo) di ogni nave e le fondo nell'elenco
      // come blocco 'rank_solo', così la tabella Ranked si popola.
      try {
        const rss = await wg("seasons/shipstats", { account_id: accountId });
        const arr = rss[String(accountId)] || [];
        const byId = {};
        for (const sh of ships) byId[String(sh.ship_id)] = sh;
        for (const sh of arr) {
          const seasons = sh.seasons || {};
          const tot = { battles: 0, wins: 0, damage_dealt: 0, frags: 0, survived_battles: 0, xp: 0 };
          for (const sid in seasons) {
            for (const v in seasons[sid]) {
              const rs = seasons[sid][v] && seasons[sid][v].rank_solo;
              if (rs && rs.battles) {
                tot.battles += rs.battles; tot.wins += rs.wins;
                tot.damage_dealt += rs.damage_dealt; tot.frags += rs.frags;
                tot.survived_battles += rs.survived_battles || 0; tot.xp += rs.xp || 0;
              }
            }
          }
          if (tot.battles > 0) {
            let target = byId[String(sh.ship_id)];
            if (!target) { target = { ship_id: sh.ship_id }; ships.push(target); byId[String(sh.ship_id)] = target; }
            target.rank_solo = tot;
          }
        }
      } catch (_) { /* navi ranked opzionali */ }
    }
    hide(els.status);
    renderProfile(player, clanTag, ships);
  } catch (e) {
    showStatus(t("errorPrefix") + e.message, true); show(els.status);
  }
}

/* ---------- rendering profilo ---------- */
let _ships = [], _sortKey = "battles", _sortDir = -1, _tierFilter = 0;
let _player = null, _clanTag = null, _allShips = [], _activeMode = "pvp", _availModes = [];

function modeStats(obj, key) {
  return (obj && obj.statistics && obj.statistics[key]) || (obj && obj[key]) || null;
}

function renderProfile(player, clanTag, ships) {
  _player = player; _clanTag = clanTag; _allShips = ships;

  // quali modalità hanno almeno una battaglia (a livello account)
  _availModes = MODES.filter(m => {
    const s = modeStats(player, m.key);
    return s && s.battles > 0;
  });
  if (!_availModes.length) _availModes = [MODES[0]]; // almeno Random
  // Random ('pvp') è sempre la modalità iniziale se presente; altrimenti la prima.
  _activeMode = _availModes.some(m => m.key === "pvp") ? "pvp" : _availModes[0].key;

  // PR complessivo: sempre calcolato su Random (standard wows-numbers)
  const overallPR = ships.length ? computePR(ships) : null;
  const prc = prColor(overallPR || 0);

  let html = `
  <div class="pcard">
    <div class="pr-badge" style="color:${prc.color}">
      <div class="pr-val">${overallPR != null ? fmt(overallPR) : "—"}</div>
      <div class="pr-lab">PERSONAL RATING</div>
      <div class="pr-rank">${overallPR != null ? prc.label : ""}</div>
    </div>
    <div class="pinfo">
      <div class="pnick">${player.nickname}${clanTag ? `<span class="clan-tag">[${clanTag}]</span>` : ""}</div>
      <div class="pmeta">
        <span>${t("accountCreated")} <b>${dateFromTs(player.created_at)}</b></span>
        <span>${t("lastBattle")} <b>${dateFromTs(player.last_battle_time)}</b></span>
        <span>${t("serviceLevel")} <b>${player.leveling_tier ?? "—"}</b></span>
        <span>${t("id")} <b>${player.account_id}</b></span>
      </div>
      ${player.hidden_profile ? `<div class="hidden-note">${t("hiddenProfile")}</div>` : ""}
    </div>
  </div>`;

  // barra dei tab modalità (sempre visibile, anche con una sola modalità)
  if (_availModes.length >= 1) {
    html += `<div class="mode-tabs" id="modeTabs">
      ${_availModes.map((m) =>
        `<button data-mode="${m.key}" class="${m.key === _activeMode ? "on" : ""}">${m.label}</button>`).join("")}
    </div>`;
  }

  // contenitore che verrà riempito in base alla modalità attiva
  html += `<div id="modeContent"></div>`;

  els.profile.innerHTML = html;
  show(els.profile);

  bindModeTabs();
  drawMode();  // disegna la modalità attiva (stat + tabella navi)
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindModeTabs() {
  const bar = document.getElementById("modeTabs");
  if (!bar) return;
  bar.addEventListener("click", e => {
    const btn = e.target.closest("button"); if (!btn) return;
    _activeMode = btn.dataset.mode;
    [...bar.children].forEach(b => b.classList.toggle("on", b === btn));
    drawMode();
  });
}

/* disegna stat-grid + tabella navi per la modalità attiva */
function drawMode() {
  const key = _activeMode;
  const pvp = modeStats(_player, key) || {};
  const b = pvp.battles || 0;
  const wr = b ? pvp.wins / b * 100 : 0;
  const deaths = b - (pvp.survived_battles || 0);
  const modeLabel = (MODES.find(m => m.key === key) || {}).label || "";

  const stat = (k, v, sub = "") =>
    `<div class="stat"><div class="k">${k}</div><div class="v">${v}${sub ? `<small>${sub}</small>` : ""}</div></div>`;

  let html = "";
  if (b) {
    html += `<div class="stat-grid">
      ${stat(t("battles"), fmt(b))}
      <div class="stat"><div class="k">${t("winRate")}</div><div class="v" style="color:${wrColor(wr)}">${fmt(wr, 2)}<small>%</small></div></div>
      ${stat(t("avgDamage"), fmt(pvp.damage_dealt / b))}
      ${stat(t("avgFrags"), fmt(pvp.frags / b, 2))}
      ${stat(t("survival"), fmt(pvp.survived_battles / b * 100, 1), "%")}
      ${stat(t("avgXp"), fmt(pvp.xp / b))}
      ${stat(t("kd"), fmt(deaths ? pvp.frags / deaths : pvp.frags, 2))}
      ${stat(t("wins"), fmt(pvp.wins || 0))}
    </div>`;
  } else {
    html += `<div class="empty-mode">${t("noBattlesIn", modeLabel)}</div>`;
  }

  // navi giocate in questa modalità
  const modeShips = _allShips.filter(s => { const ms = s[key]; return ms && ms.battles; });
  if (modeShips.length) {
    const tiers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    html += `<section class="ships">
      <div class="ships-head">
        <h2>${t("shipsPlayed", modeShips.length)}</h2>
        <div class="tier-filter" id="tierFilter">
          <button data-t="0" class="on">${t("all")}</button>
          ${tiers.slice(1).map(tr => `<button data-t="${tr}">${roman(tr)}</button>`).join("")}
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr>
          <th class="left" data-k="name">${t("ship")}</th>
          <th data-k="tier">${t("tier")}</th>
          <th class="left" data-k="type">${t("type")}</th>
          <th data-k="battles" class="sorted">${t("battles")}</th>
          <th data-k="wr">WR%</th>
          <th data-k="dmg">${t("avgDamage")}</th>
          <th data-k="frags">${t("avgFrags")}</th>
          <th data-k="pr">PR</th>
        </tr></thead>
        <tbody id="shipBody"></tbody>
      </table></div>
    </section>`;
  } else if (b > 0 && key !== "pvp") {
    html += `<div class="empty-mode" style="margin-top:24px">${t("shipsNoMode")}</div>`;
  }

  document.getElementById("modeContent").innerHTML = html;

  if (modeShips.length) {
    _ships = modeShips.map(s => enrichShip(s, key));
    _sortKey = "battles"; _sortDir = -1; _tierFilter = 0;
    bindTable();
    drawShips();
  }
}

function enrichShip(s, key = "pvp") {
  const meta = _shipsMeta[String(s.ship_id)] || {};
  const ms = s[key] || {};
  // i valori attesi del PR esistono solo per Random: PR per nave solo in 'pvp'
  const pr = key === "pvp" ? shipPR(s) : null;
  return {
    raw: s, ship_id: s.ship_id,
    name: meta.name || `#${s.ship_id}`,
    tier: meta.tier || 0,
    type: prettyType(meta.type),
    nation: meta.nation || "",
    premium: !!meta.is_premium || !!meta.is_special,
    battles: ms.battles,
    wr: ms.wins / ms.battles * 100,
    dmg: ms.damage_dealt / ms.battles,
    frags: ms.frags / ms.battles,
    pr,
  };
}
function prettyType(x) { return x || ""; }
function roman(n) { return ["—", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "★"][n] || n; }

function bindTable() {
  $("#tierFilter").addEventListener("click", e => {
    const btn = e.target.closest("button"); if (!btn) return;
    _tierFilter = +btn.dataset.t;
    [...$("#tierFilter").children].forEach(b => b.classList.toggle("on", b === btn));
    drawShips();
  });
  document.querySelectorAll("thead th").forEach(th => {
    th.onclick = () => {
      const k = th.dataset.k;
      if (_sortKey === k) _sortDir *= -1;
      else { _sortKey = k; _sortDir = (k === "name" || k === "type") ? 1 : -1; }
      document.querySelectorAll("thead th").forEach(t => t.classList.toggle("sorted", t.dataset.k === _sortKey));
      drawShips();
    };
  });
}

function drawShips() {
  let rows = _ships.slice();
  if (_tierFilter) rows = rows.filter(s => s.tier === _tierFilter);
  rows.sort((a, b) => {
    let x = a[_sortKey], y = b[_sortKey];
    if (typeof x === "string") { x = x.toLowerCase(); y = (y || "").toLowerCase(); return x < y ? -_sortDir : x > y ? _sortDir : 0; }
    x = x == null ? -1 : x; y = y == null ? -1 : y;
    return (x - y) * _sortDir;
  });
  const body = $("#shipBody");
  body.innerHTML = rows.map(s => {
    const prc = prColor(s.pr || 0);
    return `<tr>
      <td class="left"><span class="ship-name ${s.premium ? "prem" : ""}">${s.name}</span>
        ${s.nation ? `<span class="ship-sub">${s.nation}</span>` : ""}</td>
      <td><span class="tier-tag">${roman(s.tier)}</span></td>
      <td class="left"><span class="type-tag">${(t("types")[s.type]) || s.type || "—"}</span></td>
      <td>${fmt(s.battles)}</td>
      <td class="wr-cell" style="color:${wrColor(s.wr)}">${fmt(s.wr, 1)}</td>
      <td>${fmt(s.dmg)}</td>
      <td>${fmt(s.frags, 2)}</td>
      <td class="pr-cell" style="color:${prc.color}">${s.pr != null ? fmt(s.pr) : "—"}</td>
    </tr>`;
  }).join("");
}

/* ---------- eventi ---------- */
$("#searchForm").addEventListener("submit", e => {
  e.preventDefault(); REALM = $("#realmSelect").value; search($("#searchInput").value);
});
$("#heroForm").addEventListener("submit", e => {
  e.preventDefault(); REALM = $("#realmSelect").value;
  $("#searchInput").value = $("#heroInput").value;
  search($("#heroInput").value);
});
$("#homeBtn").addEventListener("click", goHome);

/* applica le stringhe statiche dell'interfaccia nella lingua corrente */
function applyStaticI18n() {
  const set = (sel, val, attr) => {
    const node = $(sel); if (!node) return;
    if (attr) node.setAttribute(attr, val); else node.innerHTML = val;
  };
  set("#searchInput", t("searchPlaceholder"), "placeholder");
  set("#heroInput", t("heroPlaceholder"), "placeholder");
  set("#searchBtn", t("searchBtn"));
  const heroH1 = $("#heroTitle");
  if (heroH1) {
    const wows = '<span class="amber">World&nbsp;of&nbsp;Warships</span>';
    // in EN il nome del gioco va prima ("WoWS Statistics"); nelle altre lingue dopo.
    heroH1.innerHTML = (LANG === "en")
      ? `${wows} ${t("heroTitle2")}`
      : `${t("heroTitle2")} ${wows}`;
  }
  set("#heroSub", t("heroSub"));
  const heroBtn = $("#heroForm button"); if (heroBtn) heroBtn.textContent = t("searchBtn");
  const resTitle = $("#results h2"); if (resTitle) resTitle.textContent = t("results");
  const footText = $("#footText"); if (footText) footText.innerHTML = t("footer");
  document.documentElement.lang = LANG;
}

/* ---------- init ---------- */
(async () => {
  // selettore lingua
  const langSel = $("#langSelect");
  if (langSel) {
    langSel.value = LANG;
    langSel.addEventListener("change", () => {
      setLang(langSel.value);
      applyStaticI18n();
      // se c'è un profilo aperto, ridisegnalo nella nuova lingua
      if (_player && !els.profile.classList.contains("hidden")) {
        renderProfile(_player, _clanTag, _allShips);
      }
    });
  }
  applyStaticI18n();

  try {
    const cfg = await (await fetch("/api/config")).json();
    REALM = cfg.realm || "eu";
    $("#realmSelect").value = REALM;
    $("#heroFoot").textContent = `Server: ${REALM.toUpperCase()} · App ID …${cfg.app_id_tail}`;
    $("#footMeta").textContent = `realm ${REALM.toUpperCase()}`;
  } catch (_) {}
})();
