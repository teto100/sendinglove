'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function CashClosingOffline() {
  const { user } = useAuth()
  const [todayStats, setTodayStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netIncome: 0,
    salesCount: 0,
    paymentMethods: {
      efectivo: 0,
      yape: 0,
      bbva: 0,
      tarjeta: 0
    }
  })

  useEffect(() => {
    calculateTodayStats()
  }, [])

  const calculateTodayStats = () => {
    try {
      const today = new Date().toDateString()
      
      // Cargar ventas del día
      const sales = JSON.parse(localStorage.getItem('offline_sales') || '[]')
      const todaySales = sales.filter((sale: any) => 
        new Date(sale.createdAt).toDateString() === today
      )

      // Cargar gastos del día
      const expenses = JSON.parse(localStorage.getItem('cached_expenses') || '[]')
      const todayExpenses = expenses.filter((expense: any) => 
        new Date(expense.createdAt).toDateString() === today
      )

      const totalSales = todaySales.reduce((sum: number, sale: any) => sum + sale.total, 0)
      const totalExpenses = todayExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)

      // Calcular por método de pago
      const paymentMethods = {
        efectivo: 0,
        yape: 0,
        bbva: 0,
        tarjeta: 0
      }

      todaySales.forEach((sale: any) => {
        if (sale.paymentMethods && Array.isArray(sale.paymentMethods)) {
          sale.paymentMethods.forEach((payment: any) => {
            if (paymentMethods.hasOwnProperty(payment.method)) {
              paymentMethods[payment.method as keyof typeof paymentMethods] += payment.amount
            }
          })
        } else if (sale.paymentMethod) {
          // Compatibilidad con formato anterior
          if (paymentMethods.hasOwnProperty(sale.paymentMethod)) {
            paymentMethods[sale.paymentMethod as keyof typeof paymentMethods] += sale.total
          }
        }
      })

      setTodayStats({
        totalSales,
        totalExpenses,
        netIncome: totalSales - totalExpenses,
        salesCount: todaySales.length,
        paymentMethods
      })
    } catch (error) {
      console.error('Error calculating today stats:', error)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'efectivo': return '💵'
      case 'yape': return '📱'
      case 'bbva': return '🏦'
      case 'tarjeta': return '💳'
      default: return '💰'
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'efectivo': return 'Efectivo'
      case 'yape': return 'Yape'
      case 'bbva': return 'BBVA'
      case 'tarjeta': return 'Tarjeta'
      default: return method
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Cierre de Caja (Offline)</h1>
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Sin conexión</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">ℹ️</span>
              <span className="text-yellow-800 font-medium">Datos Offline</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Los datos mostrados incluyen solo las transacciones locales. Se completarán al sincronizar.
            </p>
          </div>

          {/* Resumen del día */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Ventas Totales</p>
                  <p className="text-2xl font-bold text-gray-800">S/ {todayStats.totalSales.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <span className="text-2xl">💸</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Gastos Totales</p>
                  <p className="text-2xl font-bold text-gray-800">S/ {todayStats.totalExpenses.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Ingreso Neto</p>
                  <p className={`text-2xl font-bold ${todayStats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    S/ {todayStats.netIncome.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <span className="text-2xl">🛒</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Ventas Realizadas</p>
                  <p className="text-2xl font-bold text-gray-800">{todayStats.salesCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose por método de pago */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Desglose por Método de Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(todayStats.paymentMethods).map(([method, amount]) => (
                <div key={method} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getPaymentMethodIcon(method)}</span>
                    <div>
                      <p className="text-sm text-gray-600">{getPaymentMethodName(method)}</p>
                      <p className="text-lg font-bold text-gray-800">S/ {amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Cierre</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Fecha y Hora</h4>
                <p className="text-gray-600">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Usuario</h4>
                <p className="text-gray-600">{user?.email || 'Usuario offline'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Ticket Promedio</h4>
                <p className="text-gray-600">
                  S/ {todayStats.salesCount > 0 ? (todayStats.totalSales / todayStats.salesCount).toFixed(2) : '0.00'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Estado</h4>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Pendiente Sincronización
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}