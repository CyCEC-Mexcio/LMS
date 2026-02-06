// app/(platform)/admin/users/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import UserManagementTable from "@/components/admin/user-management-table";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  // AWAIT searchParams since it's a Promise in Next.js 15+
  const params = await searchParams;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Build query
  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Filter by role if specified
  if (params.role && params.role !== "all") {
    query = query.eq("role", params.role);
  }

  // Search by name or email
  if (params.search) {
    query = query.ilike("full_name", `%${params.search}%`);
  }

  const { data: users } = await query;

  // Calculate statistics
  const totalUsers = users?.length || 0;
  const students = users?.filter((u) => u.role === "student").length || 0;
  const teachers = users?.filter((u) => u.role === "teacher").length || 0;
  const admins = users?.filter((u) => u.role === "admin").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestionar Usuarios</h1>
        <p className="text-gray-600">Administra usuarios de la plataforma</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users size={16} />
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{students}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Instructores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{teachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No se encontraron usuarios
              </h3>
            </div>
          ) : (
            <UserManagementTable users={users} currentUserId={profile.id} />
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Gestión de Usuarios</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              • Haz clic en "Ver Detalles" para ver información completa del usuario
            </li>
            <li>
              • Los estudiantes muestran sus cursos inscritos y progreso
            </li>
            <li>
              • Los instructores muestran sus cursos creados y estadísticas
            </li>
            <li>
              • Los usuarios solo pueden ser eliminados si no tienen actividad
            </li>
            <li>
              • No puedes eliminar tu propia cuenta de administrador
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}