let currentUser = null;
let currentSection = 'login';
let database = null;
let firebaseDB = null;

// Expose globally for other modules
window.currentUser = currentUser;
window.database = database;
window.firebaseDB = firebaseDB;

// Import Firebase auth functions (will be loaded from auth module)
let firebaseAuth = null;

// Callback for Firebase auth state changes
window.onFirebaseAuthStateChanged = function(user) {
    currentUser = user;
    window.currentUser = user; // Update global reference
    if (user) {
        console.log('Estado de autenticación actualizado:', user);
        // Automatically redirect to home if user is authenticated
        showSection('home');
        // Initialize chat listeners
        initializeChatListeners();
        // Load user profile
        if (window.loadUserProfile) {
            setTimeout(() => window.loadUserProfile(), 500);
        }
        // Update profile stats
        if (window.updateProfileStats) {
            setTimeout(() => window.updateProfileStats(), 600);
        }
        // Load crypto portfolio
        if (window.loadCryptoPortfolio) {
            setTimeout(() => window.loadCryptoPortfolio(), 700);
        }
        // Load posts from Firebase
        setTimeout(() => loadPostsFromFirebase(), 800);
        // Load stories from Firebase
        setTimeout(() => loadStoriesFromFirebase(), 900);
        // Load following/followers from Firebase
        setTimeout(() => loadFollowDataFromFirebase(), 1000);
        // Load notifications from Firebase
        console.log('🔔 Checking notification loader:', typeof window.loadNotificationsFromFirebase);
        if (window.loadNotificationsFromFirebase) {
            console.log('✅ Loading notifications from Firebase...');
            setTimeout(() => window.loadNotificationsFromFirebase(), 1100);
        } else {
            console.error('❌ window.loadNotificationsFromFirebase is not defined!');
        }
        // Request push notification permission
        setTimeout(() => requestNotificationPermission(), 1200);
    } else {
        // User signed out, go to login
        showSection('login');
    }
};

// Initialize Firebase Auth and Database
async function initFirebaseAuth() {
    try {
        const authModule = await import('./modules/auth.js');
        firebaseAuth = authModule;
        authModule.initializeAuth();
        console.log('Firebase Auth inicializado correctamente');
        
        // Import Firebase Database
        const { database: db, ref, push, set, onValue, query, orderByChild, get, update } = await import('./firebase-config.js');
        database = db;
        firebaseDB = { ref, push, set, onValue, query, orderByChild, get, update };
        
        // Expose globally for other modules
        window.database = database;
        window.firebaseDB = firebaseDB;
        
        console.log('Firebase Database inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar Firebase:', error);
    }
}

// Authentication Functions
function loginWithWallet() {
    // Función deshabilitada - Solo funciona login con Google/Firebase
    showToast('⚠️ Por favor inicia sesión con Google');
    console.log('Wallet login deshabilitado - Usa Firebase Authentication');
}

async function loginWithGoogle() {
    try {
        if (firebaseAuth) {
            // Use Firebase authentication
            const userData = await firebaseAuth.signInWithGoogle();
            currentUser = userData;
            // showSection and showToast are already called in auth.js
        } else {
            // Si Firebase no está disponible, mostrar error
            console.error('Firebase no disponible');
            showToast('❌ Error: Firebase no configurado correctamente');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showToast('❌ Error al iniciar sesión');
    }
}

function showRegister() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
}

function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    
    currentUser = { name: username, email: email };
    showSection('home');
    showToast(`¡Bienvenido ${username}! 🎉`);
}

async function logout() {
    try {
        // Import Firebase signOut dynamically
        const { signOut } = await import('./firebase-config.js');
        const { auth } = await import('./firebase-config.js');
        
        // Sign out from Firebase
        await signOut(auth);
        
        currentUser = null;
        // The auth state change will trigger showSection('login') via callback
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        currentUser = null;
        showSection('login');
        showToast('Sesión cerrada');
    }
}

// Navigation Functions
function showSection(sectionName) {
    // Hide all sections
    const sections = ['login-section', 'register-section', 'home-section', 'crypto-section', 'news-section', 'chat-section', 'profile-section', 'individual-chat'];
    sections.forEach(section => {
        document.getElementById(section).classList.add('hidden');
    });

    // Show selected section
    if (sectionName === 'login') {
        document.getElementById('login-section').classList.remove('hidden');
    } else {
        document.getElementById(sectionName + '-section').classList.remove('hidden');
    }

    currentSection = sectionName;
    
    // Load posts when showing home section
    if (sectionName === 'home') {
        loadSavedPosts();
    }
    
    // Load news when showing news section
    if (sectionName === 'news') {
        loadCryptoNews();
    }
    
    // Load chats when showing chat section
    if (sectionName === 'chat') {
        loadChats();
    }

    // Update navigation active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'bg-opacity-20');
    });
}

// Home Post Functions
let selectedMediaType = null;

function showCreateHomePost() {
    document.getElementById('create-home-post-modal').classList.remove('hidden');
}

function hideCreateHomePost() {
    document.getElementById('create-home-post-modal').classList.add('hidden');
    document.getElementById('home-post-content').value = '';
    document.getElementById('media-preview').classList.add('hidden');
    selectedMediaType = null;
}

function addMedia(type) {
    // Open Cloudinary upload widget
    if (window.openCloudinaryUpload) {
        window.openCloudinaryUpload(type);
        selectedMediaType = type;
    } else {
        console.error('Cloudinary not loaded');
        showToast('Error: Cloudinary no disponible ❌');
    }
}

// ============================================
// POSTS PERSISTENCE (LocalStorage)
// ============================================

// Load posts from localStorage
// Load posts from Firebase
async function loadPostsFromFirebase() {
    if (!database || !firebaseDB || !currentUser) return;
    
    try {
        const postsRef = firebaseDB.ref(database, 'posts');
        const snapshot = await firebaseDB.get(postsRef);
        
        if (snapshot.exists()) {
            const firebasePosts = [];
            snapshot.forEach((childSnapshot) => {
                firebasePosts.push(childSnapshot.val());
            });
            
            // Get local posts
            const localPosts = JSON.parse(localStorage.getItem('nitedcrypto_posts') || '[]');
            
            // Merge posts (Firebase + localStorage), remove duplicates
            const allPostsMap = new Map();
            
            // Add local posts first
            localPosts.forEach(post => {
                allPostsMap.set(post.id, post);
            });
            
            // Add/update with Firebase posts
            firebasePosts.forEach(post => {
                allPostsMap.set(post.id, post);
            });
            
            // Convert back to array and sort by timestamp
            const mergedPosts = Array.from(allPostsMap.values())
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Save merged posts to localStorage
            localStorage.setItem('nitedcrypto_posts', JSON.stringify(mergedPosts));
            
            // Reload posts display
            loadSavedPosts();
            
            console.log(`Loaded ${firebasePosts.length} posts from Firebase`);
        }
    } catch (error) {
        console.error('Error loading posts from Firebase:', error);
    }
}

