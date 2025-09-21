import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const corsOrigin = process.env.CORS_ORIGIN || '';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

if (corsOrigin) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      return res.sendStatus(204);
    }
    return next();
  });
}

app.options('/api/contact', (req, res) => {
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  res.sendStatus(204);
});

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort === 465;
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const transportOptions = smtpHost
  ? {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined
    }
  : {
      streamTransport: true,
      newline: 'unix',
      buffer: true
    };

const transporter = nodemailer.createTransport(transportOptions);
const usingStreamTransport = Boolean(transportOptions.streamTransport);

if (!usingStreamTransport) {
  transporter
    .verify()
    .then(() => {
      console.log('SMTP transport verified. Ready to send.');
    })
    .catch((error) => {
      console.error('SMTP transport verification failed:', error.message);
    });
} else {
  console.log('No SMTP credentials detected. Using development stream transport (emails logged to console).');
}

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char] || char);

const trimAndClean = (value) => String(value || '').trim().replace(/\r\n?/g, '\n');

app.post('/api/contact', async (req, res) => {
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  }

  const name = trimAndClean(req.body?.name);
  const email = trimAndClean(req.body?.email);
  const message = trimAndClean(req.body?.message);

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields. Provide name, email, and message.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please supply a valid email address.' });
  }

  if (message.length < 10) {
    return res.status(400).json({ error: 'Tell us a bit more—messages must be at least 10 characters long.' });
  }

  if (message.length > 5000) {
    return res.status(400).json({ error: 'Messages are limited to 5000 characters.' });
  }

  const toAddress = process.env.CONTACT_TO || smtpUser || 'axadmihn@axnmihn.com';
  const fromAddress = process.env.CONTACT_FROM || `no-reply@${(process.env.DOMAIN || 'axnmihn.com').replace(/^https?:\/\//, '')}`;
  const requesterIp = trimAndClean((req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0]);

  const plainText = `${message}\n\nSender: ${name}\nEmail: ${email}${requesterIp ? `\nIP: ${requesterIp}` : ''}`;
  const htmlBody = `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p><hr><p><strong>Sender:</strong> ${escapeHtml(
    name
  )}<br><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>${
    requesterIp ? `<br><strong>IP:</strong> ${escapeHtml(requesterIp)}` : ''
  }</p>`;

  try {
    const info = await transporter.sendMail({
      to: toAddress,
      from: fromAddress,
      subject: `New Axnmihn contact from ${name}`,
      replyTo: email,
      text: plainText,
      html: htmlBody
    });

    if (usingStreamTransport && info && info.message) {
      console.log('Contact message preview:\n' + info.message.toString());
    } else {
      console.log('Contact message sent:', info.messageId || 'no-message-id');
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Unable to send contact email:', error);
    return res.status(500).json({ error: 'Internal error while sending email. Please try again later.' });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticDir = process.env.STATIC_DIR || path.resolve(__dirname, '..');

app.use(express.static(staticDir, { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`Server ready on http://localhost:${PORT}`);
  if (corsOrigin) {
    console.log(`CORS enabled for origin: ${corsOrigin}`);
  }
});
