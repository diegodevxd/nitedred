// Profile Functions

// Access currentUser from window object
function getCurrentUser() {
    return window.currentUser || null;
}

// Load user profile
async function loadUserProfile() {
    console.log('=== LOAD USER PROFILE CALLED ===');
    const currentUser = getCurrentUser();
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
        console.error('No currentUser in loadUserProfile');
        return;
    }
    
    const userId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
    console.log('userId:', userId);
    
    // Set profile photo
    const profileAvatar = document.querySelector('#profile-section .w-24.h-24');
    if (currentUser.photoURL) {
        profileAvatar.innerHTML = `<img src="${currentUser.photoURL}" class="w-full h-full rounded-full object-cover" alt="Profile">`;
    } else {
        const initial = (currentUser.displayName || currentUser.name || 'U')[0].toUpperCase();
        profileAvatar.innerHTML = `<span class="text-white text-3xl font-bold">${initial}</span>`;
    }
    
    // Update header avatar
    updateHeaderAvatar();
    
    // Load profile data from Firebase
    const database = window.database;
    const firebaseDB = window.firebaseDB;
    
    if (database && firebaseDB) {
        try {
            const profileRef = firebaseDB.ref(database, `profiles/${userId}`);
            const snapshot = await firebaseDB.get(profileRef);
            
            if (snapshot.exists()) {
                const profileData = snapshot.val();
                document.getElementById('profile-name').textContent = profileData.displayName || currentUser.displayName || currentUser.name || 'Usuario';
                document.getElementById('profile-bio').textContent = profileData.bio || '';
                
                // Update photo from Firebase if exists
                if (profileData.photoURL) {
                    currentUser.photoURL = profileData.photoURL;
                    window.currentUser.photoURL = profileData.photoURL;
                    profileAvatar.innerHTML = `<img src="${profileData.photoURL}" class="w-full h-full rounded-full object-cover" alt="Profile">`;
                    updateHeaderAvatar();
                }
                
                // Load social links if exist
                if (profileData.socialLinks) {
                    updateSocialLinks(profileData.socialLinks);
                }
            } else {
                // Set default from Firebase Auth
                document.getElementById('profile-name').textContent = currentUser.displayName || currentUser.name || 'Usuario';
                document.getElementById('profile-bio').textContent = '';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            document.getElementById('profile-name').textContent = currentUser.displayName || currentUser.name || 'Usuario';
        }
    } else {
        document.getElementById('profile-name').textContent = currentUser.displayName || currentUser.name || 'Usuario';
    }
    
    // Update stats
    updateProfileStats();
}

// Update header avatar
function updateHeaderAvatar() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const headerAvatar = document.getElementById('header-avatar');
    if (!headerAvatar) return;
    
    if (currentUser.photoURL) {
        headerAvatar.innerHTML = `<img src="${currentUser.photoURL}" class="w-full h-full rounded-full object-cover" alt="Avatar">`;
    } else {
        const initial = (currentUser.displayName || currentUser.name || 'U')[0].toUpperCase();
        headerAvatar.innerHTML = `<span class="text-white text-sm font-bold">${initial}</span>`;
    }
}

