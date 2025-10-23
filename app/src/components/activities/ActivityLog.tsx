'use client'

import { useActivities } from '@/hooks/useActivities'
import { ActivityType } from '@/types/activity'
import { colors } from '@/styles/colors'

const activityIcons: Record<ActivityType, string> = {
  user_login: '🔐',
  user_logout: '🚪',
  user_created: '👤',
  user_updated: '✏️',
  user_deleted: '🗑️',
  product_created: '📦',
  product_updated: '📝',
  product_deleted: '❌',
  inventory_updated: '📊',
  sale_created: '💰',
  report_generated: '📋'
}

const activityColors: Record<ActivityType, string> = {
  user_login: 'text-green-600',
  user_logout: 'text-gray-600',
  user_created: 'text-blue-600',
  user_updated: 'text-yellow-600',
  user_deleted: 'text-red-600',
  product_created: 'text-blue-600',
  product_updated: 'text-yellow-600',
  product_deleted: 'text-red-600',
  inventory_updated: 'text-purple-600',
  sale_created: 'text-green-600',
  report_generated: 'text-indigo-600'
}

export default function ActivityLog() {
  const { activities, loading } = useActivities(20)

  if (loading) {
    return <div className="p-4 text-center">Cargando actividades...</div>
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Registro de Actividades</h3>
        <p className="text-sm text-gray-500">Actividades recientes del sistema</p>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{activityIcons[activity.type]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.userName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <p className={`text-sm ${activityColors[activity.type]}`}>
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors.roles[activity.userRole as keyof typeof colors.roles] || 'bg-gray-100 text-gray-800'}`}>
                      {activity.userRole}
                    </span>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <span className="text-xs text-gray-400">
                        +{Object.keys(activity.metadata).length} detalles
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}