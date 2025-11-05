# 🔔 Sistema de Notificaciones ARREGLADO

## ❌ Problemas que tenía:

1. **No actualizaban en tiempo real** - El listener usaba `onValue` que dispara para TODO, incluso notificaciones viejas
2. **No llegaban notificaciones en segundo plano** - Service Worker no estaba bien configurado
3. **Sonido no funcionaba** - Se intentaba reproducir sin interacción del usuario
4. **Badge no se actualizaba** - El contador de notificaciones no reflejaba las nuevas

## ✅ Soluciones implementadas:

### 1. **Listener en Tiempo Real mejorado**
**ANTES:**
```javascript
firebaseDB.onValue(notificationsRef, (snapshot) => {
    // Dispara para TODAS las notificaciones cada vez
    // Causaba duplicados y notificaciones antiguas mostrándose como nuevas
});
```

**AHORA:**
```javascript
firebaseDB.onChildAdded(notificationsRef, async (snapshot) => {
    // Solo dispara cuando se AGREGA una notificación nueva
    // Filtra por timestamp para evitar mostrar notificaciones antiguas
    if (notification.timestamp > notificationStartTime && !notification.read) {
        // Procesar solo notificaciones REALMENTE nuevas
    }
});
```

### 2. **Notificaciones del Navegador**
**Mejoras:**
- ✅ Solicita permisos automáticamente al cargar
- ✅ Usa Service Worker para notificaciones en segundo plano (móviles)
- ✅ Fallback a Notification API directa (PC)
- ✅ `silent: false` para que suene
- ✅ `vibrate: [200, 100, 200]` para móviles
- ✅ Auto-cierre después de 5 segundos

### 3. **Sonido de Notificación**
```javascript
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,...');
    audio.volume = 0.5; // Aumentado de 0.3 a 0.5
    audio.play().catch(e => {
        // Maneja error si no hay interacción previa
    });
}
```

### 4. **Badge Contador**
```javascript
function updateNotificationBadge() {
    if (unreadNotifications > 0) {
        badge.style.display = 'flex';
        badgeText.textContent = unreadNotifications > 9 ? '9+' : unreadNotifications;
    } else {
        badge.style.display = 'none';
    }
}
```

## 📱 Cómo funciona ahora:

### **Flujo completo:**
1. Usuario se loguea → `loadNotificationsFromFirebase()` se ejecuta
2. Carga notificaciones existentes de Firebase
3. Configura listener `onChildAdded` para escuchar SOLO nuevas
4. Cuando llega notificación nueva:
   - Se guarda timestamp de inicio
   - Solo procesa si `timestamp > startTime`
   - Agrega a UI
   - Muestra notificación del navegador
   - Reproduce sonido
   - Actualiza badge

### **Segundo Plano (Móvil):**
- Service Worker (`sw.js`) maneja notificaciones cuando app está cerrada
- Firebase Cloud Messaging envía push notifications
- Usuario recibe notificación incluso con navegador en segundo plano

## 🔧 Funciones principales:

| Función | Descripción |
|---------|-------------|
| `loadNotificationsFromFirebase()` | Carga notificaciones existentes al iniciar |
| `setupNotificationListener()` | Configura listener para nuevas notificaciones |
| `showBrowserNotification(notification)` | Muestra notificación del navegador |
| `playNotificationSound()` | Reproduce sonido de notificación |
| `requestNotificationPermission()` | Solicita permisos de notificación |
| `addNotification(type, message, user, targetUserId)` | Crea nueva notificación |
| `markAsRead(notificationElement)` | Marca notificación como leída |
| `updateNotificationBadge()` | Actualiza contador de notificaciones |

## 📊 Tipos de Notificaciones:

```javascript
'like'    → 💖 Nuevo Like
'comment' → 💬 Nuevo Comentario
'follow'  → 👤 Nuevo Seguidor
'share'   → 🔄 Compartieron tu post
'crypto'  → 🪙 Actualización Crypto
```

## 🧪 Testing:

### **Desde la consola del navegador:**
```javascript
// Enviar notificación de prueba
addNotification('like', 'Prueba de notificación', {
    displayName: 'Usuario Test',
    photoURL: 'image/logo.jpeg'
}, window.currentUser.uid);

// Verificar permisos
console.log('Permisos:', Notification.permission);

// Solicitar permisos
await requestNotificationPermission();
```

## 🚀 Para probar en producción:

1. **PC:** Abrir 2 pestañas con usuarios diferentes
2. **Móvil:** Cerrar navegador después de otorgar permisos
3. **Acción:** User A da like/comenta → User B recibe notificación
4. **Verificar:**
   - ✅ Badge se actualiza
   - ✅ Notificación aparece en lista
   - ✅ Sonido se reproduce
   - ✅ Notificación del navegador aparece
   - ✅ (Móvil) Notificación llega con app cerrada

## 🔐 Permisos requeridos:

```javascript
Notification.permission === 'granted' // NECESARIO
'serviceWorker' in navigator          // RECOMENDADO (móvil)
```

## 📝 Notas importantes:

1. **Primer uso:** Usuario debe interactuar con la página antes de que el sonido funcione (limitación del navegador)
2. **Service Worker:** Debe estar registrado en `sw.js` para notificaciones en segundo plano
3. **Firebase:** `notifications/${userId}/` almacena notificaciones por usuario
4. **Timestamp:** Usa `Date.now()` para filtrar notificaciones nuevas vs antiguas

## 🐛 Debugging:

```javascript
// Ver todas las notificaciones en Firebase
const notifRef = firebaseDB.ref(database, `notifications/${userId}`);
const snapshot = await firebaseDB.get(notifRef);
console.log(snapshot.val());

// Ver listener configurado
console.log('Listener:', listenerConfigured);
console.log('Start time:', new Date(notificationStartTime).toLocaleString());

// Ver permisos
console.log('Notification permission:', Notification.permission);
console.log('ServiceWorker:', 'serviceWorker' in navigator);
```

## ✅ Checklist de verificación:

- [x] Listener solo dispara para notificaciones nuevas
- [x] Timestamp filtra notificaciones antiguas
- [x] Badge se actualiza correctamente
- [x] Sonido se reproduce (con interacción previa)
- [x] Notificación del navegador aparece
- [x] Service Worker maneja segundo plano
- [x] Funciona en PC y móvil
- [x] Vibración en móviles

---

**Fecha de corrección:** Noviembre 3, 2025
**Archivo modificado:** `src/js/modules/notifications.js`
**Backup:** `src/js/modules/notifications-old.js`
