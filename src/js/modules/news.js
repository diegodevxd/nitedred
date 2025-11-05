// ========================================
// NEWS MODULE - Unified Intelligent Feed
// ========================================

let newsData = [];
let allNewsData = []; // Unfiltered complete dataset
let currentNewsCategories = ['all']; // Multi-select categories
let savedNews = new Set(); // Saved news IDs
let newsPage = 1;
const NEWS_PER_PAGE = 50; // Increased from 30 to 50
let breakingNews = [];
let trendingTopics = [];

/**
 * Load news from all sources using API Manager
 */
async function loadCryptoNews() {
    console.log('📰 Loading unified news feed...');
    
    const loadingEl = document.getElementById('news-loading');
    const containerEl = document.getElementById('news-container');
    const errorEl = document.getElementById('news-error');
    const emptyEl = document.getElementById('news-empty');
    
    // Show loading
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (containerEl) containerEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    
    try {
        // Show mock news IMMEDIATELY on mobile for instant loading
        const mockNewsArray = getMockNewsData();
        allNewsData = [...mockNewsArray];
        
        // Render immediately
        applyFilters();
        updateTrendingTopics();
        updateBreakingNews();
        renderNews();
        renderTrendingTopics();
        renderBreakingNews();
        
        if (loadingEl) loadingEl.classList.add('hidden');
        if (containerEl) containerEl.classList.remove('hidden');
        
        // Check if API Manager is loaded
        if (typeof window.newsAPIManager === 'undefined') {
            console.warn('⚠️ News API Manager not loaded - using mock data only');
            return;
        }
        
        // Fetch from all sources in BACKGROUND (with timeout for mobile)
        const category = currentNewsCategories.includes('all') ? 'all' : currentNewsCategories[0];
        const apiNews = await Promise.race([
            window.newsAPIManager.fetchAllNews(category, NEWS_PER_PAGE),
            new Promise((resolve) => setTimeout(() => resolve([]), 5000)) // 5s timeout
        ]);
        
        // Merge API news with mock news if we got data
        if (apiNews && apiNews.length > 0) {
            allNewsData = [...apiNews, ...mockNewsArray];
            
            // Remove duplicates by ID
            const uniqueNews = new Map();
            allNewsData.forEach(news => {
                if (!uniqueNews.has(news.id)) {
                    uniqueNews.set(news.id, news);
                }
            });
            allNewsData = Array.from(uniqueNews.values());
            
            // Sort by date (newest first)
            allNewsData.sort((a, b) => b.published_on - a.published_on);
            
            console.log(`✅ Updated with ${allNewsData.length} news articles (API + mock)`);
            
            // Debug: Show all unique categories
            const allCategories = new Set();
            allNewsData.forEach(news => {
                if (Array.isArray(news.categories)) {
                    news.categories.forEach(cat => allCategories.add(cat));
                }
            });
            console.log(`📂 Available categories in data: [${Array.from(allCategories).join(', ')}]`);
            
            // Re-filter and re-render with updated data
            applyFilters();
            updateTrendingTopics();
            updateBreakingNews();
            renderNews();
            renderTrendingTopics();
            renderBreakingNews();
        } else {
            console.log('✅ Using mock data only (API timeout or no data)');
        }
        
    } catch (error) {
        console.error('❌ Error loading news:', error);
        // Keep showing mock data (already rendered)
    }
}

/**
 * Get mock news data array
 */
function getMockNewsData() {
    return [
        {
            id: 'mock_1',
            title: '🚀 Bitcoin alcanza nuevo máximo histórico superando los $100,000',
            description: 'Bitcoin marca un hito histórico al superar la barrera psicológica de los $100,000, impulsado por la adopción institucional masiva y la aprobación de múltiples ETFs.',
            imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 300, // 5 min ago (BREAKING)
            source: 'CryptoNews',
            categories: ['crypto', 'bitcoin', 'market'],
            tags: ['btc', 'ath', 'bullish'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_2',
            title: '🚀 SpaceX lanza exitosamente Starship a Marte con tripulación',
            description: 'En un momento histórico, SpaceX completa el primer vuelo tripulado a Marte, marcando el inicio de la era interplanetaria.',
            imageUrl: 'https://images.unsplash.com/photo-1516849677043-ef67c9557e16?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 600, // 10 min ago (BREAKING)
            source: 'Spaceflight News',
            categories: ['space', 'rockets', 'science'],
            tags: ['spacex', 'mars', 'starship'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_3',
            title: '⚡ Ethereum 2.0: La actualización que revolucionará las DeFi',
            description: 'La nueva actualización de Ethereum promete reducir las tarifas de gas en un 90% y aumentar la velocidad de las transacciones 100x.',
            imageUrl: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 3600,
            source: 'DeFi Pulse',
            categories: ['crypto', 'ethereum', 'defi'],
            tags: ['eth', 'defi', 'upgrade'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_4',
            title: '🤖 OpenAI lanza GPT-5: IA que supera la inteligencia humana',
            description: 'GPT-5 demuestra capacidades de razonamiento y creatividad que superan el desempeño humano promedio en múltiples dominios.',
            imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 7200,
            source: 'TechCrunch',
            categories: ['tech', 'ai', 'innovation'],
            tags: ['ai', 'openai', 'gpt5'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_5',
            title: '🎨 NFTs: El mercado alcanza los $50 mil millones en volumen',
            description: 'El mercado de NFTs continúa su expansión con nuevas colecciones rompiendo récords de ventas cada semana.',
            imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 10800,
            source: 'NFT Today',
            categories: ['crypto', 'nft', 'art'],
            tags: ['nft', 'art', 'market'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_6',
            title: '📊 SEC aprueba ETFs de Bitcoin y Ethereum: Apertura institucional',
            description: 'La Comisión de Valores de EE.UU aprueba múltiples ETFs de criptomonedas, facilitando la inversión institucional masiva.',
            imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 14400,
            source: 'Bloomberg Crypto',
            categories: ['crypto', 'regulation', 'stocks'],
            tags: ['btc', 'eth', 'etf', 'sec'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_7',
            title: '💰 DeFi alcanza $500B en TVL: Nuevo récord histórico',
            description: 'El valor total bloqueado en protocolos DeFi supera medio trillón de dólares, marcando un crecimiento del 300% anual.',
            imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 18000,
            source: 'DeFi Llama',
            categories: ['crypto', 'defi', 'market'],
            tags: ['defi', 'tvl', 'growth'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_8',
            title: '🍎 Apple presenta Vision Pro 2 con IA integrada',
            description: 'La nueva versión del headset de realidad mixta incluye chips de IA dedicados y precio reducido a $2,000.',
            imageUrl: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 21600,
            source: 'Apple Insider',
            categories: ['tech', 'vr', 'ai'],
            tags: ['apple', 'vr', 'ai'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_9',
            title: '⚠️ Reguladores advierten sobre riesgos en stablecoins',
            description: 'Autoridades financieras globales expresan preocupación sobre la falta de respaldo en algunas stablecoins.',
            imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 25200,
            source: 'Financial Times',
            categories: ['crypto', 'regulation'],
            tags: ['stablecoins', 'regulation', 'warning'],
            sentiment: 'bearish',
            apiSource: 'mock'
        },
        {
            id: 'mock_10',
            title: '🌐 Web3 Gaming supera 10 millones de jugadores activos',
            description: 'Los juegos blockchain alcanzan adopción masiva con títulos AAA entrando al mercado.',
            imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 28800,
            source: 'GameFi News',
            categories: ['crypto', 'gaming', 'web3'],
            tags: ['gaming', 'web3', 'nft'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_11',
            title: '🔬 NASA descubre agua líquida en la luna de Júpiter',
            description: 'Telescopio James Webb detecta señales definitivas de océanos subterráneos en Europa, aumentando posibilidad de vida.',
            imageUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 32400,
            source: 'NASA',
            categories: ['space', 'science'],
            tags: ['nasa', 'jupiter', 'discovery'],
            sentiment: 'bullish',
            apiSource: 'mock'
        },
        {
            id: 'mock_12',
            title: '💼 Microsoft adquiere startup de IA por $15 mil millones',
            description: 'La gigante tecnológica continúa su expansión en inteligencia artificial con la mayor adquisición del año.',
            imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
            url: '#',
            published_on: Math.floor(Date.now() / 1000) - 36000,
            source: 'Reuters',
            categories: ['tech', 'business', 'ai'],
            tags: ['microsoft', 'ai', 'acquisition'],
            sentiment: 'bullish',
            apiSource: 'mock'
        }
    ];
}

/**
 * Load enhanced mock news data (multi-category) - FALLBACK ONLY
 */
async function loadMockNews() {
    console.log('📰 Loading enhanced mock news data...');
    
    const loadingEl = document.getElementById('news-loading');
    const containerEl = document.getElementById('news-container');
    const errorEl = document.getElementById('news-error');
    const emptyEl = document.getElementById('news-empty');
    
    allNewsData = getMockNewsData();
    
    console.log(`✅ Loaded ${allNewsData.length} mock news articles`);
    
    // Apply filters and render
    applyFilters();
    updateTrendingTopics();
    updateBreakingNews();
    renderNews();
    renderTrendingTopics();
    renderBreakingNews();
    
    // Hide loading, show content
    if (loadingEl) loadingEl.classList.add('hidden');
    if (containerEl) containerEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
}

/**
 * Apply current filters to news data
 */
function applyFilters() {
    if (!window.newsAPIManager) {
        newsData = allNewsData;
        return;
    }
    
    // Filter by categories
    newsData = window.newsAPIManager.filterByCategories(allNewsData, currentNewsCategories);
    
    console.log(`📊 Filtered: ${newsData.length} articles (from ${allNewsData.length})`);
}

/**
 * Update trending topics
 */
function updateTrendingTopics() {
    if (!window.newsAPIManager) return;
    
    const topics = window.newsAPIManager.getTrendingTopics(allNewsData);
    trendingTopics = topics.slice(0, 8); // Top 8
    console.log('🔥 Trending topics:', trendingTopics);
}

/**
 * Update breaking news (last 15 minutes)
 */
function updateBreakingNews() {
    const fifteenMinutesAgo = Math.floor(Date.now() / 1000) - (15 * 60);
    breakingNews = allNewsData.filter(news => news.published_on > fifteenMinutesAgo);
    console.log(`🔴 Breaking news: ${breakingNews.length} articles`);
}

/**
 * Render trending topics bar
 */
function renderTrendingTopics() {
    const container = document.getElementById('trending-topics-bar');
    if (!container || trendingTopics.length === 0) return;
    
    container.innerHTML = trendingTopics.map(topic => `
        <button onclick="filterByTopic('${topic.tag}')" class="trending-topic-btn">
            #${topic.tag}
            <span class="trending-count">${topic.count}</span>
        </button>
    `).join('');
    
    const trendingSection = document.getElementById('trending-section');
    if (trendingSection) trendingSection.classList.remove('hidden');
}

/**
 * Render breaking news banner
 */
function renderBreakingNews() {
    const container = document.getElementById('breaking-news-banner');
    if (!container) return;
    
    if (breakingNews.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    const latest = breakingNews[0];
    container.innerHTML = `
        <div class="breaking-news-content" onclick="openNewsUrl('${latest.url}')">
            <div class="breaking-label">
                <i class="fas fa-circle animate-pulse"></i>
                BREAKING
            </div>
            <div class="breaking-title">${latest.title}</div>
            <div class="breaking-time">${getTimeAgo(latest.published_on)}</div>
        </div>
    `;
    container.classList.remove('hidden');
}

/**
 * Render news articles
 */
function renderNews() {
    const containerEl = document.getElementById('news-container');
    const loadingEl = document.getElementById('news-loading');
    const featuredContainer = document.getElementById('featured-news-container');
    const featuredSection = document.getElementById('featured-news');
    
    if (!containerEl) return;
    
    // Hide loading
    if (loadingEl) loadingEl.classList.add('hidden');
    containerEl.classList.remove('hidden');
    
    // newsData ya está filtrado por applyFilters()
    if (newsData.length === 0) {
        showNewsEmpty();
        return;
    }
    
    // Separate featured news (first 2)
    const featuredNews = newsData.slice(0, 2);
    const regularNews = newsData.slice(2);
    
    // Render featured news
    if (featuredContainer && featuredNews.length > 0) {
        featuredContainer.innerHTML = featuredNews.map(news => createFeaturedNewsCard(news)).join('');
        if (featuredSection) featuredSection.classList.remove('hidden');
    }
    
    // Render regular news
    containerEl.innerHTML = regularNews.map(news => createNewsCard(news)).join('');
    
    // Add click listeners
    addNewsClickListeners();
}

/**
 * Create featured news card HTML
 */
function createFeaturedNewsCard(news) {
    const timeAgo = getTimeAgo(news.published_on);
    const tags = news.tags || [];
    const categories = news.categories || [];
    const imageUrl = news.imageUrl || 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800';
    const sentiment = news.sentiment || 'neutral';
    
    // Sentiment badge
    let sentimentBadge = '';
    if (sentiment === 'bullish') {
        sentimentBadge = '<span class="news-sentiment news-sentiment-bullish"><i class="fas fa-arrow-up"></i> Bullish</span>';
    } else if (sentiment === 'bearish') {
        sentimentBadge = '<span class="news-sentiment news-sentiment-bearish"><i class="fas fa-arrow-down"></i> Bearish</span>';
    }
    
    return `
        <div class="news-card news-card-featured news-fade-in" data-url="${news.url || '#'}" data-news-id="${news.id}">
            <div class="news-featured-banner">
                <img src="${imageUrl}" alt="${news.title}" class="news-image" onerror="this.src='https://via.placeholder.com/800x400?text=News'">
                <div class="news-featured-overlay">
                    <div class="news-title">${news.title}</div>
                    <div class="news-meta">
                        <div class="news-source">
                            <div class="news-source-icon">
                                <i class="fas fa-fire text-orange-400"></i>
                            </div>
                            <span>${news.source || 'News'}</span>
                        </div>
                        ${sentimentBadge}
                        <div class="news-time">
                            <i class="fas fa-clock"></i>
                            <span>${timeAgo}</span>
                        </div>
                    </div>
                    <div class="news-tags">
                        ${[...categories, ...tags].slice(0, 3).map(tag => `<span class="news-tag news-tag-${tag.toLowerCase()}">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create news card HTML with sentiment
 */
function createNewsCard(news) {
    const timeAgo = getTimeAgo(news.published_on);
    const tags = news.tags || [];
    const categories = news.categories || [];
    const imageUrl = news.imageUrl || 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800';
    const description = news.description || '';
    const sentiment = news.sentiment || 'neutral';
    const isSaved = savedNews.has(news.id);
    
    // Sentiment badge
    let sentimentBadge = '';
    if (sentiment === 'bullish') {
        sentimentBadge = '<span class="news-sentiment news-sentiment-bullish"><i class="fas fa-arrow-up"></i> Bullish</span>';
    } else if (sentiment === 'bearish') {
        sentimentBadge = '<span class="news-sentiment news-sentiment-bearish"><i class="fas fa-arrow-down"></i> Bearish</span>';
    }
    
    return `
        <div class="news-card news-fade-in" data-url="${news.url || '#'}" data-news-id="${news.id}">
            <img src="${imageUrl}" alt="${news.title}" class="news-image" onerror="this.src='https://via.placeholder.com/800x400?text=News'">
            <div class="news-content">
                <div class="news-header">
                    <div class="news-title">${news.title}</div>
                    <button onclick="toggleSaveNews(event, '${news.id}')" class="save-news-btn ${isSaved ? 'saved' : ''}" title="Guardar noticia">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
                <div class="news-description">${description}</div>
                <div class="news-meta">
                    <div class="news-source">
                        <div class="news-source-icon">
                            <i class="fas fa-newspaper"></i>
                        </div>
                        <span>${news.source || 'News'}</span>
                    </div>
                    ${sentimentBadge}
                    <div class="news-time">
                        <i class="fas fa-clock"></i>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                <div class="news-tags">
                    ${[...categories, ...tags].slice(0, 4).map(tag => `<span class="news-tag news-tag-${tag.toLowerCase()}">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Extract tags from categories and tags string
 */
function extractTags(categories, tags) {
    const allTags = new Set();
    
    if (categories) {
        categories.split('|').forEach(cat => allTags.add(cat.trim()));
    }
    
    if (tags) {
        tags.split(',').slice(0, 3).forEach(tag => allTags.add(tag.trim()));
    }
    
    return Array.from(allTags).slice(0, 3);
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return `${Math.floor(diff / 604800)}sem`;
}

/**
 * Filter news by category (multi-select)
 */
function filterNewsByCategory(category) {
    const button = event.target;
    
    if (category === 'all') {
        // Clear all filters
        currentNewsCategories = ['all'];
        document.querySelectorAll('.news-category-btn, .news-category-btn-mobile').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('[data-category="all"]').forEach(btn => btn.classList.add('active'));
    } else {
        // Toggle category
        const index = currentNewsCategories.indexOf(category);
        
        // Remove 'all' if selecting specific category
        const allIndex = currentNewsCategories.indexOf('all');
        if (allIndex !== -1) {
            currentNewsCategories.splice(allIndex, 1);
            document.querySelectorAll('[data-category="all"]').forEach(btn => btn.classList.remove('active'));
        }
        
        if (index === -1) {
            currentNewsCategories.push(category);
            document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => btn.classList.add('active'));
        } else {
            currentNewsCategories.splice(index, 1);
            document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => btn.classList.remove('active'));
        }
        
        // If no categories selected, default to 'all'
        if (currentNewsCategories.length === 0) {
            currentNewsCategories = ['all'];
            document.querySelectorAll('[data-category="all"]').forEach(btn => btn.classList.add('active'));
        }
    }
    
    // Update mobile dropdown text
    const categoryEmojis = {
        'all': '🌐 All',
        'crypto': '🪙 Crypto',
        'tech': '💻 Tech',
        'space': '🚀 Space',
        'business': '💼 Business',
        'science': '🔬 Science',
        'ai': '🤖 AI'
    };
    
    const selectedText = document.getElementById('selected-category-text');
    if (selectedText) {
        if (currentNewsCategories.length === 1) {
            selectedText.textContent = categoryEmojis[currentNewsCategories[0]];
        } else {
            selectedText.textContent = `${currentNewsCategories.length} categories`;
        }
    }
    
    // Close mobile dropdown
    const dropdown = document.getElementById('categories-dropdown');
    if (dropdown && !dropdown.classList.contains('hidden')) {
        toggleCategoriesMenu();
    }
    
    console.log('📂 Active filters:', currentNewsCategories);
    applyFilters();
    renderNews();
}

/**
 * Toggle categories dropdown menu (mobile)
 */
function toggleCategoriesMenu() {
    const dropdown = document.getElementById('categories-dropdown');
    const chevron = document.getElementById('categories-chevron');
    
    if (dropdown && chevron) {
        dropdown.classList.toggle('hidden');
        chevron.classList.toggle('rotated');
    }
}

/**
 * Filter by trending topic
 */
function filterByTopic(topic) {
    // Search in title and tags
    if (!window.newsAPIManager) return;
    
    newsData = window.newsAPIManager.searchNews(allNewsData, topic);
    console.log(`🔍 Search "${topic}": ${newsData.length} results`);
    renderNews();
}

/**
 * Toggle save news
 */
function toggleSaveNews(event, newsId) {
    event.stopPropagation();
    
    if (savedNews.has(newsId)) {
        savedNews.delete(newsId);
        console.log(`🔖 Removed from saved: ${newsId}`);
    } else {
        savedNews.add(newsId);
        console.log(`🔖 Saved: ${newsId}`);
    }
    
    // Update button state
    const button = event.target.closest('.save-news-btn');
    if (button) {
        button.classList.toggle('saved');
    }
    
    // TODO: Save to Firebase
    saveSavedNewsToFirebase();
}

/**
 * Save saved news to Firebase
 */
function saveSavedNewsToFirebase() {
    if (!window.currentUser || !window.firebaseDB) return;
    
    try {
        const { ref, set } = window.firebaseDB;
        const userRef = ref(window.database, `users/${window.currentUser.uid}/savedNews`);
        set(userRef, Array.from(savedNews));
        console.log('✅ Saved news synced to Firebase');
    } catch (error) {
        console.error('❌ Error saving to Firebase:', error);
    }
}

/**
 * Load saved news from Firebase
 */
function loadSavedNewsFromFirebase() {
    if (!window.currentUser || !window.firebaseDB) return;
    
    try {
        const { ref, get } = window.firebaseDB;
        const userRef = ref(window.database, `users/${window.currentUser.uid}/savedNews`);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                savedNews = new Set(snapshot.val());
                console.log(`✅ Loaded ${savedNews.size} saved news from Firebase`);
            }
        });
    } catch (error) {
        console.error('❌ Error loading from Firebase:', error);
    }
}

/**
 * Open news URL
 */
function openNewsUrl(url) {
    if (url && url !== '#') {
        window.open(url, '_blank');
    }
}

/**
 * Refresh news
 */
function refreshNews() {
    const refreshBtn = event.target.closest('button');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        icon.classList.add('fa-spin');
        
        setTimeout(() => {
            icon.classList.remove('fa-spin');
        }, 1000);
    }
    
    loadCryptoNews();
}

/**
 * Load more news
 */
function loadMoreNews() {
    newsPage++;
    // In a real implementation, load more news from API
    console.log('Loading more news...');
}

/**
 * Show news error
 */
function showNewsError() {
    const loadingEl = document.getElementById('news-loading');
    const containerEl = document.getElementById('news-container');
    const errorEl = document.getElementById('news-error');
    
    if (loadingEl) loadingEl.classList.add('hidden');
    if (containerEl) containerEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
}

/**
 * Show empty state
 */
function showNewsEmpty() {
    const loadingEl = document.getElementById('news-loading');
    const containerEl = document.getElementById('news-container');
    const emptyEl = document.getElementById('news-empty');
    
    if (loadingEl) loadingEl.classList.add('hidden');
    if (containerEl) containerEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
}

/**
 * Add click listeners to news cards
 */
function addNewsClickListeners() {
    document.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', function() {
            const url = this.dataset.url;
            if (url && url !== '#') {
                window.open(url, '_blank');
            }
        });
    });
}

/**
 * Initialize news module
 */
function initializeNewsModule() {
    console.log('📰 Initializing News Module...');
    
    // Load saved news from Firebase
    loadSavedNewsFromFirebase();
    
    // Load news when news section is shown
    const newsSection = document.getElementById('news-section');
    if (newsSection && !newsSection.classList.contains('hidden')) {
        loadCryptoNews();
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNewsModule);
} else {
    initializeNewsModule();
}

// Export functions for global use
window.loadCryptoNews = loadCryptoNews;
window.filterNewsByCategory = filterNewsByCategory;
window.toggleCategoriesMenu = toggleCategoriesMenu;
window.filterByTopic = filterByTopic;
window.toggleSaveNews = toggleSaveNews;
window.openNewsUrl = openNewsUrl;
window.refreshNews = refreshNews;
window.loadMoreNews = loadMoreNews;

console.log('✅ Unified News Module Loaded');
