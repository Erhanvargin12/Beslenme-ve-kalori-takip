const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const os = require('os');
const dns = require('dns');
const apiRoutes = require('./routes/api');
const notificationService = require('./services/notificationService');
const { db } = require('./config/firebase');

dns.setDefaultResultOrder('ipv4first');

const app = express();

const STATIC_ALLOWED_ORIGINS = new Set([
  'https://localhost:5173',
  'http://localhost:5173',
  'https://127.0.0.1:5173',
  'http://127.0.0.1:5173',
  'https://localhost:5174',
  'http://localhost:5174',
  'https://127.0.0.1:5174',
  'http://127.0.0.1:5174',
]);

const DEV_WEB_PORTS = new Set(['5173', '5174', '5175', '4173']);

function isPrivateLanHost(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }
  if (STATIC_ALLOWED_ORIGINS.has(origin)) {
    return true;
  }
  try {
    const url = new URL(origin);
    const port = url.port || (url.protocol === 'https:' ? '443' : '80');
    if (!DEV_WEB_PORTS.has(port)) {
      return false;
    }
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      isPrivateLanHost(url.hostname)
    );
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      console.warn('[CORS] Reddedilen origin:', origin);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(bodyParser.json({ limit: '30mb' }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));
app.use('/', apiRoutes);

setInterval(async () => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPercentage = ((totalMem - freeMem) / totalMem) * 100;

    if (usedMemPercentage > 90) {
      await notificationService.notifyError('MEMORY_CRITICAL', {
        usedPercentage: usedMemPercentage.toFixed(2),
        freeMemMB: Math.round(freeMem / 1024 / 1024),
      });
    }

    try {
      await db.collection('users').limit(1).get();
    } catch (dbError) {
      await notificationService.notifyError('DB_CONNECTION_ERROR', {
        message: dbError.message,
        code: dbError.code,
      });
    }
  } catch (error) {
    console.error('[Monitor] İzleme sırasında hata:', error.message);
  }
}, 30 * 60 * 1000);

app.use((err, req, res, next) => {
  console.error('[Express Error]', err.message || err);
  if (err.stack) {
    console.error(err.stack);
  }

  notificationService
    .notifyError('SERVER_INTERNAL_ERROR', {
      message: err.message,
      path: req.path,
      method: req.method,
      stack: err.stack?.substring(0, 500),
    })
    .catch(() => {});

  if (res.headersSent) {
    return next(err);
  }

  const isPayloadTooLarge =
    err.type === 'entity.too.large' ||
    err.status === 413 ||
    String(err.message || '').toLowerCase().includes('entity too large');

  const status = isPayloadTooLarge ? 413 : err.status || err.statusCode || 500;
  const message = isPayloadTooLarge
    ? 'Görsel çok büyük. Lütfen daha küçük bir fotoğraf yükleyin veya kameradan tekrar çekin.'
    : err.message || 'Sunucu tarafında bir hata oluştu.';

  res.status(status).json({ error: message });
});

module.exports = app;
