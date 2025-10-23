export interface SaleItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  subtotal: number
  extras: SaleExtra[]
}

export interface SaleExtra {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
}

export interface PaymentMethod {
  method: 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta' | 'Transferencia' | 'Transferencia Rappi'
  amount: number
  cashReceived?: number
  change?: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  orderType: 'Mesa' | 'Delivery Rappi' | 'Delivery Interno'
  paymentStatus: 'SIN PAGAR' | 'Pagado'
  orderStatus: 'Abierta' | 'Cerrada'
  paymentMethods: PaymentMethod[]
  // Mantener compatibilidad con versión anterior
  paymentMethod?: 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta' | 'Transferencia' | 'Transferencia Rappi'
  cashReceived?: number
  change?: number
  customerName?: string
  customerPhone?: string
  tableNumber?: string
  deliveryAddress?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy?: string
}

export interface CreateSaleData {
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  orderType: 'Mesa' | 'Delivery Rappi' | 'Delivery Interno'
  paymentStatus: 'SIN PAGAR' | 'Pagado'
  orderStatus: 'Abierta' | 'Cerrada'
  paymentMethods?: PaymentMethod[]
  // Mantener compatibilidad con versión anterior
  paymentMethod?: 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta' | 'Transferencia' | 'Transferencia Rappi'
  cashReceived?: number
  change?: number
  customerName?: string
  customerPhone?: string
  tableNumber?: string
  deliveryAddress?: string
}