function loadSavedPosts() {
    try {
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        const feed = document.getElementById('home-feed');
        
        if (!feed) return;
        
        // Clear feed
        feed.innerHTML = '';
        
        if (savedPosts) {
            const posts = JSON.parse(savedPosts);
            
            if (posts.length === 0) {
                // Show welcome message
                feed.innerHTML = `
                    <div class="glass-effect rounded-2xl p-8 text-center">
                        <i class="fas fa-rocket text-6xl text-purple-400 mb-4"></i>
                        <h3 class="text-white text-xl font-bold mb-2">¡Bienvenido a CryptoSocial!</h3>
                        <p class="text-white text-opacity-60 mb-4">Sé el primero en compartir algo increíble</p>
                        <button onclick="showCreateHomePost()" class="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all">
                            Crear tu primer post
                        </button>
                    </div>
                `;
            } else {
                // Load posts in reverse order (newest first)
                posts.reverse().forEach(post => {
                    // Convert old comment format (number) to new format (array)
                    if (typeof post.comments === 'number') {
                        post.comments = [];
                    }
                    if (!Array.isArray(post.comments)) {
                        post.comments = [];
                    }
                    
                    // Add userId if missing (for old posts)
                    if (!post.userId && currentUser) {
                        post.userId = currentUser.uid || currentUser.email || 'unknown';
                    }
                    
                    post.timestamp = getRelativeTime(post.timestamp);
                    renderPost(post);
                });
            }
        } else {
            // Show welcome message
            feed.innerHTML = `
                <div class="glass-effect rounded-2xl p-8 text-center">
                    <i class="fas fa-rocket text-6xl text-purple-400 mb-4"></i>
                    <h3 class="text-white text-xl font-bold mb-2">¡Bienvenido a CryptoSocial!</h3>
                    <p class="text-white text-opacity-60 mb-4">Sé el primero en compartir algo increíble</p>
                    <button onclick="showCreateHomePost()" class="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all">
                        Crear tu primer post
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Save posts to localStorage
function savePosts() {
    try {
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        const posts = savedPosts ? JSON.parse(savedPosts) : [];
        localStorage.setItem('nitedcrypto_posts', JSON.stringify(posts));
    } catch (error) {
        console.error('Error saving posts:', error);
    }
}

// Add new post to localStorage
function addPostToStorage(postData) {
    try {
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        const posts = savedPosts ? JSON.parse(savedPosts) : [];
        posts.push(postData);
        localStorage.setItem('nitedcrypto_posts', JSON.stringify(posts));
    } catch (error) {
        console.error('Error adding post:', error);
    }
}

// Add story to localStorage
function addStoryToStorage(storyData) {
    try {
        const savedStories = localStorage.getItem('nitedcrypto_stories');
        const stories = savedStories ? JSON.parse(savedStories) : [];
        stories.push(storyData);
        localStorage.setItem('nitedcrypto_stories', JSON.stringify(stories));
        
        // Save to Firebase
        if (database && firebaseDB) {
            const storyRef = firebaseDB.ref(database, `stories/${storyData.id}`);
            firebaseDB.set(storyRef, storyData).catch(err => {
                console.error('Error saving story to Firebase:', err);
            });
        }
    } catch (error) {
        console.error('Error adding story:', error);
    }
}

// Load stories from Firebase
async function loadStoriesFromFirebase() {
    if (!database || !firebaseDB) return;
    
    try {
        const storiesRef = firebaseDB.ref(database, 'stories');
        const snapshot = await firebaseDB.get(storiesRef);
        
        if (snapshot.exists()) {
            const firebaseStories = [];
            const now = Date.now();
            
            snapshot.forEach((childSnapshot) => {
                const story = childSnapshot.val();
                // Only load stories less than 24 hours old
                if (now - story.timestamp < 86400000) {
                    firebaseStories.push(story);
                }
            });
            
            // Get local stories
            const localStories = JSON.parse(localStorage.getItem('nitedcrypto_stories') || '[]');
            
            // Merge and remove duplicates
            const allStoriesMap = new Map();
            localStories.forEach(s => allStoriesMap.set(s.id, s));
            firebaseStories.forEach(s => allStoriesMap.set(s.id, s));
            
            const mergedStories = Array.from(allStoriesMap.values())
                .filter(s => now - s.timestamp < 86400000) // Filter 24h
                .sort((a, b) => b.timestamp - a.timestamp);
            
            // Save to localStorage
            localStorage.setItem('nitedcrypto_stories', JSON.stringify(mergedStories));
            
            // Reload display
            loadSavedStories();
            
            console.log(`Loaded ${firebaseStories.length} stories from Firebase`);
        }
    } catch (error) {
        console.error('Error loading stories from Firebase:', error);
    }
}

// Load stories from localStorage
function loadSavedStories() {
    try {
        const savedStories = localStorage.getItem('nitedcrypto_stories');
        if (savedStories) {
            const stories = JSON.parse(savedStories);
            // Clear existing stories (except the "Add story" button)
            const storiesContainer = document.querySelector('.flex.space-x-4.overflow-x-auto');
            if (storiesContainer) {
                // Keep only the first child (Add story button)
                while (storiesContainer.children.length > 1) {
                    storiesContainer.removeChild(storiesContainer.lastChild);
                }
                
                // Render all stories
                stories.forEach(story => renderStory(story));
            }
        }
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

// Render a single story
function renderPost(postData) {
    const feed = document.getElementById('home-feed');
    const postDiv = document.createElement('div');
    postDiv.className = 'glass-effect rounded-2xl p-4 slide-in';
    postDiv.dataset.postId = postData.id;
    
    let mediaContent = '';
    if (postData.media) {
        if (postData.media.resourceType === 'image') {
            mediaContent = `
                <div class="rounded-xl overflow-hidden mb-3">
                    <img src="${postData.media.url}" alt="Post image" class="w-full h-auto object-cover max-h-96">
                </div>
            `;
        } else if (postData.media.resourceType === 'video') {
            mediaContent = `
                <div class="rounded-xl overflow-hidden mb-3">
                    <video src="${postData.media.url}" class="w-full h-auto max-h-96" controls></video>
                </div>
            `;
        }
    }
    
    // User avatar
    const userAvatar = postData.userPhotoURL 
        ? `<img src="${postData.userPhotoURL}" class="w-10 h-10 rounded-full object-cover" alt="Avatar">`
        : `<div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span class="text-white font-bold">${postData.userName[0].toUpperCase()}</span>
           </div>`;
    
    // Check if this is not the current user's post
    const currentUserId = currentUser?.uid || currentUser?.email;
    const isOwnPost = postData.userId === currentUserId;
    const showFollowButton = postData.userId && !isOwnPost && currentUser;
    
    // Check if current user has liked this post
    const hasLiked = postData.likedBy && Array.isArray(postData.likedBy) && 
                     postData.likedBy.includes(currentUserId);
    const likeIconClass = hasLiked ? 'fas' : 'far';
    const likeButtonClass = hasLiked ? 'text-red-400' : 'text-white hover:text-red-400';
    
    postDiv.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
                ${userAvatar}
                <div class="ml-3">
                    <h3 class="text-white font-semibold">${postData.userName}</h3>
                    <p class="text-white text-opacity-60 text-sm">${postData.timestamp}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                ${showFollowButton ? `
                    <button onclick="toggleFollow('${postData.userId}', '${postData.userName}', this)" 
                            class="follow-btn px-4 py-1 rounded-full text-sm font-medium transition-all ${isFollowing(postData.userId) ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'}">
                        ${isFollowing(postData.userId) ? 'Siguiendo' : 'Seguir'}
                    </button>
                ` : ''}
                ${isOwnPost ? `
                    <button onclick="deletePost('${postData.id}')" 
                            class="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-900 hover:bg-opacity-20 transition-all"
                            title="Eliminar post">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
        ${postData.content ? `<p class="text-white mb-3">${postData.content}</p>` : ''}
        ${mediaContent}
        <div class="flex justify-between items-center mb-3">
            <div class="flex space-x-4">
                <button onclick="toggleLike(this)" class="flex items-center ${likeButtonClass} transition-colors">
                    <i class="${likeIconClass} fa-heart mr-1"></i>
                    <span>${postData.likes || 0}</span>
                </button>
                <button onclick="toggleComments('${postData.id}')" class="flex items-center text-white hover:text-blue-400 transition-colors">
                    <i class="far fa-comment mr-1"></i>
                    <span class="comment-count">${postData.comments?.length || 0}</span>
                </button>
                <button class="flex items-center text-white hover:text-green-400 transition-colors">
                    <i class="fas fa-share mr-1"></i>
                </button>
            </div>
        </div>
        
        <!-- Comments Section -->
        <div id="comments-${postData.id}" class="comments-section hidden border-t border-gray-700 pt-3 mt-3">
            <div class="comments-list mb-3 space-y-2" id="comments-list-${postData.id}">
                ${(Array.isArray(postData.comments) ? postData.comments : []).map(comment => `
                    <div class="flex space-x-2">
                        <img src="${comment.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=random`}" 
                             class="w-8 h-8 rounded-full object-cover flex-shrink-0">
                        <div class="flex-1 bg-gray-800 bg-opacity-50 rounded-lg p-2">
                            <p class="text-white text-sm font-semibold">${comment.userName}</p>
                            <p class="text-white text-sm">${comment.text}</p>
                            <p class="text-gray-400 text-xs mt-1">${getRelativeTime(comment.timestamp)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="flex space-x-2">
                <img src="${currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || currentUser?.name || 'Usuario')}&background=random`}" 
                     class="w-8 h-8 rounded-full object-cover flex-shrink-0">
                <input type="text" 
                       id="comment-input-${postData.id}" 
                       placeholder="Escribe un comentario..." 
                       class="flex-1 bg-gray-800 bg-opacity-50 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                       onkeypress="if(event.key === 'Enter') addComment('${postData.id}')">
                <button onclick="addComment('${postData.id}')" class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full hover:opacity-90">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    feed.insertBefore(postDiv, feed.firstChild);
}

// Get relative time
function getRelativeTime(timestamp) {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diff = Math.floor((now - postDate) / 1000); // seconds
    
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
    return postDate.toLocaleDateString();
}

// Delete post
async function deletePost(postId) {
    if (!currentUser) {
        showToast('⚠️ Debes iniciar sesión');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
        return;
    }
    
    try {
        // Remove from localStorage
        const posts = JSON.parse(localStorage.getItem('nitedcrypto_posts') || '[]');
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex !== -1) {
            const post = posts[postIndex];
            const currentUserId = currentUser?.uid || currentUser?.email;
            
            // Verify ownership
            if (post.userId !== currentUserId) {
                showToast('⚠️ No puedes eliminar posts de otros usuarios');
                return;
            }
            
            // Remove from array
            posts.splice(postIndex, 1);
            localStorage.setItem('nitedcrypto_posts', JSON.stringify(posts));
            
            // Remove from Firebase if exists
            if (database && firebaseDB) {
                try {
                    const postsRef = firebaseDB.ref(database, `posts/${postId}`);
                    await firebaseDB.set(postsRef, null);
                } catch (error) {
                    console.log('Post no existe en Firebase o error al eliminar:', error);
                }
            }
            
            // Remove from DOM
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                postElement.classList.add('slide-out');
                setTimeout(() => {
                    postElement.remove();
                    showToast('✅ Post eliminado');
                    
                    // Update stats if on profile page
                    if (typeof updateProfileStats === 'function') {
                        updateProfileStats();
                    }
                }, 300);
            }
        } else {
            showToast('⚠️ Post no encontrado');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showToast('❌ Error al eliminar el post');
    }
}

function createHomePost(event) {
    event.preventDefault();
    const content = document.getElementById('home-post-content').value.trim();
    const uploadedMedia = window.getCurrentMedia ? window.getCurrentMedia() : null;
    
    if (content || uploadedMedia) {
        // Create post data object
        const postData = {
            id: Date.now().toString(),
            userId: currentUser?.uid || currentUser?.email || Date.now().toString(),
            userName: currentUser?.displayName || currentUser?.name || 'Usuario',
            userPhotoURL: currentUser?.photoURL || null,
            content: content,
            media: uploadedMedia,
            timestamp: new Date().toISOString(),
            likes: 0,
            likedBy: [], // Initialize empty array for likes tracking
            comments: []
        };
        
        // Save to localStorage
        addPostToStorage(postData);
        
        // Save to Firebase
        if (database && firebaseDB) {
            const postsRef = firebaseDB.ref(database, `posts/${postData.id}`);
            firebaseDB.set(postsRef, postData).catch(err => {
                console.error('Error saving post to Firebase:', err);
            });
        }
        
        // Render post
        postData.timestamp = 'ahora'; // Display format
        renderPost(postData);
        
        // Clear form and media
        document.getElementById('home-post-content').value = '';
        if (window.clearCurrentMedia) {
            window.clearCurrentMedia();
        }
        selectedMediaType = null;
        
        hideCreateHomePost();
        showToast('¡Post publicado exitosamente! 🎉');
    } else {
        showToast('Escribe algo o sube una imagen/video ⚠️');
    }
}

async function toggleLike(button) {
    if (!currentUser) {
        showToast('⚠️ Debes iniciar sesión para dar like');
        return;
    }
    
    const icon = button.querySelector('i');
    const count = button.querySelector('span');
    const postElement = button.closest('.glass-effect');
    const postId = postElement?.dataset.postId;
    
    if (!postId) {
        console.error('No post ID found');
        return;
    }
    
    const currentUserId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
    
    try {
        // Get current likes from localStorage
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        if (!savedPosts) return;
        
        const posts = JSON.parse(savedPosts);
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex === -1) return;
        
        // Initialize likedBy array if it doesn't exist
        if (!posts[postIndex].likedBy) {
            posts[postIndex].likedBy = [];
        }
        
        const likedBy = posts[postIndex].likedBy;
        const hasLiked = likedBy.includes(currentUserId);
        
        if (hasLiked) {
            // Remove like
            icon.classList.remove('fas');
            icon.classList.add('far');
            button.classList.remove('text-red-400');
            
            posts[postIndex].likedBy = likedBy.filter(id => id !== currentUserId);
            posts[postIndex].likes = Math.max(0, (posts[postIndex].likes || 0) - 1);
        } else {
            // Add like
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.classList.add('text-red-400');
            
            posts[postIndex].likedBy.push(currentUserId);
            posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
        }
        
        // Update count display
        count.textContent = posts[postIndex].likes;
        
        // Save to localStorage
        localStorage.setItem('nitedcrypto_posts', JSON.stringify(posts));
        
        // Also save to Firebase if available
        if (database && firebaseDB) {
            const postRef = firebaseDB.ref(database, `posts/${postId}`);
            await firebaseDB.update(postRef, {
                likes: posts[postIndex].likes,
                likedBy: posts[postIndex].likedBy,
                lastUpdated: Date.now()
            }).catch(err => console.error('Error updating like in Firebase:', err));
            
            // Create notification for post owner if someone else liked it
            if (!hasLiked && posts[postIndex].userId && posts[postIndex].userId !== currentUserId) {
                const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Alguien';
                
                // Save notification to Firebase for receiver only
                const notificationData = {
                    id: Date.now().toString(),
                    type: 'like',
                    message: `${userName} le dio like a tu publicación`,
                    user: {
                        displayName: userName,
                        photoURL: currentUser.photoURL || null
                    },
                    timestamp: Date.now(),
                    read: false
                };
                
                const receiverUserId = posts[postIndex].userId.replace(/[.@]/g, '_');
                const notifRef = firebaseDB.ref(database, `notifications/${receiverUserId}/${notificationData.id}`);
                firebaseDB.set(notifRef, notificationData).catch(err => {
                    console.error('Error saving like notification:', err);
                });
            }
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
        showToast('❌ Error al dar like');
    }
}

// Update post likes in localStorage (deprecated - use toggleLike instead)
function updatePostLikes(postId, newLikeCount) {
    try {
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        if (savedPosts) {
            const posts = JSON.parse(savedPosts);
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                posts[postIndex].likes = newLikeCount;
                localStorage.setItem('nitedcrypto_posts', JSON.stringify(posts));
            }
        }
    } catch (error) {
        console.error('Error updating likes:', error);
    }
}

// Toggle comments section visibility
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) {
        commentsSection.classList.toggle('hidden');
        
        // Focus on input when opening
        if (!commentsSection.classList.contains('hidden')) {
            const input = document.getElementById(`comment-input-${postId}`);
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
        }
    }
}

