import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PublishToggle from "@/components/course/publish-toggle";
import DeleteCourseButton from "@/components/course/delete-course-button";

export default async function AdminCoursesPage() {
  const supabase = createClient(await cookies());

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      *,
      profiles:teacher_id (
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Todos los Cursos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todos los cursos de la plataforma
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button>Crear Curso</Button>
        </Link>
      </div>

      {/* Tabs for filtering */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/admin/courses"
            className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Todos ({courses?.length || 0})
          </Link>
          <Link
            href="/admin/courses/pending"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Pendientes de Aprobación (
            {courses?.filter((c) => !c.is_approved).length || 0})
          </Link>
        </nav>
      </div>

      {courses && courses.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publicado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-16 h-12 object-cover rounded mr-3"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-400 text-xs">
                          Sin imagen
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {course.title}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {course.level}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.instructor_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {course.organization || "Independiente"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {course.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${course.price?.toFixed(2) || "0.00"} MXN
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!course.is_approved ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pendiente Aprobación
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Aprobado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <PublishToggle
                      courseId={course.id}
                      isPublished={course.is_published || false}
                      isApproved={course.is_approved || false}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      {!course.is_approved && (
                        <Link
                          href={`/admin/courses/${course.id}/approve`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Aprobar
                        </Link>
                      )}
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </Link>
                      <DeleteCourseButton
                        courseId={course.id}
                        courseTitle={course.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay cursos todavía
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza creando tu primer curso
          </p>
          <Link href="/admin/courses/new">
            <Button>Crear Primer Curso</Button>
          </Link>
        </div>
      )}
    </div>
  );
}