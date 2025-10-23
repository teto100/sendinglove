'use client'

import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'
import { useActivityLogger } from '@/hooks/useActivityLogger'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useCacheStatus } from '@/hooks/useCacheStatus'
import { colors } from '@/styles/colors'
import { useEffect, useState } from 'react'

export default function Header() {
  const { logActivity } = useActivityLogger()
  const { user, loginTime } = useCurrentUser()
  const cacheStatus = useCacheStatus()
  const [mounted, setMounted] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Registrar service worker para cache de imágenes
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fail
      })
    }
  }, [])
  
  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      await logActivity({
        type: 'user_logout',
        description: 'Usuario cerró sesión'
      })
      localStorage.removeItem('loginTime')
      await signOut(auth)
    } catch (error) {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav style={{backgroundColor: '#CF432B'}} className="shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-bold hover:opacity-80 flex items-center gap-3">
              <img src="/sending.jpg" alt="Sending Love" className="h-8 w-8 rounded-full" />
              Sending Love
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-white hover:opacity-80 px-3 py-2 rounded-md text-sm font-medium">
              🏠 Menú Principal
            </Link>
            
            <div className="flex-1"></div>
            
            {user && (
              <div className="flex items-center space-x-3 bg-blue-700 px-3 py-2 rounded-md">
                <div className="text-right">
                  <div className="text-white text-sm font-medium">{user.name}</div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors.roles[user.role]}`}>
                      {user.role}
                    </span>
                    {loginTime && (
                      <span className="text-blue-200 text-xs">
                        Desde: {loginTime.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {mounted && (
              <div className="bg-blue-700 px-3 py-2 rounded-md">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    cacheStatus.isUsingCache ? 'bg-green-400' : 'bg-orange-400'
                  }`}></div>
                  <span className="text-white text-xs font-medium">
                    {cacheStatus.isUsingCache ? 'Caché' : 'Firebase'}
                  </span>
                </div>
                {cacheStatus.lastFirebaseQuery && (
                  <div className="text-blue-200 text-xs mt-1">
                    Última: {cacheStatus.lastFirebaseQuery.toLocaleTimeString()}
                  </div>
                )}
                <div className="text-blue-200 text-xs mt-1">
                  C:{cacheStatus.cacheHits} | F:{cacheStatus.firebaseQueries}
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
              }`}
              style={{backgroundColor: '#4B4C1E'}}
            >
              {isLoggingOut ? 'Saliendo...' : 'Salir'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}