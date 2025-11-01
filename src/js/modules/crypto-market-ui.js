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
  try {
    const data = await cryptoData.getGlobal();
    const capEl = document.getElementById('global-market-cap');
    const volEl = document.getElementById('global-volume');
    const domEl = document.getElementById('global-btc-dominance');
    if (capEl) capEl.textContent = fmtMoney(data.market_cap_usd);
    if (volEl) volEl.textContent = fmtMoney(data.volume_24h_usd);
    if (domEl) domEl.textContent = data.btc_dominance != null ? `${data.btc_dominance.toFixed(1)}%` : '--';
  } catch (e) {
    console.warn('overview error', e);
  }
}

async function renderFearGreed() {
  try {
    const data = await cryptoData.getFearGreed();
    const valEl = document.getElementById('fear-greed-value');
    const lblEl = document.getElementById('fear-greed-label');
    const badge = document.getElementById('fear-greed-badge');
    if (!data) {
      if (valEl) valEl.textContent = '--';
      if (lblEl) lblEl.textContent = 'Sin datos';
      if (badge) badge.textContent = '--';
      return;
    }
    const value = data.value;
    if (valEl) valEl.textContent = value;
    if (lblEl) lblEl.textContent = data.value_classification || '';
    if (badge) badge.textContent = value <= 25 ? '😱' : value <= 45 ? '😟' : value <= 55 ? '😐' : value <= 75 ? '🤑' : '🚀';
  } catch (e) {
    console.warn('fear&greed error', e);
  }
}

async function renderFees() {
  try {
    const data = await cryptoData.getBtcFees();
    const f = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v ?? '--'; };
    if (!data) { f('fee-fast','--'); f('fee-30m','--'); f('fee-1h','--'); f('fee-min','--'); return; }
    f('fee-fast', data.fastestFee);
    f('fee-30m', data.halfHourFee);
    f('fee-1h', data.hourFee);
    f('fee-min', data.minimumFee);
  } catch (e) {
    console.warn('fees error', e);
  }
}

async function renderWatchlist() {
  const el = document.getElementById('crypto-watchlist');
  if (!el) return;
  try {
    const ids = ['bitcoin','ethereum','solana','binancecoin','cardano'];
    const markets = await cryptoData.getMarkets({ ids, vs: 'usd', perPage: ids.length, sparkline: true });
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
    console.warn('watchlist error', e);
    el.innerHTML = '<div class="text-center py-4 text-white text-opacity-60">Error al cargar</div>';
  }
}

async function renderTopMovers() {
  const gainEl = document.getElementById('crypto-top-gainers');
  const loseEl = document.getElementById('crypto-top-losers');
  if (!gainEl || !loseEl) return;
  try {
    const markets = await cryptoData.getMarkets({ perPage: 100, sparkline: false });
    const arr = markets.filter(m => typeof m.price_change_percentage_24h === 'number');
    const gainers = [...arr].sort((a,b)=>b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0,5);
    const losers = [...arr].sort((a,b)=>a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0,5);

    const item = (m) => `
      <div class="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-2">
        <div class="flex items-center">
          <img src="${m.image}" class="w-6 h-6 rounded-full object-cover mr-2" onerror="this.style.display='none'">
          <span class="text-white text-sm">${m.name} <span class="text-white text-opacity-60">(${m.symbol})</span></span>
        </div>
        <span class="${pctColor(m.price_change_percentage_24h)} text-sm">${fmtPct(m.price_change_percentage_24h)}</span>
      </div>`;

    gainEl.innerHTML = gainers.map(item).join('');
    loseEl.innerHTML = losers.map(item).join('');
  } catch (e) {
    console.warn('top movers error', e);
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

