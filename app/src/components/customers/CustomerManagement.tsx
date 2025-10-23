'use client'

import { useState } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { usePermissions } from '@/hooks/usePermissions'
import { Customer } from '@/types/customer'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function CustomerManagement() {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers()
  const { hasPermission } = usePermissions()
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData)
      } else {
        await createCustomer(formData)
      }
      setShowModal(false)
      setEditingCustomer(null)
      setFormData({ name: '', phone: '' })
    } catch (error) {
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({ name: customer.name, phone: customer.phone || '' })
    setShowModal(true)
  }

  const handleDelete = async (customer: Customer) => {
    if (confirm(`¿Eliminar cliente ${customer.name}?`)) {
      await deleteCustomer(customer.id)
    }
  }

  return (
    <ProtectedRoute module="customers">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold" style={{color: '#CF432B'}}>
                    Gestión de Clientes
                  </h1>
                  {hasPermission('customers', 'create') && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 text-white rounded-lg transition-colors"
                      style={{backgroundColor: '#CF432B'}}
                    >
                      Nuevo Cliente
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-8">Cargando clientes...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {customer.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.phone || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}</div>
                              <div className="text-xs text-gray-500">{customer.createdAt ? new Date(customer.createdAt).toLocaleTimeString() : '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                {hasPermission('customers', 'update') && (
                                  <button
                                    onClick={() => handleEdit(customer)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Editar
                                  </button>
                                )}
                                {hasPermission('customers', 'delete') && (
                                  <button
                                    onClick={() => handleDelete(customer)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">
                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCustomer(null)
                      setFormData({ name: '', phone: '' })
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded text-white"
                    style={{backgroundColor: '#CF432B'}}
                  >
                    {editingCustomer ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}