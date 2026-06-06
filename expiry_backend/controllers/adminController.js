const adminService = require('../services/adminService');

// USERS
exports.getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await adminService.getAllUsers(page, limit);

  res.json({
    total: result.count,
    page,
    limit,
    users: result.rows
  });
};

exports.deleteUser = async (req, res) => {
    try {

        await adminService.deleteUser(
            Number(req.params.id),
            req.user.id
        );

        res.json({ success: true });

    } catch (err) {

        res.status(400).json({
            error: err.message
        });

    }
};
exports.getUserById = async (req, res) => {{
  const user = await adminService.getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  }
  res.json(user);
}};

exports.updateUserRole = async (req, res) => {
  try {
    const user = await adminService.updateUserRole(
      req.params.id,
      req.body.role,
      req.user.id
    );

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// MARKETS
exports.getAllShops = async (req, res) => {
  const shops = await adminService.getAllShops();
  res.json(shops);
};

exports.createShop = async (req, res) => {
  const shop = await adminService.createShop(req.body);
  res.status(201).json(shop);
};

exports.updateShop = async (req, res) => {
  const updated = await adminService.updateShop(req.params.id, req.body);

  if (!updated) {
    return res.status(404).json({ error: 'Market bulunamadı' });
  }

  res.json(updated);
};

exports.deleteShop = async (req, res) => {
  const result = await adminService.deleteShop(req.params.id);

  if (!result) {
    return res.status(404).json({ error: 'Market bulunamadı' });
  }

  res.json({ success: true });
};

exports.updateShopStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const shop = await adminService.updateShopStatus(id, status);

    return res.json({
      message: "Status updated",
      shop
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
exports.updateShopStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const shop = await adminService.updateShopStatus(id, status);

    return res.json({
      message: 'Status updated',
      shop
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};