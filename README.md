# StockSense 📈

> AI-Powered Stock Prediction Platform — Next.js 14 + Python ML

![Dark theme stock dashboard with interactive charts and AI predictions]

## Features

- **Real-time data** from Finnhub API (quotes, candles, news, financials)
- **3 AI models**: Facebook Prophet, 2-layer LSTM (Keras), ARIMA (pmdarima)
- **Lightweight charts** with candlestick + prediction overlay
- **Technical indicators**: RSI gauge, MACD card (computed client-side)
- **Watchlist** with live price refreshes every 30s
- **AI Insight sidebar** with confidence bar and sentiment
- **News feed** with Finnhub company news
- **Download CSV** — historical + predicted data
- **⌘K search** with Finnhub autocomplete
- **Responsive** — desktop sidebar collapses to bottom on mobile

---

## Quick Start

### 1. Get a Finnhub API Key (Free)
1. Sign up at [https://finnhub.io](https://finnhub.io)
2. Copy your API key from the dashboard

### 2. Configure Environment
Edit `.env.local`:
```
FINNHUB_API_KEY=your_actual_key_here
ML_SERVICE_URL=http://localhost:8000
```

### 3. Run Next.js Frontend + API
```bash
# In the project root
npm install
npm run dev
# → http://localhost:3000
```

### 4. Run Python ML Service (optional but required for predictions)
```bash
# In a separate terminal
cd ml
pip install -r requirements.txt
python app.py
# → http://localhost:8000
```

> **Note:** If the ML service is offline, the chart and all data still work — only the prediction overlay will be missing.

---

## Project Structure

```
stocksense/
├── app/
│   ├── layout.jsx              # Root layout + SEO metadata
│   ├── page.jsx                # Main dashboard page (all UI state)
│   ├── globals.css             # Global styles, CSS variables, animations
│   └── api/
│       ├── quote/[symbol]/     # GET current price (Finnhub)
│       ├── candles/[symbol]/   # GET 60-day OHLCV (Finnhub)
│       ├── search/[query]/     # GET ticker search (Finnhub)
│       ├── profile/[symbol]/   # GET company profile (Finnhub)
│       ├── news/[symbol]/      # GET company news (Finnhub)
│       ├── financials/[symbol]/# GET 52W high/low, P/E, beta
│       └── predict/            # POST → Python ML service
│
├── components/
│   ├── Topbar.jsx              # Logo + search bar + Live pill
│   ├── StockChart.jsx          # TradingView lightweight-charts
│   ├── PredictionControls.jsx  # Timeframe + model pills
│   ├── PredictionBand.jsx      # Price range + BULLISH/BEARISH badge
│   ├── StockStats.jsx          # Market cap, 52W high/low, volume, P/E
│   ├── Indicators.jsx          # RSI gauge + MACD card
│   ├── Watchlist.jsx           # Sidebar watchlist with live prices
│   ├── AIInsight.jsx           # AI confidence + sentiment card
│   └── NewsFeed.jsx            # Finnhub news feed
│
├── lib/
│   └── finnhub.js              # Finnhub API helpers
│
├── ml/
│   ├── app.py                  # Flask ML microservice
│   └── requirements.txt        # Python dependencies
│
└── .env.local                  # API keys (not committed)
```

---

## ML Models

| Model | Library | Best For |
|-------|---------|----------|
| **Prophet** | `prophet` (Facebook) | Stocks with seasonal trends |
| **LSTM** | `tensorflow` / `keras` | Non-linear momentum patterns |
| **ARIMA** | `pmdarima` (auto_arima) | Statistical baseline with CI |

### ML Service API
```
POST http://localhost:8000/predict
Content-Type: application/json

{
  "symbol": "AAPL",
  "days": 7,
  "model": "prophet",    // "prophet" | "lstm" | "arima"
  "prices": [150.2, 151.3, ...],
  "dates": ["2024-01-01", ...]
}

→ {
  "symbol": "AAPL",
  "model": "prophet",
  "days": 7,
  "predicted": [152.1, 153.4, ...],
  "upper": [155.2, 156.8, ...],
  "lower": [149.0, 150.1, ...],
  "dates": ["2024-01-08", ...]
}
```

---

## Colors & Design

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#080c18` | Page background |
| `surface` | `#0d1020` | Cards, panels |
| `purple` | `#7c6fee` | Prophet, accent |
| `purple-light` | `#a78bfa` | Highlights |
| `green` | `#4ade80` | LSTM, bullish |
| `orange` | `#fb923c` | ARIMA |
| `red` | `#f87171` | Bearish, lows |

---

## Tech Stack

- **Framework**: Next.js 14 App Router
- **Styling**: Tailwind CSS + custom CSS variables
- **Charts**: lightweight-charts (TradingView)
- **Data**: Finnhub REST API
- **ML**: Python Flask + Prophet + Keras LSTM + pmdarima ARIMA
- **Language**: JavaScript (no TypeScript)
