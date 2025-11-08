'use client'

import { useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { CreateExpenseData } from '@/types/expense'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PermissionButton from '@/components/ui/PermissionButton'
import LoadingModal from '@/components/ui/LoadingModal'

const expenseTypes = ['Alquiler', 'Agua y Luz', 'Internet', 'Banco', 'Contadora', 'Facturación', 'Sunat + Essalud', 'AFP', 'Gas','Otros']

export default function ExpenseManagement() {
  const { expenses, loading, currentPage, hasMore, createExpense, updateExpense, deleteExpense, goToPage } = useExpenses()
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)
  const [formData, setFormData] = useState<CreateExpenseData>({
    type: 'Alquiler',
    amount: 0,
    paymentDate: new Date(),
    dueDate: new Date(),
    paymentMethod: 'Efectivo'
  })
  const [editData, setEditData] = useState({
    id: '',
    type: 'Alquiler' as any,
    customType: '',
    amount: 0,
    paymentDate: '',
    dueDate: '',
    paymentMethod: 'Efectivo' as any,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOperationLoading(true)
    
    const result = await createExpense(formData)
    
    setOperationLoading(false)
    if (result.success) {
      setShowForm(false)
      setFormData({ type: 'Alquiler', amount: 0, paymentDate: new Date(), dueDate: new Date(), paymentMethod: 'Efectivo' })
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleEditExpense = (expense: any) => {
    try {
      const paymentDate = expense.paymentDate?.toDate ? expense.paymentDate.toDate() : new Date(expense.paymentDate)
      const dueDate = expense.dueDate?.toDate ? expense.dueDate.toDate() : new Date(expense.dueDate)
      
      setEditData({
        id: expense.id,
        type: expense.type,
        customType: expense.customType || '',
        amount: expense.amount,
        paymentDate: paymentDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        paymentMethod: expense.paymentMethod || 'Efectivo',
        notes: expense.notes || ''
      })
      setShowEditForm(true)
    } catch (error) {
      alert('Error al cargar los datos del gasto')
    }
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setOperationLoading(true)
    
    const updateData = {
      ...editData,
      paymentDate: new Date(editData.paymentDate + 'T12:00:00'),
      dueDate: new Date(editData.dueDate + 'T12:00:00')
    }
    delete updateData.id
    
    const result = await updateExpense(editData.id, updateData)
    setOperationLoading(false)
    if (result.success) {
      setShowEditForm(false)
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleDeleteExpense = async (expenseId: string, expenseType: string) => {
    if (confirm(`¿Eliminar gasto ${expenseType}?`)) {
      setOperationLoading(true)
      const result = await deleteExpense(expenseId)
      setOperationLoading(false)
      if (result.success) {
        window.location.reload()
      } else {
        alert('Error: ' + result.error)
      }
    }
  }

  return (
    <ProtectedRoute module="expenses">
      <div className="min-h-screen" style={{backgroundColor: '#F9F7F8'}}>
        <Header />
        <LoadingModal isOpen={loading} message="Cargando gastos..." />
        <LoadingModal isOpen={operationLoading} message="Procesando..." />
        
        <div className="p-6 pt-20" style={{color: '#CF432B'}}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gastos Fijos</h1>
            <div className="flex gap-2">
              <PermissionButton
                module="expenses"
                permission="create"
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-md hover:opacity-80 font-semibold border-2"
                style={{backgroundColor: '#CF432B', color: 'white', borderColor: '#A8341F'}}
              >
                + Nuevo Gasto
              </PermissionButton>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-bold mb-6 border-b pb-2" style={{color: '#CF432B'}}>Registrar Gasto Fijo</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Tipo de Gasto</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        style={{color: '#CF432B'}}
                        required
                      >
                        {expenseTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    {formData.type === 'Otros' && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Especificar Gasto</label>
                        <input
                          type="text"
                          value={formData.customType || ''}
                          onChange={(e) => setFormData({...formData, customType: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                          style={{color: '#CF432B'}}
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Monto (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({...formData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        style={{color: '#CF432B'}}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Fecha de Pago</label>
                      <input
                        type="date"
                        value={formData.paymentDate.toISOString().split('T')[0]}
                        onChange={(e) => setFormData({...formData, paymentDate: new Date(e.target.value + 'T12:00:00')})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        style={{color: '#CF432B'}}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Fecha de Vencimiento</label>
                      <input
                        type="date"
                        value={formData.dueDate.toISOString().split('T')[0]}
                        onChange={(e) => setFormData({...formData, dueDate: new Date(e.target.value + 'T12:00:00')})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        style={{color: '#CF432B'}}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Método de Pago</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                      style={{color: '#CF432B'}}
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Notas (Opcional)</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                      style={{color: '#CF432B'}}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={operationLoading}
                      className="flex-1 py-2 rounded-md text-white transition-all duration-200 transform hover:opacity-80 active:scale-95"
                      style={{backgroundColor: operationLoading ? '#E85A45' : '#CF432B'}}
                    >
                      {operationLoading ? 'Registrando...' : 'Registrar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      disabled={operationLoading}
                      className="flex-1 py-2 rounded-md transition-all duration-200 transform hover:opacity-80 active:scale-95"
                      style={{backgroundColor: '#B2B171', color: 'white'}}
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
                <h2 className="text-xl font-bold mb-6 border-b pb-2" style={{color: '#CF432B'}}>Editar Gasto Fijo</h2>
                <form onSubmit={handleUpdateExpense} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Tipo de Gasto</label>
                      <select
                        value={editData.type}
                        onChange={(e) => setEditData({...editData, type: e.target.value as any})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        style={{color: '#CF432B'}}
                        required
                      >
                        {expenseTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    {editData.type === 'Otros' && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Especificar Gasto</label>
                        <input
                          type="text"
                          value={editData.customType}
                          onChange={(e) => setEditData({...editData, customType: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                          style={{color: '#CF432B'}}
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Monto (S/)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.amount || ''}
                        onChange={(e) => setEditData({...editData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        style={{color: '#CF432B'}}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Fecha de Pago</label>
                      <input
                        type="date"
                        value={editData.paymentDate.split('T')[0]}
                        onChange={(e) => setEditData({...editData, paymentDate: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        style={{color: '#CF432B'}}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Fecha de Vencimiento</label>
                      <input
                        type="date"
                        value={editData.dueDate}
                        onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        style={{color: '#CF432B'}}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Método de Pago</label>
                    <select
                      value={editData.paymentMethod}
                      onChange={(e) => setEditData({...editData, paymentMethod: e.target.value as any})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                      style={{color: '#CF432B'}}
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: '#4B4C1E'}}>Notas (Opcional)</label>
                    <textarea
                      value={editData.notes}
                      onChange={(e) => setEditData({...editData, notes: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                      style={{color: '#CF432B'}}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={operationLoading}
                      className="flex-1 py-2 rounded-md text-white transition-all duration-200 transform hover:opacity-80 active:scale-95"
                      style={{backgroundColor: operationLoading ? '#E85A45' : '#CF432B'}}
                    >
                      {operationLoading ? 'Actualizando...' : 'Actualizar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      disabled={operationLoading}
                      className="flex-1 py-2 rounded-md transition-all duration-200 transform hover:opacity-80 active:scale-95"
                      style={{backgroundColor: '#B2B171', color: 'white'}}
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
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{color: '#4B4C1E'}}>Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{color: '#4B4C1E'}}>Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{color: '#4B4C1E'}}>Fecha Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{color: '#4B4C1E'}}>Vencimiento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{color: '#4B4C1E'}}>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.sort((a, b) => {
                  const dateA = a.paymentDate?.toDate ? a.paymentDate.toDate() : new Date(a.paymentDate)
                  const dateB = b.paymentDate?.toDate ? b.paymentDate.toDate() : new Date(b.paymentDate)
                  return dateB.getTime() - dateA.getTime()
                }).map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{color: '#CF432B'}}>
                        {expense.type === 'Otros' ? expense.customType : expense.type}
                      </div>
                      {expense.notes && (
                        <div className="text-xs" style={{color: '#B2B171'}}>{expense.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{color: '#CF432B'}}>
                      S/ {expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: '#4B4C1E'}}>
                      {(() => {
                        try {
                          const date = expense.paymentDate?.toDate ? expense.paymentDate.toDate() : new Date(expense.paymentDate)
                          return date.toLocaleDateString()
                        } catch {
                          return 'Fecha inválida'
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: '#4B4C1E'}}>
                      {(() => {
                        try {
                          const date = expense.dueDate?.toDate ? expense.dueDate.toDate() : new Date(expense.dueDate)
                          return date.toLocaleDateString()
                        } catch {
                          return 'Fecha inválida'
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-1">
                        <PermissionButton
                          module="expenses"
                          permission="update"
                          onClick={() => handleEditExpense(expense)}
                          className="px-2 py-1 rounded text-xs hover:opacity-80"
                          style={{backgroundColor: '#B2B171', color: 'white'}}
                        >
                          Editar
                        </PermissionButton>
                        <PermissionButton
                          module="expenses"
                          permission="delete"
                          onClick={() => handleDeleteExpense(expense.id, expense.type === 'Otros' ? expense.customType || 'Otros' : expense.type)}
                          className="px-2 py-1 rounded text-xs hover:opacity-80"
                          style={{backgroundColor: '#CF432B', color: 'white'}}
                        >
                          Eliminar
                        </PermissionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="flex justify-between items-center mt-6 px-6 pb-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {currentPage} - {expenses.length} gastos {hasMore ? '(hay más)' : '(última página)'}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={!hasMore || loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}