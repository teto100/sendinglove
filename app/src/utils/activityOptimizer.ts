import { ActivityType } from '@/types/activity'

// Configuración de optimización
export const ACTIVITY_CONFIG = {
  // Límite de actividades por usuario por día
  MAX_ACTIVITIES_PER_USER_DAY: 20,
  
  // Actividades que NO se registran (para reducir escrituras)
  IGNORED_ACTIVITIES: [] as ActivityType[],
  
  // Retención de actividades (días)
  RETENTION_DAYS: 7,
  
  // Actividades críticas que siempre se registran
  CRITICAL_ACTIVITIES: ['user_created', 'user_deleted'] as ActivityType[]
}

// Función para determinar si se debe registrar una actividad
export function shouldLogActivity(
  type: ActivityType, 
  userId: string, 
  todayCount: number
): boolean {
  // Siempre registrar actividades críticas
  if (ACTIVITY_CONFIG.CRITICAL_ACTIVITIES.includes(type)) {
    return true
  }
  
  // No registrar si está en la lista de ignorados
  if (ACTIVITY_CONFIG.IGNORED_ACTIVITIES.includes(type)) {
    return false
  }
  
  // Limitar actividades por usuario por día
  if (todayCount >= ACTIVITY_CONFIG.MAX_ACTIVITIES_PER_USER_DAY) {
    return false
  }
  
  return true
}