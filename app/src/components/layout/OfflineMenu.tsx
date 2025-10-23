'use client'

import Link from 'next/link'

export default function OfflineMenu() {
  const offlineModules = [
    {
      name: 'POS/Ventas',
      href: '/sales',
      icon: '🛒',
      description: 'Crear pedidos offline'
    },
    {
      name: 'Productos',
      href: '/products-offline',
      icon: '📦',
      description: 'Ver catálogo'
    },
    {
      name: 'Inventario',
      href: '/inventory-offline', 
      icon: '📊',
      description: 'Consultar stock'
    },
    {
      name: 'Pedidos',
      href: '/orders-offline',
      icon: '📋',
      description: 'Ver pedidos offline'
    },
    {
      name: 'Dashboard',
      href: '/dashboard-offline',
      icon: '📈',
      description: 'Reportes básicos'
    },
    {
      name: 'Usuarios',
      href: '/users-offline',
      icon: '👥',
      description: 'Gestión usuarios'
    },
    {
      name: 'Proveedores',
      href: '/suppliers-offline',
      icon: '🏢',
      description: 'Ver proveedores'
    },
    {
      name: 'Gastos',
      href: '/expenses-offline',
      icon: '💰',
      description: 'Registrar gastos'
    },
    {
      name: 'Cuentas',
      href: '/accounts-offline',
      icon: '💳',
      description: 'Ver cuentas'
    },
    {
      name: 'Clientes',
      href: '/customers-offline',
      icon: '👤',
      description: 'Gestión clientes'
    },
    {
      name: 'Compras',
      href: '/purchases-offline',
      icon: '🛍️',
      description: 'Ver compras'
    },
    {
      name: 'Cierre Caja',
      href: '/cash-closing-offline',
      icon: '💵',
      description: 'Cierre diario'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Sistema Offline</h1>
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Sin conexión</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-yellow-800 font-medium">Modo Offline Activo</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Solo están disponibles los módulos básicos. Los datos se sincronizarán cuando regrese la conexión.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {offlineModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">{module.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{module.name}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Funcionalidad Offline</h3>
          <p className="text-sm text-gray-600">
            Todos los módulos funcionan offline con datos en caché. La sincronización ocurre automáticamente al recuperar conexión.
          </p>
        </div>
      </div>
    </div>
  )
}