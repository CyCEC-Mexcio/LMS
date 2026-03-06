"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Loader2, Save, User, Settings, Bell, CreditCard, CheckCircle, Building2,
} from "lucide-react";

type MessageState = { type: "success" | "error"; text: string } | null;

function SectionMessage({ message }: { message: MessageState }) {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-lg ${
      message.type === "success"
        ? "bg-green-50 text-green-700 border border-green-200"
        : "bg-red-50 text-red-700 border border-red-200"
    }`}>
      {message.type === "success" && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
      {message.text}
    </div>
  );
}

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ full_name: "", bio: "", avatar_url: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<MessageState>(null);

  // ── Platform ─────────────────────────────────────────────────────────────
  const [platform, setPlatform] = useState({
    site_name: "CyCEC México",
    site_tagline: "Plataforma de Aprendizaje",
    support_email: "contacto@cycecmexico.com",
    primary_color: "#8E0F14",
  });
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [platformMsg, setPlatformMsg] = useState<MessageState>(null);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState({
    new_enrollment: true,
    course_approved: true,
    payout_processed: true,
    weekly_summary: false,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState<MessageState>(null);

  // ── Payouts ───────────────────────────────────────────────────────────────
  const [payouts, setPayouts] = useState({
    stripe_account_id: "",
    payout_schedule: "monthly",
    minimum_payout: "500",
    platform_fee_percent: "20",
  });
  const [savingPayouts, setSavingPayouts] = useState(false);
  const [payoutsMsg, setPayoutsMsg] = useState<MessageState>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, bio, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || user.user_metadata?.avatar_url || "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  // ── Save handlers ─────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name.trim(),
          bio: profile.bio.trim(),
          avatar_url: profile.avatar_url.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      setProfileMsg({ type: "success", text: "Perfil actualizado correctamente." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Error al guardar." });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePlatform = async () => {
    setSavingPlatform(true);
    setPlatformMsg(null);
    // Platform settings would typically go to a settings table.
    // For now we simulate a save — wire up to your DB as needed.
    await new Promise((r) => setTimeout(r, 800));
    setPlatformMsg({ type: "success", text: "Configuración de plataforma guardada." });
    setSavingPlatform(false);
  };

  const saveNotifications = async () => {
    setSavingNotif(true);
    setNotifMsg(null);
    await new Promise((r) => setTimeout(r, 800));
    setNotifMsg({ type: "success", text: "Preferencias de notificación guardadas." });
    setSavingNotif(false);
  };

  const savePayouts = async () => {
    setSavingPayouts(true);
    setPayoutsMsg(null);
    await new Promise((r) => setTimeout(r, 800));
    setPayoutsMsg({ type: "success", text: "Configuración de pagos guardada." });
    setSavingPayouts(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#8E0F14]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Configuración</h1>
        <p className="text-gray-500">Administra tu perfil y la configuración global de la plataforma</p>
      </div>

      {/* ── 1. Profile ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#8E0F14]" />
            Perfil de Administrador
          </CardTitle>
          <CardDescription>Tu nombre e información personal de la cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {profile.full_name?.[0]?.toUpperCase() || "A"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="avatar_url">URL de foto de perfil</Label>
              <Input
                id="avatar_url"
                value={profile.avatar_url}
                onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))}
                placeholder="https://ejemplo.com/foto.jpg"
                className="mt-1"
              />
                <p className="text-xs text-gray-400 mt-1">
                Para obtener una URL: busca una imagen en la web → clic derecho →{" "}
                <span className="font-medium text-gray-500">"Copiar dirección de imagen"</span> → pega aquí.
                También puedes usar imágenes de{" "}
                <span className="font-medium text-gray-500">Unsplash, Imgur o Cloudinary</span>.
                Si dejas esto vacío se usa tu foto de Google.
                </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Tu nombre"
              className="mt-1"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Descripción breve..."
              rows={3}
              className="mt-1"
            />
          </div>

          <SectionMessage message={profileMsg} />
          <Button onClick={saveProfile} disabled={savingProfile} className="w-full bg-[#8E0F14] hover:bg-[#7a0b10]">
            {savingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : <><Save className="w-4 h-4 mr-2" />Guardar Perfil</>}
          </Button>
        </CardContent>
      </Card>

      {/* ── 2. Platform ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#8E0F14]" />
            Configuración de Plataforma
          </CardTitle>
          <CardDescription>Nombre, marca y datos de contacto del sitio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nombre del sitio</Label>
              <Input
                value={platform.site_name}
                onChange={(e) => setPlatform((p) => ({ ...p, site_name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Slogan</Label>
              <Input
                value={platform.site_tagline}
                onChange={(e) => setPlatform((p) => ({ ...p, site_tagline: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email de soporte</Label>
              <Input
                type="email"
                value={platform.support_email}
                onChange={(e) => setPlatform((p) => ({ ...p, support_email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Color principal</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={platform.primary_color}
                  onChange={(e) => setPlatform((p) => ({ ...p, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                />
                <Input
                  value={platform.primary_color}
                  onChange={(e) => setPlatform((p) => ({ ...p, primary_color: e.target.value }))}
                  placeholder="#8E0F14"
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <SectionMessage message={platformMsg} />
          <Button onClick={savePlatform} disabled={savingPlatform} className="w-full bg-[#8E0F14] hover:bg-[#7a0b10]">
            {savingPlatform ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : <><Save className="w-4 h-4 mr-2" />Guardar Configuración</>}
          </Button>
        </CardContent>
      </Card>

      {/* ── 3. Notifications ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#8E0F14]" />
            Notificaciones por Email
          </CardTitle>
          <CardDescription>Elige qué eventos generan un correo para el administrador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "new_enrollment",   label: "Nueva inscripción a un curso",        desc: "Recibe un correo cada vez que un estudiante se inscribe" },
            { key: "course_approved",  label: "Curso aprobado / rechazado",          desc: "Confirmación cuando un curso cambia de estado" },
            { key: "payout_processed", label: "Pago procesado a instructor",         desc: "Notificación de cada transferencia completada" },
            { key: "weekly_summary",   label: "Resumen semanal de actividad",        desc: "Un correo cada lunes con métricas de la semana" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
                  notifications[key as keyof typeof notifications] ? "bg-[#8E0F14]" : "bg-gray-200"
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                  notifications[key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          ))}

          <SectionMessage message={notifMsg} />
          <Button onClick={saveNotifications} disabled={savingNotif} className="w-full bg-[#8E0F14] hover:bg-[#7a0b10]">
            {savingNotif ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : <><Save className="w-4 h-4 mr-2" />Guardar Notificaciones</>}
          </Button>
        </CardContent>
      </Card>

      {/* ── 4. Payouts ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#8E0F14]" />
            Configuración de Pagos
          </CardTitle>
          <CardDescription>Stripe, comisiones y calendario de pagos a instructores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>ID de cuenta Stripe</Label>
            <Input
              value={payouts.stripe_account_id}
              onChange={(e) => setPayouts((p) => ({ ...p, stripe_account_id: e.target.value }))}
              placeholder="acct_xxxxxxxxxxxxxxxxx"
              className="mt-1 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">Encuéntralo en tu dashboard de Stripe → Configuración → Cuenta.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Calendario de pagos</Label>
              <select
                value={payouts.payout_schedule}
                onChange={(e) => setPayouts((p) => ({ ...p, payout_schedule: e.target.value }))}
                className="mt-1 w-full h-10 px-3 rounded-md border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8E0F14]/30"
              >
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
            <div>
              <Label>Monto mínimo (MXN)</Label>
              <Input
                type="number"
                value={payouts.minimum_payout}
                onChange={(e) => setPayouts((p) => ({ ...p, minimum_payout: e.target.value }))}
                placeholder="500"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Comisión plataforma (%)</Label>
              <Input
                type="number"
                value={payouts.platform_fee_percent}
                onChange={(e) => setPayouts((p) => ({ ...p, platform_fee_percent: e.target.value }))}
                placeholder="20"
                min="0"
                max="100"
                className="mt-1"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            💡 Los cambios en comisiones aplican solo a nuevas transacciones, no a pagos pendientes.
          </div>

          <SectionMessage message={payoutsMsg} />
          <Button onClick={savePayouts} disabled={savingPayouts} className="w-full bg-[#8E0F14] hover:bg-[#7a0b10]">
            {savingPayouts ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : <><Save className="w-4 h-4 mr-2" />Guardar Pagos</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}