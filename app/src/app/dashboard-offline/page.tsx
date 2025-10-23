'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function DashboardOffline() {
  const { user } = useCurrentUser()
  const [stats, setStats] = useState({
    todaySales: 0,
    totalProducts: 0,
    lowStock: 0,
    pendingOrders: 0
  })

  useEffect(() => {
    loadOfflineStats()
  }, [])

  const loadOfflineStats = () => {
    try {
      const sales = JSON.parse(localStorage.getItem('offline_sales') || '[]')
      const products = JSON.parse(localStorage.getItem('cached_products') || '[]')
      const orders = JSON.parse(localStorage.getItem('offline_orders') || '[]')
      
      const today = new Date().toDateString()
      const todaySales = sales
        .filter((sale: any) => new Date(sale.createdAt).toDateString() === today)
        .reduce((sum: number, sale: any) => sum + sale.total, 0)

      const lowStock = products.filter((p: any) => p.stock <= p.minStock).length

      setStats({
        todaySales,
        totalProducts: products.length,
        lowStock,
        pendingOrders: orders.length
      })
    } catch (error) {
      console.error('Error loading offline stats:', error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Offline</h1>
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Sin conexión</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Ventas Hoy</p>
                  <p className="text-2xl font-bold text-gray-800">S/ {stats.todaySales.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Productos</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.lowStock}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pedidos Pendientes</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">ℹ️</span>
              <span className="text-yellow-800 font-medium">Datos en Caché</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Los datos mostrados provienen del caché local. Se actualizarán automáticamente al recuperar conexión.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}