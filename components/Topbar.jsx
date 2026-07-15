'use client'
import { useState, useRef, useEffect } from 'react'

const MODEL_META = {
  prophet: { label: 'Trend',       emoji: '↗', color: '#7c6fee' },
  lstm:    { label: 'Momentum',    emoji: '〜', color: '#4ade80' },
  arima:   { label: 'Statistical', emoji: '▐', color: '#fb923c' },
}

export default function Topbar({ symbol, onSymbolChange, activeModel }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleInput = (val) => {
    setQuery(val)
    setOpen(true)
    setActiveIndex(-1)
    clearTimeout(debounceRef.current)
    if (!val.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/${encodeURIComponent(val)}`)
        const data = await res.json()
        setResults((data.result || []).filter(r => r.type === 'Common Stock').slice(0, 7))
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 350)
  }

  const handleSelect = (sym) => {
    setQuery('')
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
    onSymbolChange(sym.trim().toUpperCase())
  }

  const trimmed = query.trim().toUpperCase()
  // Show dropdown if: loading, has results, OR user has typed something (to show direct-load option)
  const showDropdown = open && trimmed.length > 0
  const totalItems = results.length + 1 // +1 for "Load directly" button

  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === 'Enter' && query.trim()) {
        handleSelect(query.trim())
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex === 0) {
        handleSelect(trimmed)
      } else if (activeIndex > 0 && results[activeIndex - 1]) {
        handleSelect(results[activeIndex - 1].symbol)
      } else {
        handleSelect(trimmed)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setResults([])
      setActiveIndex(-1)
    }
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(8,12,24,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3">
        {/* Logo — wordmark only */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="font-bold text-base sm:text-lg tracking-tight" style={{ color: '#a78bfa' }}>StockSense</span>
          <span
            className="hidden xs:inline text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(124,111,238,0.2)', color: '#7c6fee', border: '1px solid rgba(124,111,238,0.3)' }}
          >
            BETA
          </span>
        </div>

        {/* Search bar */}
        <div className="flex-1 sm:relative min-w-0">
          <div
            className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all duration-200"
            style={{
              background: 'rgba(13,16,32,0.9)',
              border: `1px solid ${open && trimmed ? 'rgba(124,111,238,0.5)' : 'rgba(124,111,238,0.2)'}`,
              boxShadow: open && trimmed ? '0 0 0 3px rgba(124,111,238,0.1)' : 'none',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => trimmed && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder={`Search or type ticker… (${symbol})`}
              className="flex-1 bg-transparent outline-none text-xs sm:text-sm min-w-0"
              style={{ color: '#e2e8f0' }}
            />
            {/* Clear button when typing */}
            {query && (
              <button
                onMouseDown={() => { setQuery(''); setResults([]); setOpen(false) }}
                className="shrink-0 opacity-40 hover:opacity-80 transition-opacity"
                style={{ color: '#e2e8f0' }}
                tabIndex={-1}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
            {!query && (
              <kbd
                className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span>⌘</span><span>K</span>
              </kbd>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute top-full left-3 right-3 sm:left-0 sm:right-0 mt-1 rounded-xl overflow-hidden z-50 animate-fade-in"
              style={{ background: '#0d1020', border: '1px solid rgba(124,111,238,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            >
              {/* ── Direct load row — ALWAYS shown when user has typed ── */}
              <button
                onMouseDown={() => handleSelect(trimmed)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{
                  borderBottom: (loading || results.length > 0) ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  background: activeIndex === 0 ? 'rgba(124,111,238,0.1)' : 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,111,238,0.1)'}
                onMouseLeave={e => { if (activeIndex !== 0) e.currentTarget.style.background = 'transparent' }}
              >
                <div
                  className="flex items-center justify-center shrink-0 rounded-lg"
                  style={{ width: 32, height: 24, background: 'rgba(124,111,238,0.2)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round">
                    <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: '#a78bfa' }}>
                    Load <span className="font-mono">{trimmed}</span> directly
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Press Enter or click — works for any valid ticker
                  </p>
                </div>
                <kbd
                  className="hidden sm:flex shrink-0 items-center px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: 'rgba(124,111,238,0.15)', color: '#7c6fee', border: '1px solid rgba(124,111,238,0.3)' }}
                >
                  ↵
                </kbd>
              </button>

              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin shrink-0" style={{ borderColor: '#7c6fee', borderTopColor: 'transparent' }} />
                  <span className="text-xs">Searching…</span>
                </div>
              )}

              {/* Search results */}
              {!loading && results.length === 0 && (
                <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    No search results — use "Load directly" above to try anyway
                  </p>
                </div>
              )}

              {results.map((r, i) => {
                const isActive = activeIndex === i + 1
                return (
                  <button
                    key={i}
                    onMouseDown={() => handleSelect(r.symbol)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      background: isActive ? 'rgba(124,111,238,0.08)' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,111,238,0.08)'}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span
                      className="px-2 py-0.5 shrink-0 text-center text-xs font-bold rounded"
                      style={{ background: 'rgba(124,111,238,0.15)', color: '#a78bfa', minWidth: '3.5rem' }}
                    >
                      {r.displaySymbol}
                    </span>
                    <span className="text-xs sm:text-sm truncate" style={{ color: '#e2e8f0' }}>{r.description}</span>
                    <span className="ml-auto text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.type}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right area */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Active model indicator */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{
              background: `${MODEL_META[activeModel]?.color || '#7c6fee'}18`,
              border: `1px solid ${MODEL_META[activeModel]?.color || '#7c6fee'}40`,
              color: MODEL_META[activeModel]?.color || '#7c6fee'
            }}
          >
            <span>{MODEL_META[activeModel]?.emoji}</span>
            <span>{MODEL_META[activeModel]?.label}</span>
          </div>

          {/* Live pill */}
          <div
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold"
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: '#4ade80', animation: 'blink 1.4s infinite' }}
            />
            LIVE
          </div>
        </div>
      </div>
    </header>
  )
}