// Add comment to a post
function addComment(postId) {
    if (!currentUser) {
        showToast('Debes iniciar sesión para comentar');
        return;
    }
    
    const input = document.getElementById(`comment-input-${postId}`);
    const commentText = input.value.trim();
    
    if (!commentText) return;
    
    const comment = {
        id: Date.now().toString(),
        userName: currentUser.displayName || currentUser.name || 'Usuario',
        userPhotoURL: currentUser.photoURL || null,
        text: commentText,
        timestamp: Date.now()
    };
    
    // Add to localStorage
    addCommentToStorage(postId, comment);
    
    // Render comment in UI
    renderComment(postId, comment);
    
    // Update comment count
    updateCommentCount(postId);
    
    // Clear input
    input.value = '';
    
    // Show notification
    showToast('Comentario agregado! 💬');
}

// Add comment to localStorage
function addCommentToStorage(postId, comment) {
    try {
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        if (savedPosts) {
            const posts = JSON.parse(savedPosts);
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                if (!posts[postIndex].comments) {
                    posts[postIndex].comments = [];
                }
                posts[postIndex].comments.push(comment);
                localStorage.setItem('nitedcrypto_posts', JSON.stringify(posts));
                
                // Save to Firebase
                if (database && firebaseDB) {
                    const postRef = firebaseDB.ref(database, `posts/${postId}`);
                    firebaseDB.update(postRef, {
                        comments: posts[postIndex].comments,
                        lastUpdated: Date.now()
                    }).catch(err => console.error('Error updating comment in Firebase:', err));
                    
                    // Create notification for post owner if someone else commented
                    const currentUserId = currentUser?.uid || currentUser?.email?.replace(/[.@]/g, '_');
                    if (posts[postIndex].userId && posts[postIndex].userId !== currentUserId) {
                        const userName = comment.userName || 'Alguien';
                        
                        // Save notification to Firebase for receiver only
                        const notificationData = {
                            id: Date.now().toString(),
                            type: 'comment',
                            message: `${userName} comentó tu publicación`,
                            user: {
                                displayName: userName,
                                photoURL: comment.userPhotoURL || null
                            },
                            timestamp: Date.now(),
                            read: false
                        };
                        
                        const receiverUserId = posts[postIndex].userId.replace(/[.@]/g, '_');
                        const notifRef = firebaseDB.ref(database, `notifications/${receiverUserId}/${notificationData.id}`);
                        firebaseDB.set(notifRef, notificationData).catch(err => {
                            console.error('Error saving comment notification:', err);
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

// Render a single comment
function renderComment(postId, comment) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    if (!commentsList) return;
    
    const commentDiv = document.createElement('div');
    commentDiv.className = 'flex space-x-2';
    commentDiv.innerHTML = `
        <img src="${comment.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=random`}" 
             class="w-8 h-8 rounded-full object-cover flex-shrink-0">
        <div class="flex-1 bg-gray-800 bg-opacity-50 rounded-lg p-2">
            <p class="text-white text-sm font-semibold">${comment.userName}</p>
            <p class="text-white text-sm">${comment.text}</p>
            <p class="text-gray-400 text-xs mt-1">${getRelativeTime(comment.timestamp)}</p>
        </div>
    `;
    
    commentsList.appendChild(commentDiv);
}

// Update comment count in UI
function updateCommentCount(postId) {
    try {
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        if (savedPosts) {
            const posts = JSON.parse(savedPosts);
            const post = posts.find(p => p.id === postId);
            if (post) {
                const postDiv = document.querySelector(`[data-post-id="${postId}"]`);
                if (postDiv) {
                    const countSpan = postDiv.querySelector('.comment-count');
                    if (countSpan) {
                        countSpan.textContent = post.comments?.length || 0;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error updating comment count:', error);
    }
}

// Utility Functions
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 slide-in';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============================================
// UTILITY & CLEANUP FUNCTIONS
// ============================================

// Clean old localStorage chat data (migration to Firebase)
function cleanOldChatData() {
    try {
        // Remove old localStorage chat data since we're using Firebase now
        localStorage.removeItem('nitedcrypto_chats');
        console.log('Old chat data cleaned from localStorage');
    } catch (error) {
        console.error('Error cleaning old data:', error);
    }
}

// Clean ALL Firebase chat data (use only for testing/debugging)
async function cleanAllFirebaseChats() {
    if (!database || !currentUser) {
        console.error('Database or user not available');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar TODOS los chats? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const currentUserId = currentUser.uid || currentUser.email.replace(/[.@]/g, '_');
        
        // Delete user's chat list
        const userChatsRef = firebaseDB.ref(database, `users/${currentUserId}/chats`);
        await firebaseDB.remove(userChatsRef);
        
        console.log('All chats cleaned from Firebase');
        showToast('Chats eliminados correctamente');
        
        // Reload chats
        if (currentSection === 'chat') {
            loadChats();
        }
    } catch (error) {
        console.error('Error cleaning Firebase chats:', error);
        showToast('Error al eliminar chats');
    }
}

// Expose cleanup function globally for console access
window.cleanAllFirebaseChats = cleanAllFirebaseChats;

// ============================================
// FOLLOW SYSTEM FUNCTIONS
// ============================================

// Check if current user is following someone
function isFollowing(userId) {
    if (!currentUser) return false;
    try {
        const following = localStorage.getItem('nitedcrypto_following');
        if (following) {
            const followingList = JSON.parse(following);
            const currentUserId = currentUser.uid || currentUser.email;
            const userFollowing = followingList[currentUserId] || [];
            // Support both old format (string) and new format (object)
            return userFollowing.some(u => 
                (typeof u === 'string' ? u : u.id) === userId
            );
        }
    } catch (error) {
        console.error('Error checking following status:', error);
    }
    return false;
}

// Toggle follow/unfollow
function toggleFollow(userId, userName, button) {
    if (!currentUser) {
        showToast('Debes iniciar sesión para seguir usuarios');
        return;
    }
    
    const currentUserId = currentUser.uid || currentUser.email;
    if (currentUserId === userId) return; // Can't follow yourself
    
    try {
        const following = localStorage.getItem('nitedcrypto_following');
        let followingData = following ? JSON.parse(following) : {};
        
        if (!followingData[currentUserId]) {
            followingData[currentUserId] = [];
        }
        
        // Find if already following
        const existingIndex = followingData[currentUserId].findIndex(u => 
            (typeof u === 'string' ? u : u.id) === userId
        );
        
        if (existingIndex > -1) {
            // Unfollow
            followingData[currentUserId].splice(existingIndex, 1);
            button.textContent = 'Seguir';
            button.className = 'follow-btn px-4 py-1 rounded-full text-sm font-medium transition-all bg-gradient-to-r from-purple-500 to-pink-500 text-white';
            showToast(`Dejaste de seguir a ${userName}`);
            
            // Update followers list
            updateFollowersList(userId, currentUserId, false);
        } else {
            // Follow - Get user's photo from posts or use default
            let userPhotoURL = null;
            const posts = JSON.parse(localStorage.getItem('nitedcrypto_posts') || '[]');
            const userPost = posts.find(p => p.userId === userId);
            if (userPost) {
                userPhotoURL = userPost.userPhotoURL;
            }
            
            // Save complete user object
            followingData[currentUserId].push({
                id: userId,
                name: userName,
                photoURL: userPhotoURL
            });
            
            button.textContent = 'Siguiendo';
            button.className = 'follow-btn px-4 py-1 rounded-full text-sm font-medium transition-all bg-gray-600 text-white';
            showToast(`Ahora sigues a ${userName}! 🎉`);
            
            // Update followers list
            updateFollowersList(userId, currentUserId, true);
        }
        
        localStorage.setItem('nitedcrypto_following', JSON.stringify(followingData));
        
        // Save to Firebase
        if (database && firebaseDB) {
            const followingRef = firebaseDB.ref(database, `following/${currentUserId}`);
            firebaseDB.set(followingRef, followingData[currentUserId]).catch(err => {
                console.error('Error saving following to Firebase:', err);
            });
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        showToast('Error al procesar la acción');
    }
}

// Update followers list
function updateFollowersList(targetUserId, currentUserId, isFollowing) {
    try {
        const followers = localStorage.getItem('nitedcrypto_followers');
        let followersData = followers ? JSON.parse(followers) : {};
        
        if (!followersData[targetUserId]) {
            followersData[targetUserId] = [];
        }
        
        const currentUserName = currentUser?.displayName || currentUser?.name || 'Usuario';
        const currentUserPhoto = currentUser?.photoURL || null;
        
        if (isFollowing) {
            // Add to followers if not already there
            const exists = followersData[targetUserId].some(f => 
                (typeof f === 'string' ? f : f.id) === currentUserId
            );
            
            if (!exists) {
                followersData[targetUserId].push({
                    id: currentUserId,
                    name: currentUserName,
                    photoURL: currentUserPhoto
                });
            }
        } else {
            // Remove from followers
            followersData[targetUserId] = followersData[targetUserId].filter(f => 
                (typeof f === 'string' ? f : f.id) !== currentUserId
            );
        }
        
        localStorage.setItem('nitedcrypto_followers', JSON.stringify(followersData));
        
        // Save to Firebase
        if (database && firebaseDB) {
            const followersRef = firebaseDB.ref(database, `followers/${targetUserId}`);
            firebaseDB.set(followersRef, followersData[targetUserId]).catch(err => {
                console.error('Error saving followers to Firebase:', err);
            });
            
            // Create notification for followed user
            if (isFollowing) {
                // Save notification to Firebase for receiver only
                const notificationData = {
                    id: Date.now().toString(),
                    type: 'follow',
                    message: `${currentUserName} comenzó a seguirte`,
                    user: {
                        displayName: currentUserName,
                        photoURL: currentUserPhoto || null
                    },
                    timestamp: Date.now(),
                    read: false
                };
                
                const receiverUserId = targetUserId.replace(/[.@]/g, '_');
                const notifRef = firebaseDB.ref(database, `notifications/${receiverUserId}/${notificationData.id}`);
                firebaseDB.set(notifRef, notificationData).catch(err => {
                    console.error('Error saving follow notification:', err);
                });
            }
        }
    } catch (error) {
        console.error('Error updating followers list:', error);
    }
}

// Load following/followers from Firebase
async function loadFollowDataFromFirebase() {
    if (!database || !firebaseDB || !currentUser) return;
    
    const currentUserId = currentUser.uid || currentUser.email;
    
    try {
        // Load following
        const followingRef = firebaseDB.ref(database, `following/${currentUserId}`);
        const followingSnapshot = await firebaseDB.get(followingRef);
        
        if (followingSnapshot.exists()) {
            const firebaseFollowing = followingSnapshot.val();
            const localFollowing = JSON.parse(localStorage.getItem('nitedcrypto_following') || '{}');
            
            // Merge
            localFollowing[currentUserId] = firebaseFollowing;
            localStorage.setItem('nitedcrypto_following', JSON.stringify(localFollowing));
            
            console.log(`Loaded ${firebaseFollowing.length} following from Firebase`);
        }
        
        // Load followers
        const followersRef = firebaseDB.ref(database, `followers/${currentUserId}`);
        const followersSnapshot = await firebaseDB.get(followersRef);
        
        if (followersSnapshot.exists()) {
            const firebaseFollowers = followersSnapshot.val();
            const localFollowers = JSON.parse(localStorage.getItem('nitedcrypto_followers') || '{}');
            
            // Merge
            localFollowers[currentUserId] = firebaseFollowers;
            localStorage.setItem('nitedcrypto_followers', JSON.stringify(localFollowers));
            
            console.log(`Loaded ${firebaseFollowers.length} followers from Firebase`);
        }
    } catch (error) {
        console.error('Error loading follow data from Firebase:', error);
    }
}

// Get list of users current user is following
function getFollowingList() {
    if (!currentUser) return [];
    
    try {
        const following = localStorage.getItem('nitedcrypto_following');
        
        if (following) {
            const followingData = JSON.parse(following);
            const currentUserId = currentUser.uid || currentUser.email;
            const followingList = followingData[currentUserId] || [];
            
            // Already in object format {id, name, photoURL}
            return followingList.filter(user => user && user.id);
        }
    } catch (error) {
        console.error('Error getting following list:', error);
    }
    
    return [];
}

// Story Upload Function
function openStoryUpload() {
    if (!currentUser) {
        showToast('Debes iniciar sesión para subir una historia');
        return;
    }
    
    // Create a temporary upload widget specifically for stories
    const widget = cloudinary.createUploadWidget({
        cloudName: 'dtxn4kbpc',
        uploadPreset: 'nitedcrypto_posts',
        sources: ['local', 'url', 'camera'],
        showAdvancedOptions: false,
        cropping: false,
        multiple: false,
        resourceType: 'auto',
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'],
        maxFileSize: 100000000, // 100MB
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
        if (!error && result && result.event === 'success') {
            const storyData = {
                id: Date.now().toString(),
                userName: currentUser.displayName || currentUser.name || 'Usuario',
                userPhotoURL: currentUser.photoURL || null,
                media: {
                    url: result.info.secure_url,
                    resourceType: result.info.resource_type,
                    format: result.info.format
                },
                timestamp: Date.now()
            };
            
            // Save to localStorage
            addStoryToStorage(storyData);
            
            // Display story
            renderStory(storyData);
            
            showToast('¡Historia publicada! 🎉');
        } else if (error) {
            console.error('Error uploading story:', error);
            showToast('Error al subir la historia');
        }
    });
    
    widget.open();
}

// Render a single story
function renderStory(storyData) {
    const storiesContainer = document.querySelector('.flex.space-x-4.overflow-x-auto');
    if (!storiesContainer) return;
    
    const storyDiv = document.createElement('div');
    storyDiv.className = 'flex-shrink-0 text-center cursor-pointer';
    storyDiv.dataset.storyId = storyData.id;
    
    const userAvatar = storyData.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(storyData.userName)}&background=random`;
    
    // Create story thumbnail based on media type
    let thumbnail = '';
    if (storyData.media.resourceType === 'image') {
        thumbnail = `<img src="${storyData.media.url}" alt="Story" class="w-full h-full object-cover">`;
    } else if (storyData.media.resourceType === 'video') {
        thumbnail = `
            <video class="w-full h-full object-cover">
                <source src="${storyData.media.url}" type="video/${storyData.media.format}">
            </video>
            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <i class="fas fa-play text-white text-xl"></i>
            </div>
        `;
    }
    
    storyDiv.innerHTML = `
        <div class="story-ring rounded-full p-[2px]">
            <div class="w-16 h-16 rounded-full overflow-hidden relative bg-gray-700">
                ${thumbnail}
            </div>
        </div>
        <p class="text-white text-xs mt-1 truncate w-16">${storyData.userName}</p>
    `;
    
    // Add click event to view story
    storyDiv.addEventListener('click', () => {
        viewStory(storyData);
    });
    
    // Append to container (after the "Add story" button)
    storiesContainer.appendChild(storyDiv);
}

// View story in fullscreen
function viewStory(storyData) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center';
    modal.style.cursor = 'pointer';
    
    let mediaContent = '';
    if (storyData.media.resourceType === 'image') {
        mediaContent = `<img src="${storyData.media.url}" class="max-h-screen max-w-full object-contain">`;
    } else if (storyData.media.resourceType === 'video') {
        mediaContent = `<video src="${storyData.media.url}" class="max-h-screen max-w-full" autoplay controls></video>`;
    }
    
    modal.innerHTML = `
        <div class="absolute top-4 left-4 flex items-center space-x-3">
            <img src="${storyData.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(storyData.userName)}&background=random`}" 
                 class="w-10 h-10 rounded-full object-cover border-2 border-white">
            <div>
                <p class="text-white font-semibold">${storyData.userName}</p>
                <p class="text-gray-300 text-sm">${getRelativeTime(storyData.timestamp)}</p>
            </div>
        </div>
        <div class="relative">
            ${mediaContent}
        </div>
        <button class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300" onclick="this.closest('.fixed').remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Close on click outside or on the modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('button')) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY IMMEDIATELY
// ============================================
// This must be done BEFORE DOMContentLoaded so onclick handlers work
window.loginWithWallet = loginWithWallet;
window.loginWithGoogle = loginWithGoogle;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.register = register;
window.logout = logout;
window.showSection = showSection;
window.showCreateHomePost = showCreateHomePost;
window.hideCreateHomePost = hideCreateHomePost;
window.addMedia = addMedia;
window.createHomePost = createHomePost;
window.toggleLike = toggleLike;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.showToast = showToast;
window.loadSavedPosts = loadSavedPosts;
window.loadSavedStories = loadSavedStories;
window.openStoryUpload = openStoryUpload;
window.loadCryptoNews = loadCryptoNews;
window.openNewsArticle = openNewsArticle;
window.showCryptoChart = showCryptoChart;
window.hideCryptoChart = hideCryptoChart;
window.toggleFollow = toggleFollow;
window.isFollowing = isFollowing;
window.showNewChat = showNewChat;
window.hideNewChat = hideNewChat;
window.showChatTab = showChatTab;
window.loadChats = loadChats;
window.sendMessage = sendMessage;
window.startChatWithUser = startChatWithUser;
window.markChatAsRead = markChatAsRead;
window.getRelativeTime = getRelativeTime;
window.renderPost = renderPost;
window.showSection = showSection;
window.deletePost = deletePost;
window.loadPostsFromFirebase = loadPostsFromFirebase;
window.loadStoriesFromFirebase = loadStoriesFromFirebase;
window.loadFollowDataFromFirebase = loadFollowDataFromFirebase;

// Migrate following/followers data from string format to object format
function migrateFollowingData() {
    try {
        // Migrate following data
        const following = localStorage.getItem('nitedcrypto_following');
        if (following) {
            const followingData = JSON.parse(following);
            let needsUpdate = false;
            
            for (const userId in followingData) {
                if (Array.isArray(followingData[userId])) {
                    // Check if array contains strings (old format)
                    const hasStrings = followingData[userId].some(item => typeof item === 'string');
                    
                    if (hasStrings) {
                        needsUpdate = true;
                        // Convert strings to objects
                        followingData[userId] = followingData[userId].map(item => {
                            if (typeof item === 'string') {
                                // Try to find user info from posts
                                const posts = JSON.parse(localStorage.getItem('nitedcrypto_posts') || '[]');
                                const userPost = posts.find(p => p.userId === item);
                                
                                return {
                                    id: item,
                                    name: userPost?.userName || 'Usuario',
                                    photoURL: userPost?.userPhotoURL || null
                                };
                            }
                            return item;
                        });
                    }
                }
            }
            
            if (needsUpdate) {
                localStorage.setItem('nitedcrypto_following', JSON.stringify(followingData));
                console.log('Migrated following data to new format');
            }
        }
        
        // Migrate followers data
        const followers = localStorage.getItem('nitedcrypto_followers');
        if (followers) {
            const followersData = JSON.parse(followers);
            let needsUpdate = false;
            
            for (const userId in followersData) {
                if (Array.isArray(followersData[userId])) {
                    const hasStrings = followersData[userId].some(item => typeof item === 'string');
                    
                    if (hasStrings) {
                        needsUpdate = true;
                        followersData[userId] = followersData[userId].map(item => {
                            if (typeof item === 'string') {
                                const posts = JSON.parse(localStorage.getItem('nitedcrypto_posts') || '[]');
                                const userPost = posts.find(p => p.userId === item);
                                
                                return {
                                    id: item,
                                    name: userPost?.userName || 'Usuario',
                                    photoURL: userPost?.userPhotoURL || null
                                };
                            }
                            return item;
                        });
                    }
                }
            }
            
            if (needsUpdate) {
                localStorage.setItem('nitedcrypto_followers', JSON.stringify(followersData));
                console.log('Migrated followers data to new format');
            }
        }
    } catch (error) {
        console.error('Error migrating following/followers data:', error);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase Auth
    initFirebaseAuth();
    
    // Clean old localStorage chat data (migration to Firebase)
    cleanOldChatData();
    
    // Migrate following/followers data to new format
    migrateFollowingData();
    
    // Load saved posts and stories from localStorage
    loadSavedPosts();
    loadSavedStories();
    
    // Don't call showSection here - let Firebase auth callback handle navigation
    
    // Initial updates for crypto data
    updateCryptoPrices();
    updateFearGreedIndex();
    updateGlobalMarketData();
    
    // Update crypto prices every 30 seconds
    setInterval(updateCryptoPrices, 30000);
    
    // Update fear & greed index every 5 minutes
    setInterval(updateFearGreedIndex, 300000);
    
    // Update global market data every 60 seconds
    setInterval(updateGlobalMarketData, 60000);
});

// ============================================
// CRYPTO MARKET FUNCTIONS (CoinGecko API)
// ============================================

let cryptoPriceCache = null;
let cryptoPriceCacheTime = null;
const CRYPTO_PRICE_CACHE_DURATION = 60000; // 1 minute cache

// Update crypto prices from CoinGecko API
async function updateCryptoPrices() {
    // Check cache first
    const now = Date.now();
    if (cryptoPriceCache && cryptoPriceCacheTime && (now - cryptoPriceCacheTime < CRYPTO_PRICE_CACHE_DURATION)) {
        // Use cached data
        updateCryptoPricesFromCache();
        return;
    }
    
    try {
        const coins = 'bitcoin,ethereum,binancecoin,cardano,solana';
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true`);
        
        if (!response.ok) {
            console.warn('CoinGecko API rate limit reached, using cached data');
            return;
        }
        
        const data = await response.json();
        
        // Cache the data
        cryptoPriceCache = data;
        cryptoPriceCacheTime = now;
        
        // Update Bitcoin
        if (data.bitcoin) {
            updateCryptoUI('btc', data.bitcoin.usd, data.bitcoin.usd_24h_change);
        }
        
        // Update Ethereum
        if (data.ethereum) {
            updateCryptoUI('eth', data.ethereum.usd, data.ethereum.usd_24h_change);
        }
        
        // Update BNB
        if (data.binancecoin) {
            updateCryptoUI('bnb', data.binancecoin.usd, data.binancecoin.usd_24h_change);
        }
        
        // Update Cardano
        if (data.cardano) {
            updateCryptoUI('ada', data.cardano.usd, data.cardano.usd_24h_change);
        }
        
        // Update Solana
        if (data.solana) {
            updateCryptoUI('sol', data.solana.usd, data.solana.usd_24h_change);
        }
        
    } catch (error) {
        console.warn('Error fetching crypto prices, using cached data:', error.message);
    }
}

// Update UI from cached data
function updateCryptoPricesFromCache() {
    if (!cryptoPriceCache) return;
    
    if (cryptoPriceCache.bitcoin) {
        updateCryptoUI('btc', cryptoPriceCache.bitcoin.usd, cryptoPriceCache.bitcoin.usd_24h_change);
    }
    if (cryptoPriceCache.ethereum) {
        updateCryptoUI('eth', cryptoPriceCache.ethereum.usd, cryptoPriceCache.ethereum.usd_24h_change);
    }
    if (cryptoPriceCache.binancecoin) {
        updateCryptoUI('bnb', cryptoPriceCache.binancecoin.usd, cryptoPriceCache.binancecoin.usd_24h_change);
    }
    if (cryptoPriceCache.cardano) {
        updateCryptoUI('ada', cryptoPriceCache.cardano.usd, cryptoPriceCache.cardano.usd_24h_change);
    }
    if (cryptoPriceCache.solana) {
        updateCryptoUI('sol', cryptoPriceCache.solana.usd, cryptoPriceCache.solana.usd_24h_change);
    }
}

// Update individual crypto UI
function updateCryptoUI(symbol, price, change24h) {
    const priceElement = document.getElementById(`${symbol}-price`);
    const changeElement = document.getElementById(`${symbol}-change`);
    
    if (priceElement) {
        priceElement.textContent = formatPrice(price);
    }
    
    if (changeElement) {
        const formattedChange = change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;
        changeElement.textContent = formattedChange;
        changeElement.className = change24h >= 0 ? 'text-green-400 text-sm' : 'text-red-400 text-sm';
    }
}

// Format price with appropriate decimals
function formatPrice(price) {
    if (price >= 1000) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    } else {
        return `$${price.toFixed(6)}`;
    }
}

// Format market cap
function formatMarketCap(value) {
    if (value >= 1e12) {
        return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(2)}M`;
    } else {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
}

// Update Fear & Greed Index from Alternative.me API
async function updateFearGreedIndex() {
    try {
        const response = await fetch('https://api.alternative.me/fng/');
        const data = await response.json();
        
        if (data.data && data.data[0]) {
            const fngData = data.data[0];
            const value = parseInt(fngData.value);
            const classification = fngData.value_classification;
            
            // Update value and label
            const valueElement = document.getElementById('fear-greed-value');
            const labelElement = document.getElementById('fear-greed-label');
            const arcElement = document.getElementById('fear-greed-arc');
            
            if (valueElement) valueElement.textContent = value;
            if (labelElement) labelElement.textContent = classification;
            
            // Update arc color and size based on value
            if (arcElement) {
                arcElement.setAttribute('stroke-dasharray', `${value}, 100`);
                
                // Set color based on fear/greed level
                let colorClass = 'text-yellow-400';
                if (value <= 25) {
                    colorClass = 'text-red-500'; // Extreme Fear
                } else if (value <= 45) {
                    colorClass = 'text-orange-400'; // Fear
                } else if (value <= 55) {
                    colorClass = 'text-yellow-400'; // Neutral
                } else if (value <= 75) {
                    colorClass = 'text-lime-400'; // Greed
                } else {
                    colorClass = 'text-green-500'; // Extreme Greed
                }
                
                arcElement.className = `${colorClass}`;
            }
        }
    } catch (error) {
        console.error('Error fetching Fear & Greed Index:', error);
    }
}

// Get global market data
async function updateGlobalMarketData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        const data = await response.json();
        
        if (data.data) {
            const marketCapElement = document.getElementById('total-market-cap');
            const volumeElement = document.getElementById('total-volume');
            
            if (marketCapElement && data.data.total_market_cap) {
                marketCapElement.textContent = formatMarketCap(data.data.total_market_cap.usd);
            }
            
            if (volumeElement && data.data.total_volume) {
                volumeElement.textContent = formatMarketCap(data.data.total_volume.usd);
            }
        }
    } catch (error) {
        console.error('Error fetching global market data:', error);
    }
}

// ============================================
// CHAT FUNCTIONS
// ============================================

// Show new chat modal with following list
function showNewChat() {
    const modal = document.getElementById('new-chat-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    loadFollowingForChat();
}

// Hide new chat modal
function hideNewChat() {
    const modal = document.getElementById('new-chat-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Load following list for creating new chat
function loadFollowingForChat() {
    const container = document.getElementById('following-results');
    if (!container) return;
    
    const followingList = getFollowingList();
    
    if (followingList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-user-friends text-white text-opacity-30 text-4xl mb-3"></i>
                <p class="text-white text-opacity-60">No sigues a nadie aún</p>
                <p class="text-white text-opacity-40 text-sm mt-1">Sigue a otros usuarios para chatear con ellos</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    followingList.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'flex items-center justify-between p-3 hover:bg-white hover:bg-opacity-10 rounded-lg cursor-pointer transition-all';
        userDiv.onclick = () => startChatWithUser(user);
        
        const avatar = user.photoURL 
            ? `<img src="${user.photoURL}" class="w-10 h-10 rounded-full object-cover">`
            : `<div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span class="text-white font-bold">${user.name[0].toUpperCase()}</span>
               </div>`;
        
        userDiv.innerHTML = `
            ${avatar}
            <div class="flex-1 ml-3">
                <h4 class="text-white font-semibold">${user.name}</h4>
            </div>
            <i class="fas fa-comment text-white text-opacity-60"></i>
        `;
        
        container.appendChild(userDiv);
    });
}

// Start chat with a user
// Start chat with user using Firebase
async function startChatWithUser(user) {
    if (!database || !currentUser) return;
    
    try {
        const currentUserId = currentUser.uid || currentUser.email.replace(/[.@]/g, '_');
        const chatUserId = user.id.replace(/[.@]/g, '_');
        
        // Create chat entry for current user
        const chatRef = firebaseDB.ref(database, `users/${currentUserId}/chats/${chatUserId}`);
        await firebaseDB.set(chatRef, {
            userId: user.id,
            userName: user.name,
            userPhotoURL: user.photoURL || null,
            lastMessage: '',
            lastMessageTime: Date.now(),
            unread: 0
        });
        
        hideNewChat();
        showToast(`Chat con ${user.name} creado! 💬`);
        
    } catch (error) {
        console.error('Error creating chat:', error);
        showToast('Error al crear el chat');
    }
}

// Load chats list from Firebase
function loadChats() {
    const container = document.getElementById('chats-container');
    if (!container || !database) return;
    
    if (!currentUser) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-comments text-white text-opacity-30 text-5xl mb-3"></i>
                <p class="text-white text-opacity-60">Inicia sesión para ver tus chats</p>
            </div>
        `;
        return;
    }
    
    try {
        const currentUserId = currentUser.uid || currentUser.email.replace(/[.@]/g, '_');
        const chatsRef = firebaseDB.ref(database, `users/${currentUserId}/chats`);
        
        firebaseDB.onValue(chatsRef, (snapshot) => {
            const chatsData = snapshot.val();
            
            if (!chatsData) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-comments text-white text-opacity-30 text-5xl mb-3"></i>
                        <p class="text-white text-opacity-60">No hay chats aún</p>
                        <p class="text-white text-opacity-40 text-sm mt-1">Sigue a otros usuarios para comenzar a chatear</p>
                    </div>
                `;
                return;
            }
            
            // Convert to array and sort by lastMessageTime
            const userChats = Object.keys(chatsData).map(key => ({
                ...chatsData[key]
            })).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
            
            container.innerHTML = '';
            
            userChats.forEach(chat => {
                const chatDiv = document.createElement('div');
                chatDiv.className = 'glass-effect rounded-xl p-4 flex items-center cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all';
                chatDiv.onclick = () => openChat(chat);
                
                const avatar = chat.userPhotoURL 
                    ? `<img src="${chat.userPhotoURL}" class="w-12 h-12 rounded-full object-cover">`
                    : `<div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold">${chat.userName?.[0]?.toUpperCase() || 'U'}</span>
                       </div>`;
                
                const timeAgo = getRelativeTime(chat.lastMessageTime);
                
                chatDiv.innerHTML = `
                    ${avatar}
                    <div class="flex-1 ml-3">
                        <h3 class="text-white font-semibold">${chat.userName}</h3>
                        <p class="text-white text-opacity-60 text-sm line-clamp-1">${chat.lastMessage || 'Comienza una conversación'}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-white text-opacity-60 text-xs">${timeAgo}</div>
                        ${chat.unread > 0 ? `<div class="w-5 h-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center mt-1">${chat.unread}</div>` : ''}
                    </div>
                `;
                
                container.appendChild(chatDiv);
            });
        }, (error) => {
            console.error('Error loading chats:', error);
        });
        
    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

// Current active chat
let currentActiveChat = null;
let messagesListener = null;

// Initialize chat listeners when user logs in
function initializeChatListeners() {
    if (!currentUser || !database) return;
    
    const currentUserId = currentUser.uid || currentUser.email.replace(/[.@]/g, '_');
    
    // Listen for chat list updates
    const chatsRef = firebaseDB.ref(database, `users/${currentUserId}/chats`);
    firebaseDB.onValue(chatsRef, (snapshot) => {
        const chatsData = snapshot.val();
        console.log('Chat list updated:', chatsData);
        // Reload chats if we're in the chat section
        if (currentSection === 'chat') {
            loadChats();
        }
    });
}

// Get chat ID (always use alphabetical order for consistency)
function getChatId(userId1, userId2) {
    const id1 = userId1.replace(/[.@]/g, '_');
    const id2 = userId2.replace(/[.@]/g, '_');
    return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
}

// Open individual chat
function openChat(chat) {
    console.log('Opening chat with:', chat); // Debug log
    
    if (!chat) {
        console.error('Chat object is null or undefined');
        showToast('Error al abrir el chat');
        return;
    }
    
    currentActiveChat = chat;
    
    // Hide chat section (list view), show individual chat
    const chatSection = document.getElementById('chat-section');
    const individualChat = document.getElementById('individual-chat');
    
    console.log('Chat section element:', chatSection); // Debug log
    console.log('Individual chat element:', individualChat); // Debug log
    
    if (chatSection) {
        chatSection.classList.add('hidden');
    }
    
    if (individualChat) {
        individualChat.classList.remove('hidden');
        individualChat.classList.add('flex');
    }
    
    // Update chat header
    const chatAvatar = document.getElementById('chat-avatar');
    const chatName = document.getElementById('chat-name');
    const chatStatus = document.getElementById('chat-status');
    
    // Use userName from chat object
    const userName = chat.userName || chat.name || 'Usuario';
    const userId = chat.userId || chat.id;
    
    console.log('Chat details - userName:', userName, 'userId:', userId); // Debug log
    
    if (chatAvatar && chatName) {
        const initial = userName[0]?.toUpperCase() || 'U';
        chatAvatar.innerHTML = `<span class="text-white font-bold">${initial}</span>`;
        chatName.textContent = userName;
        if (chatStatus) chatStatus.textContent = 'En línea';
    }
    
    // Load messages for this chat
    if (userId) {
        loadMessages(userId);
        markChatAsRead(userId);
    } else {
        console.error('No userId found in chat object:', chat);
        showToast('Error: ID de usuario no encontrado');
    }
}

// Back to chats list
function backToChats() {
    currentActiveChat = null;
    
    const individualChat = document.getElementById('individual-chat');
    const chatSection = document.getElementById('chat-section');
    
    console.log('Going back to chats'); // Debug log
    
    if (individualChat) {
        individualChat.classList.add('hidden');
        individualChat.classList.remove('flex');
    }
    
    if (chatSection) {
        chatSection.classList.remove('hidden');
    }
    
    // Reload chats to update unread counts
    loadChats();
}

// Load messages from Firebase Realtime Database
function loadMessages(userId) {
    console.log('=== LOADING MESSAGES FROM FIREBASE ===');
    console.log('Loading messages for userId:', userId);
    
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer || !database || !currentUser) {
        console.error('Missing container, database, or user');
        return;
    }
    
    // Remove previous listener if exists
    if (messagesListener) {
        messagesListener();
    }
    
    try {
        const currentUserId = currentUser.uid || currentUser.email.replace(/[.@]/g, '_');
        const chatUserId = userId.replace(/[.@]/g, '_');
        const chatId = getChatId(currentUserId, chatUserId);
        
        console.log('Chat ID:', chatId);
        
        // Listen to messages in real-time
        const messagesRef = firebaseDB.ref(database, `chats/${chatId}/messages`);
        
        messagesListener = firebaseDB.onValue(messagesRef, (snapshot) => {
            const messagesData = snapshot.val();
            console.log('Messages data from Firebase:', messagesData);
            
            if (!messagesData) {
                messagesContainer.innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-comment-dots text-white text-opacity-30 text-5xl mb-3"></i>
                        <p class="text-white text-opacity-60">No hay mensajes aún</p>
                        <p class="text-white text-opacity-40 text-sm mt-1">Envía el primer mensaje</p>
                    </div>
                `;
                return;
            }
            
            // Convert object to array and sort by timestamp
            const messagesArray = Object.keys(messagesData).map(key => ({
                id: key,
                ...messagesData[key]
            })).sort((a, b) => a.timestamp - b.timestamp);
            
            console.log('Total messages:', messagesArray.length);
            
            // Render messages
            messagesContainer.innerHTML = messagesArray.map(msg => {
                const isMine = msg.senderId === currentUserId;
                const alignment = isMine ? 'justify-end' : 'justify-start';
                const bgColor = isMine ? 'bg-blue-500' : 'bg-white bg-opacity-20';
                const roundedCorner = isMine ? 'rounded-br-md' : 'rounded-bl-md';
                
                return `
                    <div class="flex ${alignment}">
                        <div class="message-bubble ${bgColor} text-white p-3 rounded-2xl ${roundedCorner} max-w-xs lg:max-w-md">
                            <p>${msg.text}</p>
                            <p class="text-xs text-white text-opacity-60 mt-1">${formatMessageTime(msg.timestamp)}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            console.log('=====================================');
        }, (error) => {
            console.error('Error listening to messages:', error);
            messagesContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-circle text-white text-opacity-30 text-5xl mb-3"></i>
                    <p class="text-white text-opacity-60">Error al cargar mensajes</p>
                </div>
            `;
        });
        
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-circle text-white text-opacity-30 text-5xl mb-3"></i>
                <p class="text-white text-opacity-60">Error al cargar mensajes</p>
            </div>
        `;
    }
}

// Send message using Firebase Realtime Database
async function sendMessage(event) {
    event.preventDefault();
    
    if (!currentActiveChat || !currentUser || !database) {
        console.error('No active chat, user, or database');
        return;
    }
    
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    
    if (!messageText) return;
    
    try {
        const currentUserId = currentUser.uid || currentUser.email.replace(/[.@]/g, '_');
        const chatUserId = (currentActiveChat.userId || currentActiveChat.id).replace(/[.@]/g, '_');
        const chatId = getChatId(currentUserId, chatUserId);
        
        console.log('=== SENDING MESSAGE TO FIREBASE ===');
        console.log('From:', currentUserId);
        console.log('To:', chatUserId);
        console.log('Chat ID:', chatId);
        
        // Create message object
        const message = {
            senderId: currentUserId,
            receiverId: chatUserId,
            text: messageText,
            timestamp: Date.now(),
            read: false
        };
        
        // Save message to Firebase
        const messagesRef = firebaseDB.ref(database, `chats/${chatId}/messages`);
        const newMessageRef = firebaseDB.push(messagesRef);
        await firebaseDB.set(newMessageRef, message);
        
        console.log('Message saved to Firebase!');
        
        // Update chat metadata for both users
        const updates = {};
        updates[`users/${currentUserId}/chats/${chatUserId}`] = {
            userId: chatUserId,
            userName: currentActiveChat.userName || currentActiveChat.name,
            userPhotoURL: currentActiveChat.userPhotoURL || null,
            lastMessage: messageText.substring(0, 50),
            lastMessageTime: Date.now(),
            unread: 0
        };
        
        updates[`users/${chatUserId}/chats/${currentUserId}`] = {
            userId: currentUserId,
            userName: currentUser.displayName || currentUser.name,
            userPhotoURL: currentUser.photoURL || null,
            lastMessage: messageText.substring(0, 50),
            lastMessageTime: Date.now(),
            unread: firebaseDB.increment ? firebaseDB.increment(1) : 1
        };
        
        await firebaseDB.update(firebaseDB.ref(database), updates);
        
        // Clear input
        messageInput.value = '';
        
        // Send notification to receiver - save directly to Firebase
        const senderName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Alguien';
        const receiverUserId = currentActiveChat.uid || currentActiveChat.userId || currentActiveChat.id;  // Usar UID directo
        
        const notificationData = {
            id: Date.now().toString(),
            type: 'comment',
            message: `${senderName} te envió un mensaje: "${messageText.substring(0, 30)}${messageText.length > 30 ? '...' : ''}"`,
            user: {
                displayName: senderName,
                photoURL: currentUser.photoURL || null
            },
            timestamp: Date.now(),
            read: false
        };
        
        console.log('💬 Saving message notification:');
        console.log('  From (sender):', currentUserId);
        console.log('  To (receiver):', receiverUserId);
        console.log('  Firebase path:', `notifications/${receiverUserId}/${notificationData.id}`);
        console.log('  Message:', notificationData.message);
        
        const notifRef = firebaseDB.ref(database, `notifications/${receiverUserId}/${notificationData.id}`);
        await firebaseDB.set(notifRef, notificationData)
            .then(() => {
                console.log('✅ Message notification saved successfully to receiver:', receiverUserId);
            })
            .catch(err => {
                console.error('❌ Error saving message notification:', err);
            });
        
        showToast('Mensaje enviado ✓');
        console.log('===================================');
        
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Error al enviar mensaje');
    }
}

// Mark chat as read using Firebase
async function markChatAsRead(userId) {
    if (!currentUser || !database) return;
    
    try {
        const currentUserId = currentUser.uid || currentUser.email.replace(/[.@]/g, '_');
        const chatUserId = userId.replace(/[.@]/g, '_');
        
        // Update unread count to 0
        const chatRef = firebaseDB.ref(database, `users/${currentUserId}/chats/${chatUserId}/unread`);
        await firebaseDB.set(chatRef, 0);
        
        console.log('Chat marked as read');
    } catch (error) {
        console.error('Error marking chat as read:', error);
    }
}

// Format message time
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) return 'Ahora';
    
    // Less than an hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `Hace ${minutes} min`;
    }
    
    // Same day
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Different day
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// Chat options menu
function showChatOptions() {
    const menu = document.getElementById('chat-options-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function archiveCurrentChat() {
    showToast('Chat archivado');
    showChatOptions();
    backToChats();
}

function blockUser() {
    if (confirm('¿Estás seguro de que deseas bloquear a este usuario?')) {
        showToast('Usuario bloqueado');
        showChatOptions();
        backToChats();
    }
}

// Show chat tab
function showChatTab(tab) {
    // Hide all tabs
    document.getElementById('chats-list').classList.add('hidden');
    document.getElementById('archived-list').classList.add('hidden');
    
    // Show selected tab
    if (tab === 'chats') {
        document.getElementById('chats-list').classList.remove('hidden');
        loadChats();
    } else if (tab === 'archived') {
        document.getElementById('archived-list').classList.remove('hidden');
    }
    
    // Update button styles
    const buttons = document.querySelectorAll('.chat-tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-white', 'bg-opacity-20');
        btn.classList.add('hover:bg-white', 'hover:bg-opacity-10');
    });
    
    event.target.classList.add('bg-white', 'bg-opacity-20');
    event.target.classList.remove('hover:bg-white', 'hover:bg-opacity-10');
}

// ============================================
// CRYPTO CHART MODAL FUNCTIONS
// ============================================

let currentCryptoChart = null;
let cryptoChartDataCache = {};
const cryptoMapping = {
    'BTC': { id: 'bitcoin', symbol: 'BTCUSD', name: 'Bitcoin', icon: 'fab fa-bitcoin', color: 'bg-yellow-500' },
    'ETH': { id: 'ethereum', symbol: 'ETHUSD', name: 'Ethereum', icon: 'fab fa-ethereum', color: 'bg-blue-500' },
    'BNB': { id: 'binancecoin', symbol: 'BNBUSD', name: 'BNB', icon: 'fas fa-coins', color: 'bg-yellow-600' },
    'ADA': { id: 'cardano', symbol: 'ADAUSD', name: 'Cardano', icon: 'fas fa-coins', color: 'bg-blue-600' },
    'SOL': { id: 'solana', symbol: 'SOLUSD', name: 'Solana', icon: 'fas fa-sun', color: 'bg-purple-600' }
};

// Show crypto chart modal
async function showCryptoChart(symbol) {
    const modal = document.getElementById('crypto-chart-modal');
    if (!modal) return;
    
    const crypto = cryptoMapping[symbol];
    if (!crypto) return;
    
    // Update modal header
    const iconElement = document.getElementById('chart-crypto-icon');
    const nameElement = document.getElementById('chart-crypto-name');
    const symbolElement = document.getElementById('chart-crypto-symbol');
    
    if (iconElement) {
        iconElement.className = `w-10 h-10 ${crypto.color} rounded-full flex items-center justify-center mr-3`;
        iconElement.innerHTML = `<i class="${crypto.icon} text-white"></i>`;
    }
    if (nameElement) nameElement.textContent = crypto.name;
    if (symbolElement) symbolElement.textContent = `${symbol}/USD`;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Load real-time data (with cache)
    await loadCryptoChartData(crypto.id, symbol);
    
    // Initialize TradingView chart
    initTradingViewChart(crypto.symbol);
}

// Hide crypto chart modal
function hideCryptoChart() {
    const modal = document.getElementById('crypto-chart-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Destroy TradingView widget
    if (currentCryptoChart) {
        const container = document.getElementById('tradingview-chart');
        if (container) {
            container.innerHTML = '';
        }
        currentCryptoChart = null;
    }
}

// Load crypto chart data from CoinGecko (with cache)
async function loadCryptoChartData(coinId, symbol) {
    const now = Date.now();
    const CACHE_DURATION = 120000; // 2 minutes cache
    
    // Check cache
    if (cryptoChartDataCache[coinId] && 
        cryptoChartDataCache[coinId].time && 
        (now - cryptoChartDataCache[coinId].time < CACHE_DURATION)) {
        // Use cached data
        displayCryptoChartData(cryptoChartDataCache[coinId].data);
        return;
    }
    
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
        );
        
        if (!response.ok) {
            console.warn('CoinGecko API rate limit, using cached data if available');
            // Try to use old cached data
            if (cryptoChartDataCache[coinId]) {
                displayCryptoChartData(cryptoChartDataCache[coinId].data);
            }
            return;
        }
        
        const data = await response.json();
        
        // Cache the data
        cryptoChartDataCache[coinId] = {
            data: data,
            time: now
        };
        
        displayCryptoChartData(data);
        
    } catch (error) {
        console.warn('Error loading crypto chart data:', error.message);
        // Try to use cached data
        if (cryptoChartDataCache[coinId]) {
            displayCryptoChartData(cryptoChartDataCache[coinId].data);
        }
    }
}

