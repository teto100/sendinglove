'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import LoginForm from '@/components/auth/LoginForm'
import Dashboard from '@/components/dashboard/Dashboard'
import LoadingModal from '@/components/ui/LoadingModal'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return (
    <>
      <LoadingModal isOpen={loading} message="Verificando autenticación..." />
      {!loading && (user ? <Dashboard /> : <LoginForm />)}
    </>
  )
}