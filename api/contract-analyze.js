// Vercel serverless function — /api/contract-analyze
// Works with or without ANTHROPIC_API_KEY:
//   With key    → Claude Haiku (full AI contract analysis)
//   Without key → Template-based analysis using regex pattern matching

function countWords(text) {
  return (text.match(/\b\w+\b/g) || []).length;
}

function extractKeywords(text) {
  const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','this','that','these','those','we','you','i','it','he','she','they','our','your','my','their','its','as','not','if','from','about','up','out','so','who','what','when','how','all','also','just','can','than','then','only','some','any','into','over','after','more','most','other','same','us','them','very','shall','party','parties','agreement','contract','term','terms']);
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = {};
  words.filter(w => !stop.has(w)).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w]) => w);
}

const RED_FLAG_PATTERNS = [
  { pattern: /auto[\s-]?renew|automatically renew/i, flag: 'Auto-renewal clause', explanation: 'Contract renews automatically — you may be locked in unless you cancel within a specific window.' },
  { pattern: /unlimited liability|without limit|no cap on liability/i, flag: 'Unlimited liability exposure', explanation: 'No cap on damages means you could face unlimited financial exposure in a dispute.' },
  { pattern: /indemnif(y|ication|ies)/i, flag: 'Broad indemnification clause', explanation: 'You may be required to cover legal costs and damages for the other party, potentially beyond your control.' },
  { pattern: /sole discretion|at its (sole )?discretion|unilaterally/i, flag: 'Unilateral discretion granted to other party', explanation: 'The other party can make key decisions without your input or approval.' },
  { pattern: /waiv(e|er|ing) (any|all|your) (rights?|claims?|remedies)/i, flag: 'Rights waiver', explanation: 'You may be giving up important legal rights or remedies.' },
  { pattern: /non[\s-]?compet(e|ition)/i, flag: 'Non-compete restriction', explanation: 'You may be restricted from working with competitors or in certain fields after this contract ends.' },
  { pattern: /liquidated damages/i, flag: 'Liquidated damages clause', explanation: 'Pre-set financial penalties may apply for breach — verify the amounts are reasonable.' },
  { pattern: /perpetual|irrevocable|worldwide/i, flag: 'Perpetual/irrevocable rights granted', explanation: 'Rights granted may never expire, which could be overly broad.' },
  { pattern: /at will|without cause|without notice/i, flag: 'At-will or no-notice termination', explanation: 'Either party can terminate without cause or advance notice, creating instability.' },
  { pattern: /govern(ed|ing) by.{0,40}(delaware|cayman|nevada|offshore)/i, flag: 'Potentially unfavorable governing law', explanation: 'Governing jurisdiction may be inconvenient or unfavorable for you to litigate in.' },
  { pattern: /arbitrat(e|ion|ing)/i, flag: 'Mandatory arbitration', explanation: 'Disputes must go to arbitration — you may be waiving your right to a jury trial.' },
  { pattern: /class action waiver|no class action/i, flag: 'Class action waiver', explanation: 'You cannot join or bring class action lawsuits, limiting your collective legal options.' },
  { pattern: /intellectual property.{0,60}(assign|transfer|vest)/i, flag: 'IP assignment clause', explanation: 'Your intellectual property may be assigned to the other party — review scope carefully.' },
  { pattern: /consequential|punitive|incidental damage/i, flag: 'Consequential damages waiver', explanation: 'Limits on damages may prevent full recovery of losses if the other party breaches.' },
  { pattern: /force majeure/i, flag: 'Force majeure clause present', explanation: 'Verify whether force majeure is defined broadly enough to cover scenarios relevant to you.' },
];