// Display crypto chart data in UI
function displayCryptoChartData(data) {
    if (data && data.market_data) {
        const marketData = data.market_data;
        
        // Update price
        const priceElement = document.getElementById('chart-current-price');
        if (priceElement && marketData.current_price) {
            priceElement.textContent = formatPrice(marketData.current_price.usd);
        }
        
        // Update price change
        const changeElement = document.getElementById('chart-price-change');
        if (changeElement && marketData.price_change_percentage_24h !== undefined) {
            const change = marketData.price_change_percentage_24h;
            const changeValue = marketData.price_change_24h;
            const isPositive = change >= 0;
            
            changeElement.textContent = `${isPositive ? '+' : ''}${change.toFixed(2)}% (${isPositive ? '+' : ''}${formatPrice(changeValue)})`;
            changeElement.className = isPositive ? 'text-green-400 text-lg' : 'text-red-400 text-lg';
        }
        
        // Update 24h high
        const highElement = document.getElementById('chart-high-24h');
        if (highElement && marketData.high_24h) {
            highElement.textContent = formatPrice(marketData.high_24h.usd);
        }
        
        // Update 24h low
        const lowElement = document.getElementById('chart-low-24h');
        if (lowElement && marketData.low_24h) {
            lowElement.textContent = formatPrice(marketData.low_24h.usd);
        }
        
        // Update 24h volume
        const volumeElement = document.getElementById('chart-volume-24h');
        if (volumeElement && marketData.total_volume) {
            volumeElement.textContent = formatMarketCap(marketData.total_volume.usd);
        }
        
        // Update market cap
        const marketCapElement = document.getElementById('chart-market-cap');
        if (marketCapElement && marketData.market_cap) {
            marketCapElement.textContent = formatMarketCap(marketData.market_cap.usd);
        }
    }
}

