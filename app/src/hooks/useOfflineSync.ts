'use client'

import { useEffect, useState } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { offlineStorage } from '@/lib/offlineStorage'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useOfflineSync() {
  const isOnline = useOnlineStatus()
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  const syncOfflineData = async () => {
    if (!isOnline || syncing) return

    setSyncing(true)
    setSyncStatus('Sincronizando datos...')

    try {
      // 1. Sincronizar usuario offline
      const offlineUser = offlineStorage.getOfflineUser()
      if (offlineUser) {
        await addDoc(collection(db, 'offline_users'), {
          name: offlineUser.name,
          photo: offlineUser.photo,
          createdAt: new Date(),
          synced: true
        })
        offlineStorage.clearOfflineUser()
        setSyncStatus('Usuario sincronizado')
      }

      // 2. Sincronizar pedidos offline
      const offlineOrders = offlineStorage.getOfflineOrders()
      if (offlineOrders.length > 0) {
        for (const order of offlineOrders) {
          await addDoc(collection(db, 'sales'), {
            ...order,
            createdAt: new Date(),
            syncedFromOffline: true
          })
        }
        offlineStorage.clearOfflineOrders()
        setSyncStatus(`${offlineOrders.length} pedidos sincronizados`)
      }

      setSyncStatus('Sincronización completa')
      setTimeout(() => setSyncStatus(null), 3000)

    } catch (error) {
      setSyncStatus('Error en sincronización')
      setTimeout(() => setSyncStatus(null), 3000)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (isOnline) {
      // Esperar 2 segundos después de conectarse para sincronizar
      const timer = setTimeout(syncOfflineData, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  return { syncing, syncStatus, syncOfflineData }
}