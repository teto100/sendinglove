'use client'

import { useState } from 'react'
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { getFunctions } from 'firebase/functions'
import { db, auth } from '@/lib/firebase'
import { User, CreateUserData } from '@/types/user'
import { useCachedData } from './useCachedData'
import { VersionManager } from '@/utils/versionManager'

export function useUsers() {
  const { data: users, loading, refresh, forceRefresh } = useCachedData<User>('users', 'name')
  const [operationLoading, setOperationLoading] = useState(false)

  const createUser = async (userData: CreateUserData) => {
    try {
      setOperationLoading(true)
      
      // Validaciones básicas
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Todos los campos son requeridos')
      }
      
      if (userData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }
      
      // Crear usuario en Firebase Auth
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email.trim(),
          password: userData.password,
          name: userData.name
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario')
      }
      
      
      // Crear documento en Firestore
      await setDoc(doc(db, 'users', result.uid), {
        email: userData.email.trim(),
        name: userData.name,
        role: userData.role,
        active: true,
        createdAt: new Date(),
        canEditProfile: true,
        lastLogin: null
      })
      
      
      await VersionManager.updateVersion('users')
      return { success: true, uid: result.uid }
    } catch (error: any) {
      
      let errorMessage = 'Error desconocido'
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'El email ya está registrado. Usa otro email.'
          break
        case 'auth/invalid-email':
          errorMessage = 'El formato del email es inválido'
          break
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres'
          break
        case 'auth/operation-not-allowed':
          errorMessage = 'Creación de usuarios deshabilitada'
          break
        default:
          errorMessage = error.message || 'Error al crear usuario'
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setOperationLoading(false)
    }
  }

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      setOperationLoading(true)
      
      // Verificar si es usuario root y se intenta desactivar
      const user = users.find(u => u.id === userId)
      if (user?.role === 'root' && updates.active === false) {
        return { success: false, error: 'No se puede desactivar el usuario root' }
      }
      
      await updateDoc(doc(db, 'users', userId), updates)
      await VersionManager.updateVersion('users')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      setOperationLoading(true)
      
      // Verificar si es usuario root
      const user = users.find(u => u.id === userId)
      if (user?.role === 'root') {
        return { success: false, error: 'No se puede eliminar el usuario root' }
      }
      
      await deleteDoc(doc(db, 'users', userId))
      await VersionManager.updateVersion('users')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const syncUserWithAuth = async (email: string, authUID: string) => {
    try {
      setOperationLoading(true)
      
      // Buscar usuario por email
      const tempUser = users.find(u => u.email === email)
      if (!tempUser) {
        return { success: false, error: 'Usuario no encontrado' }
      }
      
      // Crear documento con UID de Auth
      await setDoc(doc(db, 'users', authUID), {
        ...tempUser,
        id: authUID,
        tempUser: false,
        syncedAt: new Date()
      })
      
      // Eliminar documento temporal
      await deleteDoc(doc(db, 'users', tempUser.id))
      
      await VersionManager.updateVersion('users')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const clearCache = async () => {
    localStorage.removeItem('cache_users')
    localStorage.removeItem('cache_version_users')
    
    setOperationLoading(true)
    try {
      const q = query(collection(db, 'users'), orderBy('name'))
      const snapshot = await getDocs(q)
      const freshUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })) as User[]
      
      window.location.reload()
    } catch (error) {
      alert('Error al cargar usuarios: ' + error)
    } finally {
      setOperationLoading(false)
    }
  }

  return {
    users,
    loading: loading || operationLoading,
    createUser,
    updateUser,
    deleteUser,
    syncUserWithAuth,
    refresh,
    clearCache
  }
}