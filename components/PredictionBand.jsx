'use client'
import { formatCurrency, getCurrencyForSymbol } from '@/lib/utils'

const MODEL_COLOR = { prophet: '#7c6fee', lstm: '#4ade80', arima: '#fb923c' }
const MODEL_LABEL = { prophet: 'Trend', lstm: 'Momentum', arima: 'Statistical' }

export default function PredictionBand({ prediction, activeModel, days, symbol, error, warmingUp, warmCountdown, onRetry }) {
  const color = MODEL_COLOR[activeModel] || '#7c6fee'
  const label = MODEL_LABEL[activeModel] || 'Trend'
  const currencyCode = getCurrencyForSymbol(symbol)

  // ── ML Warm-up banner (Render cold-start) ──
  if (warmingUp) {
    const progress = Math.max(0, Math.min(100, ((35 - warmCountdown) / 35) * 100))
    return (
      <div
        className="px-5 py-4 rounded-xl overflow-hidden relative"
        style={{ background: 'rgba(124,111,238,0.06)', border: '1px solid rgba(124,111,238,0.25)' }}
      >
        {/* Animated shimmer sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(124,111,238,0.08) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
          }}
        />
        <div className="relative flex items-center gap-4">
          {/* Pulsing rocket icon */}
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(124,111,238,0.15)', border: '1px solid rgba(124,111,238,0.3)', animation: 'pulse 1.5s ease-in-out infinite' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold" style={{ color: '#a78bfa' }}>
                🔥 ML Engine Warming Up…
              </p>
              <span className="text-xs font-mono font-bold" style={{ color: '#7c6fee' }}>
                {warmCountdown > 0 ? `${warmCountdown}s` : 'Retrying…'}
              </span>
            </div>
            <p className="text-xs mb-2.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Prediction server is starting (Render cold-start). Auto-retrying when ready.
            </p>

            {/* Progress bar */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #7c6fee, #a78bfa)',
                  boxShadow: '0 0 8px rgba(124,111,238,0.6)',
                }}
              />
            </div>
          </div>

          {/* Manual retry button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(124,111,238,0.15)', color: '#a78bfa', border: '1px solid rgba(124,111,238,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,111,238,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,111,238,0.15)'}
              title="Retry now"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
              Retry now
            </button>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-xl"
        style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-sm" style={{ color: '#f87171' }}>
          {error}
        </p>
      </div>
    )
  }

  if (!prediction?.predicted?.length) {
    return (
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Click <strong style={{ color }}>▶ Run Prediction</strong> to see the forecast
        </p>
      </div>
    )
  }

  const predicted  = prediction.predicted
  const upper      = prediction.upper || []
  const lower      = prediction.lower || []
  const target     = predicted[predicted.length - 1]
  const start      = predicted[0]
  const maxUp      = upper.length ? Math.max(...upper) : target * 1.05
  const minDown    = lower.length ? Math.min(...lower) : target * 0.95
  const changePct  = +((target - start) / start * 100).toFixed(2)
  const goingUp    = changePct >= 0
  const bandPct    = (maxUp - minDown) / target * 100
  const confidence = Math.max(40, Math.min(95, Math.round(95 - bandPct * 1.8)))

  return (
    <div
      className="rounded-xl overflow-hidden animate-slide-up"
      style={{ background: '#0d1020', border: `1px solid ${color}20` }}
    >
      {/* Mobile: 2-column grid  |  sm+: single horizontal flex row */}
      <div className="grid grid-cols-2 sm:flex sm:items-stretch">

        {/* Direction block */}
        <div
          className="flex flex-col justify-center px-3 sm:px-6 py-4 sm:py-5 gap-1"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}20` }}
            >
              {goingUp ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              )}
            </div>
            <span className="text-xs font-semibold" style={{ color }}>
              {goingUp ? '▲' : '▼'} {Math.abs(changePct)}%
            </span>
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {days}d · {label}
          </p>
        </div>

        {/* Target */}
        <div
          className="flex flex-col justify-center px-3 sm:px-6 py-4 sm:py-5 gap-1"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Target</p>
          <p className="text-base sm:text-xl font-bold font-mono" style={{ color }}>{formatCurrency(target, currencyCode)}</p>
        </div>

        {/* Range */}
        <div
          className="flex flex-col justify-center px-3 sm:px-6 py-4 sm:py-5 gap-1"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Range</p>
          <p className="text-xs sm:text-sm font-mono">
            <span style={{ color: '#f87171' }}>{formatCurrency(minDown, currencyCode)}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}> – </span>
            <span style={{ color: '#4ade80' }}>{formatCurrency(maxUp, currencyCode)}</span>
          </p>
        </div>


        {/* Confidence */}
        <div className="flex flex-col justify-center px-3 sm:px-6 py-4 sm:py-5 gap-2 sm:flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>Confidence</p>
            <p className="text-xs font-semibold font-mono" style={{ color }}>{confidence}%</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full confidence-bar-fill"
              style={{ width: `${confidence}%`, background: `linear-gradient(90deg, ${color}, ${color}80)` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
