'use client'

import { useState, useEffect } from 'react'
import { useRecipes } from '@/hooks/useRecipes'
import { useIngredients } from '@/hooks/useIngredients'
import { useProducts } from '@/hooks/useProducts'
import { Recipe, RecipeIngredient } from '@/types/kitchen'
import LoadingModal from '@/components/ui/LoadingModal'

export default function RecipesList() {
  const { recipes, loading, addRecipe, updateRecipe, deleteRecipe } = useRecipes()
  const { ingredients } = useIngredients()
  const { products } = useProducts()
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    recipeName: '',
    productName: '',
    productId: '',
    ingredients: [] as RecipeIngredient[],
    isMultipleUnits: false,
    units: 1
  })

  const [newIngredient, setNewIngredient] = useState({
    ingredientId: '',
    quantity: 0,
    comment: ''
  })

  const filteredRecipes = recipes.filter(recipe =>
    (recipe.recipeName || recipe.productName).toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const totalCost = formData.ingredients.reduce((sum, ing) => sum + ing.totalCost, 0)
    const units = formData.isMultipleUnits ? formData.units : 1
    const unitCost = totalCost / units
    
    // Limpiar ingredientes de valores undefined
    const cleanIngredients = formData.ingredients.map(ing => {
      const cleanIng: any = {
        ingredientId: ing.ingredientId,
        ingredientName: ing.ingredientName,
        quantity: ing.quantity,
        unitCost: ing.unitCost,
        totalCost: ing.totalCost
      }
      if (ing.comment) {
        cleanIng.comment = ing.comment
      }
      return cleanIng
    })
    
    const recipeData = {
      ...formData,
      ingredients: cleanIngredients,
      totalCost,
      isMultipleUnits: formData.isMultipleUnits || false,
      units: units || 1,
      unitCost: unitCost || 0
    }
    
    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, recipeData)
    } else {
      await addRecipe(recipeData)
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      recipeName: '',
      productName: '',
      productId: '',
      ingredients: [],
      isMultipleUnits: false,
      units: 1
    })
    setNewIngredient({
      ingredientId: '',
      quantity: 0,
      comment: ''
    })
    setEditingRecipe(null)
    setShowForm(false)
  }

  const handleEdit = (recipe: Recipe) => {
    setFormData({
      recipeName: recipe.recipeName || recipe.productName,
      productName: recipe.productName,
      productId: recipe.productId,
      ingredients: recipe.ingredients,
      isMultipleUnits: recipe.isMultipleUnits || false,
      units: recipe.units || 1
    })
    setEditingRecipe(recipe)
    setShowForm(true)
  }

  const addIngredientToRecipe = () => {
    const ingredient = ingredients.find(ing => ing.id === newIngredient.ingredientId)
    if (!ingredient || newIngredient.quantity <= 0) return

    const totalCost = ingredient.baseUnitCost * newIngredient.quantity

    const recipeIngredient: RecipeIngredient = {
      ingredientId: ingredient.id,
      ingredientName: `${ingredient.name} (${ingredient.baseUnit})`,
      quantity: newIngredient.quantity,
      unitCost: ingredient.baseUnitCost,
      totalCost,
      comment: newIngredient.comment || undefined
    }

    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, recipeIngredient]
    })

    setNewIngredient({
      ingredientId: '',
      quantity: 0,
      comment: ''
    })
  }

  const removeIngredientFromRecipe = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    })
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setFormData({
      ...formData,
      productId,
      productName: product?.name || '',
      recipeName: formData.recipeName || product?.name || ''
    })
  }

  if (loading) {
    return <LoadingModal isOpen={true} message="Cargando recetas..." />
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <input
            type="text"
            placeholder="Buscar receta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg flex-1"
          />
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Nueva Receta
          </button>
        </div>
      </div>

      {/* Lista de recetas */}
      <div className="grid gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{recipe.recipeName || recipe.productName}</h3>
                <p className="text-sm text-gray-600">Producto: {recipe.productName}</p>
                <p className="text-sm text-gray-600">
                  {recipe.isMultipleUnits ? `Receta para ${recipe.units || 1} unidades` : 'Receta para 1 unidad'}
                </p>
                <p className="text-lg font-semibold text-green-600">
                  Costo Total: S/ {(recipe.totalCost || 0).toFixed(2)}
                </p>
                {recipe.isMultipleUnits && (recipe.units || 1) > 1 && (
                  <p className="text-md font-semibold text-blue-600">
                    Costo por Unidad: S/ {(recipe.unitCost || 0).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(recipe)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteRecipe(recipe.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Ingrediente</th>
                    <th className="text-left py-2">Cantidad</th>
                    <th className="text-left py-2">Costo Unit.</th>
                    <th className="text-left py-2">Costo Total</th>
                    <th className="text-left py-2">Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.ingredients.map((ing, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{ing.ingredientName}</td>
                      <td className="py-2">{ing.quantity}</td>
                      <td className="py-2">S/ {ing.unitCost.toFixed(5)}</td>
                      <td className="py-2">S/ {ing.totalCost.toFixed(2)}</td>
                      <td className="py-2 text-sm text-gray-600">{ing.comment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editingRecipe ? 'Editar Receta' : 'Nueva Receta'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                placeholder="Nombre de la receta"
                value={formData.recipeName}
                onChange={(e) => setFormData({...formData, recipeName: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              
              <select
                value={formData.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Seleccionar producto oficial</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              
              <div className="border p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Tipo de Receta</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!formData.isMultipleUnits}
                      onChange={() => setFormData({...formData, isMultipleUnits: false, units: 1})}
                      className="mr-2"
                    />
                    Receta para 1 unidad
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.isMultipleUnits}
                      onChange={() => setFormData({...formData, isMultipleUnits: true})}
                      className="mr-2"
                    />
                    Receta para varias unidades
                  </label>
                  {formData.isMultipleUnits && (
                    <input
                      type="number"
                      min="1"
                      placeholder="Número de unidades"
                      value={formData.units || ''}
                      onChange={(e) => setFormData({...formData, units: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border rounded-lg mt-2"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Agregar ingredientes */}
              <div className="border p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Agregar Ingrediente</h4>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={newIngredient.ingredientId}
                      onChange={(e) => setNewIngredient({...newIngredient, ingredientId: e.target.value})}
                      className="flex-1 px-4 py-2 border rounded-lg"
                    >
                      <option value="">Seleccionar ingrediente</option>
                      {ingredients.map(ingredient => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} - usar en {ingredient.baseUnit}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`Cantidad ${ingredients.find(ing => ing.id === newIngredient.ingredientId)?.baseUnit || ''}`}
                      value={newIngredient.quantity || ''}
                      onChange={(e) => setNewIngredient({...newIngredient, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                      className="w-32 px-4 py-2 border rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={addIngredientToRecipe}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Agregar
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Comentario opcional (máx. 100 caracteres)"
                    value={newIngredient.comment}
                    onChange={(e) => setNewIngredient({...newIngredient, comment: e.target.value.slice(0, 100)})}
                    className="w-full px-4 py-2 border rounded-lg text-sm"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Lista de ingredientes agregados */}
              {formData.ingredients.length > 0 && (
                <div className="border p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Ingredientes de la Receta</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Ingrediente</th>
                          <th className="text-left py-2">Cantidad</th>
                          <th className="text-left py-2">Costo Unit.</th>
                          <th className="text-left py-2">Costo Total</th>
                          <th className="text-left py-2">Comentario</th>
                          <th className="text-left py-2">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.ingredients.map((ing, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{ing.ingredientName}</td>
                            <td className="py-2">{ing.quantity}</td>
                            <td className="py-2">S/ {ing.unitCost.toFixed(5)}</td>
                            <td className="py-2">S/ {ing.totalCost.toFixed(2)}</td>
                            <td className="py-2 text-sm text-gray-600">{ing.comment || '-'}</td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => removeIngredientFromRecipe(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-right">
                    <p className="text-lg font-semibold">
                      Costo Total: S/ {formData.ingredients.reduce((sum, ing) => sum + ing.totalCost, 0).toFixed(2)}
                    </p>
                    {formData.isMultipleUnits && formData.units > 1 && (
                      <p className="text-md text-green-600">
                        Costo por Unidad: S/ {(formData.ingredients.reduce((sum, ing) => sum + ing.totalCost, 0) / formData.units).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  disabled={formData.ingredients.length === 0}
                >
                  {editingRecipe ? 'Actualizar' : 'Crear'} Receta
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