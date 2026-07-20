const os = require('os');
const aiService = require('../services/aiService');
const dashboardService = require('../services/dashboardService');
const { db } = require('../config/firebase');

class SystemController {
  /**
   * Gemini API Sağlık Kontrolü
   */
  async getAiHealth(req, res) {
    try {
      const status = await aiService.getHealthStatus();
      res.json({ status });
    } catch (error) {
      res.status(500).json({ status: 'HATA', error: error.message });
    }
  }

  /**
   * Sunucu Bellek Kullanımı
   */
  async getMemoryUsage(req, res) {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      const usagePercentage = Math.round((usedMem / totalMem) * 100);
      const totalGB = (totalMem / (1024 * 1024 * 1024)).toFixed(2);

      res.json({
        percentage: usagePercentage,
        label: `${usagePercentage}% / ${totalGB}GB RAM`,
        totalGB
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Veritabanı İstatistikleri
   */
  async getDatabaseStats(req, res) {
    try {
      const stats = await dashboardService.getCollectionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Genel Sistem Durumu (Toplu)
   */
  async getSystemStatus(req, res) {
    try {
      // Firestore bağlantı kontrolü (Admin SDK ile)
      let firestoreStatus = 'BAĞLANTI AKTİF';
      try {
        await db.collection('users').limit(1).get();
      } catch (dbError) {
        console.error('[SystemController] Firestore hatası:', dbError.code, dbError.message);
        firestoreStatus = 'ERİŞİM HATASI';
      }

      const aiStatus = await aiService.getHealthStatus();
      const dbStats = await dashboardService.getCollectionStats();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const usagePercentage = Math.round((usedMem / totalMem) * 100);

      res.json({
        ai: aiStatus,
        db: dbStats,
        firestoreStatus,
        memory: {
          percentage: usagePercentage,
          totalGB: (totalMem / (1024 * 1024 * 1024)).toFixed(2)
        },
        server: 'AKTİF'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SystemController();
