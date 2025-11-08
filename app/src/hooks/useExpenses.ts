'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, getDocs, DocumentSnapshot } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { useAccounts } from './useAccounts'

export function useExpenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<{ [page: number]: DocumentSnapshot | null }>({})
  const [firebaseUser] = useAuthState(auth)
  const { processExpense } = useAccounts()
  const pageSize = 30

  const fetchExpenses = async (page: number = 1) => {
    setLoading(true)
    try {
      let q = query(
        collection(db, 'expenses'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      )

      if (page > 1) {
        const cursor = cursors[page - 1]
        if (cursor) {
          q = query(
            collection(db, 'expenses'),
            orderBy('createdAt', 'desc'),
            startAfter(cursor),
            limit(pageSize)
          )
        }
      }

      const snapshot = await getDocs(q)
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        paymentDate: doc.data().paymentDate?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate() || new Date()
      }))
      
      setExpenses(expensesData)
      setHasMore(expensesData.length === pageSize)
      setCurrentPage(page)
      
      if (expensesData.length > 0) {
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
      fetchExpenses(1)
    }
  }, [firebaseUser])

  const createExpense = async (expenseData: any) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      const now = new Date()
      
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        createdAt: now,
        createdBy: firebaseUser.uid,
        createdByName: firebaseUser.email || 'Usuario',
        updatedAt: now,
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
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const goToPage = (page: number) => {
    fetchExpenses(page)
  }

  const refresh = () => {
    fetchExpenses(currentPage)
  }

  return { expenses, loading: loading || operationLoading, currentPage, hasMore, createExpense, updateExpense, deleteExpense, goToPage, refresh }
}