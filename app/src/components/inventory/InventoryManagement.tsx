'use client'

import React, { useState, useEffect } from 'react'
import { useInventory } from '@/hooks/useInventory'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { usePermissions } from '@/hooks/usePermissions'
import { requestNotificationPermission } from '@/lib/notifications'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AlertModal from '@/components/ui/AlertModal'

export default function InventoryManagement() {
  const { inventory, movements, loading, createMovement, updateStockLimits, getLowStockItems } = useInventory()
  const { products } = useProducts()
  const { categories } = useCategories()
  const { hasPermission } = usePermissions()
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth
      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)
    return () => window.removeEventListener('resize', checkDeviceType)
  }, [])
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [movementData, setMovementData] = useState({
    productId: '',
    type: 'entrada' as 'entrada' | 'salida',
    quantity: 0,
    reason: ''
  })
  const [stockLimits, setStockLimits] = useState({ minStock: 0, maxStock: 0 })
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<{show: boolean, title: string, message: string, type: 'success' | 'error' | 'warning' | 'info'}>({show: false, title: '', message: '', type: 'info'})
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<{ success: number, errors: string[] } | null>(null)

  useEffect(() => {
    // Solicitar permisos de notificación al cargar
    const enableNotifications = async () => {
      const token = await requestNotificationPermission()
      setNotificationsEnabled(!!token)
    }
    enableNotifications()
  }, [])

  const lowStockItems = getLowStockItems()

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await createMovement(movementData)
      setShowMovementModal(false)
      setMovementData({ productId: '', type: 'entrada', quantity: 0, reason: '' })
      setAlert({show: true, title: 'Éxito', message: 'Movimiento registrado correctamente', type: 'success'})
    } catch (error: any) {
      setAlert({show: true, title: 'Error', message: error.message, type: 'error'})
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStockLimits = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await updateStockLimits(selectedItem.id, stockLimits.minStock, stockLimits.maxStock)
      setShowStockModal(false)
      setAlert({show: true, title: 'Éxito', message: 'Límites de stock actualizados', type: 'success'})
    } catch (error: any) {
      setAlert({show: true, title: 'Error', message: error.message, type: 'error'})
    } finally {
      setIsSubmitting(false)
    }
  }

  const openStockModal = (item: any) => {
    setSelectedItem(item)
    setStockLimits({ minStock: item.minStock, maxStock: item.maxStock })
    setShowStockModal(true)
  }

  const handleCsvImport = async () => {
    if (!csvFile) return
    
    setIsSubmitting(true)
    const text = await csvFile.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    let success = 0
    const errors: string[] = []
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',')
        const productName = values[0]?.trim()
        const type = values[1]?.trim() as 'entrada' | 'salida'
        const quantity = parseInt(values[2]?.trim() || '0')
        const reason = values[3]?.trim() || 'Importación CSV'
        
        const product = products.find(p => p.name.toLowerCase() === productName?.toLowerCase())
        
        if (!product) {
          errors.push(`Línea ${i + 1}: "${productName}" - Producto no encontrado`)
          continue
        }
        
        if (!type || !['entrada', 'salida'].includes(type)) {
          errors.push(`Línea ${i + 1}: "${productName}" - Tipo inválido (debe ser entrada o salida)`)
          continue
        }
        
        if (quantity <= 0) {
          errors.push(`Línea ${i + 1}: "${productName}" - Cantidad inválida`)
          continue
        }
        
        await createMovement({
          productId: product.id,
          type,
          quantity,
          reason
        })
        
        success++
      } catch (error) {
        errors.push(`Línea ${i + 1}: "${values[0]?.trim() || 'Sin nombre'}" - Error procesando datos`)
      }
    }
    
    setImportResults({ success, errors })
    setIsSubmitting(false)
  }

  return (
    <ProtectedRoute module="inventory">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold" style={{color: '#CF432B'}}>
                Control de Inventario
              </h1>
              <div className="flex gap-2">
                {!notificationsEnabled && (
                  <button
                    onClick={async () => {
                      const token = await requestNotificationPermission()
                      setNotificationsEnabled(!!token)
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                  >
                    🔔 Activar Alertas
                  </button>
                )}
                {hasPermission('inventory', 'create') && (
                  <>
                    {deviceType !== 'mobile' && (
                      <button
                        onClick={() => setShowCsvImport(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Importar CSV
                      </button>
                    )}
                    <button
                      onClick={() => setShowMovementModal(true)}
                      className="px-4 py-2 text-white rounded-lg"
                      style={{backgroundColor: '#CF432B'}}
                    >
                      Registrar Movimiento
                    </button>
                  </>
                )}
              </div>
            </div>



            {/* Tabla de Inventario */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-semibold mb-4">Stock Actual</h2>
                {loading ? (
                  <div className="text-center py-8">Cargando inventario...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                          {deviceType !== 'mobile' && (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Máximo</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventory
                          .filter((item, index, arr) => arr.findIndex(i => i.productId === item.productId) === index)
                          .sort((a, b) => {
                            // Obtener productos y sus categorías
                            const productA = products.find(p => p.id === a.productId)
                            const productB = products.find(p => p.id === b.productId)
                            
                            // Obtener nombres de categorías
                            const categoryA = productA ? categories.find(c => c.id === productA.categoryId)?.name?.toLowerCase() || '' : ''
                            const categoryB = productB ? categories.find(c => c.id === productB.categoryId)?.name?.toLowerCase() || '' : ''
                            
                            // Identificar bebidas calientes por categoría
                            const isHotDrinkA = categoryA.includes('bebida') && categoryA.includes('caliente')
                            const isHotDrinkB = categoryB.includes('bebida') && categoryB.includes('caliente')
                            
                            // Identificar bebidas frías por categoría
                            const isColdDrinkCategoryA = categoryA.includes('bebida') && (categoryA.includes('fría') || categoryA.includes('fria'))
                            const isColdDrinkCategoryB = categoryB.includes('bebida') && (categoryB.includes('fría') || categoryB.includes('fria'))
                            
                            // Productos específicos a excluir de bebidas frías
                            const excludedColdDrinks = ['inca cola', 'fanta', 'coca cola', 'milkshake de fresa', 'milkshake de oreo']
                            const isExcludedColdA = excludedColdDrinks.some(drink => 
                              a.productName.toLowerCase().includes(drink.toLowerCase())
                            )
                            const isExcludedColdB = excludedColdDrinks.some(drink => 
                              b.productName.toLowerCase().includes(drink.toLowerCase())
                            )
                            
                            // Bebidas frías finales (categoría bebida fría pero no excluidas)
                            const isColdDrinkA = isColdDrinkCategoryA && !isExcludedColdA
                            const isColdDrinkB = isColdDrinkCategoryB && !isExcludedColdB
                            
                            // Orden de prioridad:
                            // 1. Otros productos (por stock menor)
                            // 2. Bebidas frías (excluyendo específicas)
                            // 3. Bebidas calientes al final
                            
                            if (isHotDrinkA && !isHotDrinkB) return 1  // A al final
                            if (!isHotDrinkA && isHotDrinkB) return -1 // B al final
                            
                            if (isColdDrinkA && !isColdDrinkB && !isHotDrinkB) return 1  // A después de otros
                            if (!isColdDrinkA && isColdDrinkB && !isHotDrinkA) return -1 // B después de otros
                            
                            // Si están en el mismo grupo, ordenar por stock actual (menor primero)
                            return a.currentStock - b.currentStock
                          })
                          .map((item, index, sortedArray) => {
                            const productA = products.find(p => p.id === item.productId)
                            const categoryA = productA ? categories.find(c => c.id === productA.categoryId)?.name?.toLowerCase() || '' : ''
                            
                            const isHotDrink = categoryA.includes('bebida') && categoryA.includes('caliente')
                            const isColdDrinkCategory = categoryA.includes('bebida') && (categoryA.includes('fría') || categoryA.includes('fria'))
                            const excludedColdDrinks = ['inca cola', 'fanta', 'coca cola', 'milkshake de fresa', 'milkshake de oreo']
                            const isExcludedCold = excludedColdDrinks.some(drink => item.productName.toLowerCase().includes(drink.toLowerCase()))
                            const isColdDrink = isColdDrinkCategory && !isExcludedCold
                            
                            let currentGroup = 'otros'
                            if (isHotDrink) currentGroup = 'calientes'
                            else if (isColdDrink) currentGroup = 'frias'
                            
                            let previousGroup = 'otros'
                            if (index > 0) {
                              const prevItem = sortedArray[index - 1]
                              const prevProduct = products.find(p => p.id === prevItem.productId)
                              const prevCategory = prevProduct ? categories.find(c => c.id === prevProduct.categoryId)?.name?.toLowerCase() || '' : ''
                              
                              const prevIsHotDrink = prevCategory.includes('bebida') && prevCategory.includes('caliente')
                              const prevIsColdDrinkCategory = prevCategory.includes('bebida') && (prevCategory.includes('fría') || prevCategory.includes('fria'))
                              const prevIsExcludedCold = excludedColdDrinks.some(drink => prevItem.productName.toLowerCase().includes(drink.toLowerCase()))
                              const prevIsColdDrink = prevIsColdDrinkCategory && !prevIsExcludedCold
                              
                              if (prevIsHotDrink) previousGroup = 'calientes'
                              else if (prevIsColdDrink) previousGroup = 'frias'
                            }
                            
                            const showSeparator = currentGroup !== previousGroup
                            
                            return (
                              <React.Fragment key={`group-${item.productId}`}>
                                {showSeparator && index > 0 && (
                                  <tr key={`separator-${index}`}>
                                    <td colSpan={deviceType === 'mobile' ? 2 : 5} className="px-6 py-3">
                                      <div className="flex items-center">
                                        <div className="flex-1 border-t-2 border-gray-400"></div>
                                        <span className="px-4 text-sm font-semibold text-gray-600 bg-white">
                                          {currentGroup === 'frias' ? '🧊 Bebidas Frías' : 
                                           currentGroup === 'calientes' ? '☕ Bebidas Calientes' : ''}
                                        </span>
                                        <div className="flex-1 border-t-2 border-gray-400"></div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                                <tr key={item.productId} className={item.currentStock <= item.minStock ? 'bg-red-50' : ''}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.productName}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.currentStock}
                                  </td>
                                  {deviceType !== 'mobile' && (
                                    <>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.minStock}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.maxStock}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {hasPermission('inventory', 'update') && (
                                          <button
                                            onClick={() => openStockModal(item)}
                                            className="text-blue-600 hover:text-blue-900"
                                          >
                                            Configurar
                                          </button>
                                        )}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              </React.Fragment>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de Movimientos */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-semibold mb-4">Historial de Movimientos</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {movements.map((movement) => (
                        <tr key={movement.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{movement.createdAt.toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">{movement.createdAt.toLocaleTimeString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              movement.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {movement.type === 'entrada' ? 'Entrada' : 'Salida'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Movimiento */}
        {showMovementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">Registrar Movimiento</h3>
              <form onSubmit={handleMovement}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Producto</label>
                  <select
                    value={movementData.productId}
                    onChange={(e) => setMovementData({...movementData, productId: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.filter(p => p.active).map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={movementData.type}
                    onChange={(e) => setMovementData({...movementData, type: e.target.value as any})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={movementData.quantity || ''}
                    onChange={(e) => setMovementData({...movementData, quantity: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded"
                    required
                    min="1"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Motivo</label>
                  <input
                    type="text"
                    value={movementData.reason}
                    onChange={(e) => setMovementData({...movementData, reason: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Motivo del movimiento (opcional)"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMovementModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2 rounded text-white ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{backgroundColor: '#CF432B'}}
                  >
                    {isSubmitting ? 'Registrando...' : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Stock Limits */}
        {showStockModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">Configurar Stock - {selectedItem.productName}</h3>
              <form onSubmit={handleStockLimits}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={stockLimits.minStock || ''}
                    onChange={(e) => setStockLimits({...stockLimits, minStock: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded"
                    required
                    min="0"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Stock Máximo</label>
                  <input
                    type="number"
                    value={stockLimits.maxStock || ''}
                    onChange={(e) => setStockLimits({...stockLimits, maxStock: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded"
                    required
                    min="1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2 rounded text-white ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{backgroundColor: '#CF432B'}}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal CSV Import */}
        {showCsvImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4">
              <h2 className="text-xl font-bold mb-6">Importar Movimientos CSV</h2>
              
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Formato del CSV:</h3>
                <p className="text-sm text-blue-700 mb-2">producto,tipo,cantidad,motivo</p>
                <p className="text-xs text-blue-600">Ejemplo: Hamburguesa,entrada,50,Compra almacén</p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded"
                />
                
                {importResults && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-green-600">✅ {importResults.success} movimientos importados</p>
                    {importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-red-600">❌ {importResults.errors.length} errores:</p>
                        <ul className="text-xs text-red-500 mt-1 max-h-32 overflow-y-auto">
                          {importResults.errors.map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCsvImport}
                    disabled={!csvFile || isSubmitting}
                    className="flex-1 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    {isSubmitting ? 'Importando...' : 'Importar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCsvImport(false)
                      setCsvFile(null)
                      setImportResults(null)
                    }}
                    className="flex-1 py-2 bg-gray-300 text-gray-700 rounded"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <AlertModal
          isOpen={alert.show}
          onClose={() => setAlert({...alert, show: false})}
          title={alert.title}
          message={alert.message}
          type={alert.type}
        />
      </div>
    </ProtectedRoute>
  )
}