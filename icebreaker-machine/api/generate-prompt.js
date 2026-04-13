const https = require('https');

const EXAMPLE_PROMPTS = [
  "Fun fact no one knows about you?",
  "What do you collect?",
  "Person — living or dead — you'd have a drink with?",
  "What's on your tombstone?",
  "Silly childhood fear?",
  "What's your most useless skill?",
  "What movie have you seen the most times?",
  "What's a hill you'll die on?",
  "What was your first job?",
  "If you could live in any decade, which would it be?",
  "What's the last thing you Googled?",
  "What's something you're irrationally good at?",
  "What's your go-to karaoke song?",
  "What's a weird food combination you love?",
  "What's the most embarrassing thing in your search history?",
];

function callAnthropic(apiKey, recentPrompts = []) {
  const recentBlock = recentPrompts.length
    ? `\nThe last ${recentPrompts.length} prompts shown were — do NOT repeat their topics, themes, or structure:\n${recentPrompts.map(p => `- ${p}`).join('\n')}\n`
    : '';

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `You generate icebreaker questions for a specific group. Here's who they are:

- A tight-knit creative team of 6 in Hawaii who have worked together for 5+ years
- They do these icebreakers every Monday morning, so they've heard a lot — novelty is essential
- Very casual, good sense of humor, not overly PC, local Hawaiian culture is fair game
- Monday morning energy — nothing too heavy or cognitively demanding
- Pop culture, topical references, and weird hypotheticals are welcome
- They're creatives but this is a break from work — avoid anything design/art/work-related
- No movie or music questions — predictable and weak
- Brevity is the mark of a good prompt — fewer words wins every time
- Hard limit: 15 words maximum
${recentBlock}
Here are some example questions in the right style and tone:
${EXAMPLE_PROMPTS.map(p => `- ${p}`).join('\n')}

Generate ONE new icebreaker question that feels fresh to a group that has heard hundreds of these. Respond with only the question, nothing else.`
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
