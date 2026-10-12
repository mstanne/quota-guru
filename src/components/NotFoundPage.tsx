import { Link } from "react-router";
import { Button } from "./ui/button";

export function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <p className="text-green-500 text-6xl mb-4">404</p>
      <h1 className="text-white text-3xl mb-3">Pagina non trovata</h1>
      <p className="text-slate-400 mb-8">La pagina che cerchi non esiste o è stata spostata.</p>
      <Button asChild className="bg-green-500 hover:bg-green-600 text-slate-950">
        <Link to="/">Torna alla home</Link>
      </Button>
    </div>
  );
}
