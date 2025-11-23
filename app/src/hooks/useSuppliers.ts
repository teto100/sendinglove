'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Supplier, CreateSupplierData } from '@/types/supplier'

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'suppliers'), orderBy('name'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const suppliersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[]
      
      setSuppliers(suppliersData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const createSupplier = async (supplierData: CreateSupplierData) => {
    try {
      setOperationLoading(true)
      await addDoc(collection(db, 'suppliers'), {
        ...supplierData,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const updateSupplier = async (supplierId: string, updates: Partial<Supplier>) => {
    try {
      setOperationLoading(true)
      await updateDoc(doc(db, 'suppliers', supplierId), {
        ...updates,
        updatedAt: new Date()
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const deleteSupplier = async (supplierId: string) => {
    try {
      setOperationLoading(true)
      await deleteDoc(doc(db, 'suppliers', supplierId))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const refresh = () => {
    // No needed with real-time updates
  }

  return {
    suppliers,
    loading: loading || operationLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refresh
  }
}