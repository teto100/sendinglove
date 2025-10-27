'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Recipe } from '@/types/kitchen'

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'recipes'), orderBy('productName'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recipesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Recipe[]
      
      setRecipes(recipesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addDoc(collection(db, 'recipes'), {
      ...recipe,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  const updateRecipe = async (id: string, recipe: Partial<Recipe>) => {
    await updateDoc(doc(db, 'recipes', id), {
      ...recipe,
      updatedAt: new Date()
    })
  }

  const deleteRecipe = async (id: string) => {
    await deleteDoc(doc(db, 'recipes', id))
  }

  return {
    recipes,
    loading,
    addRecipe,
    updateRecipe,
    deleteRecipe
  }
}