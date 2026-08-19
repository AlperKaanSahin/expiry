require('dotenv').config();

const common = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'mysql',
};

module.exports = {
  development: {
    ...common,
    database: process.env.DB_NAME,
  },

  test: {
    ...common,
    database: process.env.DB_TEST_NAME || process.env.DB_NAME,
  },

  production: {
    ...common,
    database: process.env.DB_NAME,
  },
};