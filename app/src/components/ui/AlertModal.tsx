'use client'

import { useEffect } from 'react'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
}

export default function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white p-6 rounded-lg shadow-2xl max-w-md mx-4 border-2 ${colors[type]}`}>
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{icons[type]}</span>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded-lg text-white transition-colors"
          style={{ backgroundColor: '#CF432B' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}