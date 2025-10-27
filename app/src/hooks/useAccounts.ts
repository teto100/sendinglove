'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { Account, AccountMovement, CreateAccountMovementData } from '@/types/accounts'

let accountsInitialized = false

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [movements, setMovements] = useState<AccountMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [firebaseUser] = useAuthState(auth)

  // Inicializar cuentas por defecto
  useEffect(() => {
    const initializeAccounts = async () => {
      if (accountsInitialized) {

        return
      }
      
      accountsInitialized = true
      
      try {
        const accountsSnapshot = await getDocs(collection(db, 'accounts'))
        
        if (accountsSnapshot.docs.length === 0) {

          
          const defaultAccounts = [
            { name: 'Efectivo', type: 'efectivo' },
            { name: 'Yape', type: 'yape' },
            { name: 'Cuenta BBVA', type: 'bbva' }
          ]

          for (const account of defaultAccounts) {

            await addDoc(collection(db, 'accounts'), {
              name: account.name,
              type: account.type,
              balance: 0,
              initialBalance: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: 'sistema',
              updatedByName: 'Sistema'
            })
          }

        } else {

        }
      } catch (error) {
        accountsInitialized = false
      }
    }

    initializeAccounts()
  }, [])

  // Escuchar cuentas
  useEffect(() => {
    const q = query(collection(db, 'accounts'), orderBy('name', 'asc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        updatedBy: doc.data().updatedBy || 'sistema',
        updatedByName: doc.data().updatedByName || 'Sistema'
      })) as Account[]
      
      setAccounts(accountsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Escuchar movimientos
  useEffect(() => {
    const q = query(collection(db, 'account-movements'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as AccountMovement[]
      
      setMovements(movementsData.slice(0, 25))
    })

    return () => unsubscribe()
  }, [])

  const createMovement = async (movementData: CreateAccountMovementData): Promise<string> => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    const account = accounts.find(a => a.id === movementData.accountId)
    if (!account) throw new Error('Cuenta no encontrada')

    const previousBalance = account.balance
    const newBalance = movementData.type === 'ingreso' 
      ? previousBalance + movementData.amount
      : previousBalance - movementData.amount

    if (newBalance < 0 && movementData.type === 'egreso') {
      throw new Error('Saldo insuficiente')
    }

    // Crear movimiento
    const movementData_clean = {
      accountId: movementData.accountId,
      accountName: account.name,
      type: movementData.type,
      amount: movementData.amount,
      previousBalance,
      newBalance,
      description: movementData.description,
      source: movementData.source,
      userId: firebaseUser.uid,
      userName: firebaseUser.email || 'Usuario',
      createdAt: new Date()
    }
    
    if (movementData.sourceId) {
      movementData_clean.sourceId = movementData.sourceId
    }
    
    const movementRef = await addDoc(collection(db, 'account-movements'), movementData_clean)

    // Actualizar saldo de cuenta
    const updateData: any = {
      balance: newBalance,
      updatedAt: new Date()
    }
    
    if (movementData.source === 'ajuste_manual') {
      updateData.updatedBy = firebaseUser.uid
      updateData.updatedByName = firebaseUser.email || 'Usuario'
    } else {
      updateData.updatedBy = 'sistema'
      updateData.updatedByName = 'Sistema'
    }
    
    await updateDoc(doc(db, 'accounts', movementData.accountId), updateData)

    return movementRef.id
  }

  const setInitialBalance = async (accountId: string, initialBalance: number) => {
    if (!firebaseUser?.uid) throw new Error('Usuario no autenticado')

    const account = accounts.find(a => a.id === accountId)
    if (!account) throw new Error('Cuenta no encontrada')

    // Crear movimiento inicial
    const adjustmentAmount = initialBalance - account.balance
    await createMovement({
      accountId,
      type: adjustmentAmount >= 0 ? 'ingreso' : 'egreso',
      amount: Math.abs(adjustmentAmount),
      description: `Saldo inicial establecido: S/ ${initialBalance.toFixed(2)}`,
      source: 'inicial'
    })

    // Actualizar saldo inicial
    await updateDoc(doc(db, 'accounts', accountId), {
      initialBalance,
      updatedAt: new Date(),
      updatedBy: firebaseUser.uid,
      updatedByName: firebaseUser.email || 'Usuario'
    })
  }

  const processPayment = async (paymentMethod: string, amount: number, description: string, sourceId?: string) => {
    
    const accountMap: { [key: string]: string } = {
      'Efectivo': 'efectivo',
      'Yape': 'yape',
      'Plin': 'bbva',
      'Tarjeta': 'bbva',
      'Transferencia': 'bbva',
      'Transferencia Rappi': 'bbva'
    }

    const accountType = accountMap[paymentMethod]
    
    if (!accountType) {
      console.warn('⚠️ Método de pago no mapeado, saltando procesamiento')
      return
    }

    const account = accounts.find(a => a.type === accountType)
    
    if (!account) {
      console.error('❌ Cuenta no encontrada para el tipo:', accountType)
      return
    }

    
    try {
      const movementStartTime = Date.now()
      
      await createMovement({
        accountId: account.id,
        type: 'ingreso',
        amount,
        description,
        source: 'venta',
        sourceId
      })
      
      const movementEndTime = Date.now()
      
    } catch (error) {
      console.error('❌ Error creando movimiento:', error)
      throw error
    }
  }

  const processPurchase = async (paymentMethod: string, amount: number, description: string, sourceId?: string) => {
    const accountMap: { [key: string]: string } = {
      'Efectivo': 'efectivo',
      'Yape': 'yape',
      'Plin': 'bbva',
      'Transferencia': 'bbva'
    }

    const accountType = accountMap[paymentMethod]
    if (!accountType) return

    const account = accounts.find(a => a.type === accountType)
    if (!account) return

    await createMovement({
      accountId: account.id,
      type: 'egreso',
      amount,
      description,
      source: 'compra',
      sourceId
    })
  }

  const processExpense = async (paymentMethod: string, amount: number, description: string, sourceId?: string) => {
    const accountMap: { [key: string]: string } = {
      'Efectivo': 'efectivo',
      'Yape': 'yape',
      'Plin': 'bbva',
      'Transferencia': 'bbva'
    }

    const accountType = accountMap[paymentMethod]
    if (!accountType) return

    const account = accounts.find(a => a.type === accountType)
    if (!account) return

    await createMovement({
      accountId: account.id,
      type: 'egreso',
      amount,
      description,
      source: 'gasto',
      sourceId
    })
  }

  return {
    accounts,
    movements,
    loading,
    createMovement,
    setInitialBalance,
    processPayment,
    processPurchase,
    processExpense
  }
}