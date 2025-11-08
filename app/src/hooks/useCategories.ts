'use client'

import { useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Category } from '@/types/product'
import { useCachedData } from './useCachedData'


export function useCategories() {
  const { data: categories, loading, refresh } = useCachedData<Category>('categories', 'name')
  const [operationLoading, setOperationLoading] = useState(false)

  const createCategory = async (name: string, description?: string, parentId?: string) => {
    try {
      setOperationLoading(true)
      await addDoc(collection(db, 'categories'), {
        name,
        description: description || '',
        parentId: parentId || null,
        active: true,
        createdAt: new Date()
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
    try {
      setOperationLoading(true)
      await updateDoc(doc(db, 'categories', categoryId), updates)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const createOtrosCategory = async () => {
    try {
      await addDoc(collection(db, 'categories'), {
        name: 'Otros',
        description: 'Categoría por defecto para productos sin categoría específica',
        parentId: null,
        active: true,
        createdAt: new Date()
      })
    } catch (error) {
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      setOperationLoading(true)
      const categoryToDelete = categories.find(cat => cat.id === categoryId)
      
      // No permitir eliminar la categoría "Otros"
      if (categoryToDelete?.name === 'Otros') {
        return { success: false, error: 'No se puede eliminar la categoría "Otros"' }
      }

      // Buscar la categoría "Otros"
      const otrosCategory = categories.find(cat => cat.name === 'Otros')
      if (!otrosCategory) {
        return { success: false, error: 'La categoría "Otros" no existe' }
      }

      // Mover todos los productos de la categoría eliminada a "Otros"
      const productsQuery = query(
        collection(db, 'products'),
        where('categoryId', '==', categoryId)
      )
      const productsSnapshot = await getDocs(productsQuery)
      
      if (!productsSnapshot.empty) {
        const batch = writeBatch(db)
        productsSnapshot.docs.forEach((productDoc) => {
          batch.update(productDoc.ref, {
            categoryId: otrosCategory.id,
            updatedAt: Timestamp.now()
          })
        })
        await batch.commit()
      }

      // Eliminar la categoría
      await deleteDoc(doc(db, 'categories', categoryId))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  return {
    categories,
    loading: loading || operationLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh
  }
}