const MISSING_CLAUSE_CHECKS = {
  'employment': [
    { key: 'termination', pattern: /terminat(e|ion|ing)/i, clause: 'Termination procedure & notice period' },
    { key: 'compensation', pattern: /salary|wage|compensation|pay(ment)?/i, clause: 'Compensation & payment terms' },
    { key: 'benefits', pattern: /benefit|insurance|vacation|pto|leave/i, clause: 'Employee benefits (insurance, PTO, leave)' },
    { key: 'confidentiality', pattern: /confidential|non[\s-]?disclosure|nda/i, clause: 'Confidentiality / NDA provisions' },
    { key: 'dispute', pattern: /dispute|arbitrat|mediat/i, clause: 'Dispute resolution mechanism' },
    { key: 'governing', pattern: /govern(ed|ing) by|applicable law|jurisdiction/i, clause: 'Governing law & jurisdiction' },
  ],
  'nda': [
    { key: 'definition', pattern: /confidential information.{0,60}(means|defined|includes)/i, clause: 'Clear definition of confidential information' },
    { key: 'duration', pattern: /(\d+)\s*year|term|duration|expir/i, clause: 'Duration / term of confidentiality obligation' },
    { key: 'exclusions', pattern: /exclud(e|es|ing)|except(ion)?|public domain|prior knowledge/i, clause: 'Exclusions from confidential information' },
    { key: 'return', pattern: /return|destroy|delete.{0,30}(information|materials|data)/i, clause: 'Return/destruction of confidential materials' },
    { key: 'remedy', pattern: /injunctive|remedy|irreparable/i, clause: 'Remedies for breach (injunctive relief)' },
  ],
  'vendor': [
    { key: 'scope', pattern: /scope of (work|services)|deliverable/i, clause: 'Scope of work / deliverables' },
    { key: 'payment', pattern: /payment|invoice|net[\s-]?\d+|billing/i, clause: 'Payment terms & invoicing schedule' },
    { key: 'warranty', pattern: /warrant(y|ies|ee)/i, clause: 'Warranties & representations' },
    { key: 'liability', pattern: /liability|indemnif/i, clause: 'Limitation of liability' },
    { key: 'ip', pattern: /intellectual property|ownership|license/i, clause: 'Intellectual property ownership' },
    { key: 'termination', pattern: /terminat(e|ion)/i, clause: 'Termination conditions & notice' },
  ],
  'lease': [
    { key: 'rent', pattern: /rent|monthly payment|base rent/i, clause: 'Rent amount & payment schedule' },
    { key: 'deposit', pattern: /security deposit|deposit/i, clause: 'Security deposit terms' },
    { key: 'maintenance', pattern: /maintenance|repair|upkeep/i, clause: 'Maintenance & repair responsibilities' },
    { key: 'sublease', pattern: /sublease|sublet/i, clause: 'Subletting / sublease rights' },
    { key: 'renewal', pattern: /renew(al)?|option to extend/i, clause: 'Lease renewal options' },
    { key: 'earlyterm', pattern: /early terminat|break clause|exit clause/i, clause: 'Early termination / break clause' },
  ],
  'service': [
    { key: 'sla', pattern: /service level|sla|uptime|availability/i, clause: 'Service Level Agreement (SLA)' },
    { key: 'payment', pattern: /payment|fee|price|invoice/i, clause: 'Fees & payment terms' },
    { key: 'liability', pattern: /liability|limitation/i, clause: 'Limitation of liability' },
    { key: 'ip', pattern: /intellectual property|license|ownership/i, clause: 'Intellectual property rights' },
    { key: 'data', pattern: /data (privacy|protection|security)|gdpr|personal data/i, clause: 'Data privacy & security provisions' },
    { key: 'termination', pattern: /terminat(e|ion)/i, clause: 'Termination rights & procedures' },
  ],
  'general': [
    { key: 'parties', pattern: /party|parties|between/i, clause: 'Clear identification of parties' },
    { key: 'payment', pattern: /payment|fee|compensation|consideration/i, clause: 'Payment / consideration terms' },
    { key: 'termination', pattern: /terminat(e|ion)/i, clause: 'Termination conditions' },
    { key: 'liability', pattern: /liability|limitation/i, clause: 'Limitation of liability' },
    { key: 'dispute', pattern: /dispute|arbitrat|mediat/i, clause: 'Dispute resolution' },
    { key: 'governing', pattern: /govern(ed|ing) by|applicable law/i, clause: 'Governing law & jurisdiction' },
  ],
};

