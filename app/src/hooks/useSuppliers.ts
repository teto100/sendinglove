'use client'

import { useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Supplier, CreateSupplierData } from '@/types/supplier'
import { useCachedData } from './useCachedData'
import { VersionManager } from '@/utils/versionManager'

export function useSuppliers() {
  const { data: suppliers, loading, refresh } = useCachedData<Supplier>('suppliers', 'name')
  const [operationLoading, setOperationLoading] = useState(false)

  const createSupplier = async (supplierData: CreateSupplierData) => {
    try {
      setOperationLoading(true)
      await addDoc(collection(db, 'suppliers'), {
        ...supplierData,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      await VersionManager.updateVersion('suppliers')
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
      await VersionManager.updateVersion('suppliers')
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
      await VersionManager.updateVersion('suppliers')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
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