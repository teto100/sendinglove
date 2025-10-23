'use client'

import { useState, useEffect } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

interface ProductImageProps {
  src?: string
  alt: string
  width?: number
  height?: number
  className?: string
}

// Cache de imágenes en memoria
const imageCache = new Map<string, string>()

export default function ProductImage({ 
  src, 
  alt, 
  width = 200, 
  height = 200, 
  className = "" 
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState('/images/products/default.svg')
  const isOnline = useOnlineStatus()
  
  useEffect(() => {
    if (!src || src === '') {
      setImageSrc('/images/products/default.svg')
      return
    }
    
    const fullPath = src.startsWith('/') ? src : `/images/products/${src}`
    
    // Verificar cache primero
    if (imageCache.has(fullPath)) {
      setImageSrc(imageCache.get(fullPath)!)
      return
    }
    
    // Intentar cargar imagen
    const img = new Image()
    img.onload = () => {
      imageCache.set(fullPath, fullPath)
      setImageSrc(fullPath)
    }
    img.onerror = () => {
      // Si falla, usar default y cachear el resultado
      imageCache.set(fullPath, '/images/products/default.svg')
      setImageSrc('/images/products/default.svg')
    }
    
    // En modo offline, usar directamente la ruta (las imágenes están en public)
    if (!isOnline) {
      setImageSrc(fullPath)
    } else {
      img.src = fullPath
    }
  }, [src, isOnline])
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      style={{ objectFit: 'cover' }}
    />
  )
}