// /api/product-desc — Bulk product description generator for Shopify/WooCommerce/Amazon/General
// With ANTHROPIC_API_KEY: Claude Haiku generates all descriptions in one call
// Without key: template generator per product

const WORD_COUNTS = { short: 50, medium: 150, long: 300 };

function templateDescription(name, category, features, voice, length, platform) {
  const words = (features + " " + name + " " + category).toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const stop = new Set(["this","that","with","have","from","they","their","will","been","your","more","also","about","which","when","then","into","over","some","just","like"]);
  const kw = [...new Set(words.filter(w => !stop.has(w)))].slice(0, 14);

  const kw0 = kw[0] || name.split(" ")[0].toLowerCase();
  const kw1 = kw[1] || category || "quality";
  const kw2 = kw[2] || "premium";

  const voiceMap = {
    professional: { opener: "Introducing", closer: "Designed for excellence.", adj: "professional-grade" },
    casual: { opener: "Meet your new favorite", closer: "You're going to love it!", adj: "everyday" },
    luxury: { opener: "Presenting the exquisite", closer: "Because you deserve the best.", adj: "luxury" },
    technical: { opener: "Engineered for performance:", closer: "Built to spec.", adj: "high-performance" },
  };
  const v = voiceMap[voice] || voiceMap.professional;

  const featureList = features.split(",").map(f => f.trim()).filter(Boolean);

  const headline = `${v.opener} ${name} — ${kw2.charAt(0).toUpperCase() + kw2.slice(1)} ${kw1.charAt(0).toUpperCase() + kw1.slice(1)}`;

  const targetWords = WORD_COUNTS[length] || 150;
  let body;
  if (targetWords <= 50) {
    body = `${name} delivers ${kw0} performance with ${kw1} quality. ${featureList[0] || "Premium craftsmanship"} meets ${v.adj} design. ${v.closer}`;
  } else if (targetWords <= 150) {
    body = `${name} is the perfect choice for anyone looking for ${v.adj} ${kw0} solutions. Crafted with ${kw1} in mind, this product features ${featureList.slice(0, 2).join(" and ") || kw2 + " construction"}.

Whether you're a seasoned professional or just starting out, ${name} delivers on every front. ${featureList[2] ? `With ${featureList[2]}, you get` : "You get"} exactly what you need, when you need it. ${v.closer}`;
  } else {
    body = `${name} represents the pinnacle of ${v.adj} ${kw0} design. Built for those who demand more, this exceptional product brings together ${kw1} craftsmanship and cutting-edge functionality.

${featureList.length > 0 ? `At its core, ${name} delivers: ${featureList.slice(0, 3).join(", ")}. Each element has been carefully considered to ensure maximum performance and durability.` : `Combining ${kw0} performance with ${kw2} aesthetics, every detail has been refined for the best possible experience.`}

Perfect for ${platform !== "General" ? platform + " customers" : "everyday use"}, ${name} stands apart from the competition through its commitment to quality and innovation. Whether you're a first-time buyer or a loyal customer, you'll immediately notice the difference.

${v.closer} Order today and experience the ${kw2} ${kw0} standard for yourself.`;
  }

  const bullets = [
    `${featureList[0] || "Premium quality " + kw0 + " construction"}`,
    `${featureList[1] || "Designed for " + v.adj + " use"}`,
    `${featureList[2] || "Compatible with leading " + platform + " stores"}`,
    `${featureList[3] || "Satisfaction guaranteed — hassle-free returns"}`,
    `Fast shipping & ${platform === "Amazon" ? "Prime eligible" : "easy checkout"}`,
  ];

  const keywords = [...new Set([kw0, kw1, kw2, ...kw.slice(3, 10)])].slice(0, 8);

  return { name, headline, body, bullets, keywords };
}

function buildBulkPrompt({ products, category, features, voice, length, platform }) {
  const targetWords = WORD_COUNTS[length] || 150;
  const voiceDesc = { professional: "professional and authoritative", casual: "friendly and conversational", luxury: "premium and sophisticated", technical: "technical and precise" }[voice] || "professional";

  return `You are an expert ecommerce copywriter specializing in ${platform} product descriptions.

Generate product descriptions for ALL of the following products. Use these settings for all:
- Category/Niche: ${category}
- Key Features (apply as relevant): ${features}
- Brand Voice: ${voiceDesc}
- Description Length: ~${targetWords} words per product
- Platform: ${platform}

PRODUCTS:
${products.map((p, i) => `${i + 1}. ${p}`).join("\n")}

For EACH product, generate:
- headline: short punchy headline (under 10 words)
- body: ~${targetWords} word description optimized for ${platform}
- bullets: array of exactly 5 benefit-focused bullet points (plain text, no emoji)
- keywords: array of 8 SEO keywords

Output ONLY a valid JSON array (no markdown, no commentary):
[
  {
    "name": "exact product name from list",
    "headline": "...",
    "body": "...",
    "bullets": ["...", "...", "...", "...", "..."],
    "keywords": ["...", "...", "...", "...", "...", "...", "...", "..."]
  }
]`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { products, category = "General", features = "", voice = "professional", length = "medium", platform = "Shopify" } = req.body || {};

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "products must be a non-empty array of product names." });
  }

  const cleanProducts = products.map(p => String(p).trim()).filter(Boolean);
  if (cleanProducts.length === 0) {
    return res.status(400).json({ error: "No valid product names provided." });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const maxTokens = Math.min(200 + cleanProducts.length * 600, 4096);
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: buildBulkPrompt({ products: cleanProducts, category, features, voice, length, platform }) }],
      });
      const raw = msg.content[0]?.text || "";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const descriptions = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ descriptions });
      }
    } catch (err) {
      console.error("Claude error:", err?.message);
    }
  }

  // Fallback: template generator for each product
  const descriptions = cleanProducts.map(name => templateDescription(name, category, features, voice, length, platform));
  return res.status(200).json({ descriptions });
}
