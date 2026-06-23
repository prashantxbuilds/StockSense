'use client'

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

const TIMEFRAMES = [
  { key: '1D', label: '1D' },
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '1Y', label: '1Y' },
]

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

export default function PredictionControls({
  timeframe,
  onTimeframeChange,
  activeModel,
  onModelChange,
  chartType,
  onChartTypeChange
}) {
  return (
    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full">
      {/* Timeframe pills */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-lg order-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.key}
            onClick={() => onTimeframeChange(tf.key)}
            className="px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all duration-150"
            style={{
              background: timeframe === tf.key ? 'rgba(124,111,238,0.25)' : 'transparent',
              color: timeframe === tf.key ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              border: timeframe === tf.key ? '1px solid rgba(124,111,238,0.4)' : '1px solid transparent',
            }}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Divider 1 */}
      <div className="hidden md:block w-px h-5 order-2" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Model pills */}
      <div className="w-full md:w-auto order-3 md:order-2 grid grid-cols-3 md:flex items-center gap-2">
        {MODELS.map(m => {
          const active = activeModel === m.id
          return (
            <button
              key={m.id}
              onClick={() => onModelChange(m.id)}
              className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-2 rounded-lg transition-all duration-150 w-full md:w-auto"
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

      {/* Divider 2 */}
      <div className="hidden md:block w-px h-5 order-2 md:order-3 md:ml-auto" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Chart Style Toggle (Candles / Line) */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-lg order-2 md:order-4 ml-auto md:ml-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => onChartTypeChange('candles')}
          className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150"
          style={{
            background: chartType === 'candles' ? 'rgba(124,111,238,0.25)' : 'transparent',
            color: chartType === 'candles' ? '#a78bfa' : 'rgba(255,255,255,0.4)',
            border: chartType === 'candles' ? '1px solid rgba(124,111,238,0.4)' : '1px solid transparent',
          }}
        >
          Candles
        </button>
        <button
          onClick={() => onChartTypeChange('line')}
          className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150"
          style={{
            background: chartType === 'line' ? 'rgba(124,111,238,0.25)' : 'transparent',
            color: chartType === 'line' ? '#a78bfa' : 'rgba(255,255,255,0.4)',
            border: chartType === 'line' ? '1px solid rgba(124,111,238,0.4)' : '1px solid transparent',
          }}
        >
          Line
        </button>
      </div>
    </div>
  )
}
