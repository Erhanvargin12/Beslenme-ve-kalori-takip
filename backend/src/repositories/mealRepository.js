const { db, COLLECTIONS } = require('../config/firebase');
const { runQueryWithFallback } = require('../utils/firestoreFallback');

class MealRepository {
  async addMeal(userId, mealData) {
    try {
      const docRef = await db.collection(COLLECTIONS.MEALS).add({
        userId,
        ...mealData,
        createdAt: new Date(),
        timestamp: new Date().toISOString()
      });
      return { id: docRef.id, ...mealData };
    } catch (error) {
      console.error('Meal eklerken hata:', error);
      throw error;
    }
  }

  async getByUserId(userId) {
    try {
      const meals = await runQueryWithFallback({
        collectionName: COLLECTIONS.MEALS,
        runIndexedQuery: async () => {
          const snapshot = await db
            .collection(COLLECTIONS.MEALS)
            .where('userId', '==', userId)
            .get();
          return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        },
        filter: (d) => d.userId === userId,
        sort: (a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')),
      });
      return meals;
    } catch (error) {
      console.error('Meal verilerini çekerken hata:', error);
      return [];
    }
  }

  async getDailyTotal(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      
      const meals = await runQueryWithFallback({
        collectionName: COLLECTIONS.MEALS,
        runIndexedQuery: async () => {
          const snapshot = await db
            .collection(COLLECTIONS.MEALS)
            .where('userId', '==', userId)
            .get();
          return snapshot.docs.map((doc) => doc.data());
        },
        filter: (m) => m.userId === userId,
      });

      const dailyMeals = meals.filter((m) => m.timestamp >= todayIso);
      
      const totalCalories = dailyMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const totalProtein = dailyMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
      const totalCarbs = dailyMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
      const totalFat = dailyMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
      
      return {
        totalCalories: Number(totalCalories.toFixed(1)),
        protein: Number(totalProtein.toFixed(1)),
        carbs: Number(totalCarbs.toFixed(1)),
        fat: Number(totalFat.toFixed(1)),
        count: dailyMeals.length
      };
    } catch (error) {
      console.error('Günlük toplam hesaplanırken hata:', error);
      return { totalCalories: 0, count: 0 };
    }
  }
  async getWeeklySummary(userId) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const sevenDaysAgoIso = sevenDaysAgo.toISOString();

      const meals = await runQueryWithFallback({
        collectionName: COLLECTIONS.MEALS,
        runIndexedQuery: async () => {
          const snapshot = await db
            .collection(COLLECTIONS.MEALS)
            .where('userId', '==', userId)
            .get();
          return snapshot.docs.map((doc) => doc.data());
        },
        filter: (m) => m.userId === userId,
      });

      const weeklyMeals = meals.filter((m) => m.timestamp >= sevenDaysAgoIso);

      if (weeklyMeals.length === 0) {
        return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, count: 0 };
      }

      const totalCalories = weeklyMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const totalProtein = weeklyMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
      const totalCarbs = weeklyMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
      const totalFat = weeklyMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

      return {
        avgCalories: Number((totalCalories / 7).toFixed(1)),
        avgProtein: Number((totalProtein / 7).toFixed(1)),
        avgCarbs: Number((totalCarbs / 7).toFixed(1)),
        avgFat: Number((totalFat / 7).toFixed(1)),
        count: weeklyMeals.length
      };
    } catch (error) {
      console.error('Haftalık özet hesaplanırken hata:', error);
      return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, count: 0 };
    }
  }
}

module.exports = new MealRepository();
