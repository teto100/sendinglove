'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { collection, addDoc, doc, getDoc, query, where, Timestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { CreateActivityData } from '@/types/activity'
import { shouldLogActivity } from '@/utils/activityOptimizer'

export function useActivityLogger() {
  const [user] = useAuthState(auth)

  const logActivity = async (activityData: CreateActivityData) => {
    // Solo registrar actividades en producción (Vercel)
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    if (!user) return

    try {
      // Check if we should log this activity (optimization)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Simple count check - in production you might want to cache this
      const todayCount = 0 // Simplified for now
      
      if (!shouldLogActivity(activityData.type, user.uid, todayCount)) {
        return // Skip logging to save writes
      }

      // Get user details
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()

      await addDoc(collection(db, 'activities'), {
        type: activityData.type,
        userId: user.uid,
        userName: userData?.name || user.email,
        userRole: userData?.role || 'unknown',
        description: activityData.description,
        metadata: activityData.metadata || {},
        timestamp: new Date(),
        userAgent: navigator.userAgent
      })
    } catch (error) {
    }
  }

  return { logActivity }
}