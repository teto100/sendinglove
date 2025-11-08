'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, getDocs, DocumentSnapshot } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { useAccounts } from './useAccounts'

export function usePurchases() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<{ [page: number]: DocumentSnapshot | null }>({})
  const [firebaseUser] = useAuthState(auth)
  const { processPurchase } = useAccounts()
  const pageSize = 30

  const fetchPurchases = async (page: number = 1) => {
    setLoading(true)
    try {
      let q = query(
        collection(db, 'purchases'),
        orderBy('purchaseDate', 'desc'),
        limit(pageSize)
      )

      if (page > 1) {
        const cursor = cursors[page - 1]
        if (cursor) {
          q = query(
            collection(db, 'purchases'),
            orderBy('purchaseDate', 'desc'),
            startAfter(cursor),
            limit(pageSize)
          )
        }
      }

      const snapshot = await getDocs(q)
      const purchasesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        purchaseDate: doc.data().purchaseDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }))
      
      setPurchases(purchasesData)
      setHasMore(purchasesData.length === pageSize)
      setCurrentPage(page)
      
      if (purchasesData.length > 0) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1]
        setCursors(prev => ({ ...prev, [page]: lastDoc }))
      }
      
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (firebaseUser) {
      fetchPurchases(1)
    }
  }, [firebaseUser])

  const createPurchase = async (purchaseData: any) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      const totalAmount = purchaseData.quantity * purchaseData.unitCost
      const docRef = await addDoc(collection(db, 'purchases'), {
        ...purchaseData,
        totalAmount,
        createdAt: purchaseData.purchaseDate || new Date(),
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
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        updatedBy: firebaseUser.uid,
        updatedByName: firebaseUser.email || 'Usuario'
      }
      
      // Si se actualiza la fecha de compra, también actualizar createdAt para mantener consistencia
      if (updates.purchaseDate) {
        updateData.createdAt = updates.purchaseDate
      }
      
      await updateDoc(doc(db, 'purchases', id), updateData)
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
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }



  const goToPage = (page: number) => {
    fetchPurchases(page)
  }

  const refresh = () => {
    fetchPurchases(currentPage)
  }

  return { purchases, loading: loading || operationLoading, currentPage, hasMore, createPurchase, updatePurchase, deletePurchase, goToPage, refresh }
}