const CACHE_NAME = 'product-images-v1'
const IMAGE_CACHE_NAME = 'images-cache-v1'

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/images/products/default.svg'
      ])
    })
  )
})

// Interceptar requests de imágenes
self.addEventListener('fetch', (event) => {
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
            // Si falla, devolver imagen por defecto
            return cache.match('/images/products/default.svg')
          })
        })
      })
    )
  }
})