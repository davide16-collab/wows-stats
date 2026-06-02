"use strict";

/* Mostra/nasconde il Personal Rating (badge profilo + colonna navi).
   Metti true per riattivarlo: il codice di calcolo resta tutto qui sotto. */
const SHOW_PR = true;

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
    premiumOnly: "Premium only", searchShip: "Search ship…", noMatch: "No ships match these filters.",
    analysis: "Breakdown", byClass: "By class", byTier: "By tier", byNation: "By nation", shipsCount: "Ships", nation: "Nation", nextUp: "Next tier", maxTier: "Top tier reached",
    shipsNoMode: "Per-ship statistics are not available for this mode via the API.",
    footer: 'Wows Stats \u2014 data via the Wargaming Public API.',
    types: { Destroyer: "Destroyer", Cruiser: "Cruiser", Battleship: "Battleship", AirCarrier: "Aircraft Carrier", Submarine: "Submarine" },
    prLabels: ["\u2014", "Bad", "Below average", "Average", "Good", "Very good", "Great", "Unicum", "Super unicum"],
    sinceLast: "Since your last visit", ago: d => d===0?"today":(d===1?"1 day ago":d+" days ago"), sessionWR: "Session WR", newBattles: "new battles", firstVisit: "First time you look up this player \u2014 progress will show from your next visit.",
    compareTitle: "Compare two players", compareBtn: "COMPARE", vs: "VS", compareP1: "Player 1", compareP2: "Player 2", compareGo: "Compare", compareShip: "Compare a ship", compareNoCommon: "No ships in common between these two players.", backToSearch: "\u2190 Back to search", winner: "better",
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
    premiumOnly: "Solo premium", searchShip: "Cerca nave…", noMatch: "Nessuna nave corrisponde ai filtri.",
    analysis: "Analisi", byClass: "Per classe", byTier: "Per tier", byNation: "Per nazione", shipsCount: "Navi", nation: "Nazione", nextUp: "Prossima categoria", maxTier: "Categoria massima",
    shipsNoMode: "Le statistiche per nave non sono disponibili per questa modalit\u00e0 tramite l'API.",
    footer: 'Wows Stats \u2014 dati via Wargaming Public API.',
    types: { Destroyer: "Cacciatorpediniere", Cruiser: "Incrociatore", Battleship: "Corazzata", AirCarrier: "Portaerei", Submarine: "Sottomarino" },
    prLabels: ["\u2014", "Pessimo", "Sotto media", "Nella media", "Buono", "Molto buono", "Ottimo", "Unicum", "Super unicum"],
    sinceLast: "Dalla tua ultima visita", ago: d => d===0?"oggi":(d===1?"1 giorno fa":d+" giorni fa"), sessionWR: "WR di sessione", newBattles: "nuove battaglie", firstVisit: "Prima volta che cerchi questo giocatore \u2014 il progresso apparir\u00e0 dalla prossima visita.",
    compareTitle: "Confronta due giocatori", compareBtn: "CONFRONTA", vs: "VS", compareP1: "Giocatore 1", compareP2: "Giocatore 2", compareGo: "Confronta", compareShip: "Confronta una nave", compareNoCommon: "Nessuna nave in comune tra questi due giocatori.", backToSearch: "\u2190 Torna alla ricerca", winner: "meglio",
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
    premiumOnly: "Premium uniquement", searchShip: "Rechercher un navire…", noMatch: "Aucun navire ne correspond aux filtres.",
    analysis: "Analyse", byClass: "Par classe", byTier: "Par tier", byNation: "Par nation", shipsCount: "Navires", nation: "Nation", nextUp: "Catégorie suivante", maxTier: "Catégorie maximale",
    shipsNoMode: "Les statistiques par navire ne sont pas disponibles pour ce mode via l'API.",
    footer: 'Wows Stats \u2014 donn\u00e9es via Wargaming Public API.',
    types: { Destroyer: "Destroyer", Cruiser: "Croiseur", Battleship: "Cuirass\u00e9", AirCarrier: "Porte-avions", Submarine: "Sous-marin" },
    prLabels: ["\u2014", "Mauvais", "Sous la moyenne", "Moyen", "Bon", "Tr\u00e8s bon", "Excellent", "Unicum", "Super unicum"],
    sinceLast: "Depuis votre derni\u00e8re visite", ago: d => d===0?"aujourd\u0027hui":(d===1?"il y a 1 jour":"il y a "+d+" jours"), sessionWR: "WR de session", newBattles: "nouvelles batailles", firstVisit: "Premi\u00e8re fois que vous consultez ce joueur \u2014 la progression appara\u00eetra d\u00e8s votre prochaine visite.",
    compareTitle: "Comparer deux joueurs", compareBtn: "COMPARER", vs: "VS", compareP1: "Joueur 1", compareP2: "Joueur 2", compareGo: "Comparer", compareShip: "Comparer un navire", compareNoCommon: "Aucun navire en commun entre ces deux joueurs.", backToSearch: "\u2190 Retour \u00e0 la recherche", winner: "meilleur",
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
    premiumOnly: "Nur Premium", searchShip: "Schiff suchen…", noMatch: "Keine Schiffe entsprechen den Filtern.",
    analysis: "Analyse", byClass: "Nach Klasse", byTier: "Nach Tier", byNation: "Nach Nation", shipsCount: "Schiffe", nation: "Nation", nextUp: "Nächste Stufe", maxTier: "Höchste Stufe",
    shipsNoMode: "Schiffsbezogene Statistiken sind f\u00fcr diesen Modus \u00fcber die API nicht verf\u00fcgbar.",
    footer: 'Wows Stats \u2014 Daten via Wargaming Public API.',
    types: { Destroyer: "Zerst\u00f6rer", Cruiser: "Kreuzer", Battleship: "Schlachtschiff", AirCarrier: "Flugzeugtr\u00e4ger", Submarine: "U-Boot" },
    prLabels: ["\u2014", "Schlecht", "Unterdurchschnittlich", "Durchschnittlich", "Gut", "Sehr gut", "Hervorragend", "Unicum", "Super-Unicum"],
    sinceLast: "Seit deinem letzten Besuch", ago: d => d===0?"heute":(d===1?"vor 1 Tag":"vor "+d+" Tagen"), sessionWR: "Sitzungs-WR", newBattles: "neue Gefechte", firstVisit: "Erstes Mal, dass du diesen Spieler ansiehst \u2014 Fortschritt erscheint ab deinem n\u00e4chsten Besuch.",
    compareTitle: "Zwei Spieler vergleichen", compareBtn: "VERGLEICHEN", vs: "VS", compareP1: "Spieler 1", compareP2: "Spieler 2", compareGo: "Vergleichen", compareShip: "Schiff vergleichen", compareNoCommon: "Keine gemeinsamen Schiffe zwischen diesen beiden Spielern.", backToSearch: "\u2190 Zur\u00fcck zur Suche", winner: "besser",
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
    premiumOnly: "Solo premium", searchShip: "Buscar barco…", noMatch: "Ningún barco coincide con los filtros.",
    analysis: "Análisis", byClass: "Por clase", byTier: "Por tier", byNation: "Por nación", shipsCount: "Barcos", nation: "Nación", nextUp: "Categoría siguiente", maxTier: "Categoría máxima",
    shipsNoMode: "Las estad\u00edsticas por barco no est\u00e1n disponibles para este modo v\u00eda API.",
    footer: 'Wows Stats \u2014 datos via Wargaming Public API.',
    types: { Destroyer: "Destructor", Cruiser: "Crucero", Battleship: "Acorazado", AirCarrier: "Portaaviones", Submarine: "Submarino" },
    prLabels: ["\u2014", "Malo", "Bajo la media", "Medio", "Bueno", "Muy bueno", "Excelente", "Unicum", "S\u00faper unicum"],
    sinceLast: "Desde tu \u00faltima visita", ago: d => d===0?"hoy":(d===1?"hace 1 d\u00eda":"hace "+d+" d\u00edas"), sessionWR: "WR de sesi\u00f3n", newBattles: "nuevas batallas", firstVisit: "Primera vez que consultas a este jugador \u2014 el progreso aparecer\u00e1 desde tu pr\u00f3xima visita.",
    compareTitle: "Comparar dos jugadores", compareBtn: "COMPARAR", vs: "VS", compareP1: "Jugador 1", compareP2: "Jugador 2", compareGo: "Comparar", compareShip: "Comparar un barco", compareNoCommon: "Ning\u00fan barco en com\u00fan entre estos dos jugadores.", backToSearch: "\u2190 Volver a la b\u00fasqueda", winner: "mejor",
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
  const KEY = "wowsstats_smeta2_" + REALM, TTL = 7 * 24 * 3600 * 1000;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); if (o && o.t && (Date.now() - o.t) < TTL && o.d) return o.d; }
  } catch (_) {}
  try {
    const r = await fetch(`/api/ships_meta?realm=${REALM}`);
    const j = await r.json();
    const data = j.data || {};
    try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: data })); } catch (_) {}
    return data;
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

