'use client'
import { useState, useEffect } from 'react'

function timeAgo(ts) {
  const diff = Math.floor((Date.now() / 1000 - ts) / 3600)
  if (diff < 1) return 'Just now'
  if (diff < 24) return `${diff}h ago`
  return `${Math.floor(diff / 24)}d ago`
}

export default function NewsFeed({ symbol }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    fetch(`/api/news/${symbol}`)
      .then(r => r.json())
      .then(data => {
        setNews(Array.isArray(data) && !data.error ? data : [])
      })
      .catch(e => {
        console.warn(`Could not load news for ${symbol}:`, e.message)
        setNews([])
      })
      .finally(() => setLoading(false))
  }, [symbol])

  if (!loading && news.length === 0) {
    return null
  }

  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-in"
      style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c6fee" strokeWidth="2" strokeLinecap="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/>
        </svg>
        <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>News Feed</span>
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(124,111,238,0.1)', color: '#7c6fee' }}
        >
          {symbol}
        </span>
      </div>

      <div className="news-scroll divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 space-y-2">
            <div className="skeleton w-3/4 h-3" />
            <div className="skeleton w-1/2 h-2.5" />
          </div>
        ))}

        {news.map((item, i) => (
          <a
            key={item.id || i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 transition-colors group"
            style={{ textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,111,238,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <p
              className="text-xs leading-snug line-clamp-2 mb-1.5 transition-colors"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              {item.headline}
            </p>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
              >
                {item.source}
              </span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {timeAgo(item.datetime)}
              </span>
              <svg
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c6fee" strokeWidth="2.5"
              >
                <path d="M7 17 17 7M7 7h10v10"/>
              </svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
