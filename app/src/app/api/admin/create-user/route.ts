import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const auth = getAuth()
    
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    })


    return NextResponse.json({ 
      success: true, 
      uid: userRecord.uid 
    })
  } catch (error: any) {
    console.error('Firebase Admin error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}