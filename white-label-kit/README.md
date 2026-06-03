# Dizzy Inc — White-Label AI Tools Kit
**Tier 5 #25 | Agency License Program**
**Sell licenses at $1,000–$5,000 each**

---

## What Is This?

The Dizzy Inc White-Label AI Tools Kit gives agencies and entrepreneurs the full source code of our 20+ AI-powered web tools, ready to rebrand and deploy under their own domain, logo, and colors — in under an hour.

No coding required for rebranding. One script handles everything.

---

## What's Included in Every License

- Full source code for all licensed tools (React/Next.js)
- `rebrand.sh` — automated find-and-replace rebranding script
- `vercel-deploy.sh` — one-command Vercel deployment to client's account
- Custom domain support (CNAME instructions included)
- Your own API key slot (clients bring their own OpenAI key)
- Rebrandable UI: logo, colors, footer, app name
- This documentation + LICENSE_AGREEMENT.md
- 30-day onboarding support via email

---

## License Tiers

### Starter License — $1,000
- **3 tools** of your choice
- Suggested combo: Resume AI + Legal Docs + Ad Copy
- 1 custom domain
- 30-day email support
- Updates: 6 months

### Pro License — $2,500
- **10 tools** of your choice
- Suggested combo: All Tier 2–3 tools
- 1 custom domain + staging subdomain
- 60-day email support
- Updates: 12 months

### Full Suite License — $5,000
- **All 20+ tools**
- Unlimited domains (single owner)
- Priority email support — 90 days
- 1 live onboarding call (60 min)
- Lifetime updates for purchased version
- Gumroad paywall integration guide included

---

## How to Rebrand

### Step 1 — Run the rebrand script

```bash
chmod +x rebrand.sh
./rebrand.sh \
  --brand-name "Acme AI Tools" \
  --accent-color "#FF5733" \
  --logo-url "https://acme.com/logo.png" \
  --domain "tools.acme.com"
```

This script performs a find-and-replace across all HTML, JS, and CSS files:
- "Dizzy Inc" → your brand name
- "#6366f1" (default accent) → your accent color
- Logo URL → your logo
- Footer links → your domain

### Step 2 — Add your OpenAI API key

In your Vercel dashboard or `.env.local`:
```
OPENAI_API_KEY=sk-your-key-here
```

Each client runs on their own API key — you control costs.

### Step 3 — Deploy to Vercel

```bash
chmod +x vercel-deploy.sh
./vercel-deploy.sh --project-name "acme-ai-tools" --team "acme-agency"
```

### Step 4 — Point your domain

In your DNS provider, add a CNAME:
```
tools.acme.com  →  cname.vercel-dns.com
```

Then in Vercel dashboard: Settings → Domains → Add `tools.acme.com`

---

## What Agencies Get (Full Suite)

| Feature | Starter | Pro | Full Suite |
|---------|---------|-----|------------|
| Number of tools | 3 | 10 | 20+ |
| Source code | Yes | Yes | Yes |
| Custom domain | 1 | 2 | Unlimited |
| API key slot | Yes | Yes | Yes |
| Rebrand script | Yes | Yes | Yes |
| Vercel deploy script | Yes | Yes | Yes |
| Gumroad paywall setup | No | No | Yes |
| Onboarding call | No | No | Yes (60 min) |
| Email support | 30 days | 60 days | 90 days |
| Updates included | 6 months | 12 months | Lifetime (purchased version) |

---

## How to Pitch to Agencies

See `AGENCY_PITCH.md` for:
- Cold email templates
- LinkedIn DM scripts
- Objection handlers
- 3-touch follow-up sequence

**Best targets:**
- Marketing agencies (10–50 employees)
- SEO/content agencies
- HR tech consultants
- Legal tech startups
- Freelancers building their own SaaS

**Where to find them:**
- LinkedIn: search "Marketing Agency Owner" or "Agency Founder"
- Clutch.co — directory of 50k+ agencies
- Upwork — agency profiles
- Facebook Groups: "Agency Owners", "SaaS Founders"
- Reddit: r/agency, r/freelance

---

## Support Terms

- Email support only: dzyntwrk@gmail.com
- Response time: within 48 hours (business days)
- Scope: deployment issues, rebranding help, API key setup
- Out of scope: custom feature development, third-party integrations
- Extended support available at $150/month (retainer)

---

## Legal

All licenses are governed by `LICENSE_AGREEMENT.md` included in this kit.

Key restrictions:
- Client may NOT resell the source code
- Client may NOT sublicense to third parties
- One license = one brand/company
- Dizzy Inc retains all intellectual property rights

---

## Contact

**Dizzy Inc**
Email: dzyntwrk@gmail.com
Twitter/X: @thedizzyinc
Gumroad: dzyntwrk.gumroad.com

"Clarity in Complexity. Automation in Action."
