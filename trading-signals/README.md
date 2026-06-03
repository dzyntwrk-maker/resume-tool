# Dizzy Signals — Trading Signal Newsletter Generator
**Tier 5 #26 | Dizzy Inc**  
Monetized via Substack paid subscriptions at $20–$50/month per subscriber.

---

## Quick Start

### 1. Install dependencies
```bash
cd trading-signals
pip install -r requirements.txt
```

### 2. Run a basic scan
```bash
# Default tickers: SPY, QQQ, BTC-USD
python signal-generator.py

# Custom tickers
python signal-generator.py --tickers SPY,QQQ,BTC-USD,AAPL,TSLA,ETH-USD

# Choose output format
python signal-generator.py --tickers SPY,QQQ --output html      # HTML only
python signal-generator.py --tickers SPY,QQQ --output text      # plain text only
python signal-generator.py --tickers SPY,QQQ --output newsletter # both (default)

# Custom output directory
python signal-generator.py --tickers SPY,QQQ --outdir ./output
```

### 3. Output files
Each run creates dated files in the output directory:
- `dizzy-signals-YYYY-MM-DD.html` — paste into Substack or send as email
- `dizzy-signals-YYYY-MM-DD.txt` — copy into Discord, Telegram, or SMS alerts

---

## How It Works

The generator fetches 1 year of daily OHLCV data from Yahoo Finance (free, no API key) and calculates four technical indicators:

| Indicator | Bullish Signal | Bearish Signal |
|-----------|---------------|----------------|
| RSI (14) | < 35 (oversold) | > 65 (overbought) |
| MACD (12/26/9) | Bullish crossover + positive histogram | Bearish crossover + negative histogram |
| Bollinger Bands (20, 2σ) | Price near lower band (pct_b < 0.2) | Price near upper band (pct_b > 0.8) |
| MA Crossover (50/200) | Golden Cross or above 200MA | Death Cross or below 200MA |

**Confluence rule:** BUY or SELL requires **2+ indicators in agreement**. Otherwise the signal is HOLD.  
Confidence score = (agreeing indicators / total indicators) × 100, capped at 95%.

---

## Supported Assets

Any ticker supported by Yahoo Finance:
- **US Stocks:** AAPL, TSLA, MSFT, NVDA, SPY, QQQ, IWM, etc.
- **Crypto:** BTC-USD, ETH-USD, SOL-USD, BNB-USD, etc.
- **ETFs:** GLD, SLV, TLT, VIX (VIX signals are inverted by nature — use with caution)
- **International:** BABA, TSM, etc.

Minimum data requirement: 60 trading days (approximately 3 months).

---

## Automating with Cron (Mac/Linux)

Run every Monday at 7:00 AM and save output to a dated folder:

```cron
# Edit with: crontab -e
0 7 * * 1 cd /path/to/trading-signals && python signal-generator.py \
  --tickers SPY,QQQ,BTC-USD,ETH-USD,AAPL,TSLA \
  --output newsletter \
  --outdir /path/to/newsletters >> /tmp/dizzy-signals.log 2>&1
```

---

## Automating with GitHub Actions

Create `.github/workflows/weekly-signals.yml` in your repo:

```yaml
name: Weekly Dizzy Signals

on:
  schedule:
    - cron: '0 12 * * 1'   # Every Monday at noon UTC
  workflow_dispatch:          # Allow manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r trading-signals/requirements.txt

      - name: Generate signals
        run: |
          python trading-signals/signal-generator.py \
            --tickers SPY,QQQ,BTC-USD,ETH-USD,AAPL,TSLA,NVDA \
            --output newsletter \
            --outdir output

      - name: Upload newsletter artifact
        uses: actions/upload-artifact@v4
        with:
          name: dizzy-signals-${{ github.run_id }}
          path: output/
          retention-days: 30
```

Download the artifact from the GitHub Actions run page, then paste the HTML into Substack.

---

## Publishing to Substack

### One-time setup
1. Go to [substack.com](https://substack.com) → Create publication
2. Name it **"Dizzy Signals"** — use the teal/blue branding (#0ea5e9, #1e40af)
3. Set up paid tiers: $20/month (Starter) and $50/month (Premium)
4. Update the subscribe URL in `newsletter-template.html` (search for `YOUR_SUBSTACK_URL`)

### Publishing each issue
1. Run the generator to produce `dizzy-signals-YYYY-MM-DD.html`
2. On Substack, click **New Post**
3. In the editor, click the `<>` (embed/HTML) button or use the **Import** feature
4. Paste the HTML content
5. Set audience: **Free** for the signal table headers, **Paid** for the full indicator breakdown
6. Schedule or publish

### Substack paywalling strategy
- Free tier: shows signal (BUY/SELL/HOLD) and price only
- Paid tier ($20): full indicator breakdown, RSI, MACD, Bollinger, MA details
- Premium tier ($50): add real-time email alerts via a separate notification script

---

## Monetization Guide

### Revenue projections

| Subscribers | Tier | Monthly Revenue |
|-------------|------|-----------------|
| 50 | $20/mo Starter | $1,000/mo |
| 100 | $20/mo Starter | $2,000/mo |
| 50 | $50/mo Premium | $2,500/mo |
| 100 mixed | avg $30/mo | $3,000/mo |

### Growth playbook
1. **Free teaser posts** — publish one free signal per week on Substack + share on X/Twitter, Reddit (r/stocks, r/CryptoCurrency, r/algotrading)
2. **Instagram @thedizzyinc** — screenshot the signal table, post as a carousel with "full breakdown is in the newsletter"
3. **Reddit** — post a weekly "Free Signal Drop" in r/stocks or r/investing (follow subreddit rules)
4. **Discord community** — post free signals in a public channel, premium signals in a paid role-gated channel
5. **Cross-sell** — existing Gumroad buyers of Python Scripts (bWh4J) are ideal upsell targets for the newsletter

### Upsell path
Gumroad Python Scripts → Dizzy Signals free tier → Dizzy Signals paid tier → custom signal bot (agency service)

---

## Disclaimer Template

Use this on all public posts, social shares, and in every newsletter issue:

> **Not financial advice.** Dizzy Signals is for educational and entertainment purposes only. Signals are generated algorithmically from public market data. Nothing here is personalized investment advice. All trading involves risk of loss. Past performance does not guarantee future results. Always do your own research (DYOR) and consult a licensed financial advisor before making investment decisions. Dizzy Inc is not a registered investment advisor or broker-dealer.

---

## Files

| File | Purpose |
|------|---------|
| `signal-generator.py` | Main script — fetches data, calculates indicators, renders output |
| `newsletter-template.html` | Jinja2 HTML email template with Dizzy branding |
| `requirements.txt` | Python dependencies |
| `README.md` | This file |

---

## Customization

- **Add tickers:** just pass them with `--tickers`
- **Change indicator periods:** edit `calculate_rsi(period=14)`, `calculate_macd(fast=12, slow=26)`, etc.
- **Change confluence threshold:** in `generate_signal()`, change `>= 2` to `>= 3` for stricter signals
- **Brand colors:** edit the `<style>` block in `newsletter-template.html`
- **Substack URL:** replace `YOUR_SUBSTACK_URL` in the template CTA button

---

*Dizzy Inc · @thedizzyinc · dzyntwrk.gumroad.com · "Clarity in Complexity. Automation in Action."*
