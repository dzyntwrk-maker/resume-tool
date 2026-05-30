# ResumeAI — Resume & Cover Letter Tool

**Live:** resume-tool-zeta.vercel.app
**Payhip credits:** payhip.com/b/gFaqD ($4.99 / 10 uses)
**Vercel project:** dizzy-sai-projects1/resume-tool

---

## Status

| Item | Status |
|------|--------|
| App deployed | ✅ Live at resume-tool-zeta.vercel.app |
| Payhip credit product | ✅ $4.99, description set |
| Guarantee block on landing page | ✅ Added |
| AI generation (Claude) | ⚠️ Template fallback — needs ANTHROPIC_API_KEY |
| Payment acceptance | 🔴 Blocked — Payhip PayPal/Stripe not connected |

---

## User Action Required

**Add API key to enable full Claude AI generation:**
```bash
cd /Users/dizzynetwork/resume-tool
vercel env add ANTHROPIC_API_KEY production
# Paste key when prompted
# Then promote from: vercel.com/dizzy-sai-projects1/resume-tool/deployments
```
> Without the key, the app runs in template mode — still produces real output, just not Claude-generated.

---

## How It Works

1. User pastes resume + job description
2. App generates tailored resume + cover letter
3. First use free → buy Payhip pack → enter access code → 10 more uses
4. Access codes (pre-generated): `RZAI-DZY25-A1` through `RZAI-DZY25-A5`
5. Buyer flow: Payhip checkout → ZIP file → access code → paste in app

---

## Key Files

| File | Purpose |
|------|---------|
| `app.js` | Main Express server, contains `PAYHIP_URL` |
| `public/index.html` | Frontend UI |
| `package.json` | Dependencies |
| `vercel.json` | Vercel config |

---

## Deploy

```bash
git add -A && git commit -m "update" && git push origin master
# Check vercel.com/dizzy-sai-projects1/resume-tool → Promote to Production
```

---

## Revenue Tracking

| Metric | Value |
|--------|-------|
| Price per pack | $4.99 / 10 uses |
| Payhip code | gFaqD |
| Sales to date | 0 |
| Revenue to date | $0 |
