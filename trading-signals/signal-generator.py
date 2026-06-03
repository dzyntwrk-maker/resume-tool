#!/usr/bin/env python3
"""
Dizzy Signals — Trading Signal Newsletter Generator
Tier 5 #26 | Dizzy Inc | dzyntwrk.gumroad.com

Usage:
    python signal-generator.py --tickers SPY,QQQ,BTC-USD --output newsletter
    python signal-generator.py --tickers AAPL,TSLA,ETH-USD --output html
    python signal-generator.py --tickers SPY --output text
"""

import argparse
import sys
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import yfinance as yf
from jinja2 import Template

# ---------------------------------------------------------------------------
# Technical indicator calculations
# ---------------------------------------------------------------------------

def calculate_rsi(close: pd.Series, period: int = 14) -> float:
    """Calculate Relative Strength Index."""
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return round(float(rsi.iloc[-1]), 2)


def calculate_macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> dict:
    """Calculate MACD line, signal line, and histogram."""
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return {
        "macd": round(float(macd_line.iloc[-1]), 4),
        "signal": round(float(signal_line.iloc[-1]), 4),
        "histogram": round(float(histogram.iloc[-1]), 4),
        "crossover": "bullish" if macd_line.iloc[-1] > signal_line.iloc[-1] else "bearish",
    }


def calculate_bollinger_bands(close: pd.Series, period: int = 20, std_dev: float = 2.0) -> dict:
    """Calculate Bollinger Bands and return position relative to bands."""
    sma = close.rolling(window=period).mean()
    std = close.rolling(window=period).std()
    upper = sma + std_dev * std
    lower = sma - std_dev * std
    price = close.iloc[-1]
    band_width = float(upper.iloc[-1] - lower.iloc[-1])
    pct_b = float((price - lower.iloc[-1]) / band_width) if band_width != 0 else 0.5
    position = "lower" if pct_b < 0.2 else ("upper" if pct_b > 0.8 else "middle")
    return {
        "upper": round(float(upper.iloc[-1]), 2),
        "middle": round(float(sma.iloc[-1]), 2),
        "lower": round(float(lower.iloc[-1]), 2),
        "pct_b": round(pct_b, 3),
        "position": position,
    }


def calculate_ma_crossover(close: pd.Series) -> dict:
    """Calculate 50-day and 200-day moving average crossover (Golden/Death Cross)."""
    ma50 = close.rolling(window=50).mean()
    ma200 = close.rolling(window=200).mean()
    above = float(ma50.iloc[-1]) > float(ma200.iloc[-1])
    # Check if a crossover happened in the last 5 bars
    recent_cross = None
    if len(ma50) >= 6 and len(ma200) >= 6:
        prev_above = float(ma50.iloc[-6]) > float(ma200.iloc[-6])
        if above and not prev_above:
            recent_cross = "golden"
        elif not above and prev_above:
            recent_cross = "death"
    return {
        "ma50": round(float(ma50.iloc[-1]), 2),
        "ma200": round(float(ma200.iloc[-1]), 2),
        "above_200": above,
        "recent_cross": recent_cross,
    }


# ---------------------------------------------------------------------------
# Signal generation
# ---------------------------------------------------------------------------

