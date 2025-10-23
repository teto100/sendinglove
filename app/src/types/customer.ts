export interface Customer {
  id: string
  name: string
  phone?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCustomerData {
  name: string
  phone?: string
}