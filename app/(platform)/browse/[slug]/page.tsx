// app/(platform)/browse/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Users, Clock, BookOpen, Award, CheckCircle } from "lucide-react";
import Link from "next/link";
import { CoursePurchaseButton } from "@/components/course/course-purchase-button";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      profiles:teacher_id (
        full_name,
        avatar_url,
        bio
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
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_approved", true)
    .single();

  if (!course) notFound();

  const { data: { user } } = await supabase.auth.getUser();

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

  const enrollmentCount = course.enrollments?.length || 0;
  const reviews = course.reviews || [];
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

  const sortedSections = (course.sections || []).sort(
    (a: any, b: any) => a.position - b.position
  );

  const totalLessons = sortedSections.reduce(
    (sum: number, s: any) => sum + (s.lessons?.length || 0), 0
  );
  const totalDuration = sortedSections.reduce(
    (sum: number, s: any) =>
      sum + (s.lessons?.reduce((ls: number, l: any) => ls + (l.duration_minutes || 0), 0) || 0),
    0
  );

  const levelLabels: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  };

  // Instructor data — comes from profiles join on teacher_id
  const instructor = course.profiles as {
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;

  // Resolve display name: prefer course.instructor_name (editable by teacher),
  // fall back to profile full_name
  const instructorDisplayName =
    course.instructor_name || instructor?.full_name || "Instructor";

  // Avatar component used in two places — inline so we avoid "use client"
  const InstructorAvatar = ({
    size = "md",
  }: {
    size?: "sm" | "md" | "lg";
  }) => {
    const sizeClass =
      size === "lg" ? "w-20 h-20 text-2xl" :
      size === "md" ? "w-16 h-16 text-xl" :
                     "w-12 h-12 text-lg";

    return instructor?.avatar_url ? (
      // ✅ referrerPolicy="no-referrer" required for Google CDN avatar URLs
      <img
        src={instructor.avatar_url}
        alt={instructorDisplayName}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
        referrerPolicy="no-referrer"
      />
    ) : (
      <div
        className={`${sizeClass} rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0`}
      >
        <span className="font-bold text-blue-600">
          {instructorDisplayName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Course info */}
            <div className="lg:col-span-2">
              <Badge className="mb-4 bg-white/20 text-white border-white/40">
                {course.category}
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-blue-100 mb-6">{course.description}</p>

              <div className="flex flex-wrap gap-6 items-center mb-6">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-blue-200">({reviews.length} reseñas)</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{enrollmentCount} estudiantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Nivel: {levelLabels[course.level] || course.level}</span>
                </div>
              </div>

              {/* Instructor summary in header */}
              <div className="flex items-center gap-3">
                <InstructorAvatar size="sm" />
                <div>
                  <p className="text-sm text-blue-200">Creado por</p>
                  <p className="font-semibold">{instructorDisplayName}</p>
                  {course.organization && (
                    <p className="text-sm text-blue-200">{course.organization}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Purchase card */}
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
                    <div className="w-full aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  <CoursePurchaseButton
                    courseId={course.id}
                    price={course.price || 0}
                    currency={course.currency || "MXN"}
                    title={course.title}
                    isEnrolled={isEnrolled}
                    isPublished={course.is_published}
                    isApproved={course.is_approved}
                  />

                  <div className="mt-6 space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {totalDuration >= 60
                          ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`
                          : `${totalDuration} min`}{" "}
                        de contenido
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{totalLessons} lecciones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>
                        {course.certificate_type === "constancia"
                          ? "Constancia de participación"
                          : "Certificado de finalización"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* What you'll learn */}
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Lo que aprenderás</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.learning_outcomes.map((outcome: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Requisitos</h2>
                  <ul className="space-y-2">
                    {course.requirements.map((req: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-gray-400 mt-1">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Course content */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">Contenido del curso</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {sortedSections.length} secciones • {totalLessons} lecciones
                </p>
                <div className="space-y-3">
                  {sortedSections.length > 0 ? (
                    sortedSections.map((section: any, i: number) => (
                      <details
                        key={section.id}
                        className="border border-gray-200 rounded-lg"
                      >
                        <summary className="cursor-pointer p-4 hover:bg-gray-50 font-medium flex items-center justify-between">
                          <span>{i + 1}. {section.title}</span>
                          <span className="text-sm text-gray-500">
                            {section.lessons?.length || 0} lecciones
                          </span>
                        </summary>
                        <div className="border-t p-4 bg-gray-50">
                          {section.lessons?.length > 0 ? (
                            <ul className="space-y-2">
                              {section.lessons.map((lesson: any) => (
                                <li
                                  key={lesson.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="flex items-center gap-2 text-gray-700">
                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                    {lesson.title}
                                    {lesson.duration_minutes > 0 && (
                                      <span className="text-gray-400">
                                        · {lesson.duration_minutes} min
                                      </span>
                                    )}
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
                            <p className="text-sm text-gray-400">Sin lecciones</p>
                          )}
                        </div>
                      </details>
                    ))
                  ) : (
                    <p className="text-gray-500">No se encontraron secciones.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ✅ Full instructor bio card — was missing entirely before */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Sobre el instructor</h2>
                <div className="flex items-start gap-4">
                  <InstructorAvatar size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {instructorDisplayName}
                    </h3>
                    {course.organization && (
                      <p className="text-sm text-blue-600 font-medium mb-3">
                        {course.organization}
                      </p>
                    )}
                    {/* ✅ Bio from profiles table */}
                    {instructor?.bio ? (
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {instructor.bio}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">
                        Este instructor aún no ha añadido una biografía.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-2">Reseñas</h2>
                  {averageRating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                      <span className="text-gray-500">/ 5 · {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((review: any) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center gap-3 mb-2">
                          {review.profiles?.avatar_url ? (
                            <img
                              src={review.profiles.avatar_url}
                              alt={review.profiles.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-semibold text-gray-600">
                                {review.profiles?.full_name?.charAt(0) || "?"}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {review.profiles?.full_name || "Anónimo"}
                            </p>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Compact instructor card in sidebar */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-gray-900">Instructor</h3>
                <div className="flex items-center gap-3 mb-3">
                  <InstructorAvatar size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">{instructorDisplayName}</p>
                    {course.organization && (
                      <p className="text-sm text-gray-500">{course.organization}</p>
                    )}
                  </div>
                </div>
                {/* Short bio preview in sidebar */}
                {instructor?.bio && (
                  <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">
                    {instructor.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Course includes */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-gray-900">
                  Este curso incluye
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      {totalDuration >= 60
                        ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`
                        : `${totalDuration} min`}{" "}
                      de contenido
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>{totalLessons} lecciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span>
                      {course.certificate_type === "constancia"
                        ? "Constancia de participación"
                        : "Certificado de finalización"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span>Acceso de por vida</span>
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