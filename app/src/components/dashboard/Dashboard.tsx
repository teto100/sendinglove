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

      <main className="max-w-7xl mx-auto py-4 sm:py-6 sm:px-6 lg:px-8 pt-20">
        <div className="px-3 py-4 sm:px-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
            {accessibleModules.map((module) => (
              <Link 
                key={module.id} 
                href={module.path} 
                className={`bg-white overflow-hidden shadow-sm rounded-xl hover:shadow-md transition-all cursor-pointer border border-gray-100 ${
                  module.id === 'sales' 
                    ? 'col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-2 ring-2 ring-yellow-400 shadow-lg transform hover:scale-105' 
                    : 'hover:scale-102'
                }`}
              >
                <div className={`${module.id === 'sales' ? 'p-4 sm:p-6' : 'p-3 sm:p-4'} text-center`}>
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`rounded-full flex items-center justify-center ${
                      module.id === 'sales' 
                        ? 'w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100' 
                        : 'w-12 h-12 sm:w-14 sm:h-14 bg-gray-50'
                    }`}>
                      <span className={`${
                        module.id === 'sales' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
                      }`}>{module.icon}</span>
                    </div>
                    <div className="text-center">
                      <h3 className={`font-semibold ${
                        module.id === 'sales' ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
                      }`} style={{color: '#B2B171'}}>
                        {module.name}
                      </h3>
                      <p className={`font-medium mt-1 ${
                        module.id === 'sales' ? 'text-lg sm:text-xl' : 'text-xs sm:text-sm'
                      }`} style={{color: '#CF432B'}}>
                        {module.description}
                      </p>
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