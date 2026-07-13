const clean = (value, maxLength) =>
  String(value ?? '').trim().slice(0, maxLength);

const normalizeOrigin = (value = '') => {
  const raw = String(value).trim().replace(/\/+$/, '');
  if (!raw) return '';

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(candidate).origin;
  } catch {
    return raw;
  }
};

const getAllowedOrigins = (req) => {
  const forwardedHost = String(
    req.headers['x-forwarded-host'] || req.headers.host || ''
  ).split(',')[0].trim();

  const forwardedProto = String(
    req.headers['x-forwarded-proto'] || 'https'
  ).split(',')[0].trim();

  const sameDeploymentOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : '';

  const configuredOrigins = [
    ...(process.env.ALLOWED_ORIGIN || '').split(','),
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    sameDeploymentOrigin,
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  return new Set(
    configuredOrigins
      .map(normalizeOrigin)
      .filter(Boolean)
  );
};

const setCorsHeaders = (req, res) => {
  const requestOrigin = normalizeOrigin(req.headers.origin || '');
  const allowedOrigins = getAllowedOrigins(req);

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');

  return { requestOrigin, allowedOrigins };
};

const parsePayload = (req) => {
  if (!req.body) return {};

  if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const raw = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : String(req.body);

  const contentType = String(req.headers['content-type'] || '');

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  return JSON.parse(raw || '{}');
};

module.exports = async function contactHandler(req, res) {
  const { requestOrigin, allowedOrigins } = setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed.'
    });
  }

  if (
    requestOrigin &&
    allowedOrigins.size > 0 &&
    !allowedOrigins.has(requestOrigin)
  ) {
    return res.status(403).json({
      ok: false,
      error: 'This website origin is not allowed.'
    });
  }

  const token = clean(process.env.TELEGRAM_BOT_TOKEN, 200);
  const chatId = clean(
    process.env.TELEGRAM_CHAT_ID || '-991103490',
    80
  );

  if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN.');
    return res.status(500).json({
      ok: false,
      error:
        'Telegram is not configured. Add TELEGRAM_BOT_TOKEN in Vercel Environment Variables and redeploy.'
    });
  }

  let payload;

  try {
    payload = parsePayload(req);
  } catch (error) {
    console.error('Invalid contact request body:', error);
    return res.status(400).json({
      ok: false,
      error: 'Invalid request body.'
    });
  }

  // Silent success for bot submissions caught by the honeypot.
  if (payload.website) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(payload.name, 80);
  const email = clean(payload.email, 120);
  const phone = clean(payload.phone, 30);
  const message = clean(payload.message, 1500);

  if (!name || !email || !message) {
    return res.status(400).json({
      ok: false,
      error: 'Name, email and message are required.'
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      ok: false,
      error: 'Enter a valid email address.'
    });
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
    `🌐 Source: ${requestOrigin || 'Portfolio website'}`
  ]
    .filter(Boolean)
    .join('\n');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          disable_web_page_preview: true
        }),
        signal: controller.signal
      }
    );

    const telegramResult = await telegramResponse
      .json()
      .catch(() => ({}));

    if (!telegramResponse.ok || telegramResult.ok !== true) {
      console.error('Telegram API rejected the message:', telegramResult);

      return res.status(502).json({
        ok: false,
        error:
          clean(telegramResult.description, 220) ||
          'Telegram rejected the message. Verify the bot token, group ID, and bot membership.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Message sent successfully.'
    });
  } catch (error) {
    console.error('Telegram request failed:', error);

    return res.status(502).json({
      ok: false,
      error:
        error?.name === 'AbortError'
          ? 'Telegram timed out. Please try again.'
          : 'Could not reach Telegram.'
    });
  } finally {
    clearTimeout(timeoutId);
  }
};
