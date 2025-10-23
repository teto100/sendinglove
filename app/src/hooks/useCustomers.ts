'use client'

import { useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { Customer, CreateCustomerData } from '@/types/customer'
import { useCachedData } from './useCachedData'
import { VersionManager } from '@/utils/versionManager'

export function useCustomers() {
  const { data: customers, loading, refresh } = useCachedData<Customer>('customers', 'name')
  const [operationLoading, setOperationLoading] = useState(false)
  const [firebaseUser] = useAuthState(auth)

  const createCustomer = async (customerData: CreateCustomerData): Promise<string> => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      await VersionManager.updateVersion('customers')
      return docRef.id
    } finally {
      setOperationLoading(false)
    }
  }

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    try {
      setOperationLoading(true)
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      )

      await updateDoc(doc(db, 'customers', id), {
        ...cleanUpdates,
        updatedAt: new Date()
      })
      await VersionManager.updateVersion('customers')
    } finally {
      setOperationLoading(false)
    }
  }

  const deleteCustomer = async (id: string) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')
    
    try {
      setOperationLoading(true)
      await deleteDoc(doc(db, 'customers', id))
      await VersionManager.updateVersion('customers')
    } finally {
      setOperationLoading(false)
    }
  }

  const searchCustomers = async (searchTerm: string): Promise<Customer[]> => {
    if (!searchTerm.trim()) return []
    
    // Search by name
    const nameQuery = query(
      collection(db, 'customers'),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      orderBy('name', 'asc')
    )
    
    // Search by phone
    const phoneQuery = query(
      collection(db, 'customers'),
      where('phone', '>=', searchTerm),
      where('phone', '<=', searchTerm + '\uf8ff'),
      orderBy('phone', 'asc')
    )
    
    const [nameSnapshot, phoneSnapshot] = await Promise.all([
      getDocs(nameQuery),
      getDocs(phoneQuery)
    ])
    
    const nameResults = nameSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Customer[]
    
    const phoneResults = phoneSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Customer[]
    
    // Combine and deduplicate results
    const allResults = [...nameResults, ...phoneResults]
    const uniqueResults = allResults.filter((customer, index, self) => 
      index === self.findIndex(c => c.id === customer.id)
    )
    
    return uniqueResults
  }

  return {
    customers,
    loading: loading || operationLoading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    refresh
  }
}