'use client'

import { useState } from 'react'
import { useUsers } from '@/hooks/useUsers'
import { CreateUserData, UserRole } from '@/types/user'
import Header from '@/components/layout/Header'
import { colors } from '@/styles/colors'
import LoadingModal from '@/components/ui/LoadingModal'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PermissionButton from '@/components/ui/PermissionButton'
import { useActivityLogger } from '@/hooks/useActivityLogger'

const roleLabels: Record<UserRole, string> = {
  root: 'Root',
  admin: 'Administrador',
  manager: 'Gerente',
  cajero: 'Cajero',
  usuario: 'Usuario'
}



export default function UserManagement() {
  const { users, loading, createUser, updateUser, deleteUser, clearCache } = useUsers()
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    role: 'usuario'
  })
  const [editData, setEditData] = useState({ name: '', role: 'usuario' as UserRole })
  const [operationLoading, setOperationLoading] = useState(false)
  const [showCleanupModal, setShowCleanupModal] = useState(false)
  const [cleanupStep, setCleanupStep] = useState('')
  const { logActivity } = useActivityLogger()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOperationLoading(true)
    
    const result = await createUser(formData)
    
    setOperationLoading(false)
    if (result.success) {
      await logActivity({
        type: 'user_created',
        description: `Usuario creado: ${formData.name} (${formData.role})`,
        metadata: { email: formData.email, role: formData.role }
      })
      setShowForm(false)
      setFormData({ email: '', password: '', name: '', role: 'usuario' })
      
      alert('Usuario creado exitosamente. El usuario podrá iniciar sesión con sus credenciales.')
      window.location.reload() // Solo recargar para mostrar el nuevo usuario
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleEdit = (user: any) => {
    setEditingUser(user.id)
    setEditData({ name: user.name, role: user.role })
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    
    setOperationLoading(true)
    const result = await updateUser(editingUser, editData)
    setOperationLoading(false)
    
    if (result.success) {
      await logActivity({
        type: 'user_updated',
        description: `Usuario actualizado: ${editData.name}`,
        metadata: { userId: editingUser, newRole: editData.role }
      })
      setEditingUser(null)
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (confirm(`¿Eliminar usuario ${userName}?`)) {
      setOperationLoading(true)
      const result = await deleteUser(userId)
      setOperationLoading(false)
      
      if (result.success) {
        await logActivity({
          type: 'user_deleted',
          description: `Usuario eliminado: ${userName}`,
          metadata: { userId }
        })
      } else {
        alert('Error: ' + result.error)
      }
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setOperationLoading(true)
    const result = await updateUser(userId, { active: !currentStatus })
    if (result.success) {
      const user = users.find(u => u.id === userId)
      await logActivity({
        type: 'user_updated',
        description: `Usuario ${!currentStatus ? 'activado' : 'desactivado'}: ${user?.name}`,
        metadata: { userId, newStatus: !currentStatus }
      })
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
    setOperationLoading(false)
  }



  return (
    <ProtectedRoute module="users">
      <div className="min-h-screen bg-gray-50">
        <Header />
      <LoadingModal isOpen={loading} message="Cargando usuarios..." />
      <LoadingModal isOpen={operationLoading} message="Procesando..." />
      <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setShowCleanupModal(true)
              
              setCleanupStep('Limpiando localStorage...')
              await new Promise(resolve => setTimeout(resolve, 500))
              localStorage.clear()
              
              setCleanupStep('Limpiando sessionStorage...')
              await new Promise(resolve => setTimeout(resolve, 500))
              sessionStorage.clear()
              
              setCleanupStep('Limpiando IndexedDB de Firebase...')
              await new Promise(resolve => setTimeout(resolve, 500))
              try {
                // Limpiar bases de datos conocidas de Firebase
                const firebaseDBs = ['firebaseLocalStorageDb', 'firebase-heartbeat-database', 'firebase-installations-database']
                for (const dbName of firebaseDBs) {
                  try {
                    indexedDB.deleteDatabase(dbName)
                  } catch (e) {
                    // Ignorar errores individuales
                  }
                }
              } catch (error) {
              }
              
              setCleanupStep('Limpiando cookies de Firebase...')
              await new Promise(resolve => setTimeout(resolve, 500))
              document.cookie.split(";").forEach(c => {
                const eqPos = c.indexOf("=")
                const name = eqPos > -1 ? c.substr(0, eqPos) : c
                if (name.includes('firebase')) {
                  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
                }
              })
              
              setCleanupStep('Limpieza completada ✅')
              await new Promise(resolve => setTimeout(resolve, 1000))
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
          >
            Limpiar Todo
          </button>
          <button
            onClick={clearCache}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
          >
            Actualizar
          </button>
          <PermissionButton
            module="users"
            permission="create"
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Nuevo Usuario
          </PermissionButton>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Crear Usuario</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="usuario">Usuario</option>
                  <option value="cajero">Cajero</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                  <option value="root">Root</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de limpieza */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold mb-4">Limpiando Cache</h3>
            <div className="mb-6">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">{cleanupStep}</p>
            </div>
            {cleanupStep.includes('✅') && (
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Recargar Página
                </button>
                <button
                  onClick={() => setShowCleanupModal(false)}
                  className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Creado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUser === user.id ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-full bg-white text-gray-900 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUser === user.id ? (
                    <select
                      value={editData.role}
                      onChange={(e) => setEditData({...editData, role: e.target.value as UserRole})}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="usuario">Usuario</option>
                      <option value="cajero">Cajero</option>
                      <option value="manager">Gerente</option>
                      <option value="admin">Administrador</option>
                      <option value="root">Root</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors.roles[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.createdAt instanceof Date 
                    ? user.createdAt.toLocaleDateString()
                    : new Date(user.createdAt).toLocaleDateString()
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingUser === user.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={handleUpdate}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <PermissionButton
                        module="users"
                        permission="update"
                        onClick={() => handleEdit(user)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                      >
                        Editar
                      </PermissionButton>
                      {user.role !== 'root' && (
                        <PermissionButton
                          module="users"
                          permission="update"
                          onClick={() => toggleUserStatus(user.id, user.active)}
                          className={`px-2 py-1 rounded text-xs ${
                            user.active 
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {user.active ? 'Desactivar' : 'Activar'}
                        </PermissionButton>
                      )}
                      {user.role !== 'root' && (
                        <PermissionButton
                          module="users"
                          permission="delete"
                          onClick={() => handleDelete(user.id, user.name)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          Eliminar
                        </PermissionButton>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      </div>
    </ProtectedRoute>
  )
}