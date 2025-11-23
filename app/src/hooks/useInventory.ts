'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where, limit, startAfter, getDocs } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { InventoryItem, InventoryMovement, CreateInventoryMovementData } from '@/types/inventory'
import { useProducts } from './useProducts'


export function useInventory(page = 1, pageSize = 30, searchTerm = '') {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [totalMovements, setTotalMovements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [movementsLoading, setMovementsLoading] = useState(false)
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
    const loadMovements = async () => {
      setMovementsLoading(true)
      try {
        if (searchTerm) {
          // Con búsqueda: traer más datos y filtrar
          const q = query(
            collection(db, 'inventory-movements'),
            orderBy('createdAt', 'desc'),
            limit(500) // Traer más para filtrar
          )
          
          const snapshot = await getDocs(q)
          const allMovements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          })) as InventoryMovement[]
          
          const filteredMovements = allMovements.filter(movement => 
            movement.productName.toLowerCase().includes(searchTerm.toLowerCase())
          )
          
          const startIndex = (page - 1) * pageSize
          const paginatedMovements = filteredMovements.slice(startIndex, startIndex + pageSize)
          
          setMovements(paginatedMovements)
          setTotalMovements(filteredMovements.length)
        } else {
          // Sin búsqueda: paginación real
          const totalQuery = query(collection(db, 'inventory-movements'))
          const totalSnapshot = await getDocs(totalQuery)
          setTotalMovements(totalSnapshot.size)
          
          const q = query(
            collection(db, 'inventory-movements'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
          )
          
          let finalQuery = q
          if (page > 1) {
            const prevQuery = query(
              collection(db, 'inventory-movements'),
              orderBy('createdAt', 'desc'),
              limit((page - 1) * pageSize)
            )
            const prevSnapshot = await getDocs(prevQuery)
            const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1]
            if (lastDoc) {
              finalQuery = query(q, startAfter(lastDoc))
            }
          }
          
          const snapshot = await getDocs(finalQuery)
          const movementsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          })) as InventoryMovement[]
          
          setMovements(movementsData)
        }
      } catch (error) {
        console.error('Error loading movements:', error)
        setMovements([])
        setTotalMovements(0)
      } finally {
        setMovementsLoading(false)
      }
    }

    loadMovements()
  }, [page, pageSize, searchTerm])

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

    // Stock bajo detectado (sin alertas por ahora)
    if (newStock <= inventoryItem.minStock) {
      console.warn('Stock bajo detectado. Producto:', product.name?.replace(/[\r\n]/g, ''), 'Stock:', newStock)
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

  // Función para actualizar inventario por nombre de producto
  const updateInventoryMovement = async (productName: string, quantity: number, movementType: string, description: string, orderId?: string) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    // Buscar producto por nombre
    const product = products.find(p => p.name === productName)
    if (!product) {
      console.error('Producto no encontrado:', productName?.replace(/[\r\n]/g, ''))
      return
    }

    // Buscar item de inventario
    let inventoryItem = inventory.find(i => i.productId === product.id)
    
    if (!inventoryItem) {
      console.error('Item de inventario no encontrado para producto:', productName?.replace(/[\r\n]/g, ''))
      return
    }

    const previousStock = inventoryItem.currentStock
    const newStock = previousStock + quantity // quantity ya viene negativo

    if (newStock < 0) {
      console.error('Stock insuficiente. Producto:', productName?.replace(/[\r\n]/g, ''), 'Stock:', previousStock, 'Descuento:', Math.abs(quantity))
      return
    }

    try {
      // Crear movimiento
      await addDoc(collection(db, 'inventory-movements'), {
        productId: product.id,
        productName: product.name,
        type: quantity > 0 ? 'entrada' : 'salida',
        quantity: Math.abs(quantity),
        reason: movementType,
        description: description,
        orderId: orderId,
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

      console.log('Inventario actualizado. Producto:', productName?.replace(/[\r\n]/g, ''), 'Cantidad:', Math.abs(quantity), 'Stock anterior:', previousStock, 'Stock nuevo:', newStock)
    } catch (error) {
      console.error('Error actualizando inventario para producto:', productName?.replace(/[\r\n]/g, ''), error)
    }
  }

  return {
    inventory,
    movements,
    totalMovements,
    loading,
    movementsLoading,
    createMovement,
    updateStockLimits,
    getLowStockItems,
    updateInventoryMovement
  }
}