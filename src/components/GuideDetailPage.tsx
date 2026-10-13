import { ArrowLeft, BookOpen, Bookmark, Calendar, Clock, Share2 } from "lucide-react";
import { Link } from "react-router";
import { paths } from "../routes";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageSlot } from "./media/ImageSlot";
import { responsibleGambling as rg } from "../data/operators";

export function GuideDetailPage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alle guide
          </Button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-slate-700 text-white">Per principianti</Badge>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">8 min di lettura</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">16 Ottobre 2025</span>
              </div>
            </div>
            <h1 className="text-white text-4xl md:text-5xl mb-4">Guida completa alle scommesse sportive</h1>
            <p className="text-slate-400 text-xl mb-6">
              Tutto quello che devi sapere per iniziare a scommettere in modo responsabile e informato. Dalle basi alle
              strategie avanzate.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Condividi
              </Button>
              <Button
                variant="outline"
                className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Salva
              </Button>
            </div>
          </div>
          <div className="mb-12 rounded-lg overflow-hidden">
            <ImageSlot
              placeholder="[PLACEHOLDER_IMMAGINE_COPERTINA_1200x384]"
              src={null}
              alt="Guida Scommesse Sportive"
              className="w-full h-96 object-cover"
            />
          </div>
          <div className="prose prose-invert prose-lg max-w-none">
            <Card className="bg-slate-900 border-slate-800 mb-8">
              <div className="p-6">
                <h2 className="text-white text-2xl mb-4">Indice dei contenuti</h2>
                <ul className="space-y-2 text-slate-300">
                  <li>
                    <a href="#intro" className="hover:text-white transition-colors cursor-pointer">
                      1. Introduzione alle scommesse sportive
                    </a>
                  </li>
                  <li>
                    <a href="#quote" className="hover:text-white transition-colors cursor-pointer">
                      2. Come funzionano le quote
                    </a>
                  </li>
                  <li>
                    <a href="#tipologie" className="hover:text-white transition-colors cursor-pointer">
                      3. Tipologie di scommesse
                    </a>
                  </li>
                  <li>
                    <a href="#strategie" className="hover:text-white transition-colors cursor-pointer">
                      4. Strategie di base
                    </a>
                  </li>
                  <li>
                    <a href="#bankroll" className="hover:text-white transition-colors cursor-pointer">
                      5. Gestione del budget
                    </a>
                  </li>
                  <li>
                    <a href="#errori" className="hover:text-white transition-colors cursor-pointer">
                      6. Errori comuni da evitare
                    </a>
                  </li>
                  <li>
                    <a href="#responsabile" className="hover:text-white transition-colors cursor-pointer">
                      7. Gioco responsabile
                    </a>
                  </li>
                </ul>
              </div>
            </Card>
            <section id="intro" className="mb-8">
              <h2 className="text-white text-3xl mb-4">1. Introduzione alle scommesse sportive</h2>
              <p className="text-slate-300 mb-4">
                Le scommesse sportive sono diventate sempre più popolari negli ultimi anni, offrendo agli appassionati
                di sport un modo per rendere ancora più coinvolgente la visione delle partite. Tuttavia, è fondamentale
                approcciarsi a questo mondo con responsabilità e conoscenza.
              </p>
              <p className="text-slate-300 mb-4">
                Una scommessa sportiva consiste nel prevedere l'esito di un evento sportivo e puntare una somma di
                denaro su tale previsione. Se la previsione si rivela corretta, si vince un importo determinato dalla
                quota associata alla scommessa.
              </p>
              <Card className="bg-warn/10 border-warn/30 p-6 mb-4">
                <p className="text-warn mb-2">⚠️ Importante</p>
                <p className="text-slate-300 text-sm">
                  Le scommesse devono essere considerate un intrattenimento, non un modo per guadagnare denaro.
                  Scommetti solo ciò che puoi permetterti di perdere.
                </p>
              </Card>
            </section>
            <section id="quote" className="mb-8">
              <h2 className="text-white text-3xl mb-4">2. Come funzionano le quote</h2>
              <p className="text-slate-300 mb-4">
                Le quote rappresentano la probabilità che un evento si verifichi e determinano la vincita potenziale.
                Esistono tre formati principali di quote:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-slate-900 border-slate-800 p-5">
                  <h3 className="text-white mb-2">Quote decimali</h3>
                  <p className="text-slate-400 text-sm mb-3">Le più utilizzate in Europa</p>
                  <div className="bg-slate-800 rounded p-3 text-center">
                    <span className="text-best text-2xl">2.50</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-3">Vincita = Puntata × Quota</p>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-5">
                  <h3 className="text-white mb-2">Quote frazionarie</h3>
                  <p className="text-slate-400 text-sm mb-3">Comuni nel Regno Unito</p>
                  <div className="bg-slate-800 rounded p-3 text-center">
                    <span className="text-best text-2xl">3/2</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-3">Per ogni 2€ vinci 3€</p>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-5">
                  <h3 className="text-white mb-2">Quote americane</h3>
                  <p className="text-slate-400 text-sm mb-3">Utilizzate negli USA</p>
                  <div className="bg-slate-800 rounded p-3 text-center">
                    <span className="text-best text-2xl">+150</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-3">Basate su 100$ di puntata</p>
                </Card>
              </div>
              <p className="text-slate-300 mb-4">
                <strong className="text-white">Esempio pratico:</strong>
                {
                  " Se scommetti 10\u20AC su una quota di 2.50 e vinci, riceverai 25\u20AC (10\u20AC \xD7 2.50), ovvero 15\u20AC di vincita netta pi\xF9 i 10\u20AC della puntata iniziale."
                }
              </p>
            </section>
            <section id="tipologie" className="mb-8">
              <h2 className="text-white text-3xl mb-4">3. Tipologie di scommesse</h2>
              <p className="text-slate-300 mb-4">
                Esistono diverse tipologie di scommesse, ognuna con le proprie caratteristiche:
              </p>
              <div className="space-y-4 mb-6">
                <Card className="bg-slate-900 border-slate-800 p-5">
                  <h3 className="text-white mb-2">1X2 (esito finale)</h3>
                  <p className="text-slate-300 text-sm">
                    La scommessa più semplice: si prevede se vince la squadra di casa (1), se c'è un pareggio (X) o se
                    vince la squadra ospite (2).
                  </p>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-5">
                  <h3 className="text-white mb-2">Over/Under</h3>
                  <p className="text-slate-300 text-sm">
                    Si scommette se il numero totale di gol (o punti) sarà superiore (Over) o inferiore (Under) a una
                    soglia prestabilita (es. Over 2.5 gol).
                  </p>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-5">
                  <h3 className="text-white mb-2">Handicap</h3>
                  <p className="text-slate-300 text-sm">
                    Si assegna un vantaggio o svantaggio fittizio a una squadra per livellare le probabilità. Utile
                    quando c'è un chiaro favorito.
                  </p>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-5">
                  <h3 className="text-white mb-2">Combo/Multipla</h3>
                  <p className="text-slate-300 text-sm">
                    Si combinano più scommesse in un'unica giocata. Le quote si moltiplicano, ma devono essere corrette
                    tutte le previsioni per vincere.
                  </p>
                </Card>
              </div>
            </section>
            <section id="strategie" className="mb-8">
              <h2 className="text-white text-3xl mb-4">4. Strategie di base</h2>
              <p className="text-slate-300 mb-4">
                Ecco alcune strategie fondamentali per approcciare le scommesse in modo intelligente:
              </p>
              <ul className="space-y-3 text-slate-300 mb-4">
                <li className="flex items-start gap-3">
                  <span className="text-best mt-1">✓</span>
                  <span>
                    <strong className="text-white">Informati sempre:</strong>
                    {" Analizza statistiche, formazioni, infortuni e condizioni meteo prima di scommettere."}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-best mt-1">✓</span>
                  <span>
                    <strong className="text-white">Specializzati:</strong>
                    {" \xC8 meglio conoscere bene pochi campionati piuttosto che scommettere su tutto."}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-best mt-1">✓</span>
                  <span>
                    <strong className="text-white">Confronta le quote:</strong>
                    {" Usa sempre un comparatore per trovare le migliori quote disponibili."}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-best mt-1">✓</span>
                  <span>
                    <strong className="text-white">Value betting:</strong>
                    {" Cerca scommesse in cui la quota offerta \xE8 superiore alla probabilit\xE0 reale dell'evento."}
                  </span>
                </li>
              </ul>
            </section>
            <section id="bankroll" className="mb-8">
              <h2 className="text-white text-3xl mb-4">5. Gestione del budget</h2>
              <p className="text-slate-300 mb-4">
                La gestione del bankroll è forse l'aspetto più importante per avere successo nel lungo periodo:
              </p>
              <Card className="bg-slate-800/60 border-slate-700 p-6 mb-4">
                <h3 className="text-white mb-3">Regola del 1-5%</h3>
                <p className="text-slate-300 text-sm">
                  Non scommettere mai più dell'1-5% del tuo bankroll totale su una singola scommessa. Questo ti permette
                  di resistere a una serie di sconfitte senza esaurire il budget.
                </p>
              </Card>
              <div className="bg-slate-900 rounded-lg p-6 mb-4">
                <p className="text-slate-300 text-sm mb-2">
                  <strong className="text-white">Esempio:</strong>
                </p>
                <p className="text-slate-300 text-sm">
                  Se il tuo bankroll è di 100€, ogni singola scommessa dovrebbe essere tra 1€ e 5€.
                </p>
              </div>
            </section>
            <section id="errori" className="mb-8">
              <h2 className="text-white text-3xl mb-4">6. Errori comuni da evitare</h2>
              <div className="space-y-3 text-slate-300">
                <Card className="bg-red-500/10 border-red-500/20 p-5">
                  <p className="text-red-400 mb-2">❌ Inseguire le perdite</p>
                  <p className="text-slate-300 text-sm">
                    Aumentare le puntate dopo una perdita per recuperare è uno degli errori più pericolosi.
                  </p>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20 p-5">
                  <p className="text-red-400 mb-2">❌ Scommettere con il cuore</p>
                  <p className="text-slate-300 text-sm">
                    Non scommettere sempre sulla tua squadra del cuore. Sii obiettivo nell'analisi.
                  </p>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20 p-5">
                  <p className="text-red-400 mb-2">❌ Ignorare il valore</p>
                  <p className="text-slate-300 text-sm">
                    Una quota bassa non significa sempre una scommessa sicura. Cerca sempre il valore.
                  </p>
                </Card>
              </div>
            </section>
            <section id="responsabile" className="mb-8">
              <h2 className="text-white text-3xl mb-4">7. Gioco responsabile</h2>
              <Card className="bg-warn/10 border-warn/30 p-6">
                <p className="text-slate-300 mb-4">
                  Il gioco deve rimanere un divertimento. Se senti di perdere il controllo, chiedi aiuto.
                </p>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>• Stabilisci limiti di deposito e rispettali</li>
                  <li>• Non scommettere mai denaro che non puoi permetterti di perdere</li>
                  <li>• Fai pause regolari</li>
                  <li>• Non usare il gioco per risolvere problemi finanziari</li>
                  <li>
                    • Se hai bisogno di aiuto chiama il {rg.helplineName} ({rg.helplineOrg}):{" "}
                    <a href={rg.helplineHref} className="text-white underline underline-offset-2">
                      {rg.helplineNumber}
                    </a>
                    , gratuito e anonimo
                  </li>
                </ul>
              </Card>
            </section>
          </div>
          <Card className="bg-slate-900 border-slate-800 mt-12">
            <div className="p-6">
              <h3 className="text-white text-xl mb-4">Guide correlate</h3>
              <div className="space-y-3">
                <Link
                  to={paths.guide}
                  className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-5 h-5 text-slate-300" />
                  <div>
                    <p className="text-white text-sm">Come leggere le quote sportive</p>
                    <p className="text-slate-400 text-xs">5 min di lettura</p>
                  </div>
                </Link>
                <Link
                  to={paths.guide}
                  className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-5 h-5 text-slate-300" />
                  <div>
                    <p className="text-white text-sm">Strategie per le scommesse sul calcio</p>
                    <p className="text-slate-400 text-xs">10 min di lettura</p>
                  </div>
                </Link>
                <Link
                  to={paths.guide}
                  className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-5 h-5 text-slate-300" />
                  <div>
                    <p className="text-white text-sm">Gestione del budget</p>
                    <p className="text-slate-400 text-xs">6 min di lettura</p>
                  </div>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
