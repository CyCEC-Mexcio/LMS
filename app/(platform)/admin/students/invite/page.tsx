"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, RefreshCw, XCircle, Clock, CheckCircle, AlertCircle, Copy, ChevronDown } from "lucide-react";

type Course = { id: string; title: string; price: number | null };
type Invite = {
  id: string;
  email: string;
  full_name: string | null;
  course_id: string;
  override_price: number | null;
  discount_percent: number | null;
  accepted: boolean;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  invite_url: string | null;
  note: string | null;
  courses?: { title: string } | null;
};

type PricingMode = "full" | "free" | "discount";

export default function StudentInvitePage() {
  const supabase = createClient();

  // ── Form state ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [pricingMode, setPricingMode] = useState<PricingMode>("full");
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [overridePrice, setOverridePrice] = useState<number>(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Data state ──────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [role, setRole] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Load courses + invites ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (!profile) return;
      setRole(profile.role);

      // Courses: admin sees all, teacher sees own
      let cq = supabase.from("courses").select("id, title, price");
      if (profile.role === "teacher") cq = cq.eq("teacher_id", user.id);
      const { data: cData } = await cq.order("title");
      setCourses(cData || []);

      // Invites
      let iq = supabase
        .from("student_invites")
        .select("*, courses(title)")
        .order("created_at", { ascending: false });
      if (profile.role === "teacher") iq = iq.eq("invited_by", user.id);
      const { data: iData } = await iq;
      setInvites(iData || []);
      setLoadingData(false);
    };
    load();
  }, []);

  // ── Refresh invites ─────────────────────────────────────────────────────
  const refreshInvites = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let iq = supabase
        .from("student_invites")
        .select("*, courses(title)")
        .order("created_at", { ascending: false });
      if (role === "teacher") iq = iq.eq("invited_by", user.id);
      const { data } = await iq;
      setInvites(data || []);
    } catch (err) {
      console.error("Error refreshing invites:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // ── Send invite ─────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/invite-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          courseId,
          pricingMode,
          discountPercent: pricingMode === "discount" ? discountPercent : null,
          overridePrice: pricingMode === "discount" ? overridePrice : null,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      if (data.warning) {
        setSuccess(`⚠️ ${data.warning}\n\nEnlace: ${data.inviteUrl}`);
      } else {
        setSuccess(`¡Invitación enviada exitosamente a ${email}!`);
      }
      setEmail(""); setFullName(""); setCourseId(""); setPricingMode("full"); setNote("");
      refreshInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Cancel invite ───────────────────────────────────────────────────────
  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("student_invites").delete().eq("id", id);
    if (!error) refreshInvites();
  };

  // ── Resend invite ──────────────────────────────────────────────────────
  const handleResend = async (invite: Invite) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invite-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invite.email,
          fullName: invite.full_name,
          courseId: invite.course_id,
          pricingMode: invite.override_price === 0 ? "free" : invite.override_price != null ? "discount" : "full",
          discountPercent: invite.discount_percent,
          overridePrice: invite.override_price,
          note: invite.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Invitación reenviada a ${invite.email}`);
      refreshInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Status helpers ──────────────────────────────────────────────────────
  const getStatus = (inv: Invite) => {
    if (inv.accepted) return { label: "Aceptado", color: "bg-green-100 text-green-700", icon: CheckCircle };
    if (new Date(inv.expires_at) < new Date()) return { label: "Expirada", color: "bg-gray-100 text-gray-500", icon: AlertCircle };
    return { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock };
  };

  const selectedCourse = courses.find((c) => c.id === courseId);

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loadingData) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
        <p className="text-gray-500 mt-4 text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-1">Invitar Estudiantes</h1>
        <p className="text-slate-300 text-sm">
          Envía invitaciones a estudiantes para inscribirlos en un curso con precio personalizado.
        </p>
      </div>

      {/* ── Send Form ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Send size={18} className="text-blue-600" />
            Enviar Invitación
          </h2>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-5">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm whitespace-pre-line">{success}</p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inv-email">Correo del Estudiante *</Label>
              <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="estudiante@example.com" required disabled={loading} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="inv-name">Nombre Completo (Opcional)</Label>
              <Input id="inv-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Pérez" disabled={loading} className="mt-1" />
            </div>
          </div>

          {/* Course selector */}
          <div>
            <Label htmlFor="inv-course">Curso *</Label>
            <div className="relative mt-1">
              <select id="inv-course" value={courseId} onChange={(e) => setCourseId(e.target.value)}
                required disabled={loading}
                className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50">
                <option value="">Seleccionar curso...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.price ? `($${Number(c.price).toFixed(2)} MXN)` : "(Gratuito)"}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Pricing mode */}
          <div>
            <Label>Precio para el Estudiante</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                { value: "full", label: "Precio Completo", desc: !selectedCourse ? "Selecciona un curso" : selectedCourse.price ? `$${Number(selectedCourse.price).toFixed(2)} MXN` : "Gratuito" },
                { value: "free", label: "Gratis", desc: "$0 MXN" },
                { value: "discount", label: "Descuento Personalizado", desc: "% o precio fijo" },
              ] as const).map((opt) => (
                <button key={opt.value} type="button" disabled={loading}
                  onClick={() => setPricingMode(opt.value)}
                  className={`flex-1 min-w-[140px] p-3 rounded-lg border-2 text-left transition-all ${
                    pricingMode === opt.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <p className={`text-sm font-semibold ${pricingMode === opt.value ? "text-blue-700" : "text-gray-700"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {pricingMode === "discount" && (
              <div className="mt-3 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="inv-disc">Porcentaje de Descuento (%)</Label>
                  <Input id="inv-disc" type="number" min={1} max={100}
                    value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    disabled={loading} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="inv-fixed">O Precio Fijo (MXN)</Label>
                  <Input id="inv-fixed" type="number" min={0} step="0.01"
                    value={overridePrice} onChange={(e) => setOverridePrice(Number(e.target.value))}
                    disabled={loading} className="mt-1" />
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="inv-note">Mensaje para el Estudiante (Opcional)</Label>
            <Textarea id="inv-note" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: ¡Bienvenido al equipo! Este curso es parte de tu capacitación..."
              rows={3} disabled={loading} className="mt-1" />
          </div>

          <Button type="submit" disabled={loading || !courseId} className="w-full md:w-auto">
            {loading ? "Enviando..." : "Enviar Invitación"}
          </Button>
        </form>
      </div>

      {/* ── Pending Invites Table ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Invitaciones Enviadas</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{invites.length} total</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshInvites}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-all disabled:opacity-60"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-blue-600" : ""} />
            {refreshing ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>

        {invites.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Send size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No hay invitaciones aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Estudiante</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Enviada</th>
                  <th className="px-4 py-3">Expira</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invites.map((inv) => {
                  const status = getStatus(inv);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{inv.full_name || "—"}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{inv.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate max-w-[160px] text-gray-700">
                          {(inv as any).courses?.title || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {inv.override_price === 0 ? (
                          <span className="text-green-600 font-semibold">Gratis</span>
                        ) : inv.discount_percent ? (
                          <span className="text-blue-600">{inv.discount_percent}% desc.</span>
                        ) : inv.override_price != null ? (
                          <span>${Number(inv.override_price).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">Completo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(inv.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(inv.expires_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {inv.invite_url && (
                            <button onClick={() => copyLink(inv.invite_url!, inv.id)}
                              title="Copiar enlace"
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                              <Copy size={14} />
                              {copiedId === inv.id && <span className="absolute mt-6 -ml-6 text-[10px] text-green-600 bg-green-50 px-1 rounded">Copiado</span>}
                            </button>
                          )}
                          {!inv.accepted && new Date(inv.expires_at) > new Date() && (
                            <button onClick={() => handleResend(inv)} title="Reenviar"
                              className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleCancel(inv.id)}
                            title={inv.accepted ? "Eliminar registro" : "Cancelar invitación"}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Cómo Funciona</h3>
        <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
          <li>Selecciona un curso y el precio que deseas ofrecer al estudiante</li>
          <li>El estudiante recibirá un correo con los detalles y un enlace de invitación</li>
          <li>Al hacer clic, podrán iniciar sesión con Google y quedarán inscritos automáticamente</li>
          <li>Si ya tienen cuenta, la inscripción se aplica al instante</li>
          <li>Las invitaciones expiran en 7 días</li>
        </ol>
      </div>
    </div>
  );
}
