import { NextRequest, NextResponse } from 'next/server'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { customerId, acceptTerms } = await request.json()
    
    if (!customerId || !acceptTerms) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const customerRef = doc(db, 'customers', customerId)
    const customerSnap = await getDoc(customerRef)
    
    if (!customerSnap.exists()) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customerData = customerSnap.data()
    
    if (!customerData.programa_referidos) {
      return NextResponse.json({ error: 'Customer not enrolled in rewards program' }, { status: 400 })
    }

    // Activar programa de recompensas
    await updateDoc(customerRef, {
      terminos_condiciones: true,
      fecha_aceptacion_tyc: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Rewards program activated successfully' 
    })
  } catch (error) {
    console.error('Error activating rewards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}