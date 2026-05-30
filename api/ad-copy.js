// /api/ad-copy — Ad copy A/B testing generator
// With ANTHROPIC_API_KEY: Claude Haiku; without: template generator

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ANGLES = [
  'Pain Point',
  'Social Proof',
  'FOMO',
  'Value Prop',
  'Curiosity',
  'Direct Offer',
  'Story',
  'Question Hook',
  'Authority',
  'Benefit-Led',
];

function headlineLimit(platform) {
  return platform === 'Google Ads' ? 30 : 40;
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1).trim() + '…' : str;
}

function templateVariations({ productName, audience, benefit, platform, goal, budgetHint }) {
  const limit = headlineLimit(platform);
  const p = productName || 'our product';
  const a = audience || 'people like you';
  const b = benefit || 'amazing results';
  const goalCtas = {
    awareness: ['Learn More', 'Discover Now', 'See How It Works', 'Find Out More'],
    clicks: ['Click Here', 'Visit Now', 'Read More', 'Explore Now'],
    conversions: ['Get Started', 'Buy Now', 'Claim Offer', 'Start Today'],
    'app installs': ['Download Free', 'Install Now', 'Get the App', 'Try It Free'],
  };
  const ctas = goalCtas[goal] || goalCtas.conversions;

  const rawVariations = [
    {
      angle: 'Pain Point',
      headline: `Stop Struggling — Try ${p}`,
      primaryText: `Tired of not getting ${b}? ${a} are ditching the old way and switching to ${p}. It's time you did too. See the difference in days, not months.`,
      cta: ctas[0],
    },
    {
      angle: 'Social Proof',
      headline: `${a} Love ${p}`,
      primaryText: `Join thousands of ${a} who've already discovered ${b} with ${p}. Real people. Real results. Don't just take our word for it — see what they're saying.`,
      cta: ctas[1 % ctas.length],
    },
    {
      angle: 'FOMO',
      headline: `Don't Miss Out on ${b}`,
      primaryText: `While you're reading this, ${a} are already getting ${b} with ${p}. Limited spots available. Once they're gone, they're gone. Act now before it's too late.`,
      cta: 'Claim Your Spot',
    },
    {
      angle: 'Value Prop',
      headline: `${p}: Built for ${a}`,
      primaryText: `${p} delivers ${b} — without the complexity, without the wait. Designed specifically for ${a} who want results that actually stick. ${budgetHint ? `Starting from just ${budgetHint}.` : 'Affordable plans available.'}`,
      cta: ctas[2 % ctas.length],
    },
    {
      angle: 'Curiosity',
      headline: `The Secret Behind ${b}`,
      primaryText: `What if getting ${b} was simpler than you think? ${a} are discovering a smarter way with ${p}. Curious? See exactly how it works — no strings attached.`,
      cta: 'See How It Works',
    },
    {
      angle: 'Direct Offer',
      headline: `Get ${b} with ${p}`,
      primaryText: `${p} gives ${a} exactly what they need: ${b}. Simple. Powerful. Proven. ${budgetHint ? `Get started for ${budgetHint}. ` : ''}No fluff, no filler — just results.`,
      cta: ctas[3 % ctas.length],
    },
    {
      angle: 'Story',
      headline: `How ${a} Found ${b}`,
      primaryText: `We built ${p} after hearing from hundreds of ${a} who were frustrated. They wanted ${b} but couldn't find anything that worked. So we built it ourselves. Here's their story.`,
      cta: 'Read Their Story',
    },
    {
      angle: 'Question Hook',
      headline: `Ready for ${b}?`,
      primaryText: `What would change if you finally had ${b}? For ${a}, the answer is everything. ${p} makes it possible — faster and easier than you'd expect. Find out for yourself.`,
      cta: ctas[0],
    },
    {
      angle: 'Authority',
      headline: `The #1 Choice for ${a}`,
      primaryText: `${p} is trusted by ${a} who demand the best. When it comes to ${b}, there's a reason the pros choose ${p}. See why — and join the leaders in your space.`,
      cta: 'Join the Leaders',
    },
    {
      angle: 'Benefit-Led',
      headline: `${b} — Guaranteed`,
      primaryText: `With ${p}, ${a} get ${b} — or we make it right. That's our promise. No risk, no hassle. Just the results you've been looking for, delivered exactly as advertised.`,
      cta: 'Try Risk-Free',
    },
  ];

  return rawVariations.map((v) => {
    const hl = truncate(v.headline, limit);
    return {
      angle: v.angle,
      headline: hl,
      primaryText: v.primaryText,
      cta: v.cta,
      charCounts: {
        headline: hl.length,
        headlineLimit: limit,
        primaryText: v.primaryText.length,
      },
    };
  });
}

function buildPrompt({ productName, audience, benefit, platform, goal, budgetHint }) {
  const limit = headlineLimit(platform);
  const goalDescs = {
    awareness: 'brand awareness (get people to know the brand)',
    clicks: 'drive clicks/traffic to a website',
    conversions: 'drive conversions/purchases',
    'app installs': 'get app installs',
  };
  const goalDesc = goalDescs[goal] || goal;

  return `You are a world-class direct response copywriter specializing in paid social and search advertising.

AD BRIEF:
- Product/Service: ${productName}
- Target Audience: ${audience}
- Main Benefit/Hook: ${benefit}
- Platform: ${platform}
- Campaign Goal: ${goalDesc}
- Budget Hint: ${budgetHint || 'not specified'}
- Headline character limit: ${limit} characters

Write exactly 10 ad copy variations. Each must use a DIFFERENT psychological angle from this list: Pain Point, Social Proof, FOMO, Value Prop, Curiosity, Direct Offer, Story, Question Hook, Authority, Benefit-Led.

Rules:
- Headline MUST be ${limit} chars or fewer (count carefully)
- primaryText: 2-4 sentences, punchy and specific to the audience
- cta: 2-4 word action phrase
- Each variation must feel genuinely different in approach, not just swapped words
- Write for ${platform} — match the tone and format of that platform

Output ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "variations": [
    {
      "angle": "Pain Point",
      "headline": "headline here under ${limit} chars",
      "primaryText": "primary ad text here",
      "cta": "CTA Text"
    }
  ]
}

Output ONLY JSON. All 10 variations. No duplicates.`;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).end();
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productName, audience, benefit, platform, goal, budgetHint } = req.body || {};
  if (!productName || !audience || !benefit) {
    return res.status(400).json({ error: 'productName, audience, and benefit are required' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const variations = templateVariations({ productName, audience, benefit, platform, goal, budgetHint });
    return res.status(200).json({ variations, source: 'template' });
  }

  try {
    const prompt = buildPrompt({ productName, audience, benefit, platform, goal, budgetHint });
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Anthropic error:', err);
      const variations = templateVariations({ productName, audience, benefit, platform, goal, budgetHint });
      return res.status(200).json({ variations, source: 'template' });
    }

    const data = await resp.json();
    const raw = data.content?.[0]?.text || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    const limit = headlineLimit(platform);
    const variations = (parsed.variations || []).map((v) => {
      const hl = truncate(v.headline, limit);
      return {
        angle: v.angle,
        headline: hl,
        primaryText: v.primaryText,
        cta: v.cta,
        charCounts: {
          headline: hl.length,
          headlineLimit: limit,
          primaryText: (v.primaryText || '').length,
        },
      };
    });
    return res.status(200).json({ variations, source: 'ai' });
  } catch (e) {
    console.error('Error:', e);
    const variations = templateVariations({ productName, audience, benefit, platform, goal, budgetHint });
    return res.status(200).json({ variations, source: 'template' });
  }
};
