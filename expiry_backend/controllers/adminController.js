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
      req.body.role
    );

    res.json(user);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// MARKETS
exports.getAllMarkets = async (req, res) => {
  const markets = await adminService.getAllMarkets();
  res.json(markets);
};

exports.createMarket = async (req, res) => {
  const market = await adminService.createMarket(req.body);
  res.status(201).json(market);
};

exports.updateMarket = async (req, res) => {
  const updated = await adminService.updateMarket(req.params.id, req.body);

  if (!updated) {
    return res.status(404).json({ error: 'Market bulunamadı' });
  }

  res.json(updated);
};

exports.deleteMarket = async (req, res) => {
  const result = await adminService.deleteMarket(req.params.id);

  if (!result) {
    return res.status(404).json({ error: 'Market bulunamadı' });
  }

  res.json({ success: true });
};

exports.createMarketWithUser = async (req, res) => {
  const result = await adminService.createMarketWithUser(req.body);
  res.json(result);
};