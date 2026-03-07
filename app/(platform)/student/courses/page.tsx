// app/(platform)/student/courses/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  PlayCircle,
  Award,
  RotateCcw,
} from "lucide-react";

export default async function StudentCoursesPage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Fetch enrollments with full course + section/lesson structure for progress calc
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      purchased_at,
      amount_paid,
      courses (
        id,
        title,
        slug,
        description,
        thumbnail_url,
        instructor_name,
        organization,
        level,
        category,
        certificate_type,
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

  // Collect all lesson IDs across all enrolled courses
  const allLessonIds =
    enrollments?.flatMap((e: any) =>
      e.courses.sections.flatMap((s: any) => s.lessons.map((l: any) => l.id))
    ) || [];

  // Fetch progress in one query
  const { data: progressData } = await supabase
    .from("progress")
    .select("lesson_id, is_completed")
    .eq("student_id", profile.id)
    .in("lesson_id", allLessonIds.length > 0 ? allLessonIds : ["no-lessons"]);

  // Fetch certificates so we can show the badge on completed courses
  const { data: certificates } = await supabase
    .from("certificates")
    .select("course_id, id, certificate_number")
    .eq("student_id", profile.id);

  const certsByCourseId = new Map(
    (certificates || []).map((c: any) => [c.course_id, c])
  );

  // Build enriched course list
  const courses = (enrollments || []).map((enrollment: any) => {
    const course = enrollment.courses;
    const lessonIds: string[] = course.sections.flatMap((s: any) =>
      s.lessons.map((l: any) => l.id)
    );
    const totalLessons = lessonIds.length;
    const completedLessons =
      progressData?.filter(
        (p: any) => p.is_completed && lessonIds.includes(p.lesson_id)
      ).length || 0;
    const pct =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const isCompleted = totalLessons > 0 && completedLessons === totalLessons;
    const cert = certsByCourseId.get(course.id) || null;

    return {
      enrollmentId: enrollment.id,
      purchasedAt: enrollment.purchased_at,
      course,
      totalLessons,
      completedLessons,
      pct,
      isCompleted,
      cert,
    };
  });

  const activeCourses    = courses.filter((c) => !c.isCompleted);
  const completedCourses = courses.filter((c) => c.isCompleted);

  const levelLabel = (l: string | null) =>
    ({ beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" }[l || ""] || l || "");

  // ── Reusable course card ────────────────────────────────────────────────
  const CourseCard = ({ item }: { item: (typeof courses)[0] }) => {
    const { course, pct, isCompleted, completedLessons, totalLessons, cert } = item;

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-blue-600 to-indigo-700 flex-shrink-0">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white/40" />
            </div>
          )}

          {/* Completion overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
              <div className="bg-green-600 text-white rounded-full p-3 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          )}

          {/* Progress pill */}
          {!isCompleted && pct > 0 && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {pct}% completado
            </div>
          )}
        </div>

        {/* Body */}
        <CardContent className="p-4 flex flex-col flex-1">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {course.category && (
              <Badge variant="secondary" className="text-xs">
                {course.category}
              </Badge>
            )}
            {course.level && (
              <Badge variant="outline" className="text-xs">
                {levelLabel(course.level)}
              </Badge>
            )}
            {isCompleted && (
              <Badge className="text-xs bg-green-600 text-white">
                Completado
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-xs text-gray-500 mb-3">
            {course.instructor_name}
            {course.organization && ` · ${course.organization}`}
          </p>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>
                {completedLessons} / {totalLessons} lecciones
              </span>
              <span className="font-medium text-gray-700">{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isCompleted ? "bg-green-500" : "bg-blue-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Certificate badge if earned */}
          {cert && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1.5 mb-3">
              <Award className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">
                {course.certificate_type === "constancia"
                  ? "Constancia obtenida"
                  : "Certificado obtenido"}
              </span>
            </div>
          )}

          {/* Enrolled date */}
          <p className="text-xs text-gray-400 mb-4">
            Inscrito el{" "}
            {new Date(item.purchasedAt).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            <Link
              href={`/student/courses/${course.id}`}
              className="flex-1"
            >
              <Button
                className={`w-full gap-2 ${
                  isCompleted
                    ? "bg-gray-600 hover:bg-gray-700"
                    : pct === 0
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isCompleted ? (
                  <><RotateCcw className="w-4 h-4" />Revisar</>
                ) : pct === 0 ? (
                  <><PlayCircle className="w-4 h-4" />Comenzar</>
                ) : (
                  <><PlayCircle className="w-4 h-4" />Continuar</>
                )}
              </Button>
            </Link>

            {cert && (
              <Link href={`/student/certificates/${cert.id}`}>
                <Button variant="outline" size="icon" title="Ver certificado">
                  <Award className="w-4 h-4 text-yellow-600" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Mi Aprendizaje</h1>
        <p className="text-gray-600">
          Todos tus cursos en un solo lugar
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total de cursos",
            value: courses.length,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "En progreso",
            value: activeCourses.filter((c) => c.pct > 0).length,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            label: "Completados",
            value: completedCourses.length,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Certificados",
            value: certificates?.length || 0,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-xl p-4 text-center`}
          >
            <div className={`text-3xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Aún no tienes cursos
          </h2>
          <p className="text-gray-500 mb-6">
            Explora nuestro catálogo y comienza tu aprendizaje
          </p>
          <Link href="/browse">
            <Button>Explorar Cursos</Button>
          </Link>
        </div>
      )}

      {/* Active / in progress courses */}
      {activeCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Cursos Activos
              </h2>
              <span className="text-sm text-gray-500">
                ({activeCourses.length})
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeCourses.map((item) => (
              <CourseCard key={item.enrollmentId} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Completed courses */}
      {completedCourses.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Cursos Completados
            </h2>
            <span className="text-sm text-gray-500">
              ({completedCourses.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {completedCourses.map((item) => (
              <CourseCard key={item.enrollmentId} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Browse more CTA */}
      {courses.length > 0 && (
        <div className="text-center pt-4">
          <Link href="/browse">
            <Button variant="outline" size="lg">
              Explorar más cursos
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}