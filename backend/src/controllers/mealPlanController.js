const aiService = require('../services/aiService');
const mealPlanRepository = require('../repositories/mealPlanRepository');

class MealPlanController {

  /**
   * AI ile Otomatik Doldur - Haftalık plan üret ve Firestore'a kaydet
   * POST /meal-plan/generate
   * Body: { userId, vki, dailyCalorieTarget, weekStart, emptyDays? }
   */
  async generatePlan(req, res) {
    try {
      const { userId, vki, dailyCalorieTarget, weekStart, emptyDays } = req.body;

      if (!userId || !vki || !dailyCalorieTarget || !weekStart) {
        return res.status(400).json({ error: 'Eksik parametreler: userId, vki, dailyCalorieTarget, weekStart zorunludur.' });
      }

      console.log(`🍽️ AI Plan üretimi başlıyor: VKİ=${vki}, Hedef=${dailyCalorieTarget} kcal`);

      // 1. AI'dan haftalık öğün planı üret
      const plan = await aiService.generateWeeklyMealPlan(
        vki,
        dailyCalorieTarget,
        emptyDays || [0, 1, 2, 3, 4, 5, 6]
      );

      // 2. Mevcut planı temizle (varsa)
      await mealPlanRepository.clearWeeklyPlan(userId, weekStart);

      // 3. Yeni planı Firestore'a toplu kaydet
      const savedPlan = await mealPlanRepository.saveWeeklyPlanBatch(userId, weekStart, plan);

      res.json({
        message: `${savedPlan.length} öğün başarıyla planlandı.`,
        plan: savedPlan,
        weekStart
      });
    } catch (error) {
      console.error('Plan üretme controller hatası:', error.message);
      const msg = error.message?.includes('kota') || error.message?.includes('429')
        ? 'AI API kotası aşıldı. Lütfen birkaç dakika sonra tekrar deneyin.'
        : 'Haftalık plan oluşturulurken bir hata oluştu.';
      res.status(503).json({ error: msg });
    }
  }

  /**
   * Haftalık planı Firestore'dan getir
   * GET /meal-plan/:userId/:weekStart
   */
  async getPlan(req, res) {
    try {
      const { userId, weekStart } = req.params;
      const plan = await mealPlanRepository.getWeeklyPlan(userId, weekStart);
      res.json(plan);
    } catch (error) {
      console.error('Plan getirme hatası:', error);
      res.status(500).json({ error: 'Plan verileri getirilirken hata oluştu.' });
    }
  }

  /**
   * Manuel öğün ekle
   * POST /meal-plan/add
   * Body: { userId, weekStart, dayIndex, dayName, meal, type, calories }
   */
  async addMeal(req, res) {
    try {
      const { userId, weekStart, dayIndex, dayName, meal, type, calories } = req.body;

      if (!userId || !weekStart || dayIndex === undefined || !meal || !type) {
        return res.status(400).json({ error: 'Eksik bilgi: userId, weekStart, dayIndex, meal, type zorunludur.' });
      }

      const saved = await mealPlanRepository.addMealToPlan({
        userId,
        weekStart,
        dayIndex: Number(dayIndex),
        dayName: dayName || '',
        meal,
        type,
        calories: Number(calories) || 0,
        source: 'manual'
      });

      res.status(201).json({ message: 'Öğün başarıyla eklendi.', meal: saved });
    } catch (error) {
      console.error('Öğün ekleme hatası:', error);
      res.status(500).json({ error: 'Öğün eklenirken bir hata oluştu.' });
    }
  }

  /**
   * Öğün sil
   * DELETE /meal-plan/:docId
   */
  async deleteMeal(req, res) {
    try {
      const { docId } = req.params;
      await mealPlanRepository.deleteMealFromPlan(docId);
      res.json({ message: 'Öğün başarıyla silindi.' });
    } catch (error) {
      console.error('Öğün silme hatası:', error);
      res.status(500).json({ error: 'Öğün silinirken bir hata oluştu.' });
    }
  }

  /**
   * Su takibi - kaydı getir
   * GET /water-log/:userId/:date
   */
  async getWaterLog(req, res) {
    try {
      const { userId, date } = req.params;
      const log = await mealPlanRepository.getWaterLog(userId, date);
      res.json(log || { glasses: 0 });
    } catch (error) {
      console.error('Su kaydı getirme hatası:', error);
      res.status(500).json({ error: 'Su kaydı getirilirken hata oluştu.' });
    }
  }

  /**
   * Su takibi - kaydı güncelle
   * POST /water-log
   * Body: { userId, date, glasses }
   */
  async updateWaterLog(req, res) {
    try {
      const { userId, date, glasses } = req.body;

      if (!userId || !date || glasses === undefined) {
        return res.status(400).json({ error: 'Eksik bilgi: userId, date, glasses zorunludur.' });
      }

      const result = await mealPlanRepository.updateWaterLog(userId, date, Number(glasses));
      res.json({ message: 'Su kaydı güncellendi.', log: result });
    } catch (error) {
      console.error('Su kaydı güncelleme hatası:', error);
      res.status(500).json({ error: 'Su kaydı güncellenirken hata oluştu.' });
    }
  }
}

module.exports = new MealPlanController();
