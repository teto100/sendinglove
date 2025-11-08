'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { Customer, CreateCustomerData } from '@/types/customer'

export function useCustomersOnline() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<{ [page: number]: DocumentSnapshot | null }>({})
  const [firebaseUser] = useAuthState(auth)
  const pageSize = 30

  const fetchCustomers = async (page: number = 1) => {
    setLoading(true)
    try {
      let q = query(
        collection(db, 'customers'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      )

      if (page > 1) {
        const cursor = cursors[page - 1]
        if (cursor) {
          q = query(
            collection(db, 'customers'),
            orderBy('createdAt', 'desc'),
            startAfter(cursor),
            limit(pageSize)
          )
        }
      }

      const snapshot = await getDocs(q)
      const customersData = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          fecha_habilitacion_premios: data.fecha_habilitacion_premios?.toDate() || data.fecha_habilitacion_premios
        }
      }) as Customer[]
      
      setCustomers(customersData)
      setHasMore(customersData.length === pageSize)
      setCurrentPage(page)
      
      if (customersData.length > 0) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1]
        setCursors(prev => ({ ...prev, [page]: lastDoc }))
      }
      
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

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
      
      // Si no existe, crear nuevo cliente con timestamp actual
      const { getLimaDate } = await import('@/utils/timezone')
      const now = getLimaDate()
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        createdAt: now,
        updatedAt: now
      })
      
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

      const { getLimaDate } = await import('@/utils/timezone')
      await updateDoc(doc(db, 'customers', id), {
        ...cleanUpdates,
        updatedAt: getLimaDate()
      })
    } finally {
      setOperationLoading(false)
    }
  }

  const deleteCustomer = async (id: string) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')
    
    try {
      setOperationLoading(true)
      await deleteDoc(doc(db, 'customers', id))
    } finally {
      setOperationLoading(false)
    }
  }

  const searchCustomers = async (searchTerm: string): Promise<Customer[]> => {
    if (!searchTerm.trim()) return []
    
    // Obtener todos los clientes y filtrar localmente para búsqueda insensible a mayúsculas
    const allCustomersQuery = query(
      collection(db, 'customers'),
      orderBy('createdAt', 'desc')
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

  const goToPage = (page: number) => {
    fetchCustomers(page)
  }

  const refresh = async () => {
    fetchCustomers(currentPage)
  }

  useEffect(() => {
    if (firebaseUser) {
      fetchCustomers(1)
    }
  }, [firebaseUser])

  return {
    customers,
    loading: loading || operationLoading,
    currentPage,
    hasMore,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    goToPage,
    refresh
  }
}