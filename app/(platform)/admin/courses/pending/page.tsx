import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function PendingCoursesPage() {
  const supabase = createClient(await cookies());

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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Cursos Pendientes de Aprobación
        </h1>
        <p className="text-gray-600 mt-1">
          Revisa y aprueba los cursos enviados por instructores
        </p>
      </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
            <Link
            href="/admin/courses"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
            Todos
            </Link>
            <Link
            href="/admin/courses/pending"
            className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
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
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-6">
                {/* Thumbnail */}
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-48 h-32 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-48 h-32 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400">
                    Sin imagen
                  </div>
                )}

                {/* Course Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {course.description}
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Pendiente
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Instructor</p>
                      <p className="text-sm font-medium text-gray-900">
                        {course.instructor_name}
                      </p>
                      {course.organization && (
                        <p className="text-xs text-gray-600">
                          {course.organization}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Categoría</p>
                      <p className="text-sm font-medium text-gray-900">
                        {course.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nivel</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {course.level}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Precio</p>
                      <p className="text-sm font-medium text-gray-900">
                        ${course.price?.toFixed(2) || "0.00"} MXN
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
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
              <div className="mt-6 flex gap-3 border-t border-gray-200 pt-4">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    👁️ Revisar Curso
                  </Button>
                </Link>
                <Link
                  href={`/admin/courses/${course.id}/approve`}
                  className="flex-1"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    ✓ Aprobar Curso
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay cursos pendientes
          </h3>
          <p className="text-gray-600">
            Todos los cursos han sido revisados
          </p>
        </div>
      )}
    </div>
  );
}