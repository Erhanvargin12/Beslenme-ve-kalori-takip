const aiService = require('../services/aiService');
const userRepository = require('../repositories/userRepository');
const mealRepository = require('../repositories/mealRepository');
const { MOCK_STRUCTURED_ANALYSIS } = require('../utils/aiMockData');
const { db, COLLECTIONS } = require('../config/firebase');

class AiController {
  async analyze(req, res) {
    try {
      const { gorselBase64, mimeType } = req.body;
      if (!gorselBase64) {
        return res.status(400).send("Analiz için bir fotoğraf gönderilmedi.");
      }
      
      const result = await aiService.analyzeFoodImage(gorselBase64, mimeType);
      
      // Log usage stat
      await db.collection(COLLECTIONS.USAGE_STATS).add({
        type: 'photo_analysis',
        createdAt: new Date(),
        status: 'success'
      });

      res.send(result);
    } catch (error) {
      res.status(500).send("Analiz sırasında bir hata oluştu.");
    }
  }

  async analyzeDetailed(req, res) {
    try {
      const { gorselBase64, mimeType } = req.body;
      if (!gorselBase64) {
        return res.status(400).json({ error: 'Analiz için bir fotoğraf gönderilmedi.' });
      }

      const result = await aiService.analyzeFoodImageStructured(gorselBase64, mimeType);

      try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../../public/uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const fileName = `meal_${Date.now()}.jpg`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(gorselBase64, 'base64'));
        result.imageUrl = `/uploads/${fileName}`;
      } catch (err) {
        console.error('Error saving image:', err.message);
      }

      try {
        await db.collection(COLLECTIONS.USAGE_STATS).add({
          type: 'photo_analysis',
          createdAt: new Date(),
          status: result?.status === 'MAINTENANCE_MODE' ? 'maintenance' : 'success',
        });
      } catch (logError) {
        console.warn('[AI] Kullanım istatistiği kaydedilemedi:', logError.message);
      }

      return res.json(result);
    } catch (error) {
      console.error('Controller Error:', error);

      if (error.message?.includes('API_KEY_LEAKED')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message?.includes('429') || error.message?.includes('kota')) {
        return res.status(429).json({
          error:
            'Yapay zeka servisi şu an yoğun (API kotası aşıldı). Lütfen 1-2 dakika bekleyip tekrar deneyin.',
        });
      }

      return res.status(500).json({ error: error.message || 'Analiz sırasında beklenmeyen bir hata oluştu.' });
    }
  }

  async getAdvice(req, res) {
    try {
      const userData = req.body || {};
      const profile = userData.profile || {};
      const dailySummary = userData.dailySummary || {};

      if (!profile.boy && !profile.kilo) {
        return res.status(400).json({
          error: 'Profil verisi eksik. Önce VKİ bilgilerinizi kaydedin.',
        });
      }

      const advice = await aiService.generateWeeklyReportAdvice({
        profile: {
          boy: profile.boy ?? 170,
          kilo: profile.kilo ?? 70,
          yas: profile.yas ?? 25,
          hedef: profile.hedef ?? 'Sağlıklı Beslenme',
          alerjiler: profile.alerjiler ?? 'Yok',
        },
        dailySummary: {
          totalCalories: dailySummary.totalCalories ?? 0,
          protein: dailySummary.protein ?? 0,
          carbs: dailySummary.carbs ?? dailySummary.carb ?? 0,
          fat: dailySummary.fat ?? 0,
        },
      });

      res.type('text/plain; charset=utf-8').send(advice);
    } catch (error) {
      console.error('getAdvice hatası:', error.message);
      res.status(500).json({
        error: error.message || 'Tavsiye alınırken bir hata oluştu.',
      });
    }
  }

  async getWeeklyAdvice(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).send("User ID zorunludur.");
      }

      const profile = await userRepository.getById(userId);
      const weeklySummary = await mealRepository.getWeeklySummary(userId);
      
      const advice = await aiService.generateWeeklyAdvice({ profile, weeklySummary });
      res.send(advice);
    } catch (error) {
      console.error("Weekly Advice Controller Error:", error);
      res.status(500).send("Haftalık tavsiye alınırken bir hata oluştu.");
    }
  }
}

module.exports = new AiController();
