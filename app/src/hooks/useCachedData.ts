'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useCachedData<T>(
  collectionName: string,
  orderByField?: string,
  orderDirection?: 'asc' | 'desc'
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = orderByField 
      ? query(collection(db, collectionName), orderBy(orderByField, orderDirection || 'asc'))
      : collection(db, collectionName)
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data()
          const convertedData = { ...data }
          
          // Convertir campos de fecha de Firestore Timestamp a Date
          Object.keys(data).forEach(key => {
            if (data[key]?.toDate && typeof data[key].toDate === 'function') {
              convertedData[key] = data[key].toDate()
            }
          })
          
          return {
            id: doc.id,
            ...convertedData
          }
        }) as T[]
        
        setData(items)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err instanceof Error ? err.message : 'Error loading data')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [collectionName, orderByField, orderDirection])

  const refresh = () => {
    setLoading(true)
    // El useEffect se encargará de recargar los datos
  }

  return {
    data,
    loading,
    error,
    refresh,
    forceRefresh: refresh
  }
}