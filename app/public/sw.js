const CACHE_NAME = 'sending-app-v2'
const IMAGE_CACHE_NAME = 'images-cache-v1'

// Recursos esenciales para offline
const ESSENTIAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/images/products/default.svg',
  '/sending.jpg'
]

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ESSENTIAL_RESOURCES)
    })
  )
  self.skipWaiting()
})

// Activar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Interceptar todas las requests
self.addEventListener('fetch', (event) => {
  // Solo manejar requests GET
  if (event.request.method !== 'GET') {
    return
  }

  // Imágenes de productos
  if (event.request.url.includes('/images/products/')) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response
          }
          
          return fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone())
            }
            return fetchResponse
          }).catch(() => {
            return cache.match('/images/products/default.svg')
          })
        })
      })
    )
    return
  }

  // Páginas de la app
  if (event.request.url.includes(self.location.origin)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response
          }
          
          return fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone())
            }
            return fetchResponse
          }).catch(() => {
            // Si es una página, devolver la página principal
            if (event.request.mode === 'navigate') {
              return cache.match('/')
            }
            throw error
          })
        })
      })
    )
  }
})