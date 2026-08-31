"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  LogOut,
  ArrowRight,
  BookOpen,
  UserCheck,
} from "lucide-react";

type InviteStatus = "valid" | "not_found" | "expired" | "already_used" | "error";

function StudentInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const token = searchParams.get("token") || "";

  const [inviteData, setInviteData] = useState<any>(null);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<InviteStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Fetch invite & status ───────────────────────────────────────────────
  useEffect(() => {
    const fetchInviteAndUser = async () => {
      if (!token) {
        setErrorStatus("not_found");
        setErrorMessage("Invitación no válida");
        setLoading(false);
        return;
      }

      try {
        // 1. Get current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);

        // 2. Fetch invite via public RLS (works for anon if active & not expired)
        const { data, error: fetchError } = await supabase
          .from("student_invites")
          .select("*, courses(id, title, slug, instructor_name, price)")
          .eq("invite_token", token)
          .maybeSingle();

        if (data && !fetchError) {
          // Verify expiry client-side as well
          if (data.expires_at && new Date(data.expires_at) < new Date()) {
            setErrorStatus("expired");
            setErrorMessage("Esta invitación ha expirado");
            setLoading(false);
            return;
          }

          if (data.accepted) {
            setErrorStatus("already_used");
            setErrorMessage("Esta invitación ya fue utilizada");
            setLoading(false);
            return;
          }

          setInviteData(data);
          setCourseInfo(data.courses || null);
          setLoading(false);
          return;
        }

        // 3. If anon RLS returned no row, query server status fallback using service role
        const statusRes = await fetch(
          `/api/invite/student/status?token=${encodeURIComponent(token)}`
        );
        const statusJson = await statusRes.json();

        if (statusJson.status === "already_used") {
          setErrorStatus("already_used");
          setErrorMessage("Esta invitación ya fue utilizada");
        } else if (statusJson.status === "expired") {
          setErrorStatus("expired");
          setErrorMessage("Esta invitación ha expirado");
        } else if (statusJson.status === "valid" && statusJson.invite) {
          setInviteData(statusJson.invite);
          setCourseInfo(statusJson.invite.courses || null);
        } else {
          setErrorStatus("not_found");
          setErrorMessage("Invitación no válida");
        }
      } catch (err: any) {
        console.error("Error loading invite:", err);
        setErrorStatus("not_found");
        setErrorMessage("Invitación no válida");
      } finally {
        setLoading(false);
      }
    };

    fetchInviteAndUser();
  }, [token]);

  // ── Accept Invite via Postgres RPC ──────────────────────────────────────
  const handleAcceptInvite = async () => {
    if (!token) return;
    setAccepting(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("Debes iniciar sesión para aceptar la invitación.");
        setAccepting(false);
        return;
      }

      // Strictly execute accept_student_invite RPC
      const { data, error: rpcError } = await supabase.rpc(
        "accept_student_invite",
        { p_token: token }
      );

      if (rpcError) {
        const msg = rpcError.message || "";
        console.error("accept_student_invite RPC error:", rpcError);

        if (msg.includes("email_mismatch")) {
          setErrorMessage(
            `Esta invitación fue enviada a ${
              inviteData?.email || "otro correo"
            }. Inicia sesión con ese correo para aceptarla.`
          );
        } else if (msg.includes("invite_already_used")) {
          setErrorStatus("already_used");
          setErrorMessage("Esta invitación ya fue utilizada.");
        } else if (msg.includes("invite_expired")) {
          setErrorStatus("expired");
          setErrorMessage("Esta invitación ha expirado.");
        } else if (msg.includes("not_authenticated") || msg.includes("permission denied")) {
          setErrorMessage("Debes iniciar sesión para aceptar la invitación.");
        } else if (msg.includes("invite_not_found")) {
          setErrorStatus("not_found");
          setErrorMessage("Invitación no válida.");
        } else {
          setErrorMessage(
            rpcError.message || "Error al aceptar la invitación. Intenta de nuevo."
          );
        }
        setAccepting(false);
        return;
      }

      // Success: redirect to student dashboard/courses
      router.push("/student/courses");
      router.refresh();
    } catch (err: any) {
      console.error("Exception accepting invite:", err);
      setErrorMessage(err.message || "Error inesperado al aceptar la invitación.");
      setAccepting(false);
    }
  };

  // ── Google Sign-in Handler ──────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setAccepting(true);
    setErrorMessage(null);

    const redirectUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
      `/invite/student?token=${token}`
    )}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setAccepting(false);
    }
  };

  // ── Sign out handler (to switch account) ─────────────────────────────────
  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setErrorMessage(null);
    setLoading(false);
  };

  // ── Price Display Formatter ─────────────────────────────────────────────
  const getPriceDisplay = () => {
    if (!inviteData) return "";
    if (inviteData.override_price === 0) return "¡GRATIS!";
    if (inviteData.discount_percent) {
      return `${inviteData.discount_percent}% de descuento — $${Number(
        inviteData.override_price
      ).toFixed(2)} MXN`;
    }
    if (inviteData.override_price != null) {
      return `$${Number(inviteData.override_price).toFixed(2)} MXN`;
    }
    if (courseInfo?.price != null) {
      return courseInfo.price === 0
        ? "¡GRATIS!"
        : `$${Number(courseInfo.price).toFixed(2)} MXN`;
    }
    return "Invitación Especial";
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  // ── Error / Invalid / Expired / Already Used states ──────────────────────
  if (errorStatus && errorStatus !== "valid" && !inviteData) {
    let title = "Invitación No Válida";
    let icon = <XCircle className="w-10 h-10 text-red-600" />;
    let desc = errorMessage || "Invitación no válida";
    let bgIcon = "bg-red-100";

    if (errorStatus === "expired") {
      title = "Esta invitación ha expirado";
      icon = <Clock className="w-10 h-10 text-amber-600" />;
      desc = "El periodo de validez para este enlace ha concluido. Solicita una nueva invitación al instructor.";
      bgIcon = "bg-amber-100";
    } else if (errorStatus === "already_used") {
      title = "Esta invitación ya fue utilizada";
      icon = <CheckCircle2 className="w-10 h-10 text-blue-600" />;
      desc = "Esta invitación ya ha sido aceptado previamente. Si ya te registraste, inicia sesión para acceder a tu curso.";
      bgIcon = "bg-blue-100";
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div
            className={`w-20 h-20 ${bgIcon} rounded-full flex items-center justify-center mx-auto mb-5`}
          >
            {icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">{desc}</p>
          <div className="flex flex-col gap-3">
            {errorStatus === "already_used" ? (
              <Button
                onClick={() => router.push("/login?redirect=/student/courses")}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2.5 rounded-xl"
              >
                Iniciar Sesión
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              Ir al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check email match if user is logged in
  const isEmailMismatch =
    currentUser &&
    currentUser.email &&
    inviteData?.email &&
    currentUser.email.toLowerCase() !== inviteData.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4 py-12">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl max-w-lg w-full border border-gray-100">
        {/* Header Badge & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-red-200">
            <span className="text-white text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            ¡Has sido invitado a un curso!
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Has recibido una invitación para unirte a la plataforma de CYCEC México.
          </p>
        </div>

        {/* Course details card */}
        <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Detalles del Curso</span>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-3">
            {courseInfo?.title || "Curso CYCEC México"}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200/70 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Instructor</p>
              <p className="font-semibold text-gray-800">
                {courseInfo?.instructor_name || "CYCEC México"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Precio</p>
              <p
                className={`font-bold ${
                  inviteData?.override_price === 0
                    ? "text-green-600 font-extrabold"
                    : "text-red-700"
                }`}
              >
                {getPriceDisplay()}
              </p>
            </div>
          </div>
        </div>

        {/* Recipient email banner */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            Invitación personal para
          </p>
          <p className="text-sm font-bold text-slate-900 break-all">
            {inviteData?.full_name ? `${inviteData.full_name} (${inviteData.email})` : inviteData?.email}
          </p>
        </div>

        {/* Optional note from instructor/admin */}
        {inviteData?.note && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
              Mensaje del instructor
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{inviteData.note}</p>
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* ── AUTHENTICATED USER STATE ── */}
        {currentUser ? (
          <div className="space-y-4">
            {/* User status box */}
            <div
              className={`p-4 rounded-xl border ${
                isEmailMismatch
                  ? "bg-amber-50 border-amber-200"
                  : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isEmailMismatch ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500 font-medium">
                      Sesión activa como
                    </p>
                    <p className="text-sm font-bold text-gray-900 break-all">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cambiar
                </button>
              </div>

              {isEmailMismatch && (
                <p className="text-xs text-amber-800 mt-2.5 pt-2 border-t border-amber-200/60 leading-relaxed">
                  ⚠️ Esta invitación está asignada a{" "}
                  <strong>{inviteData?.email}</strong>. Debes iniciar sesión con ese
                  correo para poder aceptarla.
                </p>
              )}
            </div>

            {/* Accept Button */}
            <Button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Aceptando invitación...
                </>
              ) : (
                <>
                  Aceptar Invitación
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          /* ── UNAUTHENTICATED VISITOR STATE ── */
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-xl text-center">
              <p className="text-xs font-semibold text-amber-900">
                Inicia sesión o regístrate con tu correo{" "}
                <span className="underline font-bold">{inviteData?.email}</span> para
                aceptar la invitación.
              </p>
            </div>

            {/* Google sign-in */}
            <button
              onClick={handleGoogleSignIn}
              disabled={accepting}
              className="w-full h-12 flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-all disabled:opacity-50 shadow-sm"
            >
              {accepting ? (
                "Conectando..."
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">o</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email login button */}
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/login?redirect=${encodeURIComponent(
                    `/invite/student?token=${token}`
                  )}&email=${encodeURIComponent(inviteData?.email || "")}`
                )
              }
              disabled={accepting}
              className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium"
            >
              Iniciar sesión con contraseña
            </Button>

            {/* Signup button */}
            <Button
              variant="ghost"
              onClick={() =>
                router.push(
                  `/signup?redirect=${encodeURIComponent(
                    `/invite/student?token=${token}`
                  )}&email=${encodeURIComponent(inviteData?.email || "")}`
                )
              }
              disabled={accepting}
              className="w-full text-xs text-gray-500 hover:text-red-700"
            >
              ¿No tienes cuenta? Regístrate aquí
            </Button>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
          Al aceptar la invitación, tu inscripción al curso quedará confirmada de forma automática.
        </p>
      </div>
    </div>
  );
}

export default function StudentInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
            <p className="mt-4 text-gray-600 font-medium">Cargando invitación...</p>
          </div>
        </div>
      }
    >
      <StudentInviteContent />
    </Suspense>
  );
}
