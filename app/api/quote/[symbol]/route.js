// app/api/quote/[symbol]/route.js
// Tries Finnhub first, falls back to Yahoo Finance automatically.

import { fetchQuote } from '@/lib/finnhub'
import { yahooQuote } from '@/lib/yahoo'
import { getCurrencyForSymbol } from '@/lib/utils'

export async function GET(req, { params }) {
  const symbol = params.symbol.toUpperCase()
  const defaultCurrency = getCurrencyForSymbol(symbol)

  // ── Try Finnhub ─────────────────────────────────────────────────────
  try {
    const data = await fetchQuote(symbol)
    // Finnhub returns c=0 for unknown/off-market symbols — treat as failure
    if (data?.c && data.c > 0) {
      return Response.json({
        ...data,
        currency: data.currency || defaultCurrency,
        source: 'finnhub',
      })
    }
  } catch (e) {
    console.warn(`[quote] Finnhub failed for ${symbol}: ${e.message} — trying Yahoo`)
  }

  // ── Fallback: Yahoo Finance ─────────────────────────────────────────
  try {
    const data = await yahooQuote(symbol)
    if (data?.c && data.c > 0) {
      return Response.json({
        ...data,
        currency: data.currency || defaultCurrency,
      })
    }
    throw new Error('Yahoo returned zero price')
  } catch (e) {
    console.error(`[quote] Yahoo also failed for ${symbol}: ${e.message}`)
    return Response.json(
      { error: `No quote data found for "${symbol}". Check the ticker symbol.` },
      { status: 404 }
    )
  }
}

