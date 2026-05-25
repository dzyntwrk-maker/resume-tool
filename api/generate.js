// Vercel serverless function — /api/generate
// Deploy: vercel --prod  (free Vercel account)
// Set env var ANTHROPIC_API_KEY in Vercel dashboard

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple token validation (replace with real DB lookup for paid users)
const VALID_TOKENS = new Set((process.env.PAID_TOKENS || "").split(",").filter(Boolean));

function buildPrompt({ resume, jobDesc, name, role, tone, outputType }) {
  const toneMap = {
    professional: "professional and polished",
    confident: "confident and direct",
    enthusiastic: "enthusiastic and passionate",
    concise: "concise and punchy",
  };
  const toneDesc = toneMap[tone] || "professional";

  const parts = [];

  if (outputType !== "cover") {
    parts.push(`
## TASK 1: TAILOR THE RESUME

Rewrite the candidate's resume bullet points to match the job description.

Rules:
- Keep all factual information accurate — don't invent experience
- Reframe existing experience using the JD's language and keywords
- Prioritize achievements that match the role's key requirements
- Use strong action verbs
- Include relevant keywords for ATS (Applicant Tracking Systems)
- Tone: ${toneDesc}
- Format: Output ONLY the rewritten resume in plain text, ready to paste

Output format:
TAILORED RESUME
===============
[full tailored resume here]
`);
  }

  if (outputType !== "resume") {
    parts.push(`
## TASK 2: COVER LETTER

Write a compelling cover letter.

Rules:
- Open with a specific, engaging hook (not "I am writing to apply for…")
- Reference 2-3 specific requirements from the JD and match them to the candidate's experience
- Show genuine enthusiasm for this company/role specifically
- Keep it to 3-4 paragraphs, under 350 words
- Tone: ${toneDesc}
- Candidate name: ${name || "the candidate"}
- Role: ${role || "the position"}

Output format:
COVER LETTER
============
[cover letter here]
`);
  }

  return `You are an expert career coach and professional resume writer.

CANDIDATE RESUME:
${resume}

JOB DESCRIPTION:
${jobDesc}

${parts.join("\n\n")}

Important: Output ONLY the requested content. No meta-commentary, no explanations, no "Here is your resume:" headers beyond the markers above.`;
}

function parseOutput(text, outputType) {
  let resumeText = "";
  let coverText = "";

  if (outputType !== "cover") {
    const match = text.match(/TAILORED RESUME\s*={3,}\s*([\s\S]*?)(?=COVER LETTER|$)/i);
    resumeText = match ? match[1].trim() : text.trim();
  }

  if (outputType !== "resume") {
    const match = text.match(/COVER LETTER\s*={3,}\s*([\s\S]*?)$/i);
    coverText = match ? match[1].trim() : (outputType === "cover" ? text.trim() : "");
  }

  return { resume: resumeText, coverLetter: coverText };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { resume, jobDesc, name, role, tone, outputType, token } = req.body || {};

  if (!resume?.trim() || !jobDesc?.trim()) {
    return res.status(400).json({ error: "Resume and job description are required." });
  }

  // Rate limiting: validate token or check free use header
  const isPaidUser = token && VALID_TOKENS.has(token);
  // For free users, the frontend tracks uses locally — server trusts the first request
  // In production, add IP-based rate limiting (e.g. Upstash Redis)

  try {
    const prompt = buildPrompt({ resume, jobDesc, name, role, tone, outputType });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",  // fast + cheap for this task
      max_tokens: 2000,
      system: "You are an expert resume writer and career coach. Be concise and output only what is asked.",
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = message.content[0]?.text || "";
    const parsed = parseOutput(rawText, outputType || "both");

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Claude API error:", err);
    return res.status(500).json({ error: "Generation failed. Please try again." });
  }
}
