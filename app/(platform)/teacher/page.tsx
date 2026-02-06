// app/(platform)/teacher/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  BookOpen,
  Users,
  DollarSign,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export default async function TeacherDashboard() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get all courses created by this teacher
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      *,
      sections (
        id,
        lessons (
          id
        )
      ),
      enrollments (
        id,
        amount_paid
      )
    `)
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  // Calculate statistics
  const totalCourses = courses?.length || 0;
  const publishedCourses = courses?.filter((c) => c.is_published && c.is_approved).length || 0;
  const pendingApproval = courses?.filter((c) => c.pending_approval && !c.is_approved).length || 0;
  const draftCourses = courses?.filter((c) => !c.is_published && !c.pending_approval).length || 0;

  const totalStudents = courses?.reduce(
    (acc, course) => acc + (course.enrollments?.length || 0),
    0
  ) || 0;

  const totalRevenue = courses?.reduce((acc, course) => {
    const courseRevenue = course.enrollments?.reduce(
      (sum: number, enrollment: any) => sum + (Number(enrollment.amount_paid) || 0),
      0
    ) || 0;
    return acc + courseRevenue;
  }, 0) || 0;

  // Get recent enrollments
  const { data: recentEnrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      purchased_at,
      amount_paid,
      profiles!student_id (
        full_name
      ),
      courses!inner (
        id,
        title,
        teacher_id
      )
    `)
    .eq("courses.teacher_id", profile.id)
    .order("purchased_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">
          Panel de Instructor
        </h1>
        <p className="text-purple-100">
          Bienvenido, {profile.full_name || "Instructor"}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BookOpen size={16} />
              Total de Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totalCourses}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {publishedCourses} publicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users size={16} />
              Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {totalStudents}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total inscritos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign size={16} />
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              ${totalRevenue.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-gray-500 mt-1">MXN</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock size={16} />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {pendingApproval}
            </div>
            <p className="text-xs text-gray-500 mt-1">En revisión</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Link href="/teacher/courses/new">
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                Crear Nuevo Curso
              </Button>
            </Link>
            <Link href="/teacher/analytics">
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Ver Analíticas
              </Button>
            </Link>
            <Link href="/teacher/earnings">
              <Button variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                Ver Ganancias
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mis Cursos</CardTitle>
            <Link href="/teacher/courses/new">
              <Button size="sm">Crear Curso</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!courses || courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No tienes cursos creados
              </h3>
              <p className="text-gray-600 mb-4">
                Crea tu primer curso y comienza a compartir tu conocimiento
              </p>
              <Link href="/teacher/courses/new">
                <Button>Crear Primer Curso</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course: any) => {
                const totalLessons = course.sections?.reduce(
                  (acc: number, section: any) => acc + (section.lessons?.length || 0),
                  0
                ) || 0;
                const studentCount = course.enrollments?.length || 0;
                const revenue = course.enrollments?.reduce(
                  (sum: number, e: any) => sum + (Number(e.amount_paid) || 0),
                  0
                ) || 0;

                return (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    {course.thumbnail_url && (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-32 h-20 object-cover rounded"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{course.title}</h3>
                          <p className="text-sm text-gray-600">
                            {totalLessons} lecciones • {studentCount} estudiantes
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {course.is_published && course.is_approved ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Publicado
                            </Badge>
                          ) : course.pending_approval ? (
                            <Badge className="bg-orange-100 text-orange-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          ) : !course.is_approved && course.submitted_at ? (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rechazado
                            </Badge>
                          ) : (
                            <Badge variant="outline">Borrador</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          ${revenue.toLocaleString("es-MX")} MXN
                        </span>
                        <span>
                          Precio: ${Number(course.price).toLocaleString("es-MX")} MXN
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/teacher/courses/${course.id}`}>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        {course.is_published && course.is_approved && (
                          <Link href={`/browse/${course.slug}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Curso
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Enrollments */}
      {recentEnrollments && recentEnrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inscripciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEnrollments.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">
                      {enrollment.profiles?.full_name || "Usuario"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {enrollment.courses.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${Number(enrollment.amount_paid).toLocaleString("es-MX")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(enrollment.purchased_at).toLocaleDateString(
                        "es-MX"
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}