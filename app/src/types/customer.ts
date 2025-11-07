import { CustomerRewardsFields } from './rewards'

export interface Customer extends CustomerRewardsFields {
  id: string
  name: string
  phone?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCustomerData {
  name: string
  phone?: string
  // Campos opcionales para recompensas
  programa_referidos?: boolean
  referente_cel?: number
  referente_nombre?: string
}