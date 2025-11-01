// Crypto Market UI - consume crypto-data provider and render the section
// Non-breaking: keeps existing crypto.js features intact

import cryptoData from './crypto-data.js';

// ---------- Utils ----------
const nfUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const nfNumber = new Intl.NumberFormat('en-US');

function fmtMoney(n) {
  if (n === null || n === undefined) return '--';
  try { return nfUSD.format(n); } catch { return `$${Number(n).toLocaleString()}`; }
}

function fmtPct(n, withSign = true) {
  if (n === null || n === undefined || isNaN(n)) return '--';
  const s = Number(n).toFixed(2);
  return (withSign && n > 0 ? '+' : '') + s + '%';
}

function pctColor(n) {
  if (n === null || n === undefined || isNaN(n)) return 'text-white text-opacity-70';
  return n >= 0 ? 'text-green-400' : 'text-red-400';
}

function sparklineSVG(points = [], { width = 120, height = 36, stroke = '#60a5fa' } = {}) {
  if (!Array.isArray(points) || points.length < 2) {
    return `<svg width="${width}" height="${height}"><line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="${stroke}" stroke-width="2" opacity="0.3"/></svg>`;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);
  const toY = v => height - ((v - min) / span) * height;
  const d = points.map((v, i) => `${i * stepX},${toY(v)}`).join(' ');
  return `
  <svg width="${width}" height="${height}">
    <polyline points="${d}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

// ---------- Renderers ----------
async function renderOverview() {
  // Show fallback data IMMEDIATELY (no waiting for API)
  const capEl = document.getElementById('global-market-cap');
  const volEl = document.getElementById('global-volume');
  const domEl = document.getElementById('global-btc-dominance');
  
  if (capEl) capEl.textContent = '$2.5T';
  if (volEl) volEl.textContent = '$85.3B';
  if (domEl) domEl.textContent = '54.2%';
  
  // Try to update with real data in background
  try {
    const data = await Promise.race([
      cryptoData.getGlobal(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    if (capEl) capEl.textContent = fmtMoney(data.market_cap_usd);
    if (volEl) volEl.textContent = fmtMoney(data.volume_24h_usd);
    if (domEl) domEl.textContent = data.btc_dominance != null ? `${data.btc_dominance.toFixed(1)}%` : '54.2%';
  } catch (e) {
    console.warn('overview using fallback (API slow/failed)', e.message);
  }
}

async function renderFearGreed() {
  // Show fallback data IMMEDIATELY
  const valEl = document.getElementById('fear-greed-value');
  const lblEl = document.getElementById('fear-greed-label');
  const badge = document.getElementById('fear-greed-badge');
  
  if (valEl) valEl.textContent = '52';
  if (lblEl) lblEl.textContent = 'Neutral';
  if (badge) badge.textContent = '😐';
  
  // Try to update with real data in background
  try {
    const data = await Promise.race([
      cryptoData.getFearGreed(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    if (!data) return;
    const value = data.value;
    if (valEl) valEl.textContent = value;
    if (lblEl) lblEl.textContent = data.value_classification || 'Neutral';
    if (badge) badge.textContent = value <= 25 ? '😱' : value <= 45 ? '😟' : value <= 55 ? '😐' : value <= 75 ? '🤑' : '🚀';
  } catch (e) {
    console.warn('fear&greed using fallback (API slow/failed)', e.message);
  }
}

async function renderFees() {
  // Show fallback data IMMEDIATELY
  const f = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  f('fee-fast','12'); 
  f('fee-30m','8'); 
  f('fee-1h','5'); 
  f('fee-min','3');
  
  // Try to update with real data in background
  try {
    const data = await Promise.race([
      cryptoData.getBtcFees(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    if (!data) return;
    f('fee-fast', data.fastestFee);
    f('fee-30m', data.halfHourFee);
    f('fee-1h', data.hourFee);
    f('fee-min', data.minimumFee);
  } catch (e) {
    console.warn('fees using fallback (API slow/failed)', e.message);
  }
}

async function renderWatchlist() {
  const el = document.getElementById('crypto-watchlist');
  if (!el) return;
  
  // Show fallback data IMMEDIATELY
  const mockData = [
    { name: 'Bitcoin', symbol: 'BTC', price: 68500, change: 2.4, emoji: '₿', color: '#F7931A' },
    { name: 'Ethereum', symbol: 'ETH', price: 3450, change: 1.8, emoji: 'Ξ', color: '#627EEA' },
    { name: 'Solana', symbol: 'SOL', price: 175, change: -0.5, emoji: '◎', color: '#14F195' },
    { name: 'BNB', symbol: 'BNB', price: 595, change: 0.9, emoji: 'B', color: '#F3BA2F' },
    { name: 'Cardano', symbol: 'ADA', price: 0.65, change: -1.2, emoji: '₳', color: '#0033AD' }
  ];
  
  el.innerHTML = mockData.map(m => {
    const color = m.change >= 0 ? 'text-green-400' : 'text-red-400';
    return `
      <div class="flex items-center justify-between bg-white bg-opacity-10 rounded-xl p-3">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white font-bold text-lg" style="background: ${m.color}">
            ${m.emoji}
          </div>
          <div>
            <div class="text-white font-semibold">${m.name}</div>
            <div class="text-white text-opacity-60 text-xs">${m.symbol}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-white font-semibold">$${m.price.toLocaleString()}</div>
          <div class="${color} text-sm">${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%</div>
        </div>
      </div>`;
  }).join('');
  
  // Try to update with real data in background
  try {
    const ids = ['bitcoin','ethereum','solana','binancecoin','cardano'];
    const markets = await Promise.race([
      cryptoData.getMarkets({ ids, vs: 'usd', perPage: ids.length, sparkline: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    el.innerHTML = markets.map(m => {
      const change = m.price_change_percentage_24h;
      const color = change >= 0 ? 'text-green-400' : 'text-red-400';
      const stroke = change >= 0 ? '#34d399' : '#f87171';
      return `
        <div class="flex items-center justify-between bg-white bg-opacity-10 rounded-xl p-3">
          <div class="flex items-center">
            <img src="${m.image}" alt="${m.symbol}" class="w-8 h-8 rounded-full object-cover mr-3" onerror="this.style.display='none'">
            <div>
              <div class="text-white font-semibold">${m.name}</div>
              <div class="text-white text-opacity-60 text-xs">${m.symbol}</div>
            </div>
          </div>
          <div class="hidden md:block">${sparklineSVG(m.sparkline_in_7d || [], { stroke })}</div>
          <div class="text-right">
            <div class="text-white font-semibold">${fmtMoney(m.current_price)}</div>
            <div class="${color} text-sm">${fmtPct(change)}</div>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    console.warn('watchlist using fallback (API slow/failed)', e.message);
  }
}

