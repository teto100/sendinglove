export type MeasureUnit = 'kg' | 'gr' | 'lt' | 'ml' | 'und' | 'balon' | 'min' | 'hr'

export const UNIT_CONVERSIONS: Record<MeasureUnit, { baseUnit: MeasureUnit; factor: number }> = {
  kg: { baseUnit: 'gr', factor: 1000 },
  gr: { baseUnit: 'gr', factor: 1 },
  lt: { baseUnit: 'ml', factor: 1000 },
  ml: { baseUnit: 'ml', factor: 1 },
  und: { baseUnit: 'und', factor: 1 },
  balon: { baseUnit: 'min', factor: 5400 }, // 30 días * 3 horas * 60 min
  min: { baseUnit: 'min', factor: 1 },
  hr: { baseUnit: 'min', factor: 60 }
}

export type IngredientCategory = 'carnes' | 'lacteos' | 'saborizantes' | 'harinas' | 'otros'

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  measureUnit: MeasureUnit
  totalCost: number
  measure: number
  unitCost: number
  baseUnit: MeasureUnit
  baseUnitCost: number
  createdAt: Date
  updatedAt: Date
}

export interface RecipeIngredient {
  ingredientId: string
  ingredientName: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface Recipe {
  id: string
  recipeName: string
  productName: string
  productId: string
  ingredients: RecipeIngredient[]
  totalCost: number
  createdAt: Date
  updatedAt: Date
}