'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function CustomersOffline() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    loadCachedCustomers()
  }, [])

  const loadCachedCustomers = () => {
    try {
      const cachedCustomers = JSON.parse(localStorage.getItem('cached_customers') || '[]')
      setCustomers(cachedCustomers)
    } catch (error) {
      console.error('Error loading cached customers:', error)
    }
  }

  const handleAddCustomer = () => {
    if (!newCustomer.name) return

    const customer = {
      id: Date.now().toString(),
      ...newCustomer,
      createdAt: new Date().toISOString(),
      createdBy: user?.email,
      offline: true
    }

    const updatedCustomers = [customer, ...customers]
    setCustomers(updatedCustomers)
    localStorage.setItem('cached_customers', JSON.stringify(updatedCustomers))
    
    // Guardar para sincronización
    const offlineCustomers = JSON.parse(localStorage.getItem('offline_customers') || '[]')
    offlineCustomers.push(customer)
    localStorage.setItem('offline_customers', JSON.stringify(offlineCustomers))

    setNewCustomer({ name: '', email: '', phone: '', address: '' })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Clientes (Offline)</h1>
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
              Los clientes registrados se sincronizarán automáticamente al recuperar conexión.
            </p>
          </div>

          {/* Formulario para nuevo cliente */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="999 999 999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dirección del cliente"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleAddCustomer}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Registrar Cliente
              </button>
            </div>
          </div>

          {/* Lista de clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer: any) => (
              <div key={customer.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">{customer.name}</h3>
                    {customer.offline && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Pendiente Sync
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📧</span>
                      {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📞</span>
                      {customer.phone}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📍</span>
                      {customer.address}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Registrado: {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {customers.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl">👥</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes registrados</h3>
              <p className="mt-1 text-sm text-gray-500">
                Registra tu primer cliente usando el formulario de arriba.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}