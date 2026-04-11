const https = require('https');

const QUERIES = [
  'slow motion water', 'slow motion smoke', 'slow motion rain',
  'slow motion fire', 'slow motion nature', 'slow motion light',
  'slow motion people', 'slow motion crowd', 'slow motion hands',
  'slow motion city', 'slow motion ocean', 'slow motion fog',
];

function fetchPexels(apiKey, query, page) {
  return new Promise((resolve, reject) => {
    const path = `/videos/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape&size=medium`;
    const options = {
      hostname: 'api.pexels.com',
      path,
      headers: { Authorization: apiKey },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

module.exports = async function(req, res) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'PEXELS_API_KEY not set' });

  const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const page = 1 + Math.floor(Math.random() * 3);

  try {
    const data = await fetchPexels(apiKey, query, page);
    const videos = data.videos || [];
    if (!videos.length) return res.status(404).json({ error: 'No videos found' });

    const video = videos[Math.floor(Math.random() * videos.length)];
    // Prefer HD file, fall back to largest available
    const files = video.video_files || [];
    const hd = files.find(f => f.quality === 'hd') || files.sort((a,b) => b.width - a.width)[0];
    if (!hd) return res.status(404).json({ error: 'No file found' });

    res.status(200).json({ url: hd.link, width: hd.width, height: hd.height });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
