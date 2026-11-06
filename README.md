# Archivio dei pronostici di QuotaGuru

Ogni pronostico pubblicato su www.quotaguru.it, salvato a ogni aggiornamento del sito (scripts/archive-predictions.mjs).

- `calcio/AAAA-MM.json`, `nba/AAAA-MM.json`: una partita per riga, raggruppate per mese di inizio.
- `firstPublished`: prima pubblicazione; `published`: ultima versione pubblicata prima dell'inizio
  (`versions` = quante volte è cambiata). Dall'inizio della partita il pronostico non viene più modificato.
- `pick`: esito indicato come più probabile; `result` e `hit`: risultato finale e se il pronostico era giusto.

La cronologia dei commit di questo branch mostra quando ogni pronostico è stato pubblicato.

## Licenza

I pronostici (probabilità, esiti indicati, bilancio) sono di QuotaGuru e sono rilasciati con licenza Creative Commons Attribuzione - Non commerciale 4.0 (CC BY-NC 4.0): si possono riutilizzare per scopi non commerciali citando QuotaGuru con un link a www.quotaguru.it. I dati delle partite (date, squadre, risultati) provengono da API-Football (API-Sports) e non possono essere riprodotti o ridistribuiti.

Testo della licenza: https://creativecommons.org/licenses/by-nc/4.0/deed.it
