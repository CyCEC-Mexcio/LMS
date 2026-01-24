"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function InstructorInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const token = searchParams.get("token") || "";

  const [inviteData, setInviteData] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
          .from("instructor_invites")
          .select("*")
          .eq("invite_token", token)
          .eq("accepted", false)
          .single();

        if (fetchError || !data) {
          setError("Invitación no encontrada o ya utilizada");
          setLoading(false);
          return;
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setError("Esta invitación ha expirado");
          setLoading(false);
          return;
        }

        setInviteData(data);
      } catch (err) {
        setError("Error al cargar la invitación");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token, supabase]);

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setSubmitting(false);
      return;
    }

    try {
      // Sign up the instructor
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.email,
        password,
        options: {
          data: {
            full_name: inviteData.full_name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Update their profile to teacher role
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: "teacher" })
          .eq("id", data.user.id);

        if (updateError) throw updateError;

        // Mark invite as accepted
        await supabase
          .from("instructor_invites")
          .update({ accepted: true })
          .eq("invite_token", token);

        // Redirect to teacher dashboard
        router.push("/teacher");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invitación No Válida
          </h1>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => router.push("/")} className="mt-6">
            Ir al Inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">👨‍🏫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido, Instructor!
          </h1>
          <p className="text-gray-600 mt-2">
            Has sido invitado a unirte como instructor
          </p>
        </div>

        {inviteData?.message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{inviteData.message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleAcceptInvite} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              type="text"
              value={inviteData?.full_name || ""}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={inviteData?.email || ""}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="password">Crear Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={submitting}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              disabled={submitting}
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creando cuenta..." : "Aceptar Invitación"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Nota:</strong> Al aceptar esta invitación, tu cuenta será
            configurada automáticamente como Instructor y podrás comenzar a
            crear cursos.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InstructorInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando invitación...</p>
        </div>
      </div>
    }>
      <InstructorInviteContent />
    </Suspense>
  );
}