const { User } = require('../models');
const jwt = require('jsonwebtoken');

module.exports = {
  async register(req, res) {
    try {
      const user = await User.create(req.body);
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.status(201).json({ user, token });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user || !user.validPassword(password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

// userController.js örneği
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ user, token });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      return res.json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
};