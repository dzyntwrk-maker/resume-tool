// Vercel serverless function — /api/podcast
// Works with or without ANTHROPIC_API_KEY:
//   With key    → Claude Haiku (full AI show notes)
//   Without key → Template-based generator using transcript text

function extractSentences(text, n = 10) {
  return (text.match(/[^.!?]+[.!?]+/g) || []).slice(0, n).map(s => s.trim()).filter(Boolean);
}

function extractKeyTopics(text) {
  const stop = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","are","was","were","be","been","have","has","had","do","does","did","will","would","could","should","may","might","this","that","these","those","we","you","i","it","he","she","they","our","your","my","their","its","as","not","if","from","about","up","out","so","who","what","when","how","all","also","just","can","than","then","only","some","any","into","over","after","more","most","other","same","us","them","very","really","think","know","like","going","get","got","said","say","says","yeah","okay","right","actually","kind","thing","things","lot","way","make","made","one","two","three","first","second","last","back","even","just","well","also","about","around","through"]);
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq = {};
  words.filter(w => !stop.has(w)).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([w]) => w);
}

function estimateDuration(text) {
  // Average speaking rate ~130 wpm
  const words = (text.match(/\b\w+\b/g) || []).length;
  const minutes = Math.round(words / 130);
  return minutes;
}

function formatTimestamp(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:00`;
  return `${String(m).padStart(2, '0')}:00`;
}

function templateGenerate({ title, guest, podcastName, transcript, topics }) {
  const text = transcript || topics || "";
  const totalMinutes = estimateDuration(text);
  const topWords = extractKeyTopics(text);
  const sentences = extractSentences(text, 20);

  const podName = podcastName || "the podcast";
  const guestName = guest || "our guest";
  const episodeTitle = title || "this episode";

  // Summary paragraphs
  const t1 = topWords[0] || "insights";
  const t2 = topWords[1] || "strategies";
  const t3 = topWords[2] || "experience";
  const t4 = topWords[3] || "lessons";
  const t5 = topWords[4] || "perspectives";

  const summary = `In this episode of ${podName}, we sit down with ${guestName} to explore ${t1} and ${t2} that are shaping the industry today. Whether you're just starting out or looking to level up, this conversation is packed with actionable wisdom.

${guestName} shares their journey and hard-won ${t3}, drawing on years of hands-on ${t4} to give us a behind-the-scenes look at what actually works. We cover the challenges, the breakthroughs, and the mindset shifts that made all the difference.

By the end of this episode, you'll walk away with fresh ${t5} on ${t1}, a clearer understanding of ${t2}, and concrete next steps you can apply immediately. Don't miss this one.`;

  // Takeaways
  const takeaways = [
    `How to leverage ${t1} to achieve better outcomes in your own work`,
    `The key mindset shift around ${t2} that separates high performers from the rest`,
    `Why ${t3} matters more than most people realize — and how to develop it`,
    `Practical steps to implement ${t4} starting today, even with limited resources`,
    `Common mistakes to avoid when navigating ${t5} and how to course-correct`,
    `${guestName}'s #1 piece of advice for anyone looking to grow in this space`,
    `The overlooked opportunity in ${topWords[5] || "your industry"} that most people miss`,
  ];

  // Timestamps
  const interval = totalMinutes > 5 ? Math.floor(totalMinutes / 6) : 5;
  const timestampTopics = [
    `Introduction & background on ${guestName}`,
    `Deep dive into ${t1} and why it matters now`,
    `Lessons from ${t3} — what worked and what didn't`,
    `Unpacking ${t2}: frameworks and tactics`,
    `Overcoming obstacles and building resilience`,
    `Actionable takeaways and where to go from here`,
  ];
  const timestamps = timestampTopics.map((topic, i) => ({
    time: formatTimestamp(i * interval),
    label: topic,
  }));

  // Guest bio
  const guestBio = guest
    ? `${guest} is an expert in ${t1} and ${t2} with a passion for helping others achieve breakthrough results. With deep experience in ${t3} and ${t4}, ${guest} brings a unique perspective that blends practical wisdom with visionary thinking. Find them online and follow their work to stay up to date with their latest insights.`
    : `Our guest is an expert in ${t1} and ${t2}, bringing years of experience and a wealth of knowledge to this conversation. Their work in ${t3} has influenced countless people in the industry, and we're thrilled to have them share their story today.`;

  // Resources
  const resources = [
    `Book: A foundational read on ${t1} — search for top titles in this space`,
    `Tool: Explore platforms that help you apply ${t2} systematically`,
    `Community: Connect with others focused on ${t3} and continuous improvement`,
    `Article: Look up recent research on ${t4} trends in 2024–2025`,
    `Podcast: Other shows covering ${t5} worth adding to your rotation`,
  ];

  // CTA
  const cta = `Enjoyed this episode? Subscribe to ${podName} so you never miss a conversation like this one. Leave us a review on Apple Podcasts or Spotify — it takes 30 seconds and helps more people discover the show. Share this episode with someone who would benefit from ${guestName}'s insights on ${t1} and ${t2}. We'll see you in the next one.`;

  // Full notes
  const fullNotes = `${episodeTitle}
${'='.repeat(episodeTitle.length)}

EPISODE SUMMARY
${summary}

KEY TAKEAWAYS
${takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

TIMESTAMPS
${timestamps.map(ts => `[${ts.time}] ${ts.label}`).join('\n')}

ABOUT THE GUEST
${guestBio}

RESOURCES MENTIONED
${resources.map(r => `• ${r}`).join('\n')}

CALL TO ACTION
${cta}`;

  return { summary, takeaways, timestamps, guestBio, resources, cta, fullNotes };
}

