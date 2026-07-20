const mealService = require('../services/mealService');

class MealController {
  async addMeal(req, res) {
    try {
      const { userId, foodName, calories, protein, carbs, fat, imageUrl } = req.body;
      
      if (!userId || !foodName) {
        return res.status(400).json({ error: 'Eksik bilgi: userId ve foodName zorunludur.' });
      }

      const meal = await mealService.logMeal(userId, { foodName, calories, protein, carbs, fat, imageUrl });
      res.status(201).json({ message: 'Yemek başarıyla kaydedildi', meal });
    } catch (error) {
      res.status(500).json({ error: 'Yemek kaydedilirken bir hata oluştu.' });
    }
  }

  async getHistory(req, res) {
    try {
      const { userId } = req.params;
      const history = await mealService.getUserMealHistory(userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Geçmiş verileri getirilirken hata oluştu.' });
    }
  }

  async getSummary(req, res) {
    try {
      const { userId } = req.params;
      const summary = await mealService.getDailySummary(userId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Günlük özet getirilirken hata oluştu.' });
    }
  }
}

module.exports = new MealController();
