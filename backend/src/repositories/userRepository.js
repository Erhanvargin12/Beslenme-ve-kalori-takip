const { db, COLLECTIONS } = require('../config/firebase');
const { runQueryWithFallback } = require('../utils/firestoreFallback');

class UserRepository {
  async getAll() {
    try {
      return await runQueryWithFallback({
        collectionName: COLLECTIONS.USERS,
        runIndexedQuery: async () => {
          const snapshot = await db
            .collection(COLLECTIONS.USERS)
            .orderBy('createdAt', 'desc')
            .get();
          return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        },
        sort: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      });
    } catch (error) {
      console.error('Firestore verileri çekerken hata:', error);
      const msg = String(error?.message || error);
      if (error?.code === 8 || msg.toLowerCase().includes('quota')) {
        const quotaErr = new Error(
          'Firestore okuma kotası aşıldı. Kayıtlar silinmedi; Firebase kullanım limiti dolmuş olabilir.'
        );
        quotaErr.code = 'FIRESTORE_QUOTA';
        throw quotaErr;
      }
      throw error;
    }
  }

  async getByAuthId(authId) {
    try {
      return await runQueryWithFallback({
        collectionName: COLLECTIONS.USERS,
        runIndexedQuery: async () => {
          const snapshot = await db
            .collection(COLLECTIONS.USERS)
            .where('authId', '==', authId)
            .get();
          return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        },
        filter: (d) => d.authId === authId,
        sort: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      });
    } catch (error) {
      console.error('Kullanıcı geçmişi çekerken hata:', error);
      return [];
    }
  }

  async getById(id) {
    try {
      const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Kullanıcı getirirken hata:', error);
      return null;
    }
  }

  async update(id, updates) {
    try {
      await db.collection(COLLECTIONS.USERS).doc(id).update({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Kullanıcı güncellerken hata:', error);
      throw error;
    }
  }

  async add(user) {
    try {
      const docRef = await db.collection(COLLECTIONS.USERS).add({
        ...user,
        createdAt: user.createdAt || new Date().toISOString()
      });
      
      return { id: docRef.id, ...user };
    } catch (error) {
      console.error('Firestore veri eklerken hata:', error);
      throw error;
    }
  }
  async deactivate(id) {
    try {
      await db.collection(COLLECTIONS.USERS).doc(id).update({
        status: 'pasif',
        deactivatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Kullanıcı pasife alınırken hata:', error);
      throw error;
    }
  }

  async resetData(authId) {
    try {
      const mealDocs = await runQueryWithFallback({
        collectionName: COLLECTIONS.MEALS,
        runIndexedQuery: async () => {
          const snapshot = await db
            .collection(COLLECTIONS.MEALS)
            .where('userId', '==', authId)
            .get();
          return snapshot.docs.map((doc) => ({ id: doc.id, ref: doc.ref }));
        },
        filter: (d) => d.userId === authId,
      });

      const waterDocs = await runQueryWithFallback({
        collectionName: COLLECTIONS.WATER_LOGS,
        runIndexedQuery: async () => {
          const snapshot = await db
            .collection(COLLECTIONS.WATER_LOGS)
            .where('userId', '==', authId)
            .get();
          return snapshot.docs.map((doc) => ({ id: doc.id, ref: doc.ref }));
        },
        filter: (d) => d.userId === authId,
      });

      const batch = db.batch();
      for (const item of mealDocs) {
        const ref = item.ref || db.collection(COLLECTIONS.MEALS).doc(item.id);
        batch.delete(ref);
      }
      for (const item of waterDocs) {
        const ref = item.ref || db.collection(COLLECTIONS.WATER_LOGS).doc(item.id);
        batch.delete(ref);
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Kullanıcı verileri sıfırlanırken hata:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository();
