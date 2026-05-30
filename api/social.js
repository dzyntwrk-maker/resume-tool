// /api/social — Social media batch content generator
// With ANTHROPIC_API_KEY: Claude Haiku; without: template generator

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const PLATFORM_CONFIG = {
  Instagram: {
    maxChars: 2200,
    hashtagCount: 10,
    bestTimes: ['9:00 AM', '11:00 AM', '2:00 PM', '5:00 PM', '7:00 PM'],
    icon: '📸',
  },
  'Twitter-X': {
    maxChars: 280,
    hashtagCount: 3,
    bestTimes: ['8:00 AM', '12:00 PM', '5:00 PM', '9:00 PM'],
    icon: '𝕏',
  },
  LinkedIn: {
    maxChars: 3000,
    hashtagCount: 5,
    bestTimes: ['7:00 AM', '10:00 AM', '12:00 PM', '5:00 PM'],
    icon: '💼',
  },
  Facebook: {
    maxChars: 500,
    hashtagCount: 5,
    bestTimes: ['9:00 AM', '1:00 PM', '3:00 PM', '7:00 PM'],
    icon: '👥',
  },
  TikTok: {
    maxChars: 300,
    hashtagCount: 8,
    bestTimes: ['7:00 AM', '12:00 PM', '7:00 PM', '9:00 PM'],
    icon: '🎵',
  },
};

const CONTENT_ANGLES = {
  educational: [
    'Did you know that {topic} can transform your {niche}? Here\'s what the experts won\'t tell you…',
    'The #1 mistake most {niche} brands make with {topic} — and how to fix it.',
    '3 proven strategies to master {topic} for your {niche} business.',
    'What nobody talks about when it comes to {topic} in the {niche} space.',
    'Step-by-step: How to leverage {topic} to grow your {niche} brand today.',
  ],
  promotional: [
    'Ready to take your {niche} to the next level? {brand} has exactly what you need. {topic} — done right.',
    'Why smart {niche} businesses trust {brand} for {topic}. The results speak for themselves.',
    '{brand} is changing the game for {niche} with {topic}. Don\'t get left behind.',
    'Exclusive: {brand}\'s approach to {topic} is redefining what\'s possible in {niche}.',
    'The {niche} brands seeing the fastest growth all have one thing in common: {topic}.',
  ],
  engaging: [
    'Hot take: {topic} is the most underrated strategy in {niche} right now. Agree or disagree? 👇',
    'We asked 100 {niche} founders about {topic}. Their answers surprised us.',
    'Raise your hand if {topic} has ever felt overwhelming in your {niche} journey. 🙋',
    'Unpopular opinion: most {niche} brands are doing {topic} completely wrong.',
    'What\'s your biggest challenge with {topic} in {niche}? Drop it below 👇',
  ],
  storytelling: [
    'Six months ago, {brand} didn\'t know where to start with {topic}. Today? Everything changed.',
    'The real story behind how {brand} cracked the code on {topic} in {niche}.',
    'It started with a simple question: what if we approached {topic} differently in {niche}?',
    'Nobody believed {brand} when we said {topic} would transform {niche}. Then it did.',
    'This is the {topic} story we wish someone had told us when we started in {niche}.',
  ],
  mixed: [
    'Did you know? {topic} is reshaping {niche} faster than anyone expected. Here\'s what {brand} learned.',
    'Hot take: {topic} isn\'t optional for {niche} anymore — it\'s the baseline. Do you agree? 👇',
    '{brand}\'s #1 tip for mastering {topic} in {niche}? Start before you feel ready.',
    'The {niche} brands winning at {topic} share one secret. It\'s simpler than you think.',
    'Real talk about {topic} in {niche}: what works, what doesn\'t, and what {brand} wishes they knew sooner.',
  ],
};

const HASHTAG_BANKS = {
  Instagram: (niche, topic) => [
    `#${niche.replace(/\s+/g, '')}`, `#${topic.replace(/\s+/g, '')}`, '#ContentCreator',
    '#SmallBusiness', '#Entrepreneur', '#BusinessGrowth', '#MarketingTips',
    '#SocialMediaMarketing', '#BrandStrategy', '#GrowthMindset', '#DigitalMarketing',
    '#OnlineBusiness', '#ContentMarketing', '#BusinessOwner', '#Hustle',
  ],
  'Twitter-X': (niche, topic) => [`#${niche.replace(/\s+/g, '')}`, `#${topic.replace(/\s+/g, '')}`, '#Marketing'],
  LinkedIn: (niche, topic) => [
    `#${niche.replace(/\s+/g, '')}`, `#${topic.replace(/\s+/g, '')}`, '#Business', '#Leadership', '#Growth',
  ],
  Facebook: (niche, topic) => [
    `#${niche.replace(/\s+/g, '')}`, `#${topic.replace(/\s+/g, '')}`, '#SmallBusiness', '#Community', '#Tips',
  ],
  TikTok: (niche, topic) => [
    `#${niche.replace(/\s+/g, '')}`, `#${topic.replace(/\s+/g, '')}`, '#LearnOnTikTok',
    '#TikTokBusiness', '#FYP', '#BusinessTips', '#Viral', '#ForYou',
  ],
};

function pickBestTime(platform, index) {
  const times = PLATFORM_CONFIG[platform]?.bestTimes || ['10:00 AM'];
  return times[index % times.length];
}

