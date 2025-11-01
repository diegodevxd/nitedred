/**
 * Features Module - Stories, Sharing & Theme System
 */

import { firebaseDB } from '../firebase-config.js';

// Global variables
let currentSharePostId = null;
let currentStoryIndex = 0;
let currentStoriesArray = [];
let storyProgressInterval = null;

/**
 * THEME SYSTEM
 */

// Initialize theme system
function initializeTheme() {
    const savedTheme = localStorage.getItem('nitedred-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Toggle theme
window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Add switching animation
    document.body.classList.add('theme-switching');
    
    setTimeout(() => {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('nitedred-theme', newTheme);
        updateThemeIcon(newTheme);
        
        setTimeout(() => {
            document.body.classList.remove('theme-switching');
        }, 300);
    }, 150);
};

// Update theme icon
function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun text-xl' : 'fas fa-moon text-xl';
    }
}

/**
 * SHARING SYSTEM
 */

// Show share modal
window.showShareModal = function(postId) {
    currentSharePostId = postId;
    document.getElementById('share-modal').classList.remove('hidden');
};

// Hide share modal
window.hideShareModal = function() {
    document.getElementById('share-modal').classList.add('hidden');
    currentSharePostId = null;
};

// Simple repost (without comment)
window.repostContent = async function() {
    if (!currentSharePostId) return;
    
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        // Get original post
        const postRef = firebaseDB.ref(firebaseDB.database, `posts/${currentSharePostId}`);
        const snapshot = await firebaseDB.get(postRef);
        
        if (!snapshot.exists()) {
            window.showToast?.('Post no encontrado', 'error');
            return;
        }
        
        const originalPost = snapshot.val();
        
        // Create repost
        const repostData = {
            type: 'repost',
            originalPostId: currentSharePostId,
            originalAuthor: originalPost.userName,
            content: originalPost.content,
            mediaURL: originalPost.mediaURL,
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
            userPhoto: currentUser.photoURL || '',
            timestamp: Date.now(),
            isRepost: true
        };
        
        // Save repost
        const repostsRef = firebaseDB.ref(firebaseDB.database, 'posts');
        const newRepostRef = firebaseDB.push(repostsRef);
        await firebaseDB.set(newRepostRef, repostData);
        
        // Update share count
        await updateShareCount(currentSharePostId);
        
        hideShareModal();
        window.showToast?.('¡Post reposteado!', 'success');
        
        // Reload feed if on home section
        if (window.currentSection === 'home') {
            setTimeout(() => window.loadSavedPosts?.(), 500);
        }
        
    } catch (error) {
        console.error('Error reposteando:', error);
        window.showToast?.('Error al repostear', 'error');
    }
};

// Show quote modal
window.showQuoteModal = async function() {
    if (!currentSharePostId) return;
    
    try {
        // Load original post for preview
        const postRef = firebaseDB.ref(firebaseDB.database, `posts/${currentSharePostId}`);
        const snapshot = await firebaseDB.get(postRef);
        
        if (snapshot.exists()) {
            const post = snapshot.val();
            const preview = document.getElementById('quote-preview');
            
            preview.innerHTML = `
                <div class="flex items-start">
                    <div class="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mr-2">
                        <span class="text-white text-sm font-bold">${(post.userName || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="flex-1">
                        <div class="text-white text-sm font-semibold">${post.userName || 'Usuario'}</div>
                        <div class="text-white text-opacity-80 text-sm mt-1">${(post.content || '').substring(0, 100)}${(post.content || '').length > 100 ? '...' : ''}</div>
                    </div>
                </div>
            `;
        }
        
        hideShareModal();
        document.getElementById('quote-modal').classList.remove('hidden');
        document.getElementById('quote-content').focus();
        
    } catch (error) {
        console.error('Error loading quote preview:', error);
    }
};

// Hide quote modal
window.hideQuoteModal = function() {
    document.getElementById('quote-modal').classList.add('hidden');
    document.getElementById('quote-content').value = '';
};

