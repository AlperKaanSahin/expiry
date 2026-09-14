const adminDashboardService = require('../services/adminDashboardService');
const catchAsync = require('../utils/catchAsync');

module.exports = {
  getSummary: catchAsync(async (req, res) => {
    const summary = await adminDashboardService.getAdminSummary();
    res.json(summary);
  }),
};