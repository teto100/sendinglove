'use client'

import { useState } from 'react'
import { useIngredients } from '@/hooks/useIngredients'
import { Ingredient, IngredientCategory, MeasureUnit, UNIT_CONVERSIONS } from '@/types/kitchen'
import LoadingModal from '@/components/ui/LoadingModal'

export default function IngredientsList() {
  const { ingredients, loading, addIngredient, updateIngredient, deleteIngredient } = useIngredients()
  const [showForm, setShowForm] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<IngredientCategory | ''>('')

  const [formData, setFormData] = useState({
    name: '',
    category: 'otros' as IngredientCategory,
    measureUnit: 'gr' as MeasureUnit,
    totalCost: 0,
    measure: 0
  })

  const categories: IngredientCategory[] = ['carnes', 'lacteos', 'saborizantes', 'harinas', 'otros']
  const units: MeasureUnit[] = ['kg', 'gr', 'lt', 'ml', 'und', 'balon', 'min', 'hr']

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || ingredient.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingIngredient) {
      await updateIngredient(editingIngredient.id, formData)
    } else {
      await addIngredient(formData)
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'otros',
      measureUnit: 'gr',
      totalCost: 0,
      measure: 0
    })
    setEditingIngredient(null)
    setShowForm(false)
  }

  const handleEdit = (ingredient: Ingredient) => {
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      measureUnit: ingredient.measureUnit,
      totalCost: ingredient.totalCost,
      measure: ingredient.measure
    })
    setEditingIngredient(ingredient)
    setShowForm(true)
  }

  if (loading) {
    return <LoadingModal isOpen={true} message="Cargando insumos..." />
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg flex-1"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as IngredientCategory | '')}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Agregar Insumo
          </button>
        </div>
      </div>

      {/* Lista de insumos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Unitario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIngredients.map((ingredient) => (
                <tr key={ingredient.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{ingredient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ingredient.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ingredient.measure} {ingredient.measureUnit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">S/ {ingredient.totalCost.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">S/ {ingredient.unitCost.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    S/ {ingredient.baseUnitCost?.toFixed(4) || '0.0000'} / {ingredient.baseUnit || 'und'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleEdit(ingredient)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteIngredient(ingredient.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingIngredient ? 'Editar Insumo' : 'Agregar Insumo'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Nombre del insumo"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Ej: Harina Preparada, Leche Condensada, Gas</p>
              </div>
              
              <div>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as IngredientCategory})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Selecciona la categoría que mejor describa el insumo</p>
              </div>
              
              <div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Medida"
                    value={formData.measure || ''}
                    onChange={(e) => setFormData({...formData, measure: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                    className="flex-1 px-4 py-2 border rounded-lg"
                    required
                  />
                  <select
                    value={formData.measureUnit}
                    onChange={(e) => setFormData({...formData, measureUnit: e.target.value as MeasureUnit})}
                    className="px-4 py-2 border rounded-lg"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Ej: 1 kg, 393 gr, 1 lt, 30 und, 1 balón</p>
              </div>
              
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Costo total (S/)"
                  value={formData.totalCost || ''}
                  onChange={(e) => setFormData({...formData, totalCost: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Precio que pagaste por toda la cantidad. Ej: S/ 6.79, S/ 117.00</p>
                {formData.measure > 0 && formData.totalCost > 0 && (
                  <div className="text-xs text-green-600 mt-1 space-y-1">
                    <p>Costo unitario: S/ {(formData.totalCost / formData.measure).toFixed(2)} por {formData.measureUnit}</p>
                    <p>Costo base: S/ {(formData.totalCost / (formData.measure * (UNIT_CONVERSIONS[formData.measureUnit]?.factor || 1))).toFixed(4)} por {UNIT_CONVERSIONS[formData.measureUnit]?.baseUnit || formData.measureUnit}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {editingIngredient ? 'Actualizar' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}