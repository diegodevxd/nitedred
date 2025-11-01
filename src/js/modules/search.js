/**
 * Search Module - Global Search & Explore Features
 */

import { firebaseDB } from '../firebase-config.js';

let searchTimeout = null;
let currentSearchTab = 'all';
let searchCache = {
    posts: [],
    users: [],
    hashtags: []
};

/**
 * Handle global search input
 */
async function handleGlobalSearch(query) {
    clearTimeout(searchTimeout);
    
    if (!query || query.trim().length < 2) {
        hideSearchResults();
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        await performSearch(query.trim().toLowerCase());
    }, 300);
}

// Expose to window
window.handleGlobalSearch = handleGlobalSearch;

/**
 * Perform search across posts, users, and hashtags
 */
async function performSearch(query) {
    try {
        showSearchResults();
        
        // Show loading
        const resultsContent = document.getElementById('search-results-content');
        resultsContent.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-white text-3xl mb-3"></i>
                <p class="text-white text-opacity-60">Buscando...</p>
            </div>
        `;
        
        // Search in parallel
        const [posts, users, hashtags] = await Promise.all([
            searchPosts(query),
            searchUsers(query),
            searchHashtags(query)
        ]);
        
        searchCache = { posts, users, hashtags };
        displaySearchResults();
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        const resultsContent = document.getElementById('search-results-content');
        resultsContent.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-circle text-red-400 text-3xl mb-3"></i>
                <p class="text-white text-opacity-60">Error al buscar</p>
            </div>
        `;
    }
}

/**
 * Search posts by content and hashtags
 */
async function searchPosts(query) {
    try {
        console.log('🔍 Searching posts for:', query);
        const postsRef = firebaseDB.ref(firebaseDB.database, 'posts');
        const snapshot = await firebaseDB.get(postsRef);
        
        if (!snapshot.exists()) {
            console.log('❌ No posts found in database');
            return [];
        }
        
        const posts = [];
        snapshot.forEach(child => {
            const post = { id: child.key, ...child.val() };
            const content = (post.content || '').toLowerCase();
            
            // Search in content or hashtags
            if (content.includes(query)) {
                posts.push(post);
            }
        });
        
        console.log(`✅ Found ${posts.length} posts matching "${query}"`);
        
        // Sort by timestamp (newest first)
        return posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
    } catch (error) {
        console.error('Error buscando posts:', error);
        return [];
    }
}

/**
 * Search users by username
 */
async function searchUsers(query) {
    try {
        console.log('👤 Searching users for:', query);
        const usersRef = firebaseDB.ref(firebaseDB.database, 'users');
        const snapshot = await firebaseDB.get(usersRef);
        
        if (!snapshot.exists()) {
            console.log('❌ No users found in database');
            return [];
        }
        
        const users = [];
        snapshot.forEach(child => {
            const user = { id: child.key, ...child.val() };
            const userName = (user.userName || '').toLowerCase();
            
            if (userName.includes(query)) {
                users.push(user);
            }
        });
        
        console.log(`✅ Found ${users.length} users matching "${query}"`);
        return users;
        
    } catch (error) {
        console.error('Error buscando usuarios:', error);
        return [];
    }
}

/**
 * Extract and search hashtags
 */
