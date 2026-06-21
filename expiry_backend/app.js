require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');

require('./handlers/notification.handler');
require('./handlers/audit.handler');

const app = express();
app.set('trust proxy', 1);

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
if (process.env.NODE_ENV !== 'development') {
  app.use('/api/users/login', authLimiter);
  app.use('/api/users/register', authLimiter);
}

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/shop/products', require('./routes/shopProductRoutes'));
app.use('/api/shop/packages', require('./routes/shopPackageRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => res.send('Backend is running'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

sequelize.sync()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });