// /api/newsletter — Niche newsletter content curator
// With ANTHROPIC_API_KEY: Claude Haiku writes a full polished newsletter
// Without key: template generator with section structure
// Returns: { subject, preview, html, plainText }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getNicheEmoji(niche) {
  const map = {
    AI: '🤖', crypto: '₿', 'real estate': '🏠', fitness: '💪', marketing: '📈',
  };
  return map[niche] || '📰';
}

function getToneDesc(tone) {
  const map = {
    informational: 'clear, factual, and educational',
    conversational: 'friendly, casual, and engaging like a trusted friend',
    expert: 'authoritative, data-driven, and sophisticated',
  };
  return map[tone] || 'informational';
}

function buildPrompt({ name, niche, edition, topics, sponsor, tone }) {
  const topicList = topics.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const sponsorSection = sponsor
    ? `Include a sponsor section using this message: "${sponsor}". Label it clearly as "SPONSOR" or "THIS WEEK'S SPONSOR".`
    : 'No sponsor this week — skip the sponsor section entirely.';

  return `You are an expert newsletter writer. Write a complete, polished newsletter edition.

NEWSLETTER DETAILS:
- Newsletter Name: ${name}
- Niche/Topic: ${niche}
- Edition Number: #${edition}
- Tone: ${getToneDesc(tone)}
- Key Topics This Week:
${topicList}

REQUIREMENTS:
- Subject line: compelling, under 60 chars, with an emoji
- Preview text: 1-2 sentences that complement the subject line
- Intro hook: 2-3 sentences that grab the reader immediately
- 3-5 content sections (one per topic provided). Each section has:
  - A punchy section title with relevant emoji
  - A 3-5 sentence summary/insight
  - A "Key Takeaway" in bold
- ${sponsorSection}
- CTA/outro: 2-3 sentences encouraging replies, sharing, or action
- Footer note: social links placeholder text

Output ONLY valid JSON (no markdown, no code fences, no explanation):
{
  "subject": "subject line here",
  "preview": "preview text here",
  "intro": "intro hook paragraph",
  "sections": [
    {
      "title": "Section Title with Emoji",
      "body": "section body paragraph",
      "takeaway": "key takeaway sentence"
    }
  ],
  "sponsor": "sponsor section text or null if no sponsor",
  "outro": "CTA/outro paragraph",
  "footer": "footer note"
}`;
}

function templateNewsletter({ name, niche, edition, topics, sponsor, tone }) {
  const emoji = getNicheEmoji(niche);
  const topicArr = topics.slice(0, 5);

  const sectionEmojis = ['🔍', '📊', '💡', '🚀', '🎯'];
  const sections = topicArr.map((topic, i) => ({
    title: `${sectionEmojis[i % sectionEmojis.length]} ${topic}`,
    body: `This week in ${niche}, ${topic.toLowerCase()} has been making waves. Experts and practitioners alike are paying close attention as new developments emerge. The implications for ${niche} professionals are significant, and early movers stand to gain a meaningful advantage. Here's what you need to know before the rest of the market catches on.`,
    takeaway: `Key Takeaway: Stay ahead by understanding how ${topic.toLowerCase()} fits into your ${niche} strategy.`,
  }));

  const toneIntros = {
    informational: `Welcome to edition #${edition} of ${name}. This week we're covering ${topicArr.length} important developments in the ${niche} space. Let's get into the data.`,
    conversational: `Hey, welcome back! Edition #${edition} of ${name} just landed in your inbox — and this week has been a wild ride in the ${niche} world. Grab your coffee, let's dig in.`,
    expert: `Edition #${edition} of ${name} arrives at a pivotal moment for the ${niche} industry. Our analysis this week focuses on ${topicArr.length} critical developments that demand your attention.`,
  };

  return {
    subject: `${emoji} ${name} #${edition}: This Week in ${niche}`,
    preview: `Your curated ${niche} insights for the week — covering ${topicArr.slice(0, 2).join(', ')} and more.`,
    intro: toneIntros[tone] || toneIntros.informational,
    sections,
    sponsor: sponsor
      ? `SPONSOR: ${sponsor}`
      : null,
    outro: `That wraps up edition #${edition} of ${name}. If this was useful, forward it to a friend who's deep in the ${niche} world. Hit reply and tell me what you want covered next week — I read every response. See you next week.`,
    footer: `© ${name} · Twitter @${name.toLowerCase().replace(/\s+/g, '')} · Unsubscribe`,
  };
}

