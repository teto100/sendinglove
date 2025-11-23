'use client'

import { useState, useEffect } from 'react'
import { collection, doc, updateDoc, deleteDoc, addDoc, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { db, auth } from '@/lib/firebase'
import { Product, CreateProductData } from '@/types/product'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState(false)
  const [firebaseUser] = useAuthState(auth)

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[]
      
      setProducts(productsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const refresh = async () => {
    // Auto-refresh con onSnapshot
  }

  const forceRefresh = async () => {
    // Auto-refresh con onSnapshot
  }

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
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setOperationLoading(false)
    }
  }

  return {
    products,
    loading: loading || operationLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    refresh,
    forceRefresh
  }
}