// Update profile stats (posts, followers, following)
function updateProfileStats() {
    console.log('=== UPDATE PROFILE STATS CALLED ===');
    const currentUser = getCurrentUser();
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
        console.error('No currentUser in updateProfileStats');
        return;
    }
    
    const userId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
    console.log('userId for stats:', userId);
    
    // Count real posts
    let postsCount = 0;
    try {
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        if (savedPosts) {
            const posts = JSON.parse(savedPosts);
            postsCount = posts.filter(post => post.userId === userId).length;
        }
    } catch (error) {
        console.error('Error counting posts:', error);
    }
    
    // Count followers (from localStorage for now)
    let followersCount = 0;
    try {
        const allFollowers = localStorage.getItem('nitedcrypto_followers') || '{}';
        const followersData = JSON.parse(allFollowers);
        followersCount = (followersData[userId] || []).length;
    } catch (error) {
        console.error('Error counting followers:', error);
    }
    
    // Count following
    let followingCount = 0;
    try {
        const following = localStorage.getItem('nitedcrypto_following') || '{}';
        const followingData = JSON.parse(following);
        followingCount = (followingData[userId] || []).length;
    } catch (error) {
        console.error('Error counting following:', error);
    }
    
    // Update UI
    const statsContainer = document.querySelector('#profile-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="glass-effect rounded-xl p-4 text-center cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all" onclick="showMyPosts()">
                <div class="text-white text-2xl font-bold">${postsCount}</div>
                <div class="text-white text-opacity-60 text-sm">Posts</div>
            </div>
            <div class="glass-effect rounded-xl p-4 text-center cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all" onclick="showFollowers()">
                <div class="text-white text-2xl font-bold">${followersCount}</div>
                <div class="text-white text-opacity-60 text-sm">Seguidores</div>
            </div>
            <div class="glass-effect rounded-xl p-4 text-center cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all" onclick="showFollowing()">
                <div class="text-white text-2xl font-bold">${followingCount}</div>
                <div class="text-white text-opacity-60 text-sm">Siguiendo</div>
            </div>
        `;
    }
}

function showEditProfile() {
    const currentUser = getCurrentUser();
    document.getElementById('edit-profile-modal').classList.remove('hidden');
    
    // Pre-fill current values
    if (currentUser) {
        document.getElementById('edit-name').value = document.getElementById('profile-name').textContent;
        document.getElementById('edit-bio').value = document.getElementById('profile-bio').textContent;
        
        // Pre-fill social links if they exist
        const twitterInput = document.getElementById('edit-twitter');
        const telegramInput = document.getElementById('edit-telegram');
        const websiteInput = document.getElementById('edit-website');
        
        if (twitterInput) twitterInput.value = currentUser.socialLinks?.twitter || '';
        if (telegramInput) telegramInput.value = currentUser.socialLinks?.telegram || '';
        if (websiteInput) websiteInput.value = currentUser.socialLinks?.website || '';
    }
}

function hideEditProfile() {
    document.getElementById('edit-profile-modal').classList.add('hidden');
}

async function updateProfile(event) {
    event.preventDefault();
    
    console.log('=== UPDATE PROFILE CALLED ===');
    const currentUser = getCurrentUser();
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
        showToast('❌ Debes iniciar sesión');
        console.error('No currentUser found');
        return;
    }
    
    const name = document.getElementById('edit-name').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const twitter = document.getElementById('edit-twitter')?.value.trim() || '';
    const telegram = document.getElementById('edit-telegram')?.value.trim() || '';
    const website = document.getElementById('edit-website')?.value.trim() || '';
    
    console.log('Form values:', { name, bio, twitter, telegram, website });
    
    if (!name) {
        showToast('⚠️ El nombre no puede estar vacío');
        return;
    }
    
    // Update UI immediately
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-bio').textContent = bio;
    
    // Update currentUser object
    if (currentUser) {
        currentUser.name = name;
        currentUser.bio = bio;
        currentUser.socialLinks = {
            twitter: twitter,
            telegram: telegram,
            website: website
        };
    }
    
    // Save to Firebase
    const database = window.database;
    const firebaseDB = window.firebaseDB;
    
    if (database && firebaseDB) {
        try {
            const userId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
            const profileRef = firebaseDB.ref(database, `profiles/${userId}`);
            
            await firebaseDB.set(profileRef, {
                displayName: name,
                bio: bio,
                socialLinks: {
                    twitter: twitter,
                    telegram: telegram,
                    website: website
                },
                photoURL: currentUser.photoURL || null,
                lastUpdated: Date.now()
            });
            
            showToast('✅ Perfil guardado en Firebase!');
            
            // Update social links display
            updateSocialLinks({ twitter, telegram, website });
            
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('⚠️ Perfil actualizado localmente');
        }
    } else {
        showToast('✅ Perfil actualizado!');
    }
    
    hideEditProfile();
}

// Update social links display
function updateSocialLinks(links) {
    const container = document.getElementById('profile-social-links');
    if (!container) return;
    
    let html = '';
    
    if (links.twitter) {
        const twitterUrl = links.twitter.startsWith('@') 
            ? `https://twitter.com/${links.twitter.substring(1)}` 
            : `https://twitter.com/${links.twitter}`;
        html += `
            <a href="${twitterUrl}" target="_blank" class="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-all">
                <i class="fab fa-twitter text-white"></i>
            </a>
        `;
    }
    
    if (links.telegram) {
        const telegramUrl = links.telegram.startsWith('@') 
            ? `https://t.me/${links.telegram.substring(1)}` 
            : `https://t.me/${links.telegram}`;
        html += `
            <a href="${telegramUrl}" target="_blank" class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all">
                <i class="fab fa-telegram text-white"></i>
            </a>
        `;
    }
    
    if (links.website) {
        html += `
            <a href="${links.website}" target="_blank" class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all">
                <i class="fas fa-globe text-white"></i>
            </a>
        `;
    }
    
    container.innerHTML = html;
}

