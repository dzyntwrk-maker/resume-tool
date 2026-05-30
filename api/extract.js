// Vercel serverless function — /api/extract
// Works with or without ANTHROPIC_API_KEY:
//   With key    → Claude Haiku extracts structured fields from document text
//   Without key → Regex-based extractor for common patterns

function regexExtract(text, fields, docType) {
  const patterns = {
    // Dates
    date: /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\w+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2})\b/gi,
    // Currency / amounts
    amount: /\$[\d,]+(?:\.\d{2})?|\b[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP|CAD|AUD)\b/gi,
    total: /(?:total|amount due|grand total|subtotal|balance due)[:\s]+\$?[\d,]+(?:\.\d{2})?/gi,
    // Email
    email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi,
    // Phone
    phone: /(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g,
    // Invoice / reference numbers
    'invoice number': /(?:invoice|inv|invoice no|invoice #)[:\s#]*([A-Z0-9\-]+)/gi,
    'invoice no': /(?:invoice|inv)[:\s#]*([A-Z0-9\-]+)/gi,
    'reference number': /(?:ref|reference|ref no|ref #)[:\s#]*([A-Z0-9\-]+)/gi,
    'po number': /(?:po|purchase order)[:\s#]*([A-Z0-9\-]+)/gi,
    // Vendor / company names (heuristic)
    'vendor name': /(?:from|vendor|supplier|billed by|company)[:\s]+([A-Z][A-Za-z\s&,\.]+?)(?:\n|,|\s{2,})/gi,
    'company name': /(?:company|firm|organization|corp|inc|llc)[:\s]+([A-Z][A-Za-z\s&,\.]+?)(?:\n|,|\s{2,})/gi,
    // Client / customer
    'client name': /(?:to|bill to|client|customer)[:\s]+([A-Z][A-Za-z\s]+?)(?:\n|,|\s{2,})/gi,
    'customer name': /(?:to|bill to|client|customer)[:\s]+([A-Z][A-Za-z\s]+?)(?:\n|,|\s{2,})/gi,
    // Addresses
    address: /\d+\s+[A-Za-z0-9\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)\.?(?:[,\s]+[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5})?/gi,
    // Tax
    tax: /(?:tax|vat|gst|hst)[:\s]+\$?[\d,]+(?:\.\d{2})?/gi,
    // Due date
    'due date': /(?:due date|payment due|due by)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\w+ \d{1,2},? \d{4})/gi,
    // Contract / agreement parties
    'party 1': /(?:this agreement.*?between|party of the first part|client)[:\s]+([A-Z][A-Za-z\s&,\.]+?)(?:\n|and\b)/gi,
    'party 2': /(?:and|party of the second part|contractor|provider)[:\s]+([A-Z][A-Za-z\s&,\.]+?)(?:\n|,)/gi,
    // URLs / websites
    website: /https?:\/\/[^\s]+|www\.[^\s]+/gi,
    // Report / doc title
    title: /^#\s+(.+)|^(.+)\n[=\-]{3,}/m,
    // Percentage
    percentage: /\b\d+(?:\.\d+)?%/g,
    // Quantity
    quantity: /(?:qty|quantity|units?)[:\s]+(\d+)/gi,
  };

  const result = [];

  for (const fieldName of fields) {
    const key = fieldName.toLowerCase().trim();
    let value = null;
    let confidence = 'Low';
    let snippet = null;

    // Try exact pattern match
    const exactPattern = patterns[key];
    if (exactPattern) {
      exactPattern.lastIndex = 0;
      const match = exactPattern.exec(text);
      if (match) {
        value = (match[1] || match[0]).trim();
        snippet = match[0];
        confidence = 'High';
      }
    }

    // Fuzzy: find a pattern whose key is contained in field name
    if (!value) {
      for (const [patKey, pat] of Object.entries(patterns)) {
        if (key.includes(patKey) || patKey.includes(key.split(' ')[0])) {
          pat.lastIndex = 0;
          const m = pat.exec(text);
          if (m) {
            value = (m[1] || m[0]).trim();
            snippet = m[0];
            confidence = 'Medium';
            break;
          }
        }
      }
    }

    // Generic: search for field name label in text
    if (!value) {
      const labelPat = new RegExp(fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[:\\s]+([^\\n,;]{2,80})', 'i');
      const m = labelPat.exec(text);
      if (m) {
        value = m[1].trim();
        snippet = m[0];
        confidence = 'Medium';
      }
    }

    result.push({
      name: fieldName,
      value: value || 'Not found',
      confidence: value ? confidence : 'Low',
      snippet: snippet || null,
    });
  }

  return result;
}

function buildExtractPrompt(text, docType, fields) {
  return `You are a document data extraction expert. Extract the following fields from the ${docType} document text below.

FIELDS TO EXTRACT: ${fields.join(', ')}

DOCUMENT TEXT:
${text.slice(0, 8000)}

Output EXACTLY this JSON with no extra text:
{
  "fields": [
    {"name": "field name", "value": "extracted value or null", "confidence": "High|Medium|Low", "snippet": "raw text snippet where found or null"}
  ]
}

Rules:
- Extract EVERY field listed. If not found, set value to null.
- confidence: High = exact match with label, Medium = inferred from context, Low = not found/guessed.
- snippet: the raw 1-2 sentence excerpt from the text where the value was found. null if not found.
- value: cleaned extracted value only (no surrounding labels or punctuation).
- Output ONLY the JSON object. No markdown, no explanation.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, docType = 'general', fields = [] } = req.body || {};

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Please provide document text to extract from.' });
  }
  if (!Array.isArray(fields) || fields.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one field name to extract.' });
  }

  const rawExcerpt = text.slice(0, 300).trim();

  // Try Claude if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const prompt = buildExtractPrompt(text, docType, fields);
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: 'You are a document data extraction specialist. Output only valid JSON as instructed. No markdown fences.',
        messages: [{ role: 'user', content: prompt }],
      });
      const rawText = (message.content[0]?.text || '').trim();
      const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.status(200).json({ ...parsed, docType, rawExcerpt });
    } catch (err) {
      console.error('Claude API error:', err?.message);
      // Fall through to regex fallback
    }
  }

  // Regex fallback — works without API key
  const extractedFields = regexExtract(text, fields, docType);
  return res.status(200).json({ fields: extractedFields, docType, rawExcerpt });
}
