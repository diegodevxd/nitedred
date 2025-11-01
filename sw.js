// Service Worker for Push Notifications
const CACHE_NAME = 'nitedcrypto-v1';

// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
const firebaseConfig = {
    apiKey: "AIzaSyBne6Zpr5qKLnNJr6SUEh4PGpdnGqyWPwo",
    authDomain: "nitedcrypto-da32a.firebaseapp.com",
    databaseURL: "https://nitedcrypto-da32a-default-rtdb.firebaseio.com",
    projectId: "nitedcrypto-da32a",
    storageBucket: "nitedcrypto-da32a.firebasestorage.app",
    messagingSenderId: "85577171483",
    appId: "1:85577171483:web:805aaa524d4727c4bb2ebe"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages from Firebase
messaging.onBackgroundMessage((payload) => {
    console.log('📱 Mensaje en segundo plano recibido:', payload);
    
    const notificationTitle = payload.notification?.title || '💬 Nuevo Mensaje';
    const notificationOptions = {
        body: payload.notification?.body || 'Tienes una nueva notificación',
        icon: payload.notification?.icon || '/src/css/logo.png',
        badge: '/src/css/logo.png',
        vibrate: [200, 100, 200],
        tag: 'nitedred-bg-notification',
        requireInteraction: false,
        data: payload.data || {}
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});


// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    let notificationData = {
        title: 'NITEDRED',
        body: 'Tienes una nueva notificación',
        icon: '/src/css/logo.png',
        badge: '/src/css/logo.png',
        vibrate: [200, 100, 200],
        data: {
            url: self.registration.scope
        }
    };
    
    // Parse notification data if available
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                ...data
            };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            vibrate: notificationData.vibrate,
            data: notificationData.data,
            requireInteraction: false,
            tag: 'nitedcrypto-notification'
        })
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (let client of clientList) {
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if not open
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url || '/');
                }
            })
    );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

async function syncMessages() {
    console.log('Syncing messages in background...');
    // This would sync any pending messages
}
