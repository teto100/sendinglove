import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export function getAdminDb() {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin can only be used on server side')
  }
  
  console.log('🔑 Private key length:', process.env.FIREBASE_PRIVATE_KEY?.length)
  console.log('🔑 Private key starts with:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50))
  
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  console.log('🔑 Processed key starts with:', privateKey?.substring(0, 50))
  
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    })
  }
  
  return getFirestore()
}