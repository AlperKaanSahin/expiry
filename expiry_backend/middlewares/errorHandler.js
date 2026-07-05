module.exports = (err, req, res, next) => {
  console.error('ERROR:', err.message);
  
  const status = err.status || 500;
  const message = err.message || 'Sunucu hatası oluştu';

  res.status(status).json({ error: message });
};