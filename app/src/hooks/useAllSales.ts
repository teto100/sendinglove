'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, startAfter, getDocs, deleteDoc, doc, updateDoc, DocumentSnapshot } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { Sale } from '@/types/sale'

export function useAllSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<{ [page: number]: DocumentSnapshot | null }>({})
  const [firebaseUser] = useAuthState(auth)
  const pageSize = 30

  const fetchSales = async (page: number = 1) => {
    setLoading(true)
    try {
      let q = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      )

      if (page > 1) {
        const cursor = cursors[page - 1]
        if (cursor) {
          q = query(
            collection(db, 'sales'),
            orderBy('createdAt', 'desc'),
            startAfter(cursor),
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
      
      if (salesData.length > 0) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1]
        setCursors(prev => ({ ...prev, [page]: lastDoc }))
      }
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