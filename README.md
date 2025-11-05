# 🚀 CryptoSocial - Red Social de Criptomonedas

Una red social moderna enfocada en criptomonedas con funcionalidades de chat, noticias, y análisis de mercado en tiempo real.

## ✨ Características

### 📱 Red Social
- ✅ Posts con imágenes y videos (Cloudinary)
- ✅ Historias temporales (24h)
- ✅ Sistema de likes y comentarios
- ✅ Seguir/dejar de seguir usuarios
- ✅ Eliminar posts propios

### 👤 Perfil de Usuario
- ✅ Autenticación con Firebase (Google, Email)
- ✅ Editar perfil (bio, foto, enlaces sociales)
- ✅ Estadísticas en tiempo real (posts, seguidores, siguiendo)
- ✅ Portfolio de criptomonedas favoritas con precios en vivo
- ✅ Ver seguidores y siguiendo

### 💬 Chat en Tiempo Real
- ✅ Mensajes instantáneos con Firebase Realtime Database
- ✅ Indicadores de mensajes no leídos
- ✅ Iniciar chat con cualquier usuario

### 📊 Mercado Crypto
- ✅ Top 10 criptomonedas con precios en tiempo real
- ✅ Índice de Fear & Greed
- ✅ Capitalización de mercado global
- ✅ Gráficos interactivos (TradingView)
- ✅ Búsqueda de criptomonedas

### 📰 Noticias
- ✅ Noticias de crypto en tiempo real (CryptoPanic API)
- ✅ Filtros por categorías
- ✅ Vista de artículos completos

## 🛠️ Tecnologías

- **Frontend:** HTML5, Tailwind CSS, JavaScript (ES6+)
- **Backend/Database:** Firebase (Authentication, Realtime Database)
- **APIs:**
  - CoinGecko - Precios de criptomonedas
  - CryptoPanic - Noticias crypto
  - TradingView - Gráficos
  - Cloudinary - Upload de imágenes/videos
- **Iconos:** Font Awesome
- **Hosting:** Firebase Hosting (opcional)

## 📦 Estructura del Proyecto

```
nitedcrypto2/
├── index.html              # Página principal
├── src/
│   ├── css/
│   │   └── styles.css      # Estilos personalizados
│   └── js/
│       ├── app.js          # Lógica principal
│       └── modules/
│           └── profile.js  # Módulo de perfil
├── image/
│   └── logo.jpeg           # Logo de la app
└── README.md
```

## 🚀 Instalación y Uso

### Opción 1: Uso Directo (Abrir en navegador)

Simplemente abre `index.html` en tu navegador.

### Opción 2: Con Servidor Local (Recomendado para desarrollo)

```bash
# Python
python -m http.server 8000

# Node.js (con http-server)
npx http-server -p 8000
```

Luego abre: `http://localhost:8000`

## 🔧 Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** (Google y Email/Password)
3. Habilita **Realtime Database**
4. Copia tu configuración de Firebase
5. Reemplaza en `src/js/app.js`:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    databaseURL: "TU_DATABASE_URL",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};
```

## 🔐 Configuración de APIs

### Cloudinary
1. Regístrate en [Cloudinary](https://cloudinary.com/)
2. Crea un Upload Preset (unsigned)
3. Reemplaza en `src/js/app.js`:
```javascript
cloudName: 'TU_CLOUD_NAME',
uploadPreset: 'TU_UPLOAD_PRESET'
```

### APIs Públicas (No requieren configuración)
- CoinGecko API - Límite: 50 llamadas/minuto
- CryptoPanic API - Pública
- TradingView - Widget gratuito

## 📱 Funcionalidades Destacadas

### Sistema de Posts
- Crea posts con texto, imágenes o videos
- Sube media desde tu dispositivo o URL
- Sistema de likes con persistencia
- Comentarios en tiempo real
- Elimina tus propios posts

### Portfolio Crypto
- Agrega tus criptomonedas favoritas
- Ve precios actualizados en tiempo real
- Cambio de precio 24h
- Elimina cryptos del portfolio

### Chat
- Mensajes instantáneos
- Notificaciones de mensajes no leídos
- Historial de conversaciones
- Sincronización en tiempo real con Firebase

## 🎨 Diseño

- **Tema:** Dark mode con efectos glass morphism
- **Colores:** Gradientes purple/pink
- **Responsive:** Optimizado para mobile y desktop
- **Animaciones:** Transiciones suaves y efectos hover

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado con ❤️ para la comunidad crypto

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Siéntete libre de:
- Reportar bugs
- Sugerir nuevas funcionalidades
- Enviar pull requests

---

⭐ Si te gusta el proyecto, dale una estrella en GitHub!

## 🔥 Nuevas Características

### Firebase Authentication
- ✅ Login real con Google
- ✅ Persistencia de sesión
- ✅ Datos de usuario (nombre, email, foto)
- ✅ Logout funcional

### Inicio Rápido
```powershell
# Iniciar servidor local
.\start-server.ps1

# Probar Firebase
http://localhost:8000/test-firebase.html

