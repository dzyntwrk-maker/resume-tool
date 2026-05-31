# ResumeAI — Resume & Cover Letter Tool

**Live:** resume-tool-zeta.vercel.app
**Payhip credits:** payhip.com/b/gFaqD ($4.99 / 10 uses)
**Vercel project:** dizzy-sai-projects1/resume-tool

---

## Status

| Item | Status | Notes |
|------|--------|-------|
| App deployed | ✅ Live | resume-tool-zeta.vercel.app |
| Payhip product | ✅ Live | $4.99 for 10 tailorings |
| Template fallback | ✅ Works | Generates output without API key |
| Input validation | ✅ Added | Length checks, error handling |
| Security headers | ✅ Added | Cache-Control, X-Content-Type-Options |
| AI generation (Claude) | ⚠️ Pending | Needs ANTHROPIC_API_KEY in production |
| Payment acceptance | 🔴 Blocked | Payhip needs PayPal/Stripe connected |

---

## Critical Next Steps

### 1. Add ANTHROPIC_API_KEY to Production
```bash
vercel env add ANTHROPIC_API_KEY production
# Paste your Anthropic API key when prompted
# Then promote from: vercel.com/dizzy-sai-projects1/resume-tool/deployments
```

### 2. Connect Payhip Payment Methods
**Visit:** payhip.com → Account → Payment Methods
- Connect **PayPal** or **Stripe** (or both)
- Ensure funds are routed to the correct account
- Test a purchase at payhip.com/b/gFaqD

### 3. Verify Deployment
- [ ] Visit resume-tool-zeta.vercel.app
- [ ] Test free generation (1 use included)
- [ ] Test all three output types (resume, cover, both)
- [ ] Test paywall with no remaining uses
- [ ] Test access code redemption with RZAI-DZY25-A1

---

## How It Works

1. **First Use**: Free (1 tailoring included)
2. **Paywall**: After 1st use, users can purchase or enter code
3. **Purchase**: Payhip → $4.99 → receive ZIP with access code
4. **Redeem**: Paste code in app → unlock 10 more tailorings
5. **Generation**: 
   - With ANTHROPIC_API_KEY → Full Claude AI generation
   - Without key → Keyword-extraction template (still useful)

---

## Key Files

| File | Purpose |
|------|---------|
| `app.js` | Frontend logic, Payhip URL, uses tracking, input validation |
| `index.html` | UI template with forms, paywall, output tabs |
| `api/generate.js` | Resume/cover letter generation — Claude or template |
| `api/redeem.js` | Access code validation |
| `vercel.json` | Vercel routing config |
| `package.json` | Dependencies (@anthropic-ai/sdk) |

---

## Recent Improvements

- ✅ Added input validation (length checks)
- ✅ Added security headers (Cache-Control, X-Content-Type-Options)
- ✅ Improved error messages for better UX
- ✅ Added request timeout (60s) to API calls
- ✅ Added meta description for SEO
- ✅ Better error scrolling and visibility
- ✅ API timeout handling on both generate and redeem endpoints

---

## API Endpoints

### POST /api/generate
Generates tailored resume + cover letter.

**Request:**
```json
{
  "resume": "...",
  "jobDesc": "...",
  "name": "Jane Smith",
  "role": "Senior PM",
  "tone": "professional|confident|enthusiastic|concise",
  "outputType": "both|resume|cover"
}
```

**Validation:**
- Resume: 100-50,000 characters
- Job description: 100-10,000 characters

**Response:**
```json
{
  "resume": "...",
  "coverLetter": "..."
}
```

### POST /api/redeem
Validates access code.

**Request:**
```json
{ "code": "RZAI-DZY25-A1" }
```

**Response:**
```json
{ "valid": true }
```

---

## Deploy to Production

```bash
# Commit changes
git add -A
git commit -m "Optimize for launch: add validation, security headers, improved UX"
git push -u origin master

# Then in Vercel dashboard:
# 1. Check deployment at vercel.com/dizzy-sai-projects1/resume-tool
# 2. Verify tests pass
# 3. Promote to production
```

---

## Launch Checklist

- [ ] ANTHROPIC_API_KEY added to Vercel production environment
- [ ] Payhip payment methods connected (PayPal/Stripe)
- [ ] Free generation works
- [ ] Paid generation works (after ANTHROPIC_API_KEY set)
- [ ] Paywall shows after 1 use
- [ ] Access code redemption works
- [ ] All output types tested (resume, cover, both)
- [ ] Mobile UI responsive
- [ ] Error messages clear and helpful
- [ ] Analytics set up (optional but recommended)

---

## Revenue Tracking

| Metric | Value |
|--------|-------|
| Price per pack | $4.99 / 10 uses |
| First use | Free |
| Payhip product | gFaqD |
| Access codes | RZAI-DZY25-A1 through A5 |
| Sales to date | 0 |
| Revenue to date | $0 |
