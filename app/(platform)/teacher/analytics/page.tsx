import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  DollarSign,
  Star,
  BookOpen,
  Mail,
  GraduationCap,
} from "lucide-react";
import { StudentContactButton } from "@/components/teacher/student-contact-button";

export default async function TeacherAnalyticsPage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/login");
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get all courses for this teacher with detailed analytics
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
        student_id,
        amount_paid,
        purchased_at
      ),
      reviews (
        id,
        rating,
        comment,
        created_at,
        profiles!student_id (
          full_name
        )
      )
    `)
    .eq("teacher_id", profile.id);

  if (!courses || courses.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Analíticas</h1>
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No hay datos de analíticas
            </h3>
            <p className="text-gray-600">
              Crea tu primer curso para comenzar a ver estadísticas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teacherCourses = courses ?? [];
  const teacherCourseIds = teacherCourses.map((c) => c.id);

  // Map courseId -> lessonIds[] and lessonId -> course info
  const courseLessonsMap = new Map<string, string[]>();
  const lessonToCourseMap = new Map<string, { courseId: string; courseTitle: string }>();

  teacherCourses.forEach((course) => {
    const lessonIds: string[] = [];
    (course.sections ?? []).forEach((sec: any) => {
      (sec.lessons ?? []).forEach((l: any) => {
        if (l.id) {
          lessonIds.push(l.id);
          lessonToCourseMap.set(l.id, { courseId: course.id, courseTitle: course.title });
        }
      });
    });
    courseLessonsMap.set(course.id, lessonIds);
  });

  const allTeacherLessonIds = Array.from(lessonToCourseMap.keys());

  // 1. Fetch all progress records for any lesson in this teacher's courses (using admin client to bypass RLS)
  let progressRecords: any[] = [];
  if (allTeacherLessonIds.length > 0) {
    const { data: progressData } = await adminSupabase
      .from("progress")
      .select("student_id, lesson_id, is_completed, completed_at")
      .in("lesson_id", allTeacherLessonIds);
    progressRecords = progressData ?? [];
  }

  // 2. Fetch all enrollment records for this teacher's courses
  let enrollmentRecords: any[] = [];
  if (teacherCourseIds.length > 0) {
    const { data: enrollmentsData } = await adminSupabase
      .from("enrollments")
      .select("id, student_id, course_id, purchased_at, amount_paid")
      .in("course_id", teacherCourseIds);
    enrollmentRecords = enrollmentsData ?? [];
  }

  // 3. Find all unique (student_id, course_id) pairs from both enrollments and progress
  const studentCoursesMap = new Map<string, { courseId: string; purchasedAt?: string }[]>();

  enrollmentRecords.forEach((e) => {
    if (!e.student_id || !e.course_id) return;
    const list = studentCoursesMap.get(e.student_id) || [];
    if (!list.some((item) => item.courseId === e.course_id)) {
      list.push({ courseId: e.course_id, purchasedAt: e.purchased_at });
      studentCoursesMap.set(e.student_id, list);
    }
  });

  progressRecords.forEach((p) => {
    if (!p.student_id || !p.lesson_id) return;
    const courseInfo = lessonToCourseMap.get(p.lesson_id);
    if (!courseInfo) return;
    const list = studentCoursesMap.get(p.student_id) || [];
    if (!list.some((item) => item.courseId === courseInfo.courseId)) {
      list.push({ courseId: courseInfo.courseId, purchasedAt: p.completed_at });
      studentCoursesMap.set(p.student_id, list);
    }
  });

  const allStudentIds = Array.from(studentCoursesMap.keys());

  // 4. Fetch profiles + Auth user data (emails & full names) for all discovered students
  const profilesMap = new Map<
    string,
    { id: string; full_name: string | null; email: string | null; avatar_url: string | null }
  >();

  if (allStudentIds.length > 0) {
    // Query profiles table with admin client (bypasses RLS)
    const { data: profilesData } = await adminSupabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", allStudentIds);

    (profilesData ?? []).forEach((prof) => {
      profilesMap.set(prof.id, {
        id: prof.id,
        full_name: prof.full_name,
        email: null,
        avatar_url: prof.avatar_url,
      });
    });

    // Query auth.admin to resolve user emails and names
    try {
      await Promise.all(
        allStudentIds.map(async (studentId) => {
          try {
            const { data: authUser } = await adminSupabase.auth.admin.getUserById(studentId);
            if (authUser?.user) {
              const u = authUser.user;
              const existing = profilesMap.get(studentId);
              const resolvedName =
                existing?.full_name ||
                u.user_metadata?.full_name ||
                u.user_metadata?.name ||
                (u.email ? u.email.split("@")[0] : "Estudiante");
              const resolvedEmail = u.email || "";
              const resolvedAvatar =
                existing?.avatar_url ||
                u.user_metadata?.avatar_url ||
                u.user_metadata?.picture ||
                null;

              profilesMap.set(studentId, {
                id: studentId,
                full_name: resolvedName,
                email: resolvedEmail,
                avatar_url: resolvedAvatar,
              });
            }
          } catch (err) {
            console.error("Error fetching user from auth.admin:", err);
          }
        })
      );
    } catch (err) {
      console.error("Error batch resolving auth users:", err);
    }
  }

  // 5. Track completed lessons: Set<"studentId:lessonId">
  const completedSet = new Set<string>();
  progressRecords.forEach((p) => {
    if (p.is_completed) {
      completedSet.add(`${p.student_id}:${p.lesson_id}`);
    }
  });

  // 6. Build the student progress list
  const studentProgressList: {
    id: string;
    studentName: string;
    studentEmail: string;
    studentAvatar: string | null;
    courseTitle: string;
    purchasedAt: string;
    completedLessons: number;
    totalLessons: number;
    progressPct: number;
  }[] = [];

  studentCoursesMap.forEach((courseList, studentId) => {
    const studentProfile = profilesMap.get(studentId);
    const studentName = studentProfile?.full_name || "Estudiante";
    const studentEmail = studentProfile?.email || "";
    const studentAvatar = studentProfile?.avatar_url || null;

    courseList.forEach(({ courseId, purchasedAt }) => {
      const course = teacherCourses.find((c) => c.id === courseId);
      const courseTitle = course?.title || "Curso";
      const lessonIds = courseLessonsMap.get(courseId) || [];
      const totalLessons = lessonIds.length;
      const completedLessons = lessonIds.filter((lId) =>
        completedSet.has(`${studentId}:${lId}`)
      ).length;
      const progressPct =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      studentProgressList.push({
        id: `${studentId}-${courseId}`,
        studentName,
        studentEmail,
        studentAvatar,
        courseTitle,
        purchasedAt: purchasedAt || new Date().toISOString(),
        completedLessons,
        totalLessons,
        progressPct,
      });
    });
  });

  studentProgressList.sort((a, b) => b.progressPct - a.progressPct);

  // Calculate overall statistics
  const totalEnrollments = studentProgressList.length;

  const totalRevenue = teacherCourses.reduce((acc, course) => {
    const courseRevenue = (course.enrollments ?? []).reduce(
      (sum: number, e: any) => sum + (Number(e.amount_paid) || 0),
      0
    );
    return acc + courseRevenue;
  }, 0);

  const averageRating = teacherCourses.reduce((acc, course) => {
    if (!course.reviews || course.reviews.length === 0) return acc;
    const courseAvg =
      course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
      course.reviews.length;
    return acc + courseAvg;
  }, 0) / (teacherCourses.length || 1) || 0;

  // Calculate course-specific metrics
  const coursesWithMetrics = teacherCourses.map((course) => {
    const courseStudents = new Set<string>();
    enrollmentRecords.filter((e) => e.course_id === course.id).forEach((e) => courseStudents.add(e.student_id));
    progressRecords.filter((p) => lessonToCourseMap.get(p.lesson_id)?.courseId === course.id).forEach((p) => courseStudents.add(p.student_id));
    const enrollmentCount = courseStudents.size;

    const revenue = (course.enrollments ?? []).reduce(
      (sum: number, e: any) => sum + (Number(e.amount_paid) || 0),
      0
    );
    
    const avgRating = course.reviews?.length
      ? course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        course.reviews.length
      : 0;

    // Calculate enrollment trend (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentEnrollments = (course.enrollments ?? []).filter(
      (e: any) => new Date(e.purchased_at) > thirtyDaysAgo
    ).length || 0;

    const previousEnrollments = (course.enrollments ?? []).filter((e: any) => {
      const date = new Date(e.purchased_at);
      return date > sixtyDaysAgo && date <= thirtyDaysAgo;
    }).length || 0;

    const trend =
      previousEnrollments > 0
        ? ((recentEnrollments - previousEnrollments) / previousEnrollments) * 100
        : recentEnrollments > 0
        ? 100
        : 0;

    return {
      ...course,
      enrollmentCount,
      revenue,
      avgRating,
      recentEnrollments,
      trend,
    };
  });

  // Sort courses by enrollments
  const topCourses = [...coursesWithMetrics]
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, 5);

  // Get recent reviews
  const recentReviews = courses
    .flatMap((course) =>
      (course.reviews || []).map((review: any) => ({
        ...review,
        courseTitle: course.title,
      }))
    )
    .sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analíticas del Instructor</h1>
        <p className="text-gray-600">
          Rendimiento de tus cursos y estadísticas clave
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users size={16} />
              Total Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totalEnrollments}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Inscripciones totales
            </p>
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
            <div className="text-3xl font-bold text-green-600">
              ${totalRevenue.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-gray-500 mt-1">MXN</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Star size={16} />
              Calificación Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-gray-500 mt-1">de 5.0 estrellas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BookOpen size={16} />
              Cursos Publicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {courses.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Cursos activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Cursos con Mejor Desempeño</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCourses.map((course, index) => (
              <div
                key={course.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-2xl font-bold text-gray-400 w-8">
                  #{index + 1}
                </div>

                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                )}

                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{course.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {course.enrollmentCount} estudiantes
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} />
                      ${course.revenue.toLocaleString("es-MX")}
                    </span>
                    {course.avgRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        {course.avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {course.trend !== 0 && (
                    <Badge
                      variant={course.trend > 0 ? "default" : "secondary"}
                      className={
                        course.trend > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      <TrendingUp
                        size={12}
                        className={`mr-1 ${course.trend < 0 ? "rotate-180" : ""}`}
                      />
                      {Math.abs(course.trend).toFixed(0)}%
                    </Badge>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {course.recentEnrollments} últimos 30 días
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Courses Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Desempeño por Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Curso</th>
                  <th className="text-center py-3 px-2">Estudiantes</th>
                  <th className="text-center py-3 px-2">Ingresos</th>
                  <th className="text-center py-3 px-2">Calificación</th>
                  <th className="text-center py-3 px-2">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {coursesWithMetrics.map((course) => (
                  <tr key={course.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="font-medium">{course.title}</div>
                      <div className="text-xs text-gray-500">
                        ${Number(course.price).toLocaleString("es-MX")} MXN
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      {course.enrollmentCount}
                    </td>
                    <td className="text-center py-3 px-2">
                      ${course.revenue.toLocaleString("es-MX")}
                    </td>
                    <td className="text-center py-3 px-2">
                      {course.avgRating > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star
                            size={14}
                            className="fill-yellow-400 text-yellow-400"
                          />
                          {course.avgRating.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-2">
                      {course.trend !== 0 ? (
                        <Badge
                          variant={course.trend > 0 ? "default" : "secondary"}
                          className={
                            course.trend > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {course.trend > 0 ? "+" : ""}
                          {course.trend.toFixed(0)}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Student Progress & Direct Follow-up Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#C4161C]" />
            Progreso y Seguimiento de Estudiantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentProgressList.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Aún no hay estudiantes inscritos en tus cursos.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Estudiante</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Curso</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Progreso</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Estado</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                  </tr>
                </thead>
                <tbody>
                  {studentProgressList.map((st) => {
                    return (
                      <tr key={st.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {st.studentAvatar ? (
                              <img src={st.studentAvatar} alt={st.studentName} className="w-9 h-9 rounded-full object-cover border" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-[#C4161C] font-bold text-sm">
                                {st.studentName[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{st.studentName}</p>
                              {st.studentEmail && (
                                <p className="text-xs text-gray-500 font-medium">{st.studentEmail}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-800">
                          {st.courseTitle}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="w-36 mx-auto space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>{st.completedLessons}/{st.totalLessons} lecciones</span>
                              <span className="font-bold text-[#C4161C]">{st.progressPct}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-[#C4161C] h-2 rounded-full transition-all" style={{ width: `${st.progressPct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {st.progressPct === 100 ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Completado</Badge>
                          ) : st.progressPct >= 40 ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">En Progreso</Badge>
                          ) : st.progressPct > 0 ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">En Riesgo (&lt;40%)</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">Sin Iniciar</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <StudentContactButton
                            studentName={st.studentName}
                            studentEmail={st.studentEmail}
                            courseTitle={st.courseTitle}
                            progressPct={st.progressPct}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reseñas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReviews.map((review: any) => (
                <div key={review.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {review.profiles?.full_name || "Usuario"}
                      </p>
                      <p className="text-sm text-gray-600">{review.courseTitle}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString("es-MX")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}