/* ---------- scale colori (adattate per fondo chiaro) ---------- */
/* terzo valore = indice nell'array prLabels (tradotto per lingua) */
const PR_SCALE = [
  [0, "#86868b", 0],
  [1, "#d11500", 1],
  [750, "#d97000", 2],
  [1100, "#b8860b", 3],
  [1350, "#3a9400", 4],
  [1550, "#2e7d00", 5],
  [1750, "#009b8a", 6],
  [2100, "#b521d6", 7],
  [2450, "#8a0ba8", 8],
];
function prColor(pr) {
  let c = PR_SCALE[0];
  for (const row of PR_SCALE) if (pr >= row[0]) c = row;
  const labels = t("prLabels");
  return { color: c[1], label: labels[c[2]] || "" };
}
const WR_SCALE = [
  [0, "#86868b"], [0.001, "#d11500"], [47, "#d97000"], [50, "#b8860b"],
  [52, "#3a9400"], [54, "#2e7d00"], [56, "#009b8a"], [60, "#b521d6"], [65, "#8a0ba8"],
];
function wrColor(wr) {
  let c = WR_SCALE[0][1];
  for (const row of WR_SCALE) if (wr >= row[0]) c = row[1];
  return c;
}

/* ---------- Personal Rating ---------- */
/* Valori attesi "di riserva" per tier+classe, usati quando una nave non ha
   ancora medie dal database. Stime ragionevoli del danno medio per tier e
   tipo (crescono col tier; BB/CA più alti, DD/CV variabili). WR atteso 50%,
   frag attesi ~ scala col tier. Servono solo da rete di sicurezza: appena il
   database raccoglie abbastanza dati su una nave, quelli hanno la precedenza. */
