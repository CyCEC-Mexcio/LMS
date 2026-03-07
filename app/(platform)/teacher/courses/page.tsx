import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";

type Course = {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  is_approved: boolean;
  pending_approval: boolean;
  thumbnail_url: string | null;
  price: number | null;
  created_at: string;
  slug: string | null;
};

const getCourseStatus = (course: Course) => {
  if (course.is_published && course.is_approved)
    return { label: "Publicado", color: "bg-green-100 text-green-700" };
  if (course.pending_approval)
    return { label: "En revisión", color: "bg-yellow-100 text-yellow-700" };
  if (course.is_approved && !course.is_published)
    return { label: "Aprobado", color: "bg-blue-100 text-blue-700" };
  return { label: "Borrador", color: "bg-gray-100 text-gray-600" };
};

export default async function TeacherCoursesPage() {
  const profile = await getUserProfile();

  if (!profile || profile.role !== "teacher") {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, is_published, is_approved, pending_approval, thumbnail_url, price, created_at, slug")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses:", error);
  }

  const courseList: Course[] = courses ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Cursos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {courseList.length === 0
              ? "Aún no tienes cursos creados"
              : `${courseList.length} curso${courseList.length !== 1 ? "s" : ""} en total`}
          </p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span>➕</span>
          Crear Curso
        </Link>
      </div>

      {/* Empty State */}
      {courseList.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-4xl mb-4">📖</p>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Aún no tienes cursos
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Empieza creando tu primer curso para compartir tu conocimiento.
          </p>
          <Link
            href="/teacher/courses/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Crear mi primer curso
          </Link>
        </div>
      )}

      {/* Course Grid */}
      {courseList.length > 0 && (
        <div className="grid gap-4">
          {courseList.map((course) => {
            const { label, color } = getCourseStatus(course);
            return (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5 hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      📖
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">
                      {course.title}
                    </h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${color}`}>
                      {label}
                    </span>
                  </div>
                  {course.description && (
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {course.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Creado el{" "}
                    {new Date(course.created_at).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {course.price != null && (
                      <span className="ml-3 font-medium text-gray-600">
                        ${course.price.toFixed(2)} MXN
                      </span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/teacher/courses/${course.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/teacher/courses/${course.id}/chapters`}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Capítulos
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}