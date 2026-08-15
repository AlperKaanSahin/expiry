const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');

module.exports = {
  refreshToken: catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await userService.refreshAccessToken(refreshToken);
    res.json(result);
  }),

  register: catchAsync(async (req, res) => {
    const result = await userService.register(req.body);
    res.status(201).json(result);
  }),

  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.json(result);
  }),

  logout: catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    await userService.revokeRefreshToken(refreshToken);
    res.json({ message: 'Çıkış yapıldı' });
  }),

  getProfile: catchAsync(async (req, res) => {
    const user = await userService.getProfile(req.user.id);
    res.json(user);
  }),

  changePassword: catchAsync(async (req, res) => {
    const { password, newPassword } = req.body;
    await userService.changePassword(req.user.id, password, newPassword);
    res.json({ message: 'Şifre başarıyla değiştirildi' });
  }),

  updateProfile: catchAsync(async (req, res) => {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(user);
  }),

  forgotPassword: catchAsync(async (req, res) => {
    const { email } = req.body;
    const result = await userService.forgotPassword(email);
    res.json(result);
  }),

  resetPassword: catchAsync(async (req, res) => {
    const { email, token, newPassword } = req.body;
    const result = await userService.resetPassword(email, token, newPassword);
    res.json(result);
  }),

  deleteAccount: catchAsync(async (req, res) => {
    const { password } = req.body;
    const result = await userService.deleteAccount(req.user.id, password);
    res.json(result);
  }),

  registerDevice: catchAsync(async (req, res) => {
    const device = await userService.registerDevice(req.user.id, req.body);
    res.json({ message: 'Cihaz kaydedildi', device });
  }),

  removeDevice: catchAsync(async (req, res) => {
    const { deviceId } = req.body;
    await userService.removeDevice(req.user.id, deviceId);
    res.json({ message: 'Cihaz kaydı silindi' });
  }),
};