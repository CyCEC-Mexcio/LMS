// app/(platform)/teacher/analytics/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Star,
  BookOpen,
} from "lucide-react";

export default async function TeacherAnalyticsPage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get all courses with detailed analytics
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      *,
      enrollments (
        id,
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
    .eq("teacher_id", profile.id)
    .eq("is_published", true)
    .eq("is_approved", true);

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
              Publica un curso para comenzar a ver estadísticas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall statistics
  const totalEnrollments = courses.reduce(
    (acc, course) => acc + (course.enrollments?.length || 0),
    0
  );

  const totalRevenue = courses.reduce((acc, course) => {
    const courseRevenue = course.enrollments?.reduce(
      (sum: number, e: any) => sum + (Number(e.amount_paid) || 0),
      0
    ) || 0;
    return acc + courseRevenue;
  }, 0);

  const averageRating = courses.reduce((acc, course) => {
    if (!course.reviews || course.reviews.length === 0) return acc;
    const courseAvg =
      course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
      course.reviews.length;
    return acc + courseAvg;
  }, 0) / courses.length || 0;

  // Calculate course-specific metrics
  const coursesWithMetrics = courses.map((course) => {
    const enrollmentCount = course.enrollments?.length || 0;
    const revenue = course.enrollments?.reduce(
      (sum: number, e: any) => sum + (Number(e.amount_paid) || 0),
      0
    ) || 0;
    
    const avgRating = course.reviews?.length
      ? course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        course.reviews.length
      : 0;

    // Calculate enrollment trend (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentEnrollments = course.enrollments?.filter(
      (e: any) => new Date(e.purchased_at) > thirtyDaysAgo
    ).length || 0;

    const previousEnrollments = course.enrollments?.filter((e: any) => {
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