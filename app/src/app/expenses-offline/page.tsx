'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function ExpensesOffline() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Operativo'
  })

  useEffect(() => {
    loadCachedExpenses()
  }, [])

  const loadCachedExpenses = () => {
    try {
      const cachedExpenses = JSON.parse(localStorage.getItem('cached_expenses') || '[]')
      setExpenses(cachedExpenses)
    } catch (error) {
      console.error('Error loading cached expenses:', error)
    }
  }

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return

    const expense = {
      id: Date.now().toString(),
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      createdAt: new Date().toISOString(),
      createdBy: user?.email,
      offline: true
    }

    const updatedExpenses = [expense, ...expenses]
    setExpenses(updatedExpenses)
    localStorage.setItem('cached_expenses', JSON.stringify(updatedExpenses))
    
    // Guardar para sincronización
    const offlineExpenses = JSON.parse(localStorage.getItem('offline_expenses') || '[]')
    offlineExpenses.push(expense)
    localStorage.setItem('offline_expenses', JSON.stringify(offlineExpenses))

    setNewExpense({ description: '', amount: '', category: 'Operativo' })
  }

  const categories = ['Operativo', 'Administrativo', 'Marketing', 'Mantenimiento', 'Otros']

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Gastos (Offline)</h1>
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Sin conexión</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">ℹ️</span>
              <span className="text-yellow-800 font-medium">Modo Offline</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Los gastos registrados se sincronizarán automáticamente al recuperar conexión.
            </p>
          </div>

          {/* Formulario para nuevo gasto */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar Gasto</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del gasto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleAddExpense}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Registrar Gasto
              </button>
            </div>
          </div>

          {/* Lista de gastos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense: any) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        S/ {expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.offline ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pendiente Sync
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Sincronizado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {expenses.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl">💰</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay gastos registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Registra tu primer gasto usando el formulario de arriba.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}