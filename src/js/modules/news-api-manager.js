// ========================================
// NEWS API MANAGER - Multi-source News Aggregator
// ========================================

/**
 * Manages multiple news APIs and aggregates results
 * Supports: GNews, Spaceflight News, MarketAux, Currents, CryptoCompare
 */

class NewsAPIManager {
    constructor() {
        // API Configurations
        this.apis = {
            gnews: {
                baseUrl: 'https://gnews.io/api/v4',
                apiKey: '8607c3ea4ff02a6cc2b6d84e54920d36',
                enabled: true,
                categories: ['general', 'business', 'technology', 'science', 'health']
            },
            spaceflight: {
                baseUrl: 'https://api.spaceflightnewsapi.net/v4',
                apiKey: null, // No API key needed
                enabled: true,
                categories: ['space', 'rockets', 'launches']
            },
            marketaux: {
                baseUrl: 'https://api.marketaux.com/v1',
                apiKey: '', // Free tier: 100 requests/day - User can add their key
                enabled: false,
                categories: ['crypto', 'stocks', 'forex']
            },
            currents: {
                baseUrl: 'https://api.currentsapi.services/v1',
                apiKey: '', // Free tier: 600 requests/day - User can add their key
                enabled: false,
                categories: ['technology', 'business', 'science', 'entertainment']
            },
            cryptocompare: {
                baseUrl: 'https://min-api.cryptocompare.com/data/v2',
                apiKey: null, // No API key needed for basic usage
                enabled: true,
                categories: ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft']
            }
        };

        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Fetch news from all enabled sources
     */
    async fetchAllNews(category = 'all', limit = 30) {
        console.log(`📰 Fetching news from all sources...`);
        
        const promises = [];
        
        // Always fetch from all sources, filter later
        // CryptoCompare for crypto news
        if (this.apis.cryptocompare.enabled) {
            promises.push(this.fetchCryptoCompare());
        }
        
        // Spaceflight for space news
        if (this.apis.spaceflight.enabled) {
            promises.push(this.fetchSpaceflight());
        }
        
        // GNews for general/tech/business/science
        if (this.apis.gnews.enabled && this.apis.gnews.apiKey) {
            promises.push(this.fetchGNews('technology')); // Tech news
            promises.push(this.fetchGNews('business'));   // Business news
            promises.push(this.fetchGNews('science'));    // Science news
            promises.push(this.fetchGNews('world'));      // World news
        }
        
        // MarketAux for sentiment analysis
        if (this.apis.marketaux.enabled && this.apis.marketaux.apiKey) {
            promises.push(this.fetchMarketAux('crypto'));
        }
        
        // Currents for multi-source
        if (this.apis.currents.enabled && this.apis.currents.apiKey) {
            promises.push(this.fetchCurrents('technology'));
        }
        
        try {
            const results = await Promise.allSettled(promises);
            const allNews = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    allNews.push(...result.value);
                    console.log(`✅ Source ${index + 1}: ${result.value.length} articles`);
                } else {
                    console.warn(`⚠️ Source ${index + 1} failed:`, result.reason);
                }
            });
            
            // Sort by date (newest first)
            allNews.sort((a, b) => b.published_on - a.published_on);
            
            // Limit results
            const limitedNews = allNews.slice(0, limit);
            
            console.log(`✅ Total aggregated news: ${limitedNews.length}`);
            return limitedNews;
            
        } catch (error) {
            console.error('❌ Error fetching news:', error);
            return [];
        }
    }

    /**
     * Fetch from CryptoCompare API
     */
    async fetchCryptoCompare() {
        const cacheKey = 'cryptocompare';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            // Fetch more news and filter client-side for last 3 days
            const response = await fetch(`${this.apis.cryptocompare.baseUrl}/news/?lang=EN`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            // Filter to last 3 days
            const threeDaysAgo = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60);
            const recentNews = data.Data.filter(item => item.published_on >= threeDaysAgo);
            
            const news = recentNews.map(item => this.normalizeCryptoCompare(item));
            
            this.setCache(cacheKey, news);
            return news;
        } catch (error) {
            console.error('❌ CryptoCompare error:', error);
            return [];
        }
    }

    /**
     * Fetch from Spaceflight News API
     */
    async fetchSpaceflight() {
        const cacheKey = 'spaceflight';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetch(`${this.apis.spaceflight.baseUrl}/articles?limit=20`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const news = data.results.map(item => this.normalizeSpaceflight(item));
            
            this.setCache(cacheKey, news);
            return news;
        } catch (error) {
            console.error('❌ Spaceflight API error:', error);
            return [];
        }
    }

    /**
     * Fetch from GNews API
     */
    async fetchGNews(category = 'general') {
        if (!this.apis.gnews.apiKey) return [];
        
        const cacheKey = `gnews_${category}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            // Calculate dates for last 3 days
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 3);
            
            const from = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const to = toDate.toISOString().split('T')[0];
            
            // Map categories to search queries
            const searchQueries = {
                'tech': 'technology OR software OR AI OR startup',
                'technology': 'technology OR software OR AI OR startup',
                'business': 'business OR economy OR market OR finance',
                'world': 'international OR global OR world',
                'science': 'science OR research OR discovery OR innovation',
                'all': 'news'
            };
            
            const query = searchQueries[category] || searchQueries['all'];
            const url = `${this.apis.gnews.baseUrl}/search?q=${encodeURIComponent(query)}&lang=en&from=${from}&to=${to}&max=10&apikey=${this.apis.gnews.apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const news = data.articles.map(item => this.normalizeGNews(item, category));
            
            this.setCache(cacheKey, news);
            return news;
        } catch (error) {
            console.error('❌ GNews API error:', error);
            return [];
        }
    }

    /**
     * Fetch from MarketAux API (with sentiment)
     */
    async fetchMarketAux(category = 'crypto') {
        if (!this.apis.marketaux.apiKey) return [];
        
        const cacheKey = `marketaux_${category}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            const url = `${this.apis.marketaux.baseUrl}/news/all?filter_entities=true&language=en&api_token=${this.apis.marketaux.apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const news = data.data.map(item => this.normalizeMarketAux(item));
            
            this.setCache(cacheKey, news);
            return news;
        } catch (error) {
            console.error('❌ MarketAux API error:', error);
            return [];
        }
    }

    /**
     * Fetch from Currents API
     */
    async fetchCurrents(category = 'technology') {
        if (!this.apis.currents.apiKey) return [];
        
        const cacheKey = `currents_${category}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            const categoryParam = category === 'all' ? '' : `&category=${category}`;
            const url = `${this.apis.currents.baseUrl}/latest-news?language=en${categoryParam}&apiKey=${this.apis.currents.apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            const news = data.news.map(item => this.normalizeCurrents(item));
            
            this.setCache(cacheKey, news);
            return news;
        } catch (error) {
            console.error('❌ Currents API error:', error);
            return [];
        }
    }

    /**
     * Normalize CryptoCompare format
     */
    normalizeCryptoCompare(item) {
        // Build comprehensive categories array
        const cats = new Set();
        
        // Always add crypto-related
        cats.add('crypto');
        cats.add('cryptocurrency');
        
        // Add from categories field - clean up the messy format
        if (item.categories) {
            const catArray = item.categories.split('|')
                .map(c => c.toLowerCase().trim())
                .filter(c => {
                    // Filter out stock tickers and irrelevant categories
                    // Keep only meaningful categories
                    const validCategories = ['btc', 'eth', 'blockchain', 'defi', 'nft', 'trading', 
                                            'market', 'news', 'regulation', 'business', 'technology',
                                            'mining', 'wallet', 'exchange', 'altcoin', 'bitcoin', 'ethereum'];
                    return c.length > 2 && (validCategories.includes(c) || c.includes('coin'));
                });
            catArray.forEach(c => cats.add(c));
        }
        
        // Add tech if it's about technology/innovation
        const combined = (item.title + ' ' + item.body).toLowerCase();
        if (combined.includes('technology') || combined.includes('innovation') || combined.includes('software')) {
            cats.add('tech');
        }
        
        // Add from tags
        if (item.tags) {
            const tagArray = item.tags.split(',').map(t => t.toLowerCase().trim());
            tagArray.forEach(t => cats.add(t));
        }
        
        return {
            id: `cc_${item.id}`,
            title: item.title,
            description: item.body,
            content: item.body,
            url: item.url,
            imageUrl: item.imageurl,
            published_on: item.published_on,
            source: item.source || 'CryptoCompare',
            categories: Array.from(cats),
            tags: (item.tags || '').split(',').map(t => t.toLowerCase().trim()),
            sentiment: this.detectSentiment(item.title + ' ' + item.body),
            apiSource: 'cryptocompare'
        };
    }

    /**
     * Normalize Spaceflight format
     */
    normalizeSpaceflight(item) {
        return {
            id: `sf_${item.id}`,
            title: item.title,
            description: item.summary,
            content: item.summary,
            url: item.url,
            imageUrl: item.image_url,
            published_on: Math.floor(new Date(item.published_at).getTime() / 1000),
            source: item.news_site || 'Spaceflight News',
            categories: ['space', 'rockets', 'science'],
            tags: ['space', 'rockets', 'spacex', 'nasa'],
            sentiment: 'neutral',
            apiSource: 'spaceflight'
        };
    }

    /**
     * Normalize GNews format
     */
    normalizeGNews(item, searchCategory = 'general') {
        const tags = this.extractTags(item.title + ' ' + item.description);
        
        // Build comprehensive categories array based on search category AND content
        const categories = [];
        
        // Add search category
        if (searchCategory === 'tech' || searchCategory === 'technology') {
            categories.push('tech', 'technology');
        } else if (searchCategory === 'business') {
            categories.push('business');
        } else if (searchCategory === 'science') {
            categories.push('science');
        } else if (searchCategory === 'world') {
            categories.push('world', 'general');
        }
        
        // Auto-detect additional categories from content
        const lowerTitle = item.title.toLowerCase();
        const lowerDesc = (item.description || '').toLowerCase();
        const combined = lowerTitle + ' ' + lowerDesc;
        
        // AI detection
        if (combined.includes('ai ') || combined.includes('artificial intelligence') || 
            combined.includes('machine learning') || combined.includes('chatgpt') || 
            combined.includes('openai') || tags.includes('ai')) {
            categories.push('ai', 'tech');
        }
        
        // Crypto detection
        if (combined.includes('crypto') || combined.includes('bitcoin') || 
            combined.includes('ethereum') || combined.includes('blockchain') ||
            tags.includes('crypto') || tags.includes('bitcoin')) {
            categories.push('crypto');
        }
        
        // Space detection
        if (combined.includes('spacex') || combined.includes('nasa') || 
            combined.includes('rocket') || combined.includes('space') ||
            tags.includes('spacex') || tags.includes('nasa')) {
            categories.push('space');
        }
        
        // Science detection
        if (combined.includes('research') || combined.includes('discovery') ||
            combined.includes('scientist') || combined.includes('study shows')) {
            categories.push('science');
        }
        
        return {
            id: `gn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            description: item.description,
            content: item.content,
            url: item.url,
            imageUrl: item.image,
            published_on: Math.floor(new Date(item.publishedAt).getTime() / 1000),
            source: item.source.name,
            categories: [...new Set(categories)], // Remove duplicates
            tags: tags,
            sentiment: this.detectSentiment(item.title),
            apiSource: 'gnews'
        };
    }

    /**
     * Normalize MarketAux format (with sentiment)
     */
    normalizeMarketAux(item) {
        return {
            id: `ma_${item.uuid}`,
            title: item.title,
            description: item.description,
            content: item.description,
            url: item.url,
            imageUrl: item.image_url,
            published_on: Math.floor(new Date(item.published_at).getTime() / 1000),
            source: item.source,
            categories: item.entities?.map(e => e.type.toLowerCase()) || ['market'],
            tags: item.entities?.map(e => e.symbol.toLowerCase()) || [],
            sentiment: item.sentiment || this.detectSentiment(item.title),
            apiSource: 'marketaux'
        };
    }

    /**
     * Normalize Currents format
     */
    normalizeCurrents(item) {
        return {
            id: `cu_${item.id}`,
            title: item.title,
            description: item.description,
            content: item.description,
            url: item.url,
            imageUrl: item.image,
            published_on: Math.floor(new Date(item.published).getTime() / 1000),
            source: item.author || 'Currents',
            categories: item.category || ['general'],
            tags: this.extractTags(item.title),
            sentiment: this.detectSentiment(item.title),
            apiSource: 'currents'
        };
    }

    /**
     * Simple sentiment detection
     */
    detectSentiment(text) {
        const lower = text.toLowerCase();
        
        const bullishWords = ['surge', 'rally', 'jump', 'soar', 'bullish', 'gains', 'record', 'high', 'boom', 'growth', 'success', 'win', 'breakthrough', 'milestone'];
        const bearishWords = ['crash', 'fall', 'drop', 'plunge', 'bearish', 'losses', 'decline', 'down', 'crisis', 'fail', 'collapse', 'warning', 'concern'];
        
        const bullishCount = bullishWords.filter(word => lower.includes(word)).length;
        const bearishCount = bearishWords.filter(word => lower.includes(word)).length;
        
        if (bullishCount > bearishCount) return 'bullish';
        if (bearishCount > bullishCount) return 'bearish';
        return 'neutral';
    }

    /**
     * Extract tags from text
     */
    extractTags(text) {
        const commonTags = ['bitcoin', 'ethereum', 'btc', 'eth', 'crypto', 'defi', 'nft', 'ai', 'tech', 'spacex', 'tesla', 'apple', 'google', 'meta'];
        const lower = text.toLowerCase();
        return commonTags.filter(tag => lower.includes(tag));
    }

    /**
     * Cache management
     */
    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Enable/disable specific API
     */
    toggleAPI(apiName, enabled, apiKey = null) {
        if (this.apis[apiName]) {
            this.apis[apiName].enabled = enabled;
            if (apiKey) {
                this.apis[apiName].apiKey = apiKey;
            }
        }
    }

    /**
     * Get trending topics across all news
     */
    getTrendingTopics(newsArray) {
        const tagCount = new Map();
        
        newsArray.forEach(news => {
            news.tags.forEach(tag => {
                tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
            });
        });
        
        // Sort by count and get top 10
        return Array.from(tagCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));
    }

    /**
     * Filter news by multiple categories
     */
    filterByCategories(newsArray, categories) {
        if (!categories || categories.length === 0 || categories.includes('all')) {
            console.log('📂 Filter: Showing ALL news');
            return newsArray;
        }
        
        console.log(`📂 Filtering by categories: ${categories.join(', ')}`);
        
        let matchCount = 0;
        const filtered = newsArray.filter(news => {
            // Ensure categories and tags are arrays
            const newsCategories = Array.isArray(news.categories) ? news.categories : [];
            const newsTags = Array.isArray(news.tags) ? news.tags : [];
            
            // Check if any selected category matches
            const matches = categories.some(cat => {
                const catLower = cat.toLowerCase();
                const categoryMatch = newsCategories.some(c => c.toLowerCase().includes(catLower));
                const tagMatch = newsTags.some(t => t.toLowerCase().includes(catLower));
                return categoryMatch || tagMatch;
            });
            
            // Debug: log first few matches
            if (matches && matchCount < 3) {
                console.log(`✅ Match found: "${news.title.substring(0, 50)}..." - Categories: [${newsCategories.join(', ')}]`);
                matchCount++;
            }
            
            return matches;
        });
        
        console.log(`📊 Filter result: ${filtered.length} articles match [${categories.join(', ')}]`);
        return filtered;
    }

    /**
     * Search news by keyword
     */
    searchNews(newsArray, keyword) {
        if (!keyword) return newsArray;
        
        const lower = keyword.toLowerCase();
        return newsArray.filter(news => {
            return news.title.toLowerCase().includes(lower) ||
                   news.description.toLowerCase().includes(lower) ||
                   news.tags.some(tag => tag.includes(lower));
        });
    }
}

// Export singleton instance
const newsAPIManager = new NewsAPIManager();
window.newsAPIManager = newsAPIManager;

console.log('✅ News API Manager Loaded');
