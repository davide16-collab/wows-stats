"use strict";

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };
const fmt = (n, d = 0) => (n == null || isNaN(n)) ? "—" :
  Number(n).toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
const dateFromTs = ts => ts ? new Date(ts * 1000).toLocaleDateString("it-IT",
  { day: "2-digit", month: "short", year: "numeric" }) : "—";

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
const PR_SCALE = [
  [0, "#a0a0a0", "—"],
  [1, "#fe0e00", "Pessimo"],
  [750, "#fe7903", "Sotto media"],
  [1100, "#ffc71f", "Nella media"],
  [1350, "#44b300", "Buono"],
  [1550, "#318000", "Molto buono"],
  [1750, "#02c9b3", "Ottimo"],
  [2100, "#d042f3", "Unicum"],
  [2450, "#a00dc5", "Super unicum"],
];
function prColor(pr) {
  let c = PR_SCALE[0];
  for (const row of PR_SCALE) if (pr >= row[0]) c = row;
  return { color: c[1], label: c[2] };
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
  if (name.length < 3) { showStatus("Inserisci almeno 3 caratteri.", true); show(els.status); hide(els.hero, els.results, els.profile); return; }
  hide(els.hero, els.results, els.profile);
  show(els.status);
  showStatus(`<div class="spinner"></div>Ricerca di “${name}”&hellip;`);
  try {
    const list = await wg("account/list", { search: name, limit: 10 });
    if (!list || !list.length) { showStatus(`Nessun giocatore trovato per “${name}”.`, true); return; }
    if (list.length === 1) { hide(els.status); return loadPlayer(list[0].account_id, list[0].nickname); }
    // più risultati: mostra lista
    hide(els.status);
    els.resultsList.innerHTML = "";
    list.forEach(p => {
      const li = el("li");
      li.innerHTML = `<span class="nick">${p.nickname}</span><span class="id">ID ${p.account_id}</span>`;
      li.onclick = () => loadPlayer(p.account_id, p.nickname);
      els.resultsList.appendChild(li);
    });
    show(els.results);
  } catch (e) {
    showStatus("Errore: " + e.message, true); show(els.status);
  }
}

/* ---------- caricamento giocatore ---------- */
async function loadPlayer(accountId, nick) {
  hide(els.hero, els.results, els.profile);
  show(els.status);
  showStatus(`<div class="spinner"></div>Carico le statistiche di ${nick || accountId}&hellip;`);
  try {
    await loadStatic();
    // Chiedo l'oggetto 'statistics' completo: così l'API restituisce solo le
    // modalità che esistono per quel giocatore, senza errori INVALID_FIELDS.
    const info = await wg("account/info", {
      account_id: accountId,
      fields: "nickname,account_id,created_at,last_battle_time,hidden_profile,leveling_tier,statistics",
    });
    const player = info[String(accountId)];
    if (!player) throw new Error("Profilo non disponibile.");

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
      // Chiedo i blocchi-modalità interi (non i singoli sottocampi): più robusto.
      // Se anche questo fallisse, mostro comunque il profilo senza la tabella navi.
      try {
        const shipFields = "ship_id,last_battle_time," + MODES.map(m => m.key).join(",");
        const ss = await wg("ships/stats", { account_id: accountId, fields: shipFields });
        ships = (ss[String(accountId)] || []);
      } catch (_) {
        try {
          // fallback minimo: solo Random, che è sempre valido
          const ss = await wg("ships/stats", { account_id: accountId, fields: "ship_id,last_battle_time,pvp" });
          ships = (ss[String(accountId)] || []);
        } catch (_2) { ships = []; }
      }
    }
    hide(els.status);
    renderProfile(player, clanTag, ships);
  } catch (e) {
    showStatus("Errore: " + e.message, true); show(els.status);
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
  _activeMode = _availModes[0].key;

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
        <span>Account creato <b>${dateFromTs(player.created_at)}</b></span>
        <span>Ultima battaglia <b>${dateFromTs(player.last_battle_time)}</b></span>
        <span>Service level <b>${player.leveling_tier ?? "—"}</b></span>
        <span>ID <b>${player.account_id}</b></span>
      </div>
      ${player.hidden_profile ? `<div class="hidden-note">⚠ Profilo nascosto: statistiche dettagliate non disponibili.</div>` : ""}
    </div>
  </div>`;

  // barra dei tab modalità (sempre visibile, anche con una sola modalità)
  if (_availModes.length >= 1) {
    html += `<div class="mode-tabs" id="modeTabs">
      ${_availModes.map((m, i) =>
        `<button data-mode="${m.key}" class="${i === 0 ? "on" : ""}">${m.label}</button>`).join("")}
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
      ${stat("Battaglie", fmt(b))}
      <div class="stat"><div class="k">Win rate</div><div class="v" style="color:${wrColor(wr)}">${fmt(wr, 2)}<small>%</small></div></div>
      ${stat("Danno medio", fmt(pvp.damage_dealt / b))}
      ${stat("Frag medi", fmt(pvp.frags / b, 2))}
      ${stat("Sopravvivenza", fmt(pvp.survived_battles / b * 100, 1), "%")}
      ${stat("XP media", fmt(pvp.xp / b))}
      ${stat("K/D", fmt(deaths ? pvp.frags / deaths : pvp.frags, 2))}
      ${stat("Vittorie", fmt(pvp.wins || 0))}
    </div>`;
  } else {
    html += `<div class="empty-mode">Nessuna battaglia registrata in ${modeLabel}.</div>`;
  }

  // navi giocate in questa modalità
  const modeShips = _allShips.filter(s => { const ms = s[key]; return ms && ms.battles; });
  if (modeShips.length) {
    const tiers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    html += `<section class="ships">
      <div class="ships-head">
        <h2>Navi giocate (${modeShips.length})</h2>
        <div class="tier-filter" id="tierFilter">
          <button data-t="0" class="on">Tutti</button>
          ${tiers.slice(1).map(t => `<button data-t="${t}">${roman(t)}</button>`).join("")}
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr>
          <th class="left" data-k="name">Nave</th>
          <th data-k="tier">Tier</th>
          <th class="left" data-k="type">Tipo</th>
          <th data-k="battles" class="sorted">Batt.</th>
          <th data-k="wr">WR%</th>
          <th data-k="dmg">Danno</th>
          <th data-k="frags">Frag</th>
          <th data-k="pr">PR</th>
        </tr></thead>
        <tbody id="shipBody"></tbody>
      </table></div>
    </section>`;
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
const TYPE_MAP = { Destroyer: "CT", Cruiser: "INC", Battleship: "CRZ", AirCarrier: "PA", Submarine: "SOT" };
const TYPE_FULL = { Destroyer: "Cacciatorpediniere", Cruiser: "Incrociatore", Battleship: "Corazzata", AirCarrier: "Portaerei", Submarine: "Sottomarino" };
function prettyType(t) { return t || ""; }
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
      <td class="left"><span class="type-tag">${TYPE_FULL[s.type] || s.type || "—"}</span></td>
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

/* ---------- init ---------- */
(async () => {
  try {
    const cfg = await (await fetch("/api/config")).json();
    REALM = cfg.realm || "eu";
    $("#realmSelect").value = REALM;
    $("#heroFoot").textContent = `Server: ${REALM.toUpperCase()} · App ID …${cfg.app_id_tail}`;
    $("#footMeta").textContent = `realm ${REALM.toUpperCase()}`;
  } catch (_) {}
})();
