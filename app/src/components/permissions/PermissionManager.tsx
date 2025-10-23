'use client'

import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ROLE_PERMISSIONS, Module, Permission } from '@/types/permissions'
import { UserRole } from '@/types/user'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

const moduleLabels: Record<Module, string> = {
  users: 'Usuarios',
  products: 'Productos', 
  inventory: 'Inventario',
  sales: 'Ventas',
  reports: 'Reportes',
  suppliers: 'Proveedores',
  customers: 'Clientes',
  purchases: 'Compras',
  expenses: 'Gastos',
  orders: 'Pedidos',
  'cash-closing': 'Cierre de Caja',
  permissions: 'Permisos',
  accounts: 'Gestión de Cuentas'
}

const permissionLabels: Record<Permission, string> = {
  read: 'Ver',
  create: 'Crear',
  update: 'Editar',
  delete: 'Eliminar'
}

const roleLabels: Record<UserRole, string> = {
  root: 'Root',
  admin: 'Administrador',
  manager: 'Gerente',
  cajero: 'Cajero',
  usuario: 'Usuario'
}

export default function PermissionManager() {
  const [permissions, setPermissions] = useState(ROLE_PERMISSIONS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Cargar permisos desde Firebase
  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true)
      try {
        const docRef = doc(db, 'system', 'permissions')
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setPermissions(docSnap.data().rolePermissions || ROLE_PERMISSIONS)
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }
    
    loadPermissions()
  }, [])

  const hasPermission = (role: UserRole, module: Module, permission: Permission): boolean => {
    return permissions[role]?.[module]?.includes(permission) || false
  }

  const togglePermission = (role: UserRole, module: Module, permission: Permission) => {
    const newPermissions = { ...permissions }
    const modulePerms = [...(newPermissions[role]?.[module] || [])]
    
    if (modulePerms.includes(permission)) {
      newPermissions[role][module] = modulePerms.filter(p => p !== permission)
    } else {
      newPermissions[role][module] = [...modulePerms, permission]
    }
    
    setPermissions(newPermissions)
  }

  const savePermissions = async () => {
    setSaving(true)
    try {
      const docRef = doc(db, 'system', 'permissions')
      await setDoc(docRef, {
        rolePermissions: permissions,
        updatedAt: new Date(),
        updatedBy: 'admin' // Aquí podrías usar el usuario actual
      })
      
      alert('Permisos guardados exitosamente en Firebase')
    } catch (error) {
      alert('Error al guardar permisos: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute module="users">
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Permisos</h1>
            <button
              onClick={savePermissions}
              disabled={saving || loading}
              className={`px-4 py-2 rounded-md text-white ${
                saving || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {saving ? 'Guardando...' : loading ? 'Cargando...' : 'Guardar en Firebase'}
            </button>
          </div>

          {loading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando permisos desde Firebase...</p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Módulo / Rol
                    </th>
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <th key={role} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(moduleLabels).map(([module, moduleLabel]) => (
                    <tr key={module}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{moduleLabel}</div>
                      </td>
                      {Object.keys(roleLabels).map((role) => (
                        <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(permissionLabels).map(([permission, permLabel]) => (
                              <label key={permission} className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={hasPermission(role as UserRole, module as Module, permission as Permission)}
                                  onChange={() => togglePermission(role as UserRole, module as Module, permission as Permission)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-1 text-xs text-gray-600">{permLabel}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Información:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Ver:</strong> Puede consultar información del módulo</li>
              <li>• <strong>Crear:</strong> Puede agregar nuevos registros</li>
              <li>• <strong>Editar:</strong> Puede modificar registros existentes</li>
              <li>• <strong>Eliminar:</strong> Puede borrar registros</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}