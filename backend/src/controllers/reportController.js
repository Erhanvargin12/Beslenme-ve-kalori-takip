const reportService = require('../services/reportService');

class ReportController {
  async getFullReportData(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: 'Kullanıcı ID gereklidir.' });
      }

      const reportData = await reportService.getFullHistoryData(userId);
      
      if (!reportData) {
        return res.status(404).json({ error: 'Henüz rapor oluşturulacak veri bulunamadı.' });
      }

      res.json(reportData);
    } catch (error) {
      console.error('getFullReportData hatasi:', error);
      res.status(500).json({ error: 'Rapor verileri hazırlanırken bir hata oluştu.' });
    }
  }
}

module.exports = new ReportController();
