'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Topbar from '@/components/Topbar'
import PredictionControls from '@/components/PredictionControls'
import PredictionBand from '@/components/PredictionBand'
import StockStats from '@/components/StockStats'
import Indicators from '@/components/Indicators'
import Watchlist from '@/components/Watchlist'
import AIInsight from '@/components/AIInsight'
import NewsFeed from '@/components/NewsFeed'
import { formatCurrency, getCurrencyForSymbol, getLogoForStock } from '@/lib/utils'


// Dynamically import chart (client-only, no SSR)
const StockChart = dynamic(() => import('@/components/StockChart'), { ssr: false })

const DEFAULT_SYMBOL = 'AAPL'
const DEFAULT_WATCHLIST_SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'NVDA', 'MSFT', 'AMZN']
const MODEL_COLORS = { prophet: '#7c6fee', lstm: '#4ade80', arima: '#fb923c' }

// ─── DOWNLOAD CSV HELPER ─────────────────────────────────────────────────────
function downloadCSV({ symbol, model, days, candles, prediction }) {
  const rows = [['Date', 'Type', 'Open', 'High', 'Low', 'Close', 'Volume']]

  // Historical rows
  if (candles?.t) {
    candles.t.forEach((ts, i) => {
      const d = new Date(ts * 1000).toISOString().split('T')[0]
      rows.push([d, 'Historical', candles.o[i], candles.h[i], candles.l[i], candles.c[i], candles.v[i]])
    })
  }

  // Prediction rows
  if (prediction?.predicted) {
    prediction.predicted.forEach((price, i) => {
      rows.push([
        prediction.dates?.[i] || `+${i + 1}d`,
        'Predicted',
        '', '', '',
        price.toFixed(2),
        ''
      ])
    })
  }

  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${symbol}_${model}_${days}d.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── STOCK HEADER ─────────────────────────────────────────────────────────────
function StockHeader({ symbol, profile, quote, loading, inWatchlist, onToggleWatchlist }) {
  const price = quote?.c
  const change = quote?.d
  const changePct = quote?.dp
  const isUp = (changePct ?? 0) >= 0
  const currencyCode = profile?.currency || quote?.currency || getCurrencyForSymbol(symbol)

  const [logoFailed, setLogoFailed] = useState(false)
  const logo = getLogoForStock(symbol, profile)
  const showLogo = logo && !logoFailed

  useEffect(() => {
    setLogoFailed(false)
  }, [symbol])

  return (
    <div className="flex items-center gap-3 animate-fade-in flex-wrap sm:flex-nowrap w-full">
      {/* Logo — shimmer while loading, real logo when ready */}
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          background: showLogo ? '#fff' : 'linear-gradient(135deg, #7c6fee22, #7c6fee44)',
          border: '1px solid rgba(124,111,238,0.25)',
          padding: showLogo ? 3 : 0,
        }}
      >
        {profile === null ? (
          // Shimmer skeleton while switching
          <div
            className="w-full h-full rounded-lg"
            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite' }}
          />
        ) : showLogo ? (
          <img
            src={logo}
            alt={symbol}
            className="w-full h-full object-contain rounded-lg"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{symbol?.slice(0, 2)}</span>
        )}
      </div>

      {/* Name + exchange + watchlist star */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-bold text-lg sm:text-xl tracking-tight flex items-center gap-2" style={{ color: '#e2e8f0' }}>
            {symbol}
            <button
              onClick={onToggleWatchlist}
              className="text-lg focus:outline-none transition-transform active:scale-90 hover:scale-110"
              style={{ color: inWatchlist ? '#fb923c' : 'rgba(255,255,255,0.25)', cursor: 'pointer' }}
              title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {inWatchlist ? '★' : '☆'}
            </button>
          </h1>
          {profile?.name && (
            <span className="text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {profile.name}
            </span>
          )}
          {profile?.exchange && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {profile.exchange}
            </span>
          )}
        </div>
        {(profile?.finnhubIndustry || profile?.industry) && (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {profile.finnhubIndustry || profile.industry}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="text-right shrink-0 ml-auto">
        {loading ? (
          <div className="space-y-2 text-right">
            <div className="skeleton w-24 sm:w-28 h-7 sm:h-8 ml-auto" />
            <div className="skeleton w-16 sm:w-20 h-4 ml-auto" />
          </div>
        ) : price ? (
          <>
            <p className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: '#e2e8f0' }}>
              {formatCurrency(price, currencyCode)}
            </p>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span
                className="flex items-center gap-1 text-xs sm:text-sm font-semibold"
                style={{ color: isUp ? '#4ade80' : '#f87171' }}
              >
                {isUp ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
                {isUp ? '+' : ''}{formatCurrency(change, currencyCode)} ({isUp ? '+' : ''}{changePct?.toFixed(2)}%)
              </span>
            </div>
            <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Open: {formatCurrency(quote.o, currencyCode)} · High: {formatCurrency(quote.h, currencyCode)} · Low: {formatCurrency(quote.l, currencyCode)}
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Price Unavailable
          </p>
        )}
      </div>
    </div>
  )
}