async function searchHashtags(query) {
    try {
        console.log('🏷️ Searching hashtags for:', query);
        const postsRef = firebaseDB.ref(firebaseDB.database, 'posts');
        const snapshot = await firebaseDB.get(postsRef);
        
        if (!snapshot.exists()) {
            console.log('❌ No posts found for hashtag search');
            return [];
        }
        
        const hashtagMap = new Map();
        const normalizedQuery = query.toLowerCase().replace(/^#/, ''); // Remove # if present
        
        snapshot.forEach(child => {
            const post = child.val();
            const content = post.content || '';
            const hashtags = content.match(/#[\wáéíóúñ]+/gi) || [];
            
            hashtags.forEach(tag => {
                const normalizedTag = tag.toLowerCase();
                const tagWithoutHash = normalizedTag.substring(1); // Remove # for comparison
                
                // Match if query matches tag with or without #
                if (normalizedTag.includes(query) || 
                    tagWithoutHash.includes(normalizedQuery) ||
                    query.includes(tagWithoutHash)) {
                    
                    if (!hashtagMap.has(normalizedTag)) {
                        hashtagMap.set(normalizedTag, {
                            tag: tag,
                            count: 0,
                            posts: []
                        });
                    }
                    const hashtagData = hashtagMap.get(normalizedTag);
                    hashtagData.count++;
                    hashtagData.posts.push(child.key);
                }
            });
        });
        
        const results = Array.from(hashtagMap.values()).sort((a, b) => b.count - a.count);
        console.log(`✅ Found ${results.length} hashtags matching "${query}":`, results.map(r => r.tag));
        
        return results;
        
    } catch (error) {
        console.error('Error buscando hashtags:', error);
        return [];
    }
}

/**
 * Display search results based on current tab
 */
function displaySearchResults() {
    const resultsContent = document.getElementById('search-results-content');
    const { posts, users, hashtags } = searchCache;
    
    const totalResults = posts.length + users.length + hashtags.length;
    
    if (totalResults === 0) {
        resultsContent.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-search text-white text-opacity-40 text-4xl mb-3"></i>
                <p class="text-white text-opacity-60">No se encontraron resultados</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    if (currentSearchTab === 'all' || currentSearchTab === 'users') {
        if (users.length > 0) {
            html += '<div class="mb-4"><h4 class="text-white text-sm font-semibold mb-2">Usuarios</h4>';
            users.slice(0, currentSearchTab === 'all' ? 3 : 20).forEach(user => {
                html += createUserResultCard(user);
            });
            html += '</div>';
        }
    }
    
    if (currentSearchTab === 'all' || currentSearchTab === 'hashtags') {
        if (hashtags.length > 0) {
            html += '<div class="mb-4"><h4 class="text-white text-sm font-semibold mb-2">Hashtags</h4>';
            hashtags.slice(0, currentSearchTab === 'all' ? 5 : 20).forEach(hashtag => {
                html += createHashtagResultCard(hashtag);
            });
            html += '</div>';
        }
    }
    
    if (currentSearchTab === 'all' || currentSearchTab === 'posts') {
        if (posts.length > 0) {
            html += '<div class="mb-4"><h4 class="text-white text-sm font-semibold mb-2">Posts</h4>';
            posts.slice(0, currentSearchTab === 'all' ? 3 : 20).forEach(post => {
                html += createPostResultCard(post);
            });
            html += '</div>';
        }
    }
    
    resultsContent.innerHTML = html;
}

/**
 * Create user result card
 */
function createUserResultCard(user) {
    const initial = (user.userName || 'U').charAt(0).toUpperCase();
    const photoHTML = user.photoURL 
        ? `<img src="${user.photoURL}" alt="${user.userName}" class="w-10 h-10 rounded-full object-cover">`
        : `<div class="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
             <span class="text-white font-bold">${initial}</span>
           </div>`;
    
    return `
        <div class="glass-effect rounded-xl p-3 flex items-center justify-between hover:bg-white hover:bg-opacity-10 transition-all cursor-pointer"
             onclick="viewUserProfile('${user.id}')">
            <div class="flex items-center">
                ${photoHTML}
                <div class="ml-3">
                    <div class="text-white font-semibold">${user.userName || 'Usuario'}</div>
                    ${user.bio ? `<div class="text-white text-opacity-60 text-sm truncate max-w-xs">${user.bio}</div>` : ''}
                </div>
            </div>
            <button class="text-pink-400 text-sm font-medium">
                Ver perfil
            </button>
        </div>
    `;
}

/**
 * Create hashtag result card
 */
function createHashtagResultCard(hashtag) {
    return `
        <div class="glass-effect rounded-xl p-3 flex items-center justify-between hover:bg-white hover:bg-opacity-10 transition-all cursor-pointer"
             onclick="filterByHashtag('${hashtag.tag}')">
            <div class="flex items-center">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <i class="fas fa-hashtag text-white"></i>
                </div>
                <div class="ml-3">
                    <div class="text-white font-semibold">${hashtag.tag}</div>
                    <div class="text-white text-opacity-60 text-sm">${hashtag.count} post${hashtag.count !== 1 ? 's' : ''}</div>
                </div>
            </div>
            <i class="fas fa-chevron-right text-white text-opacity-40"></i>
        </div>
    `;
}

/**
 * Create post result card
 */
function createPostResultCard(post) {
    const content = post.content || '';
    const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
    
    return `
        <div class="glass-effect rounded-xl p-3 hover:bg-white hover:bg-opacity-10 transition-all cursor-pointer"
             onclick="viewPost('${post.id}')">
            <div class="flex items-start">
                <div class="flex-1">
                    <div class="text-white text-opacity-80 text-sm mb-2">${preview}</div>
                    <div class="flex items-center space-x-4 text-white text-opacity-60 text-xs">
                        ${post.likes ? `<span><i class="fas fa-heart text-pink-400 mr-1"></i>${Object.keys(post.likes).length}</span>` : ''}
                        ${post.comments ? `<span><i class="fas fa-comment mr-1"></i>${Object.keys(post.comments).length}</span>` : ''}
                    </div>
                </div>
                ${post.mediaURL ? `<img src="${post.mediaURL}" class="w-16 h-16 rounded-lg object-cover ml-3" />` : ''}
            </div>
        </div>
    `;
}

/**
 * Switch search tabs
 */
function switchSearchTab(tab) {
    currentSearchTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.search-tab-btn').forEach(btn => {
        btn.classList.remove('border-pink-400', 'text-white');
        btn.classList.add('text-white', 'text-opacity-60');
    });
    
    event.target.classList.remove('text-opacity-60');
    event.target.classList.add('border-pink-400', 'text-white');
    
    displaySearchResults();
}

// Expose to window  
window.switchSearchTab = switchSearchTab;

/**
 * Show/Hide search results panel
 */
function showSearchResults() {
    document.getElementById('search-results-panel').classList.remove('hidden');
}

function hideSearchResults() {
    document.getElementById('search-results-panel').classList.add('hidden');
    
    // Clear the mobile search input if it exists
    const mobileSearchInput = document.getElementById('mobile-search-input');
    if (mobileSearchInput) {
        mobileSearchInput.value = '';
    }
    
    // Clear the global search input if it exists (backward compatibility)
    const globalSearchInput = document.getElementById('global-search-input');
    if (globalSearchInput) {
        globalSearchInput.value = '';
    }
}

// Expose to window
window.showSearchResults = showSearchResults;
window.hideSearchResults = hideSearchResults;

/**
 * Toggle mobile search
 */
function toggleMobileSearch() {
    const modal = document.getElementById('mobile-search-modal');
    modal.classList.toggle('hidden');
    
    if (!modal.classList.contains('hidden')) {
        document.getElementById('mobile-search-input').focus();
    } else {
        document.getElementById('mobile-search-input').value = '';
    }
}

// Expose to window
window.toggleMobileSearch = toggleMobileSearch;

/**
 * Filter posts by hashtag (clickable hashtags)
 */
async function filterByHashtag(hashtag) {
    try {
        // Only change section if not already on explore
        if (window.currentSection !== 'explore') {
            hideSearchResults();
            window.showSection('explore');
            // Wait for section to load
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const trendingPosts = document.getElementById('trending-posts');
        if (!trendingPosts) {
            console.error('trending-posts container not found');
            return;
        }
        
        trendingPosts.innerHTML = `
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-white text-lg font-semibold">Posts con ${hashtag}</h3>
                <button onclick="loadExploreContent()" class="text-pink-400 text-sm">
                    <i class="fas fa-times mr-1"></i>Limpiar
                </button>
            </div>
            <div class="text-center py-6">
                <i class="fas fa-spinner fa-spin text-white text-3xl mb-3"></i>
                <p class="text-white text-opacity-60">Cargando posts...</p>
            </div>
        `;
        
        const filteredPosts = [];
        const normalizedHashtag = hashtag.toLowerCase();

        let fromFirebase = false;
        try {
            const postsRef = firebaseDB.ref(firebaseDB.database, 'posts');
            const snapshot = await firebaseDB.get(postsRef);
            if (snapshot.exists()) {
                fromFirebase = true;
                snapshot.forEach(child => {
                    const post = { id: child.key, ...child.val() };
                    const content = (post.content || '').toLowerCase();
                    if (content.includes(normalizedHashtag)) {
                        filteredPosts.push(post);
                    }
                });
            }
        } catch (e) {
            // Fallback: localStorage
            const saved = localStorage.getItem('nitedcrypto_posts');
            if (saved) {
                JSON.parse(saved).forEach(post => {
                    const content = (post.content || '').toLowerCase();
                    if (content.includes(normalizedHashtag)) {
                        filteredPosts.push(post);
                    }
                });
            }
        }
        
        if (filteredPosts.length === 0) {
            trendingPosts.innerHTML = `
                <div class="text-center py-8 glass-effect rounded-xl">
                    <i class="fas fa-hashtag text-white text-opacity-40 text-3xl mb-2"></i>
                    <p class="text-white text-opacity-60">No hay posts con este hashtag</p>
                </div>
            `;
            return;
        }
        
        // Sort by timestamp
        filteredPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        // Display posts (reuse existing post rendering)
        let html = `
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-white text-lg font-semibold">Posts con ${hashtag}</h3>
                <button onclick="loadExploreContent()" class="text-pink-400 text-sm">
                    <i class="fas fa-times mr-1"></i>Limpiar
                </button>
            </div>
        `;
        
        filteredPosts.forEach(post => {
            html += createPostCard(post);
        });
        
        trendingPosts.innerHTML = html;
        
    } catch (error) {
        console.warn('Error filtrando por hashtag (usando fallbacks):', error);
    }
}

// Expose to window
window.filterByHashtag = filterByHashtag;

/**
 * Create post card (simplified version for explore)
 */
function createPostCard(postData) {
    const content = postData.content || '';
    const userName = postData.userName || 'Usuario';
    const userPhoto = postData.userPhoto || '';
    const initial = userName.charAt(0).toUpperCase();
    const likesCount = postData.likes ? Object.keys(postData.likes).length : 0;
    const commentsCount = postData.comments ? Object.keys(postData.comments).length : 0;
    
    // Check if current user liked this post - use multiple sources
    let currentUser = null;
    if (window.currentUser) {
        currentUser = window.currentUser;
    } else if (window.auth && window.auth.currentUser) {
        currentUser = window.auth.currentUser;
    } else {
        try {
            const stored = localStorage.getItem('currentUser');
            if (stored) currentUser = JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
        }
    }
    
    const isLiked = currentUser && postData.likes && postData.likes[currentUser.uid];
    
    return `
        <div class="glass-effect rounded-2xl p-4 mb-4">
            <div class="flex items-start mb-3">
                ${userPhoto 
                    ? `<img src="${userPhoto}" class="w-10 h-10 rounded-full object-cover" />`
                    : `<div class="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                         <span class="text-white font-bold">${initial}</span>
                       </div>`
                }
                <div class="ml-3 flex-1">
                    <div class="text-white font-semibold">${userName}</div>
                    <div class="text-white text-opacity-60 text-xs">${formatTimestamp(postData.timestamp)}</div>
                </div>
                <div class="relative">
                    <button onclick="showShareModal('${postData.id}')" class="text-white text-opacity-60 hover:text-white">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            </div>
            
            <div class="text-white mb-3">${makeHashtagsClickable(content)}</div>
            
            ${postData.mediaURL ? `
                <img src="${postData.mediaURL}" class="w-full rounded-xl mb-3 max-h-96 object-cover" />
            ` : ''}
            
            <div class="flex items-center space-x-6 text-white text-opacity-60">
                <button onclick="toggleHashtagPostLike('${postData.id}', this)" class="flex items-center space-x-1 hover:text-pink-400 transition-colors">
                    <i class="fas fa-heart ${isLiked ? 'text-pink-400' : ''}" id="like-icon-${postData.id}"></i>
                    <span id="like-count-${postData.id}">${likesCount}</span>
                </button>
                
                <button onclick="alert('Comentarios próximamente')" class="flex items-center space-x-1 hover:text-blue-400 transition-colors">
                    <i class="fas fa-comment"></i>
                    <span>${commentsCount}</span>
                </button>
                
                <button onclick="showShareModal('${postData.id}')" class="flex items-center space-x-1 hover:text-green-400 transition-colors">
                    <i class="fas fa-share"></i>
                    <span>Compartir</span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Make hashtags clickable in content
 */
function makeHashtagsClickable(content) {
    return content.replace(/#([\wáéíóúñ]+)/gi, (match) => {
        return `<span class="text-pink-400 cursor-pointer hover:text-pink-300 font-semibold" onclick="filterByHashtag('${match}')">${match}</span>`;
    });
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

/**
 * Load Explore Content (Trending)
 */
async function loadExploreContent() {
    try {
        await Promise.all([
            loadTrendingHashtags(),
            loadTrendingPosts()
        ]);
    } catch (error) {
        console.error('Error cargando contenido de Explorar:', error);
    }
}

// Expose to window
window.loadExploreContent = loadExploreContent;

/**
 * Load trending hashtags
 */
async function loadTrendingHashtags() {
    try {
        const container = document.getElementById('trending-hashtags');
        const hashtagMap = new Map();

        const buildFromArray = (arr) => {
            arr.forEach(post => {
                const content = (post.content || '');
                const hashtags = content.match(/#[\wáéíóúñ]+/gi) || [];
                hashtags.forEach(tag => {
                    const normalizedTag = tag.toLowerCase();
                    if (!hashtagMap.has(normalizedTag)) {
                        hashtagMap.set(normalizedTag, { tag, count: 0 });
                    }
                    hashtagMap.get(normalizedTag).count++;
                });
            });
        };

        try {
            const postsRef = firebaseDB.ref(firebaseDB.database, 'posts');
            const snapshot = await firebaseDB.get(postsRef);
            if (snapshot.exists()) {
                const postsArr = [];
                snapshot.forEach(child => postsArr.push(child.val()));
                buildFromArray(postsArr);
            }
        } catch (e) {
            // Permission denied → fallback to localStorage
            const saved = localStorage.getItem('nitedcrypto_posts');
            if (saved) buildFromArray(JSON.parse(saved));
        }
        
        const trending = Array.from(hashtagMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        
        if (trending.length === 0) {
            container.innerHTML = '<p class="text-white text-opacity-60 text-sm">No hay hashtags disponibles</p>';
            return;
        }
        
        let html = '';
        trending.forEach(({ tag, count }) => {
            html += `
                <button onclick="filterByHashtag('${tag}')" 
                        class="glass-effect rounded-full px-4 py-2 text-white hover:bg-white hover:bg-opacity-20 transition-all">
                    <span class="text-pink-400 font-semibold">${tag}</span>
                    <span class="text-white text-opacity-60 text-sm ml-1">${count}</span>
                </button>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando trending hashtags:', error);
    }
}

/**
 * Load trending posts (last 24h with most interactions)
 */
async function loadTrendingPosts() {
    try {
        const container = document.getElementById('trending-posts');
        const now = Date.now();
        const dayAgo = now - (24 * 60 * 60 * 1000);
        const posts = [];
        const pushIfRecent = (post) => {
            if (post.timestamp && post.timestamp > dayAgo) {
                const likesCount = post.likes ? Object.keys(post.likes).length : 0;
                const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
                post.score = likesCount * 2 + commentsCount * 3;
                posts.push(post);
            }
        };

        try {
            const postsRef = firebaseDB.ref(firebaseDB.database, 'posts');
            const snapshot = await firebaseDB.get(postsRef);
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    const post = { id: child.key, ...child.val() };
                    pushIfRecent(post);
                });
            }
        } catch (e) {
            // Permission denied → fallback a localStorage
            const saved = localStorage.getItem('nitedcrypto_posts');
            if (saved) {
                JSON.parse(saved).forEach(p => pushIfRecent(p));
            }
        }
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 glass-effect rounded-xl">
                    <i class="fas fa-fire text-white text-opacity-40 text-3xl mb-2"></i>
                    <p class="text-white text-opacity-60">No hay posts trending hoy</p>
                </div>
            `;
            return;
        }
        
        // Sort by score
        posts.sort((a, b) => b.score - a.score);
        
        let html = '';
        posts.slice(0, 10).forEach(post => {
            html += createPostCard(post);
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando trending posts:', error);
    }
}

/**
 * Load suggested users (most followers)
 */
async function loadSuggestedUsers() {
    try {
        const container = document.getElementById('suggested-users');
        
        // Mostrar loading temporal
        container.innerHTML = `
            <div class="text-center py-6 glass-effect rounded-xl">
                <i class="fas fa-spinner fa-spin text-3xl text-white text-opacity-60 mb-3"></i>
                <p class="text-white text-opacity-60">Cargando usuarios...</p>
            </div>
        `;
        
        // 1) Intentar cargar desde profiles (permitido por reglas: .read auth != null)
        let users = [];
        try {
            const profilesRef = firebaseDB.ref(firebaseDB.database, 'profiles');
            const profSnap = await firebaseDB.get(profilesRef);
            if (profSnap.exists()) {
                profSnap.forEach(child => {
                    const p = child.val() || {};
                    if (p.name || p.userName) {
                        users.push({
                            id: child.key,
                            userName: p.name || p.userName,
                            photoURL: p.photoURL || p.avatar || null,
                            bio: p.bio || '',
                            followersCount: typeof p.followersCount === 'number' ? p.followersCount : 0,
                        });
                    }
                });
            }
        } catch (e) {
            // continuar con otras fuentes
        }

        // 2) Si no hay suficientes, intentar /users (puede fallar por permisos)
        if (users.length < 3) {
            try {
                const usersRef = firebaseDB.ref(firebaseDB.database, 'users');
                const snapshot = await firebaseDB.get(usersRef);
                if (snapshot.exists()) {
                    snapshot.forEach(child => {
                        const user = { id: child.key, ...child.val() };
                        if (user.userName && user.email) {
                            const followersCount = user.followers ? Object.keys(user.followers).length : 0;
                            users.push({
                                id: user.id,
                                userName: user.userName,
                                photoURL: user.photoURL || null,
                                bio: user.bio || '',
                                followersCount,
                            });
                        }
                    });
                }
            } catch (e) {
                // ignorar
            }
        }
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const currentUserId = currentUser?.uid || currentUser?.email?.replace(/[.@]/g, '_');
        // Filtrar y deduplicar, evitando al usuario actual
        const byId = new Map();
        users.forEach(u => {
            if (currentUserId && u.id === currentUserId) return;
            if (!byId.has(u.id)) byId.set(u.id, u);
        });
        users = Array.from(byId.values());
        
        // Si no hay suficientes usuarios, saltar lectura de posts (evitar warnings) y pasar a localStorage
        
        // Si aún no hay usuarios, intentar cargar desde localStorage como último recurso
        if (users.length === 0) {
            console.log('🔍 Buscando usuarios en localStorage como último recurso...');
            
            try {
                const savedPosts = localStorage.getItem('nitedcrypto_posts');
                if (savedPosts) {
                    const posts = JSON.parse(savedPosts);
                    const uniqueUsers = new Map();
                    
                    posts.forEach(post => {
                        if (post.userId && post.userName && post.userName !== 'Usuario' && post.userId !== currentUserId) {
                            if (!uniqueUsers.has(post.userId)) {
                                uniqueUsers.set(post.userId, {
                                    id: post.userId,
                                    userName: post.userName,
                                    email: post.userEmail || `${post.userName.toLowerCase().replace(/\s+/g, '.')}@crypto.social`,
                                    photoURL: post.userPhoto || null,
                                    bio: 'Usuario activo de NITEDRED',
                                    followersCount: Math.floor(Math.random() * 100) + 5,
                                    isFromLocalStorage: true
                                });
                            }
                        }
                    });
                    
                    users.push(...Array.from(uniqueUsers.values()));
                    console.log(`📊 Encontrados ${users.length} usuarios únicos desde localStorage`);
                }
            } catch (error) {
                console.error('Error cargando usuarios desde localStorage:', error);
            }
        }
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 glass-effect rounded-xl">
                    <i class="fas fa-users text-3xl text-white text-opacity-40 mb-3"></i>
                    <p class="text-white text-opacity-60">No hay usuarios registrados aún</p>
                    <p class="text-white text-opacity-40 text-sm mt-1">¡Sé el primero en unirte a la comunidad!</p>
                    <button onclick="window.syncUsers && window.syncUsers()" class="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600">
                        Buscar usuarios
                    </button>
                </div>
            `;
            return;
        }
        
        // Sort by followers count (descending)
        users.sort((a, b) => b.followersCount - a.followersCount);
        
        console.log(`✅ Mostrando ${Math.min(users.length, 5)} usuarios reales:`, users.slice(0, 5).map(u => u.userName));
        
        let html = '';
        users.slice(0, 5).forEach(user => {
            const initial = (user.userName || 'U').charAt(0).toUpperCase();
            const photoHTML = user.photoURL 
                ? `<img src="${user.photoURL}" class="w-12 h-12 rounded-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
                : '';
            
            const fallbackAvatarHTML = `
                <div class="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center ${user.photoURL ? 'hidden' : ''}" title="${user.userName}">
                    <span class="text-white font-bold text-lg">${initial}</span>
                </div>
            `;
            
            const followersText = user.followersCount === 1 ? 'seguidor' : 'seguidores';
            
            html += `
                <div class="glass-effect rounded-xl p-4 flex items-center justify-between hover:bg-white hover:bg-opacity-5 transition-all">
                    <div class="flex items-center">
                        <div class="relative">
                            ${photoHTML}
                            ${fallbackAvatarHTML}
                        </div>
                        <div class="ml-3">
                            <div class="text-white font-semibold">${user.userName}</div>
                            <div class="text-white text-opacity-60 text-sm">${user.followersCount} ${followersText}</div>
                            ${user.bio ? `<div class="text-white text-opacity-40 text-xs mt-1 max-w-xs truncate">${user.bio}</div>` : ''}
                        </div>
                    </div>
                    <button 
                        onclick="toggleFollow('${user.id}', '${user.userName}', this)" 
                        class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105 active:scale-95">
                        Seguir
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando usuarios sugeridos:', error);
        const container = document.getElementById('suggested-users');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-6 glass-effect rounded-xl">
                    <i class="fas fa-exclamation-triangle text-3xl text-yellow-400 mb-3"></i>
                    <p class="text-white text-opacity-60">Error cargando usuarios</p>
                    <button onclick="loadSuggestedUsers()" class="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Toggle follow status for a user
 */
async function toggleFollow(userId, userName, buttonElement) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('Debes iniciar sesión para seguir usuarios');
            return;
        }
        
        const userFollowingRef = firebaseDB.ref(firebaseDB.database, `users/${currentUser.uid}/following/${userId}`);
        const userFollowersRef = firebaseDB.ref(firebaseDB.database, `users/${userId}/followers/${currentUser.uid}`);
        
        // Check if already following
        const followingSnapshot = await firebaseDB.get(userFollowingRef);
        
        if (followingSnapshot.exists()) {
            // Unfollow
            await firebaseDB.remove(userFollowingRef);
            await firebaseDB.remove(userFollowersRef);
            
            buttonElement.textContent = 'Seguir';
            buttonElement.classList.remove('bg-gray-500', 'bg-gray-600');
            buttonElement.classList.add('bg-gradient-to-r', 'from-pink-500', 'to-purple-500');
        } else {
            // Follow
            await firebaseDB.set(userFollowingRef, {
                userName: userName,
                timestamp: new Date().toISOString()
            });
            
            await firebaseDB.set(userFollowersRef, {
                userName: currentUser.displayName || currentUser.email,
                timestamp: new Date().toISOString()
            });
            
            buttonElement.textContent = 'Siguiendo';
            buttonElement.classList.remove('bg-gradient-to-r', 'from-pink-500', 'to-purple-500');
            buttonElement.classList.add('bg-gray-500', 'hover:bg-gray-600');
        }
        
    } catch (error) {
        console.error('Error al seguir/dejar de seguir usuario:', error);
        alert('Error al seguir usuario');
    }
}