const FALLBACK_DMG = {
  // tier:        1     2     3     4     5     6     7     8     9     10    11
  Battleship:  [0,8000,12000,18000,26000,34000,44000,55000,68000,82000,95000,100000],
  Cruiser:     [0,6000,10000,15000,22000,30000,38000,47000,58000,70000,82000,88000],
  Destroyer:   [0,5000, 8000,12000,17000,23000,30000,38000,47000,57000,66000,70000],
  AirCarrier:  [0,8000,12000,20000,30000,40000,52000,64000,78000,92000,105000,110000],
  Submarine:   [0,5000, 8000,12000,18000,24000,32000,40000,50000,60000,70000,75000],
};
const FALLBACK_FRAGS = {
  Battleship:0.85, Cruiser:0.95, Destroyer:0.80, AirCarrier:1.10, Submarine:0.80,
};
function expectedFor(shipId) {
  // 1) medie reali (database o file)
  const exp = _expected[String(shipId)];
  if (exp && exp.average_damage_dealt) return exp;
  // 2) fallback per tier + classe dai metadati nave
  const meta = (_shipsMeta && _shipsMeta[String(shipId)]) || null;
  if (!meta || !meta.tier || !meta.type) return null;
  const row = FALLBACK_DMG[meta.type];
  if (!row) return null;
  const dmg = row[meta.tier] || row[row.length - 1];
  if (!dmg) return null;
  return {
    average_damage_dealt: dmg,
    average_frags: FALLBACK_FRAGS[meta.type] || 0.85,
    win_rate: 50.0,
    _fallback: true,
  };
}

