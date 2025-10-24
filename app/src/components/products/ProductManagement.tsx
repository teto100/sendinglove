'use client'

import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { CreateProductData } from '@/types/product'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PermissionButton from '@/components/ui/PermissionButton'
import LoadingModal from '@/components/ui/LoadingModal'
import { useActivityLogger } from '@/hooks/useActivityLogger'
import ProductImage from '@/components/ui/ProductImage'

export default function ProductManagement() {
  const { products, loading, createProduct, updateProduct, deleteProduct, forceRefreshFromFirebase } = useProducts()
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories()
  const { logActivity } = useActivityLogger()
  const [showForm, setShowForm] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    price: 0,
    sku: '', // Se autogenera, no se usa
    categoryId: ''
  })
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editCategoryData, setEditCategoryData] = useState({ name: '', description: '' })
  const [showEditForm, setShowEditForm] = useState(false)
  const [editProductData, setEditProductData] = useState({ id: '', name: '', description: '', price: 0, categoryId: '', currentImageUrl: '', imageFile: null as File | null })
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<{ success: number, errors: string[] } | null>(null)



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOperationLoading(true)
    
    const result = await createProduct(formData)
    
    setOperationLoading(false)
    if (result.success) {
      await logActivity({
        type: 'product_created',
        description: `Producto creado: ${formData.name}`,
        metadata: { sku: result.sku, price: formData.price }
      })
      setShowForm(false)
      setFormData({ name: '', description: '', price: 0, sku: '', categoryId: '' })
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    setOperationLoading(true)
    const result = await updateProduct(productId, { active: !currentStatus })
    if (result.success) {
      const product = products.find(p => p.id === productId)
      await logActivity({
        type: 'product_updated',
        description: `Producto ${!currentStatus ? 'activado' : 'desactivado'}: ${product?.name}`,
        metadata: { productId, newStatus: !currentStatus }
      })
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
    setOperationLoading(false)
  }

  const handleEditProduct = (product: any) => {
    setEditProductData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
      currentImageUrl: product.imageUrl || '',
      imageFile: null
    })
    setShowEditForm(true)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setOperationLoading(true)
    
    let updateData: any = {
      name: editProductData.name,
      description: editProductData.description,
      price: editProductData.price,
      categoryId: editProductData.categoryId
    }
    
    // Si hay nueva imagen, usar nombre de archivo local
    if (editProductData.imageFile) {
      const fileName = editProductData.imageFile.name
      updateData.imageUrl = `/images/products/${fileName}`
    }
    
    const result = await updateProduct(editProductData.id, updateData)
    setOperationLoading(false)
    if (result.success) {
      setShowEditForm(false)
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (confirm(`¿Eliminar producto ${productName}?`)) {
      setOperationLoading(true)
      const result = await deleteProduct(productId)
      setOperationLoading(false)
      if (result.success) {
        window.location.reload()
      } else {
        alert('Error: ' + result.error)
      }
    }
  }

  const handleCsvImport = async () => {
    if (!csvFile) return
    
    setOperationLoading(true)
    const text = await csvFile.text()
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',')
    
    let success = 0
    const errors: string[] = []
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',')
        const productData = {
          name: values[0]?.trim(),
          description: values[1]?.trim() || '',
          price: parseFloat(values[2]?.trim() || '0'),
          categoryId: categories.find(c => c.name === values[3]?.trim())?.id || categories[0]?.id || '',
          imageName: values[4]?.trim() || 'default.svg'
        }
        
        if (!productData.name || productData.price <= 0) {
          errors.push(`Línea ${i + 1}: "${values[0]?.trim() || 'Sin nombre'}" - Datos inválidos (nombre vacío o precio ≤ 0)`)
          continue
        }
        
        const result = await createProduct(productData)
        if (result.success) {
          success++
        } else {
          errors.push(`Línea ${i + 1}: "${productData.name}" - ${result.error}`)
        }
      } catch (error) {
        errors.push(`Línea ${i + 1}: "${values[0]?.trim() || 'Sin nombre'}" - Error procesando datos`)
      }
    }
    
    setImportResults({ success, errors })
    setOperationLoading(false)
  }

  return (
    <ProtectedRoute module="products">
      <div className="min-h-screen bg-gray-50">
        <Header />
        <LoadingModal isOpen={loading} message="Cargando productos..." />
        <LoadingModal isOpen={operationLoading} message="Procesando..." />
        
        <div className="p-3 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 lg:mb-6 gap-3 lg:gap-0">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Gestión de Productos</h1>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={forceRefreshFromFirebase}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                🔄 Forzar Actualización
              </button>
              <button
                onClick={() => {
                  const csvContent = [
                    'Nombre',
                    ...products.map(product => `"${product.name}"`)
                  ].join('\n')
                  
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                  const link = document.createElement('a')
                  link.href = URL.createObjectURL(blob)
                  link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`
                  link.click()
                }}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
              >
                📥 Exportar CSV
              </button>
              <PermissionButton
                module="products"
                permission="create"
                onClick={() => setShowCategoryForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Nueva Categoría
              </PermissionButton>
              <PermissionButton
                module="products"
                permission="create"
                onClick={() => setShowCsvImport(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Importar CSV
              </PermissionButton>
              <PermissionButton
                module="products"
                permission="create"
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Nuevo Producto
              </PermissionButton>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Crear Producto</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({...formData, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <div className="p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                      Se generará automáticamente al crear el producto
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({...formData, imageFile: e.target.files?.[0]})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-blue-400 cursor-not-allowed scale-95'
                          : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                      } text-white`}
                    >
                      {operationLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando...
                        </div>
                      ) : (
                        'Crear'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400 active:scale-95'
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showCategoryForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4 shadow-xl">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Nueva Categoría</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setOperationLoading(true)
                  const result = await createCategory(categoryName, categoryDescription)
                  setOperationLoading(false)
                  if (result.success) {
                    setShowCategoryForm(false)
                    setCategoryName('')
                    setCategoryDescription('')
                    window.location.reload()
                  } else {
                    alert('Error: ' + result.error)
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Categoría</label>
                    <input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                    <textarea
                      value={categoryDescription}
                      onChange={(e) => setCategoryDescription(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      rows={3}
                      placeholder="Descripción de la categoría..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-green-400 cursor-not-allowed scale-95'
                          : 'bg-green-600 hover:bg-green-700 active:scale-95'
                      } text-white`}
                    >
                      {operationLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando...
                        </div>
                      ) : (
                        'Crear'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400 active:scale-95'
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showEditForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Editar Producto</h2>
                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editProductData.name}
                      onChange={(e) => setEditProductData({...editProductData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={editProductData.description}
                      onChange={(e) => setEditProductData({...editProductData, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editProductData.price || ''}
                      onChange={(e) => setEditProductData({...editProductData, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      value={editProductData.categoryId}
                      onChange={(e) => setEditProductData({...editProductData, categoryId: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                    <div className="mb-2">
                      <ProductImage
                        src={editProductData.currentImageUrl}
                        alt="Imagen actual"
                        width={80}
                        height={80}
                        className="h-20 w-20 object-cover rounded-md border"
                      />
                      <p className="text-xs text-gray-500 mt-1">Imagen actual</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditProductData({...editProductData, imageFile: e.target.files?.[0] || null})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">Selecciona una nueva imagen para reemplazar la actual (opcional)</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-blue-400 cursor-not-allowed scale-95'
                          : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                      } text-white`}
                    >
                      {operationLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Actualizando...
                        </div>
                      ) : (
                        'Actualizar'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400 active:scale-95'
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showCsvImport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">Importar Productos desde CSV</h2>
                
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Formato del CSV:</h3>
                  <p className="text-sm text-blue-700 mb-2">nombre,descripcion,precio,categoria,imagen</p>
                  <p className="text-xs text-blue-600">Ejemplo: Hamburguesa,Deliciosa hamburguesa,15.50,Comidas,hamburguesa.jpg</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Archivo CSV</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                    />
                  </div>
                  
                  {importResults && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Resultados de Importación:</h4>
                      <p className="text-green-600">✅ {importResults.success} productos importados</p>
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
                      disabled={!csvFile || operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        !csvFile || operationLoading
                          ? 'bg-purple-400 cursor-not-allowed scale-95'
                          : 'bg-purple-600 hover:bg-purple-700 active:scale-95'
                      } text-white`}
                    >
                      {operationLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Importando...
                        </div>
                      ) : (
                        'Importar'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCsvImport(false)
                        setCsvFile(null)
                        setImportResults(null)
                      }}
                      disabled={operationLoading}
                      className={`flex-1 py-2 rounded-md transition-all duration-200 transform ${
                        operationLoading
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400 active:scale-95'
                      }`}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
            {/* Mobile Cards */}
            <div className="block lg:hidden">
              {products.map((product) => (
                <div key={product.id} className="border-b border-gray-100 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      width={60}
                      height={60}
                      className="h-15 w-15 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{product.name}</div>
                      <div className="text-sm text-gray-500 truncate">{product.description}</div>
                      <div className="text-lg font-bold text-green-600 mt-1">S/ {product.price.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{product.sku}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <PermissionButton
                      module="products"
                      permission="update"
                      onClick={() => handleEditProduct(product)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 touch-manipulation active:scale-95"
                    >
                      Editar
                    </PermissionButton>
                    <PermissionButton
                      module="products"
                      permission="update"
                      onClick={() => toggleProductStatus(product.id, product.active)}
                      className={`px-3 py-2 rounded-lg text-xs touch-manipulation active:scale-95 ${
                        product.active 
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {product.active ? 'Desactivar' : 'Activar'}
                    </PermissionButton>
                    <PermissionButton
                      module="products"
                      permission="delete"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 touch-manipulation active:scale-95"
                    >
                      Eliminar
                    </PermissionButton>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table */}
            <table className="hidden lg:table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">S/ {product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Sin categoría'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-1">
                        <PermissionButton
                          module="products"
                          permission="update"
                          onClick={() => handleEditProduct(product)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >
                          Editar
                        </PermissionButton>
                        <PermissionButton
                          module="products"
                          permission="update"
                          onClick={() => toggleProductStatus(product.id, product.active)}
                          className={`px-2 py-1 rounded text-xs ${
                            product.active 
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {product.active ? 'Desactivar' : 'Activar'}
                        </PermissionButton>
                        <PermissionButton
                          module="products"
                          permission="delete"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          Eliminar
                        </PermissionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Gestión de Categorías</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Creación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategory === category.id ? (
                        <input
                          type="text"
                          value={editCategoryData.name}
                          onChange={(e) => setEditCategoryData({...editCategoryData, name: e.target.value})}
                          className="text-sm border border-gray-300 rounded px-2 py-1 w-full bg-white text-gray-900 focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategory === category.id ? (
                        <input
                          type="text"
                          value={editCategoryData.description}
                          onChange={(e) => setEditCategoryData({...editCategoryData, description: e.target.value})}
                          className="text-sm border border-gray-300 rounded px-2 py-1 w-full bg-white text-gray-900 focus:ring-1 focus:ring-blue-500"
                          placeholder="Descripción opcional"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{category.description || 'Sin descripción'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {category.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.createdAt instanceof Date 
                        ? category.createdAt.toLocaleDateString()
                        : new Date(category.createdAt).toLocaleDateString()
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingCategory === category.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={async () => {
                              setOperationLoading(true)
                              const result = await updateCategory(category.id, editCategoryData)
                              setOperationLoading(false)
                              if (result.success) {
                                setEditingCategory(null)
                                window.location.reload()
                              } else {
                                alert('Error: ' + result.error)
                              }
                            }}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <PermissionButton
                            module="products"
                            permission="update"
                            onClick={() => {
                              setEditingCategory(category.id)
                              setEditCategoryData({ name: category.name, description: category.description || '' })
                            }}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                          >
                            Editar
                          </PermissionButton>
                          <PermissionButton
                            module="products"
                            permission="update"
                            onClick={async () => {
                              setOperationLoading(true)
                              const result = await updateCategory(category.id, { active: !category.active })
                              setOperationLoading(false)
                              if (result.success) {
                                window.location.reload()
                              } else {
                                alert('Error: ' + result.error)
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs ${
                              category.active 
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {category.active ? 'Desactivar' : 'Activar'}
                          </PermissionButton>
                          <PermissionButton
                            module="products"
                            permission="delete"
                            onClick={async () => {
                              if (category.name === 'Otros') {
                                alert('No se puede eliminar la categoría "Otros"')
                                return
                              }
                              if (confirm(`¿Está seguro de eliminar la categoría "${category.name}"? Los productos asociados se moverán a la categoría "Otros".`)) {
                                setOperationLoading(true)
                                const result = await deleteCategory(category.id)
                                setOperationLoading(false)
                                if (result.success) {
                                  window.location.reload()
                                } else {
                                  alert('Error: ' + result.error)
                                }
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs ${
                              category.name === 'Otros' 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            disabled={category.name === 'Otros'}
                          >
                            Eliminar
                          </PermissionButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}