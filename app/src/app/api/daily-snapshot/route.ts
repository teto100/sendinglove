import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    // Obtener cuentas actuales
    const adminDb = getAdminDb()
    const accountsSnapshot = await adminDb.collection('accounts').get()
    const accounts: { [key: string]: number } = {}
    
    accountsSnapshot.forEach(doc => {
      const data = doc.data()
      accounts[data.name] = parseFloat((data.balance || 0).toFixed(2))
    })

    // Crear snapshot con fecha de Lima
    const now = new Date()
    const limaDate = new Date(now.getTime() - (5 * 60 * 60 * 1000))
    const dateString = limaDate.toISOString().split('T')[0]

    // Verificar si ya existe un snapshot para hoy
    const existingSnapshot = await adminDb.collection('daily_snapshots')
      .where('date', '==', dateString)
      .limit(1)
      .get()

    if (!existingSnapshot.empty) {
      // Actualizar el snapshot existente
      const docId = existingSnapshot.docs[0].id
      await adminDb.collection('daily_snapshots').doc(docId).update({
        accounts,
        created_at: now,
        created_by: 'manual-trigger'
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Ya existía un registro para hoy - Actualizado exitosamente',
        date: dateString,
        accounts,
        updated: true
      })
    } else {
      // Crear nuevo snapshot
      await adminDb.collection('daily_snapshots').add({
        accounts,
        date: dateString,
        created_at: now,
        created_by: 'manual-trigger'
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Snapshot creado exitosamente',
        date: dateString,
        accounts,
        updated: false
      })
    }
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = getAdminDb()
    const accountsSnapshot = await adminDb.collection('accounts').get()
    const accounts: { [key: string]: number } = {}
    
    accountsSnapshot.forEach(doc => {
      const data = doc.data()
      accounts[data.name] = parseFloat((data.balance || 0).toFixed(2))
    })

    const now = new Date()
    const limaDate = new Date(now.getTime() - (5 * 60 * 60 * 1000))
    const dateString = limaDate.toISOString().split('T')[0]

    // Verificar si ya existe un snapshot para hoy
    const existingSnapshot = await adminDb.collection('daily_snapshots')
      .where('date', '==', dateString)
      .limit(1)
      .get()

    if (!existingSnapshot.empty) {
      // Actualizar el snapshot existente
      const docId = existingSnapshot.docs[0].id
      await adminDb.collection('daily_snapshots').doc(docId).update({
        accounts,
        created_at: now,
        created_by: 'cron-job'
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Daily snapshot updated successfully - record already existed',
        date: dateString,
        accounts,
        updated: true
      })
    } else {
      // Crear nuevo snapshot
      await adminDb.collection('daily_snapshots').add({
        accounts,
        date: dateString,
        created_at: now,
        created_by: 'cron-job'
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Daily snapshot completed successfully',
        date: dateString,
        accounts,
        updated: false
      })
    }
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}