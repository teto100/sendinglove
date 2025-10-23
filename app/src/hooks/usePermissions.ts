'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { ROLE_PERMISSIONS, Module, Permission } from '@/types/permissions'
import { UserRole } from '@/types/user'
import { useState, useEffect } from 'react'

export function usePermissions() {
  const [user] = useAuthState(auth)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role)
          }
        } catch (error) {
        }
      }
      setLoading(false)
    }

    fetchUserRole()
  }, [user])

  const hasPermission = (module: Module, permission: Permission): boolean => {
    if (!userRole) return false
    return ROLE_PERMISSIONS[userRole][module].includes(permission)
  }

  const canAccess = (module: Module): boolean => {
    if (!userRole) return false
    const modulePermissions = ROLE_PERMISSIONS[userRole]?.[module]
    return modulePermissions ? modulePermissions.length > 0 : false
  }

  return {
    userRole,
    loading,
    hasPermission,
    canAccess
  }
}