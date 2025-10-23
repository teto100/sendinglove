'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function SuppliersOffline() {
  const { user } = useAuth()
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    loadCachedSuppliers()
  }, [])

  const loadCachedSuppliers = () => {
    try {
      const cachedSuppliers = JSON.parse(localStorage.getItem('cached_suppliers') || '[]')
      setSuppliers(cachedSuppliers)
    } catch (error) {
      console.error('Error loading cached suppliers:', error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Proveedores (Offline)</h1>
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Sin conexión</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-yellow-800 font-medium">Solo Lectura</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              En modo offline solo puedes consultar proveedores. Para crear/editar necesitas conexión.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier: any) => (
              <div key={supplier.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">{supplier.name}</h3>
                    <p className="text-sm text-gray-600">{supplier.category || 'Sin categoría'}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {supplier.contact && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">👤</span>
                      {supplier.contact}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📞</span>
                      {supplier.phone}
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📧</span>
                      {supplier.email}
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📍</span>
                      {supplier.address}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    supplier.active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {supplier.active !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {suppliers.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl">🏢</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proveedores en caché</h3>
              <p className="mt-1 text-sm text-gray-500">
                Conecta a internet para cargar los proveedores.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}