// app/(platform)/student/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StudentDashboard() {
  const profile = await getUserProfile();

  if (!profile || (profile.role !== "student" && profile.role !== "teacher")) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get enrolled courses with progress
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      purchased_at,
      courses (
        id,
        title,
        slug,
        description,
        thumbnail_url,
        instructor_name,
        sections (
          id,
          lessons (
            id
          )
        )
      )
    `)
    .eq("student_id", profile.id)
    .order("purchased_at", { ascending: false });

  // Get progress for enrolled courses
  const enrolledCourseIds = enrollments?.map((e: any) => e.courses.id) || [];
  const { data: progressData } = await supabase
    .from("progress")
    .select("lesson_id, is_completed")
    .eq("student_id", profile.id)
    .in("lesson_id", 
      enrollments?.flatMap((e: any) => 
        e.courses.sections.flatMap((s: any) => 
          s.lessons.map((l: any) => l.id)
        )
      ) || []
    );

  // Calculate progress for each course
  const coursesWithProgress = enrollments?.map((enrollment: any) => {
    const course = enrollment.courses;
    const totalLessons = course.sections.reduce(
      (acc: number, section: any) => acc + section.lessons.length,
      0
    );
    const lessonIds = course.sections.flatMap((s: any) =>
      s.lessons.map((l: any) => l.id)
    );
    const completedLessons = progressData?.filter(
      (p: any) => p.is_completed && lessonIds.includes(p.lesson_id)
    ).length || 0;
    const progressPercentage = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    return {
      ...enrollment,
      course,
      totalLessons,
      completedLessons,
      progressPercentage,
    };
  });

  // Get recently completed lessons
  const { data: recentProgress } = await supabase
    .from("progress")
    .select(`
      completed_at,
      lessons (
        id,
        title,
        sections (
          courses (
            title,
            slug
          )
        )
      )
    `)
    .eq("student_id", profile.id)
    .eq("is_completed", true)
    .order("completed_at", { ascending: false })
    .limit(5);

  // Get certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      id,
      certificate_number,
      issued_at,
      courses (
        title,
        slug
      )
    `)
    .eq("student_id", profile.id)
    .order("issued_at", { ascending: false })
    .limit(3);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">
          ¡Bienvenido de vuelta, {profile.full_name || "Estudiante"}!
        </h1>
        <p className="text-blue-100">
          Continúa tu aprendizaje donde lo dejaste
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cursos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {coursesWithProgress?.filter((c: any) => c.progressPercentage < 100).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cursos Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {coursesWithProgress?.filter((c: any) => c.progressPercentage === 100).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Certificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {certificates?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mis Cursos</CardTitle>
            <Link href="/browse">
              <Button variant="outline" size="sm">
                Explorar más cursos
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!coursesWithProgress || coursesWithProgress.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2">
                No tienes cursos inscritos
              </h3>
              <p className="text-gray-600 mb-4">
                Explora nuestro catálogo y comienza a aprender
              </p>
              <Link href="/browse">
                <Button>Explorar Cursos</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {coursesWithProgress.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  {enrollment.course.thumbnail_url && (
                    <img
                      src={enrollment.course.thumbnail_url}
                      alt={enrollment.course.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Instructor: {enrollment.course.instructor_name || "N/A"}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {enrollment.progressPercentage}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {enrollment.completedLessons} de {enrollment.totalLessons} lecciones completadas
                    </div>
                  </div>
                  <Link href={`/student/courses/${enrollment.course.slug}`}>
                    <Button>
                      {enrollment.progressPercentage === 0
                        ? "Comenzar"
                        : enrollment.progressPercentage === 100
                        ? "Revisar"
                        : "Continuar"}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentProgress && recentProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProgress.map((item: any) => (
                <div
                  key={item.lessons.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{item.lessons.title}</p>
                    <p className="text-sm text-gray-600">
                      {item.lessons.sections.courses.title}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Completado
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Certificates */}
      {certificates && certificates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Certificados Recientes</CardTitle>
              <Link href="/student/certificates">
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certificates.map((cert: any) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{cert.courses.title}</p>
                    <p className="text-sm text-gray-600">
                      Certificado: {cert.certificate_number}
                    </p>
                  </div>
                  <Link href={`/student/certificates/${cert.id}`}>
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}