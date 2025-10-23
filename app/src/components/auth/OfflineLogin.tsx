'use client'

import { useState, useRef } from 'react'
import { offlineStorage } from '@/lib/offlineStorage'

interface OfflineLoginProps {
  onLogin: (userData: { name: string, photo: string }) => void
}

export default function OfflineLogin({ onLogin }: OfflineLoginProps) {
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      alert('No se pudo acceder a la cámara')
    }
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      
      const photoData = canvas.toDataURL('image/jpeg', 0.3) // Compresión
      setPhoto(photoData)
      setShowCamera(false)
      
      // Detener cámara
      const stream = video.srcObject as MediaStream
      stream?.getTracks().forEach(track => track.stop())
    }
  }

  const handleLogin = () => {
    if (!name.trim() || !photo) {
      alert('Completa nombre y foto')
      return
    }

    const userData = { name: name.trim(), photo }
    offlineStorage.saveOfflineUser(userData)
    onLogin(userData)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Sin Conexión</h2>
          <p className="text-gray-600 mt-2">Modo offline activado</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
            {!photo ? (
              <button
                onClick={startCamera}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400"
              >
                📷 Tomar Foto
              </button>
            ) : (
              <div className="text-center">
                <img src={photo} alt="Foto tomada" className="w-24 h-24 rounded-full mx-auto mb-2 object-cover" />
                <button
                  onClick={() => setPhoto(null)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Cambiar foto
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleLogin}
            disabled={!name.trim() || !photo}
            className={`w-full py-3 rounded-lg text-white ${
              name.trim() && photo 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continuar Offline
          </button>
        </div>

        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg">
              <video ref={videoRef} autoPlay className="w-80 h-60 rounded mb-4" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <button
                  onClick={takePhoto}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Capturar
                </button>
                <button
                  onClick={() => setShowCamera(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}