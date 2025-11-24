'use client'

import { useState, useEffect } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ManualSnapshot from './ManualSnapshot'

export default function AccountsManagement() {
  const { accounts, movements, loading, createMovement, setInitialBalance } = useAccounts()
  const [firebaseUser] = useAuthState(auth)
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    const fetchUser = async () => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            setUser(userDoc.data())
          }
        } catch (error) {
        }
      } else {
        setUser(null)
      }
    }
    
    fetchUser()
  }, [firebaseUser])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [initialBalances, setInitialBalances] = useState<{ [key: string]: string }>({})

  const handleManualMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount || !amount || !description) return

    try {
      await createMovement({
        accountId: selectedAccount,
        type: movementType,
        amount: parseFloat(amount),
        description,
        source: 'ajuste_manual'
      })

      setSelectedAccount('')
      setAmount('')
      setDescription('')
      alert('Movimiento registrado exitosamente')
    } catch (error) {
      alert('Error al registrar movimiento')
    }
  }

  const handleSetInitialBalance = async (accountId: string) => {
    const balance = initialBalances[accountId]
    if (!balance) return

    try {
      await setInitialBalance(accountId, parseFloat(balance))
      setInitialBalances(prev => ({ ...prev, [accountId]: '' }))
      alert('Saldo inicial establecido')
    } catch (error) {
      alert('Error al establecer saldo inicial')
    }
  }

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cuentas...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute module="accounts">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Cuentas</h1>
            <div className="flex gap-4">
              <ManualSnapshot />
              <div className="bg-white px-6 py-3 rounded-lg shadow">
                <p className="text-sm text-gray-500">Balance Total</p>
                <p className="text-2xl font-bold text-green-600">S/ {getTotalBalance().toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Resumen de Cuentas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {accounts.map(account => (
              <div key={account.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{account.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${
                    account.type === 'efectivo' ? 'bg-green-500' :
                    account.type === 'yape' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}></div>
                </div>
                
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  S/ {account.balance.toFixed(2)}
                </p>
                
                <p className="text-sm text-gray-500 mb-2">
                  Inicial: S/ {account.initialBalance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Actualizado: {account.updatedAt.toLocaleDateString('es-PE')} por {account.updatedByName}
                </p>

                {user?.role === 'root' && (
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Saldo inicial"
                      value={initialBalances[account.id] || ''}
                      onChange={(e) => setInitialBalances(prev => ({
                        ...prev,
                        [account.id]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <button
                      onClick={() => handleSetInitialBalance(account.id)}
                      disabled={!initialBalances[account.id]}
                      className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                    >
                      Establecer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ajuste Manual */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ajuste Manual</h2>
              
              <form onSubmit={handleManualMovement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuenta
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar cuenta</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} - S/ {account.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as 'ingreso' | 'egreso')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ingreso">Ingreso (+)</option>
                    <option value="egreso">Egreso (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Motivo del ajuste..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Registrar Movimiento
                </button>
              </form>
            </div>

            {/* Historial de Movimientos */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Últimos Movimientos</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {movements.map(movement => (
                  <div key={movement.id} className="border-l-4 border-gray-200 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{movement.accountName}</p>
                        <p className="text-sm text-gray-600">{movement.description}</p>
                        <p className="text-xs text-gray-500">
                          {movement.createdAt.toLocaleDateString('es-PE')} - {movement.userName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          movement.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.type === 'ingreso' ? '+' : '-'}S/ {movement.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          S/ {movement.newBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {movements.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay movimientos registrados</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}