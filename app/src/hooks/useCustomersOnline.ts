'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { Customer, CreateCustomerData } from '@/types/customer'

export function useCustomersOnline() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState(false)
  const [firebaseUser] = useAuthState(auth)

  // Función para obtener datos en tiempo real desde Firebase
  const fetchCustomers = () => {
    const customersQuery = query(
      collection(db, 'customers'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(customersQuery, (snapshot) => {
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
      setLoading(false)
    }, (error) => {
      console.error('❌ [CUSTOMERS] Error fetching customers:', error)
      setLoading(false)
    })

    return unsubscribe
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
        updatedAt: now,
        _timestamp: Date.now() // Timestamp para evitar cache
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
        updatedAt: getLimaDate(),
        _timestamp: Date.now() // Timestamp para evitar cache
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

  // Función manual de refresh (fuerza nueva consulta)
  const refresh = async () => {
    setLoading(true)
    // Forzar una nueva consulta directa
    try {
      const customersQuery = query(
        collection(db, 'customers'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(customersQuery)
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
      setLoading(false)
    } catch (error) {
      console.error('❌ [CUSTOMERS] Error en refresh:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (firebaseUser) {
      const unsubscribe = fetchCustomers()
      return () => unsubscribe()
    }
  }, [firebaseUser])

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