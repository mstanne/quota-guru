import { useState } from "react";
import { useForm } from "react-hook-form";
import { Calendar, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Link } from "react-router";
import { paths } from "../routes";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import logo from "../assets/logo.png";

export function RegisterPage({ onLogin, onBack }: { onLogin?: () => void; onBack?: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();
  const password = watch("password");
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src={logo} alt="Quota Guru" className="w-16 h-16" />
            <span className="text-white text-3xl">Quota Guru</span>
          </div>
          <h1 className="text-white text-3xl mb-2">Crea il tuo account</h1>
          <p className="text-slate-400">Inizia a confrontare le migliori quote sportive</p>
        </div>
        <Card className="bg-slate-800 border-slate-700">
          <form
            onSubmit={handleSubmit((data) => {
              console.log("Register data:", data);
              alert("Registration functionality would be implemented here");
            })}
            className="p-6 space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300">
                Nome e cognome
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Mario Rossi"
                  className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-400"
                  {...register("fullName", {
                    required: "Nome completo richiesto",
                    minLength: {
                      value: 2,
                      message: "Il nome deve contenere almeno 2 caratteri",
                    },
                  })}
                />
              </div>
              {errors.fullName && <p className="text-red-400 text-sm">{String(errors.fullName.message)}</p>}
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-slate-300">
                Data di Nascita
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="dateOfBirth"
                  type="date"
                  className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-400"
                  {...register("dateOfBirth", {
                    required: "Data di nascita richiesta",
                    validate: (value) => {
                      const today = new Date();
                      const birthDate = new Date(value);
                      return today.getFullYear() - birthDate.getFullYear() >= 18 || "Devi avere almeno 18 anni";
                    },
                  })}
                />
              </div>
              {errors.dateOfBirth && <p className="text-red-400 text-sm">{String(errors.dateOfBirth.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimo 8 caratteri"
                  className="pl-10 pr-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-400"
                  {...register("password", {
                    required: "Password richiesta",
                    minLength: {
                      value: 8,
                      message: "La password deve contenere almeno 8 caratteri",
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: "La password deve contenere maiuscole, minuscole e numeri",
                    },
                  })}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm">{String(errors.password.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">
                Conferma password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ripeti la password"
                  className="pl-10 pr-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-400"
                  {...register("confirmPassword", {
                    required: "Conferma password richiesta",
                    validate: (value) => value === password || "Le password non corrispondono",
                  })}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm">{String(errors.confirmPassword.message)}</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptAge"
                  {...register("acceptAge", {
                    required: true,
                  })}
                  className="border-slate-600 data-[state=checked]:bg-action data-[state=checked]:border-action mt-0.5"
                />

                <label htmlFor="acceptAge" className="text-sm text-slate-300 cursor-pointer">
                  Confermo di avere almeno 18 anni
                </label>
              </div>
              {errors.acceptAge && <p className="text-red-400 text-sm">Devi confermare di avere almeno 18 anni</p>}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptTerms"
                  {...register("acceptTerms", {
                    required: true,
                  })}
                  className="border-slate-600 data-[state=checked]:bg-action data-[state=checked]:border-action mt-0.5"
                />

                <label htmlFor="acceptTerms" className="text-sm text-slate-300 cursor-pointer">
                  Accetto i{" "}
                  <Link to={paths.termini} className="text-action-text hover:text-action-text-hover">
                    Termini e condizioni
                  </Link>{" "}
                  e la{" "}
                  <Link to={paths.privacy} className="text-action-text hover:text-action-text-hover">
                    informativa privacy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && <p className="text-red-400 text-sm">Devi accettare i termini e condizioni</p>}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="newsletter"
                  {...register("newsletter")}
                  className="border-slate-600 data-[state=checked]:bg-action data-[state=checked]:border-action mt-0.5"
                />

                <label htmlFor="newsletter" className="text-sm text-slate-300 cursor-pointer">
                  Accetto di ricevere comunicazioni promozionali e aggiornamenti via email
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full bg-action hover:bg-action-hover text-action-foreground">
              Crea account
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">Hai già un account?</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onLogin}
              className="w-full bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              Accedi
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