// Show user's posts
function showMyPosts() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const userId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
    
    // Switch to home section
    showSection('home');
    
    // Filter and show only user's posts
    const feed = document.getElementById('home-feed');
    feed.innerHTML = '';
    
    try {
        const savedPosts = localStorage.getItem('nitedcrypto_posts');
        if (savedPosts) {
            const posts = JSON.parse(savedPosts);
            const myPosts = posts.filter(post => post.userId === userId);
            
            if (myPosts.length === 0) {
                feed.innerHTML = `
                    <div class="glass-effect rounded-2xl p-8 text-center">
                        <i class="fas fa-images text-6xl text-purple-400 mb-4"></i>
                        <h3 class="text-white text-xl font-bold mb-2">No tienes posts aún</h3>
                        <p class="text-white text-opacity-60 mb-4">¡Crea tu primer post!</p>
                        <button onclick="showCreateHomePost()" class="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all">
                            Crear Post
                        </button>
                    </div>
                `;
            } else {
                myPosts.reverse().forEach(post => {
                    post.timestamp = getRelativeTime(post.timestamp);
                    renderPost(post);
                });
            }
        }
    } catch (error) {
        console.error('Error loading my posts:', error);
    }
}

// Show followers list
function showFollowers() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('⚠️ Debes iniciar sesión');
        return;
    }
    
    const followers = JSON.parse(localStorage.getItem('nitedcrypto_followers') || '{}');
    const currentUserId = currentUser.uid || currentUser.email;
    const followersList = followers[currentUserId] || [];
    
    const modal = document.getElementById('users-list-modal');
    const title = document.getElementById('users-list-title');
    const content = document.getElementById('users-list-content');
    
    title.textContent = 'Seguidores';
    
    if (followersList.length === 0) {
        content.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-users text-white text-opacity-40 text-4xl mb-3"></i>
                <p class="text-white text-opacity-60">Aún no tienes seguidores</p>
            </div>
        `;
    } else {
        content.innerHTML = followersList.map(user => {
            const isFollowingBack = window.isFollowing ? window.isFollowing(user.id) : false;
            const userName = user.name || user.displayName || 'Usuario';
            const userNameSafe = userName.replace(/'/g, "\\'");
            return `
                <div class="glass-effect rounded-xl p-3 flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}" 
                             class="w-12 h-12 rounded-full object-cover">
                        <div class="ml-3">
                            <p class="text-white font-semibold">${userName}</p>
                        </div>
                    </div>
                    <button onclick="toggleFollow('${user.id}', '${userNameSafe}', this)" 
                            class="px-4 py-1 rounded-full text-sm font-medium transition-all ${isFollowingBack ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'}">
                        ${isFollowingBack ? 'Siguiendo' : 'Seguir'}
                    </button>
                </div>
            `;
        }).join('');
    }
    
    modal.classList.remove('hidden');
}

// Show following list
function showFollowing() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('⚠️ Debes iniciar sesión');
        return;
    }
    
    const following = JSON.parse(localStorage.getItem('nitedcrypto_following') || '{}');
    const currentUserId = currentUser.uid || currentUser.email;
    const followingList = following[currentUserId] || [];
    
    const modal = document.getElementById('users-list-modal');
    const title = document.getElementById('users-list-title');
    const content = document.getElementById('users-list-content');
    
    title.textContent = 'Siguiendo';
    
    if (followingList.length === 0) {
        content.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-user-plus text-white text-opacity-40 text-4xl mb-3"></i>
                <p class="text-white text-opacity-60">No sigues a nadie aún</p>
            </div>
        `;
    } else {
        content.innerHTML = followingList.map(user => {
            const userName = user.name || user.displayName || 'Usuario';
            const userNameSafe = userName.replace(/'/g, "\\'");
            return `
                <div class="glass-effect rounded-xl p-3 flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}" 
                             class="w-12 h-12 rounded-full object-cover">
                        <div class="ml-3">
                            <p class="text-white font-semibold">${userName}</p>
                        </div>
                    </div>
                    <button onclick="toggleFollow('${user.id}', '${userNameSafe}', this)" 
                            class="px-4 py-1 rounded-full text-sm font-medium transition-all bg-gray-600 text-white hover:bg-gray-700">
                        Siguiendo
                    </button>
                </div>
            `;
        }).join('');
    }
    
    modal.classList.remove('hidden');
}

