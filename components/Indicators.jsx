'use client'

function computeRSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d >= 0) gains += d; else losses -= d
  }
  let ag = gains / period, al = losses / period
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period
    al = (al * (period - 1) + (d < 0 ? -d : 0)) / period
  }
  if (al === 0) return 100
  return +(100 - 100 / (1 + ag / al)).toFixed(1)
}

function ema(data, p) {
  if (!data || data.length < p) return []
  const k = 2 / (p + 1)
  const r = [data.slice(0, p).reduce((a, b) => a + b, 0) / p]
  for (let i = p; i < data.length; i++) r.push(data[i] * k + r[r.length - 1] * (1 - k))
  return r
}

function computeMACD(closes) {
  if (!closes || closes.length < 26) return null
  const e12 = ema(closes, 12), e26 = ema(closes, 26)
  const line = e26.map((v, i) => e12[i + (e12.length - e26.length)] - v)
  const sig  = ema(line, 9)
  const macd = line[line.length - 1]
  const s    = sig[sig.length - 1]
  return { histogram: +(macd - s).toFixed(3), macd: +macd.toFixed(3), signal: +s.toFixed(3) }
}

// RSI icon — speedometer
function RSIIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  )
}

// MACD icon — wave oscillator
function MACDIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M2 12 C4 6 6 6 8 12 C10 18 12 18 14 12 C16 6 18 6 20 12"/>
    </svg>
  )
}

function RSICard({ rsi }) {
  const val = rsi ?? 50
  const color = val < 30 ? '#4ade80' : val > 70 ? '#f87171' : '#7c6fee'
  const label = val < 30 ? 'Oversold' : val > 70 ? 'Overbought' : 'Neutral'

  return (
    <div
      className="flex-1 p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minWidth: '140px' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <RSIIcon color={color} />
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>RSI (14)</span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <p className="text-2xl font-bold font-mono mb-3" style={{ color }}>
        {rsi ?? '—'}
      </p>

      {/* Bar */}
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="absolute inset-0 flex">
          <div style={{ width: '30%', background: 'rgba(74,222,128,0.2)' }} />
          <div style={{ width: '40%', background: 'rgba(124,111,238,0.1)' }} />
          <div style={{ width: '30%', background: 'rgba(248,113,113,0.2)' }} />
        </div>
        <div
          className="absolute top-0 bottom-0 w-1 rounded-full"
          style={{ left: `${val}%`, background: color, transform: 'translateX(-50%)', transition: 'left 0.5s ease' }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
        <span>0</span><span>50</span><span>100</span>
      </div>
    </div>
  )
}

function MACDCard({ macd }) {
  if (!macd) {
    return (
      <div
        className="flex-1 p-4 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minWidth: '140px' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <MACDIcon color="rgba(255,255,255,0.3)" />
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>MACD</span>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Not enough data</p>
      </div>
    )
  }

  const up    = macd.histogram >= 0
  const color = up ? '#4ade80' : '#f87171'

  return (
    <div
      className="flex-1 p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minWidth: '140px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <MACDIcon color={color} />
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>MACD</span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
        >
          {up ? '▲ Bullish' : '▼ Bearish'}
        </span>
      </div>

      {/* 3 values */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'MACD',      val: macd.macd,      c: '#a78bfa' },
          { label: 'Signal',    val: macd.signal,    c: '#fb923c' },
          { label: 'Histogram', val: macd.histogram, c: color },
        ].map(({ label, val, c }) => (
          <div key={label}>
            <p className="text-[9px] mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
            <p className="font-mono text-xs font-semibold" style={{ color: c }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Indicators({ candles }) {
  const closes = candles?.c || []
  const rsi    = computeRSI(closes)
  const macd   = computeMACD(closes)

  return (
    <div className="flex gap-3 flex-wrap">
      <RSICard rsi={rsi} />
      <MACDCard macd={macd} />
    </div>
  )
}
