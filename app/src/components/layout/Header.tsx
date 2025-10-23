'use client'

import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActivityLogger } from '@/hooks/useActivityLogger'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useCacheStatus } from '@/hooks/useCacheStatus'
import { colors } from '@/styles/colors'
import { useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter()
  const { logActivity } = useActivityLogger()
  const { user, loginTime } = useCurrentUser()
  const cacheStatus = useCacheStatus()
  const [mounted, setMounted] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fail
      })
    }

    // Capturar evento de instalación PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])
  
  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      // Log activity first
      await logActivity({
        type: 'user_logout',
        description: 'Usuario cerró sesión'
      })
      
      // Clear local data
      localStorage.removeItem('loginTime')
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      
      // Sign out from Firebase
      await signOut(auth)
      
      // Force redirect to home (login page)
      router.push('/')
      
      // Fallback: reload page if redirect fails
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
      
    } catch (error) {
      // Force redirect even on error
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
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
            
            {deferredPrompt && (
              <button
                onClick={async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt()
                    const { outcome } = await deferredPrompt.userChoice
                    setDeferredPrompt(null)
                  }
                }}
                className="text-white hover:opacity-80 px-3 py-2 rounded-md text-sm font-medium bg-green-600"
              >
                📱 Instalar App
              </button>
            )}
            
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
              className={`text-white px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 hover:bg-red-600'
              }`}
              style={{backgroundColor: isLoggingOut ? '#4B4C1E' : '#DC2626'}}
            >
              {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}