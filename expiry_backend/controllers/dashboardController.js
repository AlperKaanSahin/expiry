const dashboardService = require('../services/dashboardService');
const catchAsync = require('../utils/catchAsync');

module.exports = {
  getSummary: catchAsync(async (req, res) => {
    const summary = await dashboardService.getShopSummary(req.user.id);
    res.json(summary);
  }),
};