// Submit quote repost
window.submitQuoteRepost = async function(event) {
    event.preventDefault();
    
    const content = document.getElementById('quote-content').value.trim();
    if (!content) {
        window.showToast?.('Agrega un comentario', 'error');
        return;
    }
    
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        // Get original post
        const postRef = firebaseDB.ref(firebaseDB.database, `posts/${currentSharePostId}`);
        const snapshot = await firebaseDB.get(postRef);
        
        if (!snapshot.exists()) {
            window.showToast?.('Post no encontrado', 'error');
            return;
        }
        
        const originalPost = snapshot.val();
        
        // Create quote repost
        const quoteData = {
            type: 'quote',
            content: content,
            originalPostId: currentSharePostId,
            originalPost: {
                content: originalPost.content,
                userName: originalPost.userName,
                mediaURL: originalPost.mediaURL
            },
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
            userPhoto: currentUser.photoURL || '',
            timestamp: Date.now(),
            isQuote: true
        };
        
        // Save quote repost
        const postsRef = firebaseDB.ref(firebaseDB.database, 'posts');
        const newPostRef = firebaseDB.push(postsRef);
        await firebaseDB.set(newPostRef, quoteData);
        
        // Update share count
        await updateShareCount(currentSharePostId);
        
        hideQuoteModal();
        window.showToast?.('¡Quote repost publicado!', 'success');
        
        // Reload feed
        if (window.currentSection === 'home') {
            setTimeout(() => window.loadSavedPosts?.(), 500);
        }
        
    } catch (error) {
        console.error('Error publicando quote:', error);
        window.showToast?.('Error al publicar', 'error');
    }
};

// Copy post link
window.copyPostLink = function() {
    const baseUrl = window.location.hostname === 'diegodevxd.github.io' 
        ? 'https://diegodevxd.github.io/nitedred' 
        : window.location.origin;
    
    const postUrl = `${baseUrl}?post=${currentSharePostId}`;
    
    navigator.clipboard.writeText(postUrl).then(() => {
        window.showToast?.('¡Enlace copiado!', 'success');
        hideShareModal();
    }).catch(() => {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        window.showToast?.('¡Enlace copiado!', 'success');
        hideShareModal();
    });
};

