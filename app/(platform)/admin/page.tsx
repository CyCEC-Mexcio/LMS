import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  const supabase = await createClient();

  const [
    { count: totalCourses },
    { count: pendingCourses },
    { count: publishedCourses },
    { count: totalUsers },
    { count: totalStudents },
    { count: totalTeachers },
    { data: recentCourses },
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("pending_approval", true).eq("is_approved", false),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_published", true).eq("is_approved", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from("courses").select("id, title, is_published, is_approved, pending_approval, created_at, instructor_name").order("created_at", { ascending: false }).limit(5),
  ]);

  const getCourseStatus = (course: any) => {
    if (course.is_published && course.is_approved) return { label: "Publicado", color: "bg-green-100 text-green-700" };
    if (course.pending_approval) return { label: "En revisión", color: "bg-yellow-100 text-yellow-700" };
    if (course.is_approved && !course.is_published) return { label: "Aprobado", color: "bg-blue-100 text-blue-700" };
    return { label: "Borrador", color: "bg-gray-100 text-gray-600" };
  };

  const stats = [
    { label: "Total Cursos", value: totalCourses ?? 0, icon: "📚", color: "bg-blue-50 text-blue-600", href: "/admin/courses" },
    { label: "Publicados", value: publishedCourses ?? 0, icon: "✅", color: "bg-green-50 text-green-600", href: "/admin/courses" },
    { label: "En Revisión", value: pendingCourses ?? 0, icon: "⏳", color: "bg-yellow-50 text-yellow-600", href: "/admin/courses/pending" },
    { label: "Total Usuarios", value: totalUsers ?? 0, icon: "👥", color: "bg-purple-50 text-purple-600", href: "/admin/users" },
    { label: "Estudiantes", value: totalStudents ?? 0, icon: "🎓", color: "bg-indigo-50 text-indigo-600", href: "/admin/users" },
    { label: "Instructores", value: totalTeachers ?? 0, icon: "👨‍🏫", color: "bg-pink-50 text-pink-600", href: "/admin/users" },
  ];

  const actions = [
    { href: "/admin/courses/new", icon: "➕", bg: "bg-blue-100", label: "Crear Curso", desc: "Crea un nuevo curso desde cero" },
    { href: "/admin/courses", icon: "📚", bg: "bg-green-100", label: "Gestionar Cursos", desc: "Ver y editar todos los cursos" },
    { href: "/admin/courses/pending", icon: "⏳", bg: "bg-yellow-100", label: "Cursos Pendientes", desc: "Aprobar cursos de instructores", badge: pendingCourses ?? 0 },
    { href: "/admin/create-instructor", icon: "👨‍🏫", bg: "bg-purple-100", label: "Crear Instructor", desc: "Invitar nuevos instructores" },
    { href: "/admin/users", icon: "👥", bg: "bg-indigo-100", label: "Usuarios", desc: "Gestionar cuentas de usuarios" },
    { href: "/admin/payouts", icon: "💳", bg: "bg-pink-100", label: "Pagos", desc: "Gestionar pagos a instructores" },
    { href: "/admin/settings", icon: "⚙️", bg: "bg-gray-100", label: "Configuración", desc: "Ajustes de la plataforma" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-1">Panel de Administración</h1>
        <p className="text-slate-300 text-sm">Gestiona cursos, instructores y usuarios de la plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow text-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.color.split(" ")[0]}`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color.split(" ")[1]}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Acciones Rápidas</h2>
          <div className="space-y-2">
            {actions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${action.bg}`}>
                    <span className="text-xl">{action.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                    <p className="text-xs text-gray-500 truncate">{action.desc}</p>
                  </div>
                  {action.badge ? (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cursos Recientes</h2>
            <Link href="/admin/courses" className="text-xs text-blue-600 hover:underline">Ver todos →</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {!recentCourses || recentCourses.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">No hay cursos aún</p>
              </div>
            ) : (
              recentCourses.map((course: any) => {
                const { label, color } = getCourseStatus(course);
                return (
                  <div key={course.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {course.instructor_name ?? "Sin instructor"} ·{" "}
                        {new Date(course.created_at).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${color}`}>{label}</span>
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors flex-shrink-0"
                    >
                      Ver →
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}