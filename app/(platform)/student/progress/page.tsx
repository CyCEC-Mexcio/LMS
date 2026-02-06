// app/(platform)/student/progress/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, Clock, TrendingUp } from "lucide-react";

export default async function StudentProgressPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get all enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      purchased_at,
      courses (
        id,
        title,
        slug,
        thumbnail_url,
        instructor_name,
        sections (
          id,
          title,
          lessons (
            id,
            title,
            duration_minutes
          )
        )
      )
    `)
    .eq("student_id", profile.id)
    .order("purchased_at", { ascending: false });

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2">Sin progreso todavía</h2>
          <p className="text-gray-600 mb-6">
            Inscríbete en un curso para comenzar a ver tu progreso
          </p>
          <Link href="/browse">
            <Button>Explorar Cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get all progress
  const allLessonIds = enrollments.flatMap((e: any) =>
    e.courses.sections.flatMap((s: any) => s.lessons.map((l: any) => l.id))
  );

  const { data: progressData } = await supabase
    .from("progress")
    .select("*")
    .eq("student_id", profile.id)
    .in("lesson_id", allLessonIds);

  // Calculate stats
  const coursesWithProgress = enrollments.map((enrollment: any) => {
    const course = enrollment.courses;
    const totalLessons = course.sections.reduce(
      (acc: number, section: any) => acc + section.lessons.length,
      0
    );

    const lessonIds = course.sections.flatMap((s: any) =>
      s.lessons.map((l: any) => l.id)
    );

    const courseProgress = progressData?.filter(
      (p: any) => lessonIds.includes(p.lesson_id)
    ) || [];

    const completedLessons = courseProgress.filter((p: any) => p.is_completed).length;
    const progressPercentage = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    const totalDuration = course.sections.reduce(
      (acc: number, section: any) =>
        acc +
        section.lessons.reduce(
          (lessonAcc: number, lesson: any) =>
            lessonAcc + (lesson.duration_minutes || 0),
          0
        ),
      0
    );

    const lastActivity = courseProgress
      .filter((p: any) => p.completed_at)
      .sort((a: any, b: any) =>
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      )[0];

    return {
      ...enrollment,
      course,
      totalLessons,
      completedLessons,
      progressPercentage,
      totalDuration,
      lastActivity,
    };
  });

  // Overall stats
  const totalCourses = coursesWithProgress.length;
  const completedCourses = coursesWithProgress.filter(
    (c: any) => c.progressPercentage === 100
  ).length;
  const inProgressCourses = coursesWithProgress.filter(
    (c: any) => c.progressPercentage > 0 && c.progressPercentage < 100
  ).length;
  const totalMinutesWatched = progressData
    ?.filter((p: any) => p.is_completed)
    .reduce((acc: number, p: any) => {
      const lesson = allLessonIds.find((id) => id === p.lesson_id);
      const lessonData = enrollments
        .flatMap((e: any) => e.courses.sections)
        .flatMap((s: any) => s.lessons)
        .find((l: any) => l.id === lesson);
      return acc + (lessonData?.duration_minutes || 0);
    }, 0) || 0;

  const totalHoursWatched = Math.floor(totalMinutesWatched / 60);
  const remainingMinutes = totalMinutesWatched % 60;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mi Progreso</h1>
        <p className="text-gray-600">
          Sigue tu evolución en todos tus cursos
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp size={16} />
              Total de Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 size={16} />
              Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {completedCourses}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock size={16} />
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {inProgressCourses}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock size={16} />
              Tiempo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {totalHoursWatched}h {remainingMinutes}m
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress List */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso por Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coursesWithProgress.map((item: any) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {item.course.thumbnail_url && (
                    <img
                      src={item.course.thumbnail_url}
                      alt={item.course.title}
                      className="w-32 h-20 object-cover rounded flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {item.course.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.course.instructor_name || "Instructor"}
                        </p>
                      </div>

                      <Badge
                        variant={
                          item.progressPercentage === 100
                            ? "default"
                            : item.progressPercentage > 0
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          item.progressPercentage === 100
                            ? "bg-green-100 text-green-800"
                            : item.progressPercentage > 0
                            ? "bg-orange-100 text-orange-800"
                            : ""
                        }
                      >
                        {item.progressPercentage === 100
                          ? "Completado"
                          : item.progressPercentage > 0
                          ? "En progreso"
                          : "Sin iniciar"}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {item.completedLessons} de {item.totalLessons} lecciones
                        </span>
                        <span className="font-semibold text-blue-600">
                          {item.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Last Activity */}
                    {item.lastActivity && (
                      <p className="text-xs text-gray-500">
                        Última actividad:{" "}
                        {new Date(item.lastActivity.completed_at).toLocaleDateString(
                          "es-MX",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    )}

                    {/* Action Button */}
                    <div className="mt-3">
                      <Link href={`/student/courses/${item.course.slug}`}>
                        <Button size="sm">
                          {item.progressPercentage === 0
                            ? "Comenzar Curso"
                            : item.progressPercentage === 100
                            ? "Revisar Curso"
                            : "Continuar Curso"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}