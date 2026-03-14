"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Calendar, BookOpen, Award, DollarSign,
  Users as UsersIcon, Upload, Save, Percent,
  CheckCircle2, AlertCircle, Loader2, Pencil, X,
} from "lucide-react";
import Link from "next/link";

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  bio: string | null;
  platform_fee_percent: number | null;
  created_at: string | null;
  email?: string | null;
};

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Edit form ─────────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [platformFeePercent, setPlatformFeePercent] = useState(10);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch profile + details ───────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await window.fetch(`/api/admin/users/${userId}`);
        if (!res.ok) throw new Error();
        const { profile: p, details } = await res.json();
        setProfile(p);
        setUserDetails(details);
        setFullName(p.full_name ?? "");
        setBio(p.bio ?? "");
        setPlatformFeePercent(p.platform_fee_percent ?? 10);
        setAvatarUrl(p.avatar_url);
      } catch {
        showToast("error", "No se pudo cargar el usuario");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
      showToast("success", "Imagen cargada — guarda para aplicar");
    } catch (err: any) {
      showToast("error", err.message || "Error al subir imagen");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Save changes ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await window.fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, bio, avatar_url: avatarUrl, platform_fee_percent: platformFeePercent }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al guardar");
      }
      // Update local profile state to reflect saved changes
      setProfile((prev) => prev ? { ...prev, full_name: fullName, bio, avatar_url: avatarUrl, platform_fee_percent: platformFeePercent } : prev);
      setAvatarPreview(null);
      setEditMode(false);
      showToast("success", "Perfil actualizado correctamente");
    } catch (err: any) {
      showToast("error", err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    setPlatformFeePercent(profile.platform_fee_percent ?? 10);
    setAvatarUrl(profile.avatar_url);
    setAvatarPreview(null);
    setEditMode(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const roleLabel: Record<string, string> = { admin: "Administrador", teacher: "Instructor", student: "Estudiante" };
  const roleColor: Record<string, string> = {
    admin: "bg-orange-100 text-orange-800 border-orange-300",
    teacher: "bg-purple-100 text-purple-800 border-purple-300",
    student: "bg-blue-100 text-blue-800 border-blue-300",
  };
  const displayAvatar = avatarPreview || avatarUrl || profile?.avatar_url;
  const displayName = editMode ? fullName : (profile?.full_name || "Sin nombre");

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Usuario no encontrado</p>
        <Link href="/admin/users"><Button variant="outline">Volver</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back button */}
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver a Usuarios
            </Button>
          </Link>
        </div>

        {/* ── User header card ───────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6 flex-wrap">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                    <span className="text-blue-600 font-bold text-3xl">
                      {displayName[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                {editMode && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-colors"
                      title="Cambiar foto"
                    >
                      <Upload size={12} />
                    </button>
                  </>
                )}
              </div>

              {/* Name / role / bio */}
              <div className="flex-1 min-w-0">
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="fullName" className="text-xs text-gray-500">Nombre completo</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1 text-lg font-bold"
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio" className="text-xs text-gray-500">Biografía</Label>
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        placeholder="Descripción del usuario..."
                        className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    {profile.role === "teacher" && (
                      <div>
                        <Label htmlFor="fee" className="text-xs text-gray-500 flex items-center gap-1">
                          <Percent size={12} /> Comisión de plataforma
                        </Label>
                        <div className="flex items-center gap-3 mt-1">
                          <Input
                            id="fee"
                            type="number"
                            min={0}
                            max={100}
                            value={platformFeePercent}
                            onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-sm text-gray-500">%</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            Instructor recibe {100 - platformFeePercent}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
                    <Badge variant="outline" className={`text-base py-1.5 px-4 mb-3 ${roleColor[profile.role ?? "student"]}`}>
                      {roleLabel[profile.role ?? "student"]}
                    </Badge>
                    {profile.bio && (
                      <p className="text-gray-600 text-sm mt-2 max-w-2xl">{profile.bio}</p>
                    )}
                    {profile.email && (
                      <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
                    )}
                    {profile.role === "teacher" && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">Comisión plataforma:</span>
                        <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">
                          {profile.platform_fee_percent ?? 10}%
                        </Badge>
                        <span className="text-xs text-gray-400">→ instructor recibe {100 - (profile.platform_fee_percent ?? 10)}%</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Edit / Save buttons */}
              <div className="flex-shrink-0 flex gap-2">
                {editMode ? (
                  <>
                    <Button variant="outline" onClick={cancelEdit} disabled={saving} className="gap-1.5">
                      <X size={14} /> Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? "Guardando..." : "Guardar"}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setEditMode(true)} className="gap-1.5">
                    <Pencil size={14} /> Editar perfil
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Basic Info ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">ID de Usuario</p>
                <p className="font-mono text-sm bg-gray-100 p-3 rounded break-all">{profile.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha de Registro</p>
                <p className="font-medium text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Student details ────────────────────────────────────────────── */}
        {profile.role === "student" && userDetails && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Cursos Inscritos", value: userDetails.stats.totalCourses, color: "text-blue-600" },
                { label: "Completados", value: userDetails.stats.completedCourses, color: "text-green-600" },
                { label: "Certificados", value: userDetails.stats.certificatesEarned, color: "text-yellow-600" },
                { label: "Total Gastado", value: `$${userDetails.stats.totalSpent.toFixed(2)}`, color: "text-purple-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">{s.label}</CardTitle></CardHeader>
                  <CardContent><div className={`text-3xl font-bold ${s.color}`}>{s.value}</div></CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookOpen className="w-6 h-6" /> Cursos Inscritos ({userDetails.enrollments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.enrollments.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">No tiene cursos inscritos</p>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {userDetails.enrollments.map((e: any) => (
                      <div key={e.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white">
                        {e.courses.thumbnail_url && (
                          <img src={e.courses.thumbnail_url} alt={e.courses.title} className="w-full h-48 object-cover" />
                        )}
                        <div className="p-5 space-y-3">
                          <h4 className="font-semibold text-lg line-clamp-2">{e.courses.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{e.courses.category}</Badge>
                            <span className="text-sm font-semibold text-green-600">${e.amount_paid || 0}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{e.completedLessons}/{e.totalLessons} lecciones</span>
                              <span className="font-bold text-blue-600">{e.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${e.progress}%` }} />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(e.purchased_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {userDetails.certificates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Award className="w-6 h-6" /> Certificados ({userDetails.certificates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {userDetails.certificates.map((cert: any) => (
                      <div key={cert.id} className="flex flex-col p-5 border rounded-lg bg-white hover:shadow-md transition-all">
                        <div className="flex items-start gap-3 mb-3">
                          <Award className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-base line-clamp-2 mb-2">{cert.courses.title}</p>
                            <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded break-all">{cert.certificate_number}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 pt-2 border-t">
                          <Calendar className="w-4 h-4" />
                          {new Date(cert.issued_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ── Teacher details ────────────────────────────────────────────── */}
        {profile.role === "teacher" && userDetails && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Cursos Creados", value: userDetails.stats.totalCourses, color: "text-purple-600" },
                { label: "Publicados", value: userDetails.stats.publishedCourses, color: "text-green-600" },
                { label: "Total Estudiantes", value: userDetails.stats.totalStudents, color: "text-blue-600" },
                { label: "Ingresos Totales", value: `$${userDetails.stats.totalRevenue.toFixed(2)}`, color: "text-green-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">{s.label}</CardTitle></CardHeader>
                  <CardContent><div className={`text-3xl font-bold ${s.color}`}>{s.value}</div></CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookOpen className="w-6 h-6" /> Cursos Creados ({userDetails.courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.courses.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">No ha creado cursos</p>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {userDetails.courses.map((course: any) => (
                      <div key={course.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white">
                        {course.thumbnail_url && (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-48 object-cover" />
                        )}
                        <div className="p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-lg line-clamp-2 flex-1">{course.title}</h4>
                            <span className="font-bold text-xl text-green-600 flex-shrink-0">${course.price}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{course.category}</Badge>
                            <Badge variant={course.is_published && course.is_approved ? "default" : "outline"}>
                              {course.is_published && course.is_approved ? "Publicado" : "Borrador"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 pt-3 border-t text-center">
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Estudiantes</p>
                              <p className="font-bold flex items-center justify-center gap-1">
                                <UsersIcon className="w-3 h-3" />{course.enrollmentCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Ingresos</p>
                              <p className="font-bold flex items-center justify-center gap-1">
                                <DollarSign className="w-3 h-3" />{course.revenue.toFixed(0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Creado</p>
                              <p className="text-sm font-medium">
                                {new Date(course.created_at).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Admin details ──────────────────────────────────────────────── */}
        {profile.role === "admin" && userDetails && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Cursos Aprobados</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold text-green-600">{userDetails.stats.coursesApproved}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Instructores Invitados</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold text-purple-600">{userDetails.stats.instructorsInvited}</div></CardContent>
              </Card>
            </div>

            {userDetails.approvedCourses.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-xl">Cursos Aprobados Recientemente</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {userDetails.approvedCourses.map((course: any) => (
                      <div key={course.id} className="flex flex-col p-5 border rounded-lg bg-white hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-semibold text-base line-clamp-2 mb-3">{course.title}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 pt-2 border-t">
                              <Calendar className="w-4 h-4" />
                              {new Date(course.approved_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Bottom back button */}
        <div className="flex justify-center pt-6">
          <Link href="/admin/users">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver a Usuarios
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}