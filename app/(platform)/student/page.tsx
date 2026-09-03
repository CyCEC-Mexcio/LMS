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

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "teacher") {
    redirect("/teacher");
  }

  const supabase = await createClient();

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
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 min-w-0 w-full">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 sm:p-6 shadow-xs">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 break-words">
          ¡Bienvenido de vuelta, {profile.full_name || "Estudiante"}!
        </h1>
        <p className="text-blue-100 text-xs sm:text-sm break-words">
          Continúa tu aprendizaje donde lo dejaste
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="min-w-0">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate">
              Cursos Activos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 break-all leading-tight">
              {coursesWithProgress?.filter((c: any) => c.progressPercentage < 100).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate">
              Cursos Completados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 break-all leading-tight">
              {coursesWithProgress?.filter((c: any) => c.progressPercentage === 100).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 truncate">
              Certificados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 break-all leading-tight">
              {certificates?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-lg sm:text-xl">Mis Cursos</CardTitle>
            <Link href="/browse" className="self-start sm:self-auto">
              <Button variant="outline" size="sm" className="min-h-[36px]">
                Explorar más cursos
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {!coursesWithProgress || coursesWithProgress.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl sm:text-6xl mb-4">📚</div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                No tienes cursos inscritos
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Explora nuestro catálogo y comienza a aprender
              </p>
              <Link href="/browse">
                <Button className="min-h-[44px]">Explorar Cursos</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {coursesWithProgress.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow min-w-0"
                >
                  {enrollment.course.thumbnail_url && (
                    <img
                      src={enrollment.course.thumbnail_url}
                      alt={enrollment.course.title}
                      className="w-full sm:w-32 h-36 sm:h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 w-full">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 break-words">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">
                      Instructor: {enrollment.course.instructor_name || "N/A"}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-0">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">
                        {enrollment.progressPercentage}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {enrollment.completedLessons} de {enrollment.totalLessons} lecciones completadas
                    </div>
                  </div>
                  <Link href={`/student/courses/${enrollment.course.slug}`} className="w-full sm:w-auto flex-shrink-0">
                    <Button className="w-full sm:w-auto min-h-[44px]">
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-3">
              {recentProgress.map((item: any) => (
                <div
                  key={item.lessons.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 bg-gray-50 rounded min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{item.lessons.title}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {item.lessons.sections.courses.title}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 self-start sm:self-auto flex-shrink-0">
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
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-lg sm:text-xl">Certificados Recientes</CardTitle>
              <Link href="/student/certificates" className="self-start sm:self-auto">
                <Button variant="outline" size="sm" className="min-h-[36px]">
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-3">
              {certificates.map((cert: any) => (
                <div
                  key={cert.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 bg-gray-50 rounded min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{cert.courses.title}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      Certificado: {cert.certificate_number}
                    </p>
                  </div>
                  <Link href={`/student/certificates/${cert.id}`} className="self-end sm:self-auto flex-shrink-0">
                    <Button variant="outline" size="sm" className="min-h-[36px]">
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