// Share to external platforms
window.shareToTwitter = function() {
    const baseUrl = window.location.hostname === 'diegodevxd.github.io' 
        ? 'https://diegodevxd.github.io/nitedred' 
        : window.location.origin;
    
    const postUrl = `${baseUrl}?post=${currentSharePostId}`;
    const text = encodeURIComponent('Mira este post en NITEDRED 🚀');
    
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(postUrl)}`, '_blank');
    hideShareModal();
};

window.shareToTelegram = function() {
    const baseUrl = window.location.hostname === 'diegodevxd.github.io' 
        ? 'https://diegodevxd.github.io/nitedred' 
        : window.location.origin;
    
    const postUrl = `${baseUrl}?post=${currentSharePostId}`;
    const text = encodeURIComponent('Mira este post en NITEDRED 🚀');
    
    window.open(`https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${text}`, '_blank');
    hideShareModal();
};

window.shareToWhatsApp = function() {
    const baseUrl = window.location.hostname === 'diegodevxd.github.io' 
        ? 'https://diegodevxd.github.io/nitedred' 
        : window.location.origin;
    
    const postUrl = `${baseUrl}?post=${currentSharePostId}`;
    const text = encodeURIComponent(`Mira este post en NITEDRED 🚀 ${postUrl}`);
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
    hideShareModal();
};

// Update share count
async function updateShareCount(postId) {
    try {
        const postRef = firebaseDB.ref(firebaseDB.database, `posts/${postId}`);
        const snapshot = await firebaseDB.get(postRef);
        
        if (snapshot.exists()) {
            const currentShares = snapshot.val().shares || 0;
            await firebaseDB.update(postRef, { shares: currentShares + 1 });
            
            // Update UI
            const shareButton = document.querySelector(`[onclick="showShareModal('${postId}')"] .share-count`);
            if (shareButton) {
                shareButton.textContent = currentShares + 1;
            }
        }
    } catch (error) {
        console.error('Error updating share count:', error);
    }
}

/**
 * STORIES SYSTEM
 */

// Make story upload functional
window.openStoryUpload = function() {
    document.getElementById('story-upload-modal').classList.remove('hidden');
};

window.hideStoryUpload = function() {
    document.getElementById('story-upload-modal').classList.add('hidden');
    resetStoryUpload();
};

// Preview story file
window.previewStoryFile = function() {
    const fileInput = document.getElementById('story-file-input');
    const preview = document.getElementById('story-preview');
    const uploadBtn = document.getElementById('story-upload-btn');
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const isVideo = file.type.startsWith('video/');
            
            preview.innerHTML = isVideo 
                ? `<video src="${e.target.result}" class="w-full h-full object-cover rounded-xl" autoplay muted loop></video>`
                : `<img src="${e.target.result}" class="w-full h-full object-cover rounded-xl" />`;
            
            uploadBtn.disabled = false;
        };
        
        reader.readAsDataURL(file);
    }
};

// Upload story
window.uploadStory = async function(event) {
    console.log('📤 Starting story upload...');
    
    try {
        event.preventDefault();
        
        const fileInput = document.getElementById('story-file-input');
        const uploadBtn = document.getElementById('story-upload-btn');
        
        if (!fileInput || !uploadBtn) {
            console.error('❌ Upload elements not found');
            return;
        }
        
        if (!fileInput.files || !fileInput.files[0]) {
            console.warn('⚠️ No file selected');
            window.showToast?.('Selecciona un archivo', 'error');
            return;
        }
        
        console.log('📂 File selected:', fileInput.files[0].name);
        
        // Update UI immediately
        uploadBtn.textContent = 'Subiendo...';
        uploadBtn.disabled = true;
        
        // Get current user with multiple fallbacks
        let currentUser = null;
        if (window.currentUser) {
            currentUser = window.currentUser;
        } else if (window.auth && window.auth.currentUser) {
            currentUser = {
                uid: window.auth.currentUser.uid,
                displayName: window.auth.currentUser.displayName,
                email: window.auth.currentUser.email,
                photoURL: window.auth.currentUser.photoURL
            };
        } else {
            try {
                const stored = localStorage.getItem('currentUser');
                if (stored) currentUser = JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }
        
        if (!currentUser) {
            console.error('❌ No current user found');
            throw new Error('Usuario no autenticado');
        }
        
        console.log('👤 User found:', currentUser.uid);
        
        const file = fileInput.files[0];
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('El archivo es demasiado grande (máximo 10MB)');
        }
        
        console.log('☁️ Uploading to Cloudinary...');
        
        // Upload to Cloudinary with timeout
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'nitedcrypto_posts');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch('https://api.cloudinary.com/v1_1/dtxn4kbpc/auto/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Cloudinary error:', errorText);
            throw new Error('Error uploading to Cloudinary: ' + response.status);
        }
        
        console.log('✅ Cloudinary upload successful');
        const data = await response.json();
        
        // Save story to Firebase
        const storyData = {
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
            userPhoto: currentUser.photoURL || '',
            mediaURL: data.secure_url,
            mediaType: file.type.startsWith('video/') ? 'video' : 'image',
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            viewers: {}
        };
        
        const storiesRef = firebaseDB.ref(firebaseDB.database, 'stories');
        const newStoryRef = firebaseDB.push(storiesRef);
        await firebaseDB.set(newStoryRef, storyData);
        
        hideStoryUpload();
        window.showToast?.('¡Story publicado!', 'success');
        
        // Reload stories if on home
        if (window.currentSection === 'home') {
            setTimeout(() => {
                console.log('🔄 Reloading stories after upload...');
                loadStories();
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ Story upload error:', error);
        
        // Show user-friendly error message
        let errorMessage = 'Error al subir la historia';
        if (error.name === 'AbortError') {
            errorMessage = 'La subida tardó demasiado, intenta de nuevo';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        window.showToast?.(errorMessage, 'error');
    } finally {
        // Always reset UI
        const uploadBtn = document.getElementById('story-upload-btn');
        if (uploadBtn) {
            uploadBtn.textContent = 'Publicar Story';
            uploadBtn.disabled = false;
        }
    }
};

// Reset story upload
function resetStoryUpload() {
    const preview = document.getElementById('story-preview');
    const fileInput = document.getElementById('story-file-input');
    const uploadBtn = document.getElementById('story-upload-btn');
    
    preview.innerHTML = `
        <div class="text-center">
            <i class="fas fa-plus text-white text-4xl mb-2"></i>
            <p class="text-white text-opacity-60">Click para agregar foto/video</p>
        </div>
    `;
    
    fileInput.value = '';
    uploadBtn.disabled = true;
}

// Load stories from Firebase
async function loadStories() {
    console.log('🎬 Loading stories...');
    try {
        const storiesRef = firebaseDB.ref(firebaseDB.database, 'stories');
        const snapshot = await firebaseDB.get(storiesRef);
        
        console.log('📊 Stories snapshot exists:', snapshot.exists());
        
        if (!snapshot.exists()) {
            console.log('📭 No stories found in database');
            return;
        }
        
        const stories = [];
        const now = Date.now();
        
        snapshot.forEach(child => {
            const story = { id: child.key, ...child.val() };
            
            // Only show non-expired stories
            if (story.expiresAt > now) {
                stories.push(story);
            } else {
                console.log('⏰ Expired story:', story.id);
            }
        });
        
        console.log('✅ Valid stories found:', stories.length);
        
        // Group by user
        const userStories = {};
        stories.forEach(story => {
            if (!userStories[story.userId]) {
                userStories[story.userId] = {
                    userId: story.userId,
                    userName: story.userName,
                    userPhoto: story.userPhoto,
                    stories: []
                };
            }
            userStories[story.userId].stories.push(story);
        });
        
        // Sort stories by timestamp (newest first)
        Object.values(userStories).forEach(user => {
            user.stories.sort((a, b) => b.timestamp - a.timestamp);
        });
        
        renderStories(Object.values(userStories));
        
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

// Render stories
function renderStories(userStories) {
    const container = document.getElementById('stories-container');
    if (!container) {
        console.error('Stories container not found');
        return;
    }
    
    console.log('🎬 Rendering stories:', userStories.length);
    
    // Clear only user stories, keep the add button
    const existingStories = container.querySelectorAll('.story-item');
    existingStories.forEach(story => story.remove());
    
    // Ensure "Tu historia" button exists
    let addButton = container.querySelector('[onclick="openStoryUpload()"]');
    if (!addButton) {
        const addStoryHTML = `
            <div class="flex-shrink-0 text-center cursor-pointer" onclick="openStoryUpload()">
                <div class="story-ring rounded-full">
                    <div class="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors">
                        <i class="fas fa-plus text-gray-600 text-xl"></i>
                    </div>
                </div>
                <p class="text-white text-xs mt-1">Tu historia</p>
            </div>
        `;
        container.insertAdjacentHTML('afterbegin', addStoryHTML);
    }
    // Add user stories
    userStories.forEach(user => {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'flex-shrink-0 text-center cursor-pointer story-item';
        storyDiv.onclick = () => openStoryViewer(user);
        
        const initial = (user.userName || 'U').charAt(0).toUpperCase();
        const photoHTML = user.userPhoto 
            ? `<img src="${user.userPhoto}" class="w-16 h-16 rounded-full object-cover" />`
            : `<div class="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                 <span class="text-white font-bold">${initial}</span>
               </div>`;
        
        storyDiv.innerHTML = `
            <div class="story-ring rounded-full relative">
                ${photoHTML}
            </div>
            <p class="text-white text-xs mt-2 px-1 py-1 bg-black bg-opacity-50 rounded-md max-w-20 truncate mx-auto">${user.userName || 'Usuario'}</p>
        `;
        
        container.appendChild(storyDiv);
    });
}

// Open story viewer
function openStoryViewer(userStories) {
    currentStoriesArray = userStories.stories;
    currentStoryIndex = 0;
    
    document.getElementById('story-viewer-modal').classList.remove('hidden');
    showCurrentStory();
    startStoryProgress();
}

// Show current story
function showCurrentStory() {
    if (currentStoryIndex >= currentStoriesArray.length) {
        closeStoryViewer();
        return;
    }
    
    const story = currentStoriesArray[currentStoryIndex];
    
    // Update header
    const userAvatar = document.getElementById('story-user-avatar');
    const userName = document.getElementById('story-user-name');
    const timestamp = document.getElementById('story-timestamp');
    
    const initial = (story.userName || 'U').charAt(0).toUpperCase();
    userAvatar.innerHTML = story.userPhoto 
        ? `<img src="${story.userPhoto}" class="w-10 h-10 rounded-full object-cover" />`
        : `<span class="text-white font-bold">${initial}</span>`;
    
    userName.textContent = story.userName || 'Usuario';
    timestamp.textContent = formatStoryTime(story.timestamp);
    
    // Update content
    const content = document.getElementById('story-content');
    content.innerHTML = story.mediaType === 'video'
        ? `<video src="${story.mediaURL}" class="max-w-full max-h-full object-contain" autoplay muted />`
        : `<img src="${story.mediaURL}" class="max-w-full max-h-full object-contain" />`;
    
    // Update progress bars
    updateStoryProgress();
    
    // Mark as viewed
    markStoryAsViewed(story.id);
}

// Update story progress bars
function updateStoryProgress() {
    const progressContainer = document.getElementById('story-progress');
    progressContainer.innerHTML = '';
    
    currentStoriesArray.forEach((_, index) => {
        const bar = document.createElement('div');
        bar.className = `h-1 flex-1 rounded-full ${
            index < currentStoryIndex ? 'bg-white' :
            index === currentStoryIndex ? 'bg-white bg-opacity-50' :
            'bg-white bg-opacity-20'
        }`;
        
        if (index === currentStoryIndex) {
            bar.innerHTML = '<div class="h-full bg-white rounded-full story-progress-active"></div>';
        }
        
        progressContainer.appendChild(bar);
    });
}

// Start story progress timer
function startStoryProgress() {
    clearInterval(storyProgressInterval);
    
    const progressBar = document.querySelector('.story-progress-active');
    if (progressBar) {
        progressBar.style.width = '0%';
        
        let progress = 0;
        storyProgressInterval = setInterval(() => {
            progress += 2;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                nextStory();
            }
        }, 100); // 5 second duration (100ms * 50 = 5000ms)
    }
}

// Navigate stories
window.nextStory = function() {
    clearInterval(storyProgressInterval);
    currentStoryIndex++;
    showCurrentStory();
};

window.previousStory = function() {
    clearInterval(storyProgressInterval);
    if (currentStoryIndex > 0) {
        currentStoryIndex--;
        showCurrentStory();
    }
};

// Close story viewer
window.closeStoryViewer = function() {
    clearInterval(storyProgressInterval);
    document.getElementById('story-viewer-modal').classList.add('hidden');
    currentStoriesArray = [];
    currentStoryIndex = 0;
};

// Mark story as viewed
async function markStoryAsViewed(storyId) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        const viewerRef = firebaseDB.ref(firebaseDB.database, `stories/${storyId}/viewers/${currentUser.uid}`);
        await firebaseDB.set(viewerRef, {
            viewedAt: Date.now(),
            userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario'
        });
        
    } catch (error) {
        console.error('Error marking story as viewed:', error);
    }
}

// Format story timestamp
function formatStoryTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Hace un momento';
    if (hours < 24) return `Hace ${hours}h`;
    return 'Hace 1 día';
}

// Initialize when module loads
initializeTheme();

// Expose essential functions to window for global access
window.loadStories = loadStories;

export { initializeTheme, loadStories };