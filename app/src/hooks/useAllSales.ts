'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, limit, startAfter, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { Sale } from '@/types/sale'

export function useAllSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [firebaseUser] = useAuthState(auth)
  const pageSize = 10

  const fetchSales = async (page: number = 1) => {
    setLoading(true)
    try {
      let q = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      )

      if (page > 1) {
        const previousQuery = query(
          collection(db, 'sales'),
          orderBy('createdAt', 'desc'),
          limit((page - 1) * pageSize)
        )
        const previousDocs = await getDocs(previousQuery)
        const lastDoc = previousDocs.docs[previousDocs.docs.length - 1]
        if (lastDoc) {
          q = query(
            collection(db, 'sales'),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(pageSize)
          )
        }
      }

      const snapshot = await getDocs(q)
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Sale[]

      setSales(salesData)
      setHasMore(salesData.length === pageSize)
      setCurrentPage(page)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales(1)
  }, [])

  const deleteSale = async (id: string) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')
    await deleteDoc(doc(db, 'sales', id))
    fetchSales(currentPage)
  }

  const updateSale = async (id: string, updates: Partial<Sale>) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')
    
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )

    await updateDoc(doc(db, 'sales', id), {
      ...cleanUpdates,
      updatedAt: new Date(),
      lastModifiedBy: firebaseUser.uid
    })
    
    fetchSales(currentPage)
  }

  const goToPage = (page: number) => {
    fetchSales(page)
  }

  return {
    sales,
    loading,
    currentPage,
    hasMore,
    deleteSale,
    updateSale,
    goToPage,
    refresh: () => fetchSales(currentPage)
  }
}