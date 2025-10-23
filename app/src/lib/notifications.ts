'use client'

import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import app from './firebase'

const messaging = typeof window !== 'undefined' ? getMessaging(app) : null

export const requestNotificationPermission = async () => {
  if (!messaging) return null
  
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      })
      return token
    }
    return null
  } catch (error) {
    return null
  }
}

export const onMessageListener = () => {
  if (!messaging) return Promise.resolve()
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })
}

export const sendStockAlert = async (productName: string, currentStock: number) => {
  // Esta función se llamará desde el servidor o cloud function
  const message = {
    notification: {
      title: '⚠️ Stock Bajo',
      body: `${productName} tiene solo ${currentStock} unidades restantes`
    },
    topic: 'stock-alerts'
  }
  
  // Implementar envío desde servidor
}