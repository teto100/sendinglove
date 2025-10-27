'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { Module } from '@/types/permissions'
import LoadingModal from '@/components/ui/LoadingModal'

interface ProtectedRouteProps {
  module: Module
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ module, children, fallback }: ProtectedRouteProps) {
  const { canAccess, loading, userRole, permissions } = usePermissions()

  // Esperar hasta que todo esté cargado
  if (loading || !userRole || !permissions) {
    return <LoadingModal isOpen={true} message="Verificando permisos..." />
  }

  const hasAccess = canAccess(module)
  
  if (!hasAccess) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600">No tienes permisos para acceder a este módulo</p>
            <p className="text-xs text-gray-400 mt-2">Rol: {userRole} | Módulo: {module}</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}