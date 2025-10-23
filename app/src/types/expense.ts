export interface Expense {
  id: string
  type: 'Alquiler' | 'Agua' | 'Luz' | 'Internet' | 'Banco' | 'Contadora' | 'Facturación' | 'Sunat + Essalud' | 'AFP' | 'Otros'
  customType?: string
  amount: number
  paymentDate: Date
  dueDate: Date
  paymentMethod: 'Efectivo' | 'Yape' | 'Plin' | 'Transferencia'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateExpenseData {
  type: 'Alquiler' | 'Agua' | 'Luz' | 'Internet' | 'Banco' | 'Contadora' | 'Facturación' | 'Sunat + Essalud' | 'AFP' | 'Otros'
  customType?: string
  amount: number
  paymentDate: Date
  dueDate: Date
  paymentMethod: 'Efectivo' | 'Yape' | 'Plin' | 'Transferencia'
  notes?: string
}