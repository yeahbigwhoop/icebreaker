const https = require('https');

module.exports = async function(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'No API key' });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/models',
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
  };

  const data = await new Promise((resolve, reject) => {
    const req = https.request(options, r => {
      let body = '';
      r.on('data', c => body += c);
      r.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.end();
  });

  res.status(200).json(JSON.parse(data));
};
