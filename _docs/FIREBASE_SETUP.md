# Integración de Firebase Authentication

## 🔥 Firebase Configurado

Se ha integrado Firebase Authentication en la aplicación CryptoSocial para permitir login con Google real.

## 📦 Archivos Creados

### 1. `src/js/firebase-config.js`
Archivo de configuración de Firebase que:
- Inicializa la app de Firebase con las credenciales
- Exporta los servicios de autenticación
- Configura el proveedor de Google

### 2. `src/js/modules/auth.js`
Módulo de autenticación que incluye:
- `initializeAuth()` - Observador del estado de autenticación
- `signInWithGoogle()` - Login con Google
- `signOutUser()` - Cerrar sesión
- `getCurrentUser()` - Obtener usuario actual
- `isAuthenticated()` - Verificar si hay sesión activa
- `updateUserUI()` - Actualizar UI con datos del usuario

## 🔧 Cambios Realizados

### En `index.html`:
```html
<!-- Se agregaron módulos ES6 de Firebase -->
<script type="module" src="src/js/firebase-config.js"></script>
<script type="module" src="src/js/modules/auth.js"></script>
<script type="module" src="src/js/app.js"></script>
```

### En `app.js`:
- Se agregó `initFirebaseAuth()` para inicializar Firebase
- Se modificó `loginWithGoogle()` para usar Firebase real
- Se modificó `logout()` para usar Firebase signOut
- Mantiene fallback en modo simulación si Firebase falla

## 🚀 Cómo Funciona

### Login con Google:
1. Usuario hace clic en "Continuar con Google"
2. Se abre popup de Google Authentication
3. Usuario selecciona su cuenta de Google
4. Firebase valida y retorna los datos del usuario:
   - UID (identificador único)
   - Nombre
   - Email
   - Foto de perfil
5. La app actualiza el estado y muestra la sección Home

### Observador de Estado:
```javascript
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario autenticado
        currentUser = { ...datos del usuario }
        updateUserUI();
    } else {
        // Usuario no autenticado
        currentUser = null;
    }
});
```

### Cerrar Sesión:
1. Usuario hace clic en "Cerrar Sesión"
2. Firebase cierra la sesión
3. El observador detecta el cambio
4. Se limpia currentUser y se muestra login

## 📋 Configuración de Firebase

### Proyecto Firebase:
- **Nombre**: nitedcrypto
- **Auth Domain**: nitedcrypto-da32a.firebaseapp.com
- **Project ID**: nitedcrypto-da32a

### Métodos de Autenticación Habilitados:
- ✅ Google (configurado)
- ⏳ Email/Password (pendiente)
- ⏳ Anonymous (pendiente)

## ⚙️ Configuración Necesaria en Firebase Console

Para que funcione correctamente, debes:

1. **Habilitar Google Sign-In:**
   - Ve a Firebase Console → Authentication → Sign-in method
   - Habilita "Google"
   - Configura el email de soporte

2. **Configurar Dominios Autorizados:**
   - En Authentication → Settings → Authorized domains
   - Agrega: `localhost` (para desarrollo)
   - Agrega tu dominio de producción cuando despliegues

3. **Verificar Configuración:**
   ```javascript
   // Tus credenciales (ya configuradas):
   apiKey: "AIzaSyBne6Zpr5qKLnNJr6SUEh4PGpdnGqyWPwo"
   authDomain: "nitedcrypto-da32a.firebaseapp.com"
   projectId: "nitedcrypto-da32a"
   ```

## 🌐 Uso en Desarrollo Local

### Opción 1: Servidor Local
```powershell
# Instalar servidor HTTP simple
npm install -g http-server

# Ejecutar en el directorio del proyecto
http-server -p 8080

# Abrir en navegador
# http://localhost:8080
```

### Opción 2: Live Server (VS Code)
1. Instalar extensión "Live Server"
2. Click derecho en `index.html`
3. Seleccionar "Open with Live Server"

### ⚠️ Importante:
Firebase no funciona con el protocolo `file://`. Debes usar un servidor local (http://).

## 🔐 Datos del Usuario Disponibles

Después del login exitoso, tienes acceso a:

```javascript
currentUser = {
    uid: "abc123...",           // ID único de Firebase
    name: "Juan Pérez",         // Nombre completo
    email: "juan@gmail.com",    // Email
    photoURL: "https://...",    // URL de foto de perfil
    provider: "google"          // Proveedor de autenticación
}
```

## 📱 Actualización Automática de UI

El módulo auth actualiza automáticamente:
- ✅ Nombre de usuario en el perfil
- ✅ Foto de perfil en el header
- ✅ Email en configuraciones
- ✅ Formulario de edición de perfil

## 🛡️ Seguridad

### Reglas Implementadas:
- Token de autenticación se maneja automáticamente
- Sesión se mantiene entre recargas de página
- Logout completo limpia todos los datos

### Próximas Mejoras de Seguridad:
- [ ] Implementar Firestore con reglas de seguridad
- [ ] Validación de email antes de acceder
- [ ] Rate limiting para prevenir spam
- [ ] Refresh tokens automáticos

## 🔄 Flujo Completo de Autenticación

```
1. App carga → initFirebaseAuth()
2. Firebase verifica token guardado
3. Si hay sesión válida → auto-login
4. Si no hay sesión → mostrar pantalla login
5. Usuario hace click en Google
6. Popup de Google → usuario selecciona cuenta
7. Firebase valida credenciales
8. onAuthStateChanged detecta cambio
9. currentUser se actualiza
10. UI se actualiza automáticamente
11. Usuario ve su feed
```

## 🐛 Troubleshooting

### Error: "Firebase not defined"
- Verifica que estés usando un servidor local (no file://)
- Revisa la consola de desarrollador

### Error: "Auth domain not authorized"
- Ve a Firebase Console → Authentication → Settings
- Agrega tu dominio a "Authorized domains"

### Error: "Popup blocked"
- El navegador bloqueó el popup de Google
- Permite popups para localhost en la configuración del navegador

### Login no funciona:
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica que todos los scripts se carguen correctamente

## 📊 Próximos Pasos

1. **Firestore Integration:**
   - Guardar posts de usuarios
   - Sistema de likes persistente
   - Chat en tiempo real

2. **Wallet Integration:**
   - Conectar MetaMask
   - Vincular wallet con cuenta Firebase
   - Transacciones blockchain

3. **Social Features:**
   - Seguir/dejar de seguir usuarios
   - Comentarios en posts
   - Notificaciones push

4. **Storage:**
   - Subir imágenes de perfil
   - Posts con multimedia
   - Archivos compartidos

## 📝 Notas de Desarrollo

- Firebase SDK v10.7.1 (cargado desde CDN)
- Modo ES6 modules para mejor organización
- Fallback a modo simulación si Firebase falla
- Compatible con todos los navegadores modernos

---

**Fecha de Integración**: 23 de Octubre, 2025
**Versión Firebase**: 10.7.1
**Estado**: ✅ Funcional
