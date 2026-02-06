// app/(platform)/admin/users/[userId]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Award,
  DollarSign,
  Users as UsersIcon,
} from "lucide-react";
import Link from "next/link";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const { userId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get user profile
  const { data: selectedUser } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!selectedUser) {
    redirect("/admin/users");
  }

  let userDetails: any = null;

  // Load details based on role
  if (selectedUser.role === "student") {
    userDetails = await loadStudentDetails(supabase, userId);
  } else if (selectedUser.role === "teacher") {
    userDetails = await loadTeacherDetails(supabase, userId);
  } else if (selectedUser.role === "admin") {
    userDetails = await loadAdminDetails(supabase, userId);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver a Usuarios
            </Button>
          </Link>
        </div>

        {/* User Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {selectedUser?.avatar_url ? (
                <img
                  src={selectedUser.avatar_url}
                  alt={selectedUser.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                  <span className="text-blue-600 font-bold text-3xl">
                    {selectedUser?.full_name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {selectedUser?.full_name || "Sin nombre"}
                </h1>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-base py-1.5 px-4 ${
                      selectedUser?.role === "admin"
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : selectedUser?.role === "teacher"
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                    }`}
                  >
                    {selectedUser?.role === "student" && "Estudiante"}
                    {selectedUser?.role === "teacher" && "Instructor"}
                    {selectedUser?.role === "admin" && "Administrador"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">ID de Usuario</p>
                <p className="font-mono text-sm bg-gray-100 p-3 rounded break-all">
                  {selectedUser?.id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha de Registro</p>
                <p className="font-medium text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {new Date(selectedUser?.created_at).toLocaleDateString(
                    "es-MX",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
            {selectedUser?.bio && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Biografía</p>
                <p className="text-base bg-gray-50 p-4 rounded">
                  {selectedUser.bio}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Details */}
        {selectedUser?.role === "student" && userDetails && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Cursos Inscritos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {userDetails.stats.totalCourses}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Completados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {userDetails.stats.completedCourses}
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
                  <div className="text-3xl font-bold text-yellow-600">
                    {userDetails.stats.certificatesEarned}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Gastado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    ${userDetails.stats.totalSpent.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enrolled Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookOpen className="w-6 h-6" />
                  Cursos Inscritos ({userDetails.enrollments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.enrollments.length === 0 ? (
                  <p className="text-center text-gray-500 py-12 text-lg">
                    No tiene cursos inscritos
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {userDetails.enrollments.map((enrollment: any) => (
                      <div
                        key={enrollment.id}
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white"
                      >
                        {enrollment.courses.thumbnail_url && (
                          <img
                            src={enrollment.courses.thumbnail_url}
                            alt={enrollment.courses.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-5 space-y-3">
                          <h4 className="font-semibold text-lg line-clamp-2">
                            {enrollment.courses.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">
                              {enrollment.courses.category}
                            </Badge>
                            <span className="text-sm font-semibold text-green-600">
                              ${enrollment.amount_paid || 0}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span className="font-medium">
                                {enrollment.completedLessons}/
                                {enrollment.totalLessons} lecciones
                              </span>
                              <span className="font-bold text-blue-600">
                                {enrollment.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              enrollment.purchased_at
                            ).toLocaleDateString("es-MX", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certificates */}
            {userDetails.certificates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Award className="w-6 h-6" />
                    Certificados ({userDetails.certificates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {userDetails.certificates.map((cert: any) => (
                      <div
                        key={cert.id}
                        className="flex flex-col p-5 border rounded-lg hover:bg-gray-50 transition-all hover:shadow-md bg-white"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <Award className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base mb-2 line-clamp-2">
                              {cert.courses.title}
                            </p>
                            <p className="text-sm text-gray-600 font-mono break-all bg-gray-100 p-2 rounded">
                              {cert.certificate_number}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 pt-2 border-t">
                          <Calendar className="w-4 h-4" />
                          {new Date(cert.issued_at).toLocaleDateString(
                            "es-MX",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Teacher Details */}
        {selectedUser?.role === "teacher" && userDetails && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Cursos Creados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {userDetails.stats.totalCourses}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Publicados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {userDetails.stats.publishedCourses}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Estudiantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {userDetails.stats.totalStudents}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Ingresos Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${userDetails.stats.totalRevenue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Created Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookOpen className="w-6 h-6" />
                  Cursos Creados ({userDetails.courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.courses.length === 0 ? (
                  <p className="text-center text-gray-500 py-12 text-lg">
                    No ha creado cursos
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {userDetails.courses.map((course: any) => (
                      <div
                        key={course.id}
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white"
                      >
                        {course.thumbnail_url && (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-lg line-clamp-2 flex-1">
                              {course.title}
                            </h4>
                            <span className="font-bold text-xl text-green-600 flex-shrink-0">
                              ${course.price}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">
                              {course.category}
                            </Badge>
                            <Badge
                              variant={
                                course.is_published && course.is_approved
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {course.is_published && course.is_approved
                                ? "Publicado"
                                : "Borrador"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                            <div className="text-center">
                              <p className="text-gray-600 text-xs mb-1">
                                Estudiantes
                              </p>
                              <p className="font-bold text-lg flex items-center justify-center gap-1">
                                <UsersIcon className="w-4 h-4" />
                                {course.enrollmentCount}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600 text-xs mb-1">
                                Ingresos
                              </p>
                              <p className="font-bold text-lg flex items-center justify-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {course.revenue.toFixed(0)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600 text-xs mb-1">
                                Creado
                              </p>
                              <p className="text-sm font-medium">
                                {new Date(
                                  course.created_at
                                ).toLocaleDateString("es-MX", {
                                  month: "short",
                                  day: "numeric",
                                  year: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Admin Details */}
        {selectedUser?.role === "admin" && userDetails && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Cursos Aprobados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {userDetails.stats.coursesApproved}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Instructores Invitados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {userDetails.stats.instructorsInvited}
                  </div>
                </CardContent>
              </Card>
            </div>

            {userDetails.approvedCourses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Cursos Aprobados Recientemente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {userDetails.approvedCourses.map((course: any) => (
                      <div
                        key={course.id}
                        className="flex flex-col p-5 border rounded-lg hover:bg-gray-50 transition-all hover:shadow-md bg-white"
                      >
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base mb-3 line-clamp-2">
                              {course.title}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 pt-2 border-t">
                              <Calendar className="w-4 h-4" />
                              {new Date(course.approved_at).toLocaleDateString(
                                "es-MX",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Bottom Back Button */}
        <div className="flex justify-center pt-6">
          <Link href="/admin/users">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver a Usuarios
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper functions
async function loadStudentDetails(supabase: any, userId: string) {
  // Get enrolled courses with progress
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
        *,
        courses (
          id,
          title,
          thumbnail_url,
          category,
          price
        )
      `
    )
    .eq("student_id", userId)
    .order("purchased_at", { ascending: false });

  // Get progress for each course
  const coursesWithProgress = await Promise.all(
    enrollments?.map(async (enrollment: any) => {
      const { data: sections } = await supabase
        .from("sections")
        .select("id, lessons(id)")
        .eq("course_id", enrollment.course_id);

      const allLessonIds =
        sections?.flatMap((s: any) => s.lessons.map((l: any) => l.id)) || [];

      const { data: completedLessons } = await supabase
        .from("progress")
        .select("lesson_id")
        .eq("student_id", userId)
        .eq("is_completed", true)
        .in("lesson_id", allLessonIds);

      const progress =
        allLessonIds.length > 0
          ? Math.round(
              ((completedLessons?.length || 0) / allLessonIds.length) * 100
            )
          : 0;

      return {
        ...enrollment,
        progress,
        completedLessons: completedLessons?.length || 0,
        totalLessons: allLessonIds.length,
      };
    }) || []
  );

  // Get certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select(
      `
        *,
        courses (
          title
        )
      `
    )
    .eq("student_id", userId);

  // Get total spent
  const totalSpent =
    enrollments?.reduce((sum: number, e: any) => sum + (e.amount_paid || 0), 0) || 0;

  return {
    enrollments: coursesWithProgress,
    certificates: certificates || [],
    totalSpent,
    stats: {
      totalCourses: enrollments?.length || 0,
      completedCourses: coursesWithProgress.filter((c: any) => c.progress === 100)
        .length,
      certificatesEarned: certificates?.length || 0,
      totalSpent,
    },
  };
}

async function loadTeacherDetails(supabase: any, userId: string) {
  // Get created courses
  const { data: courses } = await supabase
    .from("courses")
    .select(
      `
        id,
        title,
        thumbnail_url,
        category,
        price,
        is_published,
        is_approved,
        created_at
      `
    )
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false });

  // Get enrollment counts and revenue for each course
  const coursesWithStats = await Promise.all(
    courses?.map(async (course: any) => {
      const { count: enrollmentCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id);

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("amount_paid")
        .eq("course_id", course.id);

      const revenue =
        enrollments?.reduce((sum: number, e: any) => sum + (e.amount_paid || 0), 0) ||
        0;

      return {
        ...course,
        enrollmentCount: enrollmentCount || 0,
        revenue,
      };
    }) || []
  );

  const totalStudents = coursesWithStats.reduce(
    (sum: number, c: any) => sum + c.enrollmentCount,
    0
  );
  const totalRevenue = coursesWithStats.reduce(
    (sum: number, c: any) => sum + c.revenue,
    0
  );
  const publishedCourses = coursesWithStats.filter(
    (c: any) => c.is_published && c.is_approved
  ).length;

  return {
    courses: coursesWithStats,
    stats: {
      totalCourses: courses?.length || 0,
      publishedCourses,
      totalStudents,
      totalRevenue,
    },
  };
}

async function loadAdminDetails(supabase: any, userId: string) {
  // Get admin activity - courses approved, users invited, etc.
  const { data: approvedCourses } = await supabase
    .from("courses")
    .select("id, title, approved_at")
    .eq("approved_by", userId)
    .order("approved_at", { ascending: false })
    .limit(10);

  const { data: invites } = await supabase
    .from("instructor_invites")
    .select("*")
    .eq("invited_by", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    approvedCourses: approvedCourses || [],
    invites: invites || [],
    stats: {
      coursesApproved: approvedCourses?.length || 0,
      instructorsInvited: invites?.length || 0,
    },
  };
}