// /api/leads — Lead qualification and scoring
// With ANTHROPIC_API_KEY: Claude Haiku; without: rule-based scoring

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Rule-based scoring weights
const BUDGET_SCORES = {
  'under-10k': 5,
  '10k-50k': 20,
  '50k-100k': 40,
  '100k-250k': 60,
  '250k-500k': 80,
  '500k+': 100,
};

const TIMELINE_SCORES = {
  'immediate': 100,
  '1-3-months': 80,
  '3-6-months': 55,
  '6-12-months': 30,
  '12-months+': 10,
  'no-timeline': 5,
};

const SIZE_SCORES = {
  '1-10': 10,
  '11-50': 25,
  '51-200': 45,
  '201-500': 65,
  '501-1000': 80,
  '1000+': 100,
};

const ROLE_SCORES = {
  'c-suite': 100,
  'vp-director': 85,
  'manager': 60,
  'individual-contributor': 30,
  'unknown': 15,
};

function ruleBasedScore({ industry, size, budget, timeline, role, painPoints }) {
  const bScore = BUDGET_SCORES[budget] ?? 20;
  const tScore = TIMELINE_SCORES[timeline] ?? 20;
  const sScore = SIZE_SCORES[size] ?? 30;
  const rScore = ROLE_SCORES[role] ?? 30;

  // Weighted average: budget 35%, timeline 30%, size 20%, role 15%
  const raw = bScore * 0.35 + tScore * 0.30 + sScore * 0.20 + rScore * 0.15;
  const score = Math.round(Math.min(100, Math.max(0, raw)));

  const tier = score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold';

  // ICP match: high budget + short timeline + decision maker = strong ICP
  const icpMatch = Math.round((bScore * 0.4 + tScore * 0.35 + rScore * 0.25) * 0.95);

  return { score, tier, icpMatch };
}

function generateOutreachTemplate({ companyName, industry, painPoints, tier, role }) {
  const name = companyName || 'your company';
  const pain = painPoints
    ? painPoints.split(/[.,\n]/)[0].trim().toLowerCase()
    : 'operational efficiency challenges';
  const roleLabel =
    role === 'c-suite' ? 'leadership team'
    : role === 'vp-director' ? 'team'
    : 'organization';

  if (tier === 'Hot') {
    return `Subject: Quick question about ${name}'s growth\n\nHi [First Name],\n\nI came across ${name} and noticed you're in the ${industry || 'industry'} space — we work with companies similar to yours dealing with ${pain}.\n\nWe've helped ${roleLabel}s like yours reduce that friction by 40%+ in the first 90 days. Given your timeline, I think we could make a meaningful impact quickly.\n\nWould 20 minutes this week make sense to explore if there's a fit?\n\nBest,\n[Your Name]`;
  } else if (tier === 'Warm') {
    return `Subject: Idea for ${name}\n\nHi [First Name],\n\nI've been following ${name}'s work in ${industry || 'your space'} — impressive trajectory.\n\nMany ${industry || 'industry'} companies we talk to mention ${pain} as a growing pain point. We've built something specifically for this.\n\nHappy to share a quick case study — no pitch, just relevant ideas. Interested?\n\nBest,\n[Your Name]`;
  } else {
    return `Subject: Resource for ${name}\n\nHi [First Name],\n\nI wanted to share a resource that's helped companies in the ${industry || 'your'} space address ${pain}.\n\nNo ask — just thought it might be useful as you think about priorities for the year ahead.\n\n[Link to resource]\n\nFeel free to reach out if questions come up.\n\nBest,\n[Your Name]`;
  }
}

function getNextAction(tier, timeline) {
  if (tier === 'Hot') {
    return timeline === 'immediate'
      ? 'Call within 24 hours — this lead is ready to buy now'
      : 'Send personalized email today, follow up with a call in 48 hours';
  } else if (tier === 'Warm') {
    return 'Add to nurture sequence, schedule a discovery call within 1-2 weeks';
  } else {
    return 'Add to long-term nurture, re-qualify in 90 days';
  }
}

function scoreLead(lead) {
  const { companyName, industry, size, budget, timeline, role, painPoints } = lead;
  const { score, tier, icpMatch } = ruleBasedScore({ industry, size, budget, timeline, role, painPoints });
  const outreachTemplate = generateOutreachTemplate({ companyName, industry, painPoints, tier, role });
  const nextAction = getNextAction(tier, timeline);

  return {
    name: companyName || 'Unknown Company',
    score,
    tier,
    icpMatch,
    outreachTemplate,
    nextAction,
  };
}

function buildPrompt(leads) {
  const leadList = leads
    .map((l, i) => `Lead ${i + 1}: Company="${l.companyName || 'Unknown'}", Industry="${l.industry || ''}", Size="${l.size || ''}", Budget="${l.budget || ''}", Timeline="${l.timeline || ''}", Role="${l.role || ''}", PainPoints="${l.painPoints || ''}"`)
    .join('\n');

  return `You are a B2B sales expert and lead qualification specialist. Score and qualify each lead below.

LEADS:
${leadList}

For each lead, provide:
1. score: 0-100 (higher = better qualified)
2. tier: "Hot" (70-100), "Warm" (40-69), or "Cold" (0-39)
3. icpMatch: 0-100 percent match to an ideal B2B customer profile
4. outreachTemplate: A personalized email (subject line + body, ~100 words) tailored to the company and pain points
5. nextAction: Specific recommended next step for the sales rep (1-2 sentences)

Scoring criteria:
- Budget: Higher budget = higher score
- Timeline: Shorter/more immediate = higher score
- Decision maker role: C-suite/VP > Manager > IC
- Pain points: More specific and urgent = higher score
- Company size: 50-1000 employees typically ideal for B2B SaaS

Output ONLY valid JSON (no markdown, no code blocks):
{
  "leads": [
    {
      "name": "Company Name",
      "score": 85,
      "tier": "Hot",
      "icpMatch": 82,
      "outreachTemplate": "Subject: ...\n\nHi [First Name],\n...",
      "nextAction": "..."
    }
  ]
}`;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).end();
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};

  // Support single lead or bulk array
  let leads = [];
  if (Array.isArray(body.leads)) {
    leads = body.leads;
  } else if (body.companyName || body.industry) {
    leads = [body];
  } else {
    return res.status(400).json({ error: 'Provide a single lead (companyName, industry, etc.) or leads[] array' });
  }

  if (leads.length === 0) {
    return res.status(400).json({ error: 'No leads provided' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const scored = leads.map(scoreLead);
    return res.status(200).json({ leads: scored, source: 'rule-based' });
  }

  try {
    const prompt = buildPrompt(leads);
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Anthropic error:', err);
      const scored = leads.map(scoreLead);
      return res.status(200).json({ leads: scored, source: 'rule-based' });
    }

    const data = await resp.json();
    const raw = data.content?.[0]?.text || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return res.status(200).json({ leads: parsed.leads || [], source: 'ai' });
  } catch (e) {
    console.error('Error:', e);
    const scored = leads.map(scoreLead);
    return res.status(200).json({ leads: scored, source: 'rule-based' });
  }
};
