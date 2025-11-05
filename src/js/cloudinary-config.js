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
        maxImageWidth: 4096, // Soporta hasta 4K (3840x2160) y un poco más
        maxImageHeight: 4096,
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
        },
        // CRITICAL: Set high z-index to appear above modals
        zIndex: 99999
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
                thumbnail: result.info.thumbnail_url || null
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

    // Update create-post submit state if function exists
    if (typeof window.updateCreatePostState === 'function') {
        try { window.updateCreatePostState(); } catch {}
    }
}

// Allow other modules to set media (after a native upload)
function setExternalMedia(media) {
    currentUploadedMedia = media;
    showMediaPreview(media);
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
    
    // Force high z-index after opening
    setTimeout(() => {
        // Find all Cloudinary elements and force high z-index
        const cloudinaryElements = document.querySelectorAll('[class*="cloudinary"], [id*="cloudinary"], iframe[src*="cloudinary"]');
        cloudinaryElements.forEach(el => {
            el.style.zIndex = '99999';
            if (el.parentElement) {
                el.parentElement.style.zIndex = '99999';
            }
        });
        
        // Also check for any overlay divs
        const overlays = document.querySelectorAll('div[style*="position: fixed"], div[style*="position: absolute"]');
        overlays.forEach(overlay => {
            const bgStyle = window.getComputedStyle(overlay).backgroundColor;
            if (bgStyle.includes('rgba') && overlay.innerHTML.includes('cloudinary')) {
                overlay.style.zIndex = '99999';
            }
        });
    }, 100);
    
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
window.setExternalMedia = setExternalMedia;

// Add mutation observer to fix z-index when Cloudinary widget appears
if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // Check if it's a Cloudinary widget
                    if (node.className && typeof node.className === 'string' && 
                        (node.className.includes('cloudinary') || node.className.includes('upload'))) {
                        node.style.zIndex = '99999';
                    }
                    
                    // Check for iframes with Cloudinary
                    if (node.tagName === 'IFRAME' && node.src && node.src.includes('cloudinary')) {
                        node.style.zIndex = '99999';
                        if (node.parentElement) {
                            node.parentElement.style.zIndex = '99999';
                        }
                    }
                    
                    // Check children recursively
                    const iframes = node.querySelectorAll ? node.querySelectorAll('iframe[src*="cloudinary"]') : [];
                    iframes.forEach(iframe => {
                        iframe.style.zIndex = '99999';
                        if (iframe.parentElement) {
                            iframe.parentElement.style.zIndex = '99999';
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
