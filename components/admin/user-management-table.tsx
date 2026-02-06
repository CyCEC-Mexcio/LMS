'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { UserX, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserManagementTableProps {
  users: any[]
  currentUserId: string
}

export default function UserManagementTable({ users, currentUserId }: UserManagementTableProps) {
  const supabase = createClient()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      console.log('Starting deletion for user:', userToDelete.id)

      // Check if user has any active enrollments (for students)
      if (userToDelete.role === 'student') {
        const { count, error: countError } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userToDelete.id)

        if (countError) {
          console.error('Error checking enrollments:', countError)
          throw new Error('Error al verificar inscripciones')
        }

        if (count && count > 0) {
          setError('No se puede eliminar un estudiante con cursos activos')
          setLoading(false)
          return
        }
      }

      // Check if user has created courses (for teachers)
      if (userToDelete.role === 'teacher') {
        const { count, error: countError } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', userToDelete.id)

        if (countError) {
          console.error('Error checking courses:', countError)
          throw new Error('Error al verificar cursos')
        }

        if (count && count > 0) {
          setError('No se puede eliminar un instructor con cursos creados')
          setLoading(false)
          return
        }
      }

      // OPTION 1: Use the database function (if you created it)
      // Uncomment this and comment out OPTION 2 if you want to delete auth.users too
      /*
      const { error: deleteError } = await supabase.rpc('delete_user_and_auth', {
        user_id: userToDelete.id
      })
      */

      // OPTION 2: Delete only profile (auth.users remains)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        throw new Error(deleteError.message || 'Error al eliminar usuario')
      }

      console.log('User deleted successfully')
      
      // Close dialog
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      
      // Refresh the page data
      router.refresh()
      
      // Optional: Show success message
      alert('Usuario eliminado exitosamente')
      
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setError(error.message || 'Error desconocido al eliminar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
            {users.map((user: any) => (
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
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                        <span className="text-blue-600 font-bold text-xl">
                          {user.full_name?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-base text-gray-900">
                        {user.full_name || "Sin nombre"}
                      </p>
                      <p className="text-sm text-gray-500 truncate max-w-[250px] font-mono">
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
                  <div className="flex items-center justify-center gap-3">
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