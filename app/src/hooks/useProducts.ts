'use client'

import { useState, useEffect } from 'react'
import { collection, doc, updateDoc, deleteDoc, addDoc, query, where, getDocs } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { Product, CreateProductData } from '@/types/product'
import { useCachedData } from './useCachedData'
import { VersionManager } from '@/utils/versionManager'
import { offlineStorage } from '@/lib/offlineStorage'
import { useOnlineStatus } from './useOnlineStatus'

export function useProducts() {
  const { data: products, loading, refresh, forceRefresh } = useCachedData<Product>('products', 'name')
  const [operationLoading, setOperationLoading] = useState(false)
  const [firebaseUser] = useAuthState(auth)
  const isOnline = useOnlineStatus()
  
  // Cachear productos cuando hay internet
  useEffect(() => {
    if (isOnline && products.length > 0) {
      offlineStorage.saveProducts(products)
    }
  }, [isOnline, products])

  const generateUniqueSKU = async (productName: string): Promise<string> => {
    const abbreviation = productName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3)
    
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    let sku = `${abbreviation}-${date}`
    
    // Verificar si el SKU ya existe
    const q = query(collection(db, 'products'), where('sku', '==', sku))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      // Si existe, agregar timestamp para hacerlo único
      const timestamp = Date.now().toString().slice(-4)
      sku = `${abbreviation}-${date}-${timestamp}`
    }
    
    return sku
  }

  const createProduct = async (productData: CreateProductData) => {
    try {
      setOperationLoading(true)
      
      // Generar SKU único
      const uniqueSKU = await generateUniqueSKU(productData.name)
      
      // Usar imagen local si se proporciona nombre de archivo
      const imageUrl = productData.imageName ? `/images/products/${productData.imageName}` : ''

      const docRef = await addDoc(collection(db, 'products'), {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        sku: uniqueSKU,
        categoryId: productData.categoryId,
        imageUrl,
        active: true,
        createdAt: new Date(),
        createdBy: firebaseUser?.uid || 'unknown',
        createdByName: firebaseUser?.email || 'Usuario',
        updatedAt: new Date(),
        updatedBy: firebaseUser?.uid || 'unknown',
        updatedByName: firebaseUser?.email || 'Usuario'
      })
      
      await VersionManager.updateVersion('products')
      return { success: true, id: docRef.id, sku: uniqueSKU }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      setOperationLoading(true)
      await updateDoc(doc(db, 'products', productId), {
        ...updates,
        updatedAt: new Date(),
        updatedBy: firebaseUser?.uid || 'unknown',
        updatedByName: firebaseUser?.email || 'Usuario'
      })
      await VersionManager.updateVersion('products')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      setOperationLoading(true)
      await deleteDoc(doc(db, 'products', productId))
      await VersionManager.updateVersion('products')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  const forceRefreshFromFirebase = async () => {
    // Limpiar cache local
    localStorage.removeItem('products_cache')
    localStorage.removeItem('products_version')
    offlineStorage.clearProducts()
    
    // Forzar refresh desde Firebase
    await forceRefresh()
  }

  return {
    products,
    loading: loading || operationLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    refresh,
    forceRefreshFromFirebase
  }
}