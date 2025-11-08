'use client'

import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types/user'

export function useCurrentUser() {
  const [firebaseUser] = useAuthState(auth)
  const [userData, setUserData] = useState<User | null>(null)
  const [loginTime, setLoginTime] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            setUserData({
              id: firebaseUser.uid,
              ...userDoc.data(),
              createdAt: userDoc.data().createdAt?.toDate() || new Date(),
              lastLogin: userDoc.data().lastLogin?.toDate()
            } as User)
          }
          
          // Set login time to current time
          const currentTime = new Date()
          setLoginTime(currentTime)
        } catch (error) {
        }
      } else {
        setUserData(null)
        setLoginTime(null)
      }
      setLoading(false)
    }

    fetchUserData()
  }, [firebaseUser])

  return {
    user: userData,
    loginTime,
    loading
  }
}