// Hide users list modal
function hideUsersListModal() {
    const modal = document.getElementById('users-list-modal');
    modal.classList.add('hidden');
}

// Change profile photo
async function changeProfilePhoto() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('⚠️ Debes iniciar sesión');
        return;
    }
    
    if (typeof cloudinary === 'undefined') {
        showToast('❌ Cloudinary no disponible');
        return;
    }
    
    // Create upload widget for profile photo
    const widget = cloudinary.createUploadWidget({
        cloudName: 'dtxn4kbpc',
        uploadPreset: 'nitedcrypto_posts',
        sources: ['local', 'url', 'camera'],
        showAdvancedOptions: false,
        cropping: true,
        croppingAspectRatio: 1,
        multiple: false,
        resourceType: 'image',
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
        maxFileSize: 100000000, // 100MB
        maxImageWidth: 1000,
        maxImageHeight: 1000,
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
    }, async (error, result) => {
        if (!error && result && result.event === 'success') {
            const photoURL = result.info.secure_url;
            
            try {
                // Update profile photo in UI immediately
                const profileAvatar = document.querySelector('#profile-section .w-24.h-24');
                if (profileAvatar) {
                    profileAvatar.innerHTML = `<img src="${photoURL}" class="w-full h-full rounded-full object-cover" alt="Profile">`;
                }
                
                // Update in Firebase Database
                const database = window.database;
                const firebaseDB = window.firebaseDB;
                const userId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
                
                if (database && firebaseDB) {
                    const profileRef = firebaseDB.ref(database, `profiles/${userId}`);
                    await firebaseDB.update(profileRef, {
                        photoURL: photoURL,
                        lastUpdated: new Date().toISOString()
                    });
                }
                
                // Update currentUser object
                if (window.currentUser) {
                    window.currentUser.photoURL = photoURL;
                }
                
                // Update header avatar
                updateHeaderAvatar();
                
                showToast('✅ Foto de perfil actualizada');
            } catch (err) {
                console.error('Error updating profile photo:', err);
                showToast('❌ Error al actualizar la foto');
            }
        } else if (error) {
            console.error('Error uploading photo:', error);
            showToast('❌ Error al subir la foto');
        }
    });
    
    widget.open();
}

// Crypto Portfolio Functions
function showAddCryptoModal() {
    const modal = document.getElementById('add-crypto-modal');
    modal.classList.remove('hidden');
    
    // Load popular cryptos by default
    searchCryptos('');
}

function hideAddCryptoModal() {
    const modal = document.getElementById('add-crypto-modal');
    modal.classList.add('hidden');
    document.getElementById('crypto-search').value = '';
    document.getElementById('crypto-search-results').innerHTML = '';
}

async function searchCryptos(query) {
    const resultsContainer = document.getElementById('crypto-search-results');
    
    // Popular cryptocurrencies
    const popularCryptos = [
        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
        { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
        { id: 'solana', symbol: 'SOL', name: 'Solana' },
        { id: 'ripple', symbol: 'XRP', name: 'XRP' },
        { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
        { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
        { id: 'tron', symbol: 'TRX', name: 'TRON' },
        { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
        { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' }
    ];
    
    const filtered = query 
        ? popularCryptos.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) || 
            c.symbol.toLowerCase().includes(query.toLowerCase())
          )
        : popularCryptos;
    
    if (filtered.length === 0) {
        resultsContainer.innerHTML = '<p class="text-white text-opacity-60 text-center py-4">No se encontraron resultados</p>';
        return;
    }
    
    resultsContainer.innerHTML = filtered.map(crypto => `
        <div onclick="addCryptoToPortfolio('${crypto.id}', '${crypto.symbol}', '${crypto.name}')" 
             class="glass-effect rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all">
            <div class="flex items-center">
                <img src="https://assets.coincap.io/assets/icons/${crypto.symbol.toLowerCase()}@2x.png" 
                     class="w-10 h-10 rounded-full"
                     onerror="this.src='https://via.placeholder.com/40/667eea/ffffff?text=${crypto.symbol}'">
                <div class="ml-3">
                    <p class="text-white font-semibold">${crypto.name}</p>
                    <p class="text-white text-opacity-60 text-sm">${crypto.symbol}</p>
                </div>
            </div>
            <i class="fas fa-plus text-pink-400"></i>
        </div>
    `).join('');
}

async function addCryptoToPortfolio(id, symbol, name) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('⚠️ Debes iniciar sesión');
        return;
    }
    
    const userId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
    
    // Get current portfolio
    const portfolio = JSON.parse(localStorage.getItem(`nitedcrypto_portfolio_${userId}`) || '[]');
    
    // Check if already added
    if (portfolio.some(c => c.id === id)) {
        showToast('⚠️ Ya tienes esta cripto en tu portfolio');
        return;
    }
    
    // Add to portfolio
    portfolio.push({ id, symbol, name, addedAt: new Date().toISOString() });
    localStorage.setItem(`nitedcrypto_portfolio_${userId}`, JSON.stringify(portfolio));
    
    // Save to Firebase
    const database = window.database;
    const firebaseDB = window.firebaseDB;
    
    if (database && firebaseDB) {
        try {
            const portfolioRef = firebaseDB.ref(database, `profiles/${userId}/portfolio`);
            await firebaseDB.set(portfolioRef, portfolio);
        } catch (error) {
            console.error('Error saving to Firebase:', error);
        }
    }
    
    hideAddCryptoModal();
    loadCryptoPortfolio();
    showToast('✅ Cripto agregada al portfolio');
}

async function loadCryptoPortfolio() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const userId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
    const portfolio = JSON.parse(localStorage.getItem(`nitedcrypto_portfolio_${userId}`) || '[]');
    
    const container = document.getElementById('crypto-portfolio');
    
    if (portfolio.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 glass-effect rounded-xl">
                <i class="fas fa-coins text-white text-opacity-40 text-3xl mb-2"></i>
                <p class="text-white text-opacity-60 text-sm">Agrega tus criptomonedas favoritas</p>
            </div>
        `;
        return;
    }
    
    // Fetch prices from CoinGecko
    try {
        const ids = portfolio.map(c => c.id).join(',');
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const prices = await response.json();
        
        container.innerHTML = portfolio.map(crypto => {
            const priceData = prices[crypto.id];
            const price = priceData?.usd || 0;
            const change = priceData?.usd_24h_change || 0;
            const isPositive = change >= 0;
            
            return `
                <div class="glass-effect rounded-xl p-4 flex items-center justify-between">
                    <div class="flex items-center flex-1">
                        <img src="https://assets.coincap.io/assets/icons/${crypto.symbol.toLowerCase()}@2x.png" 
                             class="w-12 h-12 rounded-full"
                             onerror="this.src='https://via.placeholder.com/48/667eea/ffffff?text=${crypto.symbol}'">
                        <div class="ml-3 flex-1">
                            <p class="text-white font-semibold">${crypto.name}</p>
                            <p class="text-white text-opacity-60 text-sm">${crypto.symbol}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-white font-semibold">${price > 0 ? '$' + price.toLocaleString() : 'N/A'}</p>
                            <p class="${isPositive ? 'text-green-400' : 'text-red-400'} text-sm">
                                ${price > 0 ? (isPositive ? '+' : '') + change.toFixed(2) + '%' : '--'}
                            </p>
                        </div>
                    </div>
                    <button onclick="removeCryptoFromPortfolio('${crypto.id}')" 
                            class="ml-3 text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-900 hover:bg-opacity-20">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading crypto prices:', error);
        // Show portfolio without prices as fallback
        container.innerHTML = portfolio.map(crypto => `
            <div class="glass-effect rounded-xl p-4 flex items-center justify-between">
                <div class="flex items-center flex-1">
                    <img src="https://assets.coincap.io/assets/icons/${crypto.symbol.toLowerCase()}@2x.png" 
                         class="w-12 h-12 rounded-full"
                         onerror="this.src='https://via.placeholder.com/48/667eea/ffffff?text=${crypto.symbol}'">
                    <div class="ml-3 flex-1">
                        <p class="text-white font-semibold">${crypto.name}</p>
                        <p class="text-white text-opacity-60 text-sm">${crypto.symbol}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-white text-opacity-40 text-sm">Precio no disponible</p>
                    </div>
                </div>
                <button onclick="removeCryptoFromPortfolio('${crypto.id}')" 
                        class="ml-3 text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-900 hover:bg-opacity-20">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
}

async function removeCryptoFromPortfolio(cryptoId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    if (!confirm('¿Eliminar esta cripto de tu portfolio?')) return;
    
    const userId = currentUser.uid || currentUser.email?.replace(/[.@]/g, '_');
    let portfolio = JSON.parse(localStorage.getItem(`nitedcrypto_portfolio_${userId}`) || '[]');
    
    portfolio = portfolio.filter(c => c.id !== cryptoId);
    localStorage.setItem(`nitedcrypto_portfolio_${userId}`, JSON.stringify(portfolio));
    
    // Save to Firebase
    const database = window.database;
    const firebaseDB = window.firebaseDB;
    
    if (database && firebaseDB) {
        try {
            const portfolioRef = firebaseDB.ref(database, `profiles/${userId}/portfolio`);
            await firebaseDB.set(portfolioRef, portfolio);
        } catch (error) {
            console.error('Error saving to Firebase:', error);
        }
    }
    
    loadCryptoPortfolio();
    showToast('✅ Cripto eliminada');
}

// Expose functions globally
window.showEditProfile = showEditProfile;
window.hideEditProfile = hideEditProfile;
window.updateProfile = updateProfile;
window.loadUserProfile = loadUserProfile;
window.updateProfileStats = updateProfileStats;
window.updateHeaderAvatar = updateHeaderAvatar;
window.showMyPosts = showMyPosts;
window.showFollowers = showFollowers;
window.showFollowing = showFollowing;
window.changeProfilePhoto = changeProfilePhoto;
window.hideUsersListModal = hideUsersListModal;
window.showAddCryptoModal = showAddCryptoModal;
window.hideAddCryptoModal = hideAddCryptoModal;
window.searchCryptos = searchCryptos;
window.addCryptoToPortfolio = addCryptoToPortfolio;
window.loadCryptoPortfolio = loadCryptoPortfolio;
window.removeCryptoFromPortfolio = removeCryptoFromPortfolio;