function buildPodcastPrompt({ title, guest, podcastName, transcript, topics }) {
  const content = transcript
    ? `EPISODE TRANSCRIPT:\n${transcript}`
    : `EPISODE TOPICS / SUMMARY:\n${topics}`;

  return `You are a professional podcast producer and copywriter specializing in show notes.

EPISODE TITLE: ${title || 'Untitled Episode'}
GUEST NAME: ${guest || 'N/A'}
PODCAST NAME: ${podcastName || 'N/A'}
${content}

Generate complete, professional podcast show notes. Output EXACTLY in this format with these section headers:

EPISODE SUMMARY
Write 2-3 engaging paragraphs (4-6 sentences each) summarizing the episode. Hook the reader in paragraph 1, expand on key themes in paragraph 2, end with value proposition in paragraph 3.

KEY TAKEAWAYS
Write exactly 6 bullet points (no numbering, just • prefix) that are specific, actionable insights from this episode.

TIMESTAMPS
Generate 6 timestamp entries in format [MM:SS] Topic Label — evenly spaced through the episode based on content flow.

ABOUT THE GUEST
Write a 3-4 sentence professional bio for ${guest || 'the guest'} based on what's discussed, written in third person.

RESOURCES MENTIONED
List 4-5 resources (books, tools, websites, people) mentioned or implied in the content, with a one-sentence description each using • prefix.

CALL TO ACTION
Write 3-4 sentences encouraging listeners to subscribe, review, and share — specific to ${podcastName || 'this podcast'}.

Output only the sections above. No meta-commentary.`;
}

function parsePodcastOutput(text) {
  const get = (key, nextKey) => {
    const pattern = nextKey
      ? new RegExp(`${key}\\s*([\\s\\S]*?)(?=${nextKey}|$)`, 'i')
      : new RegExp(`${key}\\s*([\\s\\S]*)$`, 'i');
    const m = text.match(pattern);
    return m ? m[1].trim() : '';
  };

  const summary = get('EPISODE SUMMARY', 'KEY TAKEAWAYS');
  const takeawaysRaw = get('KEY TAKEAWAYS', 'TIMESTAMPS');
  const timestampsRaw = get('TIMESTAMPS', 'ABOUT THE GUEST');
  const guestBio = get('ABOUT THE GUEST', 'RESOURCES MENTIONED');
  const resourcesRaw = get('RESOURCES MENTIONED', 'CALL TO ACTION');
  const cta = get('CALL TO ACTION', null);

  const takeaways = takeawaysRaw
    .split('\n')
    .map(l => l.replace(/^[•\-\*\d\.]+\s*/, '').trim())
    .filter(Boolean);

  const timestamps = timestampsRaw
    .split('\n')
    .map(l => {
      const m = l.match(/\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*[-–]?\s*(.*)/);
      return m ? { time: m[1], label: m[2].trim() } : null;
    })
    .filter(Boolean);

  const resources = resourcesRaw
    .split('\n')
    .map(l => l.replace(/^[•\-\*\d\.]+\s*/, '').trim())
    .filter(Boolean);

  const fullNotes = text;

  return { summary, takeaways, timestamps, guestBio, resources, cta, fullNotes };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, guest, podcastName, transcript, topics } = req.body || {};

  if (!transcript?.trim() && !topics?.trim()) {
    return res.status(400).json({ error: 'Please provide a transcript or topic summary.' });
  }

  // Try Claude if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const prompt = buildPodcastPrompt({ title, guest, podcastName, transcript, topics });
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system: 'You are a professional podcast producer writing polished show notes. Be specific, engaging, and output only what is asked.',
        messages: [{ role: 'user', content: prompt }],
      });
      const rawText = message.content[0]?.text || '';
      return res.status(200).json(parsePodcastOutput(rawText));
    } catch (err) {
      console.error('Claude API error:', err?.message);
      // Fall through to template
    }
  }

  // Template fallback — works without API key
  return res.status(200).json(templateGenerate({ title, guest, podcastName, transcript, topics }));
}
