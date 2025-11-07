import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const initializeRewardsPermissions = async () => {
  try {
    const permissionsRef = doc(db, 'system', 'permissions')
    const permissionsSnap = await getDoc(permissionsRef)
    
    let currentPermissions: any = {}
    if (permissionsSnap.exists()) {
      currentPermissions = permissionsSnap.data()
    }

    // Verificar si ya existen permisos para rewards
    if (currentPermissions.rolePermissions?.Root?.rewards) {
      return // Ya están configurados
    }

    // Agregar permisos para rewards
    const updatedPermissions = {
      ...currentPermissions,
      rolePermissions: {
        ...currentPermissions.rolePermissions,
        Root: {
          ...currentPermissions.rolePermissions?.Root,
          rewards: { read: true, create: true, update: true, delete: true }
        },
        Admin: {
          ...currentPermissions.rolePermissions?.Admin,
          rewards: { read: true, create: true, update: true, delete: true }
        },
        Manager: {
          ...currentPermissions.rolePermissions?.Manager,
          rewards: { read: true, create: true, update: true, delete: false }
        },
        Cajero: {
          ...currentPermissions.rolePermissions?.Cajero,
          rewards: { read: true, create: false, update: false, delete: false }
        },
        Usuario: {
          ...currentPermissions.rolePermissions?.Usuario,
          rewards: { read: false, create: false, update: false, delete: false }
        }
      }
    }

    await setDoc(permissionsRef, updatedPermissions)
    return true
  } catch (error) {
    console.error('Error initializing rewards permissions:', error)
    return false
  }
}