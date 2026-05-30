// /api/seo — SEO blog article generator
// With ANTHROPIC_API_KEY: Claude Haiku; without: template generator

const wordCounts = { short: 500, medium: 1000, long: 2000 };

function templateArticle(keyword, secondary, length, audience, purpose, tone) {
  const secKw = secondary ? secondary.split(",").map(s => s.trim()).slice(0, 5) : [];
  const wc = wordCounts[length] || 1000;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  const title = `${cap(keyword)}: The Complete Guide for ${cap(audience || "Beginners")} in ${new Date().getFullYear()}`;
  const metaDesc = `Discover everything you need to know about ${keyword}. This guide covers ${secKw.slice(0, 2).join(", ") || "key strategies"} to help ${audience || "you"} get results fast.`.slice(0, 155);

  const outline = [
    { h2: `What Is ${cap(keyword)}?`, h3s: [`Understanding ${cap(keyword)}`, `Why ${cap(keyword)} Matters`] },
    { h2: `Key Benefits of ${cap(keyword)}`, h3s: secKw.slice(0, 2).map(k => `How ${cap(k)} Helps`) },
    { h2: `How to Get Started with ${cap(keyword)}`, h3s: ["Step 1: Research", "Step 2: Implementation", "Step 3: Optimization"] },
    { h2: `Common ${cap(keyword)} Mistakes to Avoid`, h3s: [] },
    { h2: `Best Tools and Resources`, h3s: [] },
  ];

  const article = `# ${title}

## What Is ${cap(keyword)}?

${cap(keyword)} is one of the most important concepts for ${audience || "professionals"} to understand in today's landscape. Whether you're just getting started or looking to refine your approach, understanding the fundamentals is essential.

${secKw.length > 0 ? `Key aspects include ${secKw.join(", ")}, all of which contribute to overall success.` : ""}

## Key Benefits of ${cap(keyword)}

When implemented correctly, ${keyword} delivers measurable results:

- **Increased visibility** — reach more of your target audience
- **Better performance** — streamline your workflow and reduce wasted effort
- **Long-term growth** — build a sustainable foundation for continued success
${secKw.map(k => `- **${cap(k)}** — leverage this for competitive advantage`).join("\n")}

## How to Get Started with ${cap(keyword)}

**Step 1: Research**
Before diving in, take time to understand your specific situation. Analyze your current baseline and identify the gaps you need to address.

**Step 2: Implementation**
Start with the highest-impact actions first. Focus on ${secKw[0] || "core fundamentals"} before expanding to more advanced tactics.

**Step 3: Optimization**
Track your results and iterate. The best ${keyword} strategies are built through continuous testing and refinement.

## Common ${cap(keyword)} Mistakes to Avoid

Many ${audience || "people"} make these errors when first approaching ${keyword}:

1. Skipping the research phase
2. Trying to do everything at once instead of prioritizing
3. Not tracking results consistently
4. Ignoring ${secKw[1] || "secondary factors"} that compound over time

## Best Tools and Resources

To maximize your ${keyword} results, consider these resources:
- Industry-leading analytics tools to track performance
- ${secKw.slice(0, 3).map(k => `${cap(k)} optimization platforms`).join(", ") || "Automation tools to scale your efforts"}
- Communities and forums where experts share insights

## Conclusion

Mastering ${keyword} takes time, but the results are worth the investment. Start with the fundamentals, stay consistent, and always measure your progress.`;

  const faqs = [
    { q: `What is the best way to start with ${keyword}?`, a: `Begin with thorough research, then implement the highest-impact tactics first before scaling.` },
    { q: `How long does ${keyword} take to show results?`, a: `Most people see initial results within 4-8 weeks, with significant gains after 3-6 months of consistent effort.` },
    { q: `Is ${keyword} worth it for ${audience || "small businesses"}?`, a: `Yes — the ROI from ${keyword} compounds over time, making it one of the best long-term investments.` },
  ];

  const cta = `Ready to master ${keyword}? Start implementing these strategies today and track your results from day one.`;

  return { title, metaDesc, outline, article, faqs, cta, wordCount: wc };
}

function buildSeoPrompt({ keyword, secondary, length, audience, purpose, tone }) {
  const wc = wordCounts[length] || 1000;
  const toneMap = { professional: "professional", conversational: "conversational and friendly", authoritative: "authoritative and expert", simple: "simple and beginner-friendly" };
  const toneStr = toneMap[tone?.toLowerCase()] || "professional";
  const secList = secondary ? secondary.split(",").map(s => s.trim()).slice(0, 5) : [];

  return `You are an expert SEO content writer. Write a complete, high-quality blog article.

PRIMARY KEYWORD: ${keyword}
SECONDARY KEYWORDS: ${secList.join(", ") || "none"}
TARGET LENGTH: ~${wc} words
TARGET AUDIENCE: ${audience || "general readers"}
PURPOSE: ${purpose || "informational"}
TONE: ${toneStr}

Output ONLY valid JSON (no markdown code blocks):
{
  "title": "SEO H1 title including primary keyword",
  "metaDesc": "Meta description 120-155 chars with keyword",
  "outline": [{"h2": "...", "h3s": ["..."]}],
  "article": "Full article in markdown with H2/H3 headers, ~${wc} words",
  "faqs": [{"q": "...", "a": "..."}],
  "cta": "Call to action paragraph",
  "wordCount": ${wc}
}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { keyword, secondary, length = "medium", audience, purpose, tone } = req.body || {};
  if (!keyword?.trim()) return res.status(400).json({ error: "Keyword is required." });

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const wc = wordCounts[length] || 1000;
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: wc > 1000 ? 4000 : 2500,
        messages: [{ role: "user", content: buildSeoPrompt({ keyword, secondary, length, audience, purpose, tone }) }],
      });
      const raw = msg.content[0]?.text || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.status(200).json(JSON.parse(jsonMatch[0]));
      }
    } catch (err) {
      console.error("Claude error:", err?.message);
    }
  }

  return res.status(200).json(templateArticle(keyword, secondary, length, audience, purpose, tone));
}
