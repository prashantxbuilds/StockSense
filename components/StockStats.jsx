'use client'
import { formatCurrency, formatShortCurrency, getCurrencyForSymbol } from '@/lib/utils'

function StatCard({ label, value, sub }) {
  return (
    <div
      className="flex-1 min-w-0 px-5 py-4 rounded-xl flex flex-col gap-1"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span className="font-semibold text-base truncate" style={{ color: '#e2e8f0' }}>{value || '—'}</span>
      {sub && <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</span>}
    </div>
  )
}

function fmtVol(n) {
  if (!n) return '—'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return String(n)
}

export default function StockStats({ quote, profile, financials }) {
  const currencyCode = profile?.currency || quote?.currency || getCurrencyForSymbol(profile?.ticker || '')
  
  const metrics = financials?.metric || {}
  const w52High = metrics['52WeekHigh'] ? formatCurrency(metrics['52WeekHigh'], currencyCode) : '—'
  const w52Low = metrics['52WeekLow'] ? formatCurrency(metrics['52WeekLow'], currencyCode) : '—'
  const volume = fmtVol(quote?.v || metrics.volume)
  const marketCap = profile?.marketCapitalization ? formatShortCurrency(profile.marketCapitalization, currencyCode) : '—'
  const pe = metrics.peBasicExclExtraTTM ? metrics.peBasicExclExtraTTM.toFixed(2) : '—'
  const beta = metrics.beta ? metrics.beta.toFixed(2) : '—'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <StatCard label="Market Cap" value={marketCap} />
      <StatCard label="52W High" value={w52High} />
      <StatCard label="52W Low" value={w52Low} />
      <StatCard label="Volume" value={volume} />
      <StatCard label="P/E Ratio" value={pe} />
      <StatCard label="Beta" value={beta} />
    </div>
  )
}

