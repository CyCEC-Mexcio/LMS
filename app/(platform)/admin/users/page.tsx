// app/(platform)/admin/users/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, UserCheck, ShieldCheck } from "lucide-react";
import UserManagementTable from "@/components/admin/user-management-table";
import Link from "next/link";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const params = await searchParams;
  const activeRole = params.role || "all";

  const supabase = await createClient();

  // Fetch all profiles for accurate overview counts
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, role");

  const totalUsers = allProfiles?.length || 0;
  const students = allProfiles?.filter((u) => u.role === "student").length || 0;
  const teachers = allProfiles?.filter((u) => u.role === "teacher").length || 0;
  const admins = allProfiles?.filter((u) => u.role === "admin").length || 0;

  // Build query for table display
  let query = supabase
    .from("profiles")
    .select("*, enrollments(count)")
    .order("created_at", { ascending: false });

  if (activeRole !== "all") {
    query = query.eq("role", activeRole);
  }

  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }

  const { data: users } = await query;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestionar Usuarios</h1>
        <p className="text-gray-600">Administra y filtra usuarios de la plataforma</p>
      </div>

      {/* Interactive Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/users?role=all" className="block transition-transform hover:scale-[1.01]">
          <Card className={`cursor-pointer transition-all border-2 ${activeRole === "all" ? "border-blue-600 shadow-md bg-blue-50/50" : "hover:border-gray-300"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users size={16} />
                Total Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">Ver todos los usuarios</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users?role=student" className="block transition-transform hover:scale-[1.01]">
          <Card className={`cursor-pointer transition-all border-2 ${activeRole === "student" ? "border-green-600 shadow-md bg-green-50/50" : "hover:border-gray-300"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <GraduationCap size={16} className="text-green-600" />
                Estudiantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{students}</div>
              <p className="text-xs text-gray-500 mt-1">Filtrar estudiantes</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users?role=teacher" className="block transition-transform hover:scale-[1.01]">
          <Card className={`cursor-pointer transition-all border-2 ${activeRole === "teacher" ? "border-purple-600 shadow-md bg-purple-50/50" : "hover:border-gray-300"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <UserCheck size={16} className="text-purple-600" />
                Instructores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{teachers}</div>
              <p className="text-xs text-gray-500 mt-1">Filtrar instructores</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users?role=admin" className="block transition-transform hover:scale-[1.01]">
          <Card className={`cursor-pointer transition-all border-2 ${activeRole === "admin" ? "border-orange-600 shadow-md bg-orange-50/50" : "hover:border-gray-300"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShieldCheck size={16} className="text-orange-600" />
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{admins}</div>
              <p className="text-xs text-gray-500 mt-1">Filtrar administradores</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Users Table Card */}
      <Card>
        <CardContent className="pt-6">
          {!users || users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Prueba cambiando los filtros o el término de búsqueda
              </p>
              <Link href="/admin/users">
                <span className="text-sm text-blue-600 hover:underline font-medium">Ver todos los usuarios</span>
              </Link>
            </div>
          ) : (
            <UserManagementTable users={users} currentUserId={profile.id} activeRole={activeRole} />
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-red-50/60 border-red-100">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-red-900 mb-2">Gestión y Filtros de Usuarios</h3>
          <ul className="space-y-2 text-sm text-red-950/80">
            <li>• Usa las tarjetas superiores o las pestañas de la tabla para filtrar por Estudiantes o Instructores.</li>
            <li>• Haz clic en "Ver Detalles" para revisar el avance de cursos, certificados y correo del usuario.</li>
            <li>• Puedes enviar un correo directo de seguimiento a un estudiante haciendo clic en el botón de correo.</li>
            <li>• Los usuarios solo pueden ser eliminados si no tienen cursos o inscripciones activas.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}