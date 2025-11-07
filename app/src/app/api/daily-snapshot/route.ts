import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    // Verificar que sea una llamada de cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener fecha actual en Lima
    const now = new Date()
    const limaDate = new Date(now.getTime() - (5 * 60 * 60 * 1000)) // UTC-5
    const dateString = limaDate.toISOString().split('T')[0]

    // Verificar si ya existe snapshot para hoy
    const existingQuery = query(
      collection(db, 'daily_snapshots'),
      where('date', '==', dateString)
    )
    const existingSnap = await getDocs(existingQuery)
    
    if (!existingSnap.empty) {
      return NextResponse.json({ message: 'Snapshot already exists for today' })
    }

    // Obtener cuentas
    const accountsSnap = await getDocs(collection(db, 'accounts'))
    const accounts = {}
    
    accountsSnap.docs.forEach(doc => {
      const data = doc.data()
      const accountName = data.name
      if (['Efectivo', 'Yape', 'Cuenta BBVA'].includes(accountName)) {
        accounts[accountName] = data.initialBalance || 0
      }
    })

    // Guardar snapshot
    await addDoc(collection(db, 'daily_snapshots'), {
      date: dateString,
      accounts,
      created_at: new Date(),
      created_by: 'cron-job'
    })

    return NextResponse.json({ 
      success: true, 
      date: dateString,
      accounts 
    })
  } catch (error) {
    console.error('Error in daily snapshot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}