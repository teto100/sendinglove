'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Ingredient, UNIT_CONVERSIONS } from '@/types/kitchen'

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'ingredients'), orderBy('name'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ingredientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Ingredient[]
      
      setIngredients(ingredientsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const addIngredient = async (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt' | 'baseUnit' | 'baseUnitCost'>) => {
    const unitCost = Math.round((ingredient.totalCost / ingredient.measure) * 100) / 100
    const conversion = UNIT_CONVERSIONS[ingredient.measureUnit]
    const baseUnit = conversion.baseUnit
    const baseQuantity = ingredient.measure * conversion.factor
    const baseUnitCost = Math.round((ingredient.totalCost / baseQuantity) * 10000) / 10000
    
    await addDoc(collection(db, 'ingredients'), {
      ...ingredient,
      unitCost,
      baseUnit,
      baseUnitCost,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  const updateIngredient = async (id: string, ingredient: Partial<Ingredient>) => {
    const updates: any = { ...ingredient, updatedAt: new Date() }
    
    if (ingredient.totalCost && ingredient.measure && ingredient.measureUnit) {
      updates.unitCost = Math.round((ingredient.totalCost / ingredient.measure) * 100) / 100
      const conversion = UNIT_CONVERSIONS[ingredient.measureUnit]
      updates.baseUnit = conversion.baseUnit
      const baseQuantity = ingredient.measure * conversion.factor
      updates.baseUnitCost = Math.round((ingredient.totalCost / baseQuantity) * 10000) / 10000
    }
    
    await updateDoc(doc(db, 'ingredients', id), updates)
  }

  const deleteIngredient = async (id: string) => {
    await deleteDoc(doc(db, 'ingredients', id))
  }

  return {
    ingredients,
    loading,
    addIngredient,
    updateIngredient,
    deleteIngredient
  }
}