# Configuración de Notificaciones en Segundo Plano (FCM)

## ⚠️ IMPORTANTE: Pasos para activar notificaciones en background

Para que las notificaciones funcionen cuando el usuario tiene la app en segundo plano (navegador minimizado o usando otra app), necesitas configurar Firebase Cloud Messaging (FCM).

---

## 📋 Pasos de Configuración

### 1. Ir a Firebase Console
1. Abre [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **nitedcrypto-da32a**

### 2. Generar VAPID Key (Web Push Certificate)
1. En el menú lateral, haz click en **⚙️ Configuración del proyecto** (Project Settings)
2. Ve a la pestaña **☁️ Cloud Messaging**
3. Baja hasta la sección **Web Push certificates**
4. Haz click en **Generar par de claves** (Generate key pair)
5. **Copia la clave pública** que se genera (empieza con `B...`)

### 3. Agregar VAPID Key al código
1. Abre el archivo: `src/js/modules/fcm-handler.js`
2. En la **línea 36**, reemplaza:
   ```javascript
   const vapidKey = 'BKagOny0KF_2pCJQ3m....tu_clave_publica_aqui';
   ```
   Por:
   ```javascript
   const vapidKey = 'TU_CLAVE_VAPID_AQUI';  // La que copiaste del paso 2
   ```

### 4. Habilitar Firebase Cloud Messaging API
1. En Firebase Console, ve a **☁️ Cloud Messaging**
2. Si ves un botón que dice **"Enable"** o **"Habilitar"**, haz click
3. Esto activará la API de Cloud Messaging para tu proyecto

---

## 🚀 Cómo funcionan las notificaciones ahora

### Cuando la app está ABIERTA (primer plano):
✅ Usa el listener de Firebase Realtime Database (ya funciona)
✅ Muestra notificación inmediatamente
✅ Reproduce sonido (en PC)
✅ Vibra (en móvil)

### Cuando la app está EN SEGUNDO PLANO:
✅ El Service Worker escucha mensajes FCM
✅ Muestra notificación del sistema operativo
✅ Vibra en móviles
✅ Funciona incluso si el navegador está minimizado

---

## 📱 Prueba de Notificaciones en Segundo Plano

1. **En el dispositivo receptor:**
   - Abre la app y loguéate
   - Se pedirán permisos de notificación → **Permitir**
   - Se registrará el token FCM automáticamente
   - Minimiza el navegador o cambia de app

2. **En el dispositivo emisor:**
   - Envía un mensaje al receptor
   - El receptor debería recibir notificación incluso en segundo plano

---

## 🔧 Archivos Modificados

- ✅ `src/js/firebase-config.js` - Importa Firebase Messaging
- ✅ `src/js/modules/fcm-handler.js` - Maneja tokens y notificaciones FCM
- ✅ `src/js/app.js` - Inicializa FCM al hacer login
- ✅ `sw.js` - Service Worker con soporte FCM
- ✅ `index.html` - Registro correcto del Service Worker

---

## ⚠️ Limitaciones Actuales

Para enviar notificaciones FCM reales en segundo plano necesitas crear una **Cloud Function** en Firebase que envíe los mensajes push. Por ahora, el sistema:

1. ✅ Registra el token FCM del usuario
2. ✅ Guarda el token en Firebase Database
3. ✅ Escucha cambios en Firebase Database (tiempo real)
4. ⚠️ Falta: Cloud Function que envíe el mensaje FCM

**Sin Cloud Function:** Las notificaciones solo funcionan cuando la app está abierta (pero funciona en todas las pestañas)

**Con Cloud Function:** Las notificaciones funcionan incluso con la app completamente cerrada

---

## 🎯 Siguiente Paso Recomendado

Si quieres notificaciones 100% en background (app cerrada), necesitas crear una Cloud Function. Te puedo ayudar con eso en el siguiente paso.

Por ahora, con esta configuración:
- ✅ Notificaciones funcionan en tiempo real cuando la app está abierta
- ✅ Notificaciones funcionan en pestañas en segundo plano
- ✅ Vibración en móviles
- ✅ Sonido en PC
