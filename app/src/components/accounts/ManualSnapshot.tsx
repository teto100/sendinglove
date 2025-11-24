'use client'

import { useState } from 'react'

export default function ManualSnapshot() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const triggerSnapshot = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/daily-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        if (data.updated) {
          setResult('🔄 Ya existía un registro para hoy - Actualizado exitosamente')
        } else {
          setResult('✅ Snapshot creado exitosamente')
        }
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setResult('❌ Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-medium mb-3">Snapshot Manual</h3>
      <button
        onClick={triggerSnapshot}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Generando...' : 'Crear Snapshot'}
      </button>
      {result && (
        <p className="mt-2 text-sm">{result}</p>
      )}
    </div>
  )
}