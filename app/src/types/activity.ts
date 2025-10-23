export type ActivityType = 
  | 'user_login' 
  | 'user_logout' 
  | 'user_created' 
  | 'user_updated' 
  | 'user_deleted'
  | 'product_created'
  | 'product_updated' 
  | 'product_deleted'
  | 'inventory_updated'
  | 'sale_created'
  | 'report_generated'

export interface Activity {
  id: string
  type: ActivityType
  userId: string
  userName: string
  userRole: string
  description: string
  metadata?: Record<string, any>
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface CreateActivityData {
  type: ActivityType
  description: string
  metadata?: Record<string, any>
}