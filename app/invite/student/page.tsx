"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function StudentInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const token = searchParams.get("token") || "";

  const [inviteData, setInviteData] = useState<any>(null);
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setError("Token de invitación no válido");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("student_invites")
          .select("*, courses(title, slug)")
          .eq("invite_token", token)
          .single();

        if (fetchError || !data) {
          setError("Invitación no encontrada o ya utilizada");
          setLoading(false);
          return;
        }

        if (data.accepted) {
          setError("Esta invitación ya fue aceptada");
          setLoading(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError("Esta invitación ha expirado");
          setLoading(false);
          return;
        }

        setInviteData(data);
        setCourseName((data as any).courses?.title || "Curso");
      } catch (err) {
        setError("Error al cargar la invitación");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  // Check if user is already logged in — if so, accept directly
  useEffect(() => {
    if (!inviteData) return;

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await acceptInvite(user.id);
      }
    };
    checkAuth();
  }, [inviteData]);

  const acceptInvite = async (userId: string) => {
    setAccepting(true);
    try {
      // Mark invite as accepted
      await supabase
        .from("student_invites")
        .update({ accepted: true, accepted_at: new Date().toISOString() })
        .eq("invite_token", token);

      // The enrollment is handled by claim_pending_enrollments
      // which already ran during OAuth callback,
      // but let's also try to claim now in case
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase.rpc("claim_pending_enrollments", {
          user_id: user.id,
          user_email: user.email,
        });
      }

      router.push("/student/courses");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al aceptar la invitación");
      setAccepting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAccepting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(`/invite/student?token=${token}`)}`,
      },
    });
    if (error) {
      setError(error.message);
      setAccepting(false);
    }
  };

  // ── Price display ───────────────────────────────────────────────────────
  const getPriceDisplay = () => {
    if (!inviteData) return "";
    if (inviteData.override_price === 0) return "¡GRATIS!";
    if (inviteData.discount_percent)
      return `${inviteData.discount_percent}% de descuento — $${Number(inviteData.override_price).toFixed(2)} MXN`;
    if (inviteData.override_price != null)
      return `$${Number(inviteData.override_price).toFixed(2)} MXN`;
    return "Precio completo";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitación No Válida</h1>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => router.push("/")} className="mt-6">Ir al Inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¡Estás invitado!</h1>
          <p className="text-gray-600 mt-2">
            Has recibido una invitación para inscribirte en un curso.
          </p>
        </div>

        {/* Course card */}
        <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Curso</p>
          <p className="text-lg font-bold text-gray-900 mb-3">{courseName}</p>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${inviteData?.override_price === 0 ? "text-green-600" : "text-red-700"}`}>
              {getPriceDisplay()}
            </span>
          </div>
        </div>

        {inviteData?.note && (
          <div className="mb-6 p-4 bg-red-50 border-l-3 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700 uppercase font-semibold mb-1">Mensaje</p>
            <p className="text-sm text-gray-700">{inviteData.note}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Primary: Google sign-in */}
        <button onClick={handleGoogleSignIn} disabled={accepting}
          className="w-full h-12 flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 shadow-sm">
          {accepting ? "Procesando..." : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Secondary: email/password login */}
        <Button variant="outline" onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/invite/student?token=${token}`)}`)}
          disabled={accepting} className="w-full">
          Iniciar sesión con correo y contraseña
        </Button>

        <p className="mt-4 text-xs text-gray-400 text-center">
          Al aceptar, iniciarás sesión y quedarás inscrito automáticamente en el curso.
        </p>
      </div>
    </div>
  );
}

export default function StudentInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
            <p className="mt-4 text-gray-600">Cargando invitación...</p>
          </div>
        </div>
      }
    >
      <StudentInviteContent />
    </Suspense>
  );
}
