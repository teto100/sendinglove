import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase connection...')
    
    // Test Firebase connection
    const testQuery = await getDocs(collection(db, 'accounts'))
    
    return NextResponse.json({ 
      success: true,
      message: 'Firebase connection successful',
      accountsCount: testQuery.docs.length,
      firebaseConfig: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      }
    })
  } catch (error) {
    console.error('Firebase test error:', error)
    return NextResponse.json({ 
      error: 'Firebase connection failed',
      details: error.message 
    }, { status: 500 })
  }
}