require('dotenv').config();

const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.npm_package_version,
});

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('./handlers/notification.handler');
require('./handlers/audit.handler');

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

if (!['development', 'test'].includes(process.env.NODE_ENV)) {
  app.use('/api/users/login', authLimiter);
  app.use('/api/users/register', authLimiter);
}

app.get('/test-error', (req, res) => {
  throw new Error('Sentry backend test hatası');
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/shop/products', require('./routes/shopProductRoutes'));
app.use('/api/shop/packages', require('./routes/shopPackageRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint bulunamadı'
  });
});

const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;