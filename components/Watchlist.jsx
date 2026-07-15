'use client'
import { useState } from 'react'
import { formatCurrency, getCurrencyForSymbol, getLogoForStock } from '@/lib/utils'

const DEFAULT_WATCHLIST = [
  { symbol: 'AAPL',  name: 'Apple Inc.' },
  { symbol: 'TSLA',  name: 'Tesla Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.' },
  { symbol: 'MSFT',  name: 'Microsoft Corp.' },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.' },
]

// Fallback gradient per symbol so it's always recognisable even without logo
const SYMBOL_COLORS = {
  AAPL:  ['#555', '#888'],
  TSLA:  ['#c0392b', '#e74c3c'],
  GOOGL: ['#1a73e8', '#4285f4'],
  NVDA:  ['#76b900', '#a3d600'],
  MSFT:  ['#0078d4', '#00bcf2'],
  AMZN:  ['#ff9900', '#ffb347'],
}

function LogoAvatar({ symbol, logoUrl, size = 32 }) {
  const [imgFailed, setImgFailed] = useState(false)
  const colors = SYMBOL_COLORS[symbol] || ['#7c6fee', '#a78bfa']

  const logo = logoUrl || getLogoForStock(symbol)

  if (logo && !imgFailed) {
    return (
      <img
        src={logo}
        alt={symbol}
        width={size}
        height={size}
        onError={() => setImgFailed(true)}
        style={{
          width: size, height: size,
          borderRadius: 8,
          objectFit: 'contain',
          background: '#fff',
          padding: 3,
          flexShrink: 0,
        }}
      />
    )
  }

  // Gradient fallback with first 2 letters
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.3, fontWeight: 700, color: '#fff',
        flexShrink: 0,
      }}
    >
      {symbol.slice(0, 2)}
    </div>
  )
}

export default function Watchlist({
  activeSymbol,
  onSelect,
  quotes,
  logos = {},
  symbols = [],
  names = {},
  horizontal = false
}) {
  const watchlistItems = symbols.length > 0
    ? symbols.map(s => ({ symbol: s, name: names[s] || '' }))
    : DEFAULT_WATCHLIST

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c6fee" strokeWidth="2" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Watchlist</span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(124,111,238,0.15)', color: '#7c6fee' }}
        >
          {watchlistItems.length}
        </span>
      </div>

      {/* Items — vertical on desktop sidebar, horizontal scroll on mobile */}
      {horizontal ? (
        // HORIZONTAL MODE (mobile — inside a row)
        <div className="scroll-x-mobile px-2 py-2">
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
            {watchlistItems.map((item) => {
              const q        = quotes?.[item.symbol]
              const price    = q?.c
              const change   = q?.dp
              const isActive = item.symbol === activeSymbol
              const isUp     = (change ?? 0) >= 0
              const logoUrl  = logos?.[item.symbol]

              return (
                <button
                  key={item.symbol}
                  onClick={() => onSelect(item.symbol)}
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-150 shrink-0"
                  style={{
                    background: isActive ? 'rgba(124,111,238,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isActive ? '1px solid rgba(124,111,238,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    minWidth: 72,
                  }}
                >
                  <LogoAvatar symbol={item.symbol} logoUrl={logoUrl} size={28} />
                  <p
                    className="text-[11px] font-bold leading-none"
                    style={{ color: isActive ? '#a78bfa' : '#e2e8f0' }}
                  >
                    {item.symbol}
                  </p>
                  {price != null ? (
                    <p
                      className="text-[10px] font-medium"
                      style={{ color: isUp ? '#4ade80' : '#f87171' }}
                    >
                      {isUp ? '+' : ''}{change?.toFixed(2)}%
                    </p>
                  ) : (
                    <div className="skeleton w-8 h-2 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        // VERTICAL MODE (desktop sidebar)
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {watchlistItems.map((item) => {
            const q        = quotes?.[item.symbol]
            const price    = q?.c
            const change   = q?.dp
            const isActive = item.symbol === activeSymbol
            const isUp     = (change ?? 0) >= 0
            const logoUrl  = logos?.[item.symbol]
            const currencyCode = q?.currency || getCurrencyForSymbol(item.symbol)

            return (
              <button
                key={item.symbol}
                onClick={() => onSelect(item.symbol)}
                className="w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-left"
                style={{
                  background: isActive ? 'rgba(124,111,238,0.08)' : 'transparent',
                  borderLeft: isActive ? '2px solid #7c6fee' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Logo */}
                <LogoAvatar symbol={item.symbol} logoUrl={logoUrl} size={32} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-bold leading-tight"
                    style={{ color: isActive ? '#a78bfa' : '#e2e8f0' }}
                  >
                    {item.symbol}
                  </p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {item.name || item.symbol}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  {price != null ? (
                    <>
                      <p className="text-xs font-semibold font-mono" style={{ color: '#e2e8f0' }}>
                        {formatCurrency(price, currencyCode)}
                      </p>
                      <p
                        className="text-[10px] font-medium"
                        style={{ color: isUp ? '#4ade80' : '#f87171' }}
                      >
                        {isUp ? '+' : ''}{change?.toFixed(2)}%
                      </p>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <div className="skeleton w-12 h-2.5 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
                      <div className="skeleton w-8 h-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
