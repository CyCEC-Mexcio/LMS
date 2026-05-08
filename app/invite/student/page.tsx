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

        <Button onClick={handleGoogleSignIn} disabled={accepting} className="w-full h-12 text-base font-semibold">
          {accepting ? "Procesando..." : "Aceptar Invitación con Google"}
        </Button>

        <p className="mt-4 text-xs text-gray-400 text-center">
          Al aceptar, iniciarás sesión con Google y quedarás inscrito automáticamente en el curso.
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
