'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, addDoc, collection, getDocs, updateDoc } from 'firebase/firestore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forceOnline, setForceOnline] = useState(false)
  const isOnline = useOnlineStatus()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Store login time
      const loginTime = new Date()
      localStorage.setItem('loginTime', loginTime.toISOString())
      
      // Log login activity
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      const userData = userDoc.data()
      
      await addDoc(collection(db, 'activities'), {
        type: 'user_login',
        userId: userCredential.user.uid,
        userName: userData?.name || email,
        userRole: userData?.role || 'unknown',
        description: `Usuario inició sesión: ${userData?.name || email}`,
        metadata: { email, loginTime: loginTime.toISOString() },
        timestamp: loginTime,
        userAgent: navigator.userAgent
      })
    } catch (error: any) {
      setError('Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{
           background: `linear-gradient(135deg, #4b4c1e 0%, #ed4c31 100%)`,
         }}>
      {/* Background Images */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute top-10 left-10 w-32 h-32 bg-cover bg-center rounded-lg transform rotate-12"
          style={{ backgroundImage: 'url(/images/walls/fondo1.png)' }}
        ></div>
        <div 
          className="absolute top-20 right-20 w-40 h-40 bg-cover bg-center rounded-lg transform -rotate-6"
          style={{ backgroundImage: 'url(/images/walls/fondo2.png)' }}
        ></div>
        <div 
          className="absolute bottom-20 left-20 w-36 h-36 bg-cover bg-center rounded-lg transform rotate-45"
          style={{ backgroundImage: 'url(/images/walls/fondo1.png)' }}
        ></div>
        <div 
          className="absolute bottom-10 right-10 w-28 h-28 bg-cover bg-center rounded-lg transform -rotate-12"
          style={{ backgroundImage: 'url(/images/walls/fondo2.png)' }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-cover bg-center rounded-lg transform rotate-90"
          style={{ backgroundImage: 'url(/images/walls/fondo1.png)' }}
        ></div>
        <div 
          className="absolute top-1/3 right-1/3 w-32 h-32 bg-cover bg-center rounded-lg transform -rotate-45"
          style={{ backgroundImage: 'url(/images/walls/fondo2.png)' }}
        ></div>
      </div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg">
            SendingLove
          </h2>
          <p className="mt-2 text-center text-lg text-yellow-100 drop-shadow-md font-medium">
            Sistema de gestión
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-300 text-white bg-black bg-opacity-30 rounded-t-md focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-300 text-white bg-black bg-opacity-30 rounded-b-md focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          


          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className={`px-2 py-1 rounded ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={forceOnline}
                  onChange={(e) => setForceOnline(e.target.checked)}
                  className="mr-1"
                />
                Forzar Online
              </label>
            </div>
            
            <button
              type="button"
              onClick={async () => {
                if (isOnline || forceOnline) {
                  try {
                    const usersSnapshot = await getDocs(collection(db, 'users'))
                    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    localStorage.setItem('users_cache', JSON.stringify(users))
                    localStorage.setItem('users_cache_timestamp', Date.now().toString())
                    alert(`Actualizados ${users.length} usuarios desde Firebase`)
                  } catch (error) {
                    alert('Error actualizando usuarios')
                  }
                } else {
                  alert('Sin conexión')
                }
              }}
              className="w-full flex justify-center py-2 px-4 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
            >
              Actualizar Usuarios desde Firebase
            </button>
            
            
            <button
              type="button"
              onClick={async () => {
                try {
                  await auth.signOut()
                } catch (e) {}
                localStorage.clear()
                sessionStorage.clear()
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => caches.delete(name))
                  })
                }
                window.location.reload()
              }}
              className="w-full flex justify-center py-2 px-4 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
            >
              Cerrar Sesión + Limpiar Todo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}