export type UserRole = 'root' | 'admin' | 'manager' | 'cajero' | 'usuario'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: UserRole
}