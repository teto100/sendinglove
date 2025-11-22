'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, GiftIcon, StarIcon } from '@heroicons/react/24/outline'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRewards } from '@/hooks/useRewards'
import { useRewardsPrizes } from '@/hooks/useRewardsPrizes'
import { useCustomersOnline } from '@/hooks/useCustomersOnline'
import { CustomerRewardsSearch } from '@/types/rewards'
import { Customer } from '@/types/customer'

export default function CustomerSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [customerData, setCustomerData] = useState<CustomerRewardsSearch | null>(null)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [topCustomers, setTopCustomers] = useState<any[]>([])
  
  const { loading, searchCustomer } = useRewards()
  const { prizes, redeemPrize } = useRewardsPrizes()
  const { customers } = useCustomersOnline()

  useEffect(() => {
    loadTopCustomersAndDebug()
  }, [customers])
  
  const loadTopCustomersAndDebug = async () => {
    const enabledCustomers = customers.filter(c => c.programa_referidos)
    
    // Cargar todos los clientes habilitados desde Firebase para top customers
    try {
      const allEnabledSnap = await getDocs(
        query(collection(db, 'customers'), where('programa_referidos', '==', true))
      )
      
      const allEnabled = allEnabledSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // 1. Clientes con más puntos
      const withPoints = allEnabled.filter(c => 
        (c.puntos_compras || 0) + (c.puntos_referidos || 0) > 0
      ).sort((a, b) => 
        ((b.puntos_compras || 0) + (b.puntos_referidos || 0)) - 
        ((a.puntos_compras || 0) + (a.puntos_referidos || 0))
      ).slice(0, 10)
      
      if (withPoints.length > 0) {
        setTopCustomers(withPoints)
        return
      }
      
      // 2. Clientes con referidos sin activar
      const withReferrals = allEnabled.filter(c => c.referidos && c.referidos > 0)
        .sort((a, b) => (b.referidos || 0) - (a.referidos || 0))
        .slice(0, 10)
      
      if (withReferrals.length > 0) {
        setTopCustomers(withReferrals)
        return
      }
      
      // 3. Últimos 10 registrados
      const recent = allEnabled
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
      
      setTopCustomers(recent)
    } catch (error) {
      console.error('Error loading top customers:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setCustomerData(null)
      return
    }
    
    const result = await searchCustomer(searchTerm.trim())
    setCustomerData(result)
  }

  const handleRedeem = async (prizeId: string) => {
    if (!customerData) return
    
    const success = await redeemPrize(customerData.customer.id, prizeId)
    if (success) {
      // Refrescar datos del cliente
      const updated = await searchCustomer(searchTerm.trim())
      setCustomerData(updated)
      setShowRedeemModal(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">🔍 Buscar Cliente</h2>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por teléfono o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            <span>Buscar</span>
          </button>
        </div>
      </div>

      {/* Lista de Clientes Destacados */}
      {!customerData && topCustomers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            🎆 Clientes Destacados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCustomers.map((customer) => {
              const totalPoints = (customer.puntos_compras || 0) + (customer.puntos_referidos || 0)
              
              // Determinar estado basado en campos
              let estado, bgColor, badgeColor, estadoTexto
              
              if (!customer.programa_referidos) {
                estado = 'no_suscrito'
                bgColor = 'bg-gray-50 border-gray-200'
                badgeColor = 'bg-gray-100 text-gray-800'
                estadoTexto = '❌ No suscrito'
              } else if (customer.programa_referidos && !customer.terminos_condiciones) {
                estado = 'inscrito'
                bgColor = 'bg-yellow-50 border-yellow-200'
                badgeColor = 'bg-yellow-100 text-yellow-800'
                estadoTexto = '⏳ Inscrito'
              } else {
                estado = 'activo'
                bgColor = 'bg-green-50 border-green-200'
                badgeColor = 'bg-green-100 text-green-800'
                estadoTexto = '✅ Activo'
              }
              
              return (
                <div key={customer.id} className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${bgColor}`}
                     onClick={async () => {
                       setCustomerData(null)
                       const result = await searchCustomer(customer.phone || customer.name)
                       setCustomerData(result)
                     }}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{customer.name}</div>
                    <span className={`px-2 py-1 text-xs rounded-full ${badgeColor}`}>
                      {estadoTexto}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{customer.phone}</div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-blue-600">💰 {totalPoints} pts</span>
                    {customer.referidos > 0 && (
                      <span className="text-green-600">👥 {customer.referidos} ref</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium">Cargando...</span>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {customerData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Cliente */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">👤 Información del Cliente</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Nombre:</span> {customerData.customer.name}
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  customerData.customer.terminos_condiciones 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {customerData.customer.terminos_condiciones ? '✅ Activo' : '⏳ Inscrito'}
                </span>
              </div>
              <div>
                <span className="font-medium">Teléfono:</span> {customerData.customer.phone}
              </div>
              {!customerData.customer.terminos_condiciones && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    ⚠️ <strong>Pendiente:</strong> El cliente debe aceptar términos y condiciones via WhatsApp para activar el programa.
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {customerData.customer.puntos_compras || 0}
                  </div>
                  <div className="text-sm text-gray-600">Puntos por Compras</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {customerData.customer.puntos_referidos || 0}
                  </div>
                  <div className="text-sm text-gray-600">Puntos por Referidos</div>
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">
                  {customerData.total_points}
                </div>
                <div className="text-sm text-gray-600">Total de Puntos</div>
                {customerData.can_redeem && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <GiftIcon className="h-4 w-4 mr-1" />
                      ¡Puede canjear premio!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Información de Referidos */}
            {customerData.referred_customers && customerData.referred_customers.length > 0 && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">👥 Es referente de:</h4>
                <div className="space-y-2">
                  {customerData.referred_customers.map((ref, index) => {
                    const registrationDate = ref.createdAt?.toDate ? ref.createdAt.toDate() : new Date(ref.createdAt)
                    const expirationDate = new Date(registrationDate)
                    expirationDate.setDate(expirationDate.getDate() + 15)
                    const daysLeft = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    const hasCompra = customerData.movements.some(m => m.referral_customer_id === ref.id)
                    
                    return (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-purple-700">{ref.name} ({ref.phone})</div>
                        {!hasCompra && daysLeft > 0 && (
                          <div className="text-purple-600">⏰ {daysLeft} días para primera compra</div>
                        )}
                        {!hasCompra && daysLeft <= 0 && (
                          <div className="text-red-600">❌ Tiempo expirado</div>
                        )}
                        {hasCompra && (
                          <div className="text-green-600">✅ Ya realizó compra</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Alertas de Expiración */}
            {customerData.referral_expirations && customerData.referral_expirations.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2">⚠️ Puntos en riesgo:</h4>
                <div className="space-y-2">
                  {customerData.referral_expirations.map((exp, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium text-orange-700">{exp.customer_name}</div>
                      <div className="text-orange-600">
                        Expira: {exp.expiration_date.toLocaleDateString('es-PE')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {customerData.can_redeem && customerData.customer.terminos_condiciones && (
              <button
                onClick={() => setShowRedeemModal(true)}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <GiftIcon className="h-5 w-5" />
                <span>Canjear Premio</span>
              </button>
            )}
            
            {!customerData.customer.terminos_condiciones && (
              <div className="w-full mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-center">
                <span>⏳ Debe aceptar términos para canjear premios</span>
              </div>
            )}
          </div>

          {/* Historial */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">📋 Historial de Puntos</h3>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {customerData.movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {movement.type === 'compra' && '🛒 Compra'}
                      {movement.type === 'referido' && '👥 Referido'}
                      {movement.type === 'canje' && '🎁 Canje'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(movement.created_at).toLocaleDateString()}
                    </div>
                    {movement.order_total && (
                      <div className="text-sm text-gray-600">
                        Compra: S/{movement.order_total.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className={`font-bold ${movement.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {movement.points > 0 ? '+' : ''}{movement.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Canje */}
      {showRedeemModal && customerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">🎁 Seleccionar Premio</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {prizes.filter(p => p.points_required <= customerData.total_points).map((prize) => (
                <div key={prize.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{prize.product_name}</div>
                    <div className="text-sm text-gray-600">
                      {prize.points_required} puntos • S/{prize.product_cost.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedeem(prize.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Canjear
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}