// lib/finnhub.js – Finnhub API helper functions

const BASE = 'https://finnhub.io/api/v1'

/**
 * Fetch current quote for a symbol
 * Returns: { c, d, dp, h, l, o, pc, t }
 *   c=current, d=change, dp=change%, h=high, l=low, o=open, pc=prev close
 */
export async function fetchQuote(symbol) {
  const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_API_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Finnhub quote error: ${res.status}`)
  return res.json()
}

/**
 * Fetch OHLCV candle data for the last N days
 * Returns: { c[], h[], l[], o[], s, t[], v[] }
 */
export async function fetchCandles(symbol, days = 30, resolution = 'D') {
  const to = Math.floor(Date.now() / 1000)
  const from = to - days * 24 * 60 * 60
  const url = `${BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Finnhub candles error: ${res.status}`)
  return res.json()
}

/**
 * Search for ticker symbols
 * Returns: { count, result: [{ description, displaySymbol, symbol, type }] }
 */
export async function searchTicker(query) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&token=${process.env.FINNHUB_API_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Finnhub search error: ${res.status}`)
  return res.json()
}

/**
 * Fetch company profile
 * Returns: { country, currency, exchange, ipo, logo, marketCapitalization, name, ... }
 */
export async function fetchProfile(symbol) {
  const url = `${BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_API_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Finnhub profile error: ${res.status}`)
  return res.json()
}

/**
 * Fetch company news
 * Returns: [{ category, datetime, headline, id, image, source, summary, url }]
 */
export async function fetchNews(symbol) {
  const to = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const url = `${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Finnhub news error: ${res.status}`)
  return res.json()
}

/**
 * Fetch basic financials (52-week high/low, etc.)
 */
export async function fetchBasicFinancials(symbol) {
  const url = `${BASE}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${process.env.FINNHUB_API_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Finnhub financials error: ${res.status}`)
  return res.json()
}
