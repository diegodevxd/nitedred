// Dropdown Management System
// Handles search and notifications overlays

class DropdownManager {
    constructor() {
        this.searchDropdown = null;
        this.notificationsDropdown = null;
        this.activeDropdown = null;
        this.searchTimeout = null;
        this.currentSearchCategory = 'all';
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeElements());
        } else {
            this.initializeElements();
        }
    }

    initializeElements() {
        this.searchDropdown = document.getElementById('search-dropdown');
        this.notificationsDropdown = document.getElementById('notifications-dropdown');
        
        if (!this.searchDropdown) {
            console.warn('Search dropdown element not found');
        }
        if (!this.notificationsDropdown) {
            console.warn('Notifications dropdown element not found');
        }
        
        this.setupEventListeners();
        this.loadNotifications();
    }

    setupEventListeners() {
        // Search category buttons
        const categoryBtns = document.querySelectorAll('.search-category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.setSearchCategory(btn.dataset.category);
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.relative')) {
                this.hideAllDropdowns();
            }
        });

        // ESC key to close dropdowns
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllDropdowns();
            }
        });
    }

    showSearchDropdown() {
        this.hideNotificationsDropdown();
        if (this.searchDropdown) {
            this.searchDropdown.classList.add('active');
            this.activeDropdown = 'search';
        }
    }

    hideSearchDropdown() {
        if (this.searchDropdown) {
            this.searchDropdown.classList.remove('active');
            if (this.activeDropdown === 'search') {
                this.activeDropdown = null;
            }
        }
    }

    hideSearchDropdownDelayed() {
        // Delay to allow clicking on dropdown items
        setTimeout(() => {
            if (!this.searchDropdown?.matches(':hover')) {
                this.hideSearchDropdown();
            }
        }, 150);
    }

    toggleNotificationsDropdown() {
        if (this.notificationsDropdown?.classList.contains('active')) {
            this.hideNotificationsDropdown();
        } else {
            this.showNotificationsDropdown();
        }
    }

    showNotificationsDropdown() {
        this.hideSearchDropdown();
        if (this.notificationsDropdown) {
            this.notificationsDropdown.classList.add('active');
            this.activeDropdown = 'notifications';
            // COMENTADO: No volver a cargar, ya están cargadas por notifications.js
            // this.loadNotifications();
        }
    }

    hideNotificationsDropdown() {
        if (this.notificationsDropdown) {
            this.notificationsDropdown.classList.remove('active');
            if (this.activeDropdown === 'notifications') {
                this.activeDropdown = null;
            }
        }
    }

    hideAllDropdowns() {
        this.hideSearchDropdown();
        this.hideNotificationsDropdown();
    }

    setSearchCategory(category) {
        this.currentSearchCategory = category;
        
        // Update active button
        document.querySelectorAll('.search-category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
        
        // Refresh search results
        const query = document.getElementById('global-search-input')?.value;
        if (query) {
            this.performSearch(query);
        }
    }

    handleSearchInput(query) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Show dropdown if not visible
        if (!this.searchDropdown?.classList.contains('active')) {
            this.showSearchDropdown();
        }

        if (!query.trim()) {
            this.showSearchEmpty();
            return;
        }

        // Show loading state
        this.showSearchLoading();

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        const resultsContainer = document.getElementById('search-dropdown-results');
        
        try {
            // Use the existing search functions from search.js
            if (window.searchPosts && window.searchUsers && window.searchHashtags) {
                const results = await this.performFirebaseSearch(query, this.currentSearchCategory);
                this.displaySearchResults(results);
            } else {
                console.warn('Firebase search functions not available, using fallback');
                // Fallback to mock data for development
                const results = this.getSearchResults(query, this.currentSearchCategory);
                this.displaySearchResults(results);
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError();
        }
    }

    async performFirebaseSearch(query, category) {
        try {
            let results = [];
            
            if (category === 'all') {
                // Search all categories in parallel
                const [posts, users, hashtags] = await Promise.all([
                    window.searchPosts ? window.searchPosts(query) : [],
                    window.searchUsers ? window.searchUsers(query) : [],
                    window.searchHashtags ? window.searchHashtags(query) : []
                ]);
                
                // Format and combine results
                results = [
                    ...this.formatPosts(posts || []),
                    ...this.formatUsers(users || []),
                    ...this.formatHashtags(hashtags || [])
                ];
            } else if (category === 'posts') {
                const posts = await window.searchPosts(query);
                results = this.formatPosts(posts || []);
            } else if (category === 'users') {
                console.log('🔍 Searching users only...');
                const users = await window.searchUsers(query);
                console.log('📊 Users results:', users?.length || 0);
                results = this.formatUsers(users || []);
            } else if (category === 'hashtags') {
                console.log('🔍 Searching hashtags only...');
                const hashtags = await window.searchHashtags(query);
                console.log('📊 Hashtags results:', hashtags?.length || 0);
                results = this.formatHashtags(hashtags || []);
            }
            
            console.log('📊 Final formatted results:', results.length, results);
            return results;
        } catch (error) {
            console.error('Firebase search error:', error);
            return [];
        }
    }

    formatPosts(posts) {
        return posts.map(post => ({
            type: 'post',
            id: post.id,
            content: post.content || post.text || post.message || '',
            author: post.author || post.username || post.user || 'Usuario',
            timestamp: post.timestamp ? new Date(post.timestamp) : new Date()
        }));
    }

    formatUsers(users) {
        return users.map(user => ({
            type: 'user',
            id: user.id || user.uid,
            name: user.displayName || user.name || user.username || 'Usuario',
            username: '@' + (user.username || user.id || 'usuario'),
            avatar: user.photoURL || user.avatar || this.createDefaultAvatar(user.displayName || user.name || user.username || 'U')
        }));
    }

    formatHashtags(hashtags) {
        return hashtags.map(hashtag => ({
            type: 'hashtag',
            id: hashtag.id || hashtag.tag,
            tag: hashtag.tag || hashtag.hashtag || '#hashtag',
            count: hashtag.count || hashtag.postCount || 0
        }));
    }

    getSearchResults(query, category) {
        // This method is kept for backward compatibility but not used with real data
        console.warn('Using fallback search results - Firebase functions not available');
        return [];
    }

    displaySearchResults(results) {
        const container = document.getElementById('search-dropdown-results');
        
        if (!results || results.length === 0) {
            container.innerHTML = `
                <div class="search-empty">
                    <i class="fas fa-search"></i>
                    <div>No se encontraron resultados</div>
                </div>
            `;
            return;
        }

        const resultsHtml = results.map(result => {
            switch (result.type) {
                case 'user':
                    return `
                        <div class="search-result-item" onclick="selectUser('${result.id}')">
                            <div class="flex items-center space-x-3">
                                <img src="${result.avatar}" alt="${result.name}" class="w-8 h-8 rounded-full">
                                <div>
                                    <div class="text-white font-medium">${result.name}</div>
                                    <div class="text-gray-400 text-sm">${result.username}</div>
                                </div>
                            </div>
                        </div>
                    `;
                case 'post':
                    return `
                        <div class="search-result-item" onclick="selectPost('${result.id}')">
                            <div class="text-white font-medium mb-1">${result.author}</div>
                            <div class="text-gray-300 text-sm">${result.content.substring(0, 100)}...</div>
                        </div>
                    `;
                case 'hashtag':
                    return `
                        <div class="search-result-item" onclick="selectHashtag('${result.tag}')">
                            <div class="flex items-center justify-between">
                                <div class="text-blue-400 font-medium">${result.tag}</div>
                                <div class="text-gray-400 text-sm">${result.count} posts</div>
                            </div>
                        </div>
                    `;
                default:
                    return '';
            }
        }).join('');

        container.innerHTML = resultsHtml;
    }

    showSearchLoading() {
        const container = document.getElementById('search-dropdown-results');
        container.innerHTML = `
            <div class="search-loading">
                Buscando...
            </div>
        `;
    }

    showSearchEmpty() {
        const container = document.getElementById('search-dropdown-results');
        container.innerHTML = `
            <div class="search-empty">
                <i class="fas fa-search"></i>
                <div>Escribe para buscar posts, usuarios y hashtags</div>
            </div>
        `;
    }

    showSearchError() {
        const container = document.getElementById('search-dropdown-results');
        container.innerHTML = `
            <div class="search-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <div>Error al buscar. Intenta de nuevo.</div>
            </div>
        `;
    }

    async loadNotifications() {
        const container = document.getElementById('notifications-list');
        
        if (!container) {
            console.warn('Notifications list container not found');
            return;
        }
        
        try {
            // Use the existing Firebase notification function
            let notifications = [];
            
            if (window.loadNotificationsFromFirebase && typeof window.loadNotificationsFromFirebase === 'function') {
                try {
                    await window.loadNotificationsFromFirebase();
                    // Get notifications from the global variable or DOM
                    notifications = this.extractNotificationsFromDOM();
                } catch (error) {
                    console.warn('Error loading notifications from Firebase:', error);
                    notifications = [];
                }
            } else {
                console.warn('Firebase notification function not available');
                notifications = [];
            }
            
            // If no notifications from Firebase, show empty state
            if (!notifications || notifications.length === 0) {
                this.displayEmptyNotifications();
            } else {
                this.displayNotifications(notifications);
            }
        } catch (error) {
            console.error('Error in loadNotifications:', error);
            this.displayNotificationsError();
        }
    }

    extractNotificationsFromDOM() {
        // Extract notifications that might have been loaded into the legacy panel
        const legacyContainer = document.getElementById('notifications-list-legacy');
        if (!legacyContainer) return [];
        
        const notificationElements = legacyContainer.querySelectorAll('[data-notification-id]');
        return Array.from(notificationElements).map(element => {
            const isUnread = element.classList.contains('unread') || element.querySelector('.w-2.h-2.bg-blue-500, .w-2.h-2.bg-red-500');
            const avatar = element.querySelector('img')?.src || this.createDefaultAvatar('U');
            const nameElement = element.querySelector('.font-medium, .font-bold');
            const contentElement = element.querySelector('.text-gray-300, .text-gray-400');
            const timeElement = element.querySelector('.text-xs');
            
            return {
                id: element.dataset.notificationId || 'notif_' + Date.now(),
                type: element.dataset.notificationType || 'info',
                user: nameElement?.textContent || 'Usuario',
                content: contentElement?.textContent || 'nueva actividad',
                timestamp: this.parseTimeFromText(timeElement?.textContent || ''),
                read: !isUnread,
                avatar: avatar
            };
        });
    }

    parseTimeFromText(timeText) {
        // Parse time text like "hace 5m", "hace 2h", etc.
        const now = new Date();
        
        if (!timeText || timeText.includes('Ahora')) {
            return now;
        }
        
        const match = timeText.match(/(\d+)([mhd])/);
        if (match) {
            const amount = parseInt(match[1]);
            const unit = match[2];
            
            switch (unit) {
                case 'm':
                    return new Date(now.getTime() - amount * 60 * 1000);
                case 'h':
                    return new Date(now.getTime() - amount * 60 * 60 * 1000);
                case 'd':
                    return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
            }
        }
        
        return now;
    }

    displayEmptyNotifications() {
        const container = document.getElementById('notifications-list');
        container.innerHTML = `
            <div class="notifications-empty">
                <i class="fas fa-bell"></i>
                <div>No tienes notificaciones</div>
            </div>
        `;
    }

    getMockNotifications() {
        // This is kept as fallback but should not be used with real Firebase data
        console.warn('Using mock notifications - Firebase not available');
        return [];
    }

    displayNotifications(notifications) {
        const container = document.getElementById('notifications-list');
        
        if (!container) {
            console.warn('Notifications container not found');
            return;
        }
        
        if (!notifications || notifications.length === 0) {
            container.innerHTML = `
                <div class="notifications-empty">
                    <i class="fas fa-bell"></i>
                    <div>No tienes notificaciones</div>
                </div>
            `;
            return;
        }

        try {
            const notificationsHtml = notifications.map(notif => {
                // Create a safe avatar URL
                const safeAvatar = this.createSafeAvatar(notif.avatar, notif.user);
                
                return `
                    <div class="notification-item ${!notif.read ? 'unread' : ''}" onclick="openNotification('${notif.id}')">
                        <div class="flex items-start space-x-3">
                            <img src="${safeAvatar}" alt="${notif.user}" class="w-8 h-8 rounded-full" onerror="this.src='${this.createDefaultAvatar(notif.user)}'">
                            <div class="flex-1">
                                <div class="text-white text-sm">
                                    <span class="font-medium">${this.escapeHtml(notif.user)}</span>
                                    <span class="text-gray-300">${this.escapeHtml(notif.content)}</span>
                                </div>
                                <div class="text-gray-400 text-xs mt-1">
                                    ${this.formatTimeAgo(notif.timestamp)}
                                </div>
                            </div>
                            ${!notif.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = notificationsHtml;
        } catch (error) {
            console.error('Error displaying notifications:', error);
            this.displayNotificationsError();
        }
    }

    createSafeAvatar(avatar, username) {
        // If avatar exists and is not a placeholder URL, use it
        if (avatar && !avatar.includes('placeholder')) {
            return avatar;
        }
        // Otherwise create a default avatar
        return this.createDefaultAvatar(username);
    }

    createDefaultAvatar(username) {
        const colors = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
        const colorIndex = (username?.charCodeAt(0) || 0) % colors.length;
        const color = colors[colorIndex];
        const initial = username?.charAt(0)?.toUpperCase() || 'U';
        
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="${color}"/>
                <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${initial}</text>
            </svg>
        `)}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    displayNotificationsError() {
        const container = document.getElementById('notifications-list');
        container.innerHTML = `
            <div class="notifications-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <div>Error al cargar notificaciones</div>
            </div>
        `;
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    }

    markAllNotificationsRead() {
        // Mark all notifications as read in database
        console.log('Marking all notifications as read');
        
        // Update UI
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            const indicator = item.querySelector('.w-2.h-2.bg-blue-500');
            if (indicator) indicator.remove();
        });

        // Update badge
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
}

// Initialize dropdown manager
let dropdownManager;
let originalHandleGlobalSearch;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        dropdownManager = new DropdownManager();
        console.log('Dropdown manager initialized successfully');
        
        // Backup original functions if they exist
        originalHandleGlobalSearch = window.handleGlobalSearch;
        
        // Define global functions immediately
        window.showSearchDropdown = () => {
            try { dropdownManager.showSearchDropdown(); } catch(e) { console.error('Search dropdown error:', e); }
        };
        window.hideSearchDropdownDelayed = () => {
            try { dropdownManager.hideSearchDropdownDelayed(); } catch(e) { console.error('Search dropdown error:', e); }
        };
        window.handleSearchInput = (query) => {
            try { dropdownManager.handleSearchInput(query); } catch(e) { console.error('Search input error:', e); }
        };
        window.toggleNotificationsDropdown = () => {
            try { dropdownManager.toggleNotificationsDropdown(); } catch(e) { console.error('Notifications dropdown error:', e); }
        };
        window.markAllNotificationsRead = () => {
            try { dropdownManager.markAllNotificationsRead(); } catch(e) { console.error('Mark notifications error:', e); }
        };

        // Enhanced handleGlobalSearch that works with both systems
        window.handleGlobalSearch = function(query) {
            try {
                // If this is called from the mobile search input, don't show/hide legacy panels
                const mobileInput = document.getElementById('mobile-search-input');
                const currentActiveElement = document.activeElement;
                
                if (currentActiveElement === mobileInput) {
                    // Use new dropdown system for mobile search
                    if (dropdownManager) {
                        dropdownManager.handleSearchInput(query);
                    }
                } else {
                    // Legacy behavior for compatibility
                    if (!query || query.trim().length < 2) {
                        // Don't call hideSearchResults if it will cause errors
                        const legacyPanel = document.getElementById('search-results-panel');
                        if (legacyPanel) {
                            legacyPanel.classList.add('hidden');
                        }
                        return;
                    }
                    
                    // Call original if it exists (for compatibility)
                    if (originalHandleGlobalSearch && typeof originalHandleGlobalSearch === 'function') {
                        originalHandleGlobalSearch(query);
                    }
                }
            } catch (error) {
                console.error('Error in handleGlobalSearch:', error);
            }
        };
    } catch (error) {
        console.error('Failed to initialize dropdown manager on DOM ready:', error);
    }
});

