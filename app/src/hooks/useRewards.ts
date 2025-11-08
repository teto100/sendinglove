import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  RewardMovement, 
  RewardPrize, 
  RewardRedemption, 
  RewardsConfig, 
  SuperPrizeControl,
  CustomerRewardsSearch 
} from '@/types/rewards'
import { Customer } from '@/types/customer'


export const useRewards = () => {
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<RewardsConfig | null>(null)

  // Inicializar configuración por defecto
  const initializeConfig = async () => {
    try {
      const configRef = doc(db, 'rewards_config', 'default')
      const configSnap = await getDoc(configRef)
      
      if (!configSnap.exists()) {
        const defaultConfig = {
          min_purchase_amount: 15,
          points_per_purchase: 1,
          points_for_prize: 6,
          max_referrals_per_month: 5,
          referral_validity_days: 15,
          max_prize_cost: 12,
          super_prize_requirements: 3,
          super_prize_period_months: 2,
          max_super_prizes_per_period: 2,
          super_prize_product_name: "Hamburguesa + Milkshake Oreo",
          updated_at: Timestamp.now(),
          updated_by: 'system'
        }
        await setDoc(configRef, defaultConfig)
      }
      
      const updatedSnap = await getDoc(configRef)
      if (updatedSnap.exists()) {
        const data = updatedSnap.data()
        setConfig({ 
          id: updatedSnap.id, 
          ...data,
          updated_at: data.updated_at?.toDate() || new Date()
        } as RewardsConfig)
      }
    } catch (error) {
      console.error('Error initializing rewards config:', error)
    }
  }

  // Habilitar cliente en programa
  const enableCustomerRewards = async (customerId: string, referentPhone?: string, referentName?: string) => {
    setLoading(true)
    try {
      const customerRef = doc(db, 'customers', customerId)
      const customerSnap = await getDoc(customerRef)
      
      if (!customerSnap.exists()) {
        throw new Error('Cliente no encontrado')
      }
      
      const customerData = customerSnap.data() as Customer
      
      // Validar que el cliente tenga teléfono
      if (!customerData.phone || customerData.phone.trim() === '') {
        throw new Error('El cliente debe tener un número de teléfono para participar en el programa de premios')
      }
      
      const updateData: Partial<Customer> = {
        programa_referidos: true,
        puntos_compras: 0,
        puntos_referidos: 0,
        referidos: 0,
        terminos_condiciones: false,
        geolocalizacion_aceptada: false,
        fecha_habilitacion_premios: (await import('@/utils/timezone')).getLimaDate()
      }

      // Solo agregar campos opcionales si tienen valor
      if (referentPhone) {
        updateData.referente_cel = Number(referentPhone)
      }
      if (referentName) {
        updateData.referente_nombre = referentName
      }

      // Si tiene referente, buscar el ID
      if (referentPhone) {
        const customersQuery = query(
          collection(db, 'customers'),
          where('phone', '==', referentPhone),
          where('programa_referidos', '==', true)
        )
        const referentSnap = await getDocs(customersQuery)
        if (!referentSnap.empty) {
          updateData.referente_id = referentSnap.docs[0].id
        }
      }
      
      await updateDoc(customerRef, updateData)
      
      return true
    } catch (error) {
      return false
    } finally {
      setLoading(false)
    }
  }

  // Procesar puntos por compra
  const processPurchase = async (customerId: string, orderTotal: number, orderId: string, products: string[]) => {
    if (!config || orderTotal < config.min_purchase_amount) return false

    setLoading(true)
    try {
      const customerRef = doc(db, 'customers', customerId)
      const customerSnap = await getDoc(customerRef)
      
      if (!customerSnap.exists() || !customerSnap.data().programa_referidos) {
        return false
      }

      const customer = customerSnap.data() as Customer
      
      // Agregar punto por compra
      await updateDoc(customerRef, {
        puntos_compras: (customer.puntos_compras || 0) + config.points_per_purchase
      })

      // Registrar movimiento
      await addDoc(collection(db, 'rewards_movements'), {
        customer_id: customerId,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
        type: 'compra',
        points: config.points_per_purchase,
        order_id: orderId,
        order_total: orderTotal,
        products_consumed: products,
        created_at: Timestamp.now(),
        created_by: 'system'
      })

      // Procesar punto de referido si aplica
      await processReferralPoint(customer)

      return true
    } catch (error) {
      console.error('Error processing purchase:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Procesar punto de referido
  const processReferralPoint = async (customer: Customer) => {
    if (!customer.referente_id || !config) return

    const registrationDate = customer.createdAt
    const daysSinceRegistration = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceRegistration > config.referral_validity_days) return

    // Verificar si ya se otorgó punto por este referido
    const existingMovement = query(
      collection(db, 'rewards_movements'),
      where('customer_id', '==', customer.referente_id),
      where('referral_customer_id', '==', customer.id),
      where('type', '==', 'referido')
    )
    const movementSnap = await getDocs(existingMovement)
    if (!movementSnap.empty) return

    // Verificar límite mensual de referidos
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const monthlyReferrals = query(
      collection(db, 'rewards_movements'),
      where('customer_id', '==', customer.referente_id),
      where('type', '==', 'referido'),
      where('created_at', '>=', Timestamp.fromDate(currentMonth))
    )
    const monthlySnap = await getDocs(monthlyReferrals)
    
    if (monthlySnap.size >= config.max_referrals_per_month) return

    // Otorgar punto al referente
    const referentRef = doc(db, 'customers', customer.referente_id)
    const referentSnap = await getDoc(referentRef)
    
    if (referentSnap.exists()) {
      const referent = referentSnap.data() as Customer
      
      await updateDoc(referentRef, {
        puntos_referidos: (referent.puntos_referidos || 0) + 1,
        referidos: (referent.referidos || 0) + 1
      })

      // Registrar movimiento
      await addDoc(collection(db, 'rewards_movements'), {
        customer_id: customer.referente_id,
        customer_name: referent.name,
        customer_phone: referent.phone || '',
        type: 'referido',
        points: 1,
        referral_customer_id: customer.id,
        referral_customer_name: customer.name,
        created_at: Timestamp.now(),
        created_by: 'system'
      })
    }
  }

  // Buscar cliente por teléfono o nombre
  const searchCustomer = async (searchTerm: string): Promise<CustomerRewardsSearch | null> => {
    setLoading(true)
    try {
      let customerQuery
      
      // Obtener todos los clientes del programa y filtrar en memoria
      customerQuery = query(
        collection(db, 'customers'),
        where('programa_referidos', '==', true)
      )

      const customerSnap = await getDocs(customerQuery)
      
      // Filtrar por término de búsqueda
      let matchingCustomer = null
      for (const doc of customerSnap.docs) {
        const customerData = doc.data() as Customer
        const isPhoneMatch = /^\d+$/.test(searchTerm) && customerData.phone === searchTerm
        const isNameMatch = !/^\d+$/.test(searchTerm) && customerData.name.toLowerCase().includes(searchTerm.toLowerCase())
        
        if (isPhoneMatch || isNameMatch) {
          matchingCustomer = { id: doc.id, ...customerData }
          break
        }
      }
      
      if (!matchingCustomer) return null
      const customer = matchingCustomer
      
      // Obtener movimientos (sin orderBy para evitar índice compuesto)
      const movementsQuery = query(
        collection(db, 'rewards_movements'),
        where('customer_id', '==', customer.id)
      )
      const movementsSnap = await getDocs(movementsQuery)
      const movements = movementsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as RewardMovement[]
      // Ordenar en memoria
      movements.sort((a, b) => b.created_at.toDate().getTime() - a.created_at.toDate().getTime())

      // Obtener canjes (sin orderBy para evitar índice compuesto)
      const redemptionsQuery = query(
        collection(db, 'rewards_redemptions'),
        where('customer_id', '==', customer.id)
      )
      const redemptionsSnap = await getDocs(redemptionsQuery)
      const redemptions = redemptionsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as RewardRedemption[]
      // Ordenar en memoria
      redemptions.sort((a, b) => b.redeemed_at.toDate().getTime() - a.redeemed_at.toDate().getTime())

      // Buscar clientes que este cliente refirió
      const referredCustomersQuery = query(
        collection(db, 'customers'),
        where('referente_id', '==', customer.id)
      )
      const referredSnap = await getDocs(referredCustomersQuery)
      const referredCustomers = referredSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]
      
      // Calcular fechas de expiración para referidos sin compra
      const referralExpirations = referredCustomers
        .filter(ref => {
          // Verificar si ya hizo compra
          const hasMovement = movements.some(m => m.referral_customer_id === ref.id)
          return !hasMovement
        })
        .map(ref => {
          const registrationDate = new Date(ref.createdAt)
          const expirationDate = new Date(registrationDate)
          expirationDate.setDate(expirationDate.getDate() + (config?.referral_validity_days || 15))
          return {
            customer_name: ref.name,
            customer_phone: ref.phone,
            expiration_date: expirationDate
          }
        })
        .filter(exp => exp.expiration_date > new Date()) // Solo los que no han expirado

      const totalPoints = (customer.puntos_compras || 0) + (customer.puntos_referidos || 0)
      const canRedeem = config ? totalPoints >= config.points_for_prize : false

      return {
        customer,
        total_points: totalPoints,
        can_redeem: canRedeem,
        movements,
        redemptions,
        referred_customers: referredCustomers,
        referral_expirations: referralExpirations
      }
    } catch (error) {
      console.error('Error searching customer:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeConfig()
  }, [])

  return {
    loading,
    config,
    enableCustomerRewards,
    processPurchase,
    searchCustomer
  }
}