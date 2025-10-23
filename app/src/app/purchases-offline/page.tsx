'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function PurchasesOffline() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState([])

  useEffect(() => {
    loadCachedPurchases()
  }, [])

  const loadCachedPurchases = () => {
    try {
      const cachedPurchases = JSON.parse(localStorage.getItem('cached_purchases') || '[]')
      setPurchases(cachedPurchases)
    } catch (error) {
      console.error('Error loading cached purchases:', error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Compras (Offline)</h1>
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
              En modo offline solo puedes consultar compras. Para crear/editar necesitas conexión.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase: any) => (
                    <tr key={purchase.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs">🏢</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {purchase.supplierName || 'Proveedor'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.items?.length || 0} productos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        S/ {purchase.total?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                          purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {purchase.status === 'completed' ? 'Completada' :
                           purchase.status === 'pending' ? 'Pendiente' : 'Borrador'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {purchases.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl">🛒</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay compras en caché</h3>
              <p className="mt-1 text-sm text-gray-500">
                Conecta a internet para cargar las compras.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}