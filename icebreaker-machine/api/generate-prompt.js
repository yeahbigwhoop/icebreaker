const https = require('https');

const CATEGORIES = [
  'childhood / nostalgia',
  'current habits / daily life',
  'food & taste',
  'hypothetical / would you rather',
  'self-knowledge / personality',
  'embarrassing moments',
  'random skills or talents',
  'technology / phone / internet',
  'social dynamics / relationships',
  'local Hawaii life',
  'weird preferences or opinions',
  'work history / past jobs',
];

const EXAMPLE_PROMPTS = [
  "Fun fact no one knows about you?",
  "What do you collect?",
  "Person — living or dead — you'd have a drink with?",
  "What's on your tombstone?",
  "Silly childhood fear?",
  "What's your most useless skill?",
  "What was your first job?",
  "If you could live in any decade, which would it be?",
  "What's the last thing you Googled?",
  "What's something you're irrationally good at?",
  "What's a weird food combination you love?",
  "What's the most embarrassing thing in your search history?",
];

function callAnthropic(apiKey, recentPrompts = []) {
  const recentBlock = recentPrompts.length
    ? `\nRECENT PROMPTS — you must pick a completely different category and topic from all of these:\n${recentPrompts.map(p => `- ${p}`).join('\n')}\n`
    : '';

  const categoryList = CATEGORIES.map(c => `- ${c}`).join('\n');

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `You generate icebreaker questions for a specific team.

GROUP CONTEXT:
- Tight-knit creative team of 6 in Hawaii, 5+ years together
- Monday morning icebreakers every week — they've heard hundreds, novelty is essential
- Casual, good humor, not overly PC, local Hawaiian culture fair game
- Nothing too heavy or cognitively demanding
- Pop culture, weird hypotheticals welcome
- No design/art/work questions. No movie or music questions.
- Hard limit: 15 words maximum. Fewer is better.

TOPIC CATEGORIES to rotate through:
${categoryList}
${recentBlock}
Choose a category NOT represented in the recent prompts above, then write one question in that category.

Example questions:
${EXAMPLE_PROMPTS.map(p => `- ${p}`).join('\n')}

Respond with only the question. No category label, no explanation.`
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content?.[0]?.text?.trim();
          if (!text) throw new Error('No text in response: ' + JSON.stringify(parsed));
          resolve(text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async function(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const body = req.body || {};
    const recentPrompts = Array.isArray(body.recentPrompts) ? body.recentPrompts.slice(-6) : [];
    const prompt = await callAnthropic(apiKey, recentPrompts);
    res.status(200).json({ prompt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
