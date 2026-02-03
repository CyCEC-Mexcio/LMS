import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = createClient(await cookies());
  
  // Await params in Next.js 15+
  const { slug } = await params;

  // Get course by slug
  const { data: course } = await supabase
    .from("courses")
    .select(
      `
      *,
      profiles:teacher_id (
        full_name,
        avatar_url
      ),
      sections (
        id,
        title,
        position,
        lessons (
          id,
          title,
          duration_minutes,
          is_free_preview
        )
      ),
      reviews (
        id,
        rating,
        comment,
        created_at,
        profiles (
          full_name,
          avatar_url
        )
      ),
      enrollments (
        id
      )
    `
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_approved", true)
    .single();

  if (!course) {
    notFound();
  }

  // Check if current user is enrolled
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isEnrolled = false;
  if (user) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", course.id)
      .eq("student_id", user.id)
      .single();

    isEnrolled = !!enrollment;
  }

  // Calculate stats
  const enrollmentCount = course.enrollments?.length || 0;
  const reviews = course.reviews || [];
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviews.length
      : 0;

  // Sort sections by position
  const sortedSections = (course.sections || []).sort(
    (a: any, b: any) => a.position - b.position
  );

  // Calculate total lessons and duration
  const totalLessons = sortedSections.reduce(
    (sum: number, section: any) => sum + (section.lessons?.length || 0),
    0
  );
  const totalDuration = sortedSections.reduce(
    (sum: number, section: any) =>
      sum +
      (section.lessons?.reduce(
        (s: number, lesson: any) => s + (lesson.duration_minutes || 0),
        0
      ) || 0),
    0
  );

  const levelLabels: { [key: string]: string } = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Course Info */}
            <div className="lg:col-span-2">
              <Badge className="mb-4 bg-white/20 text-white border-white/40">
                {course.category}
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-blue-100 mb-6">{course.description}</p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 items-center mb-6">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-blue-200">
                      ({reviews.length} reseñas)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{enrollmentCount} estudiantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Nivel: {levelLabels[course.level]}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3">
                {course.profiles?.avatar_url ? (
                  <img
                    src={course.profiles.avatar_url}
                    alt={course.instructor_name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {course.instructor_name?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-blue-200">Creado por</p>
                  <p className="font-semibold">{course.instructor_name}</p>
                  {course.organization && (
                    <p className="text-sm text-blue-200">{course.organization}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Enrollment Card */}
            <div>
              <Card>
                <CardContent className="p-6">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full aspect-video object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-3xl font-bold text-gray-900">
                      ${course.price?.toFixed(2) || "0.00"}
                      <span className="text-lg font-normal text-gray-500 ml-1">
                        MXN
                      </span>
                    </div>
                  </div>

                  {isEnrolled ? (
                    <Link href={`/student/courses/${course.id}`}>
                      <Button className="w-full" size="lg">
                        Ir al Curso
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" size="lg">
                      Inscribirse Ahora
                    </Button>
                  )}

                  <div className="mt-6 space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {Math.floor(totalDuration / 60)} horas de video
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{totalLessons} lecciones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>Certificado de finalización</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Course Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    Lo que aprenderás
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.learning_outcomes.map((outcome: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Content */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Contenido del curso
                </h2>
                <div className="space-y-3">
                  {sortedSections.length > 0 ? (
                    sortedSections.map((section: any, index: number) => (
                      <details
                        key={section.id}
                        className="border border-gray-200 rounded-lg"
                      >
                        <summary className="cursor-pointer p-4 hover:bg-gray-50 font-medium flex items-center justify-between">
                          <span>
                            {index + 1}. {section.title}
                          </span>
                          <span className="text-sm text-gray-500">
                            {section.lessons?.length || 0} lecciones
                          </span>
                        </summary>
                        <div className="border-t p-4 bg-gray-50">
                          {section.lessons && section.lessons.length > 0 ? (
                            <ul className="space-y-2">
                              {section.lessons.map((lesson: any) => (
                                <li
                                  key={lesson.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                    {lesson.title}
                                  </span>
                                  {lesson.is_free_preview && (
                                    <Badge variant="outline" className="text-xs">
                                      Vista previa
                                    </Badge>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">
                              No hay lecciones en este capítulo
                            </p>
                          )}
                        </div>
                      </details>
                    ))
                  ) : (
                    <p className="text-gray-500">
                      No se encontraron secciones para este curso.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Reseñas</h2>
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((review: any) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center gap-3 mb-2">
                          {review.profiles?.avatar_url ? (
                            <img
                              src={review.profiles.avatar_url}
                              alt={review.profiles.full_name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-semibold">
                                {review.profiles?.full_name?.charAt(0) || "?"}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">
                              {review.profiles?.full_name || "Anónimo"}
                            </p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Instructor Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Sobre el instructor</h3>
                <div className="flex items-center gap-3 mb-4">
                  {course.profiles?.avatar_url ? (
                    <img
                      src={course.profiles.avatar_url}
                      alt={course.instructor_name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl font-semibold">
                        {course.instructor_name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{course.instructor_name}</p>
                    {course.organization && (
                      <p className="text-sm text-gray-500">
                        {course.organization}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}