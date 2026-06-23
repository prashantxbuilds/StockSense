import { useState, useEffect, useRef, useCallback } from 'react'
import { getCurrencySymbol, getCurrencyForSymbol } from '@/lib/utils'

const MODEL_COLORS = {
  prophet: '#7c6fee',
  lstm: '#4ade80',
  arima: '#fb923c',
}

export default function StockChart({ candles, prediction, activeModel, timeframe, chartType, symbol }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const histSeriesRef = useRef(null)
  const predSeriesRef = useRef(null)
  const upperSeriesRef = useRef(null)
  const lowerSeriesRef = useRef(null)
  const dividerRef = useRef(null)

  // Filter candles by timeframe
  const filterCandles = useCallback((data, tf) => {
    if (!data || !data.t) return []
    const now = Math.floor(Date.now() / 1000)
    const cutoffs = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }
    const days = cutoffs[tf] || 30
    const from = now - days * 24 * 60 * 60

    const raw = data.t
      .map((t, i) => {
        const d = new Date(t * 1000)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return {
          time: `${y}-${m}-${day}`,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          rawTime: t
        }
      })
      .filter(d => d.rawTime >= from)

    // lightweight-charts requires strictly ascending unique timestamps
    // Deduplicate by keeping the LAST bar per date string, then sort ascending
    const seen = new Map()
    for (const bar of raw) seen.set(bar.time, bar)
    return Array.from(seen.values()).sort((a, b) => a.time < b.time ? -1 : 1)
  }, [])

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return

    let ro

    const initChart = async () => {
      const { createChart, CrosshairMode, LineStyle, CandlestickSeries, LineSeries, AreaSeries } = await import('lightweight-charts')

      // Destroy existing chart and tooltip
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      const existingTooltip = containerRef.current?.querySelector('.chart-tooltip')
      if (existingTooltip) {
        existingTooltip.remove()
      }
      if (!containerRef.current) return

      // Responsive chart height
      const containerWidth = containerRef.current.clientWidth
      const chartHeight = containerWidth < 480 ? 240 : containerWidth < 768 ? 290 : 340

      const chart = createChart(containerRef.current, {
        width: containerWidth,
        height: chartHeight,
        layout: {
          background: { color: '#0d1020' },
          textColor: 'rgba(255,255,255,0.45)',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.04)' },
          horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: 'rgba(124,111,238,0.4)', style: LineStyle.Dashed },
          horzLine: { color: 'rgba(124,111,238,0.4)', style: LineStyle.Dashed },
        },
        rightPriceScale: {
          borderColor: 'rgba(255,255,255,0.06)',
          textColor: 'rgba(255,255,255,0.4)',
        },
        timeScale: {
          borderColor: 'rgba(255,255,255,0.06)',
          textColor: 'rgba(255,255,255,0.4)',
          rightOffset: prediction?.predicted?.length ? prediction.predicted.length + 2 : 4,
          fixLeftEdge: true,
        },
        handleScroll: true,
        handleScale: true,
      })

      chartRef.current = chart

      // Historical series (either Area/Line or Candlestick)
      const histSeries = chartType === 'line'
        ? chart.addSeries(AreaSeries, {
            topColor: 'rgba(124, 111, 238, 0.25)',
            bottomColor: 'rgba(124, 111, 238, 0.01)',
            lineColor: '#7c6fee',
            lineWidth: 2.5,
          })
        : chart.addSeries(CandlestickSeries, {
            upColor: '#4ade80',
            downColor: '#f87171',
            borderUpColor: '#4ade80',
            borderDownColor: '#f87171',
            wickUpColor: '#4ade80',
            wickDownColor: '#f87171',
          })
      histSeriesRef.current = histSeries

      const filteredCandles = filterCandles(candles, timeframe)
      if (filteredCandles.length > 0) {
        if (chartType === 'line') {
          histSeries.setData(filteredCandles.map(c => ({ time: c.time, value: c.close })))
        } else {
          histSeries.setData(filteredCandles)
        }
      }

      const modelColor = MODEL_COLORS[activeModel] || '#7c6fee'

      // Upper confidence band
      const upperSeries = chart.addSeries(LineSeries, {
        color: `${modelColor}25`,
        lineWidth: 1,
        lineStyle: 0,
        lastValueVisible: false,
        priceLineVisible: false,
        crossHairMarkerVisible: false,
      })
      upperSeriesRef.current = upperSeries

      // Lower confidence band
      const lowerSeries = chart.addSeries(LineSeries, {
        color: `${modelColor}25`,
        lineWidth: 1,
        lineStyle: 0,
        lastValueVisible: false,
        priceLineVisible: false,
        crossHairMarkerVisible: false,
      })
      lowerSeriesRef.current = lowerSeries

      // Prediction line (dashed)
      const predSeries = chart.addSeries(LineSeries, {
        color: modelColor,
        lineWidth: 2,
        lineStyle: 2,
        lastValueVisible: true,
        priceLineVisible: false,
        title: 'Forecast',
        crossHairMarkerRadius: 5,
      })
      predSeriesRef.current = predSeries

      // Plot prediction data
      if (prediction?.predicted?.length && filteredCandles.length) {
        const lastCandle   = filteredCandles[filteredCandles.length - 1]
        const lastTime     = lastCandle.time

        const predData  = [{ time: lastTime, value: lastCandle.close }]
        const upperData = [{ time: lastTime, value: lastCandle.close }]
        const lowerData = [{ time: lastTime, value: lastCandle.close }]

        prediction.predicted.forEach((price, i) => {
          const dateStr = prediction.dates?.[i]
          if (dateStr) {
            predData.push({ time: dateStr, value: price })
            if (prediction.upper?.[i]) upperData.push({ time: dateStr, value: prediction.upper[i] })
            if (prediction.lower?.[i]) lowerData.push({ time: dateStr, value: prediction.lower[i] })
          }
        })

        predSeries.setData(predData)
        upperSeries.setData(upperData)
        lowerSeries.setData(lowerData)
      }

      // Resize observer — also update height on resize
      ro = new ResizeObserver(() => {
        if (chartRef.current && containerRef.current) {
          const w = containerRef.current.clientWidth
          const h = w < 480 ? 240 : w < 768 ? 290 : 340
          chartRef.current.applyOptions({ width: w, height: h })
        }
      })
      ro.observe(containerRef.current)

      chart.timeScale().fitContent()

      // Create Tooltip DOM element
      const tooltip = document.createElement('div')
      tooltip.className = 'chart-tooltip'
      tooltip.style.position = 'absolute'
      tooltip.style.display = 'none'
      tooltip.style.padding = '10px 14px'
      tooltip.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)'
      tooltip.style.background = 'rgba(13, 16, 32, 0.95)'
      tooltip.style.backdropFilter = 'blur(12px)'
      tooltip.style.border = '1px solid rgba(124, 111, 238, 0.25)'
      tooltip.style.borderRadius = '10px'
      tooltip.style.color = '#e2e8f0'
      tooltip.style.fontSize = '11px'
      tooltip.style.fontFamily = 'Inter, sans-serif'
      tooltip.style.zIndex = '50'
      tooltip.style.pointerEvents = 'none'
      tooltip.style.transition = 'left 0.05s ease, top 0.05s ease'
      containerRef.current.appendChild(tooltip)

      // Subscribe to crosshair move
      chart.subscribeCrosshairMove((param) => {
        const currentHeight = containerRef.current ? containerRef.current.clientHeight : 340
        if (
          !param ||
          !param.point ||
          !param.time ||
          param.point.x < 0 ||
          param.point.x > containerRef.current.clientWidth ||
          param.point.y < 0 ||
          param.point.y > currentHeight
        ) {
          tooltip.style.display = 'none'
          return
        }

        const histData = param.seriesData.get(histSeries)
        const predData = param.seriesData.get(predSeries)
        const upperData = param.seriesData.get(upperSeries)
        const lowerData = param.seriesData.get(lowerSeries)

        let dateStr = ''
        if (typeof param.time === 'string') {
          dateStr = param.time
        } else {
          const d = param.time
          dateStr = d.year 
            ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
            : new Date(d * 1000).toLocaleDateString()
        }

        const currencyCode = getCurrencyForSymbol(symbol)
        const cs = getCurrencySymbol(currencyCode)

        let html = `<div style="font-weight: 700; color: #a78bfa; margin-bottom: 6px; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;">${dateStr}</div>`

        if (histData) {
          if (histData.open !== undefined) {
            // Candlestick
            const isUp = histData.close >= histData.open
            const color = isUp ? '#4ade80' : '#f87171'
            html += `
              <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
                <span style="color: rgba(255,255,255,0.4)">Type:</span> <span style="font-weight: 600; color: #a78bfa;">Historical</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
                <span style="color: rgba(255,255,255,0.4)">Open:</span> <span style="font-family: monospace;">${cs}${histData.open.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
                <span style="color: rgba(255,255,255,0.4)">High:</span> <span style="font-family: monospace; color: #4ade80;">${cs}${histData.high.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
                <span style="color: rgba(255,255,255,0.4)">Low:</span> <span style="font-family: monospace; color: #f87171;">${cs}${histData.low.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
                <span style="color: rgba(255,255,255,0.4)">Close:</span> <span style="font-family: monospace; font-weight: 600; color: ${color};">${cs}${histData.close.toFixed(2)}</span>
              </div>
            `
          } else {
            // Line/Area
            html += `
              <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
                <span style="color: rgba(255,255,255,0.4)">Type:</span> <span style="font-weight: 600; color: #a78bfa;">Historical</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
                <span style="color: rgba(255,255,255,0.4)">Price:</span> <span style="font-family: monospace; font-weight: 600; color: #7c6fee;">${cs}${histData.value.toFixed(2)}</span>
              </div>
            `
          }
        } else if (predData) {
          const forecastPrice = predData.value
          const upperVal = upperData?.value
          const lowerVal = lowerData?.value
          const modelColor = MODEL_COLORS[activeModel] || '#7c6fee'

          html += `
            <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
              <span style="color: rgba(255,255,255,0.4)">Type:</span> <span style="font-weight: 600; color: ${modelColor}">Forecast</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
              <span style="color: rgba(255,255,255,0.4)">Target:</span> <span style="font-family: monospace; font-weight: 600; color: ${modelColor};">${cs}${forecastPrice.toFixed(2)}</span>
            </div>
          `
          if (upperVal && lowerVal) {
            html += `
              <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
                <span style="color: rgba(255,255,255,0.4)">Range Min:</span> <span style="font-family: monospace; color: #f87171;">${cs}${lowerVal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0;">
                <span style="color: rgba(255,255,255,0.4)">Range Max:</span> <span style="font-family: monospace; color: #4ade80;">${cs}${upperVal.toFixed(2)}</span>
              </div>
            `
          }
        } else {
          tooltip.style.display = 'none'
          return
        }

        tooltip.innerHTML = html
        tooltip.style.display = 'block'

        // Tooltip positioning (responsive)
        const tooltipWidth = containerRef.current.clientWidth < 480 ? 130 : 160
        const tooltipHeight = histData && histData.open !== undefined ? 130 : 75
        const margin = 10
        const chartH = containerRef.current.clientHeight || 340

        let left = param.point.x + margin
        if (left + tooltipWidth > containerRef.current.clientWidth) {
          left = param.point.x - tooltipWidth - margin
        }
        if (left < 0) left = margin

        let top = param.point.y + margin
        if (top + tooltipHeight > chartH) {
          top = param.point.y - tooltipHeight - margin
        }
        if (top < 0) top = margin

        tooltip.style.left = `${left}px`
        tooltip.style.top = `${top}px`
      })
    }

    initChart()

    return () => {
      if (ro) {
        ro.disconnect()
      }
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      // Guard: containerRef may already be null if component unmounted
      const existingTooltip = containerRef.current?.querySelector?.('.chart-tooltip')
      if (existingTooltip) {
        existingTooltip.remove()
      }
    }
  }, [candles, prediction, activeModel, timeframe, filterCandles, chartType])

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Chart header */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: 'linear-gradient(135deg, #4ade80, #f87171)' }}
          />
          Historical
        </div>
        {prediction?.predicted?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: MODEL_COLORS[activeModel] }} />
            Forecast
          </div>
        )}
      </div>

      {/* No-data placeholder */}
      {(!candles || !candles.t) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7c6fee', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading chart data…</p>
        </div>
      )}

      <div ref={containerRef} style={{ minHeight: 'clamp(240px, 30vw, 340px)' }} />
    </div>
  )
}
