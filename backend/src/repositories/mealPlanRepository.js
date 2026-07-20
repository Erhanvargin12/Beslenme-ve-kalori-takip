const { db } = require('../config/firebase');
const { runQueryWithFallback } = require('../utils/firestoreFallback');

const WEEKLY_PLANS = 'weeklyPlans';
const WATER_LOGS = 'water_logs';

class MealPlanRepository {

  async getWeeklyPlan(userId, weekStart) {
    return runQueryWithFallback({
      collectionName: WEEKLY_PLANS,
      runIndexedQuery: async () => {
        const snapshot = await db
          .collection(WEEKLY_PLANS)
          .where('userId', '==', userId)
          .where('weekStart', '==', weekStart)
          .orderBy('dayIndex', 'asc')
          .get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      },
      filter: (d) => d.userId === userId && d.weekStart === weekStart,
      sort: (a, b) => (a.dayIndex ?? 0) - (b.dayIndex ?? 0),
    });
  }

  async addMealToPlan(mealPlanData) {
    try {
      const docRef = await db.collection(WEEKLY_PLANS).add({
        ...mealPlanData,
        createdAt: new Date().toISOString(),
      });
      return { id: docRef.id, ...mealPlanData };
    } catch (error) {
      console.error('Öğün plana eklenirken hata:', error);
      throw error;
    }
  }

  async saveWeeklyPlanBatch(userId, weekStart, planArray) {
    const batch = db.batch();
    const results = [];

    for (const item of planArray) {
      const docRef = db.collection(WEEKLY_PLANS).doc();
      const data = {
        userId,
        weekStart,
        dayIndex: item.dayIndex,
        dayName: item.dayName,
        meal: item.meal,
        type: item.type,
        calories: item.calories,
        source: 'ai',
        createdAt: new Date().toISOString(),
      };
      batch.set(docRef, data);
      results.push({ id: docRef.id, ...data });
    }

    await batch.commit();
    console.log(`✅ ${results.length} öğün Firestore'a toplu kaydedildi.`);
    return results;
  }

  async deleteMealFromPlan(docId) {
    try {
      await db.collection(WEEKLY_PLANS).doc(docId).delete();
      return true;
    } catch (error) {
      console.error('Öğün silinirken hata:', error);
      throw error;
    }
  }

  async clearWeeklyPlan(userId, weekStart) {
    const docs = await runQueryWithFallback({
      collectionName: WEEKLY_PLANS,
      runIndexedQuery: async () => {
        const snapshot = await db
          .collection(WEEKLY_PLANS)
          .where('userId', '==', userId)
          .where('weekStart', '==', weekStart)
          .get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ref: doc.ref }));
      },
      filter: (d) => d.userId === userId && d.weekStart === weekStart,
    });

    const batch = db.batch();
    for (const item of docs) {
      const ref = item.ref || db.collection(WEEKLY_PLANS).doc(item.id);
      batch.delete(ref);
    }
    await batch.commit();
    console.log(`🗑️ ${docs.length} öğün silindi (${weekStart}).`);
    return docs.length;
  }

  async getWaterLog(userId, date) {
    const matches = await runQueryWithFallback({
      collectionName: WATER_LOGS,
      runIndexedQuery: async () => {
        const snapshot = await db
          .collection(WATER_LOGS)
          .where('userId', '==', userId)
          .where('date', '==', date)
          .limit(1)
          .get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      },
      filter: (d) => d.userId === userId && d.date === date,
    });

    if (!matches.length) return null;
    return matches[0];
  }

  async updateWaterLog(userId, date, glasses) {
    try {
      const existing = await this.getWaterLog(userId, date);

      if (existing) {
        await db.collection(WATER_LOGS).doc(existing.id).update({
          glasses,
          updatedAt: new Date().toISOString(),
        });
        return { id: existing.id, userId, date, glasses };
      }

      const docRef = await db.collection(WATER_LOGS).add({
        userId,
        date,
        glasses,
        createdAt: new Date().toISOString(),
      });
      return { id: docRef.id, userId, date, glasses };
    } catch (error) {
      console.error('Su kaydı güncellenirken hata:', error);
      throw error;
    }
  }
}

module.exports = new MealPlanRepository();
