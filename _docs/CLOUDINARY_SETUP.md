# Configuración de Cloudinary Upload Preset

## 📋 Pasos para configurar el Upload Preset en Cloudinary

### 1. Ir a Cloudinary Dashboard
Ve a: https://cloudinary.com/console

### 2. Navegar a Settings (Configuración)
- Click en el icono de engranaje (⚙️) en la esquina superior derecha
- O ve directamente a: https://cloudinary.com/console/settings/upload

### 3. Crear Upload Preset
1. En la pestaña **Upload**, scroll hacia abajo hasta **Upload presets**
2. Click en **Add upload preset**
3. Configura el preset con estos valores:

#### Configuración Básica:
- **Preset name**: `nitedcrypto_posts`
- **Signing Mode**: **Unsigned** (importante para que funcione desde el frontend)
- **Folder**: `nitedcrypto/posts` (opcional, para organizar los archivos)

#### Configuración Avanzada (Opcional):
- **Allowed formats**: jpg, png, gif, webp, mp4, mov, avi, webm
- **Max file size**: 104857600 (100 MB)
- **Max image width**: 2000
- **Max image height**: 2000
- **Auto tagging**: `nitedcrypto, user_post`

### 4. Guardar
Click en **Save** al final de la página

### 5. Verificar
El preset `nitedcrypto_posts` debería aparecer en tu lista de Upload Presets

---

## ✅ Verificación

Una vez creado el preset, verifica que aparece en:
https://cloudinary.com/console/settings/upload#upload_presets

Busca el preset con el nombre: **nitedcrypto_posts**

---

## 🔒 Seguridad

El preset está configurado como **Unsigned** para permitir uploads desde el navegador.
Para mayor seguridad en producción, considera:

1. **Limitaciones de tamaño**: Ya configurado (100MB max)
2. **Formatos permitidos**: Solo imágenes y videos
3. **Moderation**: Puedes habilitar moderación automática en Cloudinary
4. **Upload Mapping**: Restricciones por dominio (configurable en Settings)

---

## 📝 Notas

- El Upload Preset ya está configurado en el código: `src/js/cloudinary-config.js`
- Cloud Name: `dtxn4kbpc` (ya configurado)
- No necesitas cambiar nada en el código, solo crear el preset en Cloudinary

---

## 🚀 Después de crear el preset

1. Recarga tu aplicación
2. Inicia sesión
3. Click en el botón "+" para crear un post
4. Click en los iconos de imagen/video
5. Se abrirá el widget de Cloudinary
6. ¡Sube tus archivos!
