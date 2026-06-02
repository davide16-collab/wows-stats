# Wows Stats

Clone di [WoWS Numbers](https://wows-numbers.com) per *World of Warships*: cerca un
giocatore per nickname e vedi Personal Rating, win rate, danno medio e le statistiche
di ogni singola nave, con la classica scala colori del rating.

Usa la **Wargaming Public API** tramite la tua `application_id`.

---

## Perché serve un mini-server (e non basta un file HTML)

L'API Wargaming **non invia header CORS**, quindi il browser blocca le chiamate fatte
direttamente da una pagina web. La soluzione (la stessa che usa WoWS Numbers) è far
passare le richieste da un piccolo server: `server.py` serve il sito **e** inoltra le
chiamate all'API aggiungendo la tua chiave. Niente dipendenze esterne: solo Python 3.

---

## Avvio

1. Installa Python 3 (qualsiasi versione 3.8+).
2. Dalla cartella del progetto:

   ```bash
   python3 server.py
   ```

3. Apri il browser su **http://localhost:8000**

Per fermarlo: `Ctrl+C`.

---

## Configurazione

La tua application_id è già impostata in `server.py`. Puoi cambiarla senza toccare il
codice, via variabili d'ambiente:

```bash
WG_APP_ID=la_tua_chiave WG_REALM=eu PORT=8000 python3 server.py
```

- `WG_REALM` accetta `eu` (default), `na`, `asia`.
- Il realm si può anche cambiare al volo dal menu a tendina nell'interfaccia.

> Il server russo (Lesta) non è raggiungibile dalla Public API di Wargaming.

---

## Cosa mostra

- **Personal Rating** complessivo e per nave, calcolato con la formula standard
  (Wahzehd / wows-numbers) usando i valori attesi pubblicati su
  `api.wows-numbers.com`.
- Statistiche random battle: battaglie, win rate, danno medio, frag medi,
  sopravvivenza, XP media, K/D, vittorie.
- Tabella delle navi giocate: ordinabile per ogni colonna e filtrabile per tier.
- Tag del clan, data di creazione account e ultima battaglia.

I profili impostati come "nascosti" mostrano solo i dati pubblici di base.

---

## Struttura

```
wows-stats/
├── server.py          proxy + web server (libreria standard Python)
├── README.md
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## Note

- I dati sono solo quelli pubblici esposti dall'API (statistiche di gioco).
- C'è un limite di richieste al secondo per ogni application_id: l'enciclopedia
  delle navi e i valori attesi vengono messi in cache dal server per 6 ore.
- Progetto a scopo personale/didattico; rispetta i Terms of Use della WG Public API.
