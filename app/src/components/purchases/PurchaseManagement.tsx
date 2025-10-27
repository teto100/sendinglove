'use client'

import { useState } from 'react'
import { usePurchases } from '@/hooks/usePurchases'
import { useSuppliers } from '@/hooks/useSuppliers'
import { CreatePurchaseData } from '@/types/purchase'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PermissionButton from '@/components/ui/PermissionButton'
import LoadingModal from '@/components/ui/LoadingModal'

const categories = ['Frutas', 'Carnes', 'Lácteos', 'Verduras', 'Granos', 'Condimentos', 'Bebidas', 'Acompañamientos', 'Otros']

export default function PurchaseManagement() {
  const { purchases, loading, createPurchase, updatePurchase, deletePurchase, forceRefreshFromFirebase } = usePurchases()
  const { suppliers } = useSuppliers()
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)
  const [formData, setFormData] = useState<CreatePurchaseData>({
    productName: '',
    measureType: 'units',
    quantity: 0,
    unitCost: 0,
    supplierName: '',
    category: 'Otros',
    paymentMethod: 'Efectivo'
  })
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [editData, setEditData] = useState({
    id: '',
    productName: '',
    measureType: 'units' as 'units' | 'weight',
    quantity: 0,
    weight: 0,
    portions: 0,
    unitCost: 0,
    supplierName: '',
    category: 'Otros',
    expirationDate: '',
    paymentMethod: 'Efectivo' as any,
    notes: ''
  })
  const [totalCostInput, setTotalCostInput] = useState('')
  const [editTotalCostInput, setEditTotalCostInput] = useState('')
  const [useUnitCost, setUseUnitCost] = useState(true)
  const [editUseUnitCost, setEditUseUnitCost] = useState(true)

  const totalCostValue = parseFloat(totalCostInput) || 0
  const totalCost = useUnitCost ? formData.quantity * formData.unitCost : totalCostValue
  const unitCost = useUnitCost ? formData.unitCost : (formData.quantity > 0 ? totalCostValue / formData.quantity : 0)
  
  const editTotalCostValue = parseFloat(editTotalCostInput) || 0
  const editTotalCost = editUseUnitCost ? editData.quantity * editData.unitCost : editTotalCostValue
  const editUnitCost = editUseUnitCost ? editData.unitCost : (editData.quantity > 0 ? editTotalCostValue / editData.quantity : 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOperationLoading(true)
    
    const purchaseData = {
      ...formData,
      unitCost: unitCost,
      purchaseDate: new Date(purchaseDate)
    }
    
    const result = await createPurchase(purchaseData)
    
    setOperationLoading(false)
    if (result.success) {
      setShowForm(false)
      setFormData({ productName: '', measureType: 'units', quantity: 0, unitCost: 0, supplierName: '', category: 'Otros', paymentMethod: 'Efectivo' })
      setTotalCostInput('')
      setUseUnitCost(true)
      setPurchaseDate(new Date().toISOString().split('T')[0])
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleEditPurchase = (purchase: any) => {
    try {
      const purchaseDate = purchase.purchaseDate?.toDate ? purchase.purchaseDate.toDate() : new Date(purchase.purchaseDate)
      const expirationDate = purchase.expirationDate ? 
        (purchase.expirationDate?.toDate ? purchase.expirationDate.toDate() : new Date(purchase.expirationDate)) : null
      
      setEditData({
        id: purchase.id,
        productName: purchase.productName,
        measureType: purchase.measureType || 'units',
        quantity: purchase.quantity,
        weight: purchase.weight || 0,
        portions: purchase.portions || 0,
        unitCost: purchase.unitCost,
        supplierName: purchase.supplierName,
        category: purchase.category,
        expirationDate: expirationDate ? expirationDate.toISOString().split('T')[0] : '',
        paymentMethod: purchase.paymentMethod || 'Efectivo',
        notes: purchase.notes || ''
      })
      setPurchaseDate(purchaseDate && !isNaN(purchaseDate.getTime()) ? purchaseDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
      setEditTotalCostInput('')
      setEditUseUnitCost(true)
      setShowEditForm(true)
    } catch (error) {
      alert('Error al cargar los datos de la compra')
    }
  }

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setOperationLoading(true)
    
    const updateData = {
      ...editData,
      unitCost: editUnitCost,
      purchaseDate: new Date(purchaseDate)
    }
    
    if (editData.expirationDate) {
      updateData.expirationDate = new Date(editData.expirationDate)
    }
    
    delete updateData.id
    
    const result = await updatePurchase(editData.id, updateData)
    setOperationLoading(false)
    if (result.success) {
      setShowEditForm(false)
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleDeletePurchase = async (purchaseId: string, productName: string) => {
    if (confirm(`¿Eliminar compra de ${productName}?`)) {
      setOperationLoading(true)
      const result = await deletePurchase(purchaseId)
      setOperationLoading(false)
      if (result.success) {
        window.location.reload()
      } else {
        alert('Error: ' + result.error)
      }
    }
  }

  return (
    <ProtectedRoute module="purchases">
      <div className="min-h-screen bg-gray-50">
        <Header />
        <LoadingModal isOpen={loading} message="Cargando compras..." />
        <LoadingModal isOpen={operationLoading} message="Procesando..." />
        
        <div className="p-6 pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Compras de Almacén</h1>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem('purchases_cache')
                  localStorage.removeItem('purchases_version')
                  forceRefreshFromFirebase()
                  setTimeout(() => window.location.reload(), 500)
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                🔄 Actualizar desde Firebase
              </button>
              <PermissionButton
                module="purchases"
                permission="create"
                onClick={() => setShowForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Nueva Compra
              </PermissionButton>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Registrar Compra</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <input
                        type="text"
                        value={formData.productName}
                        onChange={(e) => setFormData({...formData, productName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        required
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Medida</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={formData.measureType === 'units'}
                          onChange={() => setFormData({...formData, measureType: 'units'})}
                          className="mr-2"
                        />
                        Unidades
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={formData.measureType === 'weight'}
                          onChange={() => setFormData({...formData, measureType: 'weight'})}
                          className="mr-2"
                        />
                        Peso (kg)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.measureType === 'units' ? 'Cantidad (unidades)' : 'Peso (kg)'}
                      </label>
                      <input
                        type="number"
                        step={formData.measureType === 'weight' ? '0.01' : '1'}
                        value={formData.quantity || ''}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                    
                    {formData.measureType === 'weight' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Porciones (Opcional)</label>
                        <input
                          type="number"
                          value={formData.portions || ''}
                          onChange={(e) => setFormData({...formData, portions: e.target.value === '' ? undefined : parseInt(e.target.value)})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={useUnitCost}
                          onChange={() => setUseUnitCost(true)}
                          className="mr-2"
                        />
                        Ingresar costo unitario
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!useUnitCost}
                          onChange={() => setUseUnitCost(false)}
                          className="mr-2"
                        />
                        Ingresar costo total
                      </label>
                    </div>
                    
                    {useUnitCost ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario (S/)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.unitCost || ''}
                            onChange={(e) => setFormData({...formData, unitCost: e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value) * 100) / 100})}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Total (S/)</label>
                          <input
                            type="text"
                            value={`S/ ${totalCost.toFixed(2)}`}
                            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                            readOnly
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Total (S/)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={totalCostInput}
                            onChange={(e) => setTotalCostInput(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario (S/)</label>
                          <input
                            type="text"
                            value={`S/ ${unitCost.toFixed(2)}`}
                            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                            readOnly
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Compra</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                      <select
                        value={formData.supplierId || ''}
                        onChange={(e) => {
                          const selectedSupplier = suppliers.find(s => s.id === e.target.value)
                          setFormData({
                            ...formData, 
                            supplierId: e.target.value || undefined,
                            supplierName: selectedSupplier?.name || e.target.value
                          })
                        }}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      >
                        <option value="">Seleccionar proveedor...</option>
                        {suppliers.filter(s => s.active).map(supplier => (
                          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                        <option value="Supermercado">Supermercado</option>
                        <option value="Mercado Local">Mercado Local</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento (Opcional)</label>
                      <input
                        type="date"
                        value={formData.expirationDate ? formData.expirationDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setFormData({...formData, expirationDate: e.target.value ? new Date(e.target.value) : undefined})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-green-400 cursor-not-allowed scale-95'
                          : 'bg-green-600 hover:bg-green-700 active:scale-95'
                      } text-white`}
                    >
                      {operationLoading ? 'Registrando...' : 'Registrar Compra'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      disabled={operationLoading}
                      className="flex-1 py-2 rounded-md bg-gray-300 text-gray-700 hover:bg-gray-400"
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
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Editar Compra</h2>
                <form onSubmit={handleUpdatePurchase} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <input
                        type="text"
                        value={editData.productName}
                        onChange={(e) => setEditData({...editData, productName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <select
                        value={editData.category}
                        onChange={(e) => setEditData({...editData, category: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        required
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Medida</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={editData.measureType === 'units'}
                          onChange={() => setEditData({...editData, measureType: 'units'})}
                          className="mr-2"
                        />
                        Unidades
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={editData.measureType === 'weight'}
                          onChange={() => setEditData({...editData, measureType: 'weight'})}
                          className="mr-2"
                        />
                        Peso (kg)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {editData.measureType === 'units' ? 'Cantidad (unidades)' : 'Peso (kg)'}
                      </label>
                      <input
                        type="number"
                        step={editData.measureType === 'weight' ? '0.01' : '1'}
                        value={editData.quantity || ''}
                        onChange={(e) => setEditData({...editData, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        required
                      />
                    </div>
                    
                    {editData.measureType === 'weight' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Porciones (Opcional)</label>
                        <input
                          type="number"
                          value={editData.portions || ''}
                          onChange={(e) => setEditData({...editData, portions: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={editUseUnitCost}
                          onChange={() => setEditUseUnitCost(true)}
                          className="mr-2"
                        />
                        Ingresar costo unitario
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!editUseUnitCost}
                          onChange={() => setEditUseUnitCost(false)}
                          className="mr-2"
                        />
                        Ingresar costo total
                      </label>
                    </div>
                    
                    {editUseUnitCost ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario (S/)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editData.unitCost || ''}
                            onChange={(e) => setEditData({...editData, unitCost: e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value) * 100) / 100})}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Total (S/)</label>
                          <input
                            type="text"
                            value={`S/ ${editTotalCost.toFixed(2)}`}
                            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                            readOnly
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Total (S/)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editTotalCostInput}
                            onChange={(e) => setEditTotalCostInput(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario (S/)</label>
                          <input
                            type="text"
                            value={`S/ ${editUnitCost.toFixed(2)}`}
                            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                            readOnly
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Compra</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                      <input
                        type="text"
                        value={editData.supplierName}
                        onChange={(e) => setEditData({...editData, supplierName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento (Opcional)</label>
                      <input
                        type="date"
                        value={editData.expirationDate}
                        onChange={(e) => setEditData({...editData, expirationDate: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                    <select
                      value={editData.paymentMethod}
                      onChange={(e) => setEditData({...editData, paymentMethod: e.target.value as any})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                    <textarea
                      value={editData.notes}
                      onChange={(e) => setEditData({...editData, notes: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-green-400 cursor-not-allowed scale-95'
                          : 'bg-green-600 hover:bg-green-700 active:scale-95'
                      } text-white`}
                    >
                      {operationLoading ? 'Actualizando...' : 'Actualizar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      disabled={operationLoading}
                      className="flex-1 py-2 rounded-md bg-gray-300 text-gray-700 hover:bg-gray-400"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.sort((a, b) => {
                  const dateA = a.purchaseDate?.toDate ? a.purchaseDate.toDate() : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.purchaseDate || a.createdAt))
                  const dateB = b.purchaseDate?.toDate ? b.purchaseDate.toDate() : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.purchaseDate || b.createdAt))
                  return dateB.getTime() - dateA.getTime()
                }).map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 font-mono">{purchase.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{purchase.productName}</div>
                      {purchase.expirationDate && (
                        <div className="text-xs text-gray-500">
                          Vence: {(() => {
                            try {
                              const date = purchase.expirationDate?.toDate ? purchase.expirationDate.toDate() : new Date(purchase.expirationDate)
                              return date.toLocaleDateString()
                            } catch {
                              return 'Fecha inválida'
                            }
                          })()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.measureType === 'weight' ? `${purchase.quantity} kg` : `${purchase.quantity} und`}
                      {purchase.portions && <div className="text-xs text-gray-500">{purchase.portions} porciones</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">S/ {(purchase.unitCost || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">S/ {(purchase.totalAmount || purchase.totalCost || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.supplierName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(() => {
                        try {
                          const date = purchase.purchaseDate?.toDate ? purchase.purchaseDate.toDate() : new Date(purchase.purchaseDate)
                          return date.toLocaleDateString()
                        } catch {
                          return 'Fecha inválida'
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-1">
                        <PermissionButton
                          module="purchases"
                          permission="update"
                          onClick={() => handleEditPurchase(purchase)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >
                          Editar
                        </PermissionButton>
                        <PermissionButton
                          module="purchases"
                          permission="delete"
                          onClick={() => handleDeletePurchase(purchase.id, purchase.productName)}
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