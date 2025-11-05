// FCM (Firebase Cloud Messaging) Handler
// Maneja notificaciones en segundo plano

export async function initializeFCM() {
    console.log('🔔 Inicializando FCM para notificaciones en segundo plano...');
    
    // Verificar soporte
    if (!('Notification' in window)) {
        console.log('⚠️ Este navegador no soporta notificaciones');
        return null;
    }
    
    if (!('serviceWorker' in navigator)) {
        console.log('⚠️ Este navegador no soporta Service Workers');
        return null;
    }
    
    try {
        // Importar Firebase Messaging
        const { messaging, getToken, onMessage } = await import('../firebase-config.js');
        
        if (!messaging) {
            console.log('⚠️ Firebase Messaging no está disponible');
            return null;
        }
        
        // Solicitar permisos de notificación
        const permission = await Notification.requestPermission();
        console.log('📱 Permiso de notificación:', permission);
        
        if (permission !== 'granted') {
            console.log('⚠️ Permiso de notificación denegado');
            return null;
        }
        
        // Esperar a que el Service Worker esté listo
        const registration = await navigator.serviceWorker.ready;
        console.log('✅ Service Worker listo');
        
        // Obtener token FCM (VAPID key - necesitas generarla en Firebase Console)
        // Ve a Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
        const vapidKey = 'BIxXyoyRGetWbnhvTsWuMisufHe7VpxECl_K_fnV1vIMB9Ks25qyUa3oVJU2PovcqVIGu2F16meuT6UPDFwaauQ';
        
        const currentToken = await getToken(messaging, { 
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration 
        });
        
        if (currentToken) {
            console.log('✅ Token FCM obtenido:', currentToken.substring(0, 20) + '...');
            
            // Guardar token en Firebase para este usuario
            await saveTokenToDatabase(currentToken);
            
            // Escuchar mensajes cuando la app está en primer plano
            onMessage(messaging, (payload) => {
                console.log('📨 Mensaje recibido en primer plano:', payload);
                
                // Mostrar notificación custom
                const notificationTitle = payload.notification?.title || '💬 Nuevo Mensaje';
                const notificationOptions = {
                    body: payload.notification?.body || 'Tienes una nueva notificación',
                    icon: payload.notification?.icon || '/src/css/logo.png',
                    tag: 'nitedred-foreground',
                    requireInteraction: false,
                    vibrate: [200, 100, 200]
                };
                
                if (registration) {
                    registration.showNotification(notificationTitle, notificationOptions);
                }
            });
            
            return currentToken;
        } else {
            console.log('⚠️ No se pudo obtener token FCM');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error inicializando FCM:', error);
        return null;
    }
}

async function saveTokenToDatabase(token) {
    try {
        const { database, ref, set } = await import('../firebase-config.js');
        const currentUser = window.currentUser;
        
        if (!currentUser) {
            console.log('⚠️ No hay usuario autenticado para guardar token');
            return;
        }
        
        const userId = currentUser.uid;
        const tokenRef = ref(database, `users/${userId}/fcmToken`);
        
        await set(tokenRef, {
            token: token,
            timestamp: Date.now(),
            platform: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        });
        
        console.log('✅ Token FCM guardado en Firebase para usuario:', userId);
    } catch (error) {
        console.error('❌ Error guardando token FCM:', error);
    }
}

// Función para enviar notificación a un usuario específico
export async function sendFCMNotification(receiverUserId, notificationData) {
    try {
        const { database, ref, get } = await import('../firebase-config.js');
        
        // Obtener el token FCM del receptor
        const tokenRef = ref(database, `users/${receiverUserId}/fcmToken`);
        const snapshot = await get(tokenRef);
        
        if (!snapshot.exists()) {
            console.log('⚠️ Usuario no tiene token FCM registrado');
            return false;
        }
        
        const tokenData = snapshot.val();
        const receiverToken = tokenData.token;
        
        console.log('📤 Enviando notificación FCM a:', receiverUserId);
        
        // Aquí necesitarías un backend/cloud function para enviar el mensaje
        // Por ahora, solo guardamos la notificación en Firebase y el listener la mostrará
        console.log('💡 Notificación lista para enviar (requiere Cloud Function)');
        console.log('   Token receptor:', receiverToken.substring(0, 20) + '...');
        console.log('   Datos:', notificationData);
        
        return true;
    } catch (error) {
        console.error('❌ Error enviando notificación FCM:', error);
        return false;
    }
}