// Initialize TradingView chart
function initTradingViewChart(symbol) {
    const container = document.getElementById('tradingview-chart');
    if (!container) return;
    
    // Clear previous chart
    container.innerHTML = '';
    
    // Create TradingView widget
    try {
        currentCryptoChart = new TradingView.widget({
            autosize: true,
            symbol: `BINANCE:${symbol}`,
            interval: 'D',
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'es',
            toolbar_bg: '#1a1a2e',
            enable_publishing: false,
            hide_top_toolbar: false,
            hide_legend: false,
            save_image: false,
            container_id: 'tradingview-chart',
            studies: [
                'MASimple@tv-basicstudies'
            ],
            disabled_features: [
                'use_localstorage_for_settings',
                'volume_force_overlay'
            ],
            enabled_features: [
                'hide_left_toolbar_by_default'
            ],
            backgroundColor: '#1a1a2e',
            gridColor: 'rgba(255, 255, 255, 0.06)',
            overrides: {
                'paneProperties.background': '#1a1a2e',
                'paneProperties.backgroundType': 'solid',
                'mainSeriesProperties.candleStyle.upColor': '#10b981',
                'mainSeriesProperties.candleStyle.downColor': '#ef4444',
                'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
                'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
                'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
                'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444'
            }
        });
    } catch (error) {
        console.error('Error initializing TradingView chart:', error);
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <i class="fas fa-chart-line text-white text-opacity-50 text-4xl mb-3"></i>
                    <p class="text-white text-opacity-70">Error al cargar el gráfico</p>
                </div>
            </div>
        `;
    }
}

// ============================================
// NEWS FUNCTIONS (NewsAPI)
// ============================================

const NEWS_API_KEY = '91a86a73df094c3aa37737488f272d31';
let newsCache = null;
let newsCacheTime = null;
const NEWS_CACHE_DURATION = 300000; // 5 minutes

// Load crypto news from NewsAPI
async function loadCryptoNews() {
    const loadingElement = document.getElementById('news-loading');
    const containerElement = document.getElementById('news-container');
    const errorElement = document.getElementById('news-error');
    
    // Check cache first
    const now = Date.now();
    if (newsCache && newsCacheTime && (now - newsCacheTime < NEWS_CACHE_DURATION)) {
        displayNews(newsCache);
        return;
    }
    
    // Show loading
    if (loadingElement) loadingElement.classList.remove('hidden');
    if (containerElement) containerElement.classList.add('hidden');
    if (errorElement) errorElement.classList.add('hidden');
    
    try {
        // Use CryptoCompare News API (completely free, no key required)
        const response = await fetch(
            'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,ETH,Trading,Blockchain'
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.Data && data.Data.length > 0) {
            // Transform CryptoCompare data to match our format
            const articles = data.Data.slice(0, 15).map(item => ({
                title: item.title,
                description: item.body.substring(0, 150) + '...',
                url: item.url || item.guid,
                urlToImage: item.imageurl || 'https://via.placeholder.com/400x200/667eea/ffffff?text=Crypto+News',
                publishedAt: new Date(item.published_on * 1000).toISOString(),
                source: { name: item.source_info?.name || item.source || 'CryptoCompare' }
            }));
            
            newsCache = articles;
            newsCacheTime = now;
            displayNews(articles);
        } else {
            throw new Error('No articles found');
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        
        if (loadingElement) loadingElement.classList.add('hidden');
        if (errorElement) errorElement.classList.remove('hidden');
    }
}

// Display news articles
function displayNews(articles) {
    const loadingElement = document.getElementById('news-loading');
    const containerElement = document.getElementById('news-container');
    const errorElement = document.getElementById('news-error');
    
    if (loadingElement) loadingElement.classList.add('hidden');
    if (errorElement) errorElement.classList.add('hidden');
    if (!containerElement) return;
    
    containerElement.classList.remove('hidden');
    containerElement.innerHTML = '';
    
    articles.forEach((article, index) => {
        const newsItem = document.createElement('div');
        newsItem.className = 'glass-effect rounded-xl p-4 hover:bg-white hover:bg-opacity-10 transition-all cursor-pointer';
        
        // Get time ago
        const publishedDate = new Date(article.publishedAt);
        const timeAgo = getNewsTimeAgo(publishedDate);
        
        // Random gradient for variety
        const gradients = [
            'from-purple-500 to-pink-500',
            'from-blue-500 to-cyan-500',
            'from-green-500 to-emerald-500',
            'from-orange-500 to-red-500',
            'from-indigo-500 to-purple-500',
            'from-pink-500 to-rose-500'
        ];
        const gradient = gradients[index % gradients.length];
        
        newsItem.innerHTML = `
            <div class="relative rounded-lg h-48 mb-3 overflow-hidden">
                ${article.urlToImage 
                    ? `<img src="${article.urlToImage}" alt="${article.title}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\\'bg-gradient-to-r ${gradient} h-full flex items-center justify-center\\'><i class=\\'fas fa-newspaper text-white text-3xl\\'></i></div>';">`
                    : `<div class="bg-gradient-to-r ${gradient} h-full flex items-center justify-center"><i class="fas fa-newspaper text-white text-3xl"></i></div>`
                }
                ${article.source?.name ? `
                    <div class="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                        ${article.source.name}
                    </div>
                ` : ''}
            </div>
            <h3 class="text-white font-semibold mb-2 line-clamp-2">${article.title}</h3>
            <p class="text-white text-opacity-70 text-sm mb-3 line-clamp-3">${article.description || 'No hay descripción disponible.'}</p>
            <div class="flex justify-between items-center">
                <span class="text-white text-opacity-60 text-xs">${timeAgo}</span>
                <button onclick="openNewsArticle('${article.url.replace(/'/g, "\\'")}', event)" class="text-blue-400 hover:text-blue-300 transition-colors">
                    <i class="fas fa-external-link-alt"></i>
                </button>
            </div>
        `;
        
        // Click to open article
        newsItem.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                window.open(article.url, '_blank');
            }
        });
        
        containerElement.appendChild(newsItem);
    });
}

// Open news article in new tab
function openNewsArticle(url, event) {
    if (event) event.stopPropagation();
    window.open(url, '_blank');
}

// Get time ago for news articles
function getNewsTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'ahora mismo';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ==================== PUSH NOTIFICATIONS ====================

// Request notification permission
async function requestNotificationPermission() {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones de escritorio');
        return;
    }
    
    // Check if permission has already been granted or denied
    if (Notification.permission === 'granted') {
        console.log('Permisos de notificación ya concedidos');
        return;
    }
    
    if (Notification.permission === 'denied') {
        console.log('Permisos de notificación denegados por el usuario');
        return;
    }
    
    // Request permission
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Permiso de notificación concedido');
            showToast('✅ Notificaciones habilitadas! Recibirás alertas en tiempo real');
        } else {
            console.log('Permiso de notificación denegado');
        }
    } catch (error) {
        console.error('Error solicitando permiso de notificación:', error);
    }
}

// Send browser push notification
function sendPushNotification(title, options = {}) {
    // Check if browser supports notifications and permission is granted
    if (!('Notification' in window)) {
        console.log('Notificaciones no soportadas');
        return;
    }
    
    if (Notification.permission !== 'granted') {
        console.log('Permisos de notificación no concedidos');
        return;
    }
    
    try {
        const defaultOptions = {
            icon: 'https://raw.githubusercontent.com/diegodevxd/nitedred/main/src/css/logo.png',
            badge: 'https://raw.githubusercontent.com/diegodevxd/nitedred/main/src/css/logo.png',
            vibrate: [200, 100, 200],
            tag: 'nitedcrypto-notification',
            requireInteraction: false,
            ...options
        };
        
        const notification = new Notification(title, defaultOptions);
        
        // Click handler - focus the window
        notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            notification.close();
            
            // If there's a URL in the data, navigate to it
            if (options.data && options.data.url) {
                window.location.href = options.data.url;
            }
        };
        
        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
        
    } catch (error) {
        console.error('Error enviando notificación push:', error);
    }
}

// Expose to window
window.requestNotificationPermission = requestNotificationPermission;
window.sendPushNotification = sendPushNotification;



