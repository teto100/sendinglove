'use client'

import { useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { useCachedData } from './useCachedData'
import { VersionManager } from '@/utils/versionManager'
import { useAccounts } from './useAccounts'

export function usePurchases() {
  const { data: purchases, loading, refresh, forceRefresh } = useCachedData<any>('purchases', 'createdAt', 'desc')
  const [operationLoading, setOperationLoading] = useState(false)
  const [firebaseUser] = useAuthState(auth)
  const { processPurchase } = useAccounts()

  const createPurchase = async (purchaseData: any) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      const totalAmount = purchaseData.quantity * purchaseData.unitCost
      const docRef = await addDoc(collection(db, 'purchases'), {
        ...purchaseData,
        totalAmount,
        createdAt: new Date(),
        createdBy: firebaseUser.uid,
        createdByName: firebaseUser.email || 'Usuario',
        updatedAt: new Date(),
        updatedBy: firebaseUser.uid,
        updatedByName: firebaseUser.email || 'Usuario'
      })
      
      // Procesar pago en cuentas
      if (purchaseData.paymentMethod) {
        await processPurchase(
          purchaseData.paymentMethod,
          totalAmount,
          `Compra: ${purchaseData.productName}`,
          docRef.id
        )
      }
      
      await VersionManager.updateVersion('purchases')
      return { success: true, id: docRef.id }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const updatePurchase = async (id: string, updates: any) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      await updateDoc(doc(db, 'purchases', id), {
        ...updates,
        updatedAt: new Date(),
        updatedBy: firebaseUser.uid,
        updatedByName: firebaseUser.email || 'Usuario'
      })
      await VersionManager.updateVersion('purchases')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const deletePurchase = async (id: string) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      await deleteDoc(doc(db, 'purchases', id))
      await VersionManager.updateVersion('purchases')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const forceRefreshFromFirebase = async () => {
    localStorage.removeItem('purchases_cache')
    localStorage.removeItem('purchases_version')
    await forceRefresh()
  }

  return { purchases, loading: loading || operationLoading, createPurchase, updatePurchase, deletePurchase, refresh, forceRefreshFromFirebase }
}