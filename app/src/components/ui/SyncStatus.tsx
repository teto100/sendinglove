'use client'

import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export default function SyncStatus() {
  const isOnline = useOnlineStatus()
  const { syncing, syncStatus } = useOfflineSync()

  if (!syncStatus && isOnline) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isOnline && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 bg-red-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Sin conexión</span>
        </div>
      )}
      
      {syncStatus && (
        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 mt-2">
          {syncing && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          <span className="text-sm font-medium">{syncStatus}</span>
        </div>
      )}
    </div>
  )
}