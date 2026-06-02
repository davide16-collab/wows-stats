/* Gestione tema chiaro/scuro, condivisa da tutte le pagine.
   - default: segue il sistema operativo (prefers-color-scheme)
   - la scelta manuale dell'utente ha la precedenza e viene ricordata
   - inserisce automaticamente un interruttore sole/luna nell'header */
(function () {
  const KEY = "wowsstats_theme";

  function systemPref() {
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark" : "light";
  }
  function saved() {
    try { return localStorage.getItem(KEY); } catch (_) { return null; }
  }
  function effective() {
    return saved() || systemPref();
  }
  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = theme === "dark" ? "\u2600\ufe0f" : "\ud83c\udf19"; // sole se scuro, luna se chiaro
  }
  function setTheme(theme) {
    try { localStorage.setItem(KEY, theme); } catch (_) {}
    apply(theme);
  }

  // applica subito (prima del render per evitare lampeggii)
  apply(effective());

  // se l'utente non ha scelto, segui i cambi di sistema in tempo reale
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
      if (!saved()) apply(e.matches ? "dark" : "light");
    });
  }

  // crea l'interruttore nell'header (cerca un contenitore noto)
  function injectToggle() {
    if (document.getElementById("themeToggle")) return;
    const btn = document.createElement("button");
    btn.id = "themeToggle";
    btn.className = "theme-toggle";
    btn.type = "button";
    btn.title = "Light / dark theme";
    btn.onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      setTheme(cur === "dark" ? "light" : "dark");
    };
    // posiziona: dopo il selettore lingua se c'è, altrimenti in fondo alla topbar/nav
    const lang = document.getElementById("langSelect");
    const nav = document.querySelector(".topbar nav");
    const bar = document.querySelector(".topbar");
    if (lang && lang.parentNode) lang.parentNode.insertBefore(btn, lang.nextSibling);
    else if (nav) nav.appendChild(btn);
    else if (bar) bar.appendChild(btn);
    apply(effective());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectToggle);
  } else {
    injectToggle();
  }
})();

/* Banner "risveglio server": Render free spegne l'istanza dopo inattivita',
   quindi la prima richiesta dopo una pausa puo' metterci ~30-60s. Mostriamo un
   avviso gentile SOLO se una richiesta tarda, e lo togliamo appena risponde.
   Condiviso da tutte le pagine (theme.js e' incluso ovunque). */
(function () {
  var MSG = {
    it: "Riattivo il server\u2026 la prima visita dopo una pausa puo' richiedere fino a un minuto.",
    en: "Waking the server\u2026 the first visit after a break can take up to a minute.",
    fr: "R\u00e9veil du serveur\u2026 la premi\u00e8re visite apr\u00e8s une pause peut prendre jusqu'\u00e0 une minute.",
    de: "Server wird geweckt\u2026 der erste Besuch nach einer Pause kann bis zu einer Minute dauern.",
    es: "Despertando el servidor\u2026 la primera visita tras una pausa puede tardar hasta un minuto."
  };
  function lang() {
    try { var v = localStorage.getItem("wowsstats_lang"); if (v && MSG[v]) return v; } catch (_) {}
    return "en";
  }
  var pending = 0, timer = null, el = null;
  function banner() {
    if (el) return el;
    el = document.createElement("div");
    el.id = "wakeBanner";
    el.innerHTML = '<span class="wake-spin"></span><span class="wake-txt"></span>';
    (document.body || document.documentElement).appendChild(el);
    return el;
  }
  function show() {
    if (!document.body) return;
    var b = banner();
    b.querySelector(".wake-txt").textContent = MSG[lang()];
    b.classList.add("on");
  }
  function hide() { if (el) el.classList.remove("on"); }
  if (!window.fetch) return;
  var _fetch = window.fetch.bind(window);
  window.fetch = function () {
    pending++;
    if (!timer) timer = setTimeout(show, 2500);
    function settle() {
      pending = Math.max(0, pending - 1);
      if (pending === 0) { clearTimeout(timer); timer = null; hide(); }
    }
    return _fetch.apply(window, arguments).then(
      function (r) { settle(); return r; },
      function (e) { settle(); throw e; }
    );
  };
})();
