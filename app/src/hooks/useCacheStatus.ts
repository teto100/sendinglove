'use client'

import { useState, useEffect } from 'react'

interface CacheStatus {
  isUsingCache: boolean
  lastFirebaseQuery: Date | null
  cacheHits: number
  firebaseQueries: number
}

class CacheStatusManager {
  private status: CacheStatus = {
    isUsingCache: false,
    lastFirebaseQuery: null,
    cacheHits: 0,
    firebaseQueries: 0
  }
  
  private listeners: Set<(status: CacheStatus) => void> = new Set()

  recordCacheHit() {
    this.status.cacheHits++
    this.status.isUsingCache = true
    this.notifyListeners()
  }

  recordFirebaseQuery() {
    this.status.firebaseQueries++
    this.status.lastFirebaseQuery = new Date()
    this.status.isUsingCache = false
    this.notifyListeners()
  }

  subscribe(listener: (status: CacheStatus) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getStatus(): CacheStatus {
    return { ...this.status }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getStatus()))
  }
}

export const cacheStatusManager = new CacheStatusManager()

export function useCacheStatus() {
  const [status, setStatus] = useState<CacheStatus>(cacheStatusManager.getStatus())

  useEffect(() => {
    const unsubscribe = cacheStatusManager.subscribe(setStatus)
    return unsubscribe
  }, [])

  return status
}