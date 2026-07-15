'use client'

const TIMEFRAMES = [
  { key: '1D', label: '1D' },
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '1Y', label: '1Y' },
]

export default function PredictionControls({
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange
}) {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Box 1: Timeframe pills — left side */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-lg"
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

      {/* Box 2: Candles / Line toggle — right side */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => onChartTypeChange('candles')}
          className="px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150"
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
          className="px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150"
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
