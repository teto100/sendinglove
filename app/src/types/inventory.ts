export interface InventoryItem {
  id: string
  productId: string
  productName: string
  currentStock: number
  minStock: number
  maxStock: number
  lastUpdated: Date
  createdAt: Date
}

export interface InventoryMovement {
  id: string
  productId: string
  productName: string
  type: 'entrada' | 'salida'
  quantity: number
  reason: string
  previousStock: number
  newStock: number
  userId: string
  userName: string
  createdAt: Date
}

export interface CreateInventoryMovementData {
  productId: string
  type: 'entrada' | 'salida'
  quantity: number
  reason: string
}