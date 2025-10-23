'use client'

import { collection, doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { cacheStatusManager } from '@/hooks/useCacheStatus'

interface CacheEntry<T> {
  data: T[]
  version: string
  timestamp: number
  ttl: number
}

interface CollectionVersion {
  version: string
  lastModified: Timestamp
}

class CacheManager {
  private cache = new Map<string, any>()
  private versionListeners = new Map<string, () => void>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutos

  async getVersionedData<T>(
    collectionName: string,
    fetchFunction: () => Promise<T[]>
  ): Promise<T[]> {
    const cacheKey = `cache_${collectionName}`
    
    try {
      // Verificar caché local primero
      const cachedEntry = this.getFromLocalStorage<T>(cacheKey)
      
      if (cachedEntry && Date.now() - cachedEntry.timestamp < cachedEntry.ttl) {
        cacheStatusManager.recordCacheHit()
        return cachedEntry.data
      }
      cacheStatusManager.recordFirebaseQuery()
      const freshData = await fetchFunction()
      
      // Guardar en caché con timestamp actual como versión
      const newEntry: CacheEntry<T> = {
        data: freshData,
        version: Date.now().toString(),
        timestamp: Date.now(),
        ttl: this.TTL
      }
      
      this.saveToLocalStorage(cacheKey, newEntry)
      return freshData
      
    } catch (error) {
      // Fallback a caché si existe
      const cachedEntry = this.getFromLocalStorage<T>(cacheKey)
      if (cachedEntry) {
        cacheStatusManager.recordCacheHit()
        return cachedEntry.data
      }
      return []
    }
  }



  private getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  private saveToLocalStorage<T>(key: string, data: CacheEntry<T>): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
    }
  }

  invalidateCache(collectionName: string): void {
    const cacheKey = `cache_${collectionName}`
    localStorage.removeItem(cacheKey)
    this.cache.delete(cacheKey)
  }

  clearAllCache(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'))
    keys.forEach(key => localStorage.removeItem(key))
    this.cache.clear()
  }

  // Escuchar cambios en tiempo real para invalidar caché
  watchCollection(collectionName: string, callback?: () => void): () => void {
    // Invalidar caché cada 30 segundos para simular cambios
    const interval = setInterval(() => {
      const cachedEntry = this.getFromLocalStorage(collectionName)
      if (cachedEntry && Date.now() - cachedEntry.timestamp > 30000) {
        this.invalidateCache(collectionName)
        callback?.()
      }
    }, 30000)

    const cleanup = () => clearInterval(interval)
    this.versionListeners.set(collectionName, cleanup)
    return cleanup
  }

  stopWatching(collectionName: string): void {
    const unsubscribe = this.versionListeners.get(collectionName)
    if (unsubscribe) {
      unsubscribe()
      this.versionListeners.delete(collectionName)
    }
  }
}

export const cacheManager = new CacheManager()