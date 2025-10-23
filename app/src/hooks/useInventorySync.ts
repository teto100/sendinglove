'use client'

import { useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, addDoc, getDocs, where as whereClause } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useInventory } from './useInventory'
import { useProducts } from './useProducts'

export function useInventorySync() {
  const { createMovement } = useInventory()
  const { products } = useProducts()
  
  const ensureInventoryItem = async (productId: string) => {
    // Verificar si el item ya existe en inventario
    const inventoryQuery = query(
      collection(db, 'inventory'),
      whereClause('productId', '==', productId)
    )
    const inventorySnapshot = await getDocs(inventoryQuery)
    
    if (inventorySnapshot.empty) {
      // Crear item de inventario si no existe
      const product = products.find(p => p.id === productId)
      if (product) {
        await addDoc(collection(db, 'inventory'), {
          productId: productId,
          productName: product.name,
          currentStock: 0,
          minStock: 5,
          maxStock: 100,
          createdAt: new Date(),
          lastUpdated: new Date()
        })
      }
    }
  }

  useEffect(() => {
    // Escuchar cambios en todas las ventas
    const q = query(
      collection(db, 'sales'),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'modified') {
          const sale = { id: change.doc.id, ...change.doc.data() }
          
          // Verificar si está cerrada y pagada
          const isClosedAndPaid = sale.orderStatus === 'Cerrada' && sale.paymentStatus === 'Pagado'
          
          if (isClosedAndPaid && sale.items?.length > 0) {
            
            // Procesar cada item de la venta
            for (const item of sale.items) {
              try {
                // Asegurar que el item existe en inventario
                await ensureInventoryItem(item.productId)
                
                // Crear movimiento de salida
                await createMovement({
                  productId: item.productId,
                  type: 'salida',
                  quantity: item.quantity,
                  reason: `Venta #${sale.id.slice(-6)} - ${sale.orderType}`
                })
              } catch (error) {
              }
            }
          }
        }
      })
    })

    return () => unsubscribe()
  }, [createMovement])
}