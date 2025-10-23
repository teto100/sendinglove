'use client'

import { useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { useCachedData } from './useCachedData'
import { VersionManager } from '@/utils/versionManager'
import { useAccounts } from './useAccounts'

export function useExpenses() {
  const { data: expenses, loading, refresh, forceRefresh } = useCachedData<any>('expenses', 'createdAt', 'desc')
  const [operationLoading, setOperationLoading] = useState(false)
  const [firebaseUser] = useAuthState(auth)
  const { processExpense } = useAccounts()

  const createExpense = async (expenseData: any) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        createdAt: new Date(),
        createdBy: firebaseUser.uid,
        createdByName: firebaseUser.email || 'Usuario',
        updatedAt: new Date(),
        updatedBy: firebaseUser.uid,
        updatedByName: firebaseUser.email || 'Usuario'
      })
      
      // Procesar pago en cuentas
      if (expenseData.paymentMethod) {
        await processExpense(
          expenseData.paymentMethod,
          expenseData.amount,
          `Gasto: ${expenseData.type || expenseData.description || 'Sin descripción'}`,
          docRef.id
        )
      }
      
      await VersionManager.updateVersion('expenses')
      return { success: true, id: docRef.id }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const updateExpense = async (id: string, updates: any) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      await updateDoc(doc(db, 'expenses', id), {
        ...updates,
        updatedAt: new Date(),
        updatedBy: firebaseUser.uid,
        updatedByName: firebaseUser.email || 'Usuario'
      })
      await VersionManager.updateVersion('expenses')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      await deleteDoc(doc(db, 'expenses', id))
      await VersionManager.updateVersion('expenses')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const forceRefreshFromFirebase = async () => {
    localStorage.removeItem('expenses_cache')
    localStorage.removeItem('expenses_version')
    await forceRefresh()
  }

  return { expenses, loading: loading || operationLoading, createExpense, updateExpense, deleteExpense, refresh, forceRefreshFromFirebase }
}