const mealRepository = require('../repositories/mealRepository');
const userRepository = require('../repositories/userRepository');
const { db, COLLECTIONS } = require('../config/firebase');
const { runQueryWithFallback } = require('../utils/firestoreFallback');

class ReportService {
  async getFullHistoryData(authId) {
    try {
      console.log(`[Rapor Servisi] ${authId} için tam geçmiş verisi toplanıyor...`);

      // 1. Kullanıcı Profili ve Kilo Geçmişi
      const profileHistory = await userRepository.getByAuthId(authId);
      if (!profileHistory || profileHistory.length === 0) {
        return null; // Veri yok
      }

      const firstProfile = profileHistory[profileHistory.length - 1];
      const latestProfile = profileHistory[0];
      const weightChange = latestProfile.kilo - firstProfile.kilo;
      const startDate = firstProfile.createdAt ? new Date(firstProfile.createdAt) : new Date();

      // 2. Tüm Öğün Kayıtları
      const allMeals = await mealRepository.getByUserId(authId);
      
      // 3. Kullanım İstatistikleri (Toplam Fotoğraf Sayısı)
      const usageRows = await runQueryWithFallback({
        collectionName: COLLECTIONS.USAGE_STATS,
        runIndexedQuery: async () => {
          const usageSnapshot = await db
            .collection(COLLECTIONS.USAGE_STATS)
            .where('userId', '==', authId)
            .where('type', '==', 'photo_analysis')
            .get();
          return usageSnapshot.docs.map((doc) => doc.data());
        },
        filter: (row) => row.userId === authId && row.type === 'photo_analysis',
      });
      const totalPhotos = usageRows.length;

      // 4. Verileri Gruplandırma (Eğer çok fazlaysa)
      // Burada günlük ortalamaları hesaplayıp trend çıkarmak daha mantıklı
      const dailyTrends = this.calculateDailyTrends(allMeals);

      return {
        user: {
          isim: latestProfile.isim,
          currentWeight: latestProfile.kilo,
          startWeight: firstProfile.kilo,
          weightChange: Number(weightChange.toFixed(1)),
          vki: latestProfile.vki,
          durum: latestProfile.durum,
          joinDate: firstProfile.createdAt
        },
        stats: {
          totalMeals: allMeals.length,
          totalPhotos,
          totalDays: Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24))
        },
        trends: dailyTrends,
        rawMeals: allMeals.length > 100 ? allMeals.slice(0, 100) : allMeals // Ham veriyi sınırlı tutalım
      };
    } catch (error) {
      console.error('getFullHistoryData hatasi:', error);
      throw error;
    }
  }

  calculateDailyTrends(meals) {
    const trends = {};
    
    meals.forEach(meal => {
      if (!meal.timestamp) return;
      const dateKey = meal.timestamp.split('T')[0];
      
      if (!trends[dateKey]) {
        trends[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      }
      
      trends[dateKey].calories += (meal.calories || 0);
      trends[dateKey].protein += (meal.protein || 0);
      trends[dateKey].carbs += (meal.carbs || 0);
      trends[dateKey].fat += (meal.fat || 0);
      trends[dateKey].count += 1;
    });

    // Array formatına çevir ve tarihe göre sırala
    return Object.keys(trends).map(date => ({
      date,
      ...trends[date]
    })).sort((a, b) => a.date.localeCompare(b.date));
  }
}

module.exports = new ReportService();
