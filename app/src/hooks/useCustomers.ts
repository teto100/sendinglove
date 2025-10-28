'use client'

import { useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore'
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
      
      // Buscar cliente existente con el mismo nombre (insensible a mayúsculas)
      const existingCustomers = await searchCustomers(customerData.name)
      const existingCustomer = existingCustomers.find(c => 
        c.name.toLowerCase() === customerData.name.toLowerCase()
      )
      
      if (existingCustomer) {
        // Si existe, actualizar teléfono si se proporciona
        if (customerData.phone && customerData.phone !== existingCustomer.phone) {
          await updateCustomer(existingCustomer.id, { phone: customerData.phone })
        }
        return existingCustomer.id
      }
      
      // Si no existe, crear nuevo cliente
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      await VersionManager.updateVersion('customers')
      await refresh()
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
    
    // Obtener todos los clientes y filtrar localmente para búsqueda insensible a mayúsculas
    const allCustomersQuery = query(
      collection(db, 'customers'),
      orderBy('name', 'asc')
    )
    
    const snapshot = await getDocs(allCustomersQuery)
    const allCustomers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Customer[]
    
    // Filtrar localmente con búsqueda insensible a mayúsculas
    const searchTermLower = searchTerm.toLowerCase()
    const filteredResults = allCustomers.filter(customer => 
      customer.name.toLowerCase().includes(searchTermLower) ||
      (customer.phone && customer.phone.includes(searchTerm))
    )
    
    return filteredResults.slice(0, 10) // Limitar a 10 resultados
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