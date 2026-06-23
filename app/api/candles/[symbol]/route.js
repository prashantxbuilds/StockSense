// app/api/candles/[symbol]/route.js
// Strategy:
//   1. Try Finnhub first for real historical OHLCV data
//   2. If Finnhub fails, try Yahoo Finance second
//   3. If both fail, try Finnhub/Yahoo quote + generate synthetic bars
//   All paths guarantee unique, sorted weekday timestamps.

import { fetchCandles } from '@/lib/finnhub'
import { yahooCandles, yahooQuote } from '@/lib/yahoo'

const TIMEOUT_MS = 9000

async function fetchWithTimeout(url, ms = TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    return res
  } finally {
    clearTimeout(timer)
  }
}

// Build N weekday-only timestamps walking backwards from today (no duplicates)
function buildWeekdayTimestamps(n) {
  const timestamps = []
  const cursor = new Date()
  cursor.setUTCHours(0, 0, 0, 0)
  while (timestamps.length < n) {
    const dow = cursor.getUTCDay()  // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) {
      timestamps.unshift(Math.floor(cursor.getTime() / 1000))
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return timestamps
}

// Generate synthetic OHLCV bars anchored to a real current price
function generateSyntheticBars(currentPrice, high52, low52) {
  const BARS     = 90
  const startPrice = (high52 + low52) / 2
  const dailyVol   = currentPrice * 0.013
  const drift      = (currentPrice - startPrice) / BARS

  const timestamps = buildWeekdayTimestamps(BARS)

  let seed = 12345
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return (seed >>> 0) / 0xffffffff
  }
  const randNorm = () => {
    const u1 = Math.max(rand(), 1e-10), u2 = rand()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  const t = [], o = [], h = [], l = [], c = [], v = []
  let price = startPrice

  for (let i = 0; i < BARS; i++) {
    const open  = price
    const move  = drift + randNorm() * dailyVol
    const close = Math.max(open + move, 0.01)
    const wick  = Math.abs(move) * (0.4 + rand() * 0.8)
    const high  = Math.max(open, close) + wick
    const low   = Math.max(Math.min(open, close) - wick, 0.01)

    t.push(timestamps[i])
    o.push(+open.toFixed(4))
    h.push(+high.toFixed(4))
    l.push(+low.toFixed(4))
    c.push(+close.toFixed(4))
    v.push(Math.floor(15e6 + rand() * 25e6))
    price = close
  }

  // Anchor last bar to real price
  c[BARS - 1] = +currentPrice.toFixed(4)

  return { s: 'ok', t, o, h, l, c, v, source: 'synthetic' }
}

export async function GET(req, { params }) {
  const symbol = params.symbol.toUpperCase()
  const token  = process.env.FINNHUB_API_KEY
  const base   = 'https://finnhub.io/api/v1'

  // ── 1. Try Finnhub first (real historical candles) ──────────────────
  try {
    const data = await fetchCandles(symbol, 90)
    if (data && data.s === 'ok' && data.t && data.t.length > 10) {
      console.log(`[candles] ✓ Finnhub → ${symbol} (${data.t.length} bars)`)
      return Response.json({
        ...data,
        source: 'finnhub',
      })
    }
  } catch (e) {
    console.warn(`[candles] Finnhub candles failed for ${symbol}: ${e.message} — trying Yahoo`)
  }

  // ── 2. Try Yahoo Finance second (real historical candles) ───────────
  try {
    const data = await yahooCandles(symbol, 90)
    if (data && data.t && data.t.length > 10) {
      console.log(`[candles] ✓ Yahoo Finance → ${symbol} (${data.t.length} bars)`)
      return Response.json(data)
    }
  } catch (e) {
    console.warn(`[candles] Yahoo candles also failed for ${symbol}: ${e.message} — generating synthetic`)
  }

  // ── 3. Fallback: Finnhub quote + synthetic bars ────────────────────
  try {
    // Fetch current quote
    let quote = null
    try {
      const qRes = await fetchWithTimeout(`${base}/quote?symbol=${symbol}&token=${token}`)
      if (qRes.ok) quote = await qRes.json()
    } catch (e) {
      console.warn(`[candles] Finnhub quote failed for ${symbol}: ${e.message}`)
    }

    const currentPrice = quote?.c && quote.c > 0 ? quote.c : null

    if (!currentPrice) {
      // Last resort: try Yahoo quote to at least get a price
      try {
        const yq = await yahooQuote(symbol)
        if (yq?.c && yq.c > 0) {
          const synth = generateSyntheticBars(yq.c, yq.c * 1.2, yq.c * 0.8)
          console.log(`[candles] ✓ Yahoo quote + synthetic → ${symbol}`)
          return Response.json(synth)
        }
      } catch (_) {}

      return Response.json(
        { error: `No price data found for "${symbol}". Verify the ticker is correct.` },
        { status: 404 }
      )
    }

    // Fetch 52W range (optional)
    let w52High = quote.h ? quote.h * 1.25 : currentPrice * 1.20
    let w52Low  = quote.l ? quote.l * 0.80 : currentPrice * 0.80
    try {
      const mRes = await fetchWithTimeout(
        `${base}/stock/metric?symbol=${symbol}&metric=all&token=${token}`, 5000
      )
      if (mRes.ok) {
        const m = await mRes.json()
        if (m?.metric?.['52WeekHigh']) w52High = m.metric['52WeekHigh']
        if (m?.metric?.['52WeekLow'])  w52Low  = m.metric['52WeekLow']
      }
    } catch (_) {}

    const synth = generateSyntheticBars(currentPrice, w52High, w52Low)
    console.log(`[candles] ✓ Finnhub quote + synthetic → ${symbol}`)
    return Response.json(synth)

  } catch (err) {
    console.error(`[candles] All sources failed for ${symbol}:`, err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
