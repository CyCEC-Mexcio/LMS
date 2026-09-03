import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function PendingCoursesPage() {
  const supabase = await createClient();

  const { data: pendingCourses } = await supabase
    .from("courses")
    .select(`
      *,
      profiles:teacher_id (
        full_name,
        avatar_url
      )
    `)
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto space-y-6 min-w-0 w-full">
      {/* Header */}
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
          Cursos Pendientes de Aprobación
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mt-1 break-words">
          Revisa y aprueba los cursos enviados por instructores
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto">
          <Link
            href="/admin/courses"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0"
          >
            Todos
          </Link>
          <Link
            href="/admin/courses/pending"
            className="border-blue-500 text-blue-600 whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0"
          >
            Pendientes de Aprobación ({pendingCourses?.length || 0})
          </Link>
        </nav>
      </div>

      {pendingCourses && pendingCourses.length > 0 ? (
        <div className="space-y-4">
          {pendingCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                {/* Thumbnail */}
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full sm:w-48 h-40 sm:h-32 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                  />
                ) : (
                  <div className="w-full sm:w-48 h-40 sm:h-32 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-sm">
                    Sin imagen
                  </div>
                )}

                {/* Course Info */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 self-start sm:self-auto flex-shrink-0">
                      Pendiente
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[11px]">Instructor</p>
                      <p className="font-medium text-gray-900 truncate">
                        {course.instructor_name || "Sin instructor"}
                      </p>
                      {course.organization && (
                        <p className="text-gray-500 text-[10px] truncate">
                          {course.organization}
                        </p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[11px]">Categoría</p>
                      <p className="font-medium text-gray-900 truncate">
                        {course.category || "General"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[11px]">Nivel</p>
                      <p className="font-medium text-gray-900 capitalize truncate">
                        {course.level || "Todos"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[11px]">Precio</p>
                      <p className="font-semibold text-gray-900">
                        ${course.price?.toFixed(2) || "0.00"} MXN
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-gray-400">
                    Enviado el{" "}
                    {new Date(course.created_at).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 border-t border-gray-100 pt-4">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="w-full sm:flex-1"
                >
                  <Button variant="outline" className="w-full min-h-[44px]">
                    👁️ Revisar Curso
                  </Button>
                </Link>
                <Link
                  href={`/admin/courses/${course.id}/approve`}
                  className="w-full sm:flex-1"
                >
                  <Button className="w-full min-h-[44px] bg-green-600 hover:bg-green-700 text-white">
                    ✓ Aprobar Curso
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-8 sm:p-12 text-center">
          <div className="text-5xl sm:text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay cursos pendientes
          </h3>
          <p className="text-gray-600 text-sm">
            Todos los cursos han sido revisados
          </p>
        </div>
      )}
    </div>
  );
}