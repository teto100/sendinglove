'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAllSales } from '@/hooks/useAllSales'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useExpenses } from '@/hooks/useExpenses'
import { usePurchases } from '@/hooks/usePurchases'
import { useCustomers } from '@/hooks/useCustomers'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function FinancialDashboard() {
  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    return firstDay.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => {
    const today = new Date()
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return lastDay.toISOString().split('T')[0]
  })
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Funciones para rangos de fechas
  const setCurrentWeek = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    setDateFrom(monday.toISOString().split('T')[0])
    setDateTo(sunday.toISOString().split('T')[0])
  }
  
  const setCurrentMonth = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    setDateFrom(firstDay.toISOString().split('T')[0])
    setDateTo(lastDay.toISOString().split('T')[0])
  }
  
  const [allSales, setAllSales] = useState([])
  const { sales } = useAllSales() // Mantener para compatibilidad
  const { expenses } = useExpenses()
  const { purchases } = usePurchases()
  const { customers } = useCustomers()
  
  // Cargar TODAS las ventas sin paginación
  useEffect(() => {
    const loadAllSales = async () => {
      try {
        const q = query(
          collection(db, 'sales'),
          orderBy('createdAt', 'desc')
        )
        
        const snapshot = await getDocs(q)
        const salesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }))
        
        setAllSales(salesData)
      } catch (error) {
        setAllSales([])
      }
    }
    
    loadAllSales()
  }, [])

  // Filtrar datos por rango de fechas
  const filteredSales = useMemo(() => {
    const from = new Date(dateFrom + 'T00:00:00')
    const to = new Date(dateTo + 'T23:59:59')
    
    
    const filtered = allSales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= from && saleDate <= to && sale.paymentStatus === 'Pagado'
    })
    
    return filtered
  }, [allSales, dateFrom, dateTo])

  // Métricas principales
  const metrics = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0)
    
    const result = {
      totalSales,
      totalExpenses,
      totalPurchases,
      netProfit: totalSales - totalExpenses - totalPurchases,
      salesCount: filteredSales.length,
      avgTicket: filteredSales.length > 0 ? totalSales / filteredSales.length : 0
    }
    return result
  }, [filteredSales, expenses, purchases])

  // Ventas por día
  const dailySales = useMemo(() => {
    try {
      const salesByDay = {}
      filteredSales.forEach(sale => {
        const saleDate = new Date(sale.createdAt)
        const dateKey = saleDate.toISOString().split('T')[0]
        const displayDate = saleDate.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })
        
        if (!salesByDay[dateKey]) {
          salesByDay[dateKey] = { date: displayDate, sales: 0, count: 0 }
        }
        salesByDay[dateKey].sales += sale.total
        salesByDay[dateKey].count += 1
      })
      const result = Object.values(salesByDay).slice(-7)
      return result
    } catch (error) {
      return []
    }
  }, [filteredSales])

  // Análisis de días
  const dayAnalysis = useMemo(() => {
    try {
      const from = new Date(dateFrom)
      const to = new Date(dateTo)
      const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 7) {
      // Análisis semanal - por días específicos
      const salesByDay = {}
      filteredSales.forEach(sale => {
        const saleDate = new Date(sale.createdAt)
        const dateKey = saleDate.toISOString().split('T')[0]
        const dayName = saleDate.toLocaleDateString('es-PE', { weekday: 'long' })
        const displayDate = saleDate.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })
        
        if (!salesByDay[dateKey]) {
          salesByDay[dateKey] = { day: `${dayName} ${displayDate}`, date: dateKey, sales: 0 }
        }
        salesByDay[dateKey].sales += sale.total
      })
      
      const days = Object.values(salesByDay)
      const bestDay = days.length > 0 ? days.reduce((max: any, day: any) => day.sales > max.sales ? day : max, { sales: 0 }) : { sales: 0, day: 'N/A' }
      const worstDay = days.length > 0 ? days.reduce((min: any, day: any) => day.sales < min.sales ? day : min, { sales: Infinity }) : { sales: 0, day: 'N/A' }
      
      return { type: 'week', bestDay, worstDay, data: days }
    } else {
      // Análisis mensual - agrupado por días de la semana
      const salesByWeekday = {}
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      
      filteredSales.forEach(sale => {
        const saleDate = new Date(sale.createdAt)
        const dayIndex = saleDate.getDay()
        const dayName = weekdays[dayIndex]
        
        if (!salesByWeekday[dayName]) {
          salesByWeekday[dayName] = { day: dayName, sales: 0 }
        }
        salesByWeekday[dayName].sales += sale.total
      })
      
      const days = Object.values(salesByWeekday)
      const bestDay = days.length > 0 ? days.reduce((max: any, day: any) => day.sales > max.sales ? day : max, { sales: 0 }) : { sales: 0, day: 'N/A' }
      const worstDay = days.length > 0 ? days.reduce((min: any, day: any) => day.sales < min.sales ? day : min, { sales: Infinity }) : { sales: 0, day: 'N/A' }
      
      const result = { type: 'month', bestDay, worstDay, data: days }
      return result
    }
    } catch (error) {
      return { type: 'week', bestDay: { sales: 0 }, worstDay: { sales: 0 }, data: [] }
    }
  }, [filteredSales, dateFrom, dateTo])

  // Filtrar compras por rango de fechas
  const filteredPurchases = useMemo(() => {
    const from = new Date(dateFrom + 'T00:00:00')
    const to = new Date(dateTo + 'T23:59:59')
    
    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.createdAt)
      return purchaseDate >= from && purchaseDate <= to
    })
  }, [purchases, dateFrom, dateTo])

  // Productos más vendidos
  const topProducts = useMemo(() => {
    const productSales = {}
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 }
        }
        productSales[item.name].quantity += item.quantity
        productSales[item.name].revenue += item.subtotal
      })
    })
    return Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredSales])

  // Cargar movimientos de inventario
  const [inventoryMovements, setInventoryMovements] = useState([])
  
  useEffect(() => {
    const loadInventoryMovements = async () => {
      try {
        const q = query(
          collection(db, 'inventory-movements'),
          orderBy('createdAt', 'desc')
        )
        
        const snapshot = await getDocs(q)
        const movementsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
        
        setInventoryMovements(movementsData)
      } catch (error) {
        setInventoryMovements([])
      }
    }
    
    loadInventoryMovements()
  }, [])

  // Análisis de movimiento de inventario
  const inventoryMovement = useMemo(() => {
    const from = new Date(dateFrom + 'T00:00:00')
    const to = new Date(dateTo + 'T23:59:59')
    
    // Filtrar solo movimientos de entrada en el rango de fechas
    const filteredMovements = inventoryMovements.filter(movement => {
      const movementDate = new Date(movement.createdAt)
      return movementDate >= from && movementDate <= to && movement.type === 'entrada'
    })
    
    const productMovement = {}
    
    // Contar registros de entrada por producto
    filteredMovements.forEach(movement => {
      if (!productMovement[movement.productName]) {
        productMovement[movement.productName] = { 
          name: movement.productName, 
          registrations: 0, 
          totalQuantity: 0 
        }
      }
      productMovement[movement.productName].registrations += 1
      productMovement[movement.productName].totalQuantity += movement.quantity
    })
    
    const products = Object.values(productMovement)
    const mostMoved = products.sort((a: any, b: any) => b.registrations - a.registrations).slice(0, 5)
    const leastMoved = products.sort((a: any, b: any) => a.registrations - b.registrations).slice(0, 5)
    
    return { mostMoved, leastMoved }
  }, [inventoryMovements, dateFrom, dateTo])

  // Análisis de compras frecuentes
  const purchaseAnalysis = useMemo(() => {
    const purchaseFrequency = {}
    
    filteredPurchases.forEach(purchase => {
      const productName = purchase.productName || 'Producto sin nombre'
      if (!purchaseFrequency[productName]) {
        purchaseFrequency[productName] = { name: productName, purchases: 0, totalCost: 0 }
      }
      purchaseFrequency[productName].purchases += 1
      purchaseFrequency[productName].totalCost += purchase.totalAmount || purchase.totalCost || 0
    })
    
    const products = Object.values(purchaseFrequency)
    const mostFrequent = products.sort((a: any, b: any) => b.purchases - a.purchases).slice(0, 5)
    const leastFrequent = products.sort((a: any, b: any) => a.purchases - b.purchases).slice(0, 5)
    
    return { mostFrequent, leastFrequent }
  }, [filteredPurchases])

  // Ventas por método de pago (soporta múltiples métodos)
  const paymentMethods = useMemo(() => {
    const methods = {}
    
    filteredSales.forEach(sale => {
      // Si tiene múltiples métodos de pago
      if (sale.paymentMethods && sale.paymentMethods.length > 0) {
        sale.paymentMethods.forEach(pm => {
          const method = pm.method || 'Sin especificar'
          if (!methods[method]) {
            methods[method] = { name: method, value: 0 }
          }
          methods[method].value += pm.amount
        })
      } else {
        // Compatibilidad con versión anterior
        const method = sale.paymentMethod || 'Sin especificar'
        if (!methods[method]) {
          methods[method] = { name: method, value: 0 }
        }
        methods[method].value += sale.total
      }
    })
    
    return Object.values(methods)
  }, [filteredSales])

  // Clientes recurrentes
  const recurringCustomers = useMemo(() => {
    const customerPurchases = {}
    filteredSales.forEach(sale => {
      if (sale.customerId) {
        if (!customerPurchases[sale.customerId]) {
          customerPurchases[sale.customerId] = { count: 0, total: 0 }
        }
        customerPurchases[sale.customerId].count += 1
        customerPurchases[sale.customerId].total += sale.total
      }
    })
    
    const recurring = Object.entries(customerPurchases)
      .filter(([_, data]: [string, any]) => data.count > 1)
      .map(([customerId, data]: [string, any]) => {
        const customer = customers.find(c => c.id === customerId)
        return {
          name: customer?.name || 'Cliente desconocido',
          purchases: data.count,
          total: data.total
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
    
    return recurring
  }, [filteredSales, customers])

  return (
    <ProtectedRoute module="reports">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Financiero</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={setCurrentWeek}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Esta Semana
              </button>
              <button
                onClick={setCurrentMonth}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Este Mes
              </button>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Ventas Totales</h3>
              <p className="text-2xl font-bold text-green-600">S/ {metrics.totalSales.toFixed(2)}</p>
              <p className="text-sm text-gray-500">{metrics.salesCount} ventas</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Ticket Promedio</h3>
              <p className="text-2xl font-bold text-blue-600">S/ {metrics.avgTicket.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Gastos Totales</h3>
              <p className="text-2xl font-bold text-red-600">S/ {(metrics.totalExpenses + metrics.totalPurchases).toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Ganancia Neta</h3>
              <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                S/ {metrics.netProfit.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Tendencia de ventas */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Tendencia de Ventas (Últimos 7 días)</h3>
              <div className="h-80">
                <Line
                  key={`line-${dateFrom}-${dateTo}`}
                  data={{
                    labels: dailySales.map((item: any) => item.date),
                    datasets: [{
                      label: 'Ventas (S/)',
                      data: dailySales.map((item: any) => item.sales),
                      borderColor: '#3B82F6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `S/ ${context.parsed.y.toFixed(2)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `S/ ${value}`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Ventas por Método de Pago</h3>
              <div className="h-80">
                <Pie
                  key={`pie-${dateFrom}-${dateTo}`}
                  data={{
                    labels: paymentMethods.map((item: any) => item.name),
                    datasets: [{
                      data: paymentMethods.map((item: any) => item.value),
                      backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
                      ],
                      borderWidth: 2,
                      borderColor: '#fff'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const total = paymentMethods.reduce((sum: number, item: any) => sum + item.value, 0)
                            const percentage = ((context.parsed / total) * 100).toFixed(1)
                            return `${context.label}: S/ ${context.parsed.toFixed(2)} (${percentage}%)`
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Productos más vendidos por cantidad */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Productos Más Vendidos</h3>
              <div className="h-80">
                <Bar
                  key={`bar1-${dateFrom}-${dateTo}`}
                  data={{
                    labels: [...topProducts].sort((a: any, b: any) => b.quantity - a.quantity).slice(0, 5).map((item: any) => item.name),
                    datasets: [{
                      label: 'Cantidad',
                      data: [...topProducts].sort((a: any, b: any) => b.quantity - a.quantity).slice(0, 5).map((item: any) => item.quantity),
                      backgroundColor: '#3B82F6',
                      borderColor: '#1D4ED8',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.parsed.y} unidades`
                        }
                      }
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45
                        }
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `${value} und`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Productos más rentables por ingresos */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Productos Más Rentables</h3>
              <div className="h-80">
                <Bar
                  key={`bar2-${dateFrom}-${dateTo}`}
                  data={{
                    labels: topProducts.map((item: any) => item.name),
                    datasets: [{
                      label: 'Ingresos (S/)',
                      data: topProducts.map((item: any) => item.revenue),
                      backgroundColor: '#10B981',
                      borderColor: '#059669',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `S/ ${context.parsed.y.toFixed(2)}`
                        }
                      }
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45
                        }
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `S/ ${value}`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Análisis de días */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-bold mb-4">
              Análisis de Días {dayAnalysis.type === 'week' ? '(Semana)' : '(Mes - Por día de semana)'}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64">
                <Bar
                  key={`bar3-${dateFrom}-${dateTo}`}
                  data={{
                    labels: dayAnalysis.data.map((item: any) => item.day),
                    datasets: [{
                      label: 'Ventas (S/)',
                      data: dayAnalysis.data.map((item: any) => item.sales),
                      backgroundColor: dayAnalysis.data.map((item: any) => 
                        item === dayAnalysis.bestDay ? '#10B981' : 
                        item === dayAnalysis.worstDay ? '#EF4444' : '#6B7280'
                      ),
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `S/ ${context.parsed.y.toFixed(2)}`
                        }
                      }
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45
                        }
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `S/ ${value}`
                        }
                      }
                    }
                  }}
                />
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-800">Mejor Día</h4>
                  <p className="text-green-600">{dayAnalysis.bestDay.day}</p>
                  <p className="text-lg font-bold text-green-800">S/ {dayAnalysis.bestDay.sales?.toFixed(2) || '0.00'}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-red-800">Peor Día</h4>
                  <p className="text-red-600">{dayAnalysis.worstDay.day}</p>
                  <p className="text-lg font-bold text-red-800">S/ {dayAnalysis.worstDay.sales === Infinity ? '0.00' : dayAnalysis.worstDay.sales?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-2">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <p>Período: {dayAnalysis.type === 'week' ? 'Semanal' : 'Mensual'}</p>
                  <p>Días analizados: {dayAnalysis.data.length}</p>
                  <p>Diferencia: S/ {((dayAnalysis.bestDay.sales || 0) - (dayAnalysis.worstDay.sales === Infinity ? 0 : dayAnalysis.worstDay.sales || 0)).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Clientes recurrentes */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Clientes Recurrentes</h3>
              <div className="space-y-3">
                {recurringCustomers.map((customer, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.purchases} compras</p>
                    </div>
                    <p className="font-bold text-green-600">S/ {customer.total.toFixed(2)}</p>
                  </div>
                ))}
                {recurringCustomers.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay clientes recurrentes en el período</p>
                )}
              </div>
            </div>
          </div>

          {/* Análisis de Inventario y Compras */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Movimiento de Inventario */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Movimiento de Inventario</h3>
              
              <div className="mb-6">
                <h4 className="font-medium text-green-700 mb-3">Productos que Más se Mueven</h4>
                <div className="space-y-2">
                  {inventoryMovement.mostMoved.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium">{product.name}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-700">{product.registrations} registros</div>
                        <div className="text-xs text-gray-500">{product.totalQuantity} unidades</div>
                      </div>
                    </div>
                  ))}
                  {inventoryMovement.mostMoved.length === 0 && (
                    <p className="text-gray-500 text-sm">No hay datos</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-red-700 mb-3">Productos que Menos se Mueven</h4>
                <div className="space-y-2">
                  {inventoryMovement.leastMoved.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm font-medium">{product.name}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-700">{product.registrations} registros</div>
                        <div className="text-xs text-gray-500">{product.totalQuantity} unidades</div>
                      </div>
                    </div>
                  ))}
                  {inventoryMovement.leastMoved.length === 0 && (
                    <p className="text-gray-500 text-sm">No hay datos</p>
                  )}
                </div>
              </div>
            </div>

            {/* Análisis de Compras */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Frecuencia de Compras</h3>
              
              <div className="mb-6">
                <h4 className="font-medium text-blue-700 mb-3">Compras Más Frecuentes</h4>
                <div className="space-y-2">
                  {purchaseAnalysis.mostFrequent.map((purchase, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm font-medium">{purchase.name}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-700">{purchase.purchases} compras</div>
                        <div className="text-xs text-gray-500">S/ {purchase.totalCost.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  {purchaseAnalysis.mostFrequent.length === 0 && (
                    <p className="text-gray-500 text-sm">No hay compras en el período</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-orange-700 mb-3">Compras Menos Frecuentes</h4>
                <div className="space-y-2">
                  {purchaseAnalysis.leastFrequent.map((purchase, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span className="text-sm font-medium">{purchase.name}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-orange-700">{purchase.purchases} compras</div>
                        <div className="text-xs text-gray-500">S/ {purchase.totalCost.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  {purchaseAnalysis.leastFrequent.length === 0 && (
                    <p className="text-gray-500 text-sm">No hay compras en el período</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}