function computeRiskScore(text, redFlags) {
  let score = 0;
  const wordCount = countWords(text);

  // Base score from document length (longer = more to check)
  if (wordCount < 200) score += 20; // Very short = likely incomplete

  // Each red flag adds to risk
  score += redFlags.length * 12;

  // Additional heuristic patterns
  if (/unlimited liability/i.test(text)) score += 15;
  if (/perpetual.{0,30}irrevocable/i.test(text)) score += 10;
  if (/non[\s-]?compet/i.test(text) && /non[\s-]?solicit/i.test(text)) score += 10;
  if (/(waiv(e|er|ing)).{0,60}(right|claim|remedy)/i.test(text)) score += 10;

  score = Math.min(100, score);

  if (score >= 60) return { score, level: 'High', color: '#ef4444' };
  if (score >= 30) return { score, level: 'Medium', color: '#f59e0b' };
  return { score, level: 'Low', color: '#10b981' };
}

function extractKeyTerms(text, docType) {
  const terms = [];
  const kw = extractKeywords(text);

  // Common contractual terms to look for
  const termDefs = [
    { term: 'Effective Date', pattern: /effective (date|as of)[:\s]+([^\n.]{5,60})/i, importance: 'High' },
    { term: 'Term / Duration', pattern: /(term|duration|period)[:\s]+([^\n.]{5,60})/i, importance: 'High' },
    { term: 'Termination Notice', pattern: /(\d+)\s*(days?|weeks?|months?)\s*(written\s*)?notice/i, importance: 'High' },
    { term: 'Payment Terms', pattern: /(net[\s-]?\d+|due within \d+|payable (within|in) \d+)/i, importance: 'High' },
    { term: 'Governing Law', pattern: /govern(ed|ing) by the laws? of ([^\n.]{5,60})/i, importance: 'Medium' },
    { term: 'Liability Cap', pattern: /liability.{0,40}(not exceed|limited to|cap(ped)? at)[:\s]+([^\n.]{5,60})/i, importance: 'High' },
    { term: 'Confidentiality Period', pattern: /confidential.{0,60}(\d+)\s*(year|month)/i, importance: 'Medium' },
    { term: 'Renewal Terms', pattern: /renew(s?|al).{0,80}(automatically|annually|(\d+)\s*(year|month))/i, importance: 'Medium' },
    { term: 'Dispute Resolution', pattern: /(arbitrat|mediat|litigation).{0,80}/i, importance: 'Medium' },
    { term: 'Indemnification', pattern: /indemnif(y|ication).{0,100}/i, importance: 'Medium' },
  ];

  for (const td of termDefs) {
    const m = text.match(td.pattern);
    if (m) {
      terms.push({
        term: td.term,
        definition: m[0].replace(/\n/g, ' ').trim().slice(0, 120),
        importance: td.importance,
      });
    }
  }

  // Fill with keyword-based terms if we have fewer than 4
  if (terms.length < 4) {
    const fillers = [
      { term: 'Contract Type', definition: docType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), importance: 'Medium' },
      { term: 'Key Topic', definition: kw.slice(0, 3).join(', '), importance: 'Low' },
    ];
    for (const f of fillers) {
      if (!terms.find(t => t.term === f.term)) terms.push(f);
    }
  }

  return terms.slice(0, 8);
}

function detectRedFlags(text) {
  const found = [];
  for (const rf of RED_FLAG_PATTERNS) {
    if (rf.pattern.test(text)) {
      const match = text.match(rf.pattern);
      found.push({
        flag: rf.flag,
        explanation: rf.explanation,
        excerpt: match ? match[0].trim().slice(0, 150) : '',
      });
    }
  }
  return found;
}

