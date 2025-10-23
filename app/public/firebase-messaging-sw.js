importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración se carga dinámicamente desde el cliente
// No incluir credenciales hardcodeadas aquí
let firebaseConfig = null;

// Escuchar mensaje del cliente con la configuración
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    if (firebaseConfig) {
      firebase.initializeApp(firebaseConfig);
    }
  }
});

// Inicializar messaging solo cuando se reciba la configuración
let messaging = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_MESSAGING' && firebaseConfig) {
    messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/sending.jpg',
    badge: '/sending.jpg'
  };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
});