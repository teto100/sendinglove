export interface Purchase {
  id: string
  productName: string
  measureType: 'units' | 'weight'
  quantity: number
  weight?: number
  portions?: number
  unitCost: number
  totalCost: number
  supplierId?: string
  supplierName: string
  expirationDate?: Date
  purchaseDate: Date
  category: string
  paymentMethod: 'Efectivo' | 'Yape' | 'Plin' | 'Transferencia'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreatePurchaseData {
  productName: string
  measureType: 'units' | 'weight'
  quantity: number
  weight?: number
  portions?: number
  unitCost: number
  supplierId?: string
  supplierName: string
  expirationDate?: Date
  category: string
  paymentMethod: 'Efectivo' | 'Yape' | 'Plin' | 'Transferencia'
  notes?: string
}