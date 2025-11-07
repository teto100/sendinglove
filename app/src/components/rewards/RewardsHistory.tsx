'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { collection, query, orderBy, limit, startAfter, getDocs, DocumentSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { RewardMovement } from '@/types/rewards'

export default function RewardsHistory() {
  const [movements, setMovements] = useState<RewardMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    loadMovements()
  }, [])

  const loadMovements = async (isNextPage = false) => {
    setLoading(true)
    try {
      // Obtener todos los movimientos sin orderBy para evitar índice compuesto
      const movementsQuery = query(
        collection(db, 'rewards_movements'),
        limit(pageSize * (isNextPage ? page + 1 : 1))
      )

      const snapshot = await getDocs(movementsQuery)
      const allMovements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RewardMovement[]

      // Ordenar en memoria por fecha descendente
      const sortedMovements = allMovements.sort((a, b) => 
        b.created_at.toDate().getTime() - a.created_at.toDate().getTime()
      )

      if (isNextPage) {
        setMovements(sortedMovements)
        setPage(prev => prev + 1)
      } else {
        setMovements(sortedMovements.slice(0, pageSize))
        setPage(1)
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(sortedMovements.length === pageSize * (isNextPage ? page + 1 : 1))
    } catch (error) {
      console.error('Error loading movements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'compra': return '🛒'
      case 'referido': return '👥'
      case 'canje': return '🎁'
      case 'super_premio': return '⭐'
      default: return '📝'
    }
  }

  const getMovementColor = (type: string, points: number) => {
    if (points > 0) return 'text-green-600'
    if (points < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">📋 Historial de Movimientos</h2>
        <div className="text-sm text-gray-600">
          Página {page} • {movements.length} registros
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {movement.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {movement.customer_phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getMovementIcon(movement.type)}</span>
                      <span className="text-sm font-medium capitalize">
                        {movement.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${getMovementColor(movement.type, movement.points)}`}>
                      {movement.points > 0 ? '+' : ''}{movement.points}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {movement.type === 'compra' && movement.order_total && (
                        <div>
                          <div>Compra: S/{movement.order_total.toFixed(2)}</div>
                          {movement.products_consumed && (
                            <div className="text-xs text-gray-500 mt-1">
                              {movement.products_consumed.slice(0, 2).join(', ')}
                              {movement.products_consumed.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      )}
                      {movement.type === 'referido' && movement.referral_customer_name && (
                        <div>Refirió a: {movement.referral_customer_name}</div>
                      )}
                      {movement.type === 'canje' && movement.prize_redeemed && (
                        <div>Premio: {movement.prize_redeemed}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(movement.created_at).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {hasMore && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => loadMovements(true)}
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Cargando...</span>
              ) : (
                <>
                  <span>Cargar más registros</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {movements.length === 0 && !loading && (
          <div className="px-6 py-8 text-center text-gray-500">
            No hay movimientos registrados
          </div>
        )}
      </div>
    </div>
  )
}