function fillTemplate(template, { brand, niche, topic }) {
  return template
    .replace(/{brand}/g, brand)
    .replace(/{niche}/g, niche)
    .replace(/{topic}/g, topic);
}

function getContentTypeLabel(contentType, index) {
  if (contentType === 'mixed') {
    const types = ['Educational', 'Promotional', 'Engaging', 'Storytelling', 'Engaging'];
    return types[index % types.length];
  }
  return contentType.charAt(0).toUpperCase() + contentType.slice(1);
}

function templatePosts({ brandName, niche, topic, platforms, count, contentType }) {
  const posts = [];
  const angles = CONTENT_ANGLES[contentType] || CONTENT_ANGLES.mixed;
  const effectivePlatforms = platforms && platforms.length ? platforms : ['Instagram'];

  let i = 0;
  while (posts.length < count) {
    const platform = effectivePlatforms[i % effectivePlatforms.length];
    const cfg = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.Instagram;
    const angleTemplate = angles[i % angles.length];
    let text = fillTemplate(angleTemplate, { brand: brandName, niche, topic });

    // Truncate to platform limit
    if (text.length > cfg.maxChars) {
      text = text.slice(0, cfg.maxChars - 1).trim() + '…';
    }

    const allHashtags = (HASHTAG_BANKS[platform] || HASHTAG_BANKS.Instagram)(niche, topic);
    const hashtags = allHashtags.slice(0, cfg.hashtagCount);

    posts.push({
      platform,
      icon: cfg.icon,
      text,
      hashtags,
      bestTime: pickBestTime(platform, i),
      type: getContentTypeLabel(contentType, i),
    });
    i++;
  }
  return posts;
}

function buildPrompt({ brandName, niche, topic, platforms, count, contentType }) {
  const platformList = platforms.join(', ');
  const platformDetails = platforms.map((p) => {
    const cfg = PLATFORM_CONFIG[p] || {};
    return `- ${p}: max ${cfg.maxChars} chars, up to ${cfg.hashtagCount} hashtags`;
  }).join('\n');

  return `You are a world-class social media strategist and copywriter.

CONTENT BRIEF:
- Brand/Business: ${brandName}
- Niche/Industry: ${niche}
- Content Topic/Theme: ${topic}
- Platforms: ${platformList}
- Number of Posts: ${count}
- Content Type: ${contentType}

PLATFORM CONSTRAINTS:
${platformDetails}

Generate exactly ${count} social media posts distributed across the platforms (${platformList}). Each post must be perfectly tailored to its platform's tone, culture, and character limit.

Content type guide:
- educational: teach something valuable, tips, insights, how-tos
- promotional: highlight brand, product, or service benefits
- engaging: questions, polls, hot takes, conversation starters
- storytelling: narrative, behind-the-scenes, journey
- mixed: rotate through all types

Rules:
- Match platform voice exactly (LinkedIn = professional, TikTok = casual/fun, Twitter-X = punchy, Instagram = visual storytelling, Facebook = community)
- Include relevant hashtags for each platform (within the count limit)
- Posts must feel authentic, not corporate or generic
- Vary the angle and approach for each post
- Best posting time should be a specific time like "10:00 AM" or "7:00 PM"

Output ONLY valid JSON (no markdown, no code blocks):
{
  "posts": [
    {
      "platform": "Instagram",
      "text": "post text here",
      "hashtags": ["#tag1", "#tag2"],
      "bestTime": "10:00 AM",
      "type": "Educational"
    }
  ]
}

Generate all ${count} posts. No duplicates. Output ONLY JSON.`;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).end();
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brandName, niche, topic, platforms, count, contentType } = req.body || {};
  if (!brandName || !niche || !topic) {
    return res.status(400).json({ error: 'brandName, niche, and topic are required' });
  }

  const effectivePlatforms = Array.isArray(platforms) && platforms.length ? platforms : ['Instagram'];
  const effectiveCount = Math.min(Math.max(parseInt(count) || 5, 5), 30);
  const effectiveType = contentType || 'mixed';

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const posts = templatePosts({
      brandName, niche, topic,
      platforms: effectivePlatforms,
      count: effectiveCount,
      contentType: effectiveType,
    });
    return res.status(200).json({ posts, source: 'template' });
  }

  try {
    const prompt = buildPrompt({
      brandName, niche, topic,
      platforms: effectivePlatforms,
      count: effectiveCount,
      contentType: effectiveType,
    });

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
      const posts = templatePosts({ brandName, niche, topic, platforms: effectivePlatforms, count: effectiveCount, contentType: effectiveType });
      return res.status(200).json({ posts, source: 'template' });
    }

    const data = await resp.json();
    const raw = data.content?.[0]?.text || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    const posts = (parsed.posts || []).map((p) => {
      const cfg = PLATFORM_CONFIG[p.platform] || PLATFORM_CONFIG.Instagram;
      return {
        platform: p.platform,
        icon: cfg.icon,
        text: p.text,
        hashtags: Array.isArray(p.hashtags) ? p.hashtags.slice(0, cfg.hashtagCount) : [],
        bestTime: p.bestTime || '10:00 AM',
        type: p.type || effectiveType,
      };
    });

    return res.status(200).json({ posts, source: 'ai' });
  } catch (e) {
    console.error('Error:', e);
    const posts = templatePosts({ brandName, niche, topic, platforms: effectivePlatforms, count: effectiveCount, contentType: effectiveType });
    return res.status(200).json({ posts, source: 'template' });
  }
};
