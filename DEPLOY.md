# Mettere Wows Stats online — guida passo-passo (senza terminale)

Useremo **Render** (piano gratuito). Non serve usare la riga di comando:
caricheremo i file su GitHub dal browser e collegheremo Render a quella cartella.

Tempo richiesto: ~20 minuti. Tutto gratis.

---

## Riepilogo del percorso

1. Crea un account GitHub e carica i file del progetto (dal browser, trascinandoli)
2. Crea un account Render e collegalo a GitHub
3. Render legge il file `render.yaml` e pubblica il sito da solo
4. (Opzionale) Colleghi un dominio tuo

---

## PASSO 1 — Carica i file su GitHub

GitHub è il "magazzino" da cui Render prende i file. Si fa tutto dal browser.

1. Vai su **https://github.com** e registrati (gratis). Conferma l'email.
2. In alto a destra, clicca **+** → **New repository**.
3. Dai un nome, es. `wows-stats`. Lascia **Public** (va bene). Clicca **Create repository**.
4. Nella pagina del repository appena creato, clicca il link
   **"uploading an existing file"** (è nel testo al centro).
5. **Trascina dentro tutti i file della cartella** `wows-stats`:
   - `server.py`
   - `render.yaml`
   - `requirements.txt`
   - `README.md`
   - e l'intera cartella `public` (con `index.html`, `styles.css`, `app.js`)

   > Suggerimento: trascina direttamente il contenuto della cartella, non la cartella
   > zip. Se il browser non accetta la sottocartella `public`, caricala in un secondo
   > momento ripetendo "Add file → Upload files" e trascinando i 3 file dentro una
   > cartella chiamata `public` (GitHub la crea scrivendo `public/` davanti al nome).
6. In basso clicca **Commit changes**.

Fatto: i tuoi file ora sono su GitHub.

---

## PASSO 2 — Crea l'account Render e collega GitHub

1. Vai su **https://render.com** e clicca **Get Started** / **Sign up**.
2. Scegli **Sign up with GitHub** (così sono già collegati). Autorizza l'accesso.
   Non serve inserire la carta di credito per il piano gratuito.

---

## PASSO 3 — Pubblica il sito

1. Nella dashboard di Render clicca **New +** → **Web Service**.
2. Scegli **Build and deploy from a Git repository** → **Next**.
3. Seleziona il repository `wows-stats` che hai appena creato → **Connect**.
4. Render legge automaticamente il file `render.yaml` e precompila tutto:
   - **Runtime**: Python
   - **Start command**: `python3 server.py`
   - le variabili `HOST`, `WG_APP_ID`, `WG_REALM` sono già impostate
5. Controlla che il piano selezionato sia **Free**.
6. Clicca **Create Web Service** (o **Apply**).

Render impiega 1-2 minuti a pubblicare. Quando vedi **"Live"** in verde, in alto
trovi l'indirizzo del sito, tipo:

```
https://wows-stats.onrender.com
```

Aprilo: è il tuo sito online. 🎉

> Nota sul piano gratuito: dopo 15 minuti senza visite il sito va "in pausa" e la
> prima visita successiva impiega ~30-60 secondi a ripartire. Poi torna veloce.

---

## PASSO 4 (opzionale) — Un dominio tuo

Se vuoi `wowsstats.it` invece di `...onrender.com`:

1. Compra il dominio da un registrar (Namecheap, Cloudflare, Aruba, GoDaddy...).
   Un `.com` costa ~10-12€/anno, un `.it` simile.
2. Su Render: apri il tuo servizio → **Settings** → **Custom Domains** → **Add**.
3. Render ti mostra un record DNS (di tipo CNAME) da inserire.
4. Vai nel pannello del registrar dove hai comprato il dominio, sezione **DNS**,
   e aggiungi il record CNAME che Render ti ha indicato.
5. Aspetta che diventi attivo (di solito pochi minuti, a volte qualche ora).
   Render attiva l'HTTPS in automatico.

---

## IMPORTANTE — la chiave Wargaming e l'IP

Sul portale developer Wargaming (https://developers.wargaming.net → *My applications*),
la tua applicazione deve essere di tipo **Standalone**, NON **Server**.

- **Standalone**: viene validata solo la chiave, funziona da qualsiasi IP. ✅
  (Su Render l'IP del server non è fisso, quindi questa è la scelta corretta.)
- **Server**: richiede di inserire in whitelist l'IP esatto del server. Su Render non
  funzionerebbe perché l'IP può cambiare. ❌

Se la tua app è già "Standalone" non devi fare nulla.

---

## Aggiornare il sito in futuro

Quando vuoi cambiare qualcosa: modifica il file su GitHub (anche dal browser, matita
in alto a destra del file → modifica → Commit). Render rileva la modifica e ripubblica
da solo in un paio di minuti.

---

## Se qualcosa non funziona

- **Il sito si apre ma "Nessun giocatore trovato" su tutti**: controlla il tipo di app
  Wargaming (deve essere Standalone) e che la chiave in `render.yaml` sia corretta.
- **Errore in fase di deploy su Render**: apri la scheda **Logs** del servizio; di
  solito il messaggio è chiaro. Spesso basta verificare che `server.py` e `render.yaml`
  siano nella radice del repository (non dentro una sottocartella).
- **Il sito è lento alla prima apertura**: è lo stand-by del piano gratuito, normale.
