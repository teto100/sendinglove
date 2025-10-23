'use client'

import { useMemo } from 'react'
import Header from '@/components/layout/Header'
import { usePermissions } from '@/hooks/usePermissions'
import Link from 'next/link'
import ActivityLog from '@/components/activities/ActivityLog'

export default function Dashboard() {
  const { canAccess } = usePermissions()

  const modules = useMemo(() => [
    { id: 'users', name: 'Usuarios', description: 'Gestión de Usuarios', color: 'indigo', icon: '👥', path: '/users' },
    { id: 'permissions', name: 'Permisos', description: 'Control de Permisos', color: 'red', icon: '🔒', path: '/permissions' },
    { id: 'products', name: 'Productos', description: 'Gestionar Productos', color: 'blue', icon: '🍰🍔', path: '/products' },
    { id: 'inventory', name: 'Inventario', description: 'Control de Stock', color: 'green', icon: '📦', path: '/inventory' },
    { id: 'sales', name: 'Vender', description: 'Crear pedido', color: 'yellow', icon: '💰', path: '/sales' },
    { id: 'orders', name: 'Listado de pedidos', description: 'Gestión de Pedidos', color: 'teal', icon: '📋', path: '/orders' },
    { id: 'customers', name: 'Clientes', description: 'Gestión de Clientes', color: 'cyan', icon: '👤', path: '/customers' },
    { id: 'reports', name: 'Reportes', description: 'Análisis Financiero', color: 'purple', icon: '📊', path: '/reports' },
    { id: 'suppliers', name: 'Proveedores', description: 'Gestión de Proveedores', color: 'pink', icon: '🏪', path: '/suppliers' },
    { id: 'purchases', name: 'Compras', description: 'Compras de Almacén', color: 'orange', icon: '🛒', path: '/purchases' },
    { id: 'expenses', name: 'Gastos Fijos', description: 'Gastos Mensuales', color: 'red', icon: '💳', path: '/expenses' },
    { id: 'cash-closing', name: 'Cierre de Caja', description: 'Resumen Diario', color: 'gray', icon: '📊', path: '/cash-closing' },
    { id: 'accounts', name: 'Cuentas', description: 'Gestión de Cuentas', color: 'emerald', icon: '🏦', path: '/accounts' }
  ], [])

  const accessibleModules = useMemo(() => 
    modules.filter(module => canAccess(module.id as any)), 
    [modules, canAccess]
  )

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F9F7F8'}}>
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {accessibleModules.map((module) => (
              <Link 
                key={module.id} 
                href={module.path} 
                className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-all cursor-pointer ${
                  module.id === 'sales' 
                    ? 'md:col-span-2 lg:col-span-1 xl:col-span-2 ring-2 ring-yellow-400 shadow-lg transform hover:scale-105' 
                    : ''
                }`}
              >
                <div className={`${module.id === 'sales' ? 'p-8' : 'p-5'}`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`rounded-md flex items-center justify-center ${
                        module.id === 'sales' ? 'w-12 h-12 bg-yellow-100' : 'w-8 h-8'
                      }`}>
                        <span className={`font-bold ${
                          module.id === 'sales' ? 'text-4xl' : 'text-2xl'
                        }`}>{module.icon}</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className={`font-medium truncate ${
                          module.id === 'sales' ? 'text-lg' : 'text-sm'
                        }`} style={{color: '#B2B171'}}>
                          {module.name}
                        </dt>
                        <dd className={`font-medium ${
                          module.id === 'sales' ? 'text-2xl' : 'text-lg'
                        }`} style={{color: '#CF432B'}}>
                          {module.description}
                        </dd>
                        {module.id === 'sales' && (
                          <dd className="text-sm mt-1" style={{color: '#B2B171'}}>
                           
                          </dd>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <ActivityLog />
          </div>
        </div>
      </main>
    </div>
  )
}