# App completa
http://localhost:8000/index.html
```

## Estructura del Proyecto

```
nitedcrypto2/
│
├── index.html                 # Archivo HTML principal (limpio, sin CSS/JS embebido)
├── test-firebase.html         # Página de prueba de Firebase Authentication
├── start-server.ps1           # Script para iniciar servidor local
│
├── index.html.backup          # Respaldo del archivo original
├── index_old.html             # Versión antigua (antes de la limpieza)
│
├── README.md                  # Este archivo
├── QUICK_START.md             # Guía de inicio rápido
├── FIREBASE_SETUP.md          # Configuración detallada de Firebase
├── FIREBASE_INTEGRATION.md    # Documentación completa de integración
├── RESUMEN.md                 # Resumen de la separación de código
│
└── src/
    ├── css/
    │   └── styles.css         # Estilos CSS personalizados
    │
    └── js/
        ├── firebase-config.js # ⭐ Configuración de Firebase
        ├── app.js             # JavaScript principal (con Firebase integrado)
        │
        └── modules/
            ├── auth.js        # ⭐ Módulo de autenticación Firebase
            ├── chat.js        # Funcionalidad de chat y mensajería
            ├── crypto.js      # Gráficos y datos de criptomonedas
            ├── notifications.js # Sistema de notificaciones
            └── profile.js     # Gestión de perfil de usuario
```

## Archivos Creados

### CSS
- **`src/css/styles.css`**: Contiene todos los estilos personalizados incluyendo:
  - Gradientes de fondo
  - Efectos de cristal (glass effect)
  - Animaciones (pulse, slide-in)
  - Clases auxiliares (hover-scale, message-bubble, etc.)

### JavaScript

#### Archivo Principal
- **`src/js/app.js`**: Funcionalidad principal de la aplicación:
  - Autenticación (login con wallet, Google, registro)
  - Navegación entre secciones
  - Creación y gestión de posts
  - Sistema de likes
  - Generación de notificaciones aleatorias
  - Inicialización de la aplicación

#### Módulos

- **`src/js/modules/chat.js`**: Sistema de mensajería:
  - Gestión de chats individuales y grupales
  - Búsqueda de usuarios
  - Solicitudes de mensajes
  - Archivado de chats
  - Envío de mensajes con respuestas simuladas

- **`src/js/modules/crypto.js`**: Datos de criptomonedas:
  - Actualización de precios en tiempo real (simulado)
  - Índice de Miedo y Codicia
  - Gráficos de velas (candlestick charts)
  - Información de mercado (volumen, capitalización, etc.)
  - Soporte para múltiples criptomonedas (BTC, ETH, BNB, ADA, SOL)

- **`src/js/modules/notifications.js`**: Sistema de notificaciones:
  - Panel de notificaciones deslizable
  - Marcado de notificaciones como leídas
  - Contador de notificaciones no leídas
  - Tipos de notificaciones (likes, comentarios, seguimientos, etc.)

- **`src/js/modules/profile.js`**: Gestión de perfil:
  - Edición de perfil (nombre y biografía)
  - Actualización de datos de usuario

## Dependencias Externas

El proyecto utiliza las siguientes librerías CDN:
- **Tailwind CSS**: Framework de CSS para diseño responsive
- **Font Awesome 6.0**: Iconos vectoriales

## Cómo Usar

### Opción 1: Script de Inicio (Recomendado)
```powershell
.\start-server.ps1
```
Luego abre: `http://localhost:8000`

### Opción 2: Python Manual
```powershell
python -m http.server 8000
```
Luego abre: `http://localhost:8000`

### Opción 3: Node.js
```powershell
npx http-server -p 8000
```

### Opción 4: VS Code Live Server
1. Instalar extensión "Live Server"
2. Click derecho en `index.html` → "Open with Live Server"

**⚠️ Importante:** Firebase requiere un servidor HTTP. No funciona con `file://`

## Características Principales

- 🔐 **Autenticación Real**: Login con Google usando Firebase Authentication
- 🔥 **Firebase Integration**: Backend serverless para autenticación
- 📱 **Red Social**: Feed de posts, stories, likes y comentarios
- 💰 **Crypto Market**: Precios en tiempo real, gráficos y análisis
- 📰 **Noticias**: Sección de noticias sobre criptomonedas
- 💬 **Chat**: Mensajería instantánea con usuarios
- 👤 **Perfil**: Gestión de perfil personal con datos de Google
- 🔔 **Notificaciones**: Sistema de notificaciones en tiempo real

## Notas Técnicas

- El código JavaScript utiliza ES6 modules para Firebase
- Firebase Authentication configurado con Google Sign-In
- Los precios de criptomonedas se actualizan cada 5 segundos (simulado)
- El índice de Miedo y Codicia se actualiza cada 30 segundos
- Las notificaciones se generan aleatoriamente cada 15-30 segundos cuando hay un usuario logueado
- **Requiere servidor HTTP** para módulos ES6 y Firebase (no funciona con file://)

## Archivos de Respaldo

- `index.html.backup`: Copia exacta del archivo original antes de la separación
- `index_old.html`: Versión intermedia durante el proceso de limpieza

## Próximas Mejoras Sugeridas

1. ✅ ~~Integrar Firebase Authentication~~ **COMPLETADO**
2. Integrar Firestore para persistencia de datos
   - Guardar posts en base de datos
   - Sistema de likes persistente
   - Comentarios en tiempo real
3. Integrar Firebase Storage para multimedia
   - Subir imágenes de posts
   - Fotos de perfil personalizadas
4. Integrar Web3.js para conexión real con wallets
   - Conectar MetaMask
   - Vincular wallet con cuenta Firebase
   - Mostrar balance de tokens
5. Implementar backend con Cloud Functions
6. Añadir base de datos en tiempo real para chat
7. Implementar sistema de autenticación JWT
8. Añadir tests unitarios y de integración
9. Optimizar para producción (minificación, bundling)
10. Deploy a Firebase Hosting

---

**Fecha de reorganización**: Octubre 2025
**Versión**: 1.0