def generate_signal(rsi: float, macd: dict, bb: dict, ma: dict) -> dict:
    """
    Generate a consensus signal based on confluence of indicators.
    Requires 2+ indicators to agree before issuing BUY or SELL.
    """
    scores = {"buy": 0, "sell": 0, "hold": 0}
    notes = []

    # RSI
    if rsi < 35:
        scores["buy"] += 1
        notes.append(f"RSI oversold ({rsi})")
    elif rsi > 65:
        scores["sell"] += 1
        notes.append(f"RSI overbought ({rsi})")
    else:
        scores["hold"] += 1

    # MACD
    if macd["crossover"] == "bullish" and macd["histogram"] > 0:
        scores["buy"] += 1
        notes.append("MACD bullish crossover")
    elif macd["crossover"] == "bearish" and macd["histogram"] < 0:
        scores["sell"] += 1
        notes.append("MACD bearish crossover")
    else:
        scores["hold"] += 1

    # Bollinger Bands
    if bb["position"] == "lower":
        scores["buy"] += 1
        notes.append("Price near lower Bollinger Band")
    elif bb["position"] == "upper":
        scores["sell"] += 1
        notes.append("Price near upper Bollinger Band")
    else:
        scores["hold"] += 1

    # MA crossover
    if ma["recent_cross"] == "golden":
        scores["buy"] += 2
        notes.append("Golden Cross (50MA > 200MA)")
    elif ma["recent_cross"] == "death":
        scores["sell"] += 2
        notes.append("Death Cross (50MA < 200MA)")
    elif ma["above_200"]:
        scores["buy"] += 1
        notes.append("Price above 200MA")
    else:
        scores["sell"] += 1
        notes.append("Price below 200MA")

    total = scores["buy"] + scores["sell"] + scores["hold"]
    max_score = max(scores["buy"], scores["sell"])

    # Confidence: requires 2+ agreeing signals for BUY/SELL
    if scores["buy"] >= 2 and scores["buy"] > scores["sell"]:
        action = "BUY"
        confidence = min(round(scores["buy"] / total * 100), 95)
    elif scores["sell"] >= 2 and scores["sell"] > scores["buy"]:
        action = "SELL"
        confidence = min(round(scores["sell"] / total * 100), 95)
    else:
        action = "HOLD"
        confidence = min(round(scores["hold"] / total * 100), 95)

    return {
        "action": action,
        "confidence": confidence,
        "notes": "; ".join(notes),
        "scores": scores,
    }


# ---------------------------------------------------------------------------
# Data fetching & analysis
# ---------------------------------------------------------------------------

def analyze_ticker(ticker: str) -> dict | None:
    """Fetch data and compute all indicators for a single ticker."""
    print(f"  Fetching {ticker}...", end=" ", flush=True)
    try:
        period = "1y"  # need 200 bars minimum for MA200
        df = yf.download(ticker, period=period, progress=False, auto_adjust=True)
        if df.empty or len(df) < 60:
            print("insufficient data.")
            return None

        close = df["Close"].squeeze()
        price = float(close.iloc[-1])
        prev_price = float(close.iloc[-2])
        pct_change = round((price - prev_price) / prev_price * 100, 2)

        rsi = calculate_rsi(close)
        macd = calculate_macd(close)
        bb = calculate_bollinger_bands(close)
        ma = calculate_ma_crossover(close)
        signal = generate_signal(rsi, macd, bb, ma)

        print(f"{signal['action']} ({signal['confidence']}% confidence)")
        return {
            "ticker": ticker,
            "price": round(price, 2),
            "pct_change": pct_change,
            "rsi": rsi,
            "macd_value": macd["macd"],
            "macd_signal": macd["signal"],
            "macd_crossover": macd["crossover"],
            "bb_upper": bb["upper"],
            "bb_lower": bb["lower"],
            "bb_position": bb["position"],
            "ma50": ma["ma50"],
            "ma200": ma["ma200"],
            "ma_above_200": ma["above_200"],
            "action": signal["action"],
            "confidence": signal["confidence"],
            "notes": signal["notes"],
        }
    except Exception as e:
        print(f"error: {e}")
        return None


# ---------------------------------------------------------------------------
# Output rendering
# ---------------------------------------------------------------------------

