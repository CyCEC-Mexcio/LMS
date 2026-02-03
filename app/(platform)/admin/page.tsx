import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Administración
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona cursos, instructores y usuarios de la plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Course */}
        <Link href="/admin/courses/new">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">➕</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Crear Curso
            </h3>
            <p className="text-sm text-gray-600">
              Crea un nuevo curso desde cero
            </p>
          </div>
        </Link>

        {/* Manage Courses */}
        <Link href="/admin/courses">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gestionar Cursos
            </h3>
            <p className="text-sm text-gray-600">
              Ver y editar todos los cursos
            </p>
          </div>
        </Link>

        {/* Pending Approvals */}
        <Link href="/admin/courses/pending">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cursos Pendientes
            </h3>
            <p className="text-sm text-gray-600">
              Aprobar cursos de instructores
            </p>
          </div>
        </Link>

        {/* Create Instructor */}
        <Link href="/admin/create-instructor">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Crear Instructor
            </h3>
            <p className="text-sm text-gray-600">
              Invitar nuevos instructores
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}