/* Formula standard (Wahzehd / wows-numbers).                              */
function computePR(shipStats) {
  let aDmg = 0, aFrags = 0, aWins = 0;       // valori reali (somme)
  let eDmg = 0, eFrags = 0, eWins = 0;       // valori attesi (pesati per battaglie)
  for (const s of shipStats) {
    const pvp = s.pvp; if (!pvp || !pvp.battles) continue;
    const exp = expectedFor(s.ship_id);
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
  const exp = expectedFor(s.ship_id);
  if (!exp || !exp.average_damage_dealt) return null;
  const rDmg = (pvp.damage_dealt / pvp.battles) / exp.average_damage_dealt;
  const rFrags = (pvp.frags / pvp.battles) / exp.average_frags;
  const rWins = (pvp.wins / pvp.battles * 100) / exp.win_rate;
  const nDmg = Math.max(0, (rDmg - 0.4) / 0.6);
  const nFrags = Math.max(0, (rFrags - 0.1) / 0.9);
  const nWins = Math.max(0, (rWins - 0.7) / 0.3);
  return 700 * nDmg + 300 * nFrags + 150 * nWins;
}

/* ---------- categorie successive (PR / WR) ---------- */
const WR_BRACKETS = [
  [0, "#86868b", 0], [0.001, "#d11500", 1], [47, "#d97000", 2], [50, "#b8860b", 3],
  [52, "#3a9400", 4], [54, "#2e7d00", 5], [56, "#009b8a", 6], [60, "#b521d6", 7], [65, "#8a0ba8", 8],
];
function nextBracket(value, scale) {
  let nextRow = null;
  for (const row of scale) { if (row[0] > value) { nextRow = row; break; } }
  if (!nextRow) return null;
  return { label: (t("prLabels")[nextRow[2]] || ""), gap: nextRow[0] - value, color: nextRow[1] };
}

/* ---------- analisi: aggregazione per gruppo (classe/tier/nazione) ---------- */
function aggGroup(ships, keyFn) {
  const groups = {};
  for (const s of ships) {
    const pvp = s.pvp; if (!pvp || !pvp.battles) continue;
    const k = keyFn(s.ship_id); if (k == null || k === "") continue;
    (groups[k] = groups[k] || []).push(s);
  }
  const out = [];
  for (const k in groups) {
    const arr = groups[k]; let b = 0, w = 0, d = 0;
    for (const s of arr) { b += s.pvp.battles; w += s.pvp.wins; d += s.pvp.damage_dealt; }
    out.push({ key: k, ships: arr.length, battles: b, wr: b ? w / b * 100 : 0, dmg: b ? d / b : 0, pr: computePR(arr) });
  }
  return out;
}
function buildBreakdowns() {
  const meta = id => _shipsMeta[String(id)] || {};
  return {
    type:   aggGroup(_allShips, id => meta(id).type),
    tier:   aggGroup(_allShips, id => meta(id).tier),
    nation: aggGroup(_allShips, id => meta(id).nation),
  };
}
function renderBreakdown(which) {
  _bdWhich = which;
  const head = document.getElementById("bdGroupHead");
  if (head) head.textContent = which === "type" ? t("type") : which === "tier" ? t("tier") : t("nation");
  const body = document.getElementById("bdBody"); if (!body) return;
  let rows = (_bd && _bd[which] || []).slice();
  if (which === "tier") rows.sort((a, b) => (+a.key) - (+b.key));
  else if (which === "type") { const ord = { Destroyer: 0, Cruiser: 1, Battleship: 2, AirCarrier: 3, Submarine: 4 }; rows.sort((a, b) => (ord[a.key] ?? 9) - (ord[b.key] ?? 9)); }
  else rows.sort((a, b) => b.battles - a.battles);
  body.innerHTML = rows.map(g => {
    const prc = prColor(g.pr || 0);
    const label = which === "type" ? `<span class="type-tag">${classIcon(g.key)}${t("types")[g.key] || g.key}</span>`
      : which === "tier" ? `<span class="tier-tag">${roman(+g.key)}</span>`
      : (nationTag(g.key) || g.key);
    return `<tr>
      <td class="left">${label}</td>
      <td>${fmt(g.ships)}</td>
      <td>${fmt(g.battles)}</td>
      <td class="wr-cell" style="color:${wrColor(g.wr)}">${fmt(g.wr, 1)}</td>
      <td>${fmt(g.dmg)}</td>
      <td class="pr-cell" style="color:${g.pr != null ? prc.color : "inherit"}">${g.pr != null ? fmt(g.pr) : "\u2014"}</td>
    </tr>`;
  }).join("");
}
function bindBreakdown() {
  const seg = document.getElementById("bdSeg");
  if (!seg) return;
  seg.addEventListener("click", e => {
    const btn = e.target.closest("button"); if (!btn) return;
    [...seg.children].forEach(b => b.classList.toggle("on", b === btn));
    renderBreakdown(btn.dataset.b);
  });
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
  const cmp = $("#compare"); if (cmp) cmp.classList.add("hidden");
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
    _clanColor = null;  // l'API WoWS non espone la lega CB del clan in modo
                        // affidabile, quindi il tag usa il colore fisso (accento)
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
let _ships = [], _sortKey = "battles", _sortDir = -1, _tierFilter = 0, _classFilter = "", _premOnly = false, _nameQuery = "";
let _bd = null, _bdWhich = "type";
let _player = null, _clanTag = null, _allShips = [], _activeMode = "pvp", _availModes = [];
let _clanColor = null;

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
  <div class="pcard${SHOW_PR ? "" : " no-pr"}">
    ${SHOW_PR ? `<div class="pr-badge" style="color:${prc.color}">
      <div class="pr-val">${overallPR != null ? fmt(overallPR) : "—"}</div>
      <div class="pr-lab">PERSONAL RATING</div>
      <div class="pr-rank">${overallPR != null ? prc.label : ""}</div>
    </div>` : ""}
    <div class="pinfo">
      <div class="pnick">${player.nickname}${clanTag ? `<span class="clan-tag"${_clanColor ? ` style="color:${_clanColor}"` : ""}>[${clanTag}]</span>` : ""}</div>
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
  html += `<div id="progressBox"></div>`;
  html += `<div id="modeContent"></div>`;

  els.profile.innerHTML = html;
  show(els.profile);

  bindModeTabs();
  drawMode();  // disegna la modalità attiva (stat + tabella navi)
  window.scrollTo({ top: 0, behavior: "smooth" });

  loadProgress(player);  // "progresso dall'ultima visita" (se DB attivo)
  indexShips(player, ships);  // indicizza le navi per migliorare le medie PR
}

/* Progresso dall'ultima visita: invia i totali correnti al server, che
   restituisce lo snapshot precedente; mostriamo la differenza. */
async function loadProgress(player) {
  const box = document.getElementById("progressBox");
  if (!box) return;
  const s = modeStats(player, "pvp");
  if (!s || !s.battles) return;  // niente Random, niente progresso
  try {
    const q = new URLSearchParams({
      account_id: player.account_id,
      nickname: player.nickname || "",
      battles: s.battles, wins: s.wins,
      damage: s.damage_dealt, frags: s.frags,
    });
    const r = await fetch(`/api/progress?${q}`);
    const data = await r.json();
    if (!data.enabled) return;            // DB non configurato
    const prev = data.previous;
    if (!prev) {                          // prima visita
      box.innerHTML = `<div class="progress-note">${t("firstVisit")}</div>`;
      return;
    }
    const db = s.battles - prev.battles;  // nuove battaglie
    if (db <= 0) return;                  // nessuna nuova partita: non mostro nulla
    const dw = s.wins - prev.wins;
    const dd = s.damage_dealt - prev.damage;
    const df = s.frags - prev.frags;
    const days = Math.max(0, Math.round((Date.now() / 1000 - prev.ts) / 86400));
    const sessWR = db ? dw / db * 100 : 0;
    box.innerHTML = `
      <div class="progress-box">
        <div class="progress-head">${t("sinceLast")} · <span>${t("ago", days)}</span></div>
        <div class="progress-stats">
          <div><b>+${fmt(db)}</b><span>${t("newBattles")}</span></div>
          <div><b style="color:${wrColor(sessWR)}">${fmt(sessWR, 1)}%</b><span>${t("sessionWR")}</span></div>
          <div><b>${fmt(dd / db)}</b><span>${t("avgDamage")}</span></div>
          <div><b>${fmt(df / db, 2)}</b><span>${t("avgFrags")}</span></div>
        </div>
      </div>`;
  } catch (_) { /* progresso opzionale */ }
}

/* Indicizza le navi del giocatore: le invia al server, che le accumula nel
   database per calcolare le medie attese. Migliora il PR di tutti col tempo. */
async function indexShips(player, ships) {
  if (!player || player.hidden_profile || !ships || !ships.length) return;
  const payload = [];
  for (const s of ships) {
    const pvp = s.pvp;
    if (pvp && pvp.battles) {
      payload.push({
        ship_id: s.ship_id, battles: pvp.battles, wins: pvp.wins,
        damage: pvp.damage_dealt, frags: pvp.frags,
      });
    }
  }
  if (!payload.length) return;
  try {
    await fetch("/api/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: player.account_id, ships: payload }),
    });
  } catch (_) { /* indicizzazione opzionale, silenziosa */ }
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
    const wrNext = nextBracket(wr, WR_BRACKETS);
    const overallPR = key === "pvp" ? computePR(_allShips) : null;
    const prNext = overallPR != null ? nextBracket(overallPR, PR_SCALE) : null;
    html += `<div class="nextup"><span class="nextup-lab">${t("nextUp")}</span>` +
      (key === "pvp"
        ? (prNext ? `<span class="nextup-chip" style="color:${prNext.color}">PR +${fmt(prNext.gap)} \u2192 ${prNext.label}</span>`
                  : (overallPR != null ? `<span class="nextup-chip nextup-max">PR \u00b7 ${t("maxTier")}</span>` : ""))
        : "") +
      (wrNext ? `<span class="nextup-chip" style="color:${wrNext.color}">WR +${fmt(wrNext.gap, 1)}% \u2192 ${wrNext.label}</span>`
              : `<span class="nextup-chip nextup-max">WR \u00b7 ${t("maxTier")}</span>`) +
      `</div>`;
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
      <div class="ships-controls">
        <div class="class-filter" id="classFilter">
          <button data-c="" class="on">${t("all")}</button>
          <button data-c="Destroyer" title="${t("types").Destroyer}">${classIcon("Destroyer")}</button>
          <button data-c="Cruiser" title="${t("types").Cruiser}">${classIcon("Cruiser")}</button>
          <button data-c="Battleship" title="${t("types").Battleship}">${classIcon("Battleship")}</button>
          <button data-c="AirCarrier" title="${t("types").AirCarrier}">${classIcon("AirCarrier")}</button>
          <button data-c="Submarine" title="${t("types").Submarine}">${classIcon("Submarine")}</button>
        </div>
        <button class="prem-toggle" id="premToggle" type="button">${t("premiumOnly")}</button>
        <input type="text" id="shipSearch" class="ship-search" placeholder="${t("searchShip")}" spellcheck="false" autocomplete="off">
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
          ${SHOW_PR ? `<th data-k="pr">PR</th>` : ""}
        </tr></thead>
        <tbody id="shipBody"></tbody>
      </table></div>
    </section>`;
    if (key === "pvp") html += `<section class="ships breakdown" style="margin-top:28px">
      <div class="ships-head"><h2>${t("analysis")}</h2>
        <div class="tier-filter" id="bdSeg">
          <button data-b="type" class="on">${t("byClass")}</button>
          <button data-b="tier">${t("byTier")}</button>
          <button data-b="nation">${t("byNation")}</button>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr>
          <th class="left" id="bdGroupHead">${t("type")}</th>
          <th>${t("shipsCount")}</th>
          <th>${t("battles")}</th>
          <th>WR%</th>
          <th>${t("avgDamage")}</th>
          <th>PR</th>
        </tr></thead>
        <tbody id="bdBody"></tbody>
      </table></div>
    </section>`;
  } else if (b > 0 && key !== "pvp") {
    html += `<div class="empty-mode" style="margin-top:24px">${t("shipsNoMode")}</div>`;
  }

  document.getElementById("modeContent").innerHTML = html;

  if (modeShips.length) {
    _ships = modeShips.map(s => enrichShip(s, key));
    _sortKey = "battles"; _sortDir = -1; _tierFilter = 0;
    _classFilter = ""; _premOnly = false; _nameQuery = "";
    bindTable();
    drawShips();
    if (key === "pvp") { _bd = buildBreakdowns(); _bdWhich = "type"; bindBreakdown(); renderBreakdown("type"); }
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
    img: meta.images ? (meta.images.small || meta.images.contour || "") : "",
    battles: ms.battles,
    wr: ms.wins / ms.battles * 100,
    dmg: ms.damage_dealt / ms.battles,
    frags: ms.frags / ms.battles,
    pr,
  };
}
const CLASS_SVG = {
  Battleship: '<path d="M2 14h20l-2 4H4z"/><rect x="9" y="6" width="6" height="8"/><rect x="5" y="10" width="3" height="4"/><rect x="16" y="10" width="3" height="4"/><rect x="11.4" y="3" width="1.2" height="3"/>',
  Cruiser:    '<path d="M3 14h18l-2 4H5z"/><rect x="9.5" y="8" width="5" height="6"/><rect x="6" y="11" width="2.5" height="3"/><rect x="11.6" y="5" width="0.8" height="3"/>',
  Destroyer:  '<path d="M3 15h18l-2 3H5z"/><rect x="10" y="11" width="4" height="4"/><rect x="11.6" y="7" width="0.8" height="4"/>',
  AirCarrier: '<path d="M2 15h20l-1.5 3H3.5z"/><rect x="3" y="11.5" width="18" height="2"/><rect x="15.5" y="8.5" width="2" height="3"/><path d="M6.5 9.7l3.2-.7 3.2.7-3.2.7z"/>',
  Submarine:  '<ellipse cx="12" cy="14" rx="10" ry="3.3"/><rect x="10.3" y="9" width="3.4" height="5"/><rect x="11.6" y="5.5" width="0.8" height="3.5"/>',
};
function classIcon(type) {
  const p = CLASS_SVG[type]; if (!p) return "";
  return `<svg class="cls-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${p}</svg>`;
}
const NATION = {
  usa:{l:"USA",c:"#2a6df0"}, japan:{l:"JPN",c:"#d11500"}, ussr:{l:"USSR",c:"#c0392b"},
  germany:{l:"GER",c:"#8a8a8e"}, uk:{l:"UK",c:"#1f3a93"}, france:{l:"FRA",c:"#2a6df0"},
  italy:{l:"ITA",c:"#1a8917"}, pan_asia:{l:"ASIA",c:"#009b8a"}, commonwealth:{l:"CMW",c:"#b8860b"},
  pan_america:{l:"AMER",c:"#d97000"}, europe:{l:"EUR",c:"#3a5fcd"}, netherlands:{l:"NED",c:"#e67e22"},
  spain:{l:"ESP",c:"#c79a00"},
};
function nationTag(n) {
  if (!n) return "";
  const x = NATION[String(n).toLowerCase()] || { l: String(n).toUpperCase().slice(0, 4), c: "#86868b" };
  return `<span class="nation-tag" style="--nc:${x.c}">${x.l}</span>`;
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
  const cf = $("#classFilter");
  if (cf) cf.addEventListener("click", e => {
    const btn = e.target.closest("button"); if (!btn) return;
    _classFilter = btn.dataset.c || "";
    [...cf.children].forEach(b => b.classList.toggle("on", b === btn));
    drawShips();
  });
  const pt = $("#premToggle");
  if (pt) pt.addEventListener("click", () => {
    _premOnly = !_premOnly;
    pt.classList.toggle("on", _premOnly);
    drawShips();
  });
  const ss = $("#shipSearch");
  if (ss) ss.addEventListener("input", () => { _nameQuery = ss.value.trim(); drawShips(); });
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
  if (_classFilter) rows = rows.filter(s => s.type === _classFilter);
  if (_premOnly) rows = rows.filter(s => s.premium);
  if (_nameQuery) { const q = _nameQuery.toLowerCase(); rows = rows.filter(s => (s.name || "").toLowerCase().includes(q)); }
  rows.sort((a, b) => {
    let x = a[_sortKey], y = b[_sortKey];
    if (typeof x === "string") { x = x.toLowerCase(); y = (y || "").toLowerCase(); return x < y ? -_sortDir : x > y ? _sortDir : 0; }
    x = x == null ? -1 : x; y = y == null ? -1 : y;
    return (x - y) * _sortDir;
  });
  const body = $("#shipBody");
  if (!rows.length) { const cols = SHOW_PR ? 8 : 7; body.innerHTML = `<tr><td colspan="${cols}" class="left" style="text-align:center;color:var(--txt-dim);padding:22px">${t("noMatch")}</td></tr>`; return; }
  body.innerHTML = rows.map(s => {
    const prc = prColor(s.pr || 0);
    return `<tr>
      <td class="left">${s.img ? `<img class="ship-ic" src="${s.img}" alt="" loading="lazy">` : ""}<span class="ship-name ${s.premium ? "prem" : ""}">${s.name}</span>
        ${nationTag(s.nation)}</td>
      <td><span class="tier-tag">${roman(s.tier)}</span></td>
      <td class="left"><span class="type-tag">${classIcon(s.type)}${(t("types")[s.type]) || s.type || "—"}</span></td>
      <td>${fmt(s.battles)}</td>
      <td class="wr-cell" style="color:${wrColor(s.wr)}">${fmt(s.wr, 1)}</td>
      <td>${fmt(s.dmg)}</td>
      <td>${fmt(s.frags, 2)}</td>
      ${SHOW_PR ? `<td class="pr-cell" style="color:${prc.color}">${s.pr != null ? fmt(s.pr) : "—"}</td>` : ""}
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
  const footText = $("#footText"); if (footText) footText.innerHTML = t("footer") + ' &middot; <a href="/about.html">How it works</a>';
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
      applyCompareI18n();
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

  // aggancio il pulsante e il modulo confronto
  initCompare();

  // se arrivo con ?q=nickname (es. da una classifica), cerco subito
  try {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) { $("#searchInput").value = q; search(q); }
  } catch (_) {}
})();

/* ================= CONFRONTO TRA DUE GIOCATORI ================= */
let _cmpA = null, _cmpB = null;

function initCompare() {
  const btn = $("#compareBtn");
  if (btn) btn.addEventListener("click", openCompare);
  const back = $("#cmpBack");
  if (back) back.addEventListener("click", goHome);
  const go = $("#cmpGo");
  if (go) go.addEventListener("click", runCompare);
  applyCompareI18n();
}

function applyCompareI18n() {
  const setTxt = (sel, v) => { const n = $(sel); if (n) n.textContent = v; };
  const setPh = (sel, v) => { const n = $(sel); if (n) n.setAttribute("placeholder", v); };
  setTxt("#compareBtn", t("compareBtn"));
  setTxt("#cmpTitle", t("compareTitle"));
  setPh("#cmpInputA", t("compareP1"));
  setPh("#cmpInputB", t("compareP2"));
  setTxt("#cmpGo", t("compareGo"));
  const back = $("#cmpBack"); if (back) back.textContent = t("backToSearch");
}

function openCompare() {
  hide(els.hero, els.results, els.profile, els.status);
  const sec = $("#compare");
  if (sec) { sec.classList.remove("hidden"); applyCompareI18n(); }
}

/* carica un giocatore (info + navi pvp) per il confronto */
async function loadCmpPlayer(name) {
  name = (name || "").trim();
  if (name.length < 3) throw new Error(t("minChars"));
  const list = await wg("account/list", { search: name, limit: 1 });
  if (!list || !list.length) throw new Error(t("noPlayer", name));
  const id = list[0].account_id;
  const info = await wg("account/info", {
    account_id: id,
    fields: "nickname,account_id,hidden_profile,statistics",
  });
  const player = info[String(id)];
  if (!player) throw new Error(t("profileUnavailable"));
  let ships = [];
  if (!player.hidden_profile) {
    try {
      const ss = await wg("ships/stats", { account_id: id, fields: "ship_id,pvp.battles,pvp.wins,pvp.damage_dealt,pvp.frags,pvp.survived_battles,pvp.xp" });
      ships = ss[String(id)] || [];
    } catch (_) {}
  }
  return { player, ships, id };
}

async function runCompare() {
  const nameA = $("#cmpInputA").value, nameB = $("#cmpInputB").value;
  const out = $("#cmpResult");
  out.innerHTML = `<div class="status"><div class="spinner"></div></div>`;
  try {
    await loadStatic();
    REALM = $("#realmSelect").value || REALM;
    const [A, B] = await Promise.all([loadCmpPlayer(nameA), loadCmpPlayer(nameB)]);
    _cmpA = A; _cmpB = B;
    renderCompare();
  } catch (e) {
    out.innerHTML = `<div class="status error">${t("errorPrefix")}${e.message}</div>`;
  }
}

/* calcola le stat aggregate (Random) di un giocatore */
function cmpAgg(p) {
  const s = modeStats(p.player, "pvp") || {};
  const b = s.battles || 0;
  const deaths = b - (s.survived_battles || 0);
  return {
    battles: b,
    wr: b ? s.wins / b * 100 : 0,
    dmg: b ? s.damage_dealt / b : 0,
    frags: b ? s.frags / b : 0,
    surv: b ? s.survived_battles / b * 100 : 0,
    xp: b ? s.xp / b : 0,
    kd: deaths ? s.frags / deaths : (s.frags || 0),
    ships: p.ships.length,
  };
}

function renderCompare() {
  const A = cmpAgg(_cmpA), B = cmpAgg(_cmpB);
  // righe: [chiave i18n, valoreA, valoreB, decimali, "su"=più alto è meglio]
  const rows = [
    [t("battles"), A.battles, B.battles, 0, true],
    [t("winRate"), A.wr, B.wr, 2, true],
    [t("avgDamage"), A.dmg, B.dmg, 0, true],
    [t("avgFrags"), A.frags, B.frags, 2, true],
    [t("survival"), A.surv, B.surv, 1, true],
    [t("avgXp"), A.xp, B.xp, 0, true],
    [t("kd"), A.kd, B.kd, 2, true],
    [t("shipsPlayed", "").replace(/\s*\(\)\s*$/, ""), A.ships, B.ships, 0, true],
  ];
  const nickA = _cmpA.player.nickname, nickB = _cmpB.player.nickname;

  let html = `<div class="cmp-grid">
    <div class="cmp-head"></div>
    <div class="cmp-head cmp-name">${nickA}</div>
    <div class="cmp-head cmp-name">${nickB}</div>`;
  for (const [label, va, vb, dec, higher] of rows) {
    const aWin = higher ? va > vb : va < vb;
    const bWin = higher ? vb > va : vb < va;
    html += `<div class="cmp-lab">${label}</div>
      <div class="cmp-val ${aWin ? "win" : ""}">${fmt(va, dec)}</div>
      <div class="cmp-val ${bWin ? "win" : ""}">${fmt(vb, dec)}</div>`;
  }
  html += `</div>`;

  // navi in comune
  const idsB = new Set(_cmpB.ships.filter(s => s.pvp && s.pvp.battles).map(s => String(s.ship_id)));
  const common = _cmpA.ships
    .filter(s => s.pvp && s.pvp.battles && idsB.has(String(s.ship_id)))
    .map(s => ({ id: String(s.ship_id), name: (_shipsMeta[String(s.ship_id)] || {}).name || ("#" + s.ship_id), tier: (_shipsMeta[String(s.ship_id)] || {}).tier || 0 }))
    .sort((x, y) => (y.tier - x.tier) || x.name.localeCompare(y.name));

  if (common.length) {
    html += `<div class="cmp-ship-sel"><label>${t("compareShip")}</label>
      <select id="cmpShipSelect">
        ${common.map(c => `<option value="${c.id}">${roman(c.tier)} · ${c.name}</option>`).join("")}
      </select></div>
      <div id="cmpShipResult"></div>`;
  } else {
    html += `<div class="empty-mode" style="margin-top:18px">${t("compareNoCommon")}</div>`;
  }

  $("#cmpResult").innerHTML = html;

  if (common.length) {
    const sel = $("#cmpShipSelect");
    sel.addEventListener("change", () => renderCmpShip(sel.value));
    renderCmpShip(common[0].id);
  }
}

function shipPvp(p, shipId) {
  const sh = p.ships.find(s => String(s.ship_id) === String(shipId));
  return sh && sh.pvp;
}

function renderCmpShip(shipId) {
  const pa = shipPvp(_cmpA, shipId), pb = shipPvp(_cmpB, shipId);
  if (!pa || !pb) { $("#cmpShipResult").innerHTML = ""; return; }
  const calc = p => {
    const b = p.battles || 0, deaths = b - (p.survived_battles || 0);
    return { battles: b, wr: b ? p.wins / b * 100 : 0, dmg: b ? p.damage_dealt / b : 0,
             frags: b ? p.frags / b : 0, kd: deaths ? p.frags / deaths : (p.frags || 0) };
  };
  const A = calc(pa), B = calc(pb);
  const rows = [
    [t("battles"), A.battles, B.battles, 0],
    [t("winRate"), A.wr, B.wr, 2],
    [t("avgDamage"), A.dmg, B.dmg, 0],
    [t("avgFrags"), A.frags, B.frags, 2],
    [t("kd"), A.kd, B.kd, 2],
  ];
  let html = `<div class="cmp-grid cmp-grid-ship">
    <div class="cmp-head"></div>
    <div class="cmp-head cmp-name">${_cmpA.player.nickname}</div>
    <div class="cmp-head cmp-name">${_cmpB.player.nickname}</div>`;
  for (const [label, va, vb, dec] of rows) {
    const aWin = va > vb, bWin = vb > va;
    html += `<div class="cmp-lab">${label}</div>
      <div class="cmp-val ${aWin ? "win" : ""}">${fmt(va, dec)}</div>
      <div class="cmp-val ${bWin ? "win" : ""}">${fmt(vb, dec)}</div>`;
  }
  html += `</div>`;
  $("#cmpShipResult").innerHTML = html;
}
