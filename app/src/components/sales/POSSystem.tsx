'use client'

import { useState, useMemo } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useSales } from '@/hooks/useSales'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useCustomers } from '@/hooks/useCustomers'
import { useInventory } from '@/hooks/useInventory'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useDeviceType } from '@/hooks/useDeviceType'
import { offlineStorage } from '@/lib/offlineStorage'
import { SaleItem, SaleExtra, CreateSaleData } from '@/types/sale'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ProductImage from '@/components/ui/ProductImage'

export default function POSSystem() {
  const isOnline = useOnlineStatus()
  const deviceType = useDeviceType()
  const { products: onlineProducts } = useProducts()
  const { categories: onlineCategories } = useCategories()
  const { sales, createSale, updateSale } = useSales()
  const { user, loading: userLoading } = useCurrentUser()
  const { searchCustomers, createCustomer } = useCustomers()
  const { createMovement } = useInventory()
  
  // Usar cache offline si no hay internet
  const products = isOnline ? onlineProducts : offlineStorage.getProducts()
  const categories = isOnline ? onlineCategories : []
  const [cart, setCart] = useState<SaleItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showExtras, setShowExtras] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [orderType, setOrderType] = useState<'Mesa' | 'Para llevar' | 'Delivery Rappi' | 'Delivery Interno'>('Mesa')
  const [paymentStatus, setPaymentStatus] = useState<'SIN PAGAR' | 'Pagado'>('SIN PAGAR')
  const [orderStatus, setOrderStatus] = useState<'Abierta' | 'Cerrada'>('Abierta')
  const [isMultiplePayment, setIsMultiplePayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<{method: string, amount: number, cashReceived?: number}[]>([{method: 'Yape', amount: 0}])
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta' | 'Transferencia' | 'Transferencia Rappi'>('Yape')
  const [cashReceived, setCashReceived] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [showOrdersList, setShowOrdersList] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPackModal, setShowPackModal] = useState<string | null>(null)
  const [packItems, setPackItems] = useState<any[]>([])
  const [packExtras, setPackExtras] = useState<any[]>([])


  const activeProducts = products.filter(p => p.active)
  const accompaniments = activeProducts.filter(p => {
    const category = categories.find(c => c.id === p.categoryId)
    return category?.name === 'Acompañamientos'
  })

  const filteredProducts = useMemo(() => {
    let filtered = activeProducts.filter(p => {
      const category = categories.find(c => c.id === p.categoryId)
      return category?.name !== 'Acompañamientos'
    })

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categoryId === selectedCategory)
    }

    return filtered
  }, [activeProducts, categories, searchTerm, selectedCategory])

  const subtotal = cart.reduce((sum, item) => {
    if (item.isPack && item.name === 'Caja Pack 10') {
      // Para Caja Pack 10, el subtotal es siempre 10 soles
      return sum + (10 * item.quantity)
    }
    return sum + item.subtotal
  }, 0)
  const afterDiscount = subtotal - discount
  
  // Calcular recargo de tarjeta basado en métodos de pago múltiples o simple
  const cardSurcharge = paymentStatus === 'Pagado' ? 
    (isMultiplePayment ? 
      paymentMethods.reduce((sum, pm) => {
        return pm.method === 'Tarjeta' ? sum + (pm.amount * 0.05) : sum
      }, 0) :
      paymentMethod === 'Tarjeta' ? (afterDiscount * 0.05) : 0
    ) : 0
  
  const total = afterDiscount + cardSurcharge
  const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0)
  const remaining = Math.max(0, total - totalPaid)
  
  const cashReceivedNum = parseFloat(cashReceived) || 0
  const change = paymentMethod === 'Efectivo' ? Math.max(0, cashReceivedNum - total) : 0

  const addToCart = async (product: any) => {
    const category = categories.find(c => c.id === product.categoryId)
    
    // Si es un pack, abrir modal de configuración
    if (category?.name === 'Pack') {
      // Verificar límite de 3 packs por pedido
      const packCount = cart.filter(item => item.isPack).length
      if (packCount >= 3) {
        setErrorMessage('Máximo 3 packs por pedido')
        setShowError(true)
        return
      }
      
      setShowPackModal(product.id)
      setPackItems([])
      setPackExtras([])
      return
    }
    
    try {
      // Verificar si hay stock suficiente
      await createMovement({
        productId: product.id,
        type: 'salida',
        quantity: 1,
        reason: 'Verificación stock POS',
        dryRun: true
      })
      
      const existingItem = cart.find(item => item.productId === product.id)
      if (existingItem) {
        updateQuantity(existingItem.id, existingItem.quantity + 1)
      } else {
        const newItem: SaleItem = {
          id: Date.now().toString(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
          extras: []
        }
        setCart([...cart, newItem])
      }
    } catch (error) {
      if (error.message === 'Stock insuficiente') {
        setErrorMessage(`Stock insuficiente para "${product.name}".`)
        setShowError(true)
      }
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId))
    } else {
      setCart(cart.map(item => 
        item.id === itemId 
          ? { ...item, quantity, subtotal: (item.price + item.extras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)) * quantity }
          : item
      ))
    }
  }

  const addExtra = (itemId: string, extra: any) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const existingExtra = item.extras.find(e => e.productId === extra.id)
        let newExtras
        if (existingExtra) {
          newExtras = item.extras.map(e => 
            e.productId === extra.id 
              ? { ...e, quantity: e.quantity + 1 }
              : e
          )
        } else {
          newExtras = [...item.extras, {
            id: Date.now().toString(),
            productId: extra.id,
            name: extra.name,
            price: extra.price,
            quantity: 1
          }]
        }
        const extrasTotal = newExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0)
        return {
          ...item,
          extras: newExtras,
          subtotal: (item.price + extrasTotal) * item.quantity
        }
      }
      return item
    }))
  }

  const loadOrderToCart = (order: any) => {
    setCart(order.items)
    setDiscount(order.discount)
    setCustomerName(order.customerName || '')
    setTableNumber(order.tableNumber || '')
    setDeliveryAddress(order.deliveryAddress || '')
    setOrderType(order.orderType)
    setPaymentStatus(order.paymentStatus)
    setOrderStatus(order.orderStatus)
    
    // Cargar métodos de pago múltiples o usar compatibilidad con versión anterior
    if (order.paymentMethods && order.paymentMethods.length > 0) {
      setPaymentMethods(order.paymentMethods)
    } else if (order.paymentMethod) {
      setPaymentMethods([{
        method: order.paymentMethod,
        amount: order.total || 0,
        cashReceived: order.cashReceived
      }])
      setPaymentMethod(order.paymentMethod)
    }
    
    if (order.cashReceived) setCashReceived(order.cashReceived.toString())
  }

  const addPaymentMethod = () => {
    const currentTotal = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0)
    const remainingAmount = Math.max(0, total - currentTotal)
    setPaymentMethods([...paymentMethods, {method: 'Yape', amount: remainingAmount}])
  }

  const updatePaymentMethod = (index: number, field: string, value: any) => {
    const updated = [...paymentMethods]
    updated[index] = {...updated[index], [field]: value}
    setPaymentMethods(updated)
  }

  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index))
    }
  }

  // Productos elegibles para packs (entre 1 y 2.5 soles, no bebidas, keke, leche asada, acompañamientos)
  const packEligibleProducts = activeProducts.filter(p => {
    const category = categories.find(c => c.id === p.categoryId)
    const categoryName = category?.name?.toLowerCase() || ''
    return p.price >= 1 && p.price <= 2.5 && 
           !categoryName.includes('bebida') && 
           !categoryName.includes('acompañamiento') &&
           !p.name.toLowerCase().includes('keke') && 
           !p.name.toLowerCase().includes('leche asada')
  })

  const addPackItem = (product: any) => {
    const currentTotal = packItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                        packExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)
    
    if (currentTotal + product.price > 11.5) {
      setErrorMessage('No se puede agregar. El total del pack excedería S/ 11.50')
      setShowError(true)
      return
    }
    
    const existing = packItems.find(item => item.productId === product.id)
    if (existing) {
      const newQuantity = existing.quantity + 1
      const newTotal = currentTotal - (existing.price * existing.quantity) + (existing.price * newQuantity)
      
      if (newTotal > 11.5) {
        setErrorMessage('No se puede agregar más cantidad. El total del pack excedería S/ 11.50')
        setShowError(true)
        return
      }
      
      setPackItems(packItems.map(item => 
        item.productId === product.id 
          ? {...item, quantity: newQuantity}
          : item
      ))
    } else {
      setPackItems([...packItems, {
        id: Date.now().toString(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }])
    }
  }

  const removePackItem = (productId: string) => {
    setPackItems(packItems.filter(item => item.productId !== productId))
  }

  const addPackExtra = () => {
    const decoracionProduct = activeProducts.find(p => p.name === 'Decoracion dulces')
    if (!decoracionProduct) return
    
    if (packExtras.length >= 3) {
      setErrorMessage('Máximo 3 decoraciones por pack')
      setShowError(true)
      return
    }
    
    const currentTotal = packItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                        packExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)
    
    if (currentTotal + decoracionProduct.price > 11.5) {
      setErrorMessage('No se puede agregar decoración. El total del pack excedería S/ 11.50')
      setShowError(true)
      return
    }
    
    setPackExtras([...packExtras, {
      id: Date.now().toString(),
      productId: decoracionProduct.id,
      name: decoracionProduct.name,
      price: decoracionProduct.price,
      quantity: 1
    }])
  }

  const removePackExtra = (index: number) => {
    setPackExtras(packExtras.filter((_, i) => i !== index))
  }

  const confirmPack = () => {
    const packProduct = products.find(p => p.id === showPackModal)
    if (!packProduct) return
    
    const itemsTotal = packItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const extrasTotal = packExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)
    const total = itemsTotal + extrasTotal
    
    if (total > 11.5) {
      setErrorMessage('El total del pack no puede exceder S/ 11.50')
      setShowError(true)
      return
    }
    
    const packItem: SaleItem = {
      id: Date.now().toString(),
      productId: packProduct.id,
      name: packProduct.name,
      price: packProduct.name === 'Caja Pack 10' ? 10 : packProduct.price,
      quantity: 1,
      subtotal: packProduct.name === 'Caja Pack 10' ? 10 : packProduct.price,
      extras: packExtras,
      isPack: true,
      packItems: packItems
    }
    
    setCart([...cart, packItem])
    setShowPackModal(null)
    setPackItems([])
    setPackExtras([])
  }

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setCustomerName('')
    setCustomerPhone('')
    setCashReceived('')
    setTableNumber('')
    setDeliveryAddress('')
    setCustomerSuggestions([])
    setShowSuggestions(false)
    setOrderStatus('Abierta')
    setPaymentStatus('SIN PAGAR')
    setIsMultiplePayment(false)
    setPaymentMethods([{method: 'Yape', amount: 0}])
    setShowPayment(false)
    setShowPackModal(null)
    setPackItems([])
    setPackExtras([])
  }

  const processSale = async () => {
    if (isProcessing) return
    

    
    if (isOnline && !user?.id) {
      setErrorMessage('Usuario no autenticado')
      setShowError(true)
      return
    }

    setIsProcessing(true)
    try {
      // Create customer first if needed
      if (customerName.trim()) {
        const existingCustomer = customerSuggestions.find(c => 
          c.name.toLowerCase() === customerName.toLowerCase()
        )
        
        if (!existingCustomer) {
          try {
            const customerData = { name: customerName }
            if (customerPhone.trim()) {
              customerData.phone = customerPhone
            }
            await createCustomer(customerData)
          } catch (error) {
            // Error creating customer - continue with sale
          }
        }
      }
      
      // Preparar métodos de pago
      const finalPaymentMethods = paymentStatus === 'Pagado' ? 
        (orderType === 'Delivery Rappi' ? 
          [{method: 'Transferencia Rappi' as const, amount: total}] :
          isMultiplePayment ? 
            paymentMethods.map(pm => ({
              method: pm.method as any,
              amount: pm.amount,
              cashReceived: pm.method === 'Efectivo' ? pm.cashReceived : undefined,
              change: pm.method === 'Efectivo' && pm.cashReceived ? Math.max(0, pm.cashReceived - pm.amount) : undefined
            })) :
            [{
              method: paymentMethod as any,
              amount: total,
              cashReceived: paymentMethod === 'Efectivo' ? parseFloat(cashReceived) : undefined,
              change: paymentMethod === 'Efectivo' ? change : undefined
            }]
        ) : []
      


      const saleData: CreateSaleData = {
        items: cart,
        subtotal,
        discount,
        total,
        orderType,
        paymentStatus: orderType === 'Delivery Rappi' ? 'Pagado' : paymentStatus,
        orderStatus: (paymentStatus === 'Pagado' || orderType === 'Delivery Rappi') ? 'Cerrada' : orderStatus,
        paymentMethods: finalPaymentMethods,
        // Mantener compatibilidad con versión anterior
        paymentMethod: orderType === 'Delivery Rappi' ? 'Transferencia Rappi' : (paymentStatus === 'Pagado' ? paymentMethod : undefined),
        cashReceived: paymentStatus === 'Pagado' && paymentMethod === 'Efectivo' ? parseFloat(cashReceived) : undefined,
        change: paymentStatus === 'Pagado' && paymentMethod === 'Efectivo' ? change : undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        tableNumber: orderType === 'Mesa' ? tableNumber : undefined,
        deliveryAddress: (orderType === 'Delivery Rappi' || orderType === 'Delivery Interno') ? deliveryAddress : undefined
      }
      


      if (isOnline) {
        // Limpiar valores undefined para Firebase recursivamente
        const cleanSaleData = JSON.parse(JSON.stringify(saleData, (key, value) => {
          return value === undefined ? null : value
        }))
        
        // Remover valores null
        const finalSaleData = Object.fromEntries(
          Object.entries(cleanSaleData).filter(([_, value]) => value !== null)
        )
        
        if (selectedOrder) {
          await updateSale(selectedOrder.id, finalSaleData)
        } else {
          await createSale(finalSaleData)
        }
      } else {
        offlineStorage.saveOfflineOrder(saleData)
      }
      
      // Si la venta está cerrada y pagada, reducir inventario
      if (saleData.orderStatus === 'Cerrada' && saleData.paymentStatus === 'Pagado') {
        for (const item of cart) {
          if (item.isPack) {
            // Para packs, reducir inventario de los items del pack
            if (item.packItems) {
              for (const packItem of item.packItems) {
                try {
                  await createMovement({
                    productId: packItem.productId,
                    type: 'salida',
                    quantity: packItem.quantity * item.quantity,
                    reason: `Venta POS Pack - ${orderType}`
                  })
                } catch (error) {
                  // Continuar con otros productos si uno falla
                }
              }
            }
            // Para Caja Pack 10, solo agregar 10 soles a cuentas sin reducir stock del pack
            if (item.name === 'Caja Pack 10') {
              // El procesamiento de cuentas ya se hace automáticamente
              continue
            }
          } else {
            try {
              await createMovement({
                productId: item.productId,
                type: 'salida',
                quantity: item.quantity,
                reason: `Venta POS - ${orderType}`
              })
            } catch (error) {
              // Continuar con otros productos si uno falla
            }
          }
        }
      }

      const message = paymentStatus === 'SIN PAGAR' 
        ? `Orden ${orderType.toLowerCase()} ${selectedOrder ? 'actualizada' : 'guardada'} ${isOnline ? 'exitosamente' : '(offline)'}` 
        : `Venta procesada ${isOnline ? 'exitosamente' : '(offline)'} - Total: S/ ${total.toFixed(2)}`
      
      setConfirmationMessage(message)
      setShowConfirmation(true)
      setShowPayment(false)
      
      setTimeout(() => {
        setShowConfirmation(false)
        clearCart()
        setSelectedOrder(null)
      }, 2000)
    } catch (error) {
      setErrorMessage(`Error al procesar la venta: ${error.message || 'Error desconocido'}`)
      setShowError(true)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <ProtectedRoute module="sales">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className={`${deviceType === 'mobile' ? 'flex flex-col' : 'flex flex-col lg:flex-row'} h-screen pt-16`}>
          {/* Panel de órdenes */}
          {showOrdersList && (
            <div className={`w-full ${deviceType === 'mobile' ? 'max-h-48' : 'lg:w-2/5 max-h-64 lg:max-h-none'} bg-white border-r border-b lg:border-b-0 p-2 lg:p-4 overflow-y-auto`}>
              <div className="flex justify-between items-center mb-2 lg:mb-4">
                <h2 className="text-lg lg:text-xl font-bold">Órdenes Activas</h2>
                <button
                  onClick={() => setShowOrdersList(false)}
                  className="text-gray-500 hover:text-gray-700 lg:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex lg:flex-col gap-2 lg:gap-3 overflow-x-auto lg:overflow-x-visible">
                {sales.map(order => (
                  <div
                    key={order.id}
                    onClick={() => {
                      if (selectedOrder?.id === order.id) {
                        setSelectedOrder(null)
                        clearCart()
                      } else {
                        setSelectedOrder(order)
                        loadOrderToCart(order)
                      }
                    }}
                    className={`p-2 lg:p-3 border rounded-lg cursor-pointer transition-colors ${deviceType === 'mobile' ? 'min-w-40' : 'min-w-48 lg:min-w-0'} touch-manipulation active:scale-95 ${
                      selectedOrder?.id === order.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">{order.orderType}</span>
                        {order.tableNumber && <span className="text-sm text-gray-600 ml-2">Mesa {order.tableNumber}</span>}
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded ${
                          order.paymentStatus === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.paymentStatus}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded mt-1 ${
                          order.orderStatus === 'Cerrada' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.orderStatus}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.customerName && <div>Cliente: {order.customerName}</div>}
                      <div className="mb-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-xs">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-xs text-gray-500">+{order.items.length - 3} más...</div>
                        )}
                      </div>
                      {order.paymentMethods && order.paymentMethods.length > 1 && (
                        <div className="text-xs text-blue-600 mb-1">
                          {order.paymentMethods.length} métodos de pago
                        </div>
                      )}
                      <div className="font-medium">Total: S/ {order.total.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                
                {sales.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No hay órdenes activas
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!showOrdersList && (
            <button
              onClick={() => setShowOrdersList(true)}
              className="fixed left-2 top-20 z-10 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 lg:hidden touch-manipulation active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {/* Panel de productos */}
          <div className={`${showOrdersList ? (deviceType === 'mobile' ? 'flex-1' : 'flex-1 lg:w-3/5') : 'flex-1'} p-2 lg:p-4`}>
            <div className="mb-3 lg:mb-4 flex flex-col sm:flex-row gap-2 lg:gap-4">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-2 lg:p-3 border rounded-lg text-sm lg:text-base"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 lg:p-3 border rounded-lg text-sm lg:text-base min-w-32"
              >
                <option value="all">Todas</option>
                {categories.filter(c => c.name !== 'Acompañamientos').map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className={`grid gap-2 lg:gap-4 ${
              deviceType === 'mobile' ? 'grid-cols-2' : 
              deviceType === 'tablet' ? 'grid-cols-3' : 
              'grid-cols-4'
            }`}>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-2 lg:p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all touch-manipulation active:scale-95 border border-gray-100"
                >
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    width={150}
                    height={96}
                    className="w-full h-16 lg:h-24 object-cover rounded-lg mb-2"
                  />
                  <h3 className="font-semibold text-xs lg:text-sm leading-tight mb-1">{product.name}</h3>
                  <p className="text-sm lg:text-lg font-bold text-green-600">S/ {product.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 hidden lg:block">{product.sku}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Panel del carrito */}
          <div className={`w-full ${deviceType === 'mobile' ? 'border-t' : 'lg:w-96 border-t lg:border-l lg:border-t-0'} bg-white p-2 lg:p-4`}>
            {selectedOrder && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-blue-800">Editando Orden</span>
                  <button
                    onClick={() => {
                      setSelectedOrder(null)
                      clearCart()
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-sm text-blue-700">
                  {selectedOrder.orderType} - {selectedOrder.paymentStatus}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-3 lg:mb-4">
              <h2 className="text-lg lg:text-xl font-bold">{selectedOrder ? 'Editar Orden' : 'Pedido Actual'}</h2>
              {!isOnline && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                  Offline
                </span>
              )}
            </div>
            
            <div className={`flex-1 overflow-y-auto mb-3 lg:mb-4 ${deviceType === 'mobile' ? 'max-h-32' : 'max-h-48 lg:max-h-none'}`}>
              {cart.map(item => (
                <div key={item.id} className="border-b pb-2 mb-2 text-sm lg:text-base">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {item.name}
                      {item.isPack && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">PACK</span>}
                    </span>
                    {!item.isPack && (
                      <button
                        onClick={() => setShowExtras(showExtras === item.id ? null : item.id)}
                        className="text-blue-500 text-sm"
                      >
                        + Extras
                      </button>
                    )}
                  </div>
                  
                  {/* Mostrar items del pack */}
                  {item.isPack && item.packItems && (
                    <div className="ml-4 mt-1">
                      {item.packItems.map(packItem => (
                        <div key={packItem.id} className="text-xs text-gray-600">
                          • {packItem.name} x{packItem.quantity}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Mostrar extras */}
                  {item.extras.map(extra => (
                    <div key={extra.id} className="text-sm text-gray-600 ml-4">
                      + {extra.name} x{extra.quantity} (S/ {(extra.price * extra.quantity).toFixed(2)})
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 lg:w-6 lg:h-6 bg-red-500 text-white rounded text-sm touch-manipulation active:scale-95"
                      >
                        -
                      </button>
                      <span className="min-w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 lg:w-6 lg:h-6 bg-green-500 text-white rounded text-sm touch-manipulation active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold">S/ {item.subtotal.toFixed(2)}</span>
                  </div>

                  {/* Solo mostrar extras para productos normales */}
                  {showExtras === item.id && !item.isPack && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <h4 className="text-sm font-medium mb-2">Acompañamientos:</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {accompaniments.map(extra => (
                          <button
                            key={extra.id}
                            onClick={() => addExtra(item.id, extra)}
                            className="text-xs p-1 bg-blue-100 rounded hover:bg-blue-200"
                          >
                            {extra.name} (+S/ {extra.price.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Mostrar extras disponibles para packs (solo Decoracion dulces) */}
                  {showExtras === item.id && item.isPack && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <h4 className="text-sm font-medium mb-2">Extras para Pack:</h4>
                      <button
                        onClick={() => {
                          const decoracionProduct = activeProducts.find(p => p.name === 'Decoracion dulces')
                          if (decoracionProduct && item.extras.length < 3) {
                            addExtra(item.id, decoracionProduct)
                          }
                        }}
                        disabled={item.extras.length >= 3}
                        className={`text-xs p-1 rounded ${
                          item.extras.length >= 3 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-100 hover:bg-blue-200'
                        }`}
                      >
                        Decoracion dulces (+S/ {activeProducts.find(p => p.name === 'Decoracion dulces')?.price.toFixed(2) || '0.00'})
                      </button>
                      {item.extras.length >= 3 && (
                        <p className="text-xs text-red-600 mt-1">Máximo 3 decoraciones por pack</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span>Descuento:</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 p-1 border rounded text-right"
                  step="0.01"
                />
              </div>
              
              {cardSurcharge > 0 && (
                <div className="flex justify-between mb-2 text-orange-600">
                  <span>Recargo Tarjeta (5%):</span>
                  <span>S/ {cardSurcharge.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total:</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Tipo de Orden</label>
                <select
                  value={orderType}
                  onChange={(e) => {
                    const newOrderType = e.target.value as any
                    setOrderType(newOrderType)
                    if (newOrderType === 'Delivery Rappi') {
                      setPaymentStatus('Pagado')
                      setPaymentMethod('Transferencia Rappi')
                      setOrderStatus('Cerrada')
                    }
                  }}
                  className="w-full p-2 border rounded mb-2"
                >
                  <option value="Mesa">Mesa</option>
                  <option value="Para llevar">Para llevar</option>
                  <option value="Delivery Rappi">Delivery Rappi</option>
                  <option value="Delivery Interno">Delivery Interno</option>
                </select>
                
                {orderType === 'Mesa' && (
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Número de mesa"
                  />
                )}
                
                {(orderType === 'Delivery Rappi' || orderType === 'Delivery Interno') && (
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Dirección de entrega"
                  />
                )}
              </div>

              <div className="flex gap-2 mb-3 lg:mb-4">
                <button
                  onClick={clearCart}
                  disabled={isProcessing}
                  className={`flex-1 py-3 lg:py-2 rounded-lg text-white transition-all touch-manipulation active:scale-95 text-sm lg:text-base ${
                    isProcessing ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setShowPayment(true)}
                  disabled={isProcessing || cart.length === 0}
                  className={`flex-1 py-3 lg:py-2 rounded-lg text-white transition-all touch-manipulation active:scale-95 text-sm lg:text-base ${
                    isProcessing || cart.length === 0 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {isProcessing ? 'Procesando...' : paymentStatus === 'SIN PAGAR' ? 'Guardar' : 'Pagar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de pago */}
        {showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold mb-4">{paymentStatus === 'SIN PAGAR' ? 'Guardar Orden' : 'Procesar Pago'}</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Estado del Pago</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  disabled={orderType === 'Delivery Rappi'}
                  className={`w-full p-2 border rounded ${orderType === 'Delivery Rappi' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="SIN PAGAR">Sin Pagar</option>
                  <option value="Pagado">Pagado</option>
                </select>
                {orderType === 'Delivery Rappi' && (
                  <p className="text-xs text-gray-600 mt-1">
                    Los pedidos Rappi siempre se marcan como pagados automáticamente.
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Cliente (Opcional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={async (e) => {
                      const value = e.target.value
                      setCustomerName(value)
                      if (value.length > 2) {
                        const suggestions = await searchCustomers(value)
                        setCustomerSuggestions(suggestions)
                        setShowSuggestions(suggestions.length > 0)
                      } else {
                        setShowSuggestions(false)
                      }
                    }}
                    className="w-full p-2 border rounded"
                    placeholder="Nombre del cliente"
                  />
                  {showSuggestions && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {customerSuggestions.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => {
                            setCustomerName(customer.name)
                            setCustomerPhone(customer.phone || '')
                            setShowSuggestions(false)
                          }}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">{customer.name}</div>
                          {customer.phone && (
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2 border rounded mt-2"
                  placeholder="Teléfono (opcional)"
                />
              </div>

              {paymentStatus === 'Pagado' && !isMultiplePayment && orderType !== 'Delivery Rappi' && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Método de Pago</label>
                    <button
                      onClick={() => {
                        setIsMultiplePayment(true)
                        setPaymentMethods([{method: paymentMethod, amount: total}])
                      }}
                      className="text-blue-500 text-sm hover:text-blue-700"
                    >
                      Pago Múltiple
                    </button>
                  </div>
                  
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2 border rounded mb-2"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Tarjeta">Tarjeta (+5% recargo)</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                  
                  {paymentMethod === 'Efectivo' && (
                    <div className="mt-2">
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Efectivo recibido"
                        step="0.01"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Vuelto: S/ {change.toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {paymentMethod === 'Tarjeta' && (
                    <div className="mt-1">
                      <p className="text-sm text-orange-600">
                        Recargo 5%: +S/ {(afterDiscount * 0.05).toFixed(2)}
                      </p>
                      <p className="text-sm font-medium text-orange-700">
                        Total con recargo: S/ {(afterDiscount * 1.05).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {paymentStatus === 'Pagado' && orderType === 'Delivery Rappi' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-blue-800">Pago Rappi</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Método de pago: <strong>Transferencia Rappi</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Los pagos de Rappi se procesan automáticamente los miércoles de cada semana.
                  </p>
                </div>
              )}
              
              {paymentStatus === 'Pagado' && isMultiplePayment && orderType !== 'Delivery Rappi' && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Métodos de Pago</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsMultiplePayment(false)
                          setPaymentMethods([{method: 'Yape', amount: 0}])
                        }}
                        className="text-gray-500 text-sm hover:text-gray-700"
                      >
                        Pago Simple
                      </button>
                      <button
                        onClick={addPaymentMethod}
                        className="text-blue-500 text-sm hover:text-blue-700"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                  
                  {paymentMethods.map((pm, index) => (
                    <div key={index} className="border rounded p-3 mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Método {index + 1}</span>
                        {paymentMethods.length > 1 && (
                          <button
                            onClick={() => removePaymentMethod(index)}
                            className="text-red-500 text-sm hover:text-red-700"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={pm.method}
                          onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                          className="p-2 border rounded text-sm"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Yape">Yape</option>
                          <option value="Plin">Plin</option>
                          <option value="Tarjeta">Tarjeta (+5%)</option>
                          <option value="Transferencia">Transferencia</option>
                        </select>
                        
                        <input
                          type="number"
                          value={pm.amount}
                          onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="p-2 border rounded text-sm"
                          placeholder="Monto"
                          step="0.01"
                        />
                      </div>
                      
                      {pm.method === 'Efectivo' && (
                        <div className="mt-2">
                          <input
                            type="number"
                            value={pm.cashReceived || ''}
                            onChange={(e) => updatePaymentMethod(index, 'cashReceived', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Efectivo recibido"
                            step="0.01"
                          />
                          {pm.cashReceived && pm.amount && (
                            <p className="text-xs text-gray-600 mt-1">
                              Vuelto: S/ {Math.max(0, pm.cashReceived - pm.amount).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {pm.method === 'Tarjeta' && (
                        <p className="text-xs text-orange-600 mt-1">
                          Recargo 5%: +S/ {(pm.amount * 0.05).toFixed(2)} = S/ {(pm.amount * 1.05).toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <div className="flex justify-between text-sm">
                      <span>Total a pagar:</span>
                      <span className="font-medium">S/ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total pagado (sin recargo):</span>
                      <span className={totalPaid >= afterDiscount ? 'text-green-600' : 'text-red-600'}>
                        S/ {totalPaid.toFixed(2)}
                      </span>
                    </div>
                    {totalPaid < afterDiscount && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Falta:</span>
                        <span>S/ {(afterDiscount - totalPaid).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}



              <div className="mb-4 p-3 bg-gray-100 rounded">
                <div className="flex justify-between mb-1">
                  <span>Subtotal:</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between mb-1 text-green-600">
                    <span>Descuento:</span>
                    <span>-S/ {discount.toFixed(2)}</span>
                  </div>
                )}
                {cardSurcharge > 0 && (
                  <div className="flex justify-between mb-1 text-orange-600">
                    <span>Recargo Tarjeta:</span>
                    <span>+S/ {cardSurcharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Total a Pagar:</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={processSale}
                  disabled={isProcessing || userLoading || !user?.id || (paymentStatus === 'Pagado' && isMultiplePayment && totalPaid < afterDiscount) || (paymentStatus === 'Pagado' && !isMultiplePayment && paymentMethod === 'Efectivo' && cashReceivedNum < total)}
                  className={`flex-1 py-2 rounded text-white transition-all duration-200 ${
                    isProcessing || userLoading || !user?.id || (paymentStatus === 'Pagado' && isMultiplePayment && totalPaid < afterDiscount) || (paymentStatus === 'Pagado' && !isMultiplePayment && paymentMethod === 'Efectivo' && cashReceivedNum < total)
                      ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                      : 'bg-green-500 hover:bg-green-600 active:scale-95 cursor-pointer'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Procesando...
                    </div>
                  ) : userLoading ? 'Cargando...' : paymentStatus === 'SIN PAGAR' ? 'Guardar Orden' : 'Confirmar Venta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md mx-4 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Procesando...</h3>
                <p className="text-gray-600">{confirmationMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal de configuración de pack */}
        {showPackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Configurar Pack</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Productos elegibles */}
                <div>
                  <h4 className="font-semibold mb-3">Productos Disponibles (S/ 1.00 - S/ 2.50)</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {packEligibleProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => addPackItem(product)}
                        className="p-2 border rounded hover:bg-gray-50 text-left"
                      >
                        <div className="text-sm font-medium">{product.name}</div>
                        <div className="text-xs text-green-600">S/ {product.price.toFixed(2)}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Items seleccionados */}
                <div>
                  <h4 className="font-semibold mb-3">Items del Pack</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto mb-4">
                    {packItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{item.name} x{item.quantity}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">S/ {(item.price * item.quantity).toFixed(2)}</span>
                          <button
                            onClick={() => removePackItem(item.productId)}
                            className="text-red-500 text-xs"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <h4 className="font-semibold mb-3">Extras (Máx. 3)</h4>
                  <button
                    onClick={addPackExtra}
                    disabled={packExtras.length >= 3}
                    className={`w-full p-2 rounded mb-2 ${
                      packExtras.length >= 3 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    + Decoración dulces
                  </button>
                  
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {packExtras.map((extra, index) => (
                      <div key={extra.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span className="text-sm">{extra.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">S/ {extra.price.toFixed(2)}</span>
                          <button
                            onClick={() => removePackExtra(index)}
                            className="text-red-500 text-xs"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-100 rounded">
                    <div className="flex justify-between text-sm">
                      <span>Total items:</span>
                      <span>S/ {packItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total extras:</span>
                      <span>S/ {packExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total pack:</span>
                      <span className={`${
                        (packItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                         packExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)) > 11.5 
                          ? 'text-red-600' : 'text-green-600'
                      }`}>
                        S/ {(packItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                             packExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)).toFixed(2)}
                      </span>
                    </div>
                    {(packItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                      packExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0)) > 11.5 && (
                      <p className="text-xs text-red-600 mt-1">Máximo S/ 11.50 por pack</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowPackModal(null)
                    setPackItems([])
                    setPackExtras([])
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setPackItems([])
                    setPackExtras([])
                  }}
                  className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
                >
                  Limpiar
                </button>
                <button
                  onClick={confirmPack}
                  disabled={packItems.length === 0}
                  className={`flex-1 py-2 rounded text-white ${
                    packItems.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  Agregar Pack
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de error */}
        {showError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md mx-4 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Error</h3>
                <p className="text-gray-600">{errorMessage}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowError(false)}
                  className="flex-1 py-2 px-4 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: '#CF432B' }}
                >
                  Cerrar
                </button>
                {errorMessage.includes('Stock insuficiente') && (
                  <button
                    onClick={() => {
                      setShowError(false)
                      window.location.href = '/inventory'
                    }}
                    className="flex-1 py-2 px-4 rounded-lg text-white transition-colors bg-blue-500 hover:bg-blue-600"
                  >
                    Ir a Inventario
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}