PLAIN_TEXT_TEMPLATE = """
================================================================
  DIZZY SIGNALS — Weekly Trading Newsletter
  {{ date }}
  Dizzy Inc | dzyntwrk.gumroad.com
================================================================

MARKET SIGNALS
--------------
{% for s in signals %}
{{ "%-10s" | format(s.ticker) }}  {{ "%-5s" | format(s.action) }}  ${{ s.price }}  RSI: {{ s.rsi }}  Conf: {{ s.confidence }}%
  Notes: {{ s.notes }}
{% endfor %}

INDICATOR DETAILS
-----------------
{% for s in signals %}
{{ s.ticker }}:
  Price: ${{ s.price }} ({{ "+" if s.pct_change >= 0 else "" }}{{ s.pct_change }}%)
  RSI(14): {{ s.rsi }}
  MACD: {{ s.macd_value }} | Signal: {{ s.macd_signal }} | {{ s.macd_crossover | upper }}
  Bollinger: Upper ${{ s.bb_upper }} | Lower ${{ s.bb_lower }} | Position: {{ s.bb_position | upper }}
  MA50: ${{ s.ma50 }} | MA200: ${{ s.ma200 }}{% if s.ma_above_200 %} (ABOVE 200MA ✓){% else %} (BELOW 200MA ✗){% endif %}

{% endfor %}
================================================================
DISCLAIMER: This newsletter is for educational and entertainment
purposes only. Nothing here constitutes financial advice.
Trading involves risk. Past signals do not guarantee future results.
Always do your own research (DYOR) and consult a licensed financial
advisor before making investment decisions.
================================================================

Want the full premium signals + trade setups?
Subscribe on Substack: [YOUR_SUBSTACK_URL]
$20/month | $50/month (premium w/ alerts)
================================================================
"""

HTML_TEMPLATE = open(
    __file__.replace("signal-generator.py", "newsletter-template.html"), "r"
).read() if True else ""


def render_output(signals: list[dict], output_format: str) -> str:
    """Render signals into the requested format."""
    date_str = datetime.now().strftime("%B %d, %Y")

    if output_format == "text":
        tmpl = Template(PLAIN_TEXT_TEMPLATE)
        return tmpl.render(signals=signals, date=date_str)

    # HTML / newsletter: load from template file
    template_path = __file__.replace("signal-generator.py", "newsletter-template.html")
    try:
        with open(template_path, "r") as f:
            html_src = f.read()
    except FileNotFoundError:
        print("WARNING: newsletter-template.html not found, falling back to text output.")
        tmpl = Template(PLAIN_TEXT_TEMPLATE)
        return tmpl.render(signals=signals, date=date_str)

    tmpl = Template(html_src)
    return tmpl.render(signals=signals, date=date_str, year=datetime.now().year)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Dizzy Signals — Trading Signal Newsletter Generator"
    )
    parser.add_argument(
        "--tickers",
        default="SPY,QQQ,BTC-USD",
        help="Comma-separated list of tickers (default: SPY,QQQ,BTC-USD)",
    )
    parser.add_argument(
        "--output",
        choices=["newsletter", "html", "text"],
        default="newsletter",
        help="Output format: newsletter (saves both html+txt), html, or text",
    )
    parser.add_argument(
        "--outdir",
        default=".",
        help="Directory to save output files (default: current directory)",
    )
    args = parser.parse_args()

    tickers = [t.strip().upper() for t in args.tickers.split(",") if t.strip()]
    print(f"\nDizzy Signals | {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Analyzing {len(tickers)} ticker(s): {', '.join(tickers)}\n")

    signals = []
    for ticker in tickers:
        result = analyze_ticker(ticker)
        if result:
            signals.append(result)

    if not signals:
        print("\nNo signals generated — check ticker symbols or network connection.")
        sys.exit(1)

    import os
    os.makedirs(args.outdir, exist_ok=True)
    date_slug = datetime.now().strftime("%Y-%m-%d")

    if args.output in ("newsletter", "html"):
        html_content = render_output(signals, "html")
        html_path = os.path.join(args.outdir, f"dizzy-signals-{date_slug}.html")
        with open(html_path, "w") as f:
            f.write(html_content)
        print(f"\nHTML newsletter saved: {html_path}")

    if args.output in ("newsletter", "text"):
        text_content = render_output(signals, "text")
        txt_path = os.path.join(args.outdir, f"dizzy-signals-{date_slug}.txt")
        with open(txt_path, "w") as f:
            f.write(text_content)
        print(f"Plain text saved:      {txt_path}")

    print(f"\nSignals summary:")
    for s in signals:
        indicator = "🟢" if s["action"] == "BUY" else ("🔴" if s["action"] == "SELL" else "🟡")
        print(f"  {indicator} {s['ticker']:12s} {s['action']:5s}  ${s['price']:>10.2f}  RSI {s['rsi']:5.1f}  {s['confidence']}% confidence")

    print("\nDone. Paste HTML into Substack or send via email.")


if __name__ == "__main__":
    main()