// Define functions immediately for early access with error handling
window.toggleNotificationsDropdown = function() {
    try {
        console.log('toggleNotificationsDropdown called');
        if (dropdownManager) {
            dropdownManager.toggleNotificationsDropdown();
        } else {
            console.log('Dropdown manager not ready yet, trying to initialize...');
            // Try to initialize if not ready
            try {
                dropdownManager = new DropdownManager();
                dropdownManager.toggleNotificationsDropdown();
            } catch (initError) {
                console.error('Failed to initialize dropdown manager:', initError);
                // Create a minimal fallback
                window.showBasicNotificationFallback();
            }
        }
    } catch (error) {
        console.error('Error in toggleNotificationsDropdown:', error);
        // Prevent extension errors from breaking the app
        window.showBasicNotificationFallback();
    }
};

// Fallback function for when everything else fails
window.showBasicNotificationFallback = function() {
    alert('Las notificaciones no están disponibles en este momento. Por favor, recarga la página.');
};

window.handleSearchInput = function(query) {
    try {
        if (dropdownManager) {
            dropdownManager.handleSearchInput(query);
        } else {
            console.log('Dropdown manager not ready yet');
        }
    } catch (error) {
        console.error('Error in handleSearchInput:', error);
    }
};

window.showSearchDropdown = function() {
    try {
        if (dropdownManager) {
            dropdownManager.showSearchDropdown();
        } else {
            console.log('Dropdown manager not ready yet');
        }
    } catch (error) {
        console.error('Error in showSearchDropdown:', error);
    }
};

window.hideSearchDropdownDelayed = function() {
    try {
        if (dropdownManager) {
            dropdownManager.hideSearchDropdownDelayed();
        } else {
            console.log('Dropdown manager not ready yet');
        }
    } catch (error) {
        console.error('Error in hideSearchDropdownDelayed:', error);
    }
};

window.markAllNotificationsRead = function() {
    try {
        if (dropdownManager) {
            dropdownManager.markAllNotificationsRead();
        } else {
            console.log('Dropdown manager not ready yet');
        }
    } catch (error) {
        console.error('Error in markAllNotificationsRead:', error);
    }
};

// Search result selection handlers
window.selectUser = function(userId) {
    console.log('Selected user:', userId);
    if (dropdownManager) {
        dropdownManager.hideSearchDropdown();
    }
    // Close mobile search if open
    const mobileModal = document.getElementById('mobile-search-modal');
    if (mobileModal && !mobileModal.classList.contains('hidden')) {
        window.toggleMobileSearch();
    }
    // Navigate to user profile
};

window.selectPost = function(postId) {
    console.log('Selected post:', postId);
    if (dropdownManager) {
        dropdownManager.hideSearchDropdown();
    }
    // Close mobile search if open
    const mobileModal = document.getElementById('mobile-search-modal');
    if (mobileModal && !mobileModal.classList.contains('hidden')) {
        window.toggleMobileSearch();
    }
    // Navigate to post
};

window.selectHashtag = function(hashtag) {
    console.log('Selected hashtag:', hashtag);
    if (dropdownManager) {
        dropdownManager.hideSearchDropdown();
    }
    // Close mobile search if open
    const mobileModal = document.getElementById('mobile-search-modal');
    if (mobileModal && !mobileModal.classList.contains('hidden')) {
        window.toggleMobileSearch();
    }
    // Search for hashtag
};

window.openNotification = function(notificationId) {
    console.log('Opening notification:', notificationId);
    if (dropdownManager) {
        dropdownManager.hideNotificationsDropdown();
    }
    // Handle notification click
};

// Mobile Search Functions
let mobileSearchCategory = 'all';
let mobileSearchTimeout = null;

window.initializeMobileSearch = function() {
    console.log('Initializing mobile search');
    // Reset to default state
    mobileSearchCategory = 'all';
    updateMobileSearchCategories();
};

window.handleMobileSearchInput = function(query) {
    console.log('Mobile search input:', query);
    
    // Clear previous timeout
    if (mobileSearchTimeout) {
        clearTimeout(mobileSearchTimeout);
    }

    if (!query.trim()) {
        showMobileSearchEmpty();
        return;
    }

    // Show loading state
    showMobileSearchLoading();

    // Debounce search
    mobileSearchTimeout = setTimeout(() => {
        performMobileSearch(query);
    }, 300);
};

window.setMobileSearchCategory = function(category) {
    console.log('Setting mobile search category:', category);
    mobileSearchCategory = category;
    updateMobileSearchCategories();
    
    // Re-search with current query if there is one
    const query = document.getElementById('mobile-search-input')?.value;
    if (query && query.trim()) {
        performMobileSearch(query);
    }
};

function updateMobileSearchCategories() {
    const buttons = document.querySelectorAll('#mobile-search-modal .search-category-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === mobileSearchCategory) {
            btn.classList.add('active');
        }
    });
}

function performMobileSearch(query) {
    console.log('Performing mobile search:', query, 'category:', mobileSearchCategory);
    
    try {
        // Use real Firebase search functions if available
        if (window.searchPosts && window.searchUsers && window.searchHashtags) {
            performFirebaseMobileSearch(query, mobileSearchCategory);
        } else {
            console.warn('Firebase search functions not available, using fallback');
            // Fallback to mock results only if Firebase not available
            const mockResults = getMobileSearchMockResults(query, mobileSearchCategory);
            displayMobileSearchResults(mockResults);
        }
    } catch (error) {
        console.error('Mobile search error:', error);
        showMobileSearchError();
    }
}

async function performFirebaseMobileSearch(query, category) {
    try {
        let results = [];
        
        if (category === 'all') {
            // Search all categories in parallel
            const [posts, users, hashtags] = await Promise.all([
                window.searchPosts(query).catch(() => []),
                window.searchUsers(query).catch(() => []),
                window.searchHashtags(query).catch(() => [])
            ]);
            
            // Format and combine results (limit to 10 total for mobile)
            const formattedResults = [
                ...formatMobilePosts(posts || []).slice(0, 3),
                ...formatMobileUsers(users || []).slice(0, 4),
                ...formatMobileHashtags(hashtags || []).slice(0, 3)
            ];
            
            results = formattedResults.slice(0, 10);
        } else if (category === 'posts') {
            const posts = await window.searchPosts(query);
            results = formatMobilePosts(posts || []).slice(0, 10);
        } else if (category === 'users') {
            const users = await window.searchUsers(query);
            results = formatMobileUsers(users || []).slice(0, 10);
        } else if (category === 'hashtags') {
            const hashtags = await window.searchHashtags(query);
            results = formatMobileHashtags(hashtags || []).slice(0, 10);
        }
        
        displayMobileSearchResults(results);
    } catch (error) {
        console.error('Firebase mobile search error:', error);
        showMobileSearchError();
    }
}

function formatMobilePosts(posts) {
    return posts.map(post => ({
        type: 'post',
        id: post.id,
        content: post.content || post.text || post.message || '',
        author: post.author || post.username || post.user || 'Usuario',
        timestamp: post.timestamp ? new Date(post.timestamp) : new Date()
    }));
}

function formatMobileUsers(users) {
    return users.map(user => ({
        type: 'user',
        id: user.id || user.uid,
        name: user.displayName || user.name || user.username || 'Usuario',
        username: '@' + (user.username || user.id || 'usuario'),
        avatar: user.photoURL || user.avatar || createMobileDefaultAvatar(user.displayName || user.name || user.username || 'U')
    }));
}

function formatMobileHashtags(hashtags) {
    return hashtags.map(hashtag => ({
        type: 'hashtag',
        id: hashtag.id || hashtag.tag,
        tag: hashtag.tag || hashtag.hashtag || '#hashtag',
        count: hashtag.count || hashtag.postCount || 0
    }));
}

function createMobileDefaultAvatar(username) {
    const colors = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
    const colorIndex = (username?.charCodeAt(0) || 0) % colors.length;
    const color = colors[colorIndex];
    const initial = username?.charAt(0)?.toUpperCase() || 'U';
    
    return `data:image/svg+xml;base64,${btoa(`
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="${color}"/>
            <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${initial}</text>
        </svg>
    `)}`;
}

function getMobileSearchMockResults(query, category) {
    // Fallback only - real search should use Firebase functions
    console.warn('Using mock search results - Firebase not available');
    return [];
}

function displayMobileSearchResults(results) {
    const container = document.getElementById('mobile-search-results');
    
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="search-empty">
                <i class="fas fa-search"></i>
                <div>No se encontraron resultados</div>
            </div>
        `;
        return;
    }

    const resultsHtml = results.map(result => {
        switch (result.type) {
            case 'user':
                return `
                    <div class="search-result-item" onclick="selectUser('${result.id}')">
                        <div class="flex items-center space-x-3">
                            <img src="${result.avatar}" alt="${result.name}" class="w-8 h-8 rounded-full">
                            <div>
                                <div class="text-white font-medium">${result.name}</div>
                                <div class="text-gray-400 text-sm">${result.username}</div>
                            </div>
                        </div>
                    </div>
                `;
            case 'post':
                return `
                    <div class="search-result-item" onclick="selectPost('${result.id}')">
                        <div class="text-white font-medium mb-1">${result.author}</div>
                        <div class="text-gray-300 text-sm">${result.content.substring(0, 100)}...</div>
                    </div>
                `;
            case 'hashtag':
                return `
                    <div class="search-result-item" onclick="selectHashtag('${result.tag}')">
                        <div class="flex items-center justify-between">
                            <div class="text-blue-400 font-medium">${result.tag}</div>
                            <div class="text-gray-400 text-sm">${result.count} posts</div>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }).join('');

    container.innerHTML = resultsHtml;
}

function showMobileSearchLoading() {
    const container = document.getElementById('mobile-search-results');
    container.innerHTML = `
        <div class="search-loading">
            Buscando...
        </div>
    `;
}

function showMobileSearchEmpty() {
    const container = document.getElementById('mobile-search-results');
    container.innerHTML = `
        <div class="search-empty">
            <i class="fas fa-search"></i>
            <div>Escribe para buscar posts, usuarios y hashtags</div>
        </div>
    `;
}

function showMobileSearchError() {
    const container = document.getElementById('mobile-search-results');
    container.innerHTML = `
        <div class="search-empty">
            <i class="fas fa-exclamation-triangle"></i>
            <div>Error al buscar. Intenta de nuevo.</div>
        </div>
    `;
}