async function renderTopMovers() {
  const gainEl = document.getElementById('crypto-top-gainers');
  const loseEl = document.getElementById('crypto-top-losers');
  if (!gainEl || !loseEl) return;
  
  // Show fallback data IMMEDIATELY
  const mockGainers = [
    { name: 'Pepe', symbol: 'PEPE', change: 45.2, color: '#00FF00' },
    { name: 'Dogecoin', symbol: 'DOGE', change: 28.5, color: '#C3A634' },
    { name: 'Shiba Inu', symbol: 'SHIB', change: 18.9, color: '#FFA409' },
    { name: 'Floki', symbol: 'FLOKI', change: 15.4, color: '#FF6B00' },
    { name: 'Bonk', symbol: 'BONK', change: 12.1, color: '#FF4500' }
  ];
  const mockLosers = [
    { name: 'Terra Classic', symbol: 'LUNC', change: -15.8, color: '#FF0000' },
    { name: 'Aptos', symbol: 'APT', change: -8.4, color: '#FF6666' },
    { name: 'Sui', symbol: 'SUI', change: -6.2, color: '#FF8888' },
    { name: 'Arbitrum', symbol: 'ARB', change: -5.1, color: '#FFAAAA' },
    { name: 'Optimism', symbol: 'OP', change: -4.3, color: '#FFCCCC' }
  ];
  
  const item = (m) => `
    <div class="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-2">
      <div class="flex items-center">
        <div class="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white font-bold" style="background: ${m.color || '#666'}">
          ${m.symbol[0]}
        </div>
        <span class="text-white text-sm">${m.name} <span class="text-white text-opacity-60">(${m.symbol})</span></span>
      </div>
      <span class="${m.change >= 0 ? 'text-green-400' : 'text-red-400'} text-sm">${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%</span>
    </div>`;
  
  gainEl.innerHTML = mockGainers.map(item).join('');
  loseEl.innerHTML = mockLosers.map(item).join('');
  
  // Try to update with real data in background
  try {
    const markets = await Promise.race([
      cryptoData.getMarkets({ perPage: 100, sparkline: false }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    const arr = markets.filter(m => typeof m.price_change_percentage_24h === 'number');
    const gainers = [...arr].sort((a,b)=>b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0,5);
    const losers = [...arr].sort((a,b)=>a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0,5);

    const realItem = (m) => `
      <div class="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-2">
        <div class="flex items-center">
          <img src="${m.image}" class="w-6 h-6 rounded-full object-cover mr-2" onerror="this.style.display='none'">
          <span class="text-white text-sm">${m.name} <span class="text-white text-opacity-60">(${m.symbol})</span></span>
        </div>
        <span class="${pctColor(m.price_change_percentage_24h)} text-sm">${fmtPct(m.price_change_percentage_24h)}</span>
      </div>`;

    gainEl.innerHTML = gainers.map(realItem).join('');
    loseEl.innerHTML = losers.map(realItem).join('');
  } catch (e) {
    console.warn('top movers using fallback (API slow/failed)', e.message);
  }
}

async function renderTrending() {
  const el = document.getElementById('crypto-trending');
  if (!el) return;
  try {
    const list = await cryptoData.getTrending();
    el.innerHTML = list.map(c => `
      <span class="px-2 py-1 rounded-full bg-white bg-opacity-10 text-white text-sm">
        ${c.name} <span class="text-white text-opacity-60">(${c.symbol})</span>
      </span>`).join('');
  } catch (e) {
    console.warn('trending error', e);
  }
}

async function renderExchanges() {
  const el = document.getElementById('crypto-exchanges');
  if (!el) return;
  try {
    const list = await cryptoData.getExchanges({ perPage: 6 });
    el.innerHTML = list.map(ex => `
      <a href="${ex.url}" target="_blank" rel="noopener" class="flex items-center space-x-3 bg-white bg-opacity-10 rounded-lg p-2 hover:bg-opacity-20 transition">
        <img src="${ex.image}" class="w-8 h-8 rounded-full" onerror="this.style.display='none'"/>
        <div class="flex-1">
          <div class="text-white text-sm font-medium">${ex.name}</div>
          <div class="text-white text-opacity-60 text-xs">Rank ${ex.trust_score_rank ?? '-'}</div>
        </div>
      </a>`).join('');
  } catch (e) {
    console.warn('exchanges error', e);
  }
}

// ---------- Init / visibility handling ----------
let initialized = false;
let intervals = [];

function clearIntervals() {
  intervals.forEach(id => clearInterval(id));
  intervals = [];
}

async function initRender() {
  if (initialized) return;
  initialized = true;
  // Stagger requests to avoid 429 and CORS proxy limits
  const pause = (ms) => new Promise(r => setTimeout(r, ms));
  await renderOverview();
  await pause(250);
  await renderFearGreed();
  await pause(250);
  await renderFees();
  await pause(300);
  await renderWatchlist();
  await pause(300);
  await renderTopMovers();
  await pause(300);
  await renderTrending();
  await pause(300);
  await renderExchanges();

  // Refresh cycles
  intervals.push(setInterval(renderOverview, 120_000));
  intervals.push(setInterval(renderFees, 120_000));
  intervals.push(setInterval(renderWatchlist, 120_000));
  intervals.push(setInterval(renderTopMovers, 180_000));
  intervals.push(setInterval(renderTrending, 5 * 60_000));
  intervals.push(setInterval(renderExchanges, 5 * 60_000));
}

function onVisible(el, cb) {
  if (!el) return;
  if (!el.classList.contains('hidden')) { cb(); return; }
  const ob = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.attributeName === 'class' && !el.classList.contains('hidden')) {
        ob.disconnect();
        cb();
        break;
      }
    }
  });
  ob.observe(el, { attributes: true });
}

document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('crypto-section');
  if (!section) return;
  onVisible(section, initRender);
});

// Optional global for manual refresh in console
if (typeof window !== 'undefined') {
  window._cryptoUiRefresh = () => { clearIntervals(); initialized = false; initRender(); };
}

