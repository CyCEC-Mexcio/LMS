"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, GraduationCap, Award, BadgeCheck } from "lucide-react";
import Image from "next/image";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get("redirect");
  const supabase = createClient();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setStep("password");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : error.message);
      setLoading(false);
    } else {
      if (explicitRedirect) { router.replace(explicitRedirect); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      const roleRedirects: { [key: string]: string } = { admin: "/admin", teacher: "/teacher", student: "/student" };
      router.replace(profile?.role ? (roleRedirects[profile.role] || "/student") : "/student");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${explicitRedirect ? `?redirect=${encodeURIComponent(explicitRedirect)}` : ""}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #3d0404 0%, #621010 30%, #8a1515 55%, #5a0808 80%, #250202 100%)" }}>
      
      {/* Noise overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "256px" }} />

      {/* Back button */}
      <Link href="/" className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Inicio
      </Link>

      {/* LEFT PANEL — branding, hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative">
        {/* Decorative circle */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #ff6b6b 0%, transparent 70%)", transform: "translate(-30%, -30%)" }} />

        <div className="relative w-56 h-20 xl:w-80 xl:h-28">
          <Image src="/images/Logo.jpg" alt="CyCEC México" fill className="object-contain object-left" />
        </div>

        <div className="space-y-10">
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Capacitación profesional con respaldo oficial
            </h2>
            <p className="text-white/60 text-lg leading-relaxed">
              Certifícate con estándares CONOCER y lleva tu carrera al siguiente nivel.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { icon: Award, text: "Certificaciones reconocidas a nivel nacional" },
              { icon: BadgeCheck, text: "Cursos alineados a normas ISO y CONOCER" },
              { icon: GraduationCap, text: "Instructores certificados con experiencia real" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-white/80" />
                </div>
                <span className="text-white/70 text-sm leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs">© 2025 CYCEC México. Todos los derechos reservados.</p>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:px-16">
        {/* Mobile logo */}
        <div className="relative w-52 h-16 mb-10 lg:hidden">
          <Image src="/images/Logo.jpg" alt="CyCEC México" fill className="object-contain object-left" />
        </div>

        <div className="w-full max-w-md bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/30">
          
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-white text-2xl font-bold tracking-tight mb-1">
              {step === "email" ? "Iniciar Sesión" : `Hola, ${email.split("@")[0]}`}
            </h1>
            <p className="text-white/50 text-sm">
              {step === "email" ? "Accede a tu cuenta de CYCEC México" : email}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-400/25 text-red-300 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Email step */}
          {step === "email" && (
            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Correo electrónico</label>
                <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoFocus autoComplete="email"
                  className="w-full bg-white/[0.08] border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/40 focus:bg-white/[0.12] transition-all" />
              </div>
              <button type="submit" disabled={!email}
                className="w-full bg-white text-gray-900 font-semibold rounded-xl px-4 py-3 text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-40 shadow-lg shadow-black/20">
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Password step */}
          {step === "password" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} required autoFocus autoComplete="current-password"
                    className="w-full bg-white/[0.08] border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/40 focus:bg-white/[0.12] transition-all pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/65 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={!password || loading}
                className="w-full bg-white text-gray-900 font-semibold rounded-xl px-4 py-3 text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-40 shadow-lg shadow-black/20">
                {loading ? (<><span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />Ingresando...</>) : (<>Iniciar Sesión <ArrowRight className="h-4 w-4" /></>)}
              </button>
              <button type="button" onClick={() => { setStep("email"); setError(null); setPassword(""); }}
                className="w-full text-white/40 hover:text-white/65 text-xs transition-colors text-center pt-1">
                ← Usar otro correo
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">o</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google */}
          <button type="button" onClick={handleGoogleLogin} disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl px-4 py-3 text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-md shadow-black/20">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Footer links */}
          <div className="mt-7 space-y-4">
            <p className="text-white/40 text-sm text-center">
              ¿No tienes cuenta?{" "}
              <Link href="/signup" className="text-white/70 hover:text-white underline underline-offset-2 transition-colors">Regístrate gratis</Link>
            </p>
            <p className="text-white/20 text-xs text-center leading-relaxed">
              Al continuar aceptas los{" "}
              <Link href="/terminos-condiciones" className="text-white/35 hover:text-white/55 underline underline-offset-1 transition-colors">Términos y Condiciones</Link>
              {" "}y el{" "}
              <Link href="/aviso-privacidad" className="text-white/35 hover:text-white/55 underline underline-offset-1 transition-colors">Aviso de Privacidad</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3d0404 0%, #621010 30%, #8a1515 55%, #5a0808 80%, #250202 100%)" }}>
        <div className="w-7 h-7 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}