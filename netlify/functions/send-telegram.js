const normalizeOrigin = (value = '') => {
  try {
    return new URL(value).origin;
  } catch {
    return String(value).trim().replace(/\/$/, '');
  }
};

const clean = (value, maxLength) => String(value ?? '').trim().slice(0, maxLength);

const allowedOrigins = () => {
  const configured = [
    ...(process.env.ALLOWED_ORIGIN || '').split(','),
    process.env.URL,
    process.env.DEPLOY_URL,
    process.env.DEPLOY_PRIME_URL,
    'http://localhost:8888',
    'http://localhost:3000'
  ];

  return new Set(configured.map(normalizeOrigin).filter(Boolean));
};

const responseHeaders = (origin = '') => {
  const allowed = allowedOrigins();
  const normalized = normalizeOrigin(origin);
  const allowOrigin = normalized && allowed.has(normalized)
    ? normalized
    : [...allowed][0] || '*';

  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
};

const json = (statusCode, body, origin = '') => ({
  statusCode,
  headers: responseHeaders(origin),
  body: JSON.stringify(body)
});

const parseBody = (event) => {
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || '';

  const contentType = String(event.headers?.['content-type'] || event.headers?.['Content-Type'] || '');
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return JSON.parse(rawBody || '{}');
};

exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || '';

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: responseHeaders(requestOrigin), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' }, requestOrigin);
  }

  const origins = allowedOrigins();
  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
  if (requestOrigin && origins.size && !origins.has(normalizedRequestOrigin)) {
    return json(403, { error: 'This website origin is not allowed.' }, requestOrigin);
  }

  const token = clean(
    process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || process.env.BOT_TOKEN,
    200
  );
  const chatId = clean(
    process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID || '-991103490',
    80
  );
  if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN.');
    return json(500, {
      error: 'Telegram is not configured. Add TELEGRAM_BOT_TOKEN in Netlify environment variables.'
    }, requestOrigin);
  }

  let payload;
  try {
    payload = parseBody(event);
  } catch {
    return json(400, { error: 'Invalid request body.' }, requestOrigin);
  }

  if (payload.website) return json(200, { ok: true }, requestOrigin); // Honeypot.

  const name = clean(payload.name, 80);
  const email = clean(payload.email, 120);
  const phone = clean(payload.phone, 30);
  const message = clean(payload.message, 1500);

  if (!name || !email || !message) {
    return json(400, { error: 'Name, email and message are required.' }, requestOrigin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Enter a valid email address.' }, requestOrigin);
  }

  const telegramMessage = [
    '📬 New portfolio message',
    '',
    `👤 Name: ${name}`,
    `✉️ Email: ${email}`,
    phone ? `📱 Phone: ${phone}` : null,
    '',
    '💬 Message:',
    message,
    '',
    `🌐 Source: ${normalizedRequestOrigin || 'Portfolio website'}`
  ].filter(Boolean).join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
        disable_web_page_preview: true
      }),
      signal: controller.signal
    });

    const result = await telegramResponse.json().catch(() => ({}));
    if (!telegramResponse.ok || !result.ok) {
      console.error('Telegram API error:', result);
      const description = clean(result.description, 180);
      return json(502, {
        error: description || 'Telegram rejected the message. Verify the bot token, group ID and bot membership.'
      }, requestOrigin);
    }

    return json(200, { ok: true }, requestOrigin);
  } catch (error) {
    console.error('Telegram function error:', error);
    const timedOut = error?.name === 'AbortError';
    return json(502, {
      error: timedOut ? 'Telegram timed out. Please try again.' : 'Could not reach Telegram.'
    }, requestOrigin);
  } finally {
    clearTimeout(timeout);
  }
};
