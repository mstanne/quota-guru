// Home: how the predictions are made, in a few paragraphs with links to the pages that go deeper.
import { Sigma } from "lucide-react";
import { Rich } from "./content/Rich";

const PARAGRAPHS = [
  "I pronostici di QuotaGuru non sono opinioni: sono probabilità calcolate da modelli statistici, uguali per ogni partita. Per il calcio il modello stima i gol attesi di ciascuna squadra dalla forza in attacco e in difesa mostrata nelle partite recenti, pesando di più quelle più vicine e tenendo conto del fattore campo; da quei valori ricava le probabilità di 1, X e 2, dell'Under/Over, del Goal/No goal e dei risultati esatti. Per l'NBA stima i punti attesi delle due squadre e la probabilità di vittoria di ciascuna.",
  "Una probabilità del 60% vuol dire che, su tante partite simili, quell'esito si verifica circa sei volte su dieci: le altre quattro no. Per questo i pronostici sbagliati fanno parte del gioco, e li mostriamo tutti. Nel [bilancio dei pronostici](/bilancio-pronostici) trovi quante volte si è verificato l'esito indicato come più probabile, per competizione e mese, con l'archivio completo da scaricare.",
  "I modelli non conoscono infortuni dell'ultima ora, turnover e motivazioni: per questo ogni partita ha anche le assenze segnalate, la forma e i precedenti. Il calcolo è spiegato passo per passo nella [metodologia](/metodologia), e la guida [come leggere le quote](/guide/come-leggere-le-quote) aiuta a confrontare le probabilità con le quote dei bookmaker. Le stime non sono consigli di gioco: se il gioco smette di essere un divertimento, [qui trovi dove chiedere aiuto](/guide/gioco-problematico-dove-chiedere-aiuto).",
];

export function HowPredictionsWork() {
  return (
    <section aria-labelledby="come-funzionano" className="container mx-auto px-4 py-10">
      <div className="max-w-3xl">
        <h2 id="come-funzionano" className="flex items-center gap-2 text-white text-2xl mb-4">
          <Sigma className="w-6 h-6 text-slate-300" aria-hidden="true" />
          Come funzionano i pronostici
        </h2>
        <div className="space-y-3 text-slate-300 leading-relaxed">
          {PARAGRAPHS.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
