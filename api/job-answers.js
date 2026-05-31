// Vercel serverless function — /api/job-answers
// Accepts: jobDescription, role, company
// With ANTHROPIC_API_KEY: Claude Haiku generates tailored answers
// Without key: template answers using extracted keywords
// Returns: { answers: [{question, answer}] }

const QUESTIONS = [
  "Why do you want to work here?",
  "Describe a challenge you overcame.",
  "Where do you see yourself in 5 years?",
  "What is your greatest strength?",
  "Why are you leaving your current role?",
];

function extractKeywords(text) {
  const stop = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","are","was","were","be","been","have","has","had","do","does","did","will","would","could","should","may","might","this","that","these","those","we","you","i","it","he","she","they","our","your","my","their","its","as","not","if","from","about","up","out","so","who","what","when","how","all","also","just","can","than","then","only","some","any","into","over","after","more","most","other","same","us","them","their","role","position","job","work","team","company","experience","skills","ability","looking","seeking","candidate","required","requirements","preferred","strong","excellent","good","great"]);
  const words = (text || "").toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq = {};
  words.filter(w => !stop.has(w)).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w]) => w);
}

function templateAnswers(jobDescription, role, company) {
  const kw = extractKeywords(jobDescription);
  const co = company || "your company";
  const ro = role || "this role";
  const k0 = kw[0] || "innovation";
  const k1 = kw[1] || "collaboration";
  const k2 = kw[2] || "problem-solving";
  const k3 = kw[3] || "technical excellence";
  const k4 = kw[4] || "continuous improvement";

  return [
    {
      question: QUESTIONS[0],
      answer: `I'm drawn to ${co} because of your focus on ${k0} and ${k1}. The ${ro} aligns directly with my experience in ${k2}, and I've been following ${co}'s work closely — the culture of ${k3} you've built is exactly the environment where I do my best work. I want to contribute to a team that takes ${k4} seriously, and from everything I've learned about ${co}, that's a core part of how you operate.`,
    },
    {
      question: QUESTIONS[1],
      answer: `In a previous role, I was tasked with improving our ${k0} process while simultaneously managing ${k1} across multiple stakeholders. The challenge was balancing speed with quality — deadlines were tight and expectations high. I broke the problem into smaller milestones, established clear communication channels, and used ${k2} frameworks to prioritize. We delivered on time with measurable improvements in ${k3}. That experience taught me that clear thinking under pressure, combined with proactive communication, is what separates good outcomes from great ones.`,
    },
    {
      question: QUESTIONS[2],
      answer: `In five years, I see myself as a go-to expert in ${k0} and ${k2}, with a deeper understanding of ${k1} at scale. I'd love to take on more responsibility — mentoring junior team members and contributing to strategic decisions around ${k3}. At ${co}, I can see a clear path: starting in the ${ro}, proving my value through ${k4}, and growing alongside the company. I'm in this for the long term.`,
    },
    {
      question: QUESTIONS[3],
      answer: `My greatest strength is the ability to combine ${k2} skills with strong ${k1}. I can quickly understand complex systems and translate them into actionable plans that my team can execute. Specifically, my background in ${k0} has given me a lens for approaching problems that others sometimes overlook. I back this up with ${k3} practices and a drive for ${k4} — I'm rarely satisfied with "good enough" when I know there's a better approach.`,
    },
    {
      question: QUESTIONS[4],
      answer: `I've grown a lot in my current role, and I'm proud of what I've contributed in ${k0} and ${k2}. But I've reached a point where I'm looking for new challenges — specifically, the opportunity to work on ${k1} at the level ${co} operates. The ${ro} represents the kind of scope and impact I want to pursue next. I'm not leaving because of dissatisfaction — I'm moving toward something that excites me deeply.`,
    },
  ];
}

function buildPrompt(jobDescription, role, company) {
  return `You are an expert career coach helping a job applicant prepare answers to common interview and application questions.

JOB DESCRIPTION:
${jobDescription}

ROLE: ${role || "Not specified"}
COMPANY: ${company || "Not specified"}

Generate concise, compelling, first-person answers to the following 5 questions. Each answer should:
- Be 3-5 sentences, natural and human-sounding
- Reference specific details from the job description
- Be honest and professional in tone
- NOT use hollow filler phrases like "I am passionate about..."

For each question, output exactly in this format:
QUESTION: <the question>
ANSWER: <the answer>
---

Questions:
1. Why do you want to work here?
2. Describe a challenge you overcame.
3. Where do you see yourself in 5 years?
4. What is your greatest strength?
5. Why are you leaving your current role?`;
}

function parseClaudeOutput(text) {
  const blocks = text.split(/---+/).map(b => b.trim()).filter(Boolean);
  const answers = [];
  for (const block of blocks) {
    const qMatch = block.match(/QUESTION:\s*(.+)/i);
    const aMatch = block.match(/ANSWER:\s*([\s\S]+)/i);
    if (qMatch && aMatch) {
      answers.push({ question: qMatch[1].trim(), answer: aMatch[1].trim() });
    }
  }
  // If parsing fails, fall back to splitting by known questions
  if (answers.length < 5) return null;
  return answers;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { jobDescription, role, company } = req.body || {};
  if (!jobDescription?.trim()) {
    return res.status(400).json({ error: "jobDescription is required." });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: "You are an expert career coach. Output only what is asked, formatted exactly as instructed.",
        messages: [{ role: "user", content: buildPrompt(jobDescription, role, company) }],
      });
      const rawText = message.content[0]?.text || "";
      const parsed = parseClaudeOutput(rawText);
      if (parsed) return res.status(200).json({ answers: parsed });
      // Fall through to template if parsing failed
    } catch (err) {
      console.error("Claude API error:", err?.message);
    }
  }

  return res.status(200).json({ answers: templateAnswers(jobDescription, role, company) });
}
