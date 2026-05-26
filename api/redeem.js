// Vercel serverless function — /api/redeem
// Validates an access code purchased via Payhip

// Access codes are set via PAID_TOKENS env var (comma-separated)
// e.g. PAID_TOKENS=RZAI-DZY25-A1,RZAI-DZY25-A2
const VALID_CODES = new Set(
  (process.env.PAID_TOKENS || "RZAI-DZY25-A1,RZAI-DZY25-A2,RZAI-DZY25-A3,RZAI-DZY25-A4,RZAI-DZY25-A5")
    .split(",")
    .map(t => t.trim().toUpperCase())
    .filter(Boolean)
);

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { code } = req.body || {};
  const normalized = (code || "").trim().toUpperCase();

  if (!normalized) {
    return res.status(400).json({ valid: false, error: "No code provided" });
  }

  return res.status(200).json({ valid: VALID_CODES.has(normalized) });
}
