require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const app = express();
const PORT = process.env.PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.stefanmars.nl';
const PROXY_URL = process.env.PROXY_URL;

app.use(cors());
app.use(express.json());

const proxyAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

app.all('/api/*', async (req, res) => {
  try {
    const path = req.params[0];
    const targetUrl = `${API_BASE_URL}/${path}`;

    console.log(`[${new Date().toISOString()}] ${req.method} ${targetUrl}`);

    const headers = { ...req.headers };
    delete headers.host;
    delete headers.origin;
    delete headers.referer;

    const config = {
      method: req.method,
      url: targetUrl,
      headers,
      data: req.body,
      httpsAgent: proxyAgent,
      params: req.query,
    };

    const response = await axios(config);

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Proxy server error',
        message: error.message
      });
    }
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    proxy: PROXY_URL ? 'enabled' : 'disabled',
    apiBase: API_BASE_URL
  });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Proxy: ${PROXY_URL ? 'Enabled' : 'Disabled'}`);
});
