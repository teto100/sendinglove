export interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
  categoryId: string
  imageUrl?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  active: boolean
  createdAt: Date
}

export interface CreateProductData {
  name: string
  description: string
  price: number
  sku: string
  categoryId: string
  imageName?: string
}