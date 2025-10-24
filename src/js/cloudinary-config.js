// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
    cloudName: 'dtxn4kbpc',
    uploadPreset: 'nitedcrypto_posts' // Necesitas crear este preset en Cloudinary
};

let currentUploadedMedia = null;

// Initialize Cloudinary Widget
function initCloudinaryWidget(resourceType = 'auto') {
    return cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        sources: ['local', 'url', 'camera'],
        showAdvancedOptions: false,
        cropping: false,
        multiple: false,
        resourceType: resourceType, // 'image', 'video', or 'auto'
        clientAllowedFormats: resourceType === 'image' ? ['png', 'jpg', 'jpeg', 'gif', 'webp'] : ['mp4', 'mov', 'avi', 'webm'],
        maxFileSize: 100000000, // 100MB for both images and videos
        maxImageWidth: 2000,
        maxImageHeight: 2000,
        theme: 'purple',
        styles: {
            palette: {
                window: '#1a1a2e',
                windowBorder: '#e91e63',
                tabIcon: '#e91e63',
                menuIcons: '#e91e63',
                textDark: '#ffffff',
                textLight: '#ffffff',
                link: '#e91e63',
                action: '#e91e63',
                inactiveTabIcon: '#9e9e9e',
                error: '#f44336',
                inProgress: '#9c27b0',
                complete: '#4caf50',
                sourceBg: '#2a2a3e'
            }
        }
    }, (error, result) => {
        if (!error && result && result.event === "success") {
            console.log('Upload successful:', result.info);
            
            currentUploadedMedia = {
                url: result.info.secure_url,
                publicId: result.info.public_id,
                resourceType: result.info.resource_type,
                format: result.info.format,
                width: result.info.width,
                height: result.info.height,
                thumbnail: result.info.thumbnail_url
            };
            
            // Show preview
            showMediaPreview(currentUploadedMedia);
            
            // Show toast notification
            if (window.showToast) {
                window.showToast('Archivo subido exitosamente! ✅');
            }
        } else if (error) {
            console.error('Upload error:', error);
            if (window.showToast) {
                window.showToast('Error al subir archivo ❌');
            }
        }
    });
}

// Show media preview in the modal
function showMediaPreview(media) {
    const preview = document.getElementById('media-preview');
    const previewContent = preview.querySelector('div');
    
    if (!preview || !previewContent) return;
    
    preview.classList.remove('hidden');
    
    if (media.resourceType === 'image') {
        previewContent.innerHTML = `
            <div class="relative">
                <img src="${media.url}" alt="Preview" class="w-full h-48 object-cover rounded-xl">
                <button type="button" onclick="removeMedia()" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    } else if (media.resourceType === 'video') {
        previewContent.innerHTML = `
            <div class="relative">
                <video src="${media.url}" class="w-full h-48 rounded-xl" controls></video>
                <button type="button" onclick="removeMedia()" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
}

// Remove uploaded media
function removeMedia() {
    currentUploadedMedia = null;
    const preview = document.getElementById('media-preview');
    if (preview) {
        preview.classList.add('hidden');
        preview.querySelector('div').innerHTML = `
            <i class="fas fa-image text-white text-3xl mb-2"></i>
            <p class="text-white text-sm">Imagen/Video seleccionado</p>
        `;
    }
}

// Open upload widget for specific media type
function openCloudinaryUpload(type = 'auto') {
    let resourceType = 'auto';
    
    if (type === 'image' || type === 'gif') {
        resourceType = 'image';
    } else if (type === 'video') {
        resourceType = 'video';
    }
    
    const widget = initCloudinaryWidget(resourceType);
    widget.open();
}

// Get current uploaded media
function getCurrentMedia() {
    return currentUploadedMedia;
}

// Clear current media (for when post is created)
function clearCurrentMedia() {
    currentUploadedMedia = null;
    removeMedia();
}

// Expose functions globally
window.openCloudinaryUpload = openCloudinaryUpload;
window.getCurrentMedia = getCurrentMedia;
window.clearCurrentMedia = clearCurrentMedia;
window.removeMedia = removeMedia;
