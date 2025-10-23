'use client'

import { useState, useEffect } from 'react'
import { offlineStorage } from '@/lib/offlineStorage'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default function OrdersOfflinePage() {
  const [orders, setOrders] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const offlineOrders = offlineStorage.getOfflineOrders()
      setOrders(offlineOrders)
    }
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="text-center py-8">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedidos Offline</h1>
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Sin conexión</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay pedidos offline</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{order.orderType}</h3>
                  {order.customerName && (
                    <p className="text-sm text-gray-600">Cliente: {order.customerName}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                    Pendiente Sync
                  </span>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    S/ {order.total?.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2">Items:</h4>
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>S/ {item.subtotal?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}