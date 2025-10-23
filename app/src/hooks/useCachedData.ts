'use client'

import { useState, useEffect, useCallback } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { cacheManager } from '@/lib/cache'

export function useCachedData<T>(
  collectionName: string,
  orderByField?: string,
  orderDirection?: 'asc' | 'desc'
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (): Promise<T[]> => {
    const q = orderByField 
      ? query(collection(db, collectionName), orderBy(orderByField, orderDirection || 'asc'))
      : collection(db, collectionName)
    
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const items = snapshot.docs.map(doc => {
            const data = doc.data()
            const convertedData = { ...data }
            
            // Convertir todos los campos de fecha de Firestore Timestamp a Date
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
          unsubscribe()
          resolve(items)
        },
        (error) => {
          unsubscribe()
          reject(error)
        }
      )
    })
  }, [collectionName, orderByField, orderDirection])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const cachedData = await cacheManager.getVersionedData(
        collectionName,
        fetchData
      )
      
      setData(cachedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [collectionName, fetchData])

  useEffect(() => {
    loadData()

    // Escuchar cambios para invalidar caché (cada 30 segundos)
    const unsubscribe = cacheManager.watchCollection(collectionName, () => {
      loadData()
    })

    return () => {
      cacheManager.stopWatching(collectionName)
    }
  }, [collectionName, loadData])

  const invalidateCache = useCallback(() => {
    cacheManager.invalidateCache(collectionName)
    loadData()
  }, [collectionName, loadData])

  const forceRefresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Limpiar caché y forzar recarga
      cacheManager.invalidateCache(collectionName)
      const freshData = await fetchData()
      setData(freshData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [collectionName, fetchData])

  return {
    data,
    loading,
    error,
    refresh: loadData,
    invalidateCache,
    forceRefresh
  }
}