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
