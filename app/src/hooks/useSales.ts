'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { Sale, CreateSaleData } from '@/types/sale'
import { useAccounts } from './useAccounts'
import { useInventory } from './useInventory'

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [firebaseUser] = useAuthState(auth)
  const { processPayment } = useAccounts()
  const { updateInventoryMovement } = useInventory()
  
  // Productos que requieren pan hamburguesa
  const PRODUCTS_REQUIRING_BREAD = [
    'Hamburguesa',
    'Sanguche De Pollo Deshilachado',
    'Sanguche De Filete De Pollo'
  ]
  
  // Función para descontar pan hamburguesa
  const deductBreadForOrder = async (orderItems: any[], orderType: string, orderId: string) => {
    let totalBreadNeeded = 0
    const productsWithBread: string[] = []
    
    orderItems.forEach(item => {
      if (PRODUCTS_REQUIRING_BREAD.includes(item.productName)) {
        totalBreadNeeded += item.quantity
        productsWithBread.push(`${item.productName} x${item.quantity}`)
      }
    })
    
    if (totalBreadNeeded > 0) {
      const movementType = `Descuento automático - ${orderType}`
      const description = `Descuento por productos con pan (${productsWithBread.join(', ')})`
      
      await updateInventoryMovement(
        'Pan hamburguesa',
        -totalBreadNeeded,
        movementType,
        description,
        orderId
      )
    }
  }

  useEffect(() => {
    const q = query(
      collection(db, 'sales'),
      where('orderStatus', '==', 'Abierta'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Sale[]
      
      // Limit to 10 most recent orders
      const limitedSales = salesData.slice(0, 10)
      
      setSales(limitedSales)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const createSale = async (saleData: CreateSaleData): Promise<string> => {
    
    if (!firebaseUser?.uid) {
      console.error('❌ Usuario no autenticado')
      throw new Error('Usuario no autenticado')
    }
    

    const cleanData = Object.fromEntries(
      Object.entries(saleData).filter(([_, value]) => value !== undefined)
    )
    

    const finalData = {
      ...cleanData,
      createdAt: cleanData.createdAt || new Date(), // Usar fecha del CSV si existe
      createdBy: firebaseUser.uid,
      createdByName: firebaseUser.email || 'Usuario',
      updatedAt: new Date(),
      updatedBy: firebaseUser.uid,
      updatedByName: firebaseUser.email || 'Usuario'
    }
    
    
    
    try {
      const saveStartTime = Date.now()
      
      const docRef = await addDoc(collection(db, 'sales'), finalData)
      
      const saveEndTime = Date.now()

      // Procesar pagos en cuentas si la venta se crea como Pagada
      if (saleData.paymentStatus === 'Pagado' && saleData.paymentMethods) {
        
        for (const [index, payment] of saleData.paymentMethods.entries()) {
          
          const description = payment.method === 'Transferencia Rappi' 
            ? `Venta Rappi #${docRef.id.slice(-6)} - Pago miércoles` 
            : `Venta #${docRef.id.slice(-6)}`
          
          
          try {
            await processPayment(
              payment.method,
              payment.amount,
              description,
              docRef.id
            )
          } catch (paymentError) {
            console.error(`❌ Error procesando pago ${index + 1}:`, paymentError)
          }
        }
      } else {
      }
      
      return docRef.id
      
    } catch (error) {
      console.error('❌ Error guardando en Firebase:', error)
      throw error
    }
  }

  const updateSale = async (id: string, updates: Partial<Sale>) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    // Remove undefined fields recursively
    const cleanUpdates = JSON.parse(JSON.stringify(updates, (key, value) => {
      return value === undefined ? null : value
    }))
    
    // Remove null values
    const finalUpdates = Object.fromEntries(
      Object.entries(cleanUpdates).filter(([_, value]) => value !== null && value !== undefined)
    )



    await updateDoc(doc(db, 'sales', id), {
      ...finalUpdates,
      updatedAt: new Date(),
      updatedBy: firebaseUser.uid,
      updatedByName: firebaseUser.email || 'Usuario'
    })
    
    // Procesar pagos en cuentas si el estado cambia a Pagado
    if (finalUpdates.paymentStatus === 'Pagado' && finalUpdates.paymentMethods) {
      for (const payment of finalUpdates.paymentMethods) {
        // Para tarjeta: usar el monto directo sin dividir
        const baseAmount = payment.amount
        
        // Guardar solo el monto base en cuentas
        await processPayment(
          payment.method,
          baseAmount,
          payment.method === 'Transferencia Rappi' ? `Venta Rappi #${id.slice(-6)} - Pago miércoles` : `Venta #${id.slice(-6)}`,
          id
        )
      }
    }
    
    // Descontar pan hamburguesa si la orden está cerrada y pagada
    if (finalUpdates.orderStatus === 'Cerrada' && finalUpdates.paymentStatus === 'Pagado') {
      // Buscar la venta actual para obtener los items
      const currentSale = sales.find(sale => sale.id === id)
      if (currentSale && currentSale.items) {
        await deductBreadForOrder(currentSale.items, currentSale.orderType || 'Mesa', id)
      }
    }
  }

  return {
    sales,
    loading,
    createSale,
    updateSale
  }
}