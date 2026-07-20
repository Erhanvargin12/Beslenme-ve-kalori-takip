const mealRepository = require('../repositories/mealRepository');

class MealService {
  async logMeal(userId, mealInfo) {
    // mealInfo: { foodName, calories, protein, carbs, fat, imageUrl? }
    const formattedMeal = {
      foodName: mealInfo.foodName,
      calories: Number(mealInfo.calories) || 0,
      protein: Number(mealInfo.protein) || 0,
      carbs: Number(mealInfo.carbs) || 0,
      fat: Number(mealInfo.fat) || 0,
      imageUrl: mealInfo.imageUrl || null
    };

    return await mealRepository.addMeal(userId, formattedMeal);
  }

  async getUserMealHistory(userId) {
    return await mealRepository.getByUserId(userId);
  }

  async getDailySummary(userId) {
    const today = new Date().toISOString().split('T')[0];
    return await mealRepository.getDailyTotal(userId, today);
  }
}

module.exports = new MealService();
