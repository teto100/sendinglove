'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRewardsPrizes } from '@/hooks/useRewardsPrizes'

interface Stats {
  totalCustomers: number
  activeCustomers: number
  totalPointsEarned: number
  totalPointsRedeemed: number
  totalPrizesRedeemed: number
  totalCostPrizes: number
  averageCostPerPrize: number
  conversionRate: number
}

export default function RewardsStats() {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0,
    totalPrizesRedeemed: 0,
    totalCostPrizes: 0,
    averageCostPerPrize: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)

  const { getPrizesStats } = useRewardsPrizes()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      // Estadísticas de clientes
      const allCustomersSnap = await getDocs(collection(db, 'customers'))
      const activeCustomersSnap = await getDocs(
        query(collection(db, 'customers'), where('programa_referidos', '==', true))
      )

      const totalCustomers = allCustomersSnap.size
      const activeCustomers = activeCustomersSnap.size

      // Calcular puntos totales ganados
      let totalPointsEarned = 0
      activeCustomersSnap.docs.forEach(doc => {
        const data = doc.data()
        totalPointsEarned += (data.puntos_compras || 0) + (data.puntos_referidos || 0)
      })

      // Estadísticas de movimientos
      const movementsSnap = await getDocs(collection(db, 'rewards_movements'))
      const movements = movementsSnap.docs.map(doc => doc.data())
      
      const totalPointsFromMovements = movements.reduce((sum, mov) => {
        return sum + (mov.points > 0 ? mov.points : 0)
      }, 0)

      const totalPointsRedeemed = Math.abs(movements.reduce((sum, mov) => {
        return sum + (mov.points < 0 ? mov.points : 0)
      }, 0))

      // Estadísticas de premios
      const prizesStats = await getPrizesStats()

      const conversionRate = activeCustomers > 0 
        ? (prizesStats.total_prizes_redeemed / activeCustomers) * 100 
        : 0

      setStats({
        totalCustomers,
        activeCustomers,
        totalPointsEarned: totalPointsFromMovements,
        totalPointsRedeemed,
        totalPrizesRedeemed: prizesStats.total_prizes_redeemed,
        totalCostPrizes: prizesStats.total_cost_prizes,
        averageCostPerPrize: prizesStats.average_cost_per_prize,
        conversionRate
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-lg font-semibold">📊 Estadísticas del Programa</h2>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Clientes Activos</div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</div>
              <div className="text-xs text-gray-400">
                de {stats.totalCustomers} total
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">⭐</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Puntos Ganados</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPointsEarned}</div>
              <div className="text-xs text-gray-400">
                {stats.totalPointsRedeemed} canjeados
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">🎁</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Premios Canjeados</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPrizesRedeemed}</div>
              <div className="text-xs text-gray-400">
                S/{stats.totalCostPrizes.toFixed(2)} en costos
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Tasa Conversión</div>
              <div className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">
                clientes que canjearon
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análisis de Costos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">💰 Análisis de Costos</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total invertido en premios:</span>
              <span className="font-semibold">S/{stats.totalCostPrizes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Costo promedio por premio:</span>
              <span className="font-semibold">S/{stats.averageCostPerPrize.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Costo por cliente activo:</span>
              <span className="font-semibold">
                S/{stats.activeCustomers > 0 ? (stats.totalCostPrizes / stats.activeCustomers).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Análisis de Engagement */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">🎯 Análisis de Participación</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Puntos promedio por cliente:</span>
              <span className="font-semibold">
                {stats.activeCustomers > 0 ? (stats.totalPointsEarned / stats.activeCustomers).toFixed(1) : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Puntos disponibles:</span>
              <span className="font-semibold">
                {stats.totalPointsEarned - stats.totalPointsRedeemed}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tasa de canje:</span>
              <span className="font-semibold">
                {stats.totalPointsEarned > 0 ? ((stats.totalPointsRedeemed / stats.totalPointsEarned) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Estimado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-4">📊 Retorno de Inversión (ROI)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              S/{(stats.totalPointsEarned * 15).toFixed(0)}
            </div>
            <div className="text-sm text-blue-700">Ventas generadas estimadas</div>
            <div className="text-xs text-blue-600">(puntos × S/15 mínimo)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              S/{((stats.totalPointsEarned * 15) - stats.totalCostPrizes).toFixed(0)}
            </div>
            <div className="text-sm text-green-700">Beneficio neto estimado</div>
            <div className="text-xs text-green-600">(ventas - costos premios)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalCostPrizes > 0 ? (((stats.totalPointsEarned * 15) / stats.totalCostPrizes) * 100).toFixed(0) : '0'}%
            </div>
            <div className="text-sm text-purple-700">ROI del programa</div>
            <div className="text-xs text-purple-600">(ventas / inversión)</div>
          </div>
        </div>
      </div>
    </div>
  )
}