// Expose functions to window for onclick handlers
window.toggleFollow = toggleFollow;

// Wrapper function for post interactions in hashtag results
window.toggleHashtagPostLike = async function(postId, buttonElement) {
    try {
        // Check multiple sources for current user
        let currentUser = null;
        
        // Try global window.currentUser first
        if (window.currentUser) {
            currentUser = window.currentUser;
        } else {
            // Fallback to localStorage
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    currentUser = JSON.parse(storedUser);
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                }
            }
        }
        
        // Also try Firebase auth
        if (!currentUser && window.auth && window.auth.currentUser) {
            currentUser = {
                uid: window.auth.currentUser.uid,
                displayName: window.auth.currentUser.displayName,
                email: window.auth.currentUser.email
            };
        }
        
        console.log('🔍 Current user check:', {
            windowCurrentUser: !!window.currentUser,
            localStorageUser: !!localStorage.getItem('currentUser'),
            firebaseUser: !!(window.auth && window.auth.currentUser),
            finalUser: !!currentUser
        });
        
        if (!currentUser) {
            console.error('No current user found');
            alert('Debes iniciar sesión para dar like');
            return;
        }
        
        const postRef = firebaseDB.ref(firebaseDB.database, `posts/${postId}`);
        const userLikeRef = firebaseDB.ref(firebaseDB.database, `posts/${postId}/likes/${currentUser.uid}`);
        
        // Check if already liked
        const likeSnapshot = await firebaseDB.get(userLikeRef);
        const icon = buttonElement.querySelector('i');
        const countElement = document.getElementById(`like-count-${postId}`);
        
        if (likeSnapshot.exists()) {
            // Unlike
            await firebaseDB.remove(userLikeRef);
            icon.classList.remove('text-pink-400');
            const currentCount = parseInt(countElement.textContent) || 0;
            countElement.textContent = Math.max(0, currentCount - 1);
        } else {
            // Like
            await firebaseDB.set(userLikeRef, {
                userName: currentUser.displayName || currentUser.email,
                timestamp: Date.now()
            });
            icon.classList.add('text-pink-400');
            const currentCount = parseInt(countElement.textContent) || 0;
            countElement.textContent = currentCount + 1;
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
    }
};

// Expose main search functions to window for dropdown integration
window.searchPosts = searchPosts;
window.searchUsers = searchUsers;
window.searchHashtags = searchHashtags;
window.performSearch = performSearch;

export { 
    loadExploreContent, 
    filterByHashtag, 
    makeHashtagsClickable, 
    showSearchResults, 
    hideSearchResults, 
    toggleMobileSearch,
    handleGlobalSearch,
    switchSearchTab,
    searchPosts,
    searchUsers,
    searchHashtags
};
