require('dotenv').config();
const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const FRC_API_HOST = 'frc-api.firstinspires.org';
const FRC_API_VERSION = 'v2.0';

app.use(express.static(path.join(__dirname, 'public')));

// Proxy all /api/frc/* requests to the FRC API
app.get('/api/frc/*', (req, res) => {
  // Build the upstream path: /v2.0/{rest of path}
  const remainder = req.path.replace(/^\/api\/frc/, '');
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const upstreamPath = `/${FRC_API_VERSION}${remainder}${queryString}`;

  // Resolve auth: .env credentials take priority over browser-supplied header
  let authHeader;
  if (process.env.FRC_USERNAME && process.env.FRC_API_KEY) {
    const encoded = Buffer.from(`${process.env.FRC_USERNAME}:${process.env.FRC_API_KEY}`).toString('base64');
    authHeader = `Basic ${encoded}`;
  } else if (req.headers['x-frc-auth']) {
    // Browser sends pre-encoded Base64 string via X-FRC-Auth header
    authHeader = `Basic ${req.headers['x-frc-auth']}`;
  } else {
    return res.status(401).json({ error: 'No FRC API credentials. Add to .env or enter in dashboard Settings.' });
  }

  const options = {
    hostname: FRC_API_HOST,
    path: upstreamPath,
    method: 'GET',
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
      'User-Agent': 'FRC-Match-Dashboard/1.0',
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    res.set('Content-Type', proxyRes.headers['content-type'] || 'application/json');
    // Stream response directly to client
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy error]', err.message);
    res.status(502).json({ error: `Could not reach FRC API: ${err.message}` });
  });

  proxyReq.end();
});

app.listen(PORT, () => {
  console.log(`\n✅  FRC Dashboard  →  http://localhost:${PORT}\n`);
  if (!process.env.FRC_USERNAME || !process.env.FRC_API_KEY) {
    console.log('⚠️   No credentials found in .env — enter them via the dashboard Settings panel.\n');
  }
});
