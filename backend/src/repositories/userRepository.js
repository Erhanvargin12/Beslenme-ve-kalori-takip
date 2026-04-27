const { db, COLLECTIONS } = require('../config/firebase');

class UserRepository {
  async getAll() {
    try {
      const snapshot = await db.collection(COLLECTIONS.USERS)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Firestore verileri çekerken hata:', error);
      return [];
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
}

module.exports = new UserRepository();
