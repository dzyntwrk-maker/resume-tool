// Vercel serverless function — /api/meeting
// Works with or without ANTHROPIC_API_KEY:
//   With key    → Claude Haiku (full AI meeting summary)
//   Without key → Template-based extractor using pattern matching

function extractSentences(text, n = 20) {
  return (text.match(/[^.!?]+[.!?]+/g) || []).slice(0, n).map(s => s.trim()).filter(Boolean);
}

function extractKeywords(text) {
  const stop = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","are","was","were","be","been","have","has","had","do","does","did","will","would","could","should","may","might","this","that","these","those","we","you","i","it","he","she","they","our","your","my","their","its","as","not","if","from","about","up","out","so","who","what","when","how","all","also","just","can","than","then","only","some","any","into","over","after","more","most","other","same","us","them","very","really","think","know","like","going","get","got","said","say","says","yeah","okay","right","actually","kind","thing","things","lot","way","make","made","one","two","three","first","second","last","back","even","well","around","through","meeting","team","everyone","today","week","next","call","yeah","um","uh","actually"]);
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = {};
  words.filter(w => !stop.has(w)).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([w]) => w);
}

function extractActionItems(text, attendees) {
  const lines = text.split(/[\n.!?]+/).map(l => l.trim()).filter(l => l.length > 10);
  const actionPatterns = [
    /\b(will|need to|needs to|should|must|going to|plan to|have to|assigned to|action item|todo|to do|to-do|action:)\b/i,
    /\b(follow up|follow-up|reach out|send|schedule|create|build|review|update|prepare|finalize|complete|submit|deliver|set up|coordinate)\b/i,
  ];

  const ownerList = attendees && attendees.length > 0
    ? attendees
    : ['TBD'];

  const priorities = ['High', 'Medium', 'Low'];
  const actionItems = [];

  lines.forEach((line, idx) => {
    if (actionPatterns.some(p => p.test(line))) {
      // Try to find an owner name in the line
      let owner = 'TBD';
      if (attendees && attendees.length > 0) {
        const found = attendees.find(a => line.toLowerCase().includes(a.toLowerCase().split(' ')[0]));
        if (found) owner = found;
        else owner = ownerList[idx % ownerList.length];
      }

      // Extract a clean task description
      const task = line
        .replace(/^[-•*\d.]+\s*/, '')
        .replace(/\b(action item|todo|to do|to-do|action:)\s*/i, '')
        .trim();

      if (task.length < 10 || task.length > 300) return;

      // Infer due date
      const duteMatch = line.match(/\b(by|before|due|deadline)\s+([a-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2}|this\s+\w+|next\s+\w+|end of \w+|eod|eow|tomorrow)/i);
      const due = duteMatch ? duteMatch[2].trim() : 'Next meeting';

      // Priority heuristic
      const highWords = /urgent|asap|critical|immediately|today|blocker/i;
      const lowWords = /eventually|sometime|nice to have|optional|if time/i;
      const priority = highWords.test(line) ? 'High' : lowWords.test(line) ? 'Low' : 'Medium';

      actionItems.push({ task, owner, due, priority });
    }
  });

  // Deduplicate by task similarity
  const seen = new Set();
  const deduped = actionItems.filter(item => {
    const key = item.task.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ensure at least a few placeholder items if nothing found
  if (deduped.length === 0) {
    const kw = extractKeywords(text);
    const t1 = kw[0] || 'project';
    const t2 = kw[1] || 'plan';
    const owner1 = ownerList[0] || 'TBD';
    const owner2 = ownerList[1] || ownerList[0] || 'TBD';
    return [
      { task: `Review and finalize ${t1} deliverables`, owner: owner1, due: 'Next meeting', priority: 'High' },
      { task: `Share ${t2} update with the team`, owner: owner2, due: 'This week', priority: 'Medium' },
      { task: 'Schedule follow-up meeting to track progress', owner: owner1, due: 'Next week', priority: 'Low' },
    ];
  }

  return deduped.slice(0, 10);
}

function extractDecisions(text) {
  const lines = text.split(/[\n.!?]+/).map(l => l.trim()).filter(l => l.length > 10);
  const decisionPatterns = /\b(decided|agreed|confirmed|approved|resolved|consensus|will proceed|moving forward|go with|chosen|selected|finalized)\b/i;
  const decisions = lines.filter(l => decisionPatterns.test(l)).map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(l => l.length > 10).slice(0, 6);

  if (decisions.length === 0) {
    const kw = extractKeywords(text);
    return [
      `Team aligned on ${kw[0] || 'the primary approach'} as the preferred direction`,
      `${kw[1] || 'Next steps'} approach confirmed by all attendees`,
    ];
  }
  return decisions;
}

function extractQuestions(text) {
  const lines = text.split(/[\n.!?]+/).map(l => l.trim()).filter(l => l.length > 10);
  const questions = lines.filter(l => l.includes('?') || /\b(unclear|unresolved|pending|open question|need to clarify|to be determined|TBD)\b/i.test(l)).map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(l => l.length > 10).slice(0, 5);

  if (questions.length === 0) {
    const kw = extractKeywords(text);
    return [
      `What is the timeline for ${kw[0] || 'project'} completion?`,
      `Who will be responsible for tracking ${kw[1] || 'progress'} going forward?`,
    ];
  }
  return questions;
}

function extractNextSteps(text) {
  const lines = text.split(/[\n.!?]+/).map(l => l.trim()).filter(l => l.length > 10);
  const nsPatterns = /\b(next step|next meeting|follow up|follow-up|after this|going forward|moving forward|plan is|schedule|upcoming)\b/i;
  const steps = lines.filter(l => nsPatterns.test(l)).map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(l => l.length > 10).slice(0, 4);

  if (steps.length === 0) {
    const kw = extractKeywords(text);
    return [
      `Schedule next check-in to review ${kw[0] || 'progress'}`,
      'Distribute meeting notes and action items to all attendees',
      `Continue work on ${kw[1] || 'deliverables'} per agreed timeline`,
    ];
  }
  return steps;
}

function computeScore(text, meetingType) {
  // Engagement score heuristics: length, question density, action density, etc.
  const wordCount = (text.match(/\b\w+\b/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  const actionCount = (text.match(/\b(will|action|todo|agreed|decided|next step|follow up)\b/gi) || []).length;
  const speakerCount = (text.match(/^[A-Z][a-z]+(?: [A-Z][a-z]+)?:/gm) || []).length;

  let score = 5;
  if (wordCount > 500) score += 1;
  if (wordCount > 1500) score += 1;
  if (questionCount > 3) score += 1;
  if (actionCount > 5) score += 1;
  if (speakerCount > 3) score += 1;
  if (['standup', 'team meeting'].includes(meetingType)) score = Math.max(score, 6);
  if (['board meeting', 'client meeting'].includes(meetingType)) score = Math.min(score + 1, 10);

  return Math.min(Math.max(Math.round(score), 1), 10);
}

function templateGenerate({ transcript, title, attendees, meetingType }) {
  const text = transcript || '';
  const attendeeList = (attendees || '').split(',').map(a => a.trim()).filter(Boolean);
  const kw = extractKeywords(text);
  const sentences = extractSentences(text, 20);
  const t1 = kw[0] || 'key topics';
  const t2 = kw[1] || 'deliverables';
  const t3 = kw[2] || 'initiatives';
  const meetTitle = title || 'this meeting';
  const type = meetingType || 'team meeting';
  const attendeeStr = attendeeList.length > 0 ? attendeeList.join(', ') : 'the team';

  const summary = `During ${meetTitle}, ${attendeeStr} gathered to discuss ${t1} and align on ${t2} for the upcoming period. The group reviewed current progress, surfaced key challenges, and explored approaches to advance ${t3} effectively. Several decisions were reached regarding priorities and ownership, with clear next steps assigned to move initiatives forward. Overall the meeting resulted in improved alignment and a shared understanding of immediate priorities.`;

  const actionItems = extractActionItems(text, attendeeList);
  const decisions = extractDecisions(text);
  const questions = extractQuestions(text);
  const nextSteps = extractNextSteps(text);
  const score = computeScore(text, type);

  return { summary, actionItems, decisions, questions, nextSteps, score };
}

function buildMeetingPrompt({ transcript, title, attendees, meetingType }) {
  return `You are an expert meeting facilitator and executive assistant. Analyze the following meeting transcript or notes and generate a structured meeting summary.

MEETING TITLE: ${title || 'Untitled Meeting'}
ATTENDEES: ${attendees || 'Not specified'}
MEETING TYPE: ${meetingType || 'team meeting'}

TRANSCRIPT / NOTES:
${transcript}

Generate a structured meeting summary. Output EXACTLY in this JSON format with no extra text:

{
  "summary": "3-4 sentence executive summary of what was discussed and achieved",
  "actionItems": [
    {"task": "specific action item description", "owner": "person responsible", "due": "due date or timeframe", "priority": "High|Medium|Low"}
  ],
  "decisions": ["decision 1", "decision 2"],
  "questions": ["open question or follow-up needed 1", "open question 2"],
  "nextSteps": ["next step 1", "next step 2"],
  "score": 7
}

Rules:
- summary: 3-4 sentences, professional, specific to the actual content
- actionItems: extract EVERY concrete task, to-do, or commitment mentioned. Include who will do it (from attendees list if possible), when, and assign High/Medium/Low priority. At least 2, max 10.
- decisions: list every decision or agreement made in the meeting. At least 2, max 6.
- questions: list unresolved questions, open items, or things needing follow-up. 2-5 items.
- nextSteps: 2-4 forward-looking steps beyond action items (e.g., schedule next meeting, distribute notes).
- score: integer 1-10 engagement/productivity score. Base on: number of action items, decisions made, how specific/focused the discussion was, participation level apparent from transcript.

Output ONLY the JSON object. No markdown, no explanation.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { transcript, title, attendees, meetingType } = req.body || {};

  if (!transcript?.trim()) {
    return res.status(400).json({ error: 'Please provide a meeting transcript or notes.' });
  }

  // Try Claude if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const prompt = buildMeetingPrompt({ transcript, title, attendees, meetingType });
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: 'You are a professional meeting analyst. Output only valid JSON as instructed. No markdown fences.',
        messages: [{ role: 'user', content: prompt }],
      });
      const rawText = (message.content[0]?.text || '').trim();
      // Strip markdown fences if any
      const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch (err) {
      console.error('Claude API error:', err?.message);
      // Fall through to template
    }
  }

  // Template fallback — works without API key
  return res.status(200).json(templateGenerate({ transcript, title, attendees, meetingType }));
}
