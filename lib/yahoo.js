// lib/yahoo.js
// Yahoo Finance API wrapper using yahoo-finance2 package.
// Fully handles cookie/crumb extraction and handles multi-currency and fallback paths.

import YahooFinance from 'yahoo-finance2'
const yahooFinance = new YahooFinance()

function getLogoFromUrl(url) {
  if (!url) return null
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '')
    return `https://logo.clearbit.com/${domain}`
  } catch (_) {
    return null
  }
}

function guessCurrency(symbol) {
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

/**
 * Fetch current quote from Yahoo Finance.
 * Returns normalised object matching Finnhub quote shape:
 * { c, d, dp, h, l, o, pc, t, currency, source }
 */
export async function yahooQuote(symbol) {
  const q = await yahooFinance.quote(symbol)
  if (!q) throw new Error(`Yahoo: no quote data for ${symbol}`)

  const c  = q.regularMarketPrice          ?? q.regularMarketPreviousClose ?? 0
  const pc = q.regularMarketPreviousClose  ?? c
  const o  = q.regularMarketOpen           ?? c
  const h  = q.regularMarketDayHigh        ?? c
  const l  = q.regularMarketDayLow         ?? c
  const d  = +(c - pc).toFixed(4)
  const dp = pc ? +((d / pc) * 100).toFixed(4) : 0
  const t  = q.regularMarketTime
    ? Math.floor(new Date(q.regularMarketTime).getTime() / 1000)
    : Math.floor(Date.now() / 1000)

  return {
    c, d, dp, h, l, o, pc, t,
    currency: q.currency || guessCurrency(symbol),
    source: 'yahoo',
  }
}

/**
 * Fetch OHLCV history from Yahoo Finance.
 * Returns object matching Finnhub candles shape:
 * { s, t[], o[], h[], l[], c[], v[] }
 */
export async function yahooCandles(symbol, days = 90) {
  const period1 = new Date()
  period1.setDate(period1.getDate() - days)
  const period2 = new Date()
  const data = await yahooFinance.chart(symbol, { interval: '1d', period1, period2 })
  const quotes = data?.quotes || []
  if (!quotes.length) throw new Error(`Yahoo: empty candle data for ${symbol}`)

  const t = [], o = [], h = [], l = [], c = [], v = []

  for (const quote of quotes) {
    if (quote.close == null || isNaN(quote.close)) continue

    const timeTs = Math.floor(new Date(quote.date).getTime() / 1000)
    t.push(timeTs)
    o.push(+(quote.open   ?? quote.close).toFixed(4))
    h.push(+(quote.high   ?? quote.close).toFixed(4))
    l.push(+(quote.low    ?? quote.close).toFixed(4))
    c.push(+quote.close.toFixed(4))
    v.push(quote.volume   ?? 0)
  }

  if (!t.length) throw new Error(`Yahoo: all bars null for ${symbol}`)

  // Patch last bar with real-time price
  const meta = data.meta
  const livePrice = meta?.regularMarketPrice
  if (livePrice && livePrice > 0) {
    c[c.length - 1] = +livePrice.toFixed(4)
    h[h.length - 1] = Math.max(h[h.length - 1], livePrice)
    l[l.length - 1] = Math.min(l[l.length - 1], livePrice)
  }

  return { s: 'ok', t, o, h, l, c, v, source: 'yahoo' }
}

/**
 * Fetch company profile from Yahoo Finance.
 * Returns normalised object matching Finnhub profile shape.
 */
export async function yahooProfile(symbol) {
  try {
    const res = await yahooFinance.quoteSummary(symbol, {
      modules: ['assetProfile', 'price'],
    })

    const price   = res?.price          || {}
    const profile = res?.assetProfile   || {}

    return {
      name:                   price.longName || price.shortName || symbol,
      ticker:                 symbol,
      exchange:               price.exchangeName || '',
      currency:               price.currency || guessCurrency(symbol),
      country:                profile.country || '',
      logo:                   getLogoFromUrl(profile.website),
      marketCapitalization:   (price.marketCap ?? 0) / 1e6,  // in millions
      industry:               profile.industry || '',
      weburl:                 profile.website || '',
      source:                 'yahoo-profile',
    }
  } catch (e) {
    console.warn(`[yahooProfile] quoteSummary failed for ${symbol}: ${e.message}`)

    // Fallback: Try simple quote to at least extract names/exchange
    try {
      const q = await yahooFinance.quote(symbol)
      if (q) {
        return {
          name:                   q.longName || q.shortName || symbol,
          ticker:                 symbol,
          exchange:               q.exchange || '',
          currency:               q.currency || guessCurrency(symbol),
          country:                '',
          logo:                   null,
          marketCapitalization:   (q.marketCap ?? 0) / 1e6,
          industry:               '',
          weburl:                 '',
          source:                 'yahoo-profile-fallback',
        }
      }
    } catch (_) {}

    // Final fallback (never fail!)
    return {
      name:                   symbol,
      ticker:                 symbol,
      exchange:               '',
      currency:               guessCurrency(symbol),
      country:                '',
      logo:                   null,
      marketCapitalization:   null,
      industry:               '',
      weburl:                 '',
      source:                 'yahoo-profile-guess',
    }
  }
}

/**
 * Fetch basic financials from Yahoo Finance summaryDetail module.
 * Returns normalised object matching Finnhub financials shape:
 * { metric: { '52WeekHigh', '52WeekLow', 'peBasicExclExtraTTM', 'beta', 'volume' } }
 */
export async function yahooFinancials(symbol) {
  try {
    const q = await yahooFinance.quote(symbol)
    if (q) {
      return {
        metric: {
          '52WeekHigh':           q.fiftyTwoWeekHigh           ?? null,
          '52WeekLow':            q.fiftyTwoWeekLow            ?? null,
          'peBasicExclExtraTTM':  q.trailingPE                 ?? null,
          'beta':                 q.beta                       ?? null,
          'volume':               q.regularMarketVolume        ?? null,
        },
        source:                 'yahoo-financials-quote',
      }
    }
  } catch (e) {
    console.warn(`[yahooFinancials] quote failed for ${symbol}: ${e.message}`)
  }

  // Final fallback (never fail!)
  return {
    metric: {
      '52WeekHigh':           null,
      '52WeekLow':            null,
      'peBasicExclExtraTTM':  null,
      'beta':                 null,
      'volume':               null,
    },
    source:                 'yahoo-financials-guess',
  }
}

/**
 * Search tickers on Yahoo Finance.
 * Returns normalised object matching Finnhub search shape:
 * { count, result: [{ description, displaySymbol, symbol, type }] }
 */
export async function yahooSearch(query) {
  try {
    const data = await yahooFinance.search(query)
    const quotes = data?.quotes || []
    const result = quotes.map(item => ({
      description:   item.longname || item.shortname || item.symbol,
      displaySymbol: item.symbol,
      symbol:        item.symbol,
      type:          item.quoteType || item.typeDisp || '',
    }))
    return {
      count: result.length,
      result,
      source: 'yahoo',
    }
  } catch (e) {
    console.error(`[yahooSearch] failed for "${query}":`, e.message)
    return { count: 0, result: [] }
  }
}
