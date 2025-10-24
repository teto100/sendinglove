'use client'

import { useState } from 'react'
import { useSuppliers } from '@/hooks/useSuppliers'
import { CreateSupplierData } from '@/types/supplier'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PermissionButton from '@/components/ui/PermissionButton'
import LoadingModal from '@/components/ui/LoadingModal'
import { useActivityLogger } from '@/hooks/useActivityLogger'

export default function SupplierManagement() {
  const { suppliers, loading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers()
  const { logActivity } = useActivityLogger()
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)
  const [formData, setFormData] = useState<CreateSupplierData>({
    name: '',
    contactName: ''
  })
  const [editSupplierData, setEditSupplierData] = useState({
    id: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    ruc: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOperationLoading(true)
    
    const result = await createSupplier(formData)
    
    setOperationLoading(false)
    if (result.success) {
      await logActivity({
        type: 'supplier_created',
        description: `Proveedor creado: ${formData.name}`,
        metadata: { name: formData.name, email: formData.email }
      })
      setShowForm(false)
      setFormData({ name: '', contactName: '' })
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleEditSupplier = (supplier: any) => {
    setEditSupplierData({
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      ruc: supplier.ruc || ''
    })
    setShowEditForm(true)
  }

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    setOperationLoading(true)
    
    const result = await updateSupplier(editSupplierData.id, {
      name: editSupplierData.name,
      contactName: editSupplierData.contactName,
      email: editSupplierData.email,
      phone: editSupplierData.phone,
      address: editSupplierData.address,
      ruc: editSupplierData.ruc
    })
    
    setOperationLoading(false)
    if (result.success) {
      setShowEditForm(false)
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleDeleteSupplier = async (supplierId: string, supplierName: string) => {
    if (confirm(`¿Eliminar proveedor ${supplierName}?`)) {
      setOperationLoading(true)
      const result = await deleteSupplier(supplierId)
      setOperationLoading(false)
      if (result.success) {
        window.location.reload()
      } else {
        alert('Error: ' + result.error)
      }
    }
  }

  const toggleSupplierStatus = async (supplierId: string, currentStatus: boolean) => {
    setOperationLoading(true)
    const result = await updateSupplier(supplierId, { active: !currentStatus })
    if (result.success) {
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
    setOperationLoading(false)
  }

  return (
    <ProtectedRoute module="suppliers">
      <div className="min-h-screen bg-gray-50">
        <Header />
        <LoadingModal isOpen={loading} message="Cargando proveedores..." />
        <LoadingModal isOpen={operationLoading} message="Procesando..." />
        
        <div className="p-6 pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
            <PermissionButton
              module="suppliers"
              permission="create"
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Nuevo Proveedor
            </PermissionButton>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Crear Proveedor</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto</label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC (Opcional)</label>
                    <input
                      type="text"
                      value={formData.ruc}
                      onChange={(e) => setFormData({...formData, ruc: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-blue-400 cursor-not-allowed scale-95'
                          : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                      } text-white`}
                    >
                      {operationLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando...
                        </div>
                      ) : (
                        'Crear'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400 active:scale-95'
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showEditForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Editar Proveedor</h2>
                <form onSubmit={handleUpdateSupplier} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                      <input
                        type="text"
                        value={editSupplierData.name}
                        onChange={(e) => setEditSupplierData({...editSupplierData, name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto</label>
                      <input
                        type="text"
                        value={editSupplierData.contactName}
                        onChange={(e) => setEditSupplierData({...editSupplierData, contactName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editSupplierData.email}
                        onChange={(e) => setEditSupplierData({...editSupplierData, email: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={editSupplierData.phone}
                        onChange={(e) => setEditSupplierData({...editSupplierData, phone: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <textarea
                      value={editSupplierData.address}
                      onChange={(e) => setEditSupplierData({...editSupplierData, address: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC (Opcional)</label>
                    <input
                      type="text"
                      value={editSupplierData.ruc}
                      onChange={(e) => setEditSupplierData({...editSupplierData, ruc: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-blue-400 cursor-not-allowed scale-95'
                          : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                      } text-white`}
                    >
                      {operationLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Actualizando...
                        </div>
                      ) : (
                        'Actualizar'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400 active:scale-95'
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-sm text-gray-500">{supplier.ruc && `RUC: ${supplier.ruc}`}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.contactName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-1">
                        <PermissionButton
                          module="suppliers"
                          permission="update"
                          onClick={() => handleEditSupplier(supplier)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >
                          Editar
                        </PermissionButton>
                        <PermissionButton
                          module="suppliers"
                          permission="update"
                          onClick={() => toggleSupplierStatus(supplier.id, supplier.active)}
                          className={`px-2 py-1 rounded text-xs ${
                            supplier.active 
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {supplier.active ? 'Desactivar' : 'Activar'}
                        </PermissionButton>
                        <PermissionButton
                          module="suppliers"
                          permission="delete"
                          onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          Eliminar
                        </PermissionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}