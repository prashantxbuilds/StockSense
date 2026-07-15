// lib/utils.js
// Utility helpers for localized currency formatting and symbol mapping.

export const CURRENCY_SYMBOLS = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  HKD: 'HK$',
  SGD: 'S$',
  CHF: 'CHF',
}

export function getCurrencySymbol(currencyCode = 'USD') {
  if (!currencyCode) return '$'
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || '$'
}

export function getCurrencyForSymbol(symbol) {
  if (!symbol) return 'USD'
  const sym = symbol.toUpperCase()
  if (sym.endsWith('.NS') || sym.endsWith('.BO')) return 'INR'
  if (sym.endsWith('.L')) return 'GBP'
  if (sym.endsWith('.TO') || sym.endsWith('.V')) return 'CAD'
  if (sym.endsWith('.AX')) return 'AUD'
  if (sym.endsWith('.HK')) return 'HKD'
  if (sym.endsWith('.SG')) return 'SGD'
  if (
    sym.endsWith('.DE') ||
    sym.endsWith('.PA') ||
    sym.endsWith('.AS') ||
    sym.endsWith('.MI') ||
    sym.endsWith('.MC') ||
    sym.endsWith('.CO') ||
    sym.endsWith('.LS') ||
    sym.endsWith('.AT') ||
    sym.endsWith('.BR')
  ) {
    return 'EUR'
  }
  return 'USD'
}

export function formatCurrency(value, currencyCode = 'USD', decimals = 2) {
  if (value === undefined || value === null || isNaN(value)) return '—'
  const symbol = getCurrencySymbol(currencyCode)
  const val = Number(value)
  const sign = val < 0 ? '-' : ''
  return `${sign}${symbol}${Math.abs(val).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function formatShortCurrency(value, currencyCode = 'USD') {
  if (value === undefined || value === null || isNaN(value)) return '—'
  const symbol = getCurrencySymbol(currencyCode)
  const val = Number(value)
  const sign = val < 0 ? '-' : ''
  const absVal = Math.abs(val)
  if (absVal >= 1e6) return `${sign}${symbol}${(absVal / 1e6).toFixed(2)}T`
  if (absVal >= 1e3) return `${sign}${symbol}${(absVal / 1e3).toFixed(2)}B`
  return `${sign}${symbol}${absVal.toFixed(2)}M`
}
export const TICKER_DOMAINS = {
  AAPL: 'apple.com',
  TSLA: 'tesla.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  MSFT: 'microsoft.com',
  AMZN: 'amazon.com',
  NVDA: 'nvidia.com',
  META: 'meta.com',
  NFLX: 'netflix.com',
  AMD: 'amd.com',
  INTC: 'intel.com',
  RELIANCE: 'ril.com',
  'RELIANCE.NS': 'ril.com',
  'HDFCBANK.NS': 'hdfcbank.com',
  'TCS.NS': 'tcs.com',
  'INFY.NS': 'infosys.com',
}

export function getLogoForStock(symbol, profile) {
  if (profile?.logo) return profile.logo

  const sym = symbol?.toUpperCase() || ''

  // Try extracting from weburl/website
  const weburl = profile?.weburl || profile?.website
  if (weburl) {
    try {
      const domain = new URL(weburl).hostname.replace(/^www\./, '')
      if (domain) return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
    } catch (_) {}
  }

  // Try mapping common tickers
  const cleanSym = sym.replace('.NS', '').replace('.BO', '')
  const domain = TICKER_DOMAINS[sym] || TICKER_DOMAINS[cleanSym]
  if (domain) {
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
  }

  // Try fallback directly using symbol + ".com" for US stocks as a guess
  if (sym && !sym.includes('.')) {
    return `https://www.google.com/s2/favicons?sz=128&domain=${sym.toLowerCase()}.com`
  }

  return null
}
