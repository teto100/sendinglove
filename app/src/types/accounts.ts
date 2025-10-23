export interface Account {
  id: string
  name: string
  type: 'efectivo' | 'yape' | 'bbva'
  balance: number
  initialBalance: number
  createdAt: Date
  updatedAt: Date
  updatedBy: string
  updatedByName: string
}

export interface AccountMovement {
  id: string
  accountId: string
  accountName: string
  type: 'ingreso' | 'egreso' | 'ajuste'
  amount: number
  previousBalance: number
  newBalance: number
  description: string
  source: 'venta' | 'compra' | 'gasto' | 'ajuste_manual' | 'inicial'
  sourceId?: string
  userId: string
  userName: string
  createdAt: Date
}

export interface CreateAccountMovementData {
  accountId: string
  type: 'ingreso' | 'egreso' | 'ajuste'
  amount: number
  description: string
  source: 'venta' | 'compra' | 'gasto' | 'ajuste_manual' | 'inicial'
  sourceId?: string
}