// /api/emails — Email nurture sequence generator
// With ANTHROPIC_API_KEY: Claude Haiku; without: template generator

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// --- Template fallback ---
function templateEmails({ businessType, productName, sequenceType, emailCount, audience, sellingPoints }) {
  const count = parseInt(emailCount) || 5;
  const points = sellingPoints.split('\n').filter(Boolean);
  const p0 = points[0] || `the power of ${productName}`;
  const p1 = points[1] || `results you can count on`;
  const p2 = points[2] || `a community of happy customers`;
  const p3 = points[3] || `limited-time savings`;
  const p4 = points[4] || `our guarantee`;

  const sequences = {
    welcome: [
      { day: 0, subject: `Welcome to ${productName} — You made the right call`, preview: `Here's what happens next...`, body: `Hi there,\n\nWelcome aboard! We're so glad you're here.\n\nYou just joined thousands of ${audience} who've discovered ${productName} — and we think you're going to love what comes next.\n\nHere's what you can expect from us:\n\n✅ Practical tips to get the most out of ${productName}\n✅ Exclusive offers available only to subscribers\n✅ Real stories from people just like you\n\nTo get started, here's the #1 thing we recommend:\n\n→ ${p0}\n\nWe'll be back in a couple of days with something useful. Until then, feel free to reply to this email — we read every one.\n\nWarmly,\nThe ${productName} Team` },
      { day: 2, subject: `Quick win for ${audience}: Try this today`, preview: `This took our customers 10 minutes and made a real difference`, body: `Hey,\n\nTwo days ago you joined us — and we want to make sure you hit the ground running.\n\nHere's a quick win you can use today:\n\n${p0}\n\nWhy does this matter? Because ${p1}. And the sooner you start, the sooner you'll see the difference.\n\n${audience} who do this early on tend to get the best results from ${productName}.\n\nGive it a try and let us know how it goes — hit reply, we love hearing from you.\n\nCheering you on,\nThe ${productName} Team` },
      { day: 5, subject: `How others are using ${productName}`, preview: `Real stories, real results`, body: `Hi,\n\nWe wanted to share something with you.\n\nPeople like you — ${audience} — are using ${productName} every day to achieve real results.\n\nHere's what they're saying:\n\n"${p1}" — a customer who started just like you\n\nThey didn't have anything special. They just showed up, used what we gave them, and things changed.\n\nYou can do the same. Here's how to get there:\n\n1. Start with ${p0}\n2. Build from ${p2}\n3. Lean on ${p3} when you need a boost\n\nWe're here every step of the way.\n\nTo your success,\nThe ${productName} Team` },
      { day: 9, subject: `Don't miss this — it's for you`, preview: `A little something we've been holding back`, body: `Hey,\n\nWe don't do this for everyone — but you've been with us long enough that we want to reward that.\n\nFor a limited time, we're offering something special to our newest subscribers:\n\n→ ${p3}\n\nThis is our way of saying thank you for giving ${productName} a shot.\n\nHere's what you get:\n• ${p0}\n• ${p1}\n• ${p4}\n\nThis won't last long, so don't sit on it.\n\nGrab it now → [Your link here]\n\nWith gratitude,\nThe ${productName} Team` },
      { day: 14, subject: `One week in — how are you doing?`, preview: `Checking in (and we have something for you)`, body: `Hi,\n\nTwo weeks ago, you made a decision. You chose to invest in yourself by trying ${productName}.\n\nHow's it going?\n\nIf you haven't started yet — that's okay. Life gets busy. But we want to make sure you don't miss out on what ${productName} can do for you.\n\nHere's a reminder of why ${audience} love it:\n\n✅ ${p0}\n✅ ${p1}\n✅ ${p2}\n\nNeed help getting started? Just reply to this email. We'll personally help you figure out the best path forward.\n\nYou've got this,\nThe ${productName} Team` },
      { day: 21, subject: `The truth about getting results with ${productName}`, preview: `Nobody talks about this part`, body: `Hey,\n\nCan I be honest with you for a second?\n\nMost people don't get results because they wait for the "perfect moment." They think they need more time, more money, or more experience before they start.\n\nBut here's what we've seen from thousands of ${audience}:\n\nThe ones who win are the ones who start before they're ready.\n\n${productName} was built for that. It gives you ${p0}, ${p1}, and the support of ${p2} — so you're never alone.\n\nIf you're ready to stop waiting, here's your next step:\n→ [Your CTA link here]\n\nLet's make it happen,\nThe ${productName} Team` },
      { day: 30, subject: `Month one milestone — here's what's next`, preview: `You're further along than you think`, body: `Hi,\n\nOne month. Can you believe it?\n\nYou've been part of the ${productName} community for a full month. And whether you've been deep in it or just getting warmed up, we want you to know — we see you.\n\nHere's what's in store for you next:\n\n→ ${p0} — for those ready to level up\n→ ${p3} — because you've earned it\n→ ${p4} — no risk, all reward\n\nThank you for being here. We don't take that lightly.\n\nOnward,\nThe ${productName} Team` },
    ],
    sales: [
      { day: 0, subject: `${audience}: This changes everything`, preview: `Read this before you do anything else today`, body: `Hi,\n\nIf you're a ${audience} looking for a way to get better results without burning out — keep reading.\n\nWe built ${productName} for exactly this situation.\n\nHere's the problem most ${audience} face:\n→ They're working hard but not seeing results\n→ They're using tools that don't actually work for them\n→ They feel like they're always one step behind\n\nSound familiar?\n\n${productName} changes that. Here's how:\n\n✅ ${p0}\n✅ ${p1}\n✅ ${p2}\n\nWe're opening the doors for a limited time. Here's where to start:\n→ [Your link here]\n\nTalk soon,\nThe ${productName} Team` },
      { day: 2, subject: `Here's the proof you asked for`, preview: `Real numbers, real people`, body: `Hey,\n\nYou signed up because something caught your attention. Let us back it up.\n\nHere's what ${audience} are saying about ${productName}:\n\n"${p1}" — actual customer\n\nAnd here's what makes it work:\n→ ${p0}\n→ ${p2}\n→ ${p4}\n\nThis isn't hype. It's a system built for ${audience} who are serious about results.\n\nSee it for yourself → [Your link here]\n\nTo your success,\nThe ${productName} Team` },
      { day: 4, subject: `The #1 mistake ${audience} make (and how to avoid it)`, preview: `We see this all the time — here's the fix`, body: `Hi,\n\nAfter working with thousands of ${audience}, we've noticed a pattern.\n\nThe #1 mistake? Trying to do it alone.\n\nWithout the right system and support, even talented ${audience} spin their wheels. That's exactly why ${productName} exists.\n\nWith ${productName} you get:\n✅ ${p0}\n✅ ${p1}\n✅ ${p2}\n✅ ${p3}\n\nDon't make the mistake of waiting. The ones who act early always have an edge.\n\nGet started today → [Your link here]\n\nBest,\nThe ${productName} Team` },
      { day: 7, subject: `Last chance — doors closing soon`, preview: `This offer ends at midnight`, body: `Hey,\n\nI'll be direct: this is your last chance.\n\nOur special offer for ${productName} closes at midnight tonight. After that, the price goes up and the bonuses disappear.\n\nHere's what you're about to miss:\n\n🎁 ${p0}\n🎁 ${p3}\n🎁 ${p4}\n\nEverything you need to start seeing results as a ${audience} — at the best price we'll ever offer.\n\nClaim your spot now → [Your link here]\n\nThis link expires at midnight.\n\nDon't wait,\nThe ${productName} Team` },
      { day: 8, subject: `[FINAL NOTICE] Offer expires today`, preview: `A few hours left`, body: `Hi,\n\nA few hours left.\n\nIf you've been on the fence about ${productName}, this is the moment to decide.\n\nAsk yourself: How much is it costing me to NOT have ${p0} and ${p1} working for me?\n\nFor ${audience}, the answer is usually: more than this offer costs.\n\n→ [Your link here]\n\nThat link expires at midnight tonight. Once it's gone, it's gone.\n\nWishing you the best no matter what you decide,\nThe ${productName} Team` },
      { day: 14, subject: `We missed you — here's a second chance`, preview: `Only for people on this list`, body: `Hi,\n\nYou didn't grab ${productName} when we launched. That's okay.\n\nLife happens. Timing isn't always right.\n\nBut a few people wrote in and asked if there was any way to still get in — so we're opening a small window, just for this list.\n\nHere's what you get:\n✅ ${p0}\n✅ ${p1}\n✅ ${p4}\n\nThis is the last time we'll extend this offer. After this, the only way in is at full price.\n\n→ [Your link here]\n\nYou've got 48 hours.\n\nMake it count,\nThe ${productName} Team` },
      { day: 21, subject: `What ${audience} are saying one month later`, preview: `The results are in`, body: `Hi,\n\nA month ago we launched ${productName}. The results have been incredible.\n\n${audience} who joined are reporting:\n→ ${p0}\n→ ${p1}\n→ ${p2}\n\nWe're so proud of what this community has accomplished.\n\nIf you're still on the fence, consider this: the ones who joined a month ago are already seeing results. Every day you wait is a day behind.\n\nJoin them today → [Your link here]\n\nHere for you,\nThe ${productName} Team` },
    ],
    onboarding: [
      { day: 0, subject: `You're in! Here's how to get started`, preview: `Your ${productName} journey starts now`, body: `Welcome!\n\nYou've made a great decision. Let's make sure you get the most out of ${productName} from day one.\n\nHere's your onboarding checklist:\n\n☐ Step 1: ${p0}\n☐ Step 2: ${p1}\n☐ Step 3: Explore the features built for ${audience}\n\nImportant links:\n→ Getting started guide: [Link]\n→ Support center: [Link]\n→ Community: [Link]\n\nIf you get stuck at any point, reply to this email. We typically respond within a few hours.\n\nExcited to have you,\nThe ${productName} Team` },
      { day: 1, subject: `Day 1 tip: Start here for best results`, preview: `The single most important thing to do first`, body: `Hi,\n\nDay 1 already! Here's the most important thing you can do right now:\n\n→ ${p0}\n\nWhy this first? Because it sets the foundation for everything else. ${audience} who complete this step first tend to see results 3x faster.\n\nIt should take you about 10-15 minutes. Go ahead and do it now — we'll be here when you're done.\n\nTip from our team: ${p2}\n\nYou've got this,\nThe ${productName} Team` },
      { day: 3, subject: `Your ${productName} setup: are you on track?`, preview: `Quick check-in (and a pro tip)`, body: `Hey,\n\nHow's setup going? By now you should have:\n\n✅ Completed your initial configuration\n✅ Explored the core features\n✅ Set your first goal\n\nIf you haven't done all of these yet — no worries. Here's a shortcut:\n\n→ ${p1}\n\nThis is the fastest path to your first win with ${productName}.\n\nPro tip for ${audience}: ${p2}\n\nKeep going,\nThe ${productName} Team` },
      { day: 7, subject: `One week in — you're doing great`, preview: `Unlock these advanced features next`, body: `Hi,\n\nOne week with ${productName}! You're officially past the "getting started" phase.\n\nHere's what to focus on this week:\n\n🚀 Advanced feature: ${p0}\n🚀 Power move: ${p3}\n🚀 Community tip: ${p2}\n\nThese are the features that separate casual users from power users.\n\nAnd remember — ${p4}. So explore freely, knowing we have you covered.\n\nOnward to week 2,\nThe ${productName} Team` },
      { day: 14, subject: `Two weeks in — time to level up`, preview: `You're ready for this`, body: `Hi,\n\nTwo weeks! You're no longer a beginner. It's time to level up.\n\nThis week, challenge yourself with:\n→ ${p0} at a deeper level\n→ Integrating ${p1} into your routine\n→ Connecting with ${p2} for fresh ideas\n\nNeed help? Here's where to go:\n• Detailed guides: [Link]\n• Live chat support: [Link]\n• Community forum: [Link]\n\nProud of how far you've come,\nThe ${productName} Team` },
      { day: 21, subject: `Advanced tips for serious ${audience}`, preview: `Most users don't know about this`, body: `Hey,\n\nYou've been using ${productName} for three weeks. That puts you ahead of most users.\n\nHere are some advanced tips most people miss:\n\n💡 ${p0} — unlocks a whole new level\n💡 ${p3} — saves hours per week\n💡 ${p2} — used by our top 10% of users\n\nYou're in the top tier now. Keep building on that momentum.\n\nAlways here if you need us,\nThe ${productName} Team` },
      { day: 30, subject: `🎉 30 days with ${productName} — congratulations!`, preview: `You've built something real`, body: `Hi,\n\nThirty days. You did it.\n\nMost people don't make it this far. But you're not most people — you're a ${audience} who commits.\n\nHere's what you've accomplished:\n✅ Mastered ${p0}\n✅ Built the habit of ${p1}\n✅ Connected with ${p2}\n\nWhat's next? The next 30 days are where things really compound. Here's your month 2 game plan:\n\n→ Go deeper with ${p3}\n→ Share your experience with ${p2}\n→ Take advantage of ${p4}\n\nThank you for trusting us with your journey.\n\nCheering you on,\nThe ${productName} Team` },
    ],
    nurture: [
      { day: 0, subject: `A little something to think about`, preview: `Worth 2 minutes of your time`, body: `Hi,\n\nWe started ${productName} because we saw too many ${audience} struggling with the same problems — and we knew there was a better way.\n\nHere's the insight that changed everything for us:\n\n→ ${p0}\n\nSimple, right? But most ${audience} never act on it. That's the gap we help close.\n\nThis week we'll be sharing a few ideas that might just change how you think about ${p1}.\n\nStay tuned,\nThe ${productName} Team` },
      { day: 3, subject: `The question every ${audience} should ask`, preview: `Most skip this — don't be one of them`, body: `Hey,\n\nHere's a question worth sitting with:\n\n"Am I getting the results I want with the effort I'm putting in?"\n\nIf the honest answer is no — you're not alone. Most ${audience} hit this wall.\n\nThe difference between those who break through and those who don't?\n\n→ ${p1}\n→ The support of ${p2}\n→ A system like ${productName} that does the heavy lifting\n\nSomething to consider,\nThe ${productName} Team` },
      { day: 7, subject: `How to actually get results as a ${audience}`, preview: `The playbook nobody's sharing`, body: `Hi,\n\nEveryone says "work smarter, not harder." But nobody tells you exactly what that looks like for ${audience}.\n\nHere's what it looks like in practice:\n\n1. Focus on ${p0} first — this is your highest leverage activity\n2. Use ${p1} to remove friction from your workflow\n3. Tap into ${p2} when you need perspective\n4. Fall back on ${p4} so you never feel stuck\n\nThis is exactly how ${productName} was designed to work.\n\nBuilding with you,\nThe ${productName} Team` },
      { day: 14, subject: `Real talk about what ${audience} get wrong`, preview: `We see this mistake constantly`, body: `Hey,\n\nCan we be real for a second?\n\nHere's the #1 mistake ${audience} make:\n\nThey think information is the same as action. They read, they learn, they plan — but they don't execute.\n\nKnowledge without implementation is just entertainment.\n\n${productName} was built to close that gap. Specifically:\n→ ${p0} makes it easy to start\n→ ${p3} removes the excuses\n→ ${p4} means there's no risk in trying\n\nWhen you're ready to move from knowing to doing,\nThe ${productName} Team` },
      { day: 21, subject: `The compound effect of consistency`, preview: `Small actions, big results`, body: `Hi,\n\nThere's a principle that separates the best ${audience} from everyone else:\n\nConsistency compounds.\n\nSmall actions, done repeatedly, produce outsized results over time. And ${productName} is built on this principle.\n\nEvery time you use ${productName} to:\n→ ${p0}\n→ ${p1}\n→ ${p2}\n\n...you're building something that grows.\n\nThree weeks from now, you'll look back and be glad you started today.\n\nTo your growth,\nThe ${productName} Team` },
      { day: 30, subject: `A message from us to you`, preview: `We wrote this for you specifically`, body: `Hi,\n\nWe want to tell you something we don't say enough:\n\nThank you for being here.\n\nEvery day, ${audience} like you show up, try to improve, and push through challenges that most people give up on. That takes courage.\n\n${productName} exists to support that courage. With ${p0}, ${p1}, and ${p2}, we're here to make your journey easier.\n\nAnd with ${p4}, you can explore without fear.\n\nWe're in your corner,\nThe ${productName} Team` },
      { day: 45, subject: `What's possible in the next 30 days`, preview: `A vision for where you're headed`, body: `Hi,\n\nImagine where you'll be 30 days from now if you start today.\n\nFor ${audience} who commit to ${productName}:\n✅ ${p0}\n✅ ${p1}\n✅ ${p2}\n\nThe path is clear. The tools are ready. The only variable is you.\n\nReady to make the next 30 days count?\n\n→ [Your link here]\n\nLet's build,\nThe ${productName} Team` },
    ],
    reengagement: [
      { day: 0, subject: `We've been thinking about you`, preview: `It's been a while — we want to help`, body: `Hi,\n\nIt's been a while since we've heard from you, and we miss having you around.\n\nWe get it — life gets busy. But we don't want you to miss out on what ${productName} can do for you.\n\nA lot has changed since you last checked in:\n→ ${p0} — now even better\n→ ${p1} — completely revamped\n→ ${p2} — more active than ever\n\nWe'd love to have you back.\n\nStill here for you,\nThe ${productName} Team` },
      { day: 3, subject: `We've made some improvements you'll love`, preview: `A sneak peek at what's new`, body: `Hey,\n\nWe've been busy since you left.\n\nHere's what's new in ${productName} that we think you'll love:\n\n✨ ${p0} — redesigned from the ground up\n✨ ${p1} — faster and more powerful\n✨ ${p3} — available for returning users\n\nWe built these improvements based on feedback from ${audience} just like you.\n\nCome take a look → [Your link here]\n\nCan't wait to show you,\nThe ${productName} Team` },
      { day: 7, subject: `A special offer — just for you`, preview: `We're making it easy to come back`, body: `Hi,\n\nWe want to make it as easy as possible for you to give ${productName} another shot.\n\nSo here's something special just for returning users:\n\n→ ${p3}\n→ ${p4}\n\nNo strings attached. We just want you to see what ${productName} has become — and what it can do for ${audience} like you.\n\n→ [Your link here]\n\nThis offer is only available for the next 48 hours.\n\nCome back and see,\nThe ${productName} Team` },
      { day: 14, subject: `Last try — we'd love to have you back`, preview: `Genuine offer, no pressure`, body: `Hi,\n\nThis is our last message about coming back to ${productName}.\n\nIf this isn't for you right now — completely understood. We'll continue sending our regular emails and you can jump back in whenever the time is right.\n\nBut if there's any part of you that's curious about what ${productName} can do for ${audience} like you — this is the moment.\n\n→ ${p0}\n→ ${p1}\n→ ${p4}\n\nOne click → [Your link here]\n\nWhatever you decide, thank you for giving us a chance.\n\nAlways here,\nThe ${productName} Team` },
      { day: 21, subject: `Moving forward — a final note`, preview: `No hard feelings, promise`, body: `Hi,\n\nWe respect your inbox, so this is our last re-engagement note.\n\nIf ${productName} doesn't feel right for you as a ${audience} right now, that's completely okay.\n\nBut before we go quiet, we want to leave you with one thing:\n\n"${p1}"\n\nThat's the core promise of ${productName}. If that ever becomes relevant to where you are, you know where to find us.\n\n→ [Your link here]\n\nWishing you the best,\nThe ${productName} Team` },
    ],
  };

  const typeKey = sequenceType || 'welcome';
  const allEmails = sequences[typeKey] || sequences.welcome;
  return allEmails.slice(0, count);
}