function detectMissingClauses(text, docType) {
  const typeKey = docType.replace('employment-contract', 'employment')
    .replace('vendor-agreement', 'vendor')
    .replace('service-agreement', 'service')
    .replace('general', 'general');

  const checks = MISSING_CLAUSE_CHECKS[typeKey] || MISSING_CLAUSE_CHECKS['general'];
  const missing = [];

  for (const check of checks) {
    if (!check.pattern.test(text)) {
      missing.push({ clause: check.clause, present: false });
    }
  }
  return missing;
}

function generateSummary(text, docType, kw) {
  const wordCount = countWords(text);
  const hasPayment = /payment|fee|salary|compensation|rent/i.test(text);
  const hasTermination = /terminat(e|ion)/i.test(text);
  const hasConfidentiality = /confidential|nda|non[\s-]?disclosure/i.test(text);
  const hasIP = /intellectual property|copyright|patent|trademark/i.test(text);

  const typeLabel = {
    'employment-contract': 'employment contract',
    'vendor-agreement': 'vendor agreement',
    'nda': 'non-disclosure agreement',
    'lease': 'lease agreement',
    'service-agreement': 'service agreement',
    'general': 'agreement',
  }[docType] || 'agreement';

  let summary = `This ${typeLabel} is approximately ${wordCount} words long. `;
  summary += hasPayment ? 'It includes payment or compensation provisions. ' : 'No clear payment terms were detected. ';
  summary += hasTermination ? 'Termination conditions are addressed. ' : 'Termination procedures appear to be absent or unclear. ';
  if (hasConfidentiality) summary += 'Confidentiality obligations are present. ';
  if (hasIP) summary += 'Intellectual property provisions are included. ';
  summary += `Key topics referenced include: ${kw.slice(0, 5).join(', ')}.`;

  return summary;
}

function generateNextSteps(redFlags, missingClauses, riskLevel) {
  const steps = [];

  if (riskLevel === 'High') {
    steps.push('Consult a licensed attorney before signing — this document has significant risk factors.');
  } else if (riskLevel === 'Medium') {
    steps.push('Review flagged clauses with a legal professional before agreeing to the terms.');
  } else {
    steps.push('Review the document thoroughly even though risk indicators are low.');
  }

  if (missingClauses.length > 0) {
    steps.push(`Request the other party add the following missing sections: ${missingClauses.slice(0, 3).map(m => m.clause).join(', ')}.`);
  }

  if (redFlags.find(f => f.flag.includes('indemnification') || f.flag.includes('liability'))) {
    steps.push('Negotiate a mutual indemnification clause and cap on liability if none exists.');
  }

  if (redFlags.find(f => f.flag.includes('auto-renewal') || f.flag.includes('Auto-renewal'))) {
    steps.push('Set a calendar reminder to review and opt out of auto-renewal before the cancellation window closes.');
  }

  if (redFlags.find(f => f.flag.includes('arbitration') || f.flag.includes('Arbitration'))) {
    steps.push('Understand the arbitration process — ask for the name of the arbitration body and its rules.');
  }

  steps.push('Keep a signed copy of the final agreement in a secure, easily accessible location.');

  return steps.slice(0, 6);
}

