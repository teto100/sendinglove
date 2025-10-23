'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AccountsOffline() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState({
    efectivo: 0,
    yape: 0,
    bbva: 0
  })
  const [movements, setMovements] = useState([])

  useEffect(() => {
    loadCachedAccounts()
  }, [])

  const loadCachedAccounts = () => {
    try {
      const cachedAccounts = JSON.parse(localStorage.getItem('cached_accounts') || '{"efectivo":0,"yape":0,"bbva":0}')
      const cachedMovements = JSON.parse(localStorage.getItem('cached_account_movements') || '[]')
      
      setAccounts(cachedAccounts)
      setMovements(cachedMovements)
    } catch (error) {
      console.error('Error loading cached accounts:', error)
    }
  }

  const getAccountIcon = (account: string) => {
    switch (account) {
      case 'efectivo': return '💵'
      case 'yape': return '📱'
      case 'bbva': return '🏦'
      default: return '💳'
    }
  }

  const getAccountName = (account: string) => {
    switch (account) {
      case 'efectivo': return 'Efectivo'
      case 'yape': return 'Yape'
      case 'bbva': return 'BBVA'
      default: return account
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Cuentas (Offline)</h1>
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Sin conexión</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">ℹ️</span>
              <span className="text-yellow-800 font-medium">Datos en Caché</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Los saldos mostrados son del último estado sincronizado. Se actualizarán al recuperar conexión.
            </p>
          </div>

          {/* Resumen de cuentas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(accounts).map(([account, balance]) => (
              <div key={account} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="text-2xl">{getAccountIcon(account)}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">{getAccountName(account)}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      S/ {(balance as number).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total en Cuentas</h3>
                <p className="text-sm text-gray-600">Suma de todos los saldos</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  S/ {(accounts.efectivo + accounts.yape + accounts.bbva).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Últimos movimientos */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Últimos Movimientos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cuenta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.slice(0, 10).map((movement: any) => (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{getAccountIcon(movement.account)}</span>
                          <span className="text-sm text-gray-900">{getAccountName(movement.account)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          movement.type === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {movement.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={movement.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                          {movement.type === 'ingreso' ? '+' : '-'}S/ {Math.abs(movement.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {movements.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl">💳</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay movimientos en caché</h3>
              <p className="mt-1 text-sm text-gray-500">
                Conecta a internet para cargar los movimientos de cuentas.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}