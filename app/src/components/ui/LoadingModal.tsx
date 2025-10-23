'use client'

interface LoadingModalProps {
  isOpen: boolean
  message?: string
}

export default function LoadingModal({ isOpen, message = 'Cargando...' }: LoadingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  )
}