import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherDashboard() {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "teacher") redirect("/login");

  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, title, slug, thumbnail_url, price,
      is_published, is_approved, pending_approval, submitted_at,
      created_at,
      sections ( id, lessons ( id ) ),
      enrollments ( id, amount_paid )
    `)
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: recentEnrollments } = await supabase
    .from("enrollments")
    .select(`
      id, purchased_at, amount_paid,
      profiles!student_id ( full_name ),
      courses!inner ( id, title, teacher_id )
    `)
    .eq("courses.teacher_id", profile.id)
    .order("purchased_at", { ascending: false })
    .limit(5);

  const totalCourses = courses?.length ?? 0;
  const publishedCourses = courses?.filter((c) => c.is_published && c.is_approved).length ?? 0;
  const pendingApproval = courses?.filter((c) => c.pending_approval && !c.is_approved).length ?? 0;
  const draftCourses = courses?.filter((c) => !c.is_published && !c.pending_approval && !c.submitted_at).length ?? 0;
  const totalStudents = courses?.reduce((acc, c) => acc + (c.enrollments?.length ?? 0), 0) ?? 0;
  const totalRevenue = courses?.reduce((acc, c) =>
    acc + (c.enrollments?.reduce((s: number, e: any) => s + (Number(e.amount_paid) || 0), 0) ?? 0), 0) ?? 0;

  const getCourseStatus = (course: any) => {
    if (course.is_published && course.is_approved) return { label: "Publicado", color: "bg-green-100 text-green-700", dot: "bg-green-500" };
    if (course.pending_approval) return { label: "En revisión", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" };
    if (!course.is_approved && course.submitted_at) return { label: "Rechazado", color: "bg-red-100 text-red-600", dot: "bg-red-500" };
    if (course.is_approved && !course.is_published) return { label: "Aprobado", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
    return { label: "Borrador", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  };

  const stats = [
    { label: "Total Cursos", value: totalCourses, sub: `${draftCourses} borradores`, icon: "📖", accent: "text-blue-600", ring: "bg-blue-50" },
    { label: "Publicados", value: publishedCourses, sub: "aprobados y activos", icon: "✅", accent: "text-green-600", ring: "bg-green-50" },
    { label: "En Revisión", value: pendingApproval, sub: "esperando aprobación", icon: "⏳", accent: "text-yellow-600", ring: "bg-yellow-50" },
    { label: "Estudiantes", value: totalStudents, sub: "total inscritos", icon: "🎓", accent: "text-purple-600", ring: "bg-purple-50" },
    { label: "Ingresos", value: `$${totalRevenue.toLocaleString("es-MX")}`, sub: "MXN total", icon: "💰", accent: "text-emerald-600", ring: "bg-emerald-50" },
  ];

  const actions = [
    { href: "/teacher/courses/new", icon: "➕", bg: "bg-blue-100", label: "Crear Curso", desc: "Nuevo curso desde cero" },
    { href: "/teacher/courses", icon: "📚", bg: "bg-green-100", label: "Mis Cursos", desc: "Ver y editar tus cursos" },
    { href: "/teacher/analytics", icon: "📈", bg: "bg-indigo-100", label: "Analíticas", desc: "Estadísticas detalladas" },
    { href: "/teacher/earnings", icon: "💰", bg: "bg-emerald-100", label: "Ganancias", desc: "Historial de pagos" },
    { href: "/teacher/settings", icon: "⚙️", bg: "bg-gray-100", label: "Configuración", desc: "Ajustes de tu cuenta" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6">
        <p className="text-indigo-200 text-sm font-medium mb-1">Panel de Instructor</p>
        <h1 className="text-2xl font-bold">Bienvenido, {profile.full_name || "Instructor"} 👋</h1>
        <p className="text-indigo-200 text-sm mt-1">
          Tienes {totalCourses} curso{totalCourses !== 1 ? "s" : ""} · {totalStudents} estudiante{totalStudents !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.ring}`}>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
            <p className="text-xs font-medium text-gray-700 mt-0.5">{stat.label}</p>
            <p className="text-xs text-gray-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Acciones Rápidas</h2>
          <div className="space-y-2">
            {actions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.bg}`}>
                    <span className="text-lg">{action.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Courses + Recent Enrollments */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mis Cursos</h2>
              <Link href="/teacher/courses" className="text-xs text-blue-600 hover:underline">Ver todos →</Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {!courses || courses.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm mb-3">Aún no tienes cursos</p>
                  <Link href="/teacher/courses/new" className="text-xs text-blue-600 hover:underline font-medium">
                    Crear primer curso →
                  </Link>
                </div>
              ) : (
                courses.slice(0, 5).map((course: any) => {
                  const { label, color, dot } = getCourseStatus(course);
                  const lessons = course.sections?.reduce((a: number, s: any) => a + (s.lessons?.length ?? 0), 0) ?? 0;
                  const students = course.enrollments?.length ?? 0;
                  return (
                    <div key={course.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {course.thumbnail_url
                          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">📖</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                        <p className="text-xs text-gray-400">{lessons} lecciones · {students} estudiantes</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${color}`}>{label}</span>
                      <Link href={`/teacher/courses/${course.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors flex-shrink-0">
                        Editar →
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Enrollments */}
          {recentEnrollments && recentEnrollments.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Inscripciones Recientes</h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {recentEnrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{enrollment.profiles?.full_name || "Usuario"}</p>
                      <p className="text-xs text-gray-400">{enrollment.courses?.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">
                        ${Number(enrollment.amount_paid).toLocaleString("es-MX")} MXN
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(enrollment.purchased_at).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}