function templateGenerate({ text, docType, focus }) {
  const kw = extractKeywords(text);
  const redFlags = detectRedFlags(text);
  const missingClauses = detectMissingClauses(text, docType);
  const keyTerms = extractKeyTerms(text, docType);
  const { score: riskScore, level: riskLevel, color: riskColor } = computeRiskScore(text, redFlags);
  const summary = generateSummary(text, docType, kw);
  const nextSteps = generateNextSteps(redFlags, missingClauses, riskLevel);

  const obligations = {
    partyA: `Review all payment and delivery obligations carefully. Ensure all deadlines specified in this agreement are tracked. ${kw[0] ? `The term "${kw[0]}" appears central — verify your responsibilities around it.` : ''}`,
    partyB: `The counterparty is obligated to fulfill any service, delivery, or payment commitments described. ${kw[1] ? `Obligations related to "${kw[1]}" should be confirmed in writing.` : ''} Hold the other party accountable for any representations made.`,
  };

  return {
    riskScore,
    riskLevel,
    riskColor,
    keyTerms,
    redFlags,
    missingClauses,
    summary,
    obligations,
    nextSteps,
    disclaimer: 'This analysis is generated by AI and is for informational purposes only. It does not constitute legal advice. Always consult a licensed attorney before signing any legal document.',
  };
}

function buildPrompt({ text, docType, focus }) {
  const focusInstructions = {
    'risk': 'Focus heavily on risk factors, red flags, and liability issues.',
    'key-terms': 'Focus heavily on extracting and defining all key contractual terms.',
    'obligations': 'Focus heavily on identifying what each party is obligated to do.',
    'all': 'Provide a comprehensive analysis covering all aspects equally.',
  }[focus] || 'Provide a comprehensive analysis.';

  return `You are a senior contract attorney with 20 years of experience reviewing legal documents. Analyze the following ${docType.replace(/-/g, ' ')} document and produce a structured JSON analysis. ${focusInstructions}

DOCUMENT TEXT:
${text.slice(0, 8000)}

Output EXACTLY this JSON with no extra text or markdown:

{
  "riskScore": 45,
  "riskLevel": "Medium",
  "riskColor": "#f59e0b",
  "keyTerms": [
    {"term": "Term Name", "definition": "What this term means in plain English (max 150 chars)", "importance": "High|Medium|Low"}
  ],
  "redFlags": [
    {"flag": "Short flag title", "explanation": "Plain-English explanation of why this is a concern", "excerpt": "Exact clause excerpt (max 150 chars)"}
  ],
  "missingClauses": [
    {"clause": "Clause name that should be present but isn't", "present": false}
  ],
  "summary": "3-4 sentence plain-English summary of what this document does and its overall structure",
  "obligations": {
    "partyA": "Plain-English summary of what the first party (typically the signer) must do",
    "partyB": "Plain-English summary of what the counterparty must do"
  },
  "nextSteps": ["Actionable recommendation 1", "Actionable recommendation 2"],
  "disclaimer": "This analysis is generated by AI and is for informational purposes only. It does not constitute legal advice. Always consult a licensed attorney before signing any legal document."
}

Rules:
- riskScore: integer 0-100 (0=no risk, 100=extremely high risk)
- riskLevel: "Low" (0-29), "Medium" (30-59), or "High" (60-100)
- riskColor: "#10b981" for Low, "#f59e0b" for Medium, "#ef4444" for High
- keyTerms: 4-8 items, extract actual terms from the document
- redFlags: 0-10 items, only real concerns found in the text
- missingClauses: clauses that should be in this type of document but are absent
- obligations: plain English, 2-4 sentences each, specific to the actual document
- nextSteps: 3-6 concrete, actionable steps
- Output ONLY valid JSON. No markdown, no explanation.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, docType = 'general', focus = 'all' } = req.body || {};

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Please provide contract or document text.' });
  }

  if (text.trim().length < 50) {
    return res.status(400).json({ error: 'Document text is too short for meaningful analysis. Please paste more of the document.' });
  }

  // Try Claude if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const prompt = buildPrompt({ text, docType, focus });
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: 'You are a senior contract attorney. Output only valid JSON as instructed. No markdown fences.',
        messages: [{ role: 'user', content: prompt }],
      });
      const rawText = (message.content[0]?.text || '').trim();
      const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch (err) {
      console.error('Claude API error:', err?.message);
      // Fall through to template
    }
  }

  // Template fallback — works without API key
  return res.status(200).json(templateGenerate({ text, docType, focus }));
}