// Custom stock-market SVG icons — no emojis
const Icons = {
  // Trend: ascending candlestick line
  Trend: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  // Momentum: wave oscillator pattern
  Momentum: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12 C4 6, 6 6, 8 12 C10 18, 12 18, 14 12 C16 6, 18 6, 20 12 C21 15, 22 15, 22 12" />
    </svg>
  ),
  // Statistical: bar histogram
  Statistical: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
      <line x1="2"  y1="20" x2="22" y2="20" />
    </svg>
  ),
}

const MODELS = [
  {
    id: 'prophet',
    label: 'Trend',
    desc: 'Seasonal patterns',
    Icon: Icons.Trend,
    color: '#7c6fee',
    bg: 'rgba(124,111,238,0.15)',
  },
  {
    id: 'lstm',
    label: 'Momentum',
    desc: 'Price movements',
    Icon: Icons.Momentum,
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.12)',
  },
  {
    id: 'arima',
    label: 'Statistical',
    desc: 'Math-based estimate',
    Icon: Icons.Statistical,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
  },
]

// ─── PREDICT SLIDER ──────────────────────────────────────────────────────────
function PredictRow({ days, onDaysChange, onDownload, predicting, onRunPredict, activeModel, onModelChange }) {
  return (
    <div className="space-y-4">
      {/* Model Selection pills */}
      <div className="grid grid-cols-3 gap-2">
        {MODELS.map(m => {
          const active = activeModel === m.id
          return (
            <button
              key={m.id}
              onClick={() => onModelChange(m.id)}
              className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 py-2.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-150 w-full"
              style={{
                background: active ? m.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? `${m.color}45` : 'rgba(255,255,255,0.07)'}`,
                color: active ? m.color : 'rgba(255,255,255,0.4)',
                transform: active ? 'scale(1.02)' : 'scale(1)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            >
              <m.Icon />
              <div className="text-center sm:text-left">
                <p className="text-[11px] sm:text-xs font-semibold leading-none">{m.label}</p>
                <p className="hidden sm:block text-[9px] sm:text-[10px] mt-0.5 leading-none" style={{ color: active ? `${m.color}90` : 'rgba(255,255,255,0.25)' }}>
                  {m.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Days slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>Predict</span>
        <input
          id="predict-days-slider"
          type="range"
          min={3}
          max={30}
          value={days}
          onChange={e => onDaysChange(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: '#7c6fee' }}
        />
        <div
          className="flex items-center justify-center w-12 h-7 rounded-lg text-xs font-bold font-mono shrink-0"
          style={{ background: 'rgba(124,111,238,0.15)', color: '#a78bfa', border: '1px solid rgba(124,111,238,0.3)' }}
        >
          {days}d
        </div>
      </div>

      {/* Buttons row */}
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        {/* Run Prediction button */}
        <button
          id="run-prediction-btn"
          onClick={onRunPredict}
          disabled={predicting}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{
            background: predicting ? 'rgba(124,111,238,0.08)' : 'rgba(124,111,238,0.15)',
            color: predicting ? 'rgba(124,111,238,0.5)' : '#a78bfa',
            border: '1px solid rgba(124,111,238,0.3)',
            cursor: predicting ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!predicting) e.currentTarget.style.background = 'rgba(124,111,238,0.25)' }}
          onMouseLeave={e => { if (!predicting) e.currentTarget.style.background = 'rgba(124,111,238,0.15)' }}
        >
          {predicting ? (
            <>
              <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: '#7c6fee', borderTopColor: 'transparent' }} />
              Running…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Run Prediction
            </>
          )}
        </button>

        {/* Download CSV */}
        <button
          id="download-csv-btn"
          onClick={onDownload}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(74,222,128,0.2)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(74,222,128,0.12)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download CSV
        </button>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL)
  const [quote, setQuote] = useState(null)
  const [candles, setCandles] = useState(null)
  const [profile, setProfile] = useState(null)
  const [financials, setFinancials] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [activeModel, setActiveModel] = useState('prophet')
  const [timeframe, setTimeframe] = useState('1M')
  const [days, setDays] = useState(7)
  const [predicting, setPredicting] = useState(false)
  const [watchlistQuotes, setWatchlistQuotes] = useState({})
  const [watchlistLogos, setWatchlistLogos] = useState({})
  const [loadingStock, setLoadingStock] = useState(false)
  const [chartType, setChartType] = useState('candles')
  const [fetchError, setFetchError] = useState(null)
  
  const [watchlist, setWatchlist] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('watchlist_symbols')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (_) {}
      }
    }
    return DEFAULT_WATCHLIST_SYMBOLS
  })
  const [watchlistNames, setWatchlistNames] = useState({})
  const [predictError, setPredictError] = useState(null)

  const predictDebounce = useRef(null)

  // Helper: fetch with timeout so UI never hangs indefinitely
  const fetchJSON = useCallback(async (url, timeoutMs = 12000) => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } finally {
      clearTimeout(timer)
    }
  }, [])

  // ── Fetch all stock data in parallel for instant response ──
  const fetchStockData = useCallback(async (sym) => {
    setLoadingStock(true)
    setFetchError(null)
    setPrediction(null)
    // Clear stale data immediately so logo/price update at once
    setQuote(null)
    setProfile(null)
    setCandles(null)
    setFinancials(null)
    try {
      // Fire all 4 requests simultaneously
      const quotePromise      = fetchJSON(`/api/quote/${sym}`)
      const candlesPromise    = fetchJSON(`/api/candles/${sym}`, 15000)  // candles needs more time (2 upstream calls)
      const profilePromise    = fetchJSON(`/api/profile/${sym}`)
      const financialsPromise = fetchJSON(`/api/financials/${sym}`)

      // Quote resolves fastest — update immediately without waiting for others
      quotePromise
        .then(quoteData => {
          if (quoteData && !quoteData.error && quoteData.c) setQuote(quoteData)
        })
        .catch(e => console.warn(`[quote] ${sym}:`, e.message))

      // Await all others concurrently
      const [candlesRes, profileRes, financialsRes] = await Promise.allSettled([
        candlesPromise,
        profilePromise,
        financialsPromise,
      ])

      // ── Candles ──
      if (candlesRes.status === 'fulfilled') {
        const cd = candlesRes.value
        if (cd?.t?.length > 0) {
          // Valid candles data
          setCandles(cd)
        } else if (cd?.error) {
          // API returned an error (e.g. invalid ticker, rate limit)
          console.warn(`[candles] ${sym}: ${cd.error}`)
          setFetchError(`Could not load chart: ${cd.error}`)
        }
      } else {
        // Network/timeout failure
        console.warn(`[candles] ${sym} network error:`, candlesRes.reason?.message)
        setFetchError(`Chart data unavailable — check your connection.`)
      }

      // ── Profile ──
      if (profileRes.status === 'fulfilled') {
        const pd = profileRes.value
        if (pd && !pd.error) setProfile(pd)
        else setProfile({})  // empty object so StockHeader shows symbol fallback, not skeleton
      } else {
        setProfile({})
      }

      // ── Financials ──
      if (financialsRes.status === 'fulfilled' && !financialsRes.value?.error) {
        setFinancials(financialsRes.value)
      }

      // Ensure quote is set even if the fast-path above missed it
      try {
        const qd = await quotePromise
        if (qd && !qd.error && qd.c) setQuote(prev => prev ?? qd)
      } catch (_) {}

    } catch (e) {
      console.error('fetchStockData error:', e)
      setFetchError('Failed to load stock data. Please try again.')
    } finally {
      setLoadingStock(false)
    }
  }, [fetchJSON])

  // ── Fetch prediction ──
  const fetchPrediction = useCallback(async (sym, model, numDays, candleData) => {
    if (!candleData?.c || candleData.c.length < 5) return
    setPredicting(true)
    setPredictError(null)
    try {
      const prices = candleData.c
      const dates = candleData.t.map(t => {
        const d = new Date(t * 1000)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      })
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: sym, days: numDays, model, prices, dates }),
      })
      const data = await res.json()
      if (!data.error) setPrediction(data)
      else {
        setPredictError(data.error)
        console.warn('Prediction error:', data.error)
      }
    } catch (e) {
      setPredictError(e.message)
      console.warn('Prediction failed (ML service may be offline):', e.message)
    } finally {
      setPredicting(false)
    }
  }, [])

  // ── Fetch current quote only (for background live updates) ──
  const fetchCurrentQuote = useCallback(async (sym) => {
    try {
      const quoteData = await fetch(`/api/quote/${sym}`).then(r => r.json())
      if (!quoteData.error) {
        setQuote(prev => {
          if (prev?.c === quoteData.c && prev?.d === quoteData.d && prev?.dp === quoteData.dp) {
            return prev
          }
          return quoteData
        })
      }
    } catch (e) {
      console.error('fetchCurrentQuote error:', e)
    }
  }, [])

  // ── Auto-refresh current quote every 10 seconds for live market price ──
  useEffect(() => {
    if (!symbol) return
    const interval = setInterval(() => {
      fetchCurrentQuote(symbol)
    }, 10000)
    return () => clearInterval(interval)
  }, [symbol, fetchCurrentQuote])

  // ── Load watchlist quotes ──
  const loadWatchlistQuotes = useCallback(async () => {
    if (!watchlist?.length) return
    const results = await Promise.allSettled(
      watchlist.map(s => fetch(`/api/quote/${s}`).then(r => r.json()).then(d => ({ s, d })))
    )
    const q = {}
    results.forEach(r => { if (r.status === 'fulfilled') q[r.value.s] = r.value.d })
    setWatchlistQuotes(q)
  }, [watchlist])

  // ── Load watchlist profile details (logos and names) ──
  const loadWatchlistDetails = useCallback(async () => {
    if (!watchlist?.length) return
    const results = await Promise.allSettled(
      watchlist.map(s => fetch(`/api/profile/${s}`).then(r => r.json()).then(d => ({ s, d })))
    )
    const logos = {}
    const names = {}
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value.d) {
        if (r.value.d.logo) logos[r.value.s] = r.value.d.logo
        if (r.value.d.name) names[r.value.s] = r.value.d.name
      }
    })
    setWatchlistLogos(prev => ({ ...prev, ...logos }))
    setWatchlistNames(prev => ({ ...prev, ...names }))
  }, [watchlist])

  // ── Toggle stock in watchlist ──
  const toggleWatchlist = useCallback((sym) => {
    const upper = sym.trim().toUpperCase()
    setWatchlist(prev => {
      const next = prev.includes(upper) ? prev.filter(s => s !== upper) : [...prev, upper]
      if (typeof window !== 'undefined') {
        localStorage.setItem('watchlist_symbols', JSON.stringify(next))
      }
      return next
    })
  }, [])

  // ── On mount: load persisted stock + watchlist ──
  useEffect(() => {
    let initialSymbol = DEFAULT_SYMBOL
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selected_symbol')
      if (saved) {
        initialSymbol = saved
        setSymbol(saved)
      }
    }
    fetchStockData(initialSymbol)
    loadWatchlistQuotes()
    loadWatchlistDetails()
    const interval = setInterval(loadWatchlistQuotes, 30000)
    return () => clearInterval(interval)
  }, [fetchStockData, loadWatchlistQuotes, loadWatchlistDetails])

  // ── When candles arrive, run prediction (debounced) ──
  useEffect(() => {
    if (!candles?.c) return
    clearTimeout(predictDebounce.current)
    predictDebounce.current = setTimeout(() => {
      fetchPrediction(symbol, activeModel, days, candles)
    }, 400)
  }, [candles, symbol, activeModel, days, fetchPrediction])

  // ── Symbol change — clear stale state first for instant feedback ──
  const handleSymbolChange = useCallback((sym) => {
    const upper = sym.trim().toUpperCase()
    setSymbol(upper)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_symbol', upper)
    }
    setPrediction(null)
    setQuote(null)
    setProfile(null)
    setCandles(null)
    setFetchError(null)
    fetchStockData(upper)
  }, [fetchStockData])

  // ── Model change ──
  const handleModelChange = useCallback((model) => {
    setActiveModel(model)
  }, [])

  // ── Days slider change (debounced prediction re-fetch) ──
  const handleDaysChange = useCallback((d) => {
    setDays(d)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#080c18' }}>
      <Topbar symbol={symbol} onSymbolChange={handleSymbolChange} activeModel={activeModel} />

      <main className="px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5" style={{ maxWidth: '1440px', margin: '0 auto' }}>

        {/* ── MOBILE WATCHLIST (horizontal scroll strip, visible only < lg) ── */}
        <div className="lg:hidden mb-3">
          <Watchlist
            activeSymbol={symbol}
            onSelect={handleSymbolChange}
            quotes={watchlistQuotes}
            logos={watchlistLogos}
            symbols={watchlist}
            names={watchlistNames}
            horizontal
          />
        </div>

        {/* ── TWO-COLUMN LAYOUT (desktop: left content + right sidebar) ── */}
        <div className="flex gap-4" style={{ alignItems: 'flex-start' }}>

          {/* ── LEFT COLUMN ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">

            {/* Stock header */}
            <div
              className="p-3 sm:p-5 rounded-xl"
              style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <StockHeader
                symbol={symbol}
                profile={profile}
                quote={quote}
                loading={loadingStock}
                inWatchlist={watchlist.includes(symbol)}
                onToggleWatchlist={() => toggleWatchlist(symbol)}
              />
            </div>

            {/* Toolbar: timeframe + chart type */}
            <div
              className="p-3 rounded-xl"
              style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <PredictionControls
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                chartType={chartType}
                onChartTypeChange={setChartType}
              />
            </div>

            {/* Chart — show error if fetch failed, otherwise the chart */}
            {fetchError ? (
              <div
                className="rounded-xl flex flex-col items-center justify-center gap-3 py-14"
                style={{ background: '#0d1020', border: '1px solid rgba(248,113,113,0.2)', minHeight: 240 }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-center px-6" style={{ color: 'rgba(248,113,113,0.85)' }}>{fetchError}</p>
                <button
                  onClick={() => fetchStockData(symbol)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold mt-1 transition-all"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M8 16H3v5"/>
                  </svg>
                  Retry
                </button>
              </div>
            ) : (
              <StockChart
                candles={candles}
                prediction={prediction}
                activeModel={activeModel}
                timeframe={timeframe}
                chartType={chartType}
                symbol={symbol}
              />
            )}

            {/* Controls row: slider + download */}
            <div
              className="p-3 sm:p-4 rounded-xl"
              style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <PredictRow
                days={days}
                onDaysChange={handleDaysChange}
                predicting={predicting}
                onRunPredict={() => fetchPrediction(symbol, activeModel, days, candles)}
                onDownload={() => downloadCSV({ symbol, model: activeModel, days, candles, prediction })}
                activeModel={activeModel}
                onModelChange={handleModelChange}
              />
            </div>

            {/* Prediction band */}
            <PredictionBand
              prediction={prediction}
              activeModel={activeModel}
              days={days}
              symbol={symbol}
              error={predictError}
            />

            {/* Stock stats */}
            <StockStats quote={quote} profile={profile} financials={financials} candles={candles} />

            {/* Indicators */}
            <Indicators candles={candles} />

            {/* ── MOBILE-ONLY: Forecast + News below main content ── */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              <AIInsight
                prediction={prediction}
                activeModel={activeModel}
                symbol={symbol}
                quote={quote}
                error={predictError}
              />
              <NewsFeed symbol={symbol} />
            </div>
          </div>

          {/* ── RIGHT SIDEBAR (desktop only) ─────────────────────── */}
          <div
            className="hidden lg:flex flex-col gap-4 shrink-0"
            style={{ width: '260px' }}
          >
            <Watchlist
              activeSymbol={symbol}
              onSelect={handleSymbolChange}
              quotes={watchlistQuotes}
              logos={watchlistLogos}
              symbols={watchlist}
              names={watchlistNames}
            />
            <AIInsight
              prediction={prediction}
              activeModel={activeModel}
              symbol={symbol}
              quote={quote}
              error={predictError}
            />
            <NewsFeed symbol={symbol} />
          </div>
        </div>
      </main>

      {/* Ambient background gradient */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(124,111,238,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(74,222,128,0.04) 0%, transparent 50%)',
        }}
      />
    </div>
  )
}
