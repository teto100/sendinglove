'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, setDoc, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface NoSalesDate {
  date: string
  reason: 'No apertura de local' | 'No ventas'
  totalSales: number
}

export default function ConfigurationsPage() {
  const [noSalesDates, setNoSalesDates] = useState<NoSalesDate[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    loadMonthData()
  }, [currentMonth])

  const loadMonthData = async () => {
    setLoading(true)
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
      
      console.log('LOADING MONTH:', {
        year,
        month: month + 1,
        monthStart,
        monthEnd
      })

      // Obtener ventas solo del mes actual
      const salesQuery = query(
        collection(db, 'sales'),
        where('createdAt', '>=', monthStart),
        where('createdAt', '<=', monthEnd),
        orderBy('createdAt', 'asc')
      )
      
      const salesSnapshot = await getDocs(salesQuery)
      const salesByDate: { [key: string]: number } = {}

      salesSnapshot.docs.forEach(doc => {
        const sale = doc.data()
        const saleDate = sale.createdAt.toDate()
        // Usar hora local como en reportes
        const year = saleDate.getFullYear()
        const month = String(saleDate.getMonth() + 1).padStart(2, '0')
        const day = String(saleDate.getDate()).padStart(2, '0')
        const dateKey = `${year}-${month}-${day}`
        
        console.log('SALE DEBUG:', {
          saleId: doc.id,
          saleDate,
          dateKey,
          total: sale.total
        })
        
        if (!salesByDate[dateKey]) {
          salesByDate[dateKey] = 0
        }
        salesByDate[dateKey] += sale.total || 0
      })
      
      console.log('SALES BY DATE:', salesByDate)

      // Obtener configuraciones del mes
      const configQuery = query(collection(db, 'no_sales_config'))
      const configSnapshot = await getDocs(configQuery)
      const existingConfigs: { [key: string]: string } = {}
      
      configSnapshot.docs.forEach(doc => {
        existingConfigs[doc.id] = doc.data().reason
      })

      // Analizar solo días del mes actual
      const dates: NoSalesDate[] = []
      const batchWrites = []
      const currentDate = new Date(monthStart)
      
      while (currentDate <= monthEnd) {
        // Usar hora local como en reportes
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, '0')
        const day = String(currentDate.getDate()).padStart(2, '0')
        const dateKey = `${year}-${month}-${day}`
        const totalSales = salesByDate[dateKey] || 0

        if (totalSales === 0) {
          const reason = existingConfigs[dateKey] || 'No apertura de local'
          
          console.log('ZERO SALES DAY:', {
            dateKey,
            currentDateLocal: currentDate.toLocaleDateString('es-PE'),
            totalSales,
            reason
          })
          
          // Solo escribir si no existe configuración
          if (!existingConfigs[dateKey]) {
            batchWrites.push({
              dateKey,
              data: {
                date: dateKey,
                reason: 'No apertura de local',
                totalSales: 0,
                createdAt: new Date(),
                autoMarked: true
              }
            })
          }

          dates.push({
            date: dateKey,
            reason: reason as 'No apertura de local' | 'No ventas',
            totalSales: 0
          })
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Escribir configuraciones nuevas
      for (const item of batchWrites) {
        await setDoc(doc(db, 'no_sales_config', item.dateKey), item.data)
      }

      setNoSalesDates(dates)
    } catch (error) {
      console.error('Error loading month data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateDateReason = async (date: string, newReason: 'No apertura de local' | 'No ventas') => {
    try {
      await setDoc(doc(db, 'no_sales_config', date), {
        date,
        reason: newReason,
        totalSales: 0,
        updatedAt: new Date(),
        manuallyChanged: true
      })

      setNoSalesDates(prev => 
        prev.map(item => 
          item.date === date ? { ...item, reason: newReason } : item
        )
      )
    } catch (error) {
      console.error('Error updating date reason:', error)
    }
  }

  // Generar calendario del mes actual
  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Empezar desde domingo
    
    const calendar = []
    const currentDate = new Date(startDate)
    
    for (let week = 0; week < 6; week++) {
      const weekDays = []
      for (let day = 0; day < 7; day++) {
        // Usar hora local para consistencia
        const yearCalendar = currentDate.getFullYear()
        const monthCalendar = String(currentDate.getMonth() + 1).padStart(2, '0')
        const dayNum = String(currentDate.getDate()).padStart(2, '0')
        const dateKey = `${yearCalendar}-${monthCalendar}-${dayNum}`
        const isCurrentMonth = currentDate.getMonth() === month
        const noSalesData = noSalesDates.find(d => d.date === dateKey)
        
        weekDays.push({
          date: new Date(currentDate),
          dateKey,
          isCurrentMonth,
          noSalesData
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      calendar.push(weekDays)
      
      if (currentDate > lastDay && week >= 4) break
    }
    
    return calendar
  }

  const changeMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <ProtectedRoute module="reports">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold" style={{color: '#CF432B'}}>
                Configuraciones - Días sin Atención
              </h1>
              <button
                onClick={loadMonthData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Información:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Automático:</strong> Todos los días con 0 ventas se marcan como "No apertura de local"</li>
                  <li>• <strong>Manual:</strong> Puedes cambiar a "No ventas" si el local estuvo abierto</li>
                  <li>• <strong>Rojo:</strong> No apertura de local (excluido del cálculo)</li>
                  <li>• <strong>Amarillo:</strong> No ventas (incluido en el cálculo)</li>
                </ul>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Analizando fechas...</p>
                </div>
              ) : (
                <div>
                  {/* Navegación del calendario */}
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      ← Anterior
                    </button>
                    <h2 className="text-xl font-bold">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h2>
                    <button
                      onClick={() => changeMonth(1)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      Siguiente →
                    </button>
                  </div>

                  {/* Calendario */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {dayNames.map(day => (
                      <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-100">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendar().map((week, weekIndex) => 
                      week.map((day, dayIndex) => {
                        const isToday = day.date.toDateString() === new Date().toDateString()
                        
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`
                              min-h-[80px] p-2 border rounded-lg relative
                              ${
                                !day.isCurrentMonth 
                                  ? 'bg-gray-50 text-gray-400'
                                  : day.noSalesData
                                    ? day.noSalesData.reason === 'No apertura de local'
                                      ? 'bg-red-100 border-red-300'
                                      : 'bg-yellow-100 border-yellow-300'
                                    : 'bg-white hover:bg-gray-50'
                              }
                              ${isToday ? 'ring-2 ring-blue-500' : ''}
                            `}
                          >
                            <div className="text-sm font-medium">
                              {day.date.getDate()}
                            </div>
                            
                            {day.noSalesData && (
                              <div className="mt-1">
                                <div className="text-xs text-center mb-1">
                                  S/ 0.00
                                </div>
                                <select
                                  value={day.noSalesData.reason}
                                  onChange={(e) => updateDateReason(day.dateKey, e.target.value as any)}
                                  className="w-full text-xs p-1 border rounded"
                                >
                                  <option value="No apertura de local">No apertura</option>
                                  <option value="No ventas">No ventas</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="mt-6 text-sm text-gray-600">
                    <p><strong>Total días sin ventas:</strong> {noSalesDates.length}</p>
                    <p><strong>No apertura:</strong> {noSalesDates.filter(d => d.reason === 'No apertura de local').length}</p>
                    <p><strong>No ventas:</strong> {noSalesDates.filter(d => d.reason === 'No ventas').length}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}