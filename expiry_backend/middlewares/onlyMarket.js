module.exports = (req, res, next) => {
  if (req.user.role !== 'market') {
    return res.status(403).json({ error: 'Sadece market kullanıcıları erişebilir' });
  }
  next();
};