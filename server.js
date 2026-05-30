const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS) || 45000;

app.use(express.json({ limit: '4mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'dllc-api-proxy' });
});

app.post('/api/chat/completions', async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      error: {
        message: 'Server is missing OPENROUTER_API_KEY environment variable.'
      }
    });
    return;
  }

  const payload = req.body || {};
  if (!payload.model || !Array.isArray(payload.messages) || !payload.messages.length) {
    res.status(400).json({
      error: {
        message: 'Invalid payload. "model" and non-empty "messages" are required.'
      }
    });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const referer = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const title = process.env.APP_TITLE || 'DLLC-Legal-Calculator';

    const upstreamResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-Title': title
      },
      body: JSON.stringify({
        model: payload.model,
        messages: payload.messages,
        temperature: payload.temperature,
        max_tokens: payload.max_tokens
      }),
      signal: controller.signal
    });

    const responseText = await upstreamResponse.text();
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = {
        error: {
          message: responseText || `Upstream provider error (${upstreamResponse.status}).`
        }
      };
    }

    if (!upstreamResponse.ok) {
      res.status(upstreamResponse.status).json(responseJson);
      return;
    }

    res.json(responseJson);
  } catch (error) {
    if (error?.name === 'AbortError') {
      res.status(504).json({
        error: {
          message: `Upstream timeout after ${OPENROUTER_TIMEOUT_MS}ms.`
        }
      });
      return;
    }

    res.status(502).json({
      error: {
        message: error instanceof Error ? error.message : 'Failed to reach upstream AI provider.'
      }
    });
  } finally {
    clearTimeout(timeoutId);
  }
});

app.use(express.static(ROOT_DIR, { extensions: ['html'] }));

app.get('*', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`DLLC app running on http://localhost:${PORT}`);
});
