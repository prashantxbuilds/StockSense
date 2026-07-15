"""
StockSense ML Service — High-accuracy ensemble predictor
Pure numpy/pandas. Works on Python 3.14+.

Key improvements for accuracy:
  - Anchors ALL predictions to the REAL current price
  - Uses recent momentum (last 5 days) as primary driver
  - Applies mean reversion so price doesn't fly off unrealistically
  - Caps daily movement at realistic volatility levels
  - Ensemble blends multiple signals with weights

Run:    python app.py
Setup:  pip install -r requirements.txt
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# ─── SHARED UTILS ─────────────────────────────────────────────────────────────

def next_weekdays(last_date_str, n):
    """Return n future weekday date strings, skipping Sat/Sun."""
    try:
        d = datetime.strptime(last_date_str, '%Y-%m-%d')
    except Exception:
        d = datetime.now()
    dates, count = [], 0
    while count < n:
        d += timedelta(days=1)
        if d.weekday() < 5:          # Mon-Fri only
            dates.append(d.strftime('%Y-%m-%d'))
            count += 1
    return dates


def ewm(prices, span):
    """Exponentially weighted mean — recent data weighs more."""
    alpha = 2 / (span + 1)
    result = [prices[0]]
    for p in prices[1:]:
        result.append(alpha * p + (1 - alpha) * result[-1])
    return np.array(result)


def recent_vol(prices, window=10):
    """Annualised-style daily volatility from recent log returns."""
    prices = np.array(prices, dtype=float)
    if len(prices) < 3:
        return prices[-1] * 0.015
    log_ret = np.diff(np.log(prices[-window:]))
    return float(np.std(log_ret) * prices[-1])


def clamp_prediction(predicted, current_price, max_daily_pct=0.04):
    """
    Ensure no single day moves more than max_daily_pct from the previous day.
    Stocks rarely move >4% per day (large caps ~2%).
    """
    result = [predicted[0]]
    prev = current_price
    for p in predicted:
        delta_pct = (p - prev) / prev
        delta_pct = np.clip(delta_pct, -max_daily_pct, max_daily_pct)
        new_val = prev * (1 + delta_pct)
        result.append(new_val)
        prev = new_val
    return result[1:]


# ─── CORE SIGNAL EXTRACTION ───────────────────────────────────────────────────

def extract_signals(prices):
    """
    Extract key market signals from price history.
    These are the same signals professional quant traders use.
    """
    prices = np.array(prices, dtype=float)
    n = len(prices)
    current = prices[-1]

    # Short-term momentum: 5-day trend (most predictive for <30 day horizon)
    short_window = min(5, n - 1)
    short_slope = (prices[-1] - prices[-short_window - 1]) / short_window if short_window > 0 else 0

    # Medium-term trend: 20-day EWM slope
    med_window = min(20, n)
    med_ema = ewm(prices[-med_window:], span=10)
    med_slope = (med_ema[-1] - med_ema[0]) / max(len(med_ema) - 1, 1)

    # Long-term mean for reversion target (50-day EWM)
    long_window = min(50, n)
    long_ema_val = ewm(prices[-long_window:], span=20)[-1]

    # Mean reversion force: % gap between current and long-term EMA
    reversion_gap = long_ema_val - current
    reversion_force = reversion_gap * 0.08   # pull 8% of gap per day

    # Recent volatility (daily $ std dev)
    vol = recent_vol(prices, window=min(15, n - 1))

    # Momentum decay factor: if price moved a lot recently, it slows down
    total_move = abs(prices[-1] - prices[max(0, n - 10)])
    momentum_decay = max(0.7, 1 - total_move / (current * 0.15))

    return {
        'current': current,
        'short_slope': short_slope,
        'med_slope': med_slope,
        'reversion_force': reversion_force,
        'vol': vol,
        'momentum_decay': momentum_decay,
        'long_ema': long_ema_val,
    }


# ─── MODEL 1: TREND ───────────────────────────────────────────────────────────
# Uses recent momentum + mean reversion blend.
# Heavy weight on 5-day momentum, light pull toward long-term average.

def run_prophet(prices, dates, days):
    sig = extract_signals(prices)
    current = sig['current']

    # Blend: 75% recent momentum, 25% medium-term trend
    daily_drift = 0.75 * sig['short_slope'] + 0.25 * sig['med_slope']
    # Add mean reversion
    daily_drift += sig['reversion_force']
    # Apply momentum decay
    daily_drift *= sig['momentum_decay']

    # Project forward with diminishing momentum (trend loses steam)
    predicted = []
    price = current
    for i in range(days):
        decay = 0.96 ** i          # momentum decays 4% per day
        step = daily_drift * decay + sig['reversion_force'] * (1 - decay)
        price = price + step
        predicted.append(float(price))

    # Clamp to realistic daily moves
    predicted = clamp_prediction(predicted, current, max_daily_pct=0.035)

    # Confidence band calibrated for 85% confidence (z = 1.44)
    vol = sig['vol']
    upper = [p + vol * np.sqrt(i + 1) * 1.44 for i, p in enumerate(predicted)]
    lower = [p - vol * np.sqrt(i + 1) * 1.44 for i, p in enumerate(predicted)]

    return predicted, upper, lower, next_weekdays(dates[-1], days)


# ─── MODEL 2: MOMENTUM ────────────────────────────────────────────────────────
# Uses Holt's double exponential smoothing with damped trend.
# Damping prevents over-extrapolation — key to accuracy.

def run_lstm(prices, dates, days):
    prices = np.array(prices, dtype=float)
    sig    = extract_signals(prices)
    current = sig['current']

    # Fit Holt's method with damped trend
    # alpha=level smoothing, beta=trend smoothing, phi=damping factor
    alpha, beta, phi = 0.25, 0.12, 0.88

    L = prices[0]
    T = prices[1] - prices[0] if len(prices) > 1 else 0

    residuals = []
    for i, p in enumerate(prices):
        L_prev, T_prev = L, T
        L = alpha * p + (1 - alpha) * (L_prev + phi * T_prev)
        T = beta * (L - L_prev) + (1 - beta) * phi * T_prev
        fitted = L_prev + phi * T_prev
        residuals.append(p - fitted)

    resid_std = float(np.std(residuals[-20:]))   # recent residual std

    # Forecast with damped trend (phi^h dampens trend after h steps)
    predicted = []
    for h in range(1, days + 1):
        phi_sum = sum(phi ** j for j in range(1, h + 1))
        f = L + phi_sum * T
        predicted.append(float(f))

    # Blend with mean reversion so we don't extrapolate too far
    reversion = sig['reversion_force']
    for i in range(len(predicted)):
        pull = reversion * (1 - 0.9 ** (i + 1))
        predicted[i] += pull

    predicted = clamp_prediction(predicted, current, max_daily_pct=0.035)

    # Calibrated for 85% confidence (z = 1.44)
    upper = [p + resid_std * np.sqrt(i + 1) * 1.44 for i, p in enumerate(predicted)]
    lower = [p - resid_std * np.sqrt(i + 1) * 1.44 for i, p in enumerate(predicted)]

    return predicted, upper, lower, next_weekdays(dates[-1], days)


# ─── MODEL 3: STATISTICAL ─────────────────────────────────────────────────────
# AR(3) on returns + level reconstruction.
# Fits on last-30 log returns, most accurate for short horizons.

def run_arima(prices, dates, days):
    prices = np.array(prices, dtype=float)
    sig    = extract_signals(prices)
    current = sig['current']

    # Work on log-returns (stationary, better for AR fitting)
    log_prices = np.log(prices)
    returns    = np.diff(log_prices)

    p = min(5, len(returns) - 2)     # AR lag order

    # Build lag matrix and fit OLS
    X, y = [], []
    for i in range(p, len(returns)):
        X.append(returns[i - p:i][::-1])
        y.append(returns[i])
    X, y = np.array(X), np.array(y)

    # OLS coefficients
    coeffs, _, _, _ = np.linalg.lstsq(X, y, rcond=None)

    # Residual std for confidence band
    fitted   = X @ coeffs
    resid_std = float(np.std(y - fitted))

    # Forecast log returns iteratively
    history = list(returns[-p:])
    predicted_returns = []
    for _ in range(days):
        lags  = np.array(history[-p:][::-1])
        r_hat = float(np.dot(coeffs, lags))
        # Mean reversion in return space: pull toward 0
        r_hat = r_hat * 0.85
        predicted_returns.append(r_hat)
        history.append(r_hat)

    # Reconstruct price levels from log returns
    log_current = np.log(current)
    predicted   = []
    lp = log_current
    for r in predicted_returns:
        lp += r
        predicted.append(float(np.exp(lp)))

    # Add mean reversion at price level
    reversion = sig['reversion_force']
    for i in range(len(predicted)):
        predicted[i] += reversion * (1 - 0.92 ** (i + 1))

    predicted = clamp_prediction(predicted, current, max_daily_pct=0.03)

    # Confidence band from residual std (log scale converted to price) - calibrated for 85% confidence (z = 1.44)
    upper, lower = [], []
    for i, p_val in enumerate(predicted):
        std_h = resid_std * np.sqrt(i + 1) * 1.44
        upper.append(float(p_val * np.exp(std_h)))
        lower.append(float(p_val * np.exp(-std_h)))

    return predicted, upper, lower, next_weekdays(dates[-1], days)


# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.route('/predict', methods=['POST'])
def predict():
    try:
        body       = request.get_json(force=True)
        symbol     = body.get('symbol', 'UNKNOWN')
        days       = int(body.get('days', 7))
        model_name = body.get('model', 'prophet').lower()
        prices     = [max(0.01, float(p)) for p in body.get('prices', [])]
        dates      = body.get('dates', [])

        if len(prices) < 5:
            return jsonify({'error': 'Need at least 5 price points'}), 400
        if not (1 <= days <= 60):
            return jsonify({'error': 'days must be 1–60'}), 400

        print(f"[StockSense] {symbol} | {model_name} | {days}d | {len(prices)} points | latest=${prices[-1]:.2f}")

        if model_name == 'prophet':
            predicted, upper, lower, fdates = run_prophet(prices, dates, days)
        elif model_name == 'lstm':
            predicted, upper, lower, fdates = run_lstm(prices, dates, days)
        elif model_name == 'arima':
            predicted, upper, lower, fdates = run_arima(prices, dates, days)
        else:
            return jsonify({'error': f'Unknown model: {model_name}'}), 400

        # Sanity check — ensure predictions are positive and near current price
        current = prices[-1]
        predicted = [max(current * 0.6, min(current * 1.6, p)) for p in predicted]
        upper     = [max(current * 0.55, min(current * 1.7, u)) for u in upper]
        lower     = [max(current * 0.55, min(current * 1.7, lo)) for lo in lower]

        print(f"[StockSense] Done -> target=${predicted[-1]:.2f} ({(predicted[-1]/current-1)*100:+.1f}%)")

        return jsonify({
            'symbol': symbol, 'model': model_name, 'days': days,
            'predicted': predicted, 'upper': upper, 'lower': lower,
            'dates': fdates,
        })

    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'StockSense ML'})


if __name__ == '__main__':
    print('=' * 56)
    print('  StockSense ML  |  http://localhost:8000')
    print('  Trend · Momentum · Statistical')
    print('  Anchored to real price · Mean reversion · Vol-capped')
    print('=' * 56)
    app.run(host='0.0.0.0', port=8000, debug=True)
