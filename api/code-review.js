// Vercel serverless function — /api/code-review
// Works with or without ANTHROPIC_API_KEY:
//   With key    → Claude Haiku performs AI-powered code review
//   Without key → Pattern-based reviewer for common issues

function detectLanguage(code) {
  if (/^\s*import\s+React|jsx|tsx|\.jsx|\.tsx/.test(code)) return 'javascript';
  if (/def |import |print\(|:\s*$/.test(code)) return 'python';
  if (/func |package main|:=/.test(code)) return 'go';
  if (/fn |let mut|impl |use std/.test(code)) return 'rust';
  return 'javascript';
}

function getLineNumber(code, index) {
  return code.substring(0, index).split('\n').length;
}

function patternReview(code, language, focus, severity) {
  const issues = [];
  const lines = code.split('\n');

  const patterns = [
    // Security
    {
      regex: /console\.(log|debug|info|warn)\s*\(/g,
      severity: 'Warning',
      category: 'security',
      issue: 'Console statement left in production code',
      suggestion: 'Remove console statements before deploying to production. Use a proper logging library with log levels instead.',
      fix: (match) => `// TODO: Remove — ${match}`,
    },
    {
      regex: /password\s*=\s*['"][^'"]{3,}['"]/gi,
      severity: 'Critical',
      category: 'security',
      issue: 'Hardcoded password detected in source code',
      suggestion: 'Never hardcode credentials. Use environment variables (process.env.PASSWORD) or a secrets manager.',
      fix: () => `password = process.env.PASSWORD`,
    },
    {
      regex: /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_\-]{10,}['"]/gi,
      severity: 'Critical',
      category: 'security',
      issue: 'Hardcoded API key detected',
      suggestion: 'Move API keys to environment variables. Rotate the exposed key immediately if committed to version control.',
      fix: () => `apiKey = process.env.API_KEY`,
    },
    {
      regex: /SELECT\s+\*?\s+FROM\s+\w+\s+WHERE\s+\w+\s*=\s*['"`]?\s*\+/gi,
      severity: 'Critical',
      category: 'security',
      issue: 'Potential SQL injection vulnerability',
      suggestion: 'Use parameterized queries or prepared statements instead of string concatenation.',
      fix: () => `db.query('SELECT * FROM table WHERE id = ?', [id])`,
    },
    {
      regex: /innerHTML\s*=\s*(?!['"`]<)/g,
      severity: 'Critical',
      category: 'security',
      issue: 'Potential XSS vulnerability via innerHTML assignment',
      suggestion: 'Use textContent for plain text or sanitize HTML with DOMPurify before setting innerHTML.',
      fix: () => `element.textContent = userInput; // or use DOMPurify.sanitize()`,
    },
    {
      regex: /eval\s*\(/g,
      severity: 'Critical',
      category: 'security',
      issue: 'Use of eval() is a security risk',
      suggestion: 'Avoid eval(). It can execute arbitrary code. Use JSON.parse() for data, or restructure the logic.',
      fix: () => `JSON.parse(jsonString) // if parsing data`,
    },
    // Performance
    {
      regex: /for\s*\([^)]+\)\s*\{[^}]*\.querySelector/g,
      severity: 'Warning',
      category: 'performance',
      issue: 'DOM query inside a loop — causes repeated reflows',
      suggestion: 'Cache the DOM query result before the loop to avoid repeated layout recalculations.',
      fix: () => `const el = document.querySelector(selector);\nfor (...) { /* use el */ }`,
    },
    {
      regex: /setTimeout\s*\(\s*['"]|setInterval\s*\(\s*['"]/g,
      severity: 'Warning',
      category: 'performance',
      issue: 'String passed to setTimeout/setInterval (implicit eval)',
      suggestion: 'Pass a function reference instead of a string to avoid implicit eval.',
      fix: () => `setTimeout(() => { myFunction(); }, delay)`,
    },
    {
      regex: /new\s+Array\s*\(\s*\d{4,}\s*\)/g,
      severity: 'Suggestion',
      category: 'performance',
      issue: 'Very large array pre-allocation detected',
      suggestion: 'Consider whether this large pre-allocation is necessary. Use lazy loading or pagination if possible.',
      fix: () => `// Consider using generators or pagination instead`,
    },
    // Readability
    {
      regex: /\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK|\/\/\s*XXX/gi,
      severity: 'Suggestion',
      category: 'readability',
      issue: 'TODO/FIXME comment left in code',
      suggestion: 'Resolve or track this TODO in your issue tracker. Unresolved TODOs accumulate technical debt.',
      fix: () => `// Tracked in issue #123`,
    },
    {
      regex: /function\s+\w+\s*\([^)]{80,}\)/g,
      severity: 'Warning',
      category: 'readability',
      issue: 'Function with too many parameters',
      suggestion: 'Functions with many parameters are hard to call correctly. Consider using an options object pattern.',
      fix: () => `function myFunc({ param1, param2, param3 }) { ... }`,
    },
    {
      regex: /var\s+\w+/g,
      severity: 'Suggestion',
      category: 'readability',
      issue: "Use of 'var' — prefer 'const' or 'let'",
      suggestion: "Replace 'var' with 'const' for values that don't change, or 'let' for reassignable variables.",
      fix: (match) => match.replace('var ', 'const '),
    },
    {
      regex: /catch\s*\([^)]*\)\s*\{\s*\}/g,
      severity: 'Warning',
      category: 'readability',
      issue: 'Empty catch block — errors silently swallowed',
      suggestion: 'Always handle or at minimum log errors in catch blocks. Silent failures are hard to debug.',
      fix: () => `catch (err) {\n  console.error('Unexpected error:', err);\n  throw err;\n}`,
    },
    // Error handling
    {
      regex: /fetch\s*\([^)]+\)(?!\s*\.catch|\s*\.then[^;]*\.catch)/g,
      severity: 'Warning',
      category: 'security',
      issue: 'fetch() call without error handling',
      suggestion: 'Always add .catch() or use try/catch with async/await to handle network failures.',
      fix: () => `fetch(url)\n  .then(res => res.json())\n  .catch(err => console.error('Fetch failed:', err))`,
    },
    {
      regex: /JSON\.parse\s*\([^)]+\)(?!\s*\/\/\s*safe)/g,
      severity: 'Suggestion',
      category: 'readability',
      issue: 'JSON.parse without try/catch — will throw on invalid input',
      suggestion: 'Wrap JSON.parse in a try/catch to handle malformed JSON gracefully.',
      fix: () => `try {\n  const data = JSON.parse(str);\n} catch (e) {\n  console.error('Invalid JSON', e);\n}`,
    },
    // Python-specific
    {
      regex: /print\s*\(/g,
      severity: 'Warning',
      category: 'security',
      issue: 'print() statement in production code',
      suggestion: 'Use the logging module instead of print() for better control over output levels and destinations.',
      fix: () => `import logging\nlogging.debug('message')`,
    },
    {
      regex: /except\s*:/g,
      severity: 'Warning',
      category: 'readability',
      issue: 'Bare except clause catches all exceptions including SystemExit',
      suggestion: 'Catch specific exception types (e.g., except ValueError:) or at minimum except Exception:',
      fix: () => `except Exception as e:\n    logging.error(f'Error: {e}')`,
    },
  ];

  const focusMap = {
    security: ['security'],
    performance: ['performance'],
    readability: ['readability'],
    all: ['security', 'performance', 'readability'],
  };
  const allowedCategories = focusMap[focus] || focusMap.all;

  const seen = new Set();

  for (const pattern of patterns) {
    if (!allowedCategories.includes(pattern.category)) continue;
    if (severity === 'critical' && pattern.severity !== 'Critical') continue;
    if (severity === 'warnings' && pattern.severity === 'Suggestion') continue;

    const regex = new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g');
    let match;
    while ((match = regex.exec(code)) !== null) {
      const lineNum = getLineNumber(code, match.index);
      const dedupeKey = `${pattern.issue}:${lineNum}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      issues.push({
        severity: pattern.severity,
        line: lineNum,
        lineText: lines[lineNum - 1]?.trim() || '',
        issue: pattern.issue,
        suggestion: pattern.suggestion,
        fix: typeof pattern.fix === 'function' ? pattern.fix(match[0]) : pattern.fix,
      });
    }
  }

  // Sort: Critical first, then Warning, then Suggestion
  const order = { Critical: 0, Warning: 1, Suggestion: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);

  // Compute score
  const critical = issues.filter(i => i.severity === 'Critical').length;
  const warnings = issues.filter(i => i.severity === 'Warning').length;
  const suggestions = issues.filter(i => i.severity === 'Suggestion').length;

  let score = 100 - (critical * 20) - (warnings * 8) - (suggestions * 2);
  score = Math.max(0, Math.min(100, score));

  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 55 ? 'D' : 'F';

  const lineCount = lines.length;
  const summary = issues.length === 0
    ? `No issues detected in this ${language} snippet (${lineCount} lines). Code looks clean!`
    : `Found ${issues.length} issue${issues.length > 1 ? 's' : ''} in ${lineCount} lines of ${language} code. ${critical > 0 ? `${critical} critical issue${critical > 1 ? 's' : ''} require immediate attention. ` : ''}${warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''} should be addressed before shipping. ` : ''}${suggestions > 0 ? `${suggestions} style suggestion${suggestions > 1 ? 's' : ''} for improved maintainability.` : ''}`.trim();

  return { score, grade, summary, issues, stats: { critical, warnings, suggestions, total: issues.length } };
}

function buildPrompt(code, language, focus, severity) {
  const focusDesc = {
    security: 'Focus ONLY on security vulnerabilities, injection risks, hardcoded secrets, and unsafe practices.',
    performance: 'Focus ONLY on performance issues, inefficient algorithms, memory leaks, and unnecessary computations.',
    readability: 'Focus ONLY on code readability, maintainability, naming conventions, complexity, and style.',
    all: 'Cover security vulnerabilities, performance issues, and readability/maintainability concerns.',
  }[focus] || 'Cover all categories.';

  const severityDesc = severity === 'critical'
    ? 'Return ONLY Critical severity issues.'
    : severity === 'warnings'
    ? 'Return Critical and Warning severity issues only, no Suggestions.'
    : 'Return issues of all severity levels.';

  return `You are a senior software engineer performing a thorough code review. ${focusDesc} ${severityDesc}

LANGUAGE: ${language}
CODE TO REVIEW:
\`\`\`${language}
${code}
\`\`\`

Analyze the code carefully and return a JSON response with this EXACT structure (no markdown fences, no extra text):

{
  "score": 85,
  "grade": "B",
  "summary": "2-3 sentence overall assessment of code quality and main concerns",
  "issues": [
    {
      "severity": "Critical|Warning|Suggestion",
      "line": 12,
      "lineText": "the actual line of code with the issue",
      "issue": "concise description of the problem",
      "suggestion": "detailed explanation of why this is a problem and how to fix it",
      "fix": "corrected code snippet showing the fix"
    }
  ],
  "stats": {
    "critical": 0,
    "warnings": 2,
    "suggestions": 3,
    "total": 5
  }
}

Rules:
- score: 0-100 (100 = perfect code, 0 = critically broken)
- grade: A (90-100), B (80-89), C (70-79), D (55-69), F (0-54)
- severity: exactly "Critical", "Warning", or "Suggestion"
- line: actual line number in the provided code (integer)
- lineText: the exact problematic line trimmed
- fix: a short corrected code snippet (3-6 lines max)
- Return 0-15 issues. Prioritize real problems over nitpicks.
- Output ONLY the JSON. No markdown, no explanation outside JSON.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, language = 'javascript', focus = 'all', severity = 'all' } = req.body || {};

  if (!code?.trim()) {
    return res.status(400).json({ error: 'Please provide code to review.' });
  }

  const lang = language || detectLanguage(code);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const prompt = buildPrompt(code, lang, focus, severity);
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: 'You are a senior code reviewer. Output only valid JSON as instructed. No markdown fences.',
        messages: [{ role: 'user', content: prompt }],
      });
      const rawText = (message.content[0]?.text || '').trim();
      const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch (err) {
      console.error('Claude API error:', err?.message);
      // Fall through to pattern-based fallback
    }
  }

  return res.status(200).json(patternReview(code, lang, focus, severity));
}
