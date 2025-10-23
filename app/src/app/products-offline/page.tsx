'use client'

import { useState, useEffect } from 'react'
import { offlineStorage } from '@/lib/offlineStorage'
import ProductImage from '@/components/ui/ProductImage'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default function ProductsOfflinePage() {
  const [products, setProducts] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const offlineProducts = offlineStorage.getProducts()
      setProducts(offlineProducts)
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
        <h1 className="text-2xl font-bold">Productos (Offline)</h1>
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Sin conexión</span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay productos en cache</p>
          <p className="text-sm text-gray-400 mt-2">Conéctate a internet para descargar productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                width={200}
                height={150}
                className="w-full h-32 object-cover rounded mb-3"
              />
              <h3 className="font-semibold text-gray-800">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-green-600">S/ {product.price?.toFixed(2)}</span>
                <span className="text-xs text-gray-500">{product.sku}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}