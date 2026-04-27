const admin = require('firebase-admin');

class AuthService {
  async register(email, password, displayName) {
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
      });
      return userRecord;
    } catch (error) {
      console.error('Firebase Auth Register Error:', error);
      throw error;
    }
  }

  async login(email, password) {
    // Not: Firebase Admin SDK doğrudan şifre doğrulaması yapmaz (güvenlik gereği).
    // Şifre doğrulaması Client tarafında (Mobil/Web) yapılır ve sunucuya bir ID Token gönderilir.
    // Sunucu bu token'ı doğrular.
    // Şimdilik basitlik için bir placeholder bırakıyoruz.
  }

  async verifyToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Firebase Token Verification Error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
