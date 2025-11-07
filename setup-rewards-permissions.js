// Script para configurar permisos del módulo rewards en Firebase
// Ejecutar: node setup-rewards-permissions.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBqHGOJqJJJJJJJJJJJJJJJJJJJJJJJJJJ",
  authDomain: "sendingfuente.firebaseapp.com",
  projectId: "sendingfuente",
  storageBucket: "sendingfuente.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupRewardsPermissions() {
  try {
    const permissionsRef = doc(db, 'system', 'permissions');
    const permissionsSnap = await getDoc(permissionsRef);
    
    let currentPermissions = {};
    if (permissionsSnap.exists()) {
      currentPermissions = permissionsSnap.data();
    }

    // Agregar permisos para rewards
    const updatedPermissions = {
      ...currentPermissions,
      rolePermissions: {
        ...currentPermissions.rolePermissions,
        Root: {
          ...currentPermissions.rolePermissions?.Root,
          rewards: { read: true, create: true, update: true, delete: true }
        },
        Admin: {
          ...currentPermissions.rolePermissions?.Admin,
          rewards: { read: true, create: true, update: true, delete: true }
        },
        Manager: {
          ...currentPermissions.rolePermissions?.Manager,
          rewards: { read: true, create: true, update: true, delete: false }
        },
        Cajero: {
          ...currentPermissions.rolePermissions?.Cajero,
          rewards: { read: true, create: false, update: false, delete: false }
        },
        Usuario: {
          ...currentPermissions.rolePermissions?.Usuario,
          rewards: { read: false, create: false, update: false, delete: false }
        }
      }
    };

    await setDoc(permissionsRef, updatedPermissions);
    console.log('✅ Permisos de rewards configurados correctamente');
    
  } catch (error) {
    console.error('❌ Error configurando permisos:', error);
  }
}

setupRewardsPermissions();