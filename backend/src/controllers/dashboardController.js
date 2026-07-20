const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getStats(req, res) {
    try {
      const userId = req.query.userId;
      const stats = await dashboardService.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Dashboard istatistikleri alınırken hata:', error);
      res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
  }
}

module.exports = new DashboardController();
