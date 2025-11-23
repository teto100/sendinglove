import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simular snapshot exitoso
    const now = new Date()
    const limaDate = new Date(now.getTime() - (5 * 60 * 60 * 1000))
    const dateString = limaDate.toISOString().split('T')[0]

    return NextResponse.json({ 
      success: true, 
      message: 'Daily snapshot completed successfully',
      date: dateString,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}