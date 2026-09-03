import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PublishToggle from "@/components/course/publish-toggle";
import DeleteCourseButton from "@/components/course/delete-course-button";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

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
    <div className="max-w-6xl mx-auto space-y-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Todos los Cursos</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 break-words">
            Gestiona todos los cursos de la plataforma
          </p>
        </div>
        <Link href="/admin/courses/new" className="self-start sm:self-auto">
          <Button className="min-h-[44px]">Crear Curso</Button>
        </Link>
      </div>

      {/* Tabs for filtering */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto">
          <Link
            href="/admin/courses"
            className="border-blue-500 text-blue-600 whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0"
          >
            Todos ({courses?.length || 0})
          </Link>
          <Link
            href="/admin/courses/pending"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0"
          >
            Pendientes de Aprobación (
            {courses?.filter((c) => !c.is_approved).length || 0})
          </Link>
        </nav>
      </div>

      {courses && courses.length > 0 ? (
        <>
          {/* Mobile Card View (shown on < 768px) - all actions and edit buttons directly accessible without swiping */}
          <div className="md:hidden space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3"
              >
                {/* Header: Thumbnail + Title + Level + Category */}
                <div className="flex items-start gap-3 min-w-0">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-16 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-14 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                      Sin imagen
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 break-words line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 capitalize">
                        {course.level}
                      </span>
                      {course.category && (
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700">
                          {course.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details: Instructor + Price + Status */}
                <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="text-gray-400 text-[11px]">Instructor</p>
                    <p className="font-medium text-gray-800 truncate">
                      {course.instructor_name || "Sin instructor"}
                    </p>
                    <p className="text-gray-400 text-[10px] truncate">
                      {course.organization || "Independiente"}
                    </p>
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-gray-400 text-[11px]">Precio</p>
                    <p className="font-semibold text-gray-900">
                      ${course.price?.toFixed(2) || "0.00"} MXN
                    </p>
                    <div className="mt-0.5">
                      {!course.is_approved ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-yellow-100 text-yellow-800 inline-block">
                          Pendiente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-800 inline-block">
                          Aprobado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Publish Switch & Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Publicado:</span>
                    <PublishToggle
                      courseId={course.id}
                      isPublished={course.is_published || false}
                      isApproved={course.is_approved || false}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!course.is_approved && (
                      <Link
                        href={`/admin/courses/${course.id}/approve`}
                        className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg min-h-[36px] flex items-center transition-colors"
                      >
                        Aprobar
                      </Link>
                    )}
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg min-h-[36px] flex items-center transition-colors"
                    >
                      Editar
                    </Link>
                    <DeleteCourseButton
                      courseId={course.id}
                      courseTitle={course.title}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet Table View (shown on >= 768px) with horizontal scroll support */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="min-w-[760px] w-full divide-y divide-gray-200">
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
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-16 h-12 object-cover rounded mr-3 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-12 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                              Sin imagen
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {course.title}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {course.level}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {course.instructor_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {course.organization || "Independiente"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {course.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
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
                              className="text-green-600 hover:text-green-900 text-xs font-semibold px-2 py-1 rounded hover:bg-green-50"
                            >
                              Aprobar
                            </Link>
                          )}
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="text-blue-600 hover:text-blue-900 text-xs font-semibold px-2 py-1 rounded hover:bg-blue-50"
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
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <div className="text-5xl sm:text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay cursos todavía
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Comienza creando tu primer curso
          </p>
          <Link href="/admin/courses/new">
            <Button className="min-h-[44px]">Crear Primer Curso</Button>
          </Link>
        </div>
      )}
    </div>
  );
}