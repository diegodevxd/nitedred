# 🚀 Guía de Inicio Rápido - CryptoSocial con Firebase

## ⚡ Inicio en 3 Pasos

### 1️⃣ Iniciar Servidor Local
```powershell
.\start-server.ps1
```

### 2️⃣ Abrir en Navegador
```
http://localhost:8000/test-firebase.html
```

### 3️⃣ Probar Login con Google
- Click en "Login con Google"
- Selecciona tu cuenta
- ¡Listo! 🎉

---

## 🧪 Opciones de Prueba

### Opción A: Página de Prueba Simple
**Recomendado para verificar que Firebase funciona**

```
URL: http://localhost:8000/test-firebase.html
```

**Qué hace:**
- ✅ Muestra botón de login
- ✅ Muestra datos del usuario al autenticarse
- ✅ Permite cerrar sesión
- ✅ Útil para debugging

### Opción B: Aplicación Completa
**Para usar todas las funcionalidades**

```
URL: http://localhost:8000/index.html
```

**Qué hace:**
- ✅ Login con Google (Firebase real)
- ✅ Feed de posts
- ✅ Chat y mensajería
- ✅ Precios de criptomonedas
- ✅ Perfil de usuario

---

## 🛠️ Si No Tienes Python

### Método 1: Node.js
```powershell
# Instalar http-server globalmente
npm install -g http-server

# Ejecutar servidor
http-server -p 8000
```

### Método 2: VS Code Live Server
1. Instalar extensión "Live Server" en VS Code
2. Click derecho en `index.html`
3. Seleccionar "Open with Live Server"

### Método 3: PHP
```powershell
php -S localhost:8000
```

---

## ✅ Checklist de Verificación

Antes de probar, verifica que:

- [ ] Estás usando un servidor local (no file://)
- [ ] Firebase está configurado en Firebase Console
- [ ] Google Sign-In está habilitado en Firebase
- [ ] localhost está en dominios autorizados
- [ ] Tu navegador permite popups

---

## 🎯 Flujo de Prueba Recomendado

1. **Iniciar Servidor**
   ```powershell
   .\start-server.ps1
   ```

2. **Probar Firebase Aislado**
   - Ir a: `http://localhost:8000/test-firebase.html`
   - Click en "Login con Google"
   - Verificar que aparezcan tus datos

3. **Probar App Completa**
   - Ir a: `http://localhost:8000/index.html`
   - Click en "Continuar con Google"
   - Explorar las secciones de la app

4. **Verificar Persistencia**
   - Recargar la página (F5)
   - Deberías seguir logueado
   - Tu foto y nombre deben aparecer

5. **Probar Logout**
   - Ir a sección "Perfil"
   - Click en "Cerrar Sesión"
   - Deberías volver a la pantalla de login

---

## 🐛 Problemas Comunes

### ❌ "Failed to fetch"
**Solución:** Asegúrate de usar http://, no file://

### ❌ Popup bloqueado
**Solución:** Permite popups en la configuración del navegador

### ❌ "Auth domain not authorized"
**Solución:** 
1. Ve a Firebase Console
2. Authentication → Settings → Authorized domains
3. Agrega `localhost`

### ❌ Página en blanco
**Solución:** 
1. Abre la consola del navegador (F12)
2. Busca errores en rojo
3. Verifica que todos los archivos se carguen

---

## 📋 Comandos Útiles

### Ver usuario actual (en consola del navegador)
```javascript
firebase.auth().currentUser
```

### Forzar logout (en consola del navegador)
```javascript
firebase.auth().signOut()
```

### Ver estado de Firebase (en consola del navegador)
```javascript
console.log(firebase.auth())
```

---

## 🎓 Siguiente Nivel

Una vez que el login funcione, puedes:

1. **Integrar Firestore**
   - Guardar posts permanentemente
   - Sistema de likes persistente
   - Comentarios en tiempo real

2. **Agregar Web3**
   - Conectar MetaMask
   - Vincular wallet con cuenta
   - Mostrar balance de tokens

3. **Mejorar Chat**
   - Chat en tiempo real con Firestore
   - Notificaciones push
   - Mensajes multimedia

4. **Deploy a Producción**
   - Firebase Hosting
   - Configurar dominio personalizado
   - HTTPS automático

---

## 📞 Soporte

### Documentación
- `FIREBASE_SETUP.md` - Configuración detallada
- `FIREBASE_INTEGRATION.md` - Guía completa de integración
- `README.md` - Documentación general del proyecto

### Recursos Firebase
- [Firebase Console](https://console.firebase.google.com)
- [Documentación Oficial](https://firebase.google.com/docs)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

---

## ⚡ TL;DR (Too Long; Didn't Read)

```powershell
# 1. Iniciar servidor
.\start-server.ps1

# 2. Abrir navegador
# http://localhost:8000/test-firebase.html

# 3. Click en "Login con Google"

# 4. ¡Listo! 🎉
```

---

**¡Todo está listo para empezar a desarrollar! 🚀**

Última actualización: 23 de Octubre, 2025
