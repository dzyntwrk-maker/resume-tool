// /api/affiliate — Affiliate content generator
// With ANTHROPIC_API_KEY: Claude Haiku writes full affiliate article
// Without key: template generator
// Returns: { title, article, wordCount, estimatedEarnings }

const commissionRates = {
  amazon: { rate: "1–10%", avg: 4, note: "Amazon Associates (varies by category)" },
  shareasale: { rate: "5–30%", avg: 15, note: "ShareASale average across niches" },
  clickbank: { rate: "50–75%", avg: 60, note: "ClickBank digital products" },
  custom: { rate: "5–50%", avg: 20, note: "Custom/private affiliate program" },
};

function estimateEarnings(program, niche) {
  const prog = commissionRates[program?.toLowerCase()] || commissionRates.custom;
  const avgOrderMap = {
    tech: 120, software: 80, finance: 200, health: 60, fitness: 50,
    beauty: 45, home: 90, travel: 300, education: 150, gaming: 70,
  };
  const nicheKey = Object.keys(avgOrderMap).find(k => niche?.toLowerCase().includes(k)) || "home";
  const avgOrder = avgOrderMap[nicheKey] || 75;
  const commissionPerSale = (avgOrder * prog.avg) / 100;
  return {
    commissionRange: prog.rate,
    avgCommission: `$${commissionPerSale.toFixed(2)}`,
    monthly100: `$${(commissionPerSale * 100).toFixed(0)}`,
    monthly500: `$${(commissionPerSale * 500).toFixed(0)}`,
    note: prog.note,
  };
}

