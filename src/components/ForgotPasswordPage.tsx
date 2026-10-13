import { useState } from "react";
import { useForm } from "react-hook-form";
import { CircleCheckBig, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import logo from "../assets/logo.png";

export function ForgotPasswordPage({ onBack, onLogin }: { onBack?: () => void; onLogin?: () => void }) {
  const [emailSent, setEmailSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();
  const onSubmit = (data) => {
    console.log("Forgot password data:", data);
    setEmailSent(true);
  };
  return emailSent ? (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-best/20 rounded-full flex items-center justify-center">
                <CircleCheckBig className="w-8 h-8 text-slate-300" />
              </div>
            </div>
            <div>
              <h2 className="text-white text-2xl mb-2">Email inviata</h2>
              <p className="text-slate-300">Ti abbiamo inviato un link per reimpostare la password all'indirizzo:</p>
              <p className="text-slate-400 text-sm mt-2">{getValues("email")}</p>
            </div>
            <Button onClick={onLogin} className="w-full bg-action hover:bg-action-hover text-action-foreground">
              Torna al Login
            </Button>
          </div>
        </Card>
        <div className="text-center mt-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-300 text-sm transition-colors cursor-pointer"
          >
            ← Torna alla Home
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src={logo} alt="Quota Guru" className="w-16 h-16" />
            <span className="text-white text-3xl">Quota Guru</span>
          </div>
          <h1 className="text-white text-3xl mb-2">Password dimenticata?</h1>
          <p className="text-slate-400">Inserisci la tua email per ricevere il link di reset</p>
        </div>
        <Card className="bg-slate-800 border-slate-700">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tua.email@esempio.com"
                  className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-400"
                  {...register("email", {
                    required: "Email richiesta",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Indirizzo email non valido",
                    },
                  })}
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm">{String(errors.email.message)}</p>}
            </div>
            <Button type="submit" className="w-full bg-action hover:bg-action-hover text-action-foreground">
              Invia il link di reimpostazione
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">oppure</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onLogin}
              className="w-full bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              Torna al Login
            </Button>
          </form>
        </Card>
        <div className="text-center mt-4">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-300 text-sm transition-colors cursor-pointer"
          >
            ← Torna alla Home
          </button>
        </div>
      </div>
    </div>
  );
}
