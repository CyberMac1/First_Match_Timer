require('dotenv').config();
const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const FRC_API_HOST = 'frc-api.firstinspires.org';
const FRC_API_VERSION = 'v2.0';

app.use(express.static(path.join(__dirname, 'public')));

// Expose server-side config to the frontend (no secrets exposed)
app.get('/config', (req, res) => {
  res.json({
    testModeEnabled: process.env.TEST_MODE_ENABLED === 'true',
    hasCredentials:  !!(process.env.FRC_USERNAME && process.env.FRC_API_KEY),
  });
});

// Proxy all /api/frc/* requests to the FRC API
app.get('/api/frc/*', (req, res) => {
  const remainder    = req.path.replace(/^\/api\/frc/, '');
  const queryString  = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const upstreamPath = `/${FRC_API_VERSION}${remainder}${queryString}`;

  if (!process.env.FRC_USERNAME || !process.env.FRC_API_KEY) {
    return res.status(401).json({ error: 'FRC API credentials not configured. Set FRC_USERNAME and FRC_API_KEY in .env' });
  }

  const encoded    = Buffer.from(`${process.env.FRC_USERNAME}:${process.env.FRC_API_KEY}`).toString('base64');
  const authHeader = `Basic ${encoded}`;

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
    console.log('⚠️   Set FRC_USERNAME and FRC_API_KEY in a .env file to connect to the FRC API.\n');
  }
  console.log(`   Test mode: ${process.env.TEST_MODE_ENABLED === 'true' ? 'ENABLED' : 'disabled'}\n`);
});