function templateArticle(product, program, niche, keyword, articleType) {
  const cap = s => (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
  const year = new Date().getFullYear();
  const prog = commissionRates[program?.toLowerCase()] || commissionRates.custom;
  const earnings = estimateEarnings(program, niche);

  let title, article;

  if (articleType === "review") {
    title = `${cap(product)} Review ${year}: Is It Worth It? (Honest ${cap(niche)} Analysis)`;
    article = `# ${title}

**Target Keyword:** ${keyword}

---

## Introduction

If you've been searching for an honest ${product} review, you're in the right place. I've spent time researching and testing ${product} so you don't have to make an expensive mistake.

In this review, I'll cover everything you need to know: features, pricing, pros and cons, and whether it's the right choice for your ${niche} needs.

**Quick Verdict:** ${product} is a solid option for ${niche} enthusiasts who need [key benefit]. However, it's not perfect — keep reading to find out if it matches your needs.

[👉 Check Current Price & Availability](YOUR AFFILIATE LINK)

---

## What Is ${cap(product)}?

${cap(product)} is a [type of product] designed for [target audience] in the ${niche} space. It was created to solve [core problem] and has gained popularity because [reason].

**Key specs at a glance:**
- **Category:** ${cap(niche)}
- **Best for:** [Primary use case]
- **Price range:** [Price range]
- **Where to buy:** [Platform/store]

---

## ${cap(product)} Features Overview

Here's what you get with ${product}:

### Feature 1: [Core Feature Name]
[Description of main feature and how it benefits the user in the ${niche} context.]

### Feature 2: [Secondary Feature]
[Description of secondary feature. How does it compare to competitors?]

### Feature 3: [Unique Differentiator]
[What makes ${product} stand out from alternatives in the ${niche} market?]

---

## Pros and Cons

| ✅ Pros | ❌ Cons |
|---------|---------|
| [Benefit 1] | [Drawback 1] |
| [Benefit 2] | [Drawback 2] |
| [Benefit 3] | [Drawback 3] |
| [Benefit 4] | [Drawback 4] |
| [Benefit 5] | [Drawback 5] |

---

## Detailed Review

### Performance
In real-world ${niche} use, ${product} [performs well/struggles] when it comes to [primary use case]. During testing, [specific observation about performance].

### Value for Money
At its current price point, ${product} offers [strong/moderate/weak] value compared to alternatives. For serious ${niche} users, the investment pays off through [specific benefit].

### Ease of Use
Getting started with ${product} is [straightforward/requires a learning curve]. Most users report being up and running within [timeframe], which is [better/worse] than comparable options.

### Customer Support
${cap(product)}'s support team [is responsive/has mixed reviews]. They offer [support channels] with response times of [timeframe].

---

## Who Is ${cap(product)} Best For?

**${cap(product)} is perfect if you:**
- Are serious about ${niche} and need a reliable solution
- Value [key feature] over [alternative feature]
- Have a budget of [price range]
- Want [specific outcome]

**Consider alternatives if you:**
- Are a complete beginner who needs [simpler option]
- Have a very tight budget
- Need [feature that product lacks]

---

## Pricing and Where to Buy

${cap(product)} is available through [platform/retailer]. Current pricing:

- **Standard:** $[price]
- **Premium/Bundle:** $[price]

[👉 Get the Best Price on ${cap(product)}](YOUR AFFILIATE LINK)

*Prices may vary. Click the link above for the most current pricing and any active promotions.*

---

## Frequently Asked Questions

**Q: Is ${product} worth the money?**
A: For most ${niche} users, yes. The [key feature] alone justifies the investment, especially if you [use case].

**Q: Does ${product} come with a warranty/guarantee?**
A: Yes, ${product} includes [warranty details]. This gives you peace of mind with your purchase.

**Q: What's the best alternative to ${product}?**
A: If ${product} isn't right for you, consider [Alternative 1] for budget buyers or [Alternative 2] for premium users.

**Q: Where can I get the best deal on ${product}?**
A: The best deals are typically found through [platform]. [Check current pricing here](YOUR AFFILIATE LINK).

---

## Final Verdict

${cap(product)} earns a strong recommendation for ${niche} enthusiasts who prioritize [key value proposition]. While it has [main weakness], the [key strength] makes it a competitive choice in the ${year} market.

**Our rating: ⭐⭐⭐⭐ (4/5)**

[👉 Get ${cap(product)} — Check Price & Availability](YOUR AFFILIATE LINK)

---

*Disclosure: This article contains affiliate links. If you purchase through our links, we may earn a commission at no extra cost to you. This helps support our ${niche} content.*`;

  } else if (articleType === "comparison") {
    title = `${cap(product)} vs [Competitor]: Which Is Best for ${cap(niche)} in ${year}?`;
    article = `# ${title}

**Target Keyword:** ${keyword}

---

## Introduction

Choosing between ${product} and its top competitor is one of the most common questions in the ${niche} community. Both have devoted fans — but which one is actually better for your situation?

I've done a deep-dive comparison so you can make a confident, informed decision.

[👉 See ${cap(product)} on [Platform]](YOUR AFFILIATE LINK)

---

## Quick Comparison Table

| Feature | ${cap(product)} | [Competitor] |
|---------|----------------|--------------|
| Price | $[price] | $[price] |
| [Feature 1] | ✅ Yes | ✅ Yes |
| [Feature 2] | ✅ Yes | ❌ No |
| [Feature 3] | ❌ No | ✅ Yes |
| [Feature 4] | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Best for | [Use case] | [Use case] |
| Rating | 4.5/5 | 4.2/5 |

---

## ${cap(product)} Overview

${cap(product)} is [description]. It excels at [key strength] and is particularly popular among [audience segment] in the ${niche} space.

**Pros:**
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Cons:**
- [Drawback 1]
- [Drawback 2]

[👉 Check ${cap(product)} Price](YOUR AFFILIATE LINK)

---

## [Competitor] Overview

[Competitor] is [description]. It takes a different approach by [differentiation] and appeals to [audience segment].

**Pros:**
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Cons:**
- [Drawback 1]
- [Drawback 2]

---

## Head-to-Head Comparison

### Performance
${cap(product)} [performs better/worse] than [Competitor] when it comes to [specific use case in ${niche}]. In our testing, [specific result].

### Price and Value
At $[price], ${product} [costs more/less] than [Competitor] at $[price]. However, [justify value difference].

### Ease of Use
Both products are designed for ${niche} users, but [product] has [advantage] that makes the learning curve [easier/steeper].

### Support and Community
${cap(product)} benefits from [support strength], while [Competitor] offers [different support strength].

---

## Who Should Choose ${cap(product)}?

Choose ${product} if you:
- Need [specific feature]
- Have a budget of [range]
- Are a [type of user] in the ${niche} space

## Who Should Choose [Competitor]?

Choose [Competitor] if you:
- Prioritize [alternative feature]
- Are on a tighter budget
- Need [specific capability]

---

## FAQ

**Q: Is ${product} or [Competitor] better for beginners?**
A: For ${niche} beginners, [recommendation] is generally more accessible because [reason].

**Q: Can I switch from [Competitor] to ${product}?**
A: Yes, switching is [straightforward/requires some work]. Most users find the transition [easy/manageable] within [timeframe].

---

## Conclusion

After this detailed comparison, [product] comes out ahead for most ${niche} users thanks to [key differentiator]. However, [Competitor] remains an excellent choice for [specific use case].

**Our winner: ${cap(product)}** ⭐⭐⭐⭐½

[👉 Get ${cap(product)} Here](YOUR AFFILIATE LINK)

---

*Disclosure: This article contains affiliate links. Purchases through our links support our ${niche} reviews at no extra cost to you.*`;

  } else if (articleType === "best-of") {
    title = `Best ${cap(niche)} Products ${year}: Top 7 Picks (Reviewed & Ranked)`;
    article = `# ${title}

**Target Keyword:** ${keyword}

---

## Introduction

Finding the best ${niche} products can feel overwhelming with so many options available. After extensive research and testing, I've narrowed down the top choices to save you time and money.

**My top pick:** [${cap(product)}](YOUR AFFILIATE LINK) — the best overall option for most ${niche} users in ${year}.

---

## Quick Picks

| Rank | Product | Best For | Price |
|------|---------|----------|-------|
| 🥇 #1 | **${cap(product)}** | Best Overall | $[price] |
| 🥈 #2 | [Product 2] | Best Budget | $[price] |
| 🥉 #3 | [Product 3] | Best Premium | $[price] |
| #4 | [Product 4] | Best for Beginners | $[price] |
| #5 | [Product 5] | Most Features | $[price] |
| #6 | [Product 6] | Best Compact | $[price] |
| #7 | [Product 7] | Best Value | $[price] |

---

## How I Selected These Products

I evaluated each product based on:
- **Performance** in real-world ${niche} scenarios
- **Value for money** at their price point
- **User reviews** and community feedback
- **Durability and reliability** over time
- **Customer support** quality

---

## #1 Best Overall: ${cap(product)}

${cap(product)} earns the top spot as the best ${niche} option for most users in ${year}.

**Why it wins:** [Key reason ${product} is #1]

**Pros:**
- ✅ [Top benefit]
- ✅ [Second benefit]
- ✅ [Third benefit]

**Cons:**
- ❌ [Main drawback]

**Price:** $[price]
[👉 Check Price & Get ${cap(product)}](YOUR AFFILIATE LINK)

---

## #2 Best Budget: [Product 2]

For ${niche} users on a tighter budget, [Product 2] delivers excellent value without breaking the bank.

[Brief review paragraph]

**Price:** $[price]
[👉 Check Price](AFFILIATE LINK 2)

---

## #3 Best Premium: [Product 3]

If budget isn't a concern and you want the absolute best ${niche} experience, [Product 3] is worth the investment.

[Brief review paragraph]

**Price:** $[price]
[👉 Check Price](AFFILIATE LINK 3)

---

## What to Look for in ${cap(niche)} Products

Before buying, consider:

1. **[Factor 1]** — [Why it matters for ${niche}]
2. **[Factor 2]** — [How to evaluate this]
3. **[Factor 3]** — [Common mistakes to avoid]
4. **Budget** — Set a realistic budget. The sweet spot for ${niche} products is typically $[range].

---

## Frequently Asked Questions

**Q: What is the best ${niche} product for beginners?**
A: We recommend [Product 4] for beginners due to its ease of use and affordable price point.

**Q: What is the best overall ${niche} product in ${year}?**
A: ${cap(product)} is our top pick for most users. [👉 See it here](YOUR AFFILIATE LINK).

**Q: How much should I spend on a ${niche} product?**
A: Most users find the $[range] price range offers the best value. Premium options above $[amount] offer marginal improvements for most use cases.

---

## Conclusion

Our top recommendation remains **${cap(product)}** for most ${niche} users in ${year}. It delivers the best combination of performance, value, and reliability.

[👉 Get ${cap(product)} — Our #1 Pick](YOUR AFFILIATE LINK)

---

*Disclosure: This article contains affiliate links. We earn a small commission on purchases at no extra cost to you. All recommendations are based on genuine research and testing.*`;

  } else {
    // how-to
    title = `How to Use ${cap(product)} for ${cap(niche)}: Complete Step-by-Step Guide (${year})`;
    article = `# ${title}

**Target Keyword:** ${keyword}

---

## Introduction

Whether you're new to ${product} or looking to get more out of it for ${niche} purposes, this step-by-step guide will walk you through everything you need to know.

By the end of this guide, you'll be able to [desired outcome] with confidence.

**What you'll need:** [${cap(product)}](YOUR AFFILIATE LINK), [other requirements]

---

## Why Use ${cap(product)} for ${cap(niche)}?

Before diving into the how-to, here's why ${product} is one of the best tools for ${niche}:

- **[Benefit 1]** — [Explanation]
- **[Benefit 2]** — [Explanation]
- **[Benefit 3]** — [Explanation]
- **Proven results** — Thousands of ${niche} users rely on ${product} to [outcome]

[👉 Get ${cap(product)} Here](YOUR AFFILIATE LINK)

---

## What You'll Need

Before starting, make sure you have:

- [ ] ${cap(product)} ([get it here](YOUR AFFILIATE LINK))
- [ ] [Required item 2]
- [ ] [Required item 3]
- [ ] [Optional but recommended item]

**Time required:** [Estimated time]
**Difficulty:** [Beginner/Intermediate/Advanced]

---

## Step-by-Step Guide

### Step 1: [First Action]

[Detailed explanation of step 1. Include specific instructions relevant to ${niche}.]

**Pro tip:** [Helpful tip that saves time or improves results]

---

### Step 2: [Second Action]

[Detailed explanation of step 2. What should users watch out for?]

**Common mistake:** Many ${niche} beginners [common error]. Avoid this by [solution].

---

### Step 3: [Third Action]

[Detailed explanation of step 3.]

---

### Step 4: [Fourth Action]

[This is often where users encounter the most complexity. Provide extra detail.]

**What to expect:** At this stage, you should see [expected result]. If you're not seeing this, check [troubleshooting tip].

---

### Step 5: [Final Step / Optimization]

[Wrap up the main process and explain how to optimize results.]

---

## Tips and Best Practices

To get the most out of ${product} for ${niche}:

1. **[Tip 1]** — [Explanation of why this matters]
2. **[Tip 2]** — [Practical advice]
3. **[Tip 3]** — [Advanced technique for better results]
4. **Consistency** — The biggest factor in ${niche} success is consistent application of these techniques.

---

## Troubleshooting Common Issues

**Problem: [Common issue]**
Solution: [Fix]

**Problem: [Second common issue]**
Solution: [Fix]

**Problem: [Third common issue]**
Solution: [Fix or workaround]

---

## Frequently Asked Questions

**Q: Do I need experience with ${niche} to use ${product}?**
A: No, ${product} is designed to be accessible for all experience levels. This guide covers everything you need to get started.

**Q: How long does it take to see results?**
A: Most users see [results] within [timeframe]. Consistent use over [period] leads to [long-term outcome].

**Q: Where can I get ${product}?**
A: [Get ${cap(product)} here](YOUR AFFILIATE LINK). It's available through [platform] with [shipping/delivery details].

---

## Conclusion

You now have everything you need to use ${product} effectively for ${niche}. The key steps are: [1], [2], and [3].

Ready to get started? [Grab ${cap(product)} here](YOUR AFFILIATE LINK) and put this guide into practice today.

Have questions? Drop them in the comments below!

---

*Disclosure: This article contains affiliate links. If you purchase through our links, we earn a commission at no additional cost to you. We only recommend products we've researched and believe in.*`;
  }

  const wordCount = article.split(/\s+/).length;
  const estimatedEarnings = estimateEarnings(program, niche);

  return { title, article, wordCount, estimatedEarnings };
}

function buildAffiliatePrompt(product, program, niche, keyword, articleType) {
  const prog = commissionRates[program?.toLowerCase()] || commissionRates.custom;
  const typeInstructions = {
    review: `Write a detailed product review article (~1500 words). Include: hook intro, product overview, features section, pros/cons table (markdown), detailed review sections (performance, value, ease of use), who it's for, pricing section with affiliate CTA, FAQ (4 questions), and conclusion with CTA.`,
    comparison: `Write a product comparison article (~1400 words) comparing "${product}" to a relevant competitor. Include: intro, quick comparison table (markdown), overview of each product with pros/cons, head-to-head sections, who should choose which, FAQ, and conclusion with CTA.`,
    "best-of": `Write a "best of" roundup article (~1600 words) with "${product}" as the #1 pick. Include: intro with quick picks table (markdown), selection criteria, detailed review of the #1 pick with 6 briefer runner-up reviews, buying guide section, FAQ, and conclusion with CTA.`,
    "how-to": `Write a step-by-step how-to guide (~1400 words) on using "${product}" for ${niche}. Include: intro with outcome promise, why use this product, what you need checklist, 5+ detailed steps, tips and best practices, troubleshooting section, FAQ, and conclusion with CTA.`,
  };

  return `You are an expert affiliate marketing content writer. Write a high-converting SEO-optimized affiliate article.

PRODUCT: ${product}
AFFILIATE PROGRAM: ${program} (${prog.note})
NICHE/CATEGORY: ${niche}
TARGET KEYWORD: ${keyword}
ARTICLE TYPE: ${articleType}

INSTRUCTIONS: ${typeInstructions[articleType] || typeInstructions.review}

IMPORTANT RULES:
1. Use "[YOUR AFFILIATE LINK]" as a placeholder wherever affiliate links should appear (multiple times)
2. Include a disclosure statement at the end
3. Make the writing persuasive but honest — acknowledge real pros AND cons
4. Optimize for the keyword "${keyword}" naturally (in title, first paragraph, headers, throughout)
5. Use markdown formatting with H2/H3 headers
6. End every major section CTA with the affiliate link placeholder

Output ONLY valid JSON (no markdown code blocks):
{
  "title": "Full SEO-optimized article title including keyword",
  "article": "Complete article in markdown format with all sections"
}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { product, program = "amazon", niche = "general", keyword, articleType = "review" } = req.body || {};
  if (!product?.trim()) return res.status(400).json({ error: "Product name is required." });
  if (!keyword?.trim()) return res.status(400).json({ error: "Target keyword is required." });

  const estimatedEarnings = estimateEarnings(program, niche);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [{ role: "user", content: buildAffiliatePrompt(product, program, niche, keyword, articleType) }],
      });
      const raw = msg.content[0]?.text || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const wordCount = (parsed.article || "").split(/\s+/).length;
        return res.status(200).json({ ...parsed, wordCount, estimatedEarnings });
      }
    } catch (err) {
      console.error("Claude error:", err?.message);
    }
  }

  return res.status(200).json(templateArticle(product, program, niche, keyword, articleType));
}
