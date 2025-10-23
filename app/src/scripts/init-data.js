// Script para inicializar datos de prueba
// Ejecutar: node src/scripts/init-data.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createTestUser() {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@fuentedesoda.com', 
      'admin123'
    );
    
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      email: 'admin@fuentedesoda.com',
      role: 'admin',
      name: 'Administrador',
      createdAt: new Date(),
      active: true
    });
    
    console.log('Usuario creado:');
    console.log('Email: admin@fuentedesoda.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestUser();