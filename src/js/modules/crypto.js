// Crypto Functions
let currentCrypto = 'BTC';
let currentTimeframe = '1D';
let cryptoChart = null;

const cryptoData = {
    'BTC': {
        name: 'Bitcoin',
        symbol: 'BTC',
        icon: 'fab fa-bitcoin',
        iconBg: 'bg-yellow-500',
        price: 43250.12,
        change: 2.45,
        high24h: 44123.45,
        low24h: 42567.89,
        volume24h: '28.5B',
        marketCap: '847.2B'
    },
    'ETH': {
        name: 'Ethereum',
        symbol: 'ETH',
        icon: 'fab fa-ethereum',
        iconBg: 'bg-blue-500',
        price: 2890.45,
        change: -1.23,
        high24h: 2945.67,
        low24h: 2834.12,
        volume24h: '15.2B',
        marketCap: '347.8B'
    },
    'BNB': {
        name: 'BNB',
        symbol: 'BNB',
        icon: 'BNB',
        iconBg: 'bg-yellow-600',
        price: 315.67,
        change: 4.12,
        high24h: 325.89,
        low24h: 308.45,
        volume24h: '2.1B',
        marketCap: '48.7B'
    },
    'ADA': {
        name: 'Cardano',
        symbol: 'ADA',
        icon: 'ADA',
        iconBg: 'bg-blue-600',
        price: 0.4523,
        change: 6.78,
        high24h: 0.4689,
        low24h: 0.4234,
        volume24h: '890M',
        marketCap: '15.9B'
    },
    'SOL': {
        name: 'Solana',
        symbol: 'SOL',
        icon: 'SOL',
        iconBg: 'bg-purple-600',
        price: 98.34,
        change: -3.45,
        high24h: 102.67,
        low24h: 95.23,
        volume24h: '1.8B',
        marketCap: '42.3B'
    }
};

function updateCryptoPrices() {
    Object.keys(cryptoData).forEach(symbol => {
        const crypto = cryptoData[symbol];
        // Simulate price fluctuation
        const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% max
        crypto.price = crypto.price * (1 + fluctuation);
        crypto.change = crypto.change + (Math.random() - 0.5) * 0.5;
        
        // Update UI
        const priceElement = document.getElementById(`${symbol.toLowerCase()}-price`);
        const changeElement = document.getElementById(`${symbol.toLowerCase()}-change`);
        
        if (priceElement) {
            priceElement.textContent = `$${crypto.price.toFixed(crypto.price < 1 ? 4 : 2)}`;
        }
        
        if (changeElement) {
            const changeText = `${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}%`;
            changeElement.textContent = changeText;
            changeElement.className = crypto.change >= 0 ? 'text-green-400 text-sm' : 'text-red-400 text-sm';
        }
    });
}

function updateFearGreedIndex() {
    const value = Math.floor(Math.random() * 100);
    const valueElement = document.getElementById('fear-greed-value');
    const labelElement = document.getElementById('fear-greed-label');
    const arcElement = document.getElementById('fear-greed-arc');
    
    if (valueElement) valueElement.textContent = value;
    
    let label, color;
    if (value <= 25) {
        label = 'Miedo Extremo';
        color = 'text-red-500';
    } else if (value <= 45) {
        label = 'Miedo';
        color = 'text-orange-500';
    } else if (value <= 55) {
        label = 'Neutral';
        color = 'text-yellow-400';
    } else if (value <= 75) {
        label = 'Codicia';
        color = 'text-green-400';
    } else {
        label = 'Codicia Extrema';
        color = 'text-green-500';
    }
    
    if (labelElement) labelElement.textContent = label;
    if (arcElement) {
        arcElement.className = `${color}`;
        arcElement.setAttribute('stroke-dasharray', `${value}, 100`);
    }
}

function showCryptoChart(symbol) {
    currentCrypto = symbol;
    const crypto = cryptoData[symbol];
    
    // Update modal content
    document.getElementById('chart-crypto-name').textContent = crypto.name;
    document.getElementById('chart-crypto-symbol').textContent = crypto.symbol;
    document.getElementById('chart-current-price').textContent = `$${crypto.price.toFixed(crypto.price < 1 ? 4 : 2)}`;
    
    const changeText = `${crypto.change >= 0 ? '+' : ''}${crypto.change.toFixed(2)}% (${crypto.change >= 0 ? '+' : ''}$${Math.abs(crypto.price * crypto.change / 100).toFixed(2)})`;
    document.getElementById('chart-price-change').textContent = changeText;
    document.getElementById('chart-price-change').className = crypto.change >= 0 ? 'text-green-400' : 'text-red-400';
    
    document.getElementById('chart-high-24h').textContent = `$${crypto.high24h.toFixed(crypto.high24h < 1 ? 4 : 2)}`;
    document.getElementById('chart-low-24h').textContent = `$${crypto.low24h.toFixed(crypto.low24h < 1 ? 4 : 2)}`;
    document.getElementById('chart-volume-24h').textContent = `$${crypto.volume24h}`;
    document.getElementById('chart-market-cap').textContent = `$${crypto.marketCap}`;
    
    // Update icon
    const iconElement = document.getElementById('chart-crypto-icon');
    iconElement.className = `w-8 h-8 ${crypto.iconBg} rounded-full flex items-center justify-center mr-3`;
    
    if (crypto.icon.startsWith('fab')) {
        iconElement.innerHTML = `<i class="${crypto.icon} text-white"></i>`;
    } else {
        iconElement.innerHTML = `<span class="text-white font-bold text-sm">${crypto.icon}</span>`;
    }
    
    // Show modal
    document.getElementById('crypto-chart-modal').classList.remove('hidden');
    
    // Initialize chart
    initializeCryptoChart();
}

function hideCryptoChart() {
    document.getElementById('crypto-chart-modal').classList.add('hidden');
    if (cryptoChart) {
        cryptoChart.destroy();
        cryptoChart = null;
    }
}

function changeTimeframe(timeframe) {
    currentTimeframe = timeframe;
    
    // Update button states
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.className = 'timeframe-btn px-3 py-1 rounded-lg text-white text-sm bg-white bg-opacity-20 hover:bg-opacity-30 transition-all';
    });
    
    event.target.className = 'timeframe-btn px-3 py-1 rounded-lg text-white text-sm bg-purple-500 hover:bg-purple-600 transition-all';
    
    // Update chart
    if (cryptoChart) {
        updateChartData();
    }
}

function initializeCryptoChart() {
    const canvas = document.getElementById('crypto-chart');
    const ctx = canvas.getContext('2d');
    
    // Generate sample candlestick data
    const data = generateCandlestickData();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Draw candlestick chart
    drawCandlestickChart(ctx, data, canvas.width, canvas.height);
}

function generateCandlestickData() {
    const crypto = cryptoData[currentCrypto];
    const basePrice = crypto.price;
    const dataPoints = currentTimeframe === '1H' ? 24 : currentTimeframe === '4H' ? 24 : currentTimeframe === '1D' ? 30 : currentTimeframe === '1W' ? 52 : 12;
    
    const data = [];
    let currentPrice = basePrice * 0.95; // Start slightly lower
    
    for (let i = 0; i < dataPoints; i++) {
        const volatility = 0.03; // 3% volatility
        const change = (Math.random() - 0.5) * volatility;
        
        const open = currentPrice;
        const close = open * (1 + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.02);
        const low = Math.min(open, close) * (1 - Math.random() * 0.02);
        
        data.push({ open, high, low, close });
        currentPrice = close;
    }
    
    return data;
}

function drawCandlestickChart(ctx, data, width, height) {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find min and max prices
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    
    data.forEach(candle => {
        minPrice = Math.min(minPrice, candle.low);
        maxPrice = Math.max(maxPrice, candle.high);
    });
    
    const priceRange = maxPrice - minPrice;
    const candleWidth = chartWidth / data.length * 0.8;
    const candleSpacing = chartWidth / data.length;
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
        const x = padding + (chartWidth / 6) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
    }
    
    // Draw candlesticks
    data.forEach((candle, index) => {
        const x = padding + index * candleSpacing + candleSpacing / 2;
        
        const openY = padding + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
        const closeY = padding + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
        const highY = padding + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
        const lowY = padding + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;
        
        const isGreen = candle.close > candle.open;
        
        // Draw wick
        ctx.strokeStyle = isGreen ? '#10B981' : '#EF4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();
        
        // Draw body
        ctx.fillStyle = isGreen ? '#10B981' : '#EF4444';
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(closeY - openY);
        
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, Math.max(bodyHeight, 1));
    });
    
    // Draw price labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
        const price = maxPrice - (priceRange / 5) * i;
        const y = padding + (chartHeight / 5) * i;
        ctx.fillText(`$${price.toFixed(price < 1 ? 4 : 2)}`, padding - 10, y + 4);
    }
}

function updateChartData() {
    if (cryptoChart) {
        initializeCryptoChart();
    }
}
