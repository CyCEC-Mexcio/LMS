// app/(platform)/student/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, User } from "lucide-react";

export default function StudentSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profile, setProfile]   = useState({
    full_name: "",
    bio: "",
    avatar_url: "",
  });

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
          full_name:  data.full_name  || "",
          bio:        data.bio        || "",
          // Fall back to Google avatar if no custom one set
          avatar_url: data.avatar_url || user.user_metadata?.avatar_url || "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name:  profile.full_name.trim(),
          bio:        profile.bio.trim(),
          avatar_url: profile.avatar_url.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      setMessage({ type: "success", text: "Perfil actualizado correctamente." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error al guardar." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Configuración</h1>
        <p className="text-gray-600">Actualiza tu perfil de estudiante</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {profile.full_name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="avatar_url">URL de foto de perfil</Label>
              <Input
                id="avatar_url"
                value={profile.avatar_url}
                onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))}
                placeholder="https://ejemplo.com/tu-foto.jpg"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pega la URL de una imagen. Tu foto de Google se usa si no ingresas una.
              </p>
            </div>
          </div>

          {/* Full name */}
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
            <Label htmlFor="bio">Sobre mí</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Cuéntanos un poco sobre ti..."
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Feedback */}
          {message && (
            <div
              className={`text-sm px-4 py-2 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Guardar Cambios</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}