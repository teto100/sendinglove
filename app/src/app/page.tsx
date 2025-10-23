'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import LoginForm from '@/components/auth/LoginForm'
import Dashboard from '@/components/dashboard/Dashboard'
import LoadingModal from '@/components/ui/LoadingModal'
import OfflineLogin from '@/components/auth/OfflineLogin'
import OfflineMenu from '@/components/layout/OfflineMenu'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { offlineStorage } from '@/lib/offlineStorage'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [offlineUser, setOfflineUser] = useState<any>(null)
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (isOnline) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user)
        setLoading(false)
      })
      return () => unsubscribe()
    } else {
      // Modo offline
      const savedOfflineUser = offlineStorage.getOfflineUser()
      setOfflineUser(savedOfflineUser)
      setLoading(false)
    }
  }, [isOnline])

  const handleOfflineLogin = (userData: { name: string, photo: string }) => {
    setOfflineUser(userData)
  }

  // Modo offline
  if (!isOnline) {
    if (loading) {
      return <LoadingModal isOpen={true} message="Iniciando modo offline..." />
    }
    
    if (!offlineUser) {
      return <OfflineLogin onLogin={handleOfflineLogin} />
    }
    
    return <OfflineMenu />
  }

  // Modo online
  return (
    <>
      <LoadingModal isOpen={loading} message="Verificando autenticación..." />
      {!loading && (user ? <Dashboard /> : <LoginForm />)}
    </>
  )
}