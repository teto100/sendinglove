import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  console.log('=== Daily Snapshot API Called ===')
  
  try {
    // Verificar variables de entorno
    console.log('Checking environment variables...')
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    console.log('CRON_SECRET configured')

    // Verificar que sea una llamada de cron
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader)
    console.log('Expected:', `Bearer ${process.env.CRON_SECRET}`)
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('Authorization failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('Authorization successful')

    // Verificar conexión a Firebase Admin
    console.log('Checking Firebase Admin connection...')
    if (!adminDb) {
      console.error('Firebase Admin not initialized')
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }
    console.log('Firebase Admin connection OK')

    // Obtener fecha actual en Lima
    const now = new Date()
    const limaDate = new Date(now.getTime() - (5 * 60 * 60 * 1000)) // UTC-5
    const dateString = limaDate.toISOString().split('T')[0]

    // Verificar si ya existe snapshot para hoy
    const existingSnap = await adminDb.collection('daily_snapshots')
      .where('date', '==', dateString)
      .get()
    
    if (!existingSnap.empty) {
      return NextResponse.json({ 
        success: false, 
        message: 'Snapshot already exists for today' 
      })
    }

    // Obtener cuentas con saldo actual
    console.log('Fetching accounts from Firebase...')
    const accountsSnap = await adminDb.collection('accounts').get()
    const accounts = {}
    
    console.log(`Found ${accountsSnap.docs.length} accounts`)
    accountsSnap.docs.forEach(doc => {
      const data = doc.data()
      const accountName = data.name
      console.log(`Processing account: ${accountName}, balance: ${data.balance}`)
      if (['Efectivo', 'Yape', 'Cuenta BBVA'].includes(accountName)) {
        accounts[accountName] = Math.round((data.balance || 0) * 100) / 100
      }
    })
    
    console.log('Final accounts object:', accounts)

    // Guardar snapshot
    console.log('Saving snapshot to Firebase...')
    const docRef = await adminDb.collection('daily_snapshots').add({
      date: dateString,
      accounts,
      created_at: new Date(),
      created_by: 'cron-job'
    })
    
    console.log('Snapshot saved with ID:', docRef.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Daily snapshot completed successfully'
    })
  } catch (error) {
    console.error('=== ERROR in daily snapshot ===', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}