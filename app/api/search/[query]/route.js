// app/api/search/[query]/route.js
// Tries Finnhub first, falls back to Yahoo Finance.

import { searchTicker } from '@/lib/finnhub'
import { yahooSearch } from '@/lib/yahoo'

export async function GET(req, { params }) {
  const query = decodeURIComponent(params.query)

  // ── Try Finnhub ─────────────────────────────────────────────────────
  try {
    const data = await searchTicker(query)
    if (data && Array.isArray(data.result) && data.result.length > 0) {
      return Response.json({ ...data, source: 'finnhub' })
    }
  } catch (e) {
    console.warn(`[search] Finnhub failed for query "${query}": ${e.message} — trying Yahoo`)
  }

  // ── Fallback: Yahoo Finance ─────────────────────────────────────────
  try {
    const data = await yahooSearch(query)
    if (data && Array.isArray(data.result)) {
      return Response.json(data)
    }
    throw new Error('Yahoo search returned no result array')
  } catch (e) {
    console.error(`[search] Yahoo also failed for query "${query}": ${e.message}`)
    return Response.json({ error: `Search failed for "${query}"` }, { status: 500 })
  }
}

