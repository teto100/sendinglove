'use client'

interface LoadingModalProps {
  isOpen: boolean
  message?: string
}

export default function LoadingModal({ isOpen, message = 'Cargando...' }: LoadingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-700">{message}</span>
        </div>
      </div>
    </div>
  )
}