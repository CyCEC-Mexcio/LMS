'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { UserX, Eye, Mail, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserManagementTableProps {
  users: any[]
  currentUserId: string
  activeRole?: string
}

export default function UserManagementTable({ users, currentUserId, activeRole = 'all' }: UserManagementTableProps) {
  const supabase = createClient()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local search filter
  const [searchTerm, setSearchTerm] = useState('')

  function handleDeleteClick(user: any) {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
    setError(null)
  }

  async function handleDeleteUser() {
    if (!userToDelete) return

    setLoading(true)
    setError(null)
    
    try {
      if (userToDelete.role === 'student') {
        const { count, error: countError } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userToDelete.id)

        if (countError) throw new Error('Error al verificar inscripciones')

        if (count && count > 0) {
          setError('No se puede eliminar un estudiante con cursos activos')
          setLoading(false)
          return
        }
      }

      if (userToDelete.role === 'teacher') {
        const { count, error: countError } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', userToDelete.id)

        if (countError) throw new Error('Error al verificar cursos')

        if (count && count > 0) {
          setError('No se puede eliminar un instructor con cursos creados')
          setLoading(false)
          return
        }
      }

      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id)

      if (deleteError) throw new Error(deleteError.message || 'Error al eliminar usuario')

      setDeleteDialogOpen(false)
      setUserToDelete(null)
      router.refresh()
      alert('Usuario eliminado exitosamente')
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setError(error.message || 'Error al eliminar usuario')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = user.full_name?.toLowerCase().includes(term);
    const emailMatch = user.email?.toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  const handleRoleTabChange = (role: string) => {
    if (role === 'all') {
      router.push('/admin/users');
    } else {
      router.push(`/admin/users?role=${role}`);
    }
  };

  return (
    <>
      {/* Search and Role Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b">
        {/* Role Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'student', label: 'Estudiantes' },
            { id: 'teacher', label: 'Instructores' },
            { id: 'admin', label: 'Admin' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleRoleTabChange(tab.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeRole === tab.id
                  ? 'bg-white text-[#C4161C] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 bg-gray-50">
              <th className="text-left py-4 px-6 text-base font-semibold text-gray-700">Usuario</th>
              <th className="text-center py-4 px-6 text-base font-semibold text-gray-700">Rol</th>
              <th className="text-center py-4 px-6 text-base font-semibold text-gray-700">Cursos</th>
              <th className="text-center py-4 px-6 text-base font-semibold text-gray-700">Fecha de Registro</th>
              <th className="text-center py-4 px-6 text-base font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user: any) => (
              <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-4">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || "User"}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-200">
                        <span className="text-[#C4161C] font-bold text-xl">
                          {user.full_name?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-base text-gray-900">
                        {user.full_name || "Sin nombre"}
                      </p>
                      {user.email && (
                        <p className="text-xs text-gray-600 font-medium">{user.email}</p>
                      )}
                      <p className="text-xs text-gray-400 truncate max-w-[250px] font-mono mt-0.5">
                        ID: {user.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-center py-5 px-6">
                  <Badge
                    variant="outline"
                    className={`text-sm py-1.5 px-3 font-semibold ${
                      user.role === "admin"
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : user.role === "teacher"
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                    }`}
                  >
                    {user.role === "student" && "Estudiante"}
                    {user.role === "teacher" && "Instructor"}
                    {user.role === "admin" && "Admin"}
                  </Badge>
                </td>
                <td className="text-center py-5 px-6">
                  {user.role === "student" && (
                    <span className="text-base font-bold text-gray-700">
                      {user.enrollments?.[0]?.count || 0} <span className="font-normal text-gray-600">inscritos</span>
                    </span>
                  )}
                  {user.role === "teacher" && (
                    <span className="text-base font-semibold text-purple-600">
                      Instructor
                    </span>
                  )}
                  {user.role === "admin" && (
                    <span className="text-base font-semibold text-orange-600">
                      Admin
                    </span>
                  )}
                </td>
                <td className="text-center py-5 px-6 text-base text-gray-600">
                  {new Date(user.created_at).toLocaleDateString("es-MX", {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="text-center py-5 px-6">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {user.email && (
                      <a
                        href={`mailto:${user.email}?subject=Contacto%20desde%20CyCEC%20M%C3%A9xico&body=Hola%20${encodeURIComponent(user.full_name || 'estudiante')},`}
                        className="inline-block"
                      >
                        <Button
                          size="default"
                          variant="outline"
                          className="font-medium text-gray-700 hover:text-[#C4161C] hover:bg-red-50 border-gray-200"
                          title="Enviar correo"
                        >
                          <Mail className="w-4 h-4 mr-1.5 text-red-600" />
                          Correo
                        </Button>
                      </a>
                    )}
                    <Link href={`/admin/users/${user.id}`}>
                      <Button
                        size="default"
                        variant="outline"
                        className="font-medium"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </Link>
                    {user.id !== currentUserId && (
                      <Button
                        size="default"
                        variant="destructive"
                        onClick={() => handleDeleteClick(user)}
                        className="px-3"
                      >
                        <UserX size={16} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de{' '}
              <strong>{userToDelete?.full_name}</strong> y todos sus datos asociados.
              {userToDelete?.role === 'student' && (
                <p className="mt-2 text-yellow-600">
                  Solo se pueden eliminar estudiantes sin cursos activos.
                </p>
              )}
              {userToDelete?.role === 'teacher' && (
                <p className="mt-2 text-yellow-600">
                  Solo se pueden eliminar instructores sin cursos creados.
                </p>
              )}
              {error && (
                <p className="mt-3 text-red-600 font-semibold bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Eliminando...' : 'Eliminar Usuario'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}