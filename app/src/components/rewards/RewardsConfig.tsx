'use client'

import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRewards } from '@/hooks/useRewards'
import { RewardsConfig as ConfigType } from '@/types/rewards'

export default function RewardsConfig() {
  const { config } = useRewards()
  const [formData, setFormData] = useState<Partial<ConfigType>>({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config) {
      setFormData(config)
    }
  }, [config])

  const handleSave = async () => {
    if (!config) return
    
    setLoading(true)
    try {
      const configRef = doc(db, 'rewards_config', 'default')
      await updateDoc(configRef, {
        ...formData,
        updated_at: new Date(),
        updated_by: 'admin'
      })
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ConfigType, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando configuración...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">⚙️ Configuración del Sistema</h2>
        {saved && (
          <div className="text-green-600 text-sm font-medium">
            ✅ Configuración guardada
          </div>
        )}
      </div>

      {/* Configuración de Puntos */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">⭐ Sistema de Puntos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compra mínima para puntos (S/)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.min_purchase_amount || 0}
              onChange={(e) => handleChange('min_purchase_amount', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Monto mínimo de compra para ganar puntos
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puntos por compra
            </label>
            <input
              type="number"
              value={formData.points_per_purchase || 0}
              onChange={(e) => handleChange('points_per_purchase', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puntos otorgados por cada compra válida
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puntos necesarios para premio
            </label>
            <input
              type="number"
              value={formData.points_for_prize || 0}
              onChange={(e) => handleChange('points_for_prize', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puntos requeridos para canjear un premio
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Costo máximo de premio (S/)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.max_prize_cost || 0}
              onChange={(e) => handleChange('max_prize_cost', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Costo máximo de productos elegibles como premio
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de Referidos */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">👥 Sistema de Referidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo referidos por mes
            </label>
            <input
              type="number"
              value={formData.max_referrals_per_month || 0}
              onChange={(e) => handleChange('max_referrals_per_month', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Límite de referidos que pueden otorgar puntos por mes
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días de validez del referido
            </label>
            <input
              type="number"
              value={formData.referral_validity_days || 0}
              onChange={(e) => handleChange('referral_validity_days', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Días que tiene el referido para hacer su primera compra
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de Super Premios */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">🌟 Super Premios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Premios requeridos para super premio
            </label>
            <input
              type="number"
              value={formData.super_prize_requirements || 0}
              onChange={(e) => handleChange('super_prize_requirements', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cantidad de premios canjeados para ganar super premio
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período en meses
            </label>
            <input
              type="number"
              value={formData.super_prize_period_months || 0}
              onChange={(e) => handleChange('super_prize_period_months', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Período en meses para evaluar elegibilidad
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo super premios por período
            </label>
            <input
              type="number"
              value={formData.max_super_prizes_per_period || 0}
              onChange={(e) => handleChange('max_super_prizes_per_period', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Límite de super premios por cliente en el período
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del super premio
            </label>
            <input
              type="text"
              value={formData.super_prize_product_name || ''}
              onChange={(e) => handleChange('super_prize_product_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Descripción del super premio
            </p>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <span>Guardando...</span>
          ) : (
            <>
              <span>💾</span>
              <span>Guardar Configuración</span>
            </>
          )}
        </button>
      </div>

      {/* Información */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Importante</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Los cambios en la configuración afectan inmediatamente a nuevas transacciones</li>
          <li>• Las transacciones anteriores mantienen las reglas con las que fueron procesadas</li>
          <li>• Se recomienda hacer cambios durante horarios de baja actividad</li>
        </ul>
      </div>
    </div>
  )
}