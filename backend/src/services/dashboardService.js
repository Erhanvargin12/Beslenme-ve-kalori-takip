const { db, COLLECTIONS } = require('../config/firebase');
const { runQueryWithFallback } = require('../utils/firestoreFallback');

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
}

class DashboardService {
  // 1. Günlük Çekilen Fotoğraf Sayısı
  async getDailyPhotoCount(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const snapshot = await db.collection(COLLECTIONS.USAGE_STATS)
        .where('type', '==', 'photo_analysis')
        .get();
        
      let count = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          if (date >= today) {
            if (!userId || data.userId === userId) {
              count++;
            }
          }
        }
      });
      
      return count;
    } catch (error) {
      console.error('getDailyPhotoCount hatasi:', error);
      return 0;
    }
  }

  // 2. Son 7 Günlük Kalori Alımı
  async getWeeklyCalories(userId) {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const meals = await runQueryWithFallback({
        collectionName: COLLECTIONS.MEALS,
        runIndexedQuery: async () => {
          let query = db.collection(COLLECTIONS.MEALS);
          if (userId) {
            query = query.where('userId', '==', userId);
          } else {
            query = query.where('createdAt', '>=', sevenDaysAgo);
          }
          const snapshot = await query.get();
          return snapshot.docs.map((doc) => doc.data());
        },
        filter: (data) => {
          const date = toDate(data.createdAt) || (data.timestamp ? new Date(data.timestamp) : null);
          const isDateValid = date && date >= sevenDaysAgo;
          if (userId) {
            return isDateValid && data.userId === userId;
          }
          return isDateValid;
        },
      });

      const daysInTurkish = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      const result = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayStr = daysInTurkish[d.getDay()];
        result.push({ day: dayStr, calories: 0 });
      }

      let totalProtein = 0, totalCarbs = 0, totalFat = 0;

      meals.forEach((data) => {
        if ((data.createdAt || data.timestamp) && data.calories) {
          const date =
            toDate(data.createdAt) || (data.timestamp ? new Date(data.timestamp) : null);
          if (!date) return;

          const dayStr = daysInTurkish[date.getDay()];
          const resultItem = result.find((r) => r.day === dayStr);
          if (resultItem) {
            resultItem.calories += data.calories;
          }

          if (userId) {
            totalProtein += data.protein || 0;
            totalCarbs += data.carbs || 0;
            totalFat += data.fat || 0;
          }
        }
      });

      return {
        result,
        macroDistribution: {
          protein: Math.round(totalProtein),
          carbs: Math.round(totalCarbs),
          fat: Math.round(totalFat)
        }
      };
    } catch (error) {
      console.error('getWeeklyCalories hatasi:', error);
      return { result: [], macroDistribution: { protein: 0, carbs: 0, fat: 0 } };
    }
  }

  // 3. Aktif Kullanım Süresi (Bugünkü Toplam Saniye/Dakika)
  async getActiveUsageStats(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const logs = await runQueryWithFallback({
        collectionName: COLLECTIONS.USER_USAGE_LOGS,
        runIndexedQuery: async () => {
          let query = db.collection(COLLECTIONS.USER_USAGE_LOGS);
          if (userId) {
            query = query.where('userId', '==', userId);
          } else {
            query = query.where('createdAt', '>=', today);
          }
          const snapshot = await query.get();
          return snapshot.docs.map((doc) => doc.data());
        },
        filter: (data) => {
          const date = toDate(data.createdAt);
          const isDateValid = date && date >= today;
          if (userId) return isDateValid && data.userId === userId;
          return isDateValid;
        },
      });

      let totalDurationSeconds = 0;
      logs.forEach((data) => {
        if (data.durationSeconds) {
          totalDurationSeconds += Number(data.durationSeconds);
        }
      });

      // Varsayılan saat hesaplaması (eğer veri yoksa)
      if (totalDurationSeconds === 0) {
        return {
          totalDurationMinutes: 0,
          label: "0 dk",
          percentageChange: 0
        };
      }

      const totalMinutes = Math.round(totalDurationSeconds / 60);
      
      return {
        totalDurationMinutes: totalMinutes,
        label: totalMinutes > 60 ? `${(totalMinutes / 60).toFixed(1)} saat` : `${totalMinutes} dk`,
        percentageChange: 5 // Örnek artış oranı
      };
    } catch (error) {
      console.error('getActiveUsageStats hatasi:', error);
      return { totalDurationMinutes: 0, label: "0 dk", percentageChange: 0 };
    }
  }

  async getDashboardStats(userId) {
    const [dailyPhotoCount, weeklyData, activeUserStats, collectionStats] = await Promise.all([
      this.getDailyPhotoCount(userId),
      this.getWeeklyCalories(userId),
      this.getActiveUsageStats(userId),
      this.getCollectionStats()
    ]);

    let avgVki = 0;
    let totalUsers = 0;
    let vkiDistribution = { zayif: 0, normal: 0, kilolu: 0, obez: 0 };
    let macroDistribution = weeklyData.macroDistribution || { protein: 0, carbs: 0, fat: 0 };

    if (userId) {
      const userHistory = await require('../repositories/userRepository').getByAuthId(userId);
      if (userHistory && userHistory.length > 0) {
         avgVki = userHistory[0].vki || 0;
      }
      
      const userMeals = await require('../repositories/mealRepository').getByUserId(userId);
      totalUsers = userMeals.length;
    } else {
      totalUsers = collectionStats[COLLECTIONS.USERS] || 0;
      try {
        const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
        let totalVki = 0;
        let userCountWithVki = 0;

        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.vki) {
            const vki = Number(userData.vki);
            totalVki += vki;
            userCountWithVki++;

            if (vki < 18.5) vkiDistribution.zayif++;
            else if (vki < 25) vkiDistribution.normal++;
            else if (vki < 30) vkiDistribution.kilolu++;
            else vkiDistribution.obez++;
          }
        });

        if (userCountWithVki > 0) {
          avgVki = Number((totalVki / userCountWithVki).toFixed(1));
        }
      } catch (error) {
        console.error('VKİ istatistikleri hesaplanırken hata:', error);
      }
    }

    return {
      dailyPhotoCount,
      weeklyCalories: weeklyData.result || weeklyData,
      activeUserRate: activeUserStats.label,
      activeUserRateChange: activeUserStats.percentageChange,
      totalUsers,
      avgVki,
      vkiDistribution,
      macroDistribution
    };
  }

  async getCollectionStats() {
    try {
      const collections = Object.values(COLLECTIONS);
      const stats = {};
      
      const promises = collections.map(async (coll) => {
        const snapshot = await db.collection(coll).count().get();
        stats[coll] = snapshot.data().count;
      });

      await Promise.all(promises);
      return stats;
    } catch (error) {
      console.error('getCollectionStats hatasi:', error);
      return {};
    }
  }
}

module.exports = new DashboardService();
