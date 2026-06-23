'use client'
import { formatCurrency, getCurrencyForSymbol } from '@/lib/utils'

const MODEL_COLOR = { prophet: '#7c6fee', lstm: '#4ade80', arima: '#fb923c' }
const MODEL_LABEL = { prophet: 'Trend',    lstm: 'Momentum', arima: 'Statistical' }

export default function AIInsight({ prediction, activeModel, symbol, quote }) {
  const color    = MODEL_COLOR[activeModel] || '#7c6fee'
  const method   = MODEL_LABEL[activeModel] || 'Trend'
  const predicted = prediction?.predicted || []
  const target   = predicted[predicted.length - 1]
  const start    = predicted[0]
  const days     = predicted.length
  const changePct = target && start ? +((target - start) / start * 100).toFixed(2) : 0
  const fromCurrent = target && quote?.c ? +((target - quote.c) / quote.c * 100).toFixed(2) : null
  const goingUp  = changePct >= 0
  const confidence = prediction
    ? Math.max(40, Math.min(95, Math.round(85 - Math.abs(changePct) * 0.5)))
    : 0
  const currencyCode = quote?.currency || getCurrencyForSymbol(symbol)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Forecast chart icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </svg>
        <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Forecast</span>
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
        >
          {method}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {predicted.length > 0 ? (
          <>
            {/* Target row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{days}d target</p>
                <p className="text-lg font-bold font-mono mt-0.5" style={{ color }}>
                  {formatCurrency(target, currencyCode)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>vs current</p>
                <p
                  className="text-sm font-semibold font-mono mt-0.5"
                  style={{ color: fromCurrent !== null ? (fromCurrent >= 0 ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.4)' }}
                >
                  {fromCurrent !== null ? `${fromCurrent >= 0 ? '+' : ''}${fromCurrent}%` : '—'}
                </p>
              </div>
            </div>


            {/* Direction pill */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: goingUp ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)',
                border: `1px solid ${goingUp ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'}`,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={goingUp ? '#4ade80' : '#f87171'} strokeWidth="2.5" strokeLinecap="round">
                {goingUp
                  ? <path d="m18 15-6-6-6 6"/>
                  : <path d="m6 9 6 6 6-6"/>
                }
              </svg>
              <span className="text-xs font-semibold" style={{ color: goingUp ? '#4ade80' : '#f87171' }}>
                {goingUp ? '+' : ''}{changePct}% over {days} days
              </span>
            </div>

            {/* Confidence */}
            <div>
              <div className="flex justify-between text-[10px] mb-1.5">
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Confidence</span>
                <span style={{ color }}>{confidence}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div
                  className="h-full rounded-full confidence-bar-fill"
                  style={{ width: `${confidence}%`, background: color }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            </svg>
            <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Run a prediction to see the {symbol} forecast
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