// --- Claude prompt ---
function buildPrompt({ businessType, productName, sequenceType, emailCount, audience, sellingPoints }) {
  const seqLabels = {
    welcome: 'welcome sequence (onboard new subscribers, build trust, set expectations)',
    sales: 'sales sequence (convert leads into customers with urgency and value)',
    onboarding: 'onboarding sequence (guide new customers through setup and first wins)',
    nurture: 'nurture sequence (build relationship, share value, stay top of mind)',
    reengagement: 're-engagement sequence (win back inactive subscribers)',
  };
  const seqDesc = seqLabels[sequenceType] || seqLabels.welcome;

  return `You are an expert email copywriter who writes high-converting email nurture sequences for small businesses.

BUSINESS INFO:
- Business type: ${businessType}
- Product/Service: ${productName}
- Target audience: ${audience}
- Sequence goal: ${seqDesc}
- Number of emails: ${emailCount}
- Key selling points:
${sellingPoints}

Write a ${emailCount}-email ${sequenceType} sequence. Each email should:
- Be conversational, genuine, and written for ${audience}
- Have a specific purpose that builds on the previous email
- Include strategic spacing (day numbers) appropriate for this sequence type
- Have a compelling subject line under 60 chars
- Have a preview text under 90 chars
- Have a full email body (150-300 words) with clear formatting

Output ONLY valid JSON (no markdown, no code blocks):
{
  "emails": [
    {
      "day": 0,
      "subject": "subject line here",
      "preview": "preview text here",
      "body": "full email body here with \\n for line breaks"
    }
  ]
}

Use \\n for line breaks in the body. Write all ${emailCount} emails. Output ONLY JSON.`;
}

// --- Main handler ---
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).end();
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { businessType, productName, sequenceType, emailCount, audience, sellingPoints } = req.body || {};
  if (!productName || !audience) {
    return res.status(400).json({ error: 'productName and audience are required' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const emails = templateEmails({ businessType, productName, sequenceType, emailCount, audience, sellingPoints });
    return res.status(200).json({ emails, source: 'template' });
  }

  try {
    const prompt = buildPrompt({ businessType, productName, sequenceType, emailCount, audience, sellingPoints });
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
      const emails = templateEmails({ businessType, productName, sequenceType, emailCount, audience, sellingPoints });
      return res.status(200).json({ emails, source: 'template' });
    }

    const data = await resp.json();
    const raw = data.content?.[0]?.text || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return res.status(200).json({ emails: parsed.emails, source: 'ai' });
  } catch (e) {
    console.error('Error:', e);
    const emails = templateEmails({ businessType, productName, sequenceType, emailCount, audience, sellingPoints });
    return res.status(200).json({ emails, source: 'template' });
  }
};
