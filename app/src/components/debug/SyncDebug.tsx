'use client'

import { useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function SyncDebug() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const checkUsers = async () => {
    setLoading(true)
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setUsers(usersList)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
    setLoading(false)
  }

  const clearCache = () => {
    localStorage.clear()
    sessionStorage.clear()
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
    }
    window.location.reload()
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-4">Debug Sync</h3>
      
      <div className="space-y-2">
        <button 
          onClick={checkUsers}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          {loading ? 'Checking...' : 'Check Users in Firebase'}
        </button>
        
        <button 
          onClick={clearCache}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Clear All Cache & Reload
        </button>
      </div>

      {users.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Users found:</h4>
          <pre className="bg-white p-2 rounded text-xs overflow-auto">
            {JSON.stringify(users, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}