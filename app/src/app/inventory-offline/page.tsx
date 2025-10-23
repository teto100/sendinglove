'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ProductImage from '@/components/ui/ProductImage'

export default function InventoryOffline() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadCachedProducts()
  }, [])

  const loadCachedProducts = () => {
    try {
      const cachedProducts = JSON.parse(localStorage.getItem('cached_products') || '[]')
      setProducts(cachedProducts)
      
      // Extraer categorías únicas
      const uniqueCategories = [...new Set(cachedProducts.map((p: any) => p.category).filter(Boolean))]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error loading cached products:', error)
    }
  }

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getStockStatus = (product: any) => {
    if (product.stock <= 0) return { status: 'Sin stock', color: 'bg-red-100 text-red-800' }
    if (product.stock <= (product.minStock || 5)) return { status: 'Stock bajo', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'En stock', color: 'bg-green-100 text-green-800' }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Inventario (Offline)</h1>
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Sin conexión</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">ℹ️</span>
              <span className="text-yellow-800 font-medium">Datos en Caché</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Los datos de inventario mostrados son del último estado sincronizado. Se actualizarán al recuperar conexión.
            </p>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar producto
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar por nombre o SKU..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por categoría
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category: string) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de productos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product: any) => {
                    const stockStatus = getStockStatus(product)
                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex-shrink-0">
                              <ProductImage
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500">{product.description.substring(0, 50)}...</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {product.category || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="font-medium">{product.stock || 0}</span>
                            {product.minStock && (
                              <span className="ml-2 text-xs text-gray-500">
                                (Min: {product.minStock})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          S/ {product.price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl">📦</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || categoryFilter ? 'No se encontraron productos' : 'No hay productos en caché'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || categoryFilter 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Conecta a internet para cargar el inventario.'
                }
              </p>
            </div>
          )}

          {/* Resumen de inventario */}
          {products.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Total Productos</p>
                  <p className="text-2xl font-bold text-blue-800">{products.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">En Stock</p>
                  <p className="text-2xl font-bold text-green-800">
                    {products.filter((p: any) => p.stock > (p.minStock || 5)).length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {products.filter((p: any) => p.stock > 0 && p.stock <= (p.minStock || 5)).length}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Sin Stock</p>
                  <p className="text-2xl font-bold text-red-800">
                    {products.filter((p: any) => p.stock <= 0).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}