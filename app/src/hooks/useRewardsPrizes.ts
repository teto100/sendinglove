import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { RewardPrize, RewardRedemption, SuperPrizeControl } from '@/types/rewards'
import { Customer } from '@/types/customer'
import { Product } from '@/types/product'

export const useRewardsPrizes = () => {
  const [loading, setLoading] = useState(false)
  const [prizes, setPrizes] = useState<RewardPrize[]>([])

  // Obtener productos elegibles para premios (< S/12.00 precio de venta)
  const getEligibleProducts = async (): Promise<Product[]> => {
    try {
      const productsSnap = await getDocs(collection(db, 'products'))
      const allProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]
      const products = allProducts.filter(product => product.price < 12 && product.active)
      return products
    } catch (error) {
      console.error('Error getting eligible products:', error)
      return []
    }
  }

  // Crear premio
  const createPrize = async (productId: string, pointsRequired: number = 6) => {
    setLoading(true)
    try {
      const productRef = doc(db, 'products', productId)
      const productSnap = await getDoc(productRef)
      
      if (!productSnap.exists()) return false

      const product = productSnap.data() as Product
      
      if (product.price >= 12) {
        throw new Error('El producto debe tener precio de venta menor a S/12.00')
      }

      const prizeData: Omit<RewardPrize, 'id'> = {
        product_id: productId,
        product_name: product.name,
        product_cost: product.price,
        points_required: pointsRequired,
        is_active: true,
        is_super_prize: false,
        created_at: new Date(),
        created_by: 'admin'
      }

      await addDoc(collection(db, 'rewards_prizes'), prizeData)
      await loadPrizes()
      return true
    } catch (error) {
      console.error('Error creating prize:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Canjear premio
  const redeemPrize = async (customerId: string, prizeId: string, orderId?: string) => {
    setLoading(true)
    try {
      const customerRef = doc(db, 'customers', customerId)
      const customerSnap = await getDoc(customerRef)
      const prizeRef = doc(db, 'rewards_prizes', prizeId)
      const prizeSnap = await getDoc(prizeRef)

      if (!customerSnap.exists() || !prizeSnap.exists()) return false

      const customer = customerSnap.data() as Customer
      const prize = prizeSnap.data() as RewardPrize

      const totalPoints = (customer.puntos_compras || 0) + (customer.puntos_referidos || 0)
      
      if (totalPoints < prize.points_required) {
        throw new Error('Puntos insuficientes')
      }

      // Descontar puntos (primero de compras, luego de referidos)
      let pointsToDeduct = prize.points_required
      let newPuntosCompras = customer.puntos_compras || 0
      let newPuntosReferidos = customer.puntos_referidos || 0

      if (newPuntosCompras >= pointsToDeduct) {
        newPuntosCompras -= pointsToDeduct
      } else {
        pointsToDeduct -= newPuntosCompras
        newPuntosCompras = 0
        newPuntosReferidos -= pointsToDeduct
      }

      // Actualizar cliente
      await updateDoc(customerRef, {
        puntos_compras: newPuntosCompras,
        puntos_referidos: newPuntosReferidos
      })

      // Registrar canje
      const redemptionData: Omit<RewardRedemption, 'id'> = {
        customer_id: customerId,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
        prize_id: prizeId,
        prize_name: prize.product_name,
        prize_cost: prize.product_cost,
        points_used: prize.points_required,
        is_super_prize: false,
        order_id: orderId,
        redeemed_at: new Date(),
        redeemed_by: 'admin'
      }

      await addDoc(collection(db, 'rewards_redemptions'), redemptionData)

      // Registrar movimiento
      await addDoc(collection(db, 'rewards_movements'), {
        customer_id: customerId,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
        type: 'canje',
        points: -prize.points_required,
        prize_redeemed: prize.product_name,
        created_at: Timestamp.now(),
        created_by: 'admin'
      })

      // Verificar elegibilidad para super premio
      await checkSuperPrizeEligibility(customerId)

      return true
    } catch (error) {
      console.error('Error redeeming prize:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Verificar elegibilidad para super premio
  const checkSuperPrizeEligibility = async (customerId: string) => {
    try {
      const twoMonthsAgo = new Date()
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      const recentRedemptions = query(
        collection(db, 'rewards_redemptions'),
        where('customer_id', '==', customerId),
        where('is_super_prize', '==', false),
        where('redeemed_at', '>=', Timestamp.fromDate(twoMonthsAgo))
      )

      const redemptionsSnap = await getDocs(recentRedemptions)
      
      if (redemptionsSnap.size >= 3) {
        // Verificar si ya tiene control de super premio
        const controlQuery = query(
          collection(db, 'super_prizes_control'),
          where('customer_id', '==', customerId)
        )
        const controlSnap = await getDocs(controlQuery)

        if (controlSnap.empty) {
          // Crear control de super premio
          const controlData: Omit<SuperPrizeControl, 'id'> = {
            customer_id: customerId,
            customer_name: redemptionsSnap.docs[0].data().customer_name,
            redemptions_count: redemptionsSnap.size,
            period_start: twoMonthsAgo,
            period_end: new Date(),
            super_prizes_earned: 1,
            super_prizes_used: 0,
            last_redemption: new Date(),
            created_at: new Date()
          }

          await addDoc(collection(db, 'super_prizes_control'), controlData)
        }
      }
    } catch (error) {
      console.error('Error checking super prize eligibility:', error)
    }
  }

  // Cargar premios disponibles
  const loadPrizes = async () => {
    try {
      const prizesSnap = await getDocs(collection(db, 'rewards_prizes'))
      const allPrizes = prizesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RewardPrize[]
      const activePrizes = allPrizes.filter(prize => prize.is_active)
      const sortedPrizes = activePrizes.sort((a, b) => a.points_required - b.points_required)
      setPrizes(sortedPrizes)
    } catch (error) {
      console.error('Error loading prizes:', error)
    }
  }

  // Obtener estadísticas de premios
  const getPrizesStats = async () => {
    try {
      const redemptionsSnap = await getDocs(collection(db, 'rewards_redemptions'))
      const redemptions = redemptionsSnap.docs.map(doc => doc.data()) as RewardRedemption[]

      const totalRedeemed = redemptions.length
      const totalCost = redemptions.reduce((sum, r) => sum + r.prize_cost, 0)
      
      return {
        total_prizes_redeemed: totalRedeemed,
        total_cost_prizes: totalCost,
        average_cost_per_prize: totalRedeemed > 0 ? totalCost / totalRedeemed : 0
      }
    } catch (error) {
      console.error('Error getting prizes stats:', error)
      return {
        total_prizes_redeemed: 0,
        total_cost_prizes: 0,
        average_cost_per_prize: 0
      }
    }
  }

  useEffect(() => {
    loadPrizes()
  }, [])

  // Eliminar premio
  const deletePrize = async (prizeId: string) => {
    setLoading(true)
    try {
      await deleteDoc(doc(db, 'rewards_prizes', prizeId))
      await loadPrizes()
      return true
    } catch (error) {
      console.error('Error deleting prize:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    prizes,
    getEligibleProducts,
    createPrize,
    redeemPrize,
    deletePrize,
    loadPrizes,
    getPrizesStats
  }
}