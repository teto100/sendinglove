'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { InventoryItem, InventoryMovement, CreateInventoryMovementData } from '@/types/inventory'
import { useProducts } from './useProducts'
import { sendStockAlert } from '@/lib/notifications'

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [firebaseUser] = useAuthState(auth)
  const { products } = useProducts()

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('productName', 'asc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as InventoryItem[]
      
      setInventory(inventoryData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'inventory-movements'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as InventoryMovement[]
      
      setMovements(movementsData.slice(0, 50)) // Últimos 50 movimientos
    })

    return () => unsubscribe()
  }, [])

  const createMovement = async (movementData: CreateInventoryMovementData & { dryRun?: boolean }): Promise<string> => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    const product = products.find(p => p.id === movementData.productId)
    if (!product) throw new Error('Producto no encontrado')

    // Buscar item de inventario existente
    let inventoryItem = inventory.find(i => i.productId === movementData.productId)
    
    if (!inventoryItem) {
      if (movementData.dryRun) {
        // Solo verificar: no hay stock para este producto
        throw new Error('Stock insuficiente')
      }
      
      // Crear nuevo item de inventario solo si no existe
      const newInventoryRef = await addDoc(collection(db, 'inventory'), {
        productId: movementData.productId,
        productName: product.name,
        currentStock: 0,
        minStock: 10,
        maxStock: 100,
        createdAt: new Date(),
        createdBy: firebaseUser.uid,
        createdByName: firebaseUser.email || 'Usuario',
        lastUpdated: new Date(),
        updatedBy: firebaseUser.uid,
        updatedByName: firebaseUser.email || 'Usuario'
      })
      
      inventoryItem = {
        id: newInventoryRef.id,
        productId: movementData.productId,
        productName: product.name,
        currentStock: 0,
        minStock: 10,
        maxStock: 100,
        createdAt: new Date(),
        lastUpdated: new Date()
      }
      
      // Actualizar el estado local inmediatamente
      setInventory(prev => [...prev, inventoryItem!])
    }

    const previousStock = inventoryItem.currentStock
    const newStock = movementData.type === 'entrada' 
      ? previousStock + movementData.quantity
      : previousStock - movementData.quantity

    if (newStock < 0) {
      throw new Error('Stock insuficiente')
    }

    // Si es solo verificación, no ejecutar
    if (movementData.dryRun) {
      return 'dry-run'
    }

    // Crear movimiento
    const movementRef = await addDoc(collection(db, 'inventory-movements'), {
      productId: movementData.productId,
      productName: product.name,
      type: movementData.type,
      quantity: movementData.quantity,
      reason: movementData.reason,
      previousStock,
      newStock,
      createdAt: new Date(),
      createdBy: firebaseUser.uid,
      createdByName: firebaseUser.email || 'Usuario',
      updatedAt: new Date(),
      updatedBy: firebaseUser.uid,
      updatedByName: firebaseUser.email || 'Usuario'
    })

    // Actualizar stock
    await updateDoc(doc(db, 'inventory', inventoryItem.id), {
      currentStock: newStock,
      lastUpdated: new Date(),
      updatedBy: firebaseUser.uid,
      updatedByName: firebaseUser.email || 'Usuario'
    })

    // Verificar alerta de stock bajo
    if (newStock <= inventoryItem.minStock) {
      await sendStockAlert(product.name, newStock)
    }

    return movementRef.id
  }

  const updateStockLimits = async (inventoryId: string, minStock: number, maxStock: number) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    await updateDoc(doc(db, 'inventory', inventoryId), {
      minStock,
      maxStock,
      lastUpdated: new Date(),
      updatedBy: firebaseUser.uid,
      updatedByName: firebaseUser.email || 'Usuario'
    })
  }

  const getLowStockItems = () => {
    return inventory.filter(item => item.currentStock <= item.minStock)
  }

  return {
    inventory,
    movements,
    loading,
    createMovement,
    updateStockLimits,
    getLowStockItems
  }
}