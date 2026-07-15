'use client'
import { formatCurrency, getCurrencyForSymbol } from '@/lib/utils'

const MODEL_COLOR = { prophet: '#7c6fee', lstm: '#4ade80', arima: '#fb923c' }
const MODEL_LABEL = { prophet: 'Trend', lstm: 'Momentum', arima: 'Statistical' }

export default function PredictionBand({ prediction, activeModel, days, symbol, error }) {
  const color = MODEL_COLOR[activeModel] || '#7c6fee'
  const label = MODEL_LABEL[activeModel] || 'Trend'
  const currencyCode = getCurrencyForSymbol(symbol)

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