function buildHtml(data, { name, niche, edition }) {
  const sponsorBlock = data.sponsor
    ? `
    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin:28px 0;">
      <p style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">This Week's Sponsor</p>
      <p style="font-size:14px;color:#78350f;line-height:1.6;margin:0;">${escHtml(data.sponsor)}</p>
    </div>`
    : '';

  const sectionsHtml = data.sections.map(s => `
    <div style="border-left:3px solid #6366f1;padding-left:16px;margin-bottom:28px;">
      <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 10px;">${escHtml(s.title)}</h2>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 10px;">${escHtml(s.body)}</p>
      <p style="font-size:14px;color:#6366f1;font-weight:600;margin:0;"><strong>${escHtml(s.takeaway)}</strong></p>
    </div>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(name)} #${escHtml(String(edition))}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 36px 28px;">
      <p style="font-size:12px;color:rgba(255,255,255,.7);margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Edition #${escHtml(String(edition))}</p>
      <h1 style="font-size:26px;font-weight:800;color:#ffffff;margin:0 0 8px;">${escHtml(name)}</h1>
      <p style="font-size:14px;color:rgba(255,255,255,.8);margin:0;">Your weekly ${escHtml(niche)} intelligence brief</p>
    </div>
    <div style="padding:32px 36px;">
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 28px;border-bottom:1px solid #e5e7eb;padding-bottom:24px;">${escHtml(data.intro)}</p>
      ${sectionsHtml}
      ${sponsorBlock}
      <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;margin-top:28px;">
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0;">${escHtml(data.outro)}</p>
      </div>
    </div>
    <div style="background:#f3f4f6;padding:20px 36px;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">${escHtml(data.footer)}</p>
    </div>
  </div>
</body>
</html>`;
}

function buildPlainText(data, { name, niche, edition }) {
  const sep = '═'.repeat(60);
  const line = '─'.repeat(60);

  let txt = `${name.toUpperCase()} — EDITION #${edition}\n${sep}\n\n`;
  txt += `${data.intro}\n\n${line}\n\n`;

  data.sections.forEach((s, i) => {
    txt += `${i + 1}. ${s.title}\n${s.body}\n${s.takeaway}\n\n`;
  });

  if (data.sponsor) {
    txt += `${line}\nSPONSOR\n${data.sponsor}\n${line}\n\n`;
  }

  txt += `${data.outro}\n\n${sep}\n${data.footer}\n`;
  return txt;
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).end();
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, niche, edition, topics, sponsor, tone } = req.body || {};
  if (!name || !niche || !topics || !Array.isArray(topics) || topics.length === 0) {
    return res.status(400).json({ error: 'name, niche, and topics (array) are required' });
  }

  const params = { name, niche, edition: edition || 1, topics, sponsor: sponsor || null, tone: tone || 'informational' };
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    const data = templateNewsletter(params);
    return res.status(200).json({
      subject: data.subject,
      preview: data.preview,
      html: buildHtml(data, params),
      plainText: buildPlainText(data, params),
      source: 'template',
    });
  }

  try {
    const prompt = buildPrompt(params);
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
      const data = templateNewsletter(params);
      return res.status(200).json({
        subject: data.subject,
        preview: data.preview,
        html: buildHtml(data, params),
        plainText: buildPlainText(data, params),
        source: 'template',
      });
    }

    const apiData = await resp.json();
    const raw = apiData.content?.[0]?.text || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({
      subject: parsed.subject,
      preview: parsed.preview,
      html: buildHtml(parsed, params),
      plainText: buildPlainText(parsed, params),
      source: 'ai',
    });
  } catch (e) {
    console.error('Error:', e);
    const data = templateNewsletter(params);
    return res.status(200).json({
      subject: data.subject,
      preview: data.preview,
      html: buildHtml(data, params),
      plainText: buildPlainText(data, params),
      source: 'template',
    });
  }
};
