# ResumeAI — Deploy & Monetize Guide

## Deploy to Vercel (free, 10 minutes)

1. Install Vercel CLI: `npm i -g vercel`
2. `cd /Users/dizzynetwork/resume-tool`
3. `npm install`
4. `vercel` — follow prompts, creates a free project
5. In Vercel dashboard → Settings → Environment Variables:
   - Add `ANTHROPIC_API_KEY` = your key from console.anthropic.com
6. `vercel --prod` — live at yourproject.vercel.app

## Set up Stripe payments (30 minutes)

1. Create account at stripe.com
2. Products → Create product → "10 Tailorings" → $4.99 one-time
3. Create a Payment Link → copy URL
4. In `app.js`, replace `STRIPE_LINK` with your Stripe Payment Link URL
5. In Stripe → Webhooks → add endpoint: `https://yourapp.vercel.app/api/webhook`
6. Create `api/webhook.js` to generate tokens on successful payment:
   - Generate a UUID, add to PAID_TOKENS env var, redirect with `?token=UUID`

## Monetization channels

### Primary: Pay-per-use ($4.99/10 tailorings)
- 1 free use, then paywall appears
- Stripe Payment Links — no backend needed for basic flow
- Target: 100 paying users/month = $500 MRR

### Secondary: Monthly subscription ($9/month unlimited)
- Add a Stripe subscription product
- Store subscriber emails, generate session tokens monthly

### Acquisition (free)
- Post in: r/jobs, r/cscareerquestions, r/resumes, r/jobsearchhacks
- "I built a free tool that tailors your resume to any job posting in 30 seconds"
- LinkedIn post + Product Hunt launch
- SEO: target "ai resume tailor", "cover letter generator", "resume keyword optimizer"

### Cost estimate (Claude Haiku)
- Each generation ≈ 1,500 tokens input + 800 output ≈ $0.003 per use
- $4.99 / 10 uses → $0.50/use revenue → $0.497 profit per use
- Margin: ~99%

## Revenue projection
Month 1: 50 paying users × $4.99 = $250
Month 3: 200 users × avg $7 = $1,400
Month 6: 500 subs × $9/mo = $4,500 MRR
