import { UserRole } from './user'

export type Module = 'users' | 'products' | 'inventory' | 'sales' | 'orders' | 'customers' | 'reports' | 'suppliers' | 'permissions' | 'purchases' | 'expenses' | 'cash-closing' | 'accounts' | 'kitchen'

export type Permission = 'read' | 'create' | 'update' | 'delete'

export type RolePermissions = {
  [key in Module]: Permission[]
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  root: {
    users: ['read', 'create', 'update', 'delete'],
    products: ['read', 'create', 'update', 'delete'],
    inventory: ['read', 'create', 'update', 'delete'],
    sales: ['read', 'create', 'update', 'delete'],
    orders: ['read', 'create', 'update', 'delete'],
    customers: ['read', 'create', 'update', 'delete'],
    reports: ['read', 'create', 'update', 'delete'],
    suppliers: ['read', 'create', 'update', 'delete'],
    permissions: ['read', 'create', 'update', 'delete'],
    purchases: ['read', 'create', 'update', 'delete'],
    expenses: ['read', 'create', 'update', 'delete'],
    'cash-closing': ['read'],
    accounts: ['read', 'create', 'update', 'delete'],
    kitchen: ['read', 'create', 'update', 'delete']
  },
  admin: {
    users: [],
    products: ['read', 'create', 'update', 'delete'],
    inventory: ['read', 'create', 'update', 'delete'],
    sales: ['read', 'create', 'update', 'delete'],
    orders: ['read', 'update', 'delete'],
    customers: ['read', 'create', 'update', 'delete'],
    reports: ['read', 'create', 'update', 'delete'],
    suppliers: ['read', 'create', 'update', 'delete'],
    permissions: [],
    purchases: ['read', 'create', 'update', 'delete'],
    expenses: ['read', 'create', 'update', 'delete'],
    'cash-closing': [],
    accounts: ['read', 'create', 'update'],
    kitchen: []
  },
  manager: {
    users: ['read'],
    products: ['read', 'create', 'update'],
    inventory: ['read', 'create', 'update'],
    sales: ['read', 'create', 'update'],
    orders: ['read', 'update'],
    customers: ['read', 'create', 'update'],
    reports: ['read', 'create'],
    suppliers: ['read', 'create', 'update'],
    permissions: [],
    purchases: ['read', 'create', 'update'],
    expenses: ['read', 'create', 'update'],
    'cash-closing': ['read'],
    accounts: ['read'],
    kitchen: ['read', 'create', 'update']
  },
  cajero: {
    users: [],
    products: ['read', 'create'],
    inventory: ['read'],
    sales: ['read', 'create', 'update'],
    orders: ['read', 'update'],
    customers: ['read'],
    reports: ['read'],
    suppliers: [],
    permissions: [],
    purchases: [],
    expenses: [],
    'cash-closing': [],
    accounts: [],
    kitchen: []
  },
  usuario: {
    users: [],
    products: ['read'],
    inventory: [],
    sales: ['read'],
    orders: ['read'],
    customers: ['read'],
    reports: [],
    suppliers: [],
    permissions: [],
    purchases: [],
    expenses: [],
    'cash-closing': [],
    accounts: [],
    kitchen: []
  }
}