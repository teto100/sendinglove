'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAllSales } from '@/hooks/useAllSales'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useExpenses } from '@/hooks/useExpenses'
import { usePurchases } from '@/hooks/usePurchases'

import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function CashClosing() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [allSalesForDay, setAllSalesForDay] = useState([])
  const { sales } = useAllSales()
  
  // Cargar TODAS las ventas del día seleccionado
  useEffect(() => {
    const loadAllSalesForDay = async () => {
      try {
        const [year, month, day] = selectedDate.split('-').map(Number)
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59)
        
        const q = query(
          collection(db, 'sales'),
          where('createdAt', '>=', startOfDay),
          where('createdAt', '<=', endOfDay),
          orderBy('createdAt', 'desc')
        )
        
        const snapshot = await getDocs(q)
        const salesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }))
        
        setAllSalesForDay(salesData)
      } catch (error) {
        setAllSalesForDay([])
      }
    }
    
    loadAllSalesForDay()
  }, [selectedDate])
  const { expenses } = useExpenses()
  const { purchases } = usePurchases()


  // Filtrar ventas del día seleccionado (por fecha de creación)
  const dailySales = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    

    
    const filtered = allSalesForDay.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      const saleYear = saleDate.getFullYear()
      const saleMonth = saleDate.getMonth() + 1
      const saleDay = saleDate.getDate()
      const isPaid = sale.paymentStatus === 'Pagado'
      const isNotDeleted = sale.orderStatus !== 'Eliminado'
      
      const matchesDate = saleYear === year && saleMonth === month && saleDay === day
      
      return matchesDate && isPaid && isNotDeleted
    })
    
    return filtered
  }, [allSalesForDay, selectedDate])

  // Filtrar gastos del día seleccionado
  const dailyExpenses = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.createdAt)
      return expenseDate.getFullYear() === year &&
             expenseDate.getMonth() + 1 === month &&
             expenseDate.getDate() === day
    })
  }, [expenses, selectedDate])

  // Filtrar compras del día seleccionado
  const dailyPurchases = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.createdAt)
      return purchaseDate.getFullYear() === year &&
             purchaseDate.getMonth() + 1 === month &&
             purchaseDate.getDate() === day
    })
  }, [purchases, selectedDate])

  // Consolidar ventas por método de pago (soporta múltiples métodos)
  const salesByPaymentMethod = useMemo(() => {
    const consolidated = {}
    
    dailySales.forEach((sale, index) => {
      
      // Si tiene múltiples métodos de pago
      if (sale.paymentMethods && sale.paymentMethods.length > 0) {
        let orderCounted = false
        
        sale.paymentMethods.forEach((pm, pmIndex) => {
          const method = pm.method || 'Sin especificar'
          
          if (!consolidated[method]) {
            consolidated[method] = { count: 0, total: 0, transactions: 0 }
          }
          consolidated[method].total += pm.amount
          consolidated[method].transactions += 1
          
          // Contar la orden solo una vez (en el primer método)
          if (!orderCounted) {
            consolidated[method].count += 1
            orderCounted = true
          }
        })
      } else {
        // Compatibilidad con versión anterior
        const method = sale.paymentMethod || 'Sin especificar'
        
        if (!consolidated[method]) {
          consolidated[method] = { count: 0, total: 0, transactions: 0 }
        }
        consolidated[method].count += 1
        consolidated[method].total += sale.total
        consolidated[method].transactions += 1
      }
    })
    
    return consolidated
  }, [dailySales])

  // Productos vendidos
  const productsSold = useMemo(() => {
    const products = {}
    dailySales.forEach(sale => {
      sale.items.forEach(item => {
        if (!products[item.name]) {
          products[item.name] = { quantity: 0, total: 0 }
        }
        products[item.name].quantity += item.quantity
        products[item.name].total += item.subtotal
      })
    })
    return products
  }, [dailySales])



  const totalSales = dailySales.reduce((sum, sale) => sum + sale.total, 0)
  
  // Verificar que el total consolidado coincida con el total de ventas
  const consolidatedTotal = Object.values(salesByPaymentMethod).reduce((sum: number, data: any) => sum + data.total, 0)
  
  if (Math.abs(totalSales - consolidatedTotal) > 0.01) {
  }
  const totalExpenses = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalPurchases = dailyPurchases.reduce((sum, purchase) => {
    const amount = purchase.totalAmount || purchase.totalCost || (purchase.quantity * purchase.unitCost) || 0
    return sum + amount
  }, 0)
  const totalEgresos = totalExpenses + totalPurchases
  const netResult = totalSales - totalEgresos



  // Fecha mínima (15 días atrás)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() - 15)
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <ProtectedRoute module="cash-closing">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Cierre de Caja</h1>
            <div className="flex gap-3 items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={minDateString}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumen General */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Resumen del Día</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Ventas ({dailySales.length}):</span>
                  <span className="font-bold text-green-600">S/ {totalSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Egresos Compras ({dailyPurchases.length}):</span>
                  <span className="font-bold text-red-600">S/ {totalPurchases.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Egresos Fijos ({dailyExpenses.length}):</span>
                  <span className="font-bold text-red-600">S/ {totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-bold">Resultado Neto:</span>
                  <span className={`font-bold ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    S/ {netResult.toFixed(2)}
                  </span>
                </div>

              </div>
            </div>

            {/* Ventas por Método de Pago */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Dinero por Método de Pago</h2>
              <div className="space-y-3">
                {Object.entries(salesByPaymentMethod).map(([method, data]: [string, any]) => (
                  <div key={method} className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{method}</span>
                      <span className="font-bold text-green-600">S/ {data.total.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {data.count > 0 && `${data.count} órdenes`}
                      {data.transactions > 0 && data.transactions !== data.count && ` • ${data.transactions} transacciones`}
                    </div>
                  </div>
                ))}
                {Object.keys(salesByPaymentMethod).length === 0 && (
                  <p className="text-gray-500">No hay ventas registradas</p>
                )}
                
                {/* Total general */}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Recaudado:</span>
                    <span className="text-green-600">S/ {totalSales.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos Vendidos */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Productos Vendidos</h2>
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {Object.entries(productsSold).map(([product, data]: [string, any]) => (
                    <div key={product} className="flex justify-between text-sm">
                      <span>{product} ({data.quantity})</span>
                      <span className="font-medium">S/ {data.total.toFixed(2)}</span>
                    </div>
                  ))}
                  {Object.keys(productsSold).length === 0 && (
                    <p className="text-gray-500">No hay productos vendidos</p>
                  )}
                </div>
              </div>
            </div>



            {/* Compras de Almacén */}
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Compras de Almacén del Día</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 w-40">Producto</th>
                      <th className="text-left py-2 w-24">Categoría</th>
                      <th className="text-right py-2 w-20">Cantidad</th>
                      <th className="text-right py-2 pr-4 w-20">Total</th>
                      <th className="text-left py-2 pl-4 w-32">Proveedor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyPurchases.map(purchase => (
                      <tr key={purchase.id} className="border-b">
                        <td className="py-2 w-40">{purchase.productName}</td>
                        <td className="py-2 w-24">{purchase.category}</td>
                        <td className="py-2 text-right w-20">
                          {purchase.measureType === 'weight' ? `${purchase.quantity} kg` : `${purchase.quantity} und`}
                        </td>
                        <td className="py-2 text-right pr-4 w-20">S/ {((purchase.totalAmount || purchase.totalCost || (purchase.quantity * purchase.unitCost)) || 0).toFixed(2)}</td>
                        <td className="py-2 pl-4 w-32">{purchase.supplierName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dailyPurchases.length === 0 && (
                  <p className="text-gray-500 py-4">No hay compras registradas</p>
                )}
              </div>
            </div>

            {/* Gastos Fijos */}
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Gastos Fijos del Día</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 w-48">Tipo</th>
                      <th className="text-right py-2 pr-6 w-24">Monto</th>
                      <th className="text-left py-2 pl-4 w-64">Notas</th>
                      <th className="text-left py-2 w-32">Método de Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyExpenses.map(expense => (
                      <tr key={expense.id} className="border-b">
                        <td className="py-2 w-48">{expense.type === 'Otros' && expense.customType ? expense.customType : expense.type}</td>
                        <td className="py-2 text-right pr-6 w-24">S/ {expense.amount.toFixed(2)}</td>
                        <td className="py-2 pl-4 w-64">{expense.notes || '-'}</td>
                        <td className="py-2 w-32">{expense.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dailyExpenses.length === 0 && (
                  <p className="text-gray-500 py-4">No hay gastos fijos registrados</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}