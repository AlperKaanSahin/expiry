const userService = require('../services/userService');

module.exports = {

  async refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await userService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
},
async register(req, res) {
  try {
    const result = await userService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
},

async login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
},

  async getProfile(req, res) {
    try {
      const user = await userService.getProfile(req.user.id);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async changePassword(req, res) {
  try {
    const { password, newPassword } = req.body;
    await userService.changePassword(req.user.id, password, newPassword);
    res.json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
},
async updateProfile(req, res) {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
  
};
