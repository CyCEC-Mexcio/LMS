// app/(platform)/teacher/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, User, BookOpen, CheckCircle } from "lucide-react";

export default function TeacherSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [message, setMessage]  = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profile, setProfile]  = useState({
    full_name:      "",
    bio:            "",
    avatar_url:     "",
    specialization: "", // stored in bio as structured data — see note below
  });

  // We store specialization as a separate field in profiles.
  // Since profiles table only has bio + avatar_url, we use bio for the long
  // description and a second update pattern for the instructor_name on courses.
  // If you want a dedicated specialization column, add it to the profiles table:
  // ALTER TABLE profiles ADD COLUMN specialization text;
  // For now we keep it simple and use the existing schema.

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
          full_name:      data.full_name  || "",
          bio:            data.bio        || "",
          avatar_url:     data.avatar_url || user.user_metadata?.avatar_url || "",
          specialization: "",
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

      // 1. Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name:  profile.full_name.trim(),
          bio:        profile.bio.trim(),
          avatar_url: profile.avatar_url.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. ✅ Auto-update instructor_name on all their courses
      // so the new name shows up immediately on course cards
      if (profile.full_name.trim()) {
        await supabase
          .from("courses")
          .update({ instructor_name: profile.full_name.trim() })
          .eq("teacher_id", user.id);
      }

      setMessage({ type: "success", text: "Perfil guardado. Tu nombre se actualizó en todos tus cursos." });
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
        <h1 className="text-3xl font-bold mb-1">Configuración de Instructor</h1>
        <p className="text-gray-600">
          Tu perfil se muestra a los estudiantes en cada curso que publiques
        </p>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Perfil Público
          </CardTitle>
          <CardDescription>
            Esta información aparece en la página de cada curso tuyo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
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
                Recomendado: foto profesional cuadrada. Tu foto de Google se usa si dejas esto vacío.
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
              placeholder="Tu nombre como aparecerá en los cursos"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Al guardar, este nombre se actualizará automáticamente en todos tus cursos
            </p>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Describe tu experiencia, certificaciones, y áreas de especialización..."
              rows={5}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {profile.bio.length}/500 caracteres recomendados
            </p>
          </div>

          {/* Feedback */}
          {message && (
            <div
              className={`flex items-start gap-2 text-sm px-4 py-3 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
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

      {/* What gets shown on courses */}
      <Card className="border-blue-100 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
            <BookOpen className="w-4 h-4" />
            Cómo apareces en tus cursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-blue-100">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 border flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                  {profile.full_name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {profile.full_name || "Tu nombre"}
              </p>
              <p className="text-sm text-gray-500 line-clamp-2">
                {profile.bio || "Tu biografía aparecerá aquí"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}