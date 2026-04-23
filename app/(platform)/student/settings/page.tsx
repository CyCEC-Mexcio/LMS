// app/(platform)/student/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, User, CheckCircle, Info } from "lucide-react";
import ProfileAvatarUpload from "@/components/profile-avatar-upload";

export default function StudentSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userId, setUserId]     = useState("");
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState("");
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
  const [profile, setProfile]   = useState({
    full_name: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Detect Google login
      const googleAvatar = user.user_metadata?.avatar_url || "";
      const provider = user.app_metadata?.provider;
      setIsGoogleUser(provider === "google");
      setGoogleAvatarUrl(googleAvatar);

      const { data } = await supabase
        .from("profiles")
        .select("full_name, bio, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        // Check if user has a custom avatar (different from Google one)
        const customAvatar = data.avatar_url && data.avatar_url !== googleAvatar;
        setHasCustomAvatar(!!customAvatar);

        setProfile({
          full_name:  data.full_name  || "",
          bio:        data.bio        || "",
          // Show custom avatar if set, otherwise Google avatar
          avatar_url: data.avatar_url || googleAvatar || "",
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

  const handleResetToGoogle = () => {
    if (googleAvatarUrl) {
      setProfile((p) => ({ ...p, avatar_url: googleAvatarUrl }));
      setHasCustomAvatar(false);
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
          {isGoogleUser && (
            <CardDescription className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Iniciaste sesión con Google. Tu foto de Google se usa por defecto.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div>
            <Label className="mb-2 block">Foto de perfil</Label>
            <ProfileAvatarUpload
              userId={userId}
              currentUrl={profile.avatar_url}
              fullName={profile.full_name}
              onUrlChange={(url) => {
                setProfile((p) => ({ ...p, avatar_url: url }));
                setHasCustomAvatar(!!url && url !== googleAvatarUrl);
              }}
            />

            {/* Reset to Google avatar button */}
            {isGoogleUser && hasCustomAvatar && googleAvatarUrl && (
              <button
                type="button"
                onClick={handleResetToGoogle}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                ← Volver a usar mi foto de Google
              </button>
            )}
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
    </div>
  );
}