// Vercel serverless function — /api/generate
// Works with or without ANTHROPIC_API_KEY:
//   With key    → Claude Haiku (full AI tailoring)
//   Without key → keyword-extraction template (still ATS-useful)

function extractKeywords(text) {
  const stop = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","are","was","were","be","been","have","has","had","do","does","did","will","would","could","should","may","might","this","that","these","those","we","you","i","it","he","she","they","our","your","my","their","its","as","not","if","from","about","up","out","so","who","what","when","how","all","also","just","can","than","then","only","some","any","into","over","after","more","most","other","same","us","them","their"]);
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq = {};
  words.filter(w => !stop.has(w)).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
}

function templateGenerate(resume, jobDesc, tone, outputType) {
  const kw = extractKeywords(jobDesc);
  const t = {
    professional: { verb: "Delivered", style: "Results-driven professional" },
    confident:    { verb: "Drove",     style: "High-impact professional" },
    enthusiastic: { verb: "Championed",style: "Passionate and motivated professional" },
    concise:      { verb: "Built",     style: "Skilled professional" },
  }[tone?.toLowerCase()] || { verb: "Delivered", style: "Results-driven professional" };

  const top = kw[0] || "core responsibilities";
  const sk2 = kw[1] || "key deliverables";
  const sk3 = kw[2] || "cross-functional objectives";
  const sk4 = kw[3] || "strategic initiatives";

  const resumeOut = outputType === "cover" ? "" : `TAILORED RESUME
===============
[Keyword Match: ${kw.slice(0, 6).join(", ")}]

PROFESSIONAL SUMMARY
${t.style} with demonstrated expertise in ${top} and ${sk2}. Proven record of ${t.verb.toLowerCase()} results across ${sk3} while maintaining a focus on quality and impact.

OPTIMIZED EXPERIENCE BULLETS
• ${t.verb} measurable improvements in ${top}, aligning team output with organizational objectives and exceeding benchmarks
• Applied expertise in ${sk2} to streamline processes, reduce friction, and increase throughput across key workflows
• Partnered cross-functionally on ${sk3} initiatives, coordinating with stakeholders to ensure on-time, on-budget delivery
• Leveraged ${sk4} capabilities to identify and resolve bottlenecks, resulting in improved performance metrics
• Maintained consistent excellence across competing priorities while mentoring peers on ${top} best practices
• Contributed to ${kw[4] || "team initiatives"} by applying analytical thinking and structured problem-solving frameworks

SKILLS (Job Description Aligned)
${kw.slice(0, 8).map(k => `• ${k.charAt(0).toUpperCase() + k.slice(1)}`).join("\n")}
`;

  const coverOut = outputType === "resume" ? "" : `COVER LETTER
============
Dear Hiring Manager,

${t.style.split(" ")[0] === "High" ? "With a track record of high-impact results" : t.style.split(" ")[0] === "Passionate" ? "Driven by genuine passion for the work" : "With a consistent record of delivering results"} in ${top} and ${sk2}, I am excited to bring my experience to your team.

Throughout my career, I have focused on ${sk3} — ensuring that every initiative I lead creates real, lasting value. My background aligns directly with the requirements you've outlined, particularly around ${sk4} and ${kw[4] || top}.

I would welcome the opportunity to discuss how my skills in ${top} and ${sk2} can contribute to your organization's goals.

${tone?.toLowerCase() === "enthusiastic" ? "I am genuinely thrilled about this opportunity!" : tone?.toLowerCase() === "confident" ? "I am confident I will exceed your expectations from day one." : "Thank you for your time and consideration."}

Best regards,
[Your Name]
`;

  return { resume: resumeOut.trim(), coverLetter: coverOut.trim() };
}

function buildPrompt({ resume, jobDesc, name, role, tone, outputType }) {
  const toneMap = {
    professional: "professional and polished",
    confident: "confident and direct",
    enthusiastic: "enthusiastic and passionate",
    concise: "concise and punchy",
  };
  const toneDesc = toneMap[tone?.toLowerCase()] || "professional";
  const parts = [];

  if (outputType !== "cover") {
    parts.push(`## TASK 1: TAILOR THE RESUME
Rewrite the candidate's resume bullet points to match the job description.
Rules:
- Keep all facts accurate — don't invent experience
- Reframe existing experience using the JD's language and keywords
- Include relevant keywords for ATS
- Tone: ${toneDesc}
Output format:
TAILORED RESUME
===============
[full tailored resume here]`);
  }

  if (outputType !== "resume") {
    parts.push(`## TASK 2: COVER LETTER
Write a compelling cover letter.
Rules:
- Open with a specific hook (not "I am writing to apply for…")
- Reference 2-3 specific JD requirements and match them to candidate experience
- Keep it to 3-4 paragraphs, under 350 words
- Tone: ${toneDesc}
- Candidate name: ${name || "the candidate"}
- Role: ${role || "the position"}
Output format:
COVER LETTER
============
[cover letter here]`);
  }

  return `You are an expert career coach and resume writer.

CANDIDATE RESUME:
${resume}

JOB DESCRIPTION:
${jobDesc}

${parts.join("\n\n")}

Output ONLY the requested content. No meta-commentary.`;
}

function parseOutput(text, outputType) {
  let resumeText = "";
  let coverText = "";
  if (outputType !== "cover") {
    const m = text.match(/TAILORED RESUME\s*={3,}\s*([\s\S]*?)(?=COVER LETTER|$)/i);
    resumeText = m ? m[1].trim() : text.trim();
  }
  if (outputType !== "resume") {
    const m = text.match(/COVER LETTER\s*={3,}\s*([\s\S]*?)$/i);
    coverText = m ? m[1].trim() : (outputType === "cover" ? text.trim() : "");
  }
  return { resume: resumeText, coverLetter: coverText };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { resume, jobDesc, name, role, tone, outputType } = req.body || {};
  if (!resume?.trim() || !jobDesc?.trim()) {
    return res.status(400).json({ error: "Resume and job description are required." });
  }

  // Try Claude if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const prompt = buildPrompt({ resume, jobDesc, name, role, tone, outputType });
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: "You are an expert resume writer and career coach. Be concise and output only what is asked.",
        messages: [{ role: "user", content: prompt }],
      });
      const rawText = message.content[0]?.text || "";
      return res.status(200).json(parseOutput(rawText, outputType || "both"));
    } catch (err) {
      console.error("Claude API error:", err?.message);
      // Fall through to template
    }
  }

  // Template fallback — works without API key
  return res.status(200).json(templateGenerate(resume, jobDesc, tone, outputType || "both"));
}
