const { put, list } = require('@vercel/blob');

const BLOB_KEY = 'icebreaker-user-prompts.json';

async function readPrompts() {
  try {
    const { blobs } = await list({ prefix: 'icebreaker-user-prompts' });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].url + '?t=' + Date.now());
    return await res.json();
  } catch { return []; }
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    const prompts = await readPrompts();
    return res.status(200).json({ prompts });
  }

  if (req.method === 'POST') {
    const { text, action } = req.body || {};

    // Remove a prompt from the pool
    if (action === 'remove') {
      const prompts = await readPrompts();
      const updated = prompts.filter(p => p !== text);
      await put(BLOB_KEY, JSON.stringify(updated), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      });
      return res.status(200).json({ ok: true, count: updated.length });
    }

    // Add a new prompt
    const trimmed = (text || '').trim().slice(0, 150);
    if (trimmed.length < 4) {
      return res.status(400).json({ error: 'Too short' });
    }
    const prompts = await readPrompts();
    if (!prompts.includes(trimmed)) prompts.push(trimmed);
    await put(BLOB_KEY, JSON.stringify(prompts), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    return res.status(200).json({ ok: true, count: prompts.length });
  }

  return res.status(405).send('Method Not Allowed');
};
