'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, GiftIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useRewardsPrizes } from '@/hooks/useRewardsPrizes'
import { Product } from '@/types/product'

export default function PrizesManagement() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [eligibleProducts, setEligibleProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  
  const { loading, prizes, getEligibleProducts, createPrize, deletePrize, loadPrizes } = useRewardsPrizes()

  useEffect(() => {
    loadEligibleProducts()
  }, [])

  const loadEligibleProducts = async () => {
    const products = await getEligibleProducts()
    setEligibleProducts(products)
  }

  const handleCreatePrize = async () => {
    if (!selectedProduct) return
    
    const success = await createPrize(selectedProduct)
    if (success) {
      setShowAddModal(false)
      setSelectedProduct('')
      await loadPrizes()
    }
  }

  const handleDeletePrize = async (prizeId: string, prizeName: string) => {
    if (confirm(`¿Eliminar el premio "${prizeName}"?`)) {
      await deletePrize(prizeId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">🎁 Gestión de Premios</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Agregar Premio</span>
        </button>
      </div>

      {/* Lista de Premios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Premios Disponibles</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {prizes.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No hay premios configurados
            </div>
          ) : (
            prizes.map((prize) => (
              <div key={prize.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <GiftIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {prize.product_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Costo: S/{prize.product_cost.toFixed(2)} • {prize.points_required} puntos
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prize.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {prize.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    onClick={() => handleDeletePrize(prize.id, prize.product_name)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Eliminar premio"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Información */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Solo productos con precio de venta menor a S/12.00 pueden ser premios</li>
          <li>• Los clientes necesitan 6 puntos para canjear un premio</li>
          <li>• Cada compra ≥ S/15.00 otorga 1 punto</li>
          <li>• Los referidos válidos otorgan 1 punto al referente</li>
        </ul>
      </div>

      {/* Modal Agregar Premio */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Agregar Nuevo Premio</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Producto
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar producto...</option>
                  {eligibleProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - S/{product.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <strong>Puntos requeridos:</strong> 6 puntos
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Precio del producto:</strong> S/{
                      eligibleProducts.find(p => p.id === selectedProduct)?.price.toFixed(2)
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedProduct('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePrize}
                disabled={!selectedProduct || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Premio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}