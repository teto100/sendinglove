'use client'

import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActivityLogger } from '@/hooks/useActivityLogger'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useCacheStatus } from '@/hooks/useCacheStatus'
import { useDeviceType } from '@/hooks/useDeviceType'
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
  const [showSidebar, setShowSidebar] = useState(false)
  const deviceType = useDeviceType()

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

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'POS/Ventas', href: '/sales', icon: '🛒' },
    { name: 'Productos', href: '/products', icon: '📦' },
    { name: 'Inventario', href: '/inventory', icon: '📋' },
    { name: 'Pedidos', href: '/orders', icon: '📝' },
    { name: 'Reportes', href: '/reports', icon: '📈' },
    { name: 'Usuarios', href: '/users', icon: '👥' },
    { name: 'Proveedores', href: '/suppliers', icon: '🏢' },
    { name: 'Gastos', href: '/expenses', icon: '💰' },
    { name: 'Cuentas', href: '/accounts', icon: '💳' },
    { name: 'Clientes', href: '/customers', icon: '👤' },
    { name: 'Compras', href: '/purchases', icon: '🛍️' },
    { name: 'Cierre Caja', href: '/cash-closing', icon: '💵' },
    { name: 'Permisos', href: '/permissions', icon: '🔐' }
  ]
  
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
    <>
      <nav style={{backgroundColor: '#CF432B'}} className="shadow-lg fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {deviceType === 'mobile' ? (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="text-white p-2 rounded-md hover:bg-red-600 mr-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              ) : null}
              <Link href="/" className="text-white text-xl font-bold hover:opacity-80 flex items-center gap-3">
                <img src="/sending.jpg" alt="Sending Love" className="h-8 w-8 rounded-full" />
                {deviceType !== 'mobile' && 'Sending Love'}
              </Link>
            </div>
            
            {deviceType === 'mobile' ? (
              <div className="flex items-center">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`text-white px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isLoggingOut ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 hover:bg-red-600'
                  }`}
                  style={{backgroundColor: isLoggingOut ? '#4B4C1E' : '#DC2626'}}
                >
                  {isLoggingOut ? 'Cerrando...' : 'Salir'}
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar móvil */}
      {deviceType === 'mobile' && showSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-xl transform transition-transform">
            <div className="flex items-center justify-between p-4 border-b" style={{backgroundColor: '#CF432B'}}>
              <div className="flex items-center gap-3">
                <img src="/sending.jpg" alt="Sending Love" className="h-8 w-8 rounded-full" />
                <span className="text-white text-lg font-bold">Sending Love</span>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-white p-2 rounded-md hover:bg-red-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto h-full pb-20">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowSidebar(false)}
                  className="flex items-center gap-3 px-6 py-4 text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}