export interface Supplier {
  id: string
  name: string
  contactName: string
  email?: string
  phone?: string
  address?: string
  ruc?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSupplierData {
  name: string
  contactName: string
  email?: string
  phone?: string
  address?: string
  ruc?: string
}