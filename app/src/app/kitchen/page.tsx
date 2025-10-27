'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import IngredientsList from '@/components/kitchen/IngredientsList'
import RecipesList from '@/components/kitchen/RecipesList'

export default function KitchenPage() {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'recipes'>('ingredients')

  return (
    <ProtectedRoute module="kitchen">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Módulo de Cocina</h1>
            
            <div className="flex bg-white rounded-lg shadow">
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`px-6 py-2 rounded-l-lg font-medium ${
                  activeTab === 'ingredients'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Insumos
              </button>
              <button
                onClick={() => setActiveTab('recipes')}
                className={`px-6 py-2 rounded-r-lg font-medium ${
                  activeTab === 'recipes'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Preparaciones
              </button>
            </div>
          </div>

          {activeTab === 'ingredients' && <IngredientsList />}
          {activeTab === 'recipes' && <RecipesList />}
        </div>
      </div>
    </ProtectedRoute>
  )
}