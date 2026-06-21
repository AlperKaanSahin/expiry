const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { sequelize } = require('./models');
const marketProductRoutes = require('./routes/marketProductRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');


require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/users/profile', require('./routes/userRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/market', require('./routes/shopRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api', marketProductRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', require('./routes/marketPackageRoutes'));
app.use('/api/admin', adminRoutes);


// Test route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Error handling middleware
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