# Archivio dei pronostici di QuotaGuru

Ogni pronostico pubblicato su www.quotaguru.it, salvato a ogni aggiornamento del sito. La cronologia dei
commit di questo branch mostra quando ogni pronostico è stato pubblicato; il bilancio è su https://www.quotaguru.it/bilancio-pronostici.

- `calcio/AAAA-MM.json`, `nba/AAAA-MM.json`: elenco delle partite del mese, in ordine di inizio.
- `kickoff`, `where`, `label`: inizio (UTC), competizione e partita; `national`: partita tra nazionali;
  `url`: pagina della partita sul sito (`path` è lo stesso indirizzo senza dominio).
- `firstPublished`: prima pubblicazione; `published`: ultima versione pubblicata prima dell'inizio
  (`versions` = quante volte è cambiata). Dall'inizio della partita il pronostico non viene più modificato.
- `pick`: esito indicato come più probabile; `prediction`: probabilità e numeri del modello.
- `result` e `hit`: risultato finale e se il pronostico era giusto (`graded`: quando è stato registrato).

Fino al 19 novembre 2026 i file erano indicizzati con l'identificativo della partita del fornitore dei dati: le
versioni da allora in poi non lo contengono.

## Licenza

I pronostici (probabilità, esiti indicati, bilancio) sono di QuotaGuru e sono rilasciati con licenza Creative Commons Attribuzione - Non commerciale 4.0 (CC BY-NC 4.0): si possono riutilizzare per scopi non commerciali citando QuotaGuru con un link a www.quotaguru.it. I dati delle partite (date, squadre, risultati) provengono da API-Football (API-Sports) e non possono essere riprodotti o ridistribuiti.

Testo della licenza: https://creativecommons.org/licenses/by-nc/4.0/deed.it
