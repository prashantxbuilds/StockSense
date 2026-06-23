// app/api/profile/[symbol]/route.js
// Tries Finnhub first, falls back to Yahoo Finance.

import { fetchProfile } from '@/lib/finnhub'
import { yahooProfile } from '@/lib/yahoo'

export async function GET(req, { params }) {
  const symbol = params.symbol.toUpperCase()

  // ── Try Finnhub ─────────────────────────────────────────────────────
  try {
    const data = await fetchProfile(symbol)
    if (data && Object.keys(data).length > 0 && data.name) {
      return Response.json({ ...data, source: 'finnhub' })
    }
  } catch (e) {
    console.warn(`[profile] Finnhub failed for ${symbol}: ${e.message} — trying Yahoo`)
  }

  // ── Fallback: Yahoo Finance ─────────────────────────────────────────
  try {
    const data = await yahooProfile(symbol)
    if (data && data.name) {
      return Response.json(data)
    }
    throw new Error('Yahoo profile returned no name')
  } catch (e) {
    console.error(`[profile] Yahoo also failed for ${symbol}: ${e.message}`)
    return Response.json({ error: `No profile data found for "${symbol}"` }, { status: 404 })
  }
}

