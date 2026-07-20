const admin = require('firebase-admin');
const path = require('path');

// Anahtar dosyasının yolu
const serviceAccount = require(path.join(__dirname, '../../../serviceAccountKey.json'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const db = admin.firestore();
  
  // Test connection
  db.listCollections()
    .then(() => {
      console.log('Firestore bağlantısı başarılı');
    })
    .catch((error) => {
      console.error('Firestore Bağlantı Hatası:', error);
    });

  const COLLECTIONS = {
    USERS: 'users',
    ANALYSES: 'analyses',
    MEALS: 'meals',
    WEEKLY_PLANS: 'weeklyPlans',
    WATER_LOGS: 'water_logs',
    ADMIN_SETTINGS: 'admin_settings',
    SYSTEM_ERRORS: 'system_errors',
    USAGE_STATS: 'usage_stats',
    USER_USAGE_LOGS: 'user_usage_logs',
    NOTIFICATIONS: 'notifications'
  };

  module.exports = { admin, db, COLLECTIONS };
} catch (error) {
  console.error('Firebase Admin SDK Başlatma Hatası:', error);
  process.exit(1);
}
