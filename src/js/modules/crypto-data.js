/**
 * Crypto Data Provider (CoinGecko first, CoinCap fallback)
 * - Pensado para uso directo en el navegador (ESM)
 * - Incluye cache con TTL vía localStorage
 * - Endpoints: mercados, global, trending, exchanges, fear&greed, BTC fees
 */

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const COINCAP_BASE = 'https://api.coincap.io/v2';

// Utilidades ---------------------------------------------------------------
function toQuery(params) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `?${q}` : '';
}

// Proxies para sortear CORS en desarrollo/rate limit (fallbacks)
const CORS_PROXIES = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://cors.isomorphic-git.org/${u}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
];

async function fetchJson(url, { timeoutMs = 12000, headers } = {}) {
  const attempt = async (targetUrl) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(targetUrl, { headers, signal: controller.signal, credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${targetUrl}`);
      return await res.json();
    } finally {
      clearTimeout(id);
    }
  };

  // 1) Intento directo
  try {
    return await attempt(url);
  } catch (e) {
    const msg = String(e?.message || e);
    const shouldProxy = msg.includes('Failed to fetch') || msg.includes('TypeError') || msg.includes('CORS') || msg.includes('HTTP 429');
    if (!shouldProxy) throw e;
  }

  // 2) Reintentos con proxies (ordenados)
  for (const to of CORS_PROXIES) {
    try {
      return await attempt(to(url));
    } catch (e) {
      // continuar con el siguiente proxy
    }
  }

  // 3) Último intento: devolver error para que el caller use cache/stubs
  throw new Error('Network/CORS blocked for: ' + url);
}

// Cache simple en localStorage con TTL ------------------------------------
function cacheKey(key) { return `nitedred_cache_${key}`; }

function getCache(key) {
  try {
    const raw = localStorage.getItem(cacheKey(key));
    if (!raw) return null;
    const { exp, data } = JSON.parse(raw);
    if (exp && Date.now() > exp) return null;
    return data;
  } catch { return null; }
}

function setCache(key, data, ttlMs) {
  try {
    localStorage.setItem(
      cacheKey(key),
      JSON.stringify({ exp: ttlMs ? Date.now() + ttlMs : null, data })
    );
  } catch { /* ignore quota */ }
}

async function withCache(key, ttlMs, loader) {
  const cached = getCache(key);
  if (cached) return cached;
  const fresh = await loader();
  setCache(key, fresh, ttlMs);
  return fresh;
}

// Normalización ------------------------------------------------------------
function normalizeFromCoinGeckoMarket(item) {
  return {
    id: item.id,
    symbol: item.symbol?.toUpperCase() || '',
    name: item.name || '',
    image: item.image || `https://assets.coincap.io/assets/icons/${(item.symbol||'').toLowerCase()}@2x.png`,
    current_price: item.current_price ?? null,
    price_change_percentage_24h: item.price_change_percentage_24h ?? null,
    market_cap: item.market_cap ?? null,
    total_volume: item.total_volume ?? null,
    market_cap_rank: item.market_cap_rank ?? null,
    sparkline_in_7d: item.sparkline_in_7d?.price || null,
  };
}

function normalizeFromCoinCapAsset(item) {
  const symbol = (item.symbol || '').toUpperCase();
  return {
    id: item.id,
    symbol,
    name: item.name || '',
    image: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
    current_price: item.priceUsd ? Number(item.priceUsd) : null,
    price_change_percentage_24h: item.changePercent24Hr ? Number(item.changePercent24Hr) : null,
    market_cap: item.marketCapUsd ? Number(item.marketCapUsd) : null,
    total_volume: item.volumeUsd24Hr ? Number(item.volumeUsd24Hr) : null,
    market_cap_rank: item.rank ? Number(item.rank) : null,
    sparkline_in_7d: null,
  };
}

// Provider: CoinGecko con fallback ----------------------------------------
async function getGlobal({ ttlSec = 60 } = {}) {
  return withCache(`cg_global`, ttlSec * 1000, async () => {
    try {
      const data = await fetchJson(`${COINGECKO_BASE}/global`);
      const d = data?.data || {};
      return {
        market_cap_usd: d.total_market_cap?.usd ?? null,
        volume_24h_usd: d.total_volume?.usd ?? null,
        btc_dominance: d.market_cap_percentage?.btc ?? null,
        active_cryptocurrencies: d.active_cryptocurrencies ?? null,
        markets: d.markets ?? null,
      };
    } catch (e) {
      // Fallback parcial: CoinCap /global no existe, estimar con top assets
      const top = await fetchJson(`${COINCAP_BASE}/assets?limit=50`);
      const arr = top?.data || [];
      const market_cap = arr.reduce((s, a) => s + (Number(a.marketCapUsd)||0), 0);
      const volume = arr.reduce((s, a) => s + (Number(a.volumeUsd24Hr)||0), 0);
      const btc = arr.find(a => a.id === 'bitcoin');
      return {
        market_cap_usd: market_cap || null,
        volume_24h_usd: volume || null,
        btc_dominance: btc && market_cap ? (Number(btc.marketCapUsd) / market_cap) * 100 : null,
        active_cryptocurrencies: null,
        markets: null,
      };
    }
  });
}

async function getMarkets({
  ids = [],
  vs = 'usd',
  perPage = 50,
  page = 1,
  sparkline = true,
  ttlSec = 60,
} = {}) {
  const key = `cg_markets_${vs}_${ids.join(',')}_${perPage}_${page}_${sparkline}`;
  return withCache(key, ttlSec * 1000, async () => {
    try {
      const qs = toQuery({
        vs_currency: vs,
        ids: ids.length ? ids.join(',') : undefined,
        order: 'market_cap_desc',
        per_page: perPage,
        page,
        sparkline: sparkline ? 'true' : 'false',
        price_change_percentage: '24h,7d',
      });
      const data = await fetchJson(`${COINGECKO_BASE}/coins/markets${qs}`);
      return (data || []).map(normalizeFromCoinGeckoMarket);
    } catch (e) {
      // Fallback CoinCap
      const altIds = ids.length ? ids.join(',') : undefined;
      const ccUrl = altIds
        ? `${COINCAP_BASE}/assets?ids=${encodeURIComponent(altIds)}`
        : `${COINCAP_BASE}/assets?limit=${perPage}`;
      const { data } = await fetchJson(ccUrl);
      return (data || []).map(normalizeFromCoinCapAsset);
    }
  });
}

async function getTrending({ ttlSec = 300 } = {}) {
  return withCache('cg_trending', ttlSec * 1000, async () => {
    try {
      const data = await fetchJson(`${COINGECKO_BASE}/search/trending`);
      const coins = data?.coins || [];
      return coins.map(c => ({
        id: c.item?.id,
        name: c.item?.name,
        symbol: c.item?.symbol,
        market_cap_rank: c.item?.market_cap_rank,
        score: c.item?.score,
        thumb: c.item?.thumb,
        small: c.item?.small,
      }));
    } catch (e) {
      // Fallback simple: usar top de CoinCap
      const { data } = await fetchJson(`${COINCAP_BASE}/assets?limit=10`);
      return (data || []).map((a, i) => ({
        id: a.id,
        name: a.name,
        symbol: a.symbol,
        market_cap_rank: Number(a.rank) || i + 1,
        score: i,
        thumb: `https://assets.coincap.io/assets/icons/${a.symbol.toLowerCase()}@2x.png`,
        small: `https://assets.coincap.io/assets/icons/${a.symbol.toLowerCase()}@2x.png`,
      }));
    }
  });
}

async function getExchanges({ perPage = 10, page = 1, ttlSec = 300 } = {}) {
  const key = `cg_exchanges_${perPage}_${page}`;
  return withCache(key, ttlSec * 1000, async () => {
    try {
      const qs = toQuery({ per_page: perPage, page });
      const data = await fetchJson(`${COINGECKO_BASE}/exchanges${qs}`);
      return (data || []).map(ex => ({
        id: ex.id,
        name: ex.name,
        year_established: ex.year_established,
        country: ex.country,
        url: ex.url,
        image: ex.image,
        trust_score_rank: ex.trust_score_rank,
        trade_volume_24h_btc: ex.trade_volume_24h_btc,
      }));
    } catch (e) {
      // Sin buen fallback público; devolver array vacío
      return [];
    }
  });
}

async function getFearGreed({ ttlSec = 15 * 60 } = {}) {
  return withCache('alt_fng', ttlSec * 1000, async () => {
    try {
      const data = await fetchJson('https://api.alternative.me/fng/?limit=1');
      const item = data?.data?.[0];
      return item ? { value: Number(item.value), value_classification: item.value_classification, timestamp: Number(item.timestamp) * 1000 } : null;
    } catch (e) {
      return null;
    }
  });
}

async function getBtcFees({ ttlSec = 30 } = {}) {
  return withCache('mempool_fees', ttlSec * 1000, async () => {
    try {
      const data = await fetchJson('https://mempool.space/api/v1/fees/recommended');
      return {
        fastestFee: data.fastestFee,
        halfHourFee: data.halfHourFee,
        hourFee: data.hourFee,
        minimumFee: data.minimumFee,
      };
    } catch (e) {
      return null;
    }
  });
}

async function getSimplePrices({ ids = [], vs = 'usd', include24hChange = true, ttlSec = 60 } = {}) {
  const key = `cg_simple_${vs}_${ids.join(',')}_${include24hChange}`;
  return withCache(key, ttlSec * 1000, async () => {
    try {
      const qs = toQuery({ ids: ids.join(','), vs_currencies: vs, include_24hr_change: include24hChange });
      const data = await fetchJson(`${COINGECKO_BASE}/simple/price${qs}`);
      return data || {};
    } catch (e) {
      // Fallback: CoinCap por asset
      const map = {};
      if (!ids.length) return map;
      const { data } = await fetchJson(`${COINCAP_BASE}/assets?ids=${encodeURIComponent(ids.join(','))}`);
      (data || []).forEach(a => {
        map[a.id] = {};
        map[a.id][vs] = a.priceUsd ? Number(a.priceUsd) : null;
      });
      return map;
    }
  });
}

export const cryptoData = {
  getGlobal,
  getMarkets,
  getTrending,
  getExchanges,
  getFearGreed,
  getBtcFees,
  getSimplePrices,
};

// Exponer de forma opcional para pruebas manuales desde consola
if (typeof window !== 'undefined') {
  window.cryptoData = cryptoData;
}

export default cryptoData;

