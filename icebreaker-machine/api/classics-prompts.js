const { put, list } = require('@vercel/blob');

const BLOB_KEY = 'icebreaker-classics-graduated.json';

async function readGraduated() {
  try {
    const { blobs } = await list({ prefix: 'icebreaker-classics-graduated' });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].url + '?t=' + Date.now());
    return await res.json();
  } catch { return []; }
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    const prompts = await readGraduated();
    return res.status(200).json({ prompts });
  }

  if (req.method === 'POST') {
    const { text } = req.body || {};
    const trimmed = (text || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'Empty' });
    const prompts = await readGraduated();
    if (!prompts.includes(trimmed)) prompts.push(trimmed);
    await put(BLOB_KEY, JSON.stringify(prompts), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).send('Method Not Allowed');
};
