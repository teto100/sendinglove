'use client'

import { useState } from 'react'
import { useAllSales } from '@/hooks/useAllSales'
import { useSales } from '@/hooks/useSales'
import { usePermissions } from '@/hooks/usePermissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useCustomers } from '@/hooks/useCustomers'

import { Sale } from '@/types/sale'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function OrdersList() {
  const { sales, loading, currentPage, hasMore, deleteSale, updateSale, goToPage } = useAllSales()
  const { createSale } = useSales()
  const { hasPermission } = usePermissions()
  const { user } = useCurrentUser()
  const { customers, searchCustomers, createCustomer } = useCustomers()
  

  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null)
  const [editingOrder, setEditingOrder] = useState<Sale | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([])
  const [customerNameSearch, setCustomerNameSearch] = useState('')
  const [customerNameSuggestions, setCustomerNameSuggestions] = useState<any[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<{ success: number, errors: string[] } | null>(null)

  const handleDelete = async () => {
    if (selectedOrder) {
      await updateSale(selectedOrder.id, { orderStatus: 'Eliminado' })
      setShowDeleteModal(false)
      setSelectedOrder(null)
    }
  }

  const handleStatusUpdate = async (newStatus: 'Abierta' | 'Cerrada') => {
    if (selectedOrder) {
      await updateSale(selectedOrder.id, { orderStatus: newStatus })
      setSelectedOrder(null)
    }
  }

  const handleEditOrder = (order: Sale) => {
    setEditingOrder({ ...order })
    setCustomerSearch(order.customerPhone || '')
    setCustomerSuggestions([])
    setCustomerNameSearch(order.customerName || '')
    setCustomerNameSuggestions([])
    setShowEditModal(true)
  }

  const handleCustomerSearch = async (value: string) => {
    setCustomerSearch(value)
    if (editingOrder) {
      setEditingOrder({ ...editingOrder, customerPhone: value })
    }
    
    if (value.length >= 2) {
      const results = await searchCustomers(value)
      setCustomerSuggestions(results.slice(0, 5))
    } else {
      setCustomerSuggestions([])
    }
  }

  const handleSelectCustomer = (customer: any) => {
    setCustomerSearch(customer.phone)
    setCustomerNameSearch(customer.name)
    if (editingOrder) {
      setEditingOrder({ 
        ...editingOrder, 
        customerPhone: customer.phone,
        customerName: customer.name
      })
    }
    setCustomerSuggestions([])
    setCustomerNameSuggestions([])
  }

  const handleCustomerNameSearch = async (value: string) => {
    setCustomerNameSearch(value)
    if (editingOrder) {
      setEditingOrder({ ...editingOrder, customerName: value })
    }
    
    if (value.length >= 2) {
      const results = await searchCustomers(value)
      setCustomerNameSuggestions(results.slice(0, 5))
    } else {
      setCustomerNameSuggestions([])
    }
  }

  const handleSelectCustomerByName = (customer: any) => {
    setCustomerNameSearch(customer.name)
    setCustomerSearch(customer.phone)
    if (editingOrder) {
      setEditingOrder({ 
        ...editingOrder, 
        customerPhone: customer.phone,
        customerName: customer.name
      })
    }
    setCustomerNameSuggestions([])
    setCustomerSuggestions([])
  }

  const handleSaveOrder = async () => {
    if (!editingOrder) return
    
    setIsProcessing(true)
    try {
      // Si hay teléfono de cliente, verificar si existe o crear nuevo
      if (editingOrder.customerPhone && editingOrder.customerPhone.trim()) {
        const existingCustomer = customers.find(c => c.phone === editingOrder.customerPhone)
        if (!existingCustomer) {
          try {
            await createCustomer({
              name: 'Cliente',
              phone: editingOrder.customerPhone
            })
          } catch (error) {
            // Silent error handling
          }
        }
      }
      
      await updateSale(editingOrder.id, editingOrder)
      setShowEditModal(false)
      setEditingOrder(null)
      setCustomerSearch('')
      setCustomerSuggestions([])
      setCustomerNameSearch('')
      setCustomerNameSuggestions([])
    } catch (error) {
      alert('Error al actualizar la orden')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setEditingOrder(null)
    setCustomerSearch('')
    setCustomerSuggestions([])
    setCustomerNameSearch('')
    setCustomerNameSuggestions([])
  }

  const handleCsvImport = async () => {
    if (!csvFile) return
    
    setIsProcessing(true)
    const startTime = Date.now()
    
    
    const text = await csvFile.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    
    let success = 0
    const errors: string[] = []
    const processedItems: any[] = []
    
    
    for (let i = 1; i < lines.length; i++) {
      const progress = ((i / (lines.length - 1)) * 100).toFixed(1)
      const lineNumber = i + 1
      
      
      try {
        const values = lines[i].split(',')
        
        // Parse items (formato: "producto1:precio1:cantidad1;producto2:precio2:cantidad2")
        const itemsStr = values[0]?.trim()
        
        const items = itemsStr ? itemsStr.split(';').map((item, idx) => {
          const [name, price, quantity] = item.split(':')
          const parsedItem = {
            id: `item_${i}_${idx}`,
            productId: `prod_${i}_${idx}`,
            name: name?.trim() || '',
            price: parseFloat(price) || 0,
            quantity: parseInt(quantity) || 1,
            subtotal: (parseFloat(price) || 0) * (parseInt(quantity) || 1),
            extras: []
          }
          return parsedItem
        }) : []
        
        
        const subtotal = parseFloat(values[1]?.trim() || '0')
        const discount = parseFloat(values[2]?.trim() || '0')
        const total = parseFloat(values[3]?.trim() || '0')
        const orderType = values[4]?.trim() as 'Mesa' | 'Delivery Rappi' | 'Delivery Interno'
        const paymentStatus = values[5]?.trim() as 'SIN PAGAR' | 'Pagado'
        const orderStatus = values[6]?.trim() as 'Abierta' | 'Cerrada'
        const paymentMethod = values[7]?.trim()
        const customerName = values[8]?.trim()
        const customerPhone = values[9]?.trim()
        const tableNumber = values[10]?.trim()
        const deliveryAddress = values[11]?.trim()
        const fecha = values[12]?.trim()
        const hora = values[13]?.trim()
        
        
        // Crear fecha y hora - SIEMPRE usar la fecha del CSV si existe
        let createdAt = new Date()
        if (fecha && fecha.trim()) {
          const dateStr = fecha.trim()
          const timeStr = (hora && hora.trim()) ? hora.trim() : '12:00:00'
          const dateTimeStr = `${dateStr}T${timeStr}`
          
          createdAt = new Date(dateTimeStr)
          
          if (isNaN(createdAt.getTime())) {
            console.error('❌ Fecha inválida:', String(dateTimeStr || '').replace(/[\r\n]/g, ''))
            errors.push(`Línea ${i + 1}: Fecha u hora inválida`)
            continue
          }
        } else {
        }
        
        // Validaciones
        
        if (!items.length || !orderType || !paymentStatus || !orderStatus) {
          console.error('❌ Datos obligatorios faltantes:', { 
            items: items.length, 
            orderType, 
            paymentStatus, 
            orderStatus 
          })
          errors.push(`Línea ${i + 1}: Datos obligatorios faltantes (items, orderType, paymentStatus, orderStatus)`)
          continue
        }
        
        if (!['Mesa', 'Delivery Rappi', 'Delivery Interno'].includes(orderType)) {
          console.error('❌ orderType inválido:', String(orderType || '').replace(/[\r\n]/g, ''))
          errors.push(`Línea ${i + 1}: orderType inválido (debe ser Mesa, Delivery Rappi o Delivery Interno)`)
          continue
        }
        
        if (!['SIN PAGAR', 'Pagado'].includes(paymentStatus)) {
          console.error('❌ paymentStatus inválido:', String(paymentStatus || '').replace(/[\r\n]/g, ''))
          errors.push(`Línea ${i + 1}: paymentStatus inválido (debe ser SIN PAGAR o Pagado)`)
          continue
        }
        
        if (!['Abierta', 'Cerrada'].includes(orderStatus)) {
          console.error('❌ orderStatus inválido:', String(orderStatus || '').replace(/[\r\n]/g, ''))
          errors.push(`Línea ${i + 1}: orderStatus inválido (debe ser Abierta o Cerrada)`)
          continue
        }
        
        // Crear cliente si no existe
        if (customerName && customerName.trim() && user) {
          
          // Buscar en Firebase
          const existingCustomers = await searchCustomers(customerName)
          const existingCustomer = existingCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase())
          
          if (!existingCustomer) {
            try {
              const newCustomerId = await createCustomer({
                name: customerName,
                phone: customerPhone || ''
              })
            } catch (error: any) {
              console.error('❌ 🚫 ERROR CREANDO CLIENTE:', String(error.message || '').replace(/[\r\n]/g, ''))
            }
          } else {
          }
        } else if (customerName && customerName.trim() && !user) {
          console.warn('Usuario no autenticado, saltando creación de cliente:', String(customerName || '').replace(/[\r\n]/g, ''))
        }
        
        const saleData = {
          items,
          subtotal,
          discount,
          total,
          orderType,
          paymentStatus,
          orderStatus,
          paymentMethod: paymentMethod || undefined,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          tableNumber: tableNumber || undefined,
          deliveryAddress: deliveryAddress || undefined,
          createdAt: createdAt
        }
        
        
        const saveStartTime = Date.now()
        const result = await createSale(saleData)
        const saveEndTime = Date.now()
        
        success++
        processedItems.push({
          lineNumber: i,
          customerName: customerName || 'Sin nombre',
          total,
          items: items.length,
          saveTime: saveEndTime - saveStartTime,
          createdAt: createdAt.toLocaleString()
        })
        
        
        // Delay para evitar sobrecargar Firebase
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error('Error details:', String(error || '').replace(/[\r\n]/g, ''))
        console.error('Error message:', String(error.message || '').replace(/[\r\n]/g, ''))
        console.error('Error stack:', String(error.stack || '').replace(/[\r\n]/g, ''))
        
        errors.push(`Línea ${i + 1}: Error procesando datos - ${String(error.message || '').replace(/[\r\n]/g, '')}`)
      }
    }
    
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    
    if (processedItems.length > 0) {
      const avgSaveTime = processedItems.reduce((sum, item) => sum + item.saveTime, 0) / processedItems.length
      const totalAmount = processedItems.reduce((sum, item) => sum + item.total, 0)
      const totalItems = processedItems.reduce((sum, item) => sum + item.items, 0)
      
    }
    
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.error(`${index + 1}. ${error}`)
      })
    }
    
    
    setImportResults({ success, errors })
    setIsProcessing(false)
  }

  const exportToCSV = () => {
    const headers = 'items,subtotal,discount,total,orderType,paymentStatus,orderStatus,paymentMethod,customerName,customerPhone,tableNumber,deliveryAddress,fecha,hora'
    
    const csvData = sales.slice(0, 10).map(sale => {
      const itemsStr = sale.items.map(item => `${item.name}:${item.price}:${item.quantity}`).join(';')
      const fecha = sale.createdAt.toISOString().split('T')[0]
      const hora = sale.createdAt.toTimeString().split(' ')[0]
      
      return [
        `"${itemsStr}"`,
        sale.subtotal,
        sale.discount,
        sale.total,
        sale.orderType,
        sale.paymentStatus,
        sale.orderStatus,
        sale.paymentMethod || sale.paymentMethods?.[0]?.method || '',
        sale.customerName || '',
        sale.customerPhone || '',
        sale.tableNumber || '',
        sale.deliveryAddress || '',
        fecha,
        hora
      ].join(',')
    })
    
    const csvContent = [headers, ...csvData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ordenes_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Abierta': return 'bg-blue-100 text-blue-800'
      case 'Cerrada': return 'bg-gray-100 text-gray-800'
      case 'Eliminado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'Pagado': return 'bg-green-100 text-green-800'
      case 'SIN PAGAR': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute module="orders">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="max-w-7xl mx-auto py-3 lg:py-6 px-3 lg:px-8 pt-20">
          <div className="py-3 lg:py-6">
            <div className="bg-white shadow-sm rounded-xl border border-gray-100">
              <div className="px-3 py-4 lg:px-6 lg:py-5">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 lg:mb-6 gap-3 lg:gap-0">
                  <h1 className="text-xl lg:text-2xl font-bold" style={{color: '#CF432B'}}>
                    Listado de Pedidos
                  </h1>
                  {hasPermission('orders', 'create') && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => exportToCSV()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Exportar CSV
                      </button>
                      <button
                        onClick={() => setShowCsvImport(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Importar CSV
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8">Cargando pedidos...</div>
                ) : (
                  <>
                    {/* Mobile Cards */}
                    <div className="block lg:hidden space-y-4">
                      {sales.map((order) => (
                        <div key={order.id} className={`border rounded-xl p-4 ${order.orderStatus === 'Eliminado' ? 'bg-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{order.orderType}</div>
                              <div className="text-sm text-gray-500">{order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}</div>
                              <div className="text-lg font-bold text-green-600 mt-1">S/ {order.total.toFixed(2)}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(order.paymentStatus)}`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                            <div className="text-xs">
                              {order.items.map((item, idx) => (
                                <div key={idx}>
                                  {item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                                </div>
                              ))}
                            </div>
                            <div>Cliente: {order.customerName || '-'}</div>
                            <div>Pago: {order.paymentMethod || order.paymentMethods?.[0]?.method || '-'}</div>
                            <div>Mesa: {order.tableNumber || '-'}</div>
                          </div>
                          
                          {order.orderStatus !== 'Eliminado' && (
                            <div className="flex gap-2">
                              {hasPermission('orders', 'update') && (
                                <button
                                  onClick={() => handleEditOrder(order)}
                                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 touch-manipulation active:scale-95"
                                >
                                  Editar
                                </button>
                              )}
                              {hasPermission('orders', 'delete') && (
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setShowDeleteModal(true)
                                  }}
                                  className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 touch-manipulation active:scale-95"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Creación</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Orden</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Pago</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método de Pago</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Edición</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sales.map((order) => (
                            <tr key={order.id} className={`${order.orderStatus === 'Eliminado' ? 'bg-gray-200 opacity-60' : 'hover:bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                {order.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>{order.createdAt.toLocaleDateString()}</div>
                                <div className="text-xs text-gray-500">{order.createdAt.toLocaleTimeString()}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {order.orderType}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="max-w-xs">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="text-xs">
                                      {item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                S/ {order.total.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                                  {order.orderStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(order.paymentStatus)}`}>
                                  {order.paymentStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {order.paymentMethods && order.paymentMethods.length > 1 ? (
                                  <div>
                                    <div className="text-xs text-blue-600 font-medium mb-1">
                                      {order.paymentMethods.length} métodos
                                    </div>
                                    {order.paymentMethods.map((pm, idx) => (
                                      <div key={idx} className="text-xs text-gray-600">
                                        {pm.method}: S/ {pm.amount.toFixed(2)}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  order.paymentMethod || order.paymentMethods?.[0]?.method || '-'
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {order.customerName || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>{order.updatedAt?.toLocaleDateString() || order.createdAt.toLocaleDateString()}</div>
                                <div className="text-xs text-gray-500">{order.updatedAt?.toLocaleTimeString() || order.createdAt.toLocaleTimeString()}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  {order.orderStatus !== 'Eliminado' && hasPermission('orders', 'update') && (
                                    <button
                                      onClick={() => handleEditOrder(order)}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Editar
                                    </button>
                                  )}
                                  {order.orderStatus !== 'Eliminado' && hasPermission('orders', 'delete') && (
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(order)
                                        setShowDeleteModal(true)
                                      }}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                  {order.orderStatus === 'Eliminado' && (
                                    <span className="text-gray-500 text-sm">Eliminado</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    <div className="flex justify-between items-center mt-6">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-700">
                        Página {currentPage} - {sales.length} órdenes {hasMore ? '(hay más)' : '(última página)'}
                      </span>
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={!hasMore || loading}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de edición */}
        {showEditModal && editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 pt-20">
                <h3 className="text-lg font-bold mb-4" style={{color: '#CF432B'}}>
                  Editar Pedido
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado del Pedido
                      </label>
                      <select
                        value={editingOrder.orderStatus}
                        onChange={(e) => setEditingOrder({ ...editingOrder, orderStatus: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Abierta">Abierta</option>
                        <option value="Cerrada">Cerrada</option>
                        <option value="Eliminado">Eliminado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado del Pago
                      </label>
                      <select
                        value={editingOrder.paymentStatus}
                        onChange={(e) => setEditingOrder({ ...editingOrder, paymentStatus: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="SIN PAGAR">SIN PAGAR</option>
                        <option value="Pagado">Pagado</option>
                      </select>
                    </div>
                  </div>

                  {editingOrder.paymentStatus === 'Pagado' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Método de Pago
                        </label>
                        <select
                          value={editingOrder.paymentMethod || 'Yape'}
                          onChange={(e) => setEditingOrder({ ...editingOrder, paymentMethod: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Yape">Yape</option>
                          <option value="Plin">Plin</option>
                          <option value="Tarjeta">Tarjeta (+5% recargo)</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Transferencia Rappi">Transferencia Rappi</option>
                        </select>
                      </div>
                      
                      {editingOrder.paymentMethod === 'Efectivo' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Efectivo Recibido
                          </label>
                          <input
                            type="number"
                            value={editingOrder.cashReceived || ''}
                            onChange={(e) => setEditingOrder({ ...editingOrder, cashReceived: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            step="0.01"
                            placeholder="0.00"
                          />
                          {editingOrder.cashReceived && editingOrder.cashReceived > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Vuelto: S/ {Math.max(0, editingOrder.cashReceived - editingOrder.total).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {editingOrder.paymentMethod === 'Tarjeta' && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-sm text-orange-700">
                            Recargo del 5% aplicado por pago con tarjeta
                          </p>
                          <p className="text-sm font-medium text-orange-800">
                            Total con recargo: S/ {(editingOrder.total * 1.05).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Cliente
                    </label>
                    <input
                      type="text"
                      value={customerNameSearch}
                      onChange={(e) => handleCustomerNameSearch(e.target.value)}
                      placeholder="Buscar por nombre..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    
                    {customerNameSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {customerNameSuggestions.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => handleSelectCustomerByName(customer)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono del Cliente
                    </label>
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      placeholder="Buscar por teléfono o nombre..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    
                    {customerSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {customerSuggestions.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isProcessing}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveOrder}
                    disabled={isProcessing}
                    className="flex-1 py-2 px-4 rounded text-white disabled:opacity-50 flex items-center justify-center"
                    style={{backgroundColor: '#CF432B'}}
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Guardar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal CSV Import */}
        {showCsvImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">Importar Órdenes desde CSV</h2>
              
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Formato del CSV:</h3>
                <p className="text-sm text-blue-700 mb-2">items,subtotal,discount,total,orderType,paymentStatus,orderStatus,paymentMethod,customerName,customerPhone,tableNumber,deliveryAddress,fecha,hora</p>
                <p className="text-xs text-blue-600 mb-2">Items formato: "producto1:precio1:cantidad1;producto2:precio2:cantidad2"</p>
                <p className="text-xs text-blue-600 mb-2">Fecha formato: YYYY-MM-DD (opcional), Hora formato: HH:MM:SS (opcional)</p>
                <p className="text-xs text-blue-600 mb-3">Ejemplo: "Hamburguesa:15.50:2;Coca Cola:3.00:1",31.00,0,31.00,Mesa,Pagado,Cerrada,Yape,Juan Pérez,987654321,5,,2024-01-15,14:30:00</p>
                
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">💡 <strong>Logs detallados:</strong> Durante la importación, revisa la consola del navegador (F12 → Console) para ver logs completos del proceso, incluyendo validaciones, guardado en Firebase y procesamiento de pagos.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded"
                />
                
                {importResults && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="mb-3">
                      <p className="text-green-600 font-semibold">✅ {importResults.success} órdenes importadas exitosamente</p>
                      {importResults.errors.length > 0 && (
                        <p className="text-red-600 font-semibold">❌ {importResults.errors.length} errores encontrados</p>
                      )}
                    </div>
                    
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800 font-medium mb-2">📊 Para ver logs detallados:</p>
                      <ol className="text-xs text-blue-700 space-y-1">
                        <li>1. Abre las Herramientas de Desarrollador (F12)</li>
                        <li>2. Ve a la pestaña "Console"</li>
                        <li>3. Busca los grupos de logs con emojis 🚀 📝 💾</li>
                        <li>4. Expande los grupos para ver detalles completos</li>
                      </ol>
                    </div>
                    
                    {importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-red-600 font-medium mb-2">Errores detallados:</p>
                        <ul className="text-xs text-red-500 mt-1 max-h-40 overflow-y-auto bg-red-50 p-2 rounded border">
                          {importResults.errors.map((error, idx) => (
                            <li key={idx} className="mb-1">• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCsvImport}
                    disabled={!csvFile || isProcessing}
                    className="flex-1 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importando... (Ver consola F12)
                      </>
                    ) : (
                      'Importar'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowCsvImport(false)
                      setCsvFile(null)
                      setImportResults(null)
                    }}
                    className="flex-1 py-2 bg-gray-300 text-gray-700 rounded"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md mx-4">
              <h3 className="text-lg font-bold mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}