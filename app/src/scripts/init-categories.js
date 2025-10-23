// Ejecutar: node src/scripts/init-categories.js
require('dotenv').config({ path: '.env.local' })

const { initializeApp } = require('firebase/app')
const { getFirestore, collection, addDoc } = require('firebase/firestore')

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const categories = [
  { name: 'Bebidas', description: 'Jugos, gaseosas, aguas' },
  { name: 'Comidas', description: 'Platos principales y acompañamientos' },
  { name: 'Postres', description: 'Dulces y postres' },
  { name: 'Snacks', description: 'Aperitivos y bocadillos' },
  { name: 'Helados', description: 'Helados y productos congelados' }
]

async function createCategories() {
  try {
    for (const category of categories) {
      await addDoc(collection(db, 'categories'), {
        ...category,
        active: true,
        createdAt: new Date()
      })
      console.log(`✅ Categoría creada: ${category.name}`)
    }
    
    console.log('🎉 Todas las categorías creadas exitosamente')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  process.exit(0)
}

createCategories()