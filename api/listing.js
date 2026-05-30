// /api/listing — Etsy/eBay listing generator
// With ANTHROPIC_API_KEY: Claude Haiku; without: template generator

function templateListing(productName, category, features, price) {
  const words = (features + " " + productName).toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const stop = new Set(["the","and","for","with","our","this","that","has","are","was","can","you","your","from","will","have","been","they","their"]);
  const kw = [...new Set(words.filter(w => !stop.has(w)))].slice(0, 12);

  const kw0 = kw[0] || productName.split(" ")[0];
  const kw1 = kw[1] || "quality";
  const kw2 = kw[2] || "handmade";

  const isEtsy = category !== "ebay";
  const isEbay = category !== "etsy";

  const title = `${productName} — ${kw0.charAt(0).toUpperCase() + kw0.slice(1)} ${kw1} Gift | ${kw2.charAt(0).toUpperCase() + kw2.slice(1)} ${isEtsy ? "Handmade" : "New"} Item`.slice(0, 80);

  const bullets = [
    `✅ ${features.split("\n")[0] || "Premium quality " + kw0}`,
    `✅ Perfect gift for ${kw1} lovers`,
    `✅ ${isEtsy ? "Handcrafted with care" : "Ships fast with tracking"}`,
    `✅ ${price ? `Great value at $${price}` : "Competitively priced"}`,
    `✅ 100% satisfaction guaranteed`,
  ];

  const description = `${productName} — the perfect ${kw0} for anyone who loves ${kw1}.\n\n${features}\n\n${isEtsy ? "Made with love and attention to detail." : "Ships within 1-3 business days with tracking."} Questions? Message us anytime!`;

  const tags = isEtsy ? kw.slice(0, 13).map(k => k.replace(/\s+/g, "")) : [];
  const keywords = kw.slice(0, 8);

  return { title, bullets, description, tags, keywords };
}

function buildListingPrompt({ productName, category, features, price, shippingInfo, photoDesc, tone }) {
  const toneMap = { professional: "professional", casual: "friendly and casual", luxury: "premium and luxurious", playful: "fun and playful" };
  const toneStr = toneMap[tone?.toLowerCase()] || "professional";
  const isEtsy = category !== "ebay";
  const isEbay = category !== "etsy";

  return `You are an expert marketplace listing writer who specializes in writing high-converting Etsy and eBay listings.

PRODUCT: ${productName}
PRICE: ${price || "Not specified"}
KEY FEATURES: ${features}
SHIPPING: ${shippingInfo || "Standard shipping"}
${photoDesc ? `PHOTO DESCRIPTION: ${photoDesc}` : ""}
TONE: ${toneStr}
PLATFORM: ${category === "both" ? "Etsy AND eBay" : category}

Generate the following (output as JSON only, no markdown):
{
  "title": "${isEtsy ? "SEO-optimized title under 80 characters for Etsy" : "eBay title under 80 chars"}",
  "bullets": ["5 bullet points highlighting key benefits"],
  "description": "Full 150-250 word listing description optimized for ${category}",
  "tags": [${isEtsy ? '"13 Etsy tags as short phrases"' : '"10 eBay keywords"'}],
  "keywords": ["8 primary SEO keywords"]
}

Output ONLY valid JSON. No commentary.`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { productName, category = "both", features, price, shippingInfo, photoDesc, tone } = req.body || {};
  if (!productName?.trim() || !features?.trim()) {
    return res.status(400).json({ error: "Product name and features are required." });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{ role: "user", content: buildListingPrompt({ productName, category, features, price, shippingInfo, photoDesc, tone }) }],
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

  return res.status(200).json(templateListing(productName, category, features, price));
}
