# Dati di Quota Guru

Copia permanente dei dati del sito, salvata a ogni aggiornamento completo da `.github/workflows/deploy.yml`
(script `scripts/data-branch.sh` sul ramo main). Non modificare a mano: viene sovrascritta.

- `src/data/`, `data/`, `public/stato-dati.json`: dati scaricati dalle API (partite, classifiche, NBA, tennis,
  dettagli API-Sports, highlights, testi riscritti, storico per i modelli).
- `stato/seo/`: date di modifica delle pagine, archivio HTML delle partite finite, registro dei dati.
- `stato/match-details/`: dettagli e highlights già scaricati.
- `stato/editorial-*.json`: riscritture dei testi con Claude già pagate.

La cronologia dei commit è lo storico datato di ogni modifica. Se la cache dei workflow va persa,
il giro successivo riparte da qui.
