'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Module, Permission } from '@/types/permissions'
import { UserRole } from '@/types/user'
import { useState, useEffect } from 'react'

export function usePermissions() {
  const [user] = useAuthState(auth)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchUserRoleAndPermissions = async () => {
    if (user) {
      try {
        // Cargar rol del usuario
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const role = userDoc.data().role
          setUserRole(role)
          
          // Cargar permisos desde system/permissions
          const permissionsDoc = await getDoc(doc(db, 'system', 'permissions'))
          if (permissionsDoc.exists()) {
            const permsData = permissionsDoc.data()
            setPermissions(permsData)
          }
        }
      } catch (error) {
        // Silent error handling
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUserRoleAndPermissions()
  }, [user, refreshTrigger])

  const refreshPermissions = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const hasPermission = (module: Module, permission: Permission): boolean => {
    if (!userRole || !permissions) return false
    const rolePermissions = permissions.rolePermissions || permissions
    const modulePermissions = rolePermissions[userRole]?.[module] || []
    return modulePermissions.includes(permission)
  }

  const canAccess = (module: Module): boolean => {
    if (loading || !userRole || !permissions) {
      return false
    }
    
    const rolePermissions = permissions.rolePermissions || permissions
    const modulePermissions = rolePermissions[userRole]?.[module] || []
    return modulePermissions.length > 0
  }

  return {
    userRole,
    permissions,
    loading,
    hasPermission,
    canAccess,
    refreshPermissions
  }
}