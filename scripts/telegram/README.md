# Canale Telegram di QuotaGuru

Post automatici sul canale Telegram, generati dai dati che il sito già produce. Nessun testo scritto a mano, tranne la
coda delle guide Academy (`academy.json`).

## Come funziona

- `.github/workflows/telegram.yml` gira ogni 20 minuti tra le 7 e mezzanotte (ora di Roma).
- `publish.mjs` invia le rubriche il cui orario è arrivato negli ultimi 100 minuti e che non risultano già inviate.
  Un ritardo di GitHub o un'esecuzione ripetuta non producono doppioni; il cambio dell'ora legale non richiede modifiche.
- I dati vengono letti dal branch `dati` (calendario, classifiche, marcatori) e dal branch `archivio-pronostici`
  (ogni pronostico pubblicato con esito, tris e multiple del giorno): i numeri sul canale sono gli stessi del sito.
- Il registro dei post inviati e la posizione nella coda Academy stanno nel branch `telegram-registro`, file `registro.json`.
- Il live worker (`workers/live`) avvia il workflow puntuale ai minuti 07, 27 e 47 e, appena escono formazioni
  ufficiali nuove, subito con la rubrica `formazioni`. Il cron di GitHub resta come riserva.
- Se una rubrica non ha dati (nessuna partita, giornata non pronta) viene saltata: niente post vuoti.

## Immagini

Ogni post esce come immagine 1080×1350 con il testo come didascalia (`cards.mjs`, un layout per rubrica). Lo stile è
quello delle illustrazioni delle guide: sfondo navy, pannelli `#16243B`, arancio `#FB6801` e verde `#06BA55`, font Sora,
logo in alto. Niente loghi dei club e niente nomi di operatori: il filtro di conformità controlla anche il testo
dell'immagine. Ogni rubrica ha un testo breve di accompagnamento (`caption` in `rubriche.mjs`): i punti salienti in poche
righe (pronostico più netto, partita più equilibrata, sorpresa del giorno…), il link e la riga 18+, sempre entro i
1.024 caratteri ammessi da Telegram; l'elenco completo è nell'immagine. Per vedere le immagini senza inviarle:

```bash
node scripts/telegram/publish.mjs --dry-run --all --cards /percorso/cartella
```

## Rubriche (ora di Roma)

| Rubrica | Quando | Contenuto |
| --- | --- | --- |
| `partite-oggi` | ogni giorno 09:30 | partite del giorno con probabilità 1X2 |
| `track-record` | lunedì 10:00 | esito dei pronostici da venerdì a domenica e degli ultimi 30 giorni |
| `classifica` | lunedì 12:30 | classifica di Serie A e top 5 marcatori |
| `academy` | lunedì e mercoledì 18:00 | una guida dalla coda `academy.json`, a rotazione |
| `coppe` | martedì, mercoledì, giovedì 12:00 | partite europee della sera (solo se ci sono) |
| `numeri` | martedì 18:00 | Serie A: più e meno Over 2,5 e Goal nelle ultime 5 |
| `nba` | giovedì 18:00 | partite NBA della notte con la squadra più probabile |
| `anteprima-serie-a` | venerdì 12:00 | prossima giornata: più probabile, più incerta, più gol attesi |
| `anteprima-premier-league`, `anteprima-liga`, `anteprima-ligue-1` | il giorno prima dell'inizio di ogni giornata, 13:00 / 14:00 / 15:00 | anteprima della giornata come quella di Serie A (anche turni infrasettimanali) |
| `tris-weekend` | sabato 10:30 | le 3 partite del weekend (5 grandi campionati) più prevedibili e la probabilità che si verifichino tutte e tre; lunedì il track record dice com'è andata. Lo stesso tris è sul sito, `/pronostici/tris`: la build del sito lo fissa la mattina (`tris.json` nel branch `archivio-pronostici`, regole in `scripts/lib/tris.mjs`) e il post usa quello |
| `tris-champions`, `tris-europa-league`, `tris-conference` | 10:30 / 10:30 / 11:00 del primo giorno di ogni giornata di coppa | lo stesso per ogni coppa (Champions: martedì e mercoledì insieme); anche questi nel track record del lunedì |
| `tris-nazionali` | 10:30 del primo giorno di ogni finestra delle nazionali | le 3 partite ufficiali delle nazionali europee (Nations League, qualificazioni, Mondiali, Europei) più prevedibili di quel giorno e del successivo |
| `multiple` | ogni giorno 11:15 | le multiple del giorno del sito (`/pronostici/multiple`): doppia e multiple a quota equa 2, 5 e 10, ognuna con la probabilità che entri e la quota equa; gli esiti sono nell'immagine. In più com'è andata ogni multipla del giorno prima. Le multiple le fissa la build del sito la mattina (`multiple.json` nel branch `archivio-pronostici`, regole in `scripts/lib/multiple.mjs`) e il post usa quelle; saltata se non ce ne sono o se sono già cominciate |
| `nazionale-italia` | 11:30 il giorno di ogni partita dell'Italia | pronostico del modello delle nazionali e canale TV (Rai) |
| `pronostici-del-giorno` | 11:45 di sabato e domenica con i campionati e di martedì, mercoledì e giovedì con le coppe | 5 partite del giorno, per ognuna l'esito più netto tra 1X2, Goal/No Goal, Over/Under 2,5, doppia chance e Over 1,5, con probabilità e quota equa (1 ÷ probabilità) e la probabilità che si verifichino tutti e cinque. Massimo 2 per competizione (3 nelle giornate di coppa) finché ce ne sono altre; esclude le partite del tris del giorno |
| `studio-pronostico` | circa 4 ore prima del calcio d'inizio, massimo 2 partite al giorno | lo studio di una partita: 1X2 con quote eque, gol attesi, Over 2,5 e Goal, risultati più probabili, ultime 5 partite, classifica e indisponibili, l'esito del modello. Partite scelte: le squadre italiane nelle coppe europee (prima la Champions) e il big match di Serie A del giorno (la coppia meglio piazzata in classifica) |
| `dove-vederla` | venerdì 18:00 | canali TV della giornata di Serie A (accordi 2026/27) |
| `formazioni` | appena escono, circa un'ora prima | formazioni ufficiali: tutte le partite di Serie A, coppe europee solo con squadre italiane, ogni partita dell'Italia |
| `risultati` / `risultati-domenica` | sabato 23:00, domenica 23:30 | risultati del giorno contro il modello |

Orari e testi: `rubriche.mjs`.

## Regole sui contenuti (Decreto Dignità)

Prima dell'invio ogni post passa un filtro (`complianceProblems` in `lib.mjs`): niente nomi di operatori, niente bonus,
promozioni o inviti a giocare, solo link a www.quotaguru.it, sempre la riga di gioco responsabile. Un post che non
passa non viene inviato e il workflow risulta fallito, con il motivo nel log.

## Configurazione (una volta)

Repo → Settings → Secrets and variables → Actions:

| Tipo | Nome | Valore |
| --- | --- | --- |
| secret | `TELEGRAM_BOT_TOKEN` | token del bot creato con @BotFather |
| secret | `TELEGRAM_TEST_CHAT_ID` | id numerico del canale privato di prova (es. `-1001234567890`) |
| secret | `TELEGRAM_CHAT_ID` | `@quotaguru` |
| variable | `LIVE_URL` | indirizzo del live worker (già usato dal sito): serve alla rubrica `formazioni` |
| variable | `TELEGRAM_MODE` | `live` per pubblicare sul canale pubblico; vuota = canale di prova |

Il bot deve essere amministratore di entrambi i canali con il permesso "Pubblica messaggi".
Per l'id del canale di prova: pubblica un messaggio nel canale, inoltralo a @userinfobot (o a un bot simile)
e copia il numero che inizia con `-100`.

## Comandi

```bash
# stampa i post di tutte le rubriche senza inviarli (dati letti dai branch su GitHub)
node scripts/telegram/publish.mjs --dry-run --all

# una rubrica subito, a prescindere dall'orario
node scripts/telegram/publish.mjs --rubrica partite-oggi --force

# simula un'ora precisa
node scripts/telegram/publish.mjs --dry-run --now 2026-11-09T09:10:00Z
```

Da GitHub: Actions → "Canale Telegram" → Run workflow, scegliendo la rubrica. "Prova a secco" (attiva di default)
stampa il post nel log senza inviarlo.

## Aggiungere guide Academy

Aggiungi un elemento in fondo ad `academy.json` (`slug` della guida sul sito, `title`, 2-3 `paragraphs`, `linkText`).
La coda riparte dall'inizio quando è finita.
