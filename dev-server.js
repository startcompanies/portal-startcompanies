// Dev-only Express server for Lili API endpoints.
// Run this alongside `ng serve` for local development.
// Usage: node dev-server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

function encodeLiliLinkPayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function getStringField(record, key) {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function normalizeLiliWebhook(body) {
  const root = body && typeof body === 'object' ? body : {};
  const data = root.data && typeof root.data === 'object' ? root.data : {};
  const business = root.business && typeof root.business === 'object'
    ? root.business
    : data.business && typeof data.business === 'object'
      ? data.business
      : {};

  return {
    event: getStringField(root, 'event') || getStringField(root, 'action') || 'unknown',
    status: getStringField(data, 'status') || getStringField(root, 'onboardingStatus') || getStringField(business, 'status'),
    personId: getStringField(root, 'personId') || getStringField(data, 'personId'),
    customerId: getStringField(root, 'customerId') || getStringField(data, 'customerId'),
    businessExternalId: getStringField(business, 'externalId'),
    email: getStringField(root, 'email') || getStringField(data, 'email'),
    token: getStringField(root, 'token') || getStringField(data, 'token'),
    raw: body,
  };
}

// ─── Lili: generate protected onboarding link ─────────────────────────────────
app.post('/api/auth/generate-lili-link', (req, res) => {
  const { email, firstName, lastName, businessName } = req.body || {};
  if (!email) { res.status(400).json({ error: 'email is required' }); return; }

  const token = encodeLiliLinkPayload({
    email,
    firstName,
    lastName,
    businessName,
    exp: Math.floor(Date.now() / 1000) + 48 * 60 * 60,
  });

  res.json({ link: `http://localhost:4200/banking?t=${token}`, token });
});

// ─── Lili: create application and return embed token ─────────────────────────
app.post('/api/lili/create-application', async (req, res) => {
  const { email, firstName, lastName, businessName } = req.body || {};
  if (!email) { res.status(400).json({ error: 'email is required' }); return; }

  const { LILI_ACCESS_KEY, LILI_SECRET_KEY, LILI_ENV } = process.env;
  if (!LILI_ACCESS_KEY || !LILI_SECRET_KEY) {
    res.status(500).json({ error: 'Lili credentials not configured' }); return;
  }

  const liliBase = LILI_ENV === 'Prod' ? 'https://prod.lili.co' : 'https://sandbox.lili.co';

  try {
    const response = await fetch(`${liliBase}/lili/api/v1/lead`, {
      method: 'POST',
      headers: {
        'Authorization': `lili ${LILI_ACCESS_KEY}:${LILI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, firstName, lastName, businessName }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Lili] ${response.status}:`, text);
      res.status(response.status).json({ error: `Lili API error: ${response.status}` }); return;
    }

    const data = await response.json();
    res.status(201).json({ token: data.token, location: data.location });
  } catch (err) {
    console.error('[Lili] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Lili: webhook inspector storage (in-memory, last 20 events) ─────────────
const liliWebhookLog = [];

// ─── Lili: webhook ────────────────────────────────────────────────────────────
app.post('/api/lili/webhook', (req, res) => {
  const body = req.body || {};
  const normalized = normalizeLiliWebhook(body);
  const entry = { receivedAt: new Date().toISOString(), body, normalized };

  liliWebhookLog.unshift(entry);
  if (liliWebhookLog.length > 20) liliWebhookLog.pop();

  console.log('\n━━━ [Lili Webhook] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[Lili Webhook] Normalized:', JSON.stringify(normalized, null, 2));
  console.log(JSON.stringify(body, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  res.sendStatus(200);
});

// ─── Lili: inspect last webhook events ────────────────────────────────────────
app.get('/api/lili/webhook/inspect', (req, res) => {
  res.json({ count: liliWebhookLog.length, events: liliWebhookLog });
});

// ─── Lili: simulate a webhook call for testing ────────────────────────────────
app.post('/api/lili/webhook/test', (req, res) => {
  const mockEvent = req.body?.event || req.body?.action || 'onboardingComplete';
  const mockBody = {
    event: mockEvent,
    data: req.body?.data || {
      email: 'test@example.com',
      customerId: 'mock-customer-id-123',
      personId: 'mock-person-id-123',
      status: 'approved',
    },
  };

  const normalized = normalizeLiliWebhook(mockBody);
  const entry = { receivedAt: new Date().toISOString(), body: mockBody, normalized, _simulated: true };
  liliWebhookLog.unshift(entry);
  if (liliWebhookLog.length > 20) liliWebhookLog.pop();

  console.log('\n━━━ [Lili Webhook - SIMULATED] ━━━━━━━━━━━━━━━━━━━');
  console.log('[Lili Webhook - SIMULATED] Normalized:', JSON.stringify(normalized, null, 2));
  console.log(JSON.stringify(mockBody, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  res.json({ ok: true, simulated: mockBody, normalized });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Dev server running on http://localhost:${PORT}`);
  console.log(`Generate a test link: POST http://localhost:${PORT}/api/auth/generate-lili-link`);
});
