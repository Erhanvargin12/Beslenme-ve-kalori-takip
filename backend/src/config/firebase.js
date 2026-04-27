const admin = require('firebase-admin');
const path = require('path');

// Anahtar dosyasının yolu
const serviceAccount = require(path.join(__dirname, '../../../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Koleksiyon isimleri
const COLLECTIONS = {
  USERS: 'users',
  ANALYSES: 'analyses'
};

console.log('✅ Firebase Admin SDK Başlatıldı');

module.exports = { admin, db, COLLECTIONS };
