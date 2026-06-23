// app/api/financials/[symbol]/route.js
// Tries Finnhub first, falls back to Yahoo Finance.

import { fetchBasicFinancials } from '@/lib/finnhub'
import { yahooFinancials } from '@/lib/yahoo'

export async function GET(req, { params }) {
  const symbol = params.symbol.toUpperCase()

  // ── Try Finnhub ─────────────────────────────────────────────────────
  try {
    const data = await fetchBasicFinancials(symbol)
    if (data && data.metric && Object.keys(data.metric).length > 0) {
      return Response.json({ ...data, source: 'finnhub' })
    }
  } catch (e) {
    console.warn(`[financials] Finnhub failed for ${symbol}: ${e.message} — trying Yahoo`)
  }

  // ── Fallback: Yahoo Finance ─────────────────────────────────────────
  try {
    const data = await yahooFinancials(symbol)
    if (data && data.metric && Object.keys(data.metric).filter(k => data.metric[k] !== null).length > 0) {
      return Response.json(data)
    }
    throw new Error('Yahoo financials returned empty or all-null metrics')
  } catch (e) {
    console.error(`[financials] Yahoo also failed for ${symbol}: ${e.message}`)
    return Response.json({ error: `No financial data found for "${symbol}"` }, { status: 404 })
  }
}

