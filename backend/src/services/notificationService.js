const nodemailer = require('nodemailer');
const { db, COLLECTIONS } = require('../config/firebase');
const { runQueryWithFallback } = require('../utils/firestoreFallback');

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
}

class NotificationService {
  constructor() {
    // Throttling: Aynı hata türü için 30 dakika (1800000 ms)
    this.throttleTime = 30 * 60 * 1000;
    this.lastSent = {};

    // Nodemailer Transporter Yapılandırması
    // Not: Gerçek şifrenizi asla buraya yazmayın, .env kullanın.
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'erhanvargin6@gmail.com', // Gönderici
        pass: process.env.EMAIL_PASS || 'xxxx xxxx xxxx xxxx' // Gmail Uygulama Şifresi
      }
    });
  }

  /**
   * Merkezi Hata Bildirim Servisi
   * @param {string} errorType - Hata türü (AI_ERROR, DB_ERROR, SERVER_ERROR, MEMORY_CRITICAL)
   * @param {object} details - Hata detayları
   */
  async notifyError(errorType, details) {
    const now = Date.now();

    // Throttling Kontrolü
    if (this.lastSent[errorType] && (now - this.lastSent[errorType] < this.throttleTime)) {
      console.log(`[Notification] ${errorType} bildirimi susturuldu (Throttle aktif).`);
      return;
    }

    try {
      // 1. Yönetici E-postasını Al
      const configDoc = await db.collection(COLLECTIONS.ADMIN_SETTINGS).doc('config').get();
      const adminEmail = configDoc.exists ? configDoc.data().adminEmail : 'erhanvargin6@gmail.com';

      // 2. Mail Gönder
      const mailOptions = {
        from: '"Akıllı Beslenme Sistemi" <erhanvargin6@gmail.com>',
        to: adminEmail,
        subject: `⚠️ SİSTEM UYARISI: ${errorType}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #d32f2f;">Kritik Sistem Hatası Tespit Edildi</h2>
            <p><strong>Hata Türü:</strong> ${errorType}</p>
            <p><strong>Zaman:</strong> ${new Date().toLocaleString('tr-TR')}</p>
            <hr />
            <p><strong>Detaylar:</strong></p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${JSON.stringify(details, null, 2)}</pre>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Bu bildirim son 30 dakika içinde ${errorType} türünde gönderilen ilk maildir. 
              Sistem düzelene kadar benzer hatalar için tekrar mail gönderilmeyecektir.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      this.lastSent[errorType] = now;
      console.log(`[Notification] ${errorType} maili gönderildi: ${adminEmail}`);

      // 3. Firestore'a Log Kaydet
      await db.collection(COLLECTIONS.SYSTEM_ERRORS).add({
        type: errorType,
        details,
        timestamp: new Date(),
        recipient: adminEmail
      });

    } catch (error) {
      console.error('[Notification] Bildirim gönderilirken hata oluştu:', error.message);
    }
  }

  /**
   * Yönetici tarafından kullanıcıya doğrudan mesaj gönderir
   */
  async _canonicalUserId(userId) {
    const ids = await this._resolveMessageUserIds(userId);
    try {
      const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      if (doc.exists && doc.data().authId) {
        return String(doc.data().authId);
      }
      const byAuth = await db
        .collection(COLLECTIONS.USERS)
        .where('authId', '==', userId)
        .limit(1)
        .get();
      if (!byAuth.empty && byAuth.docs[0].data().authId) {
        return String(byAuth.docs[0].data().authId);
      }
    } catch (e) {
      console.warn('[Notification] canonical userId:', e.message);
    }
    return String([...ids][0] || userId);
  }

  async sendDirectMessage(userId, message) {
    try {
      const targetUserId = await this._canonicalUserId(userId);
      const notification = {
        userId: targetUserId,
        title: 'Uzman Tavsiyesi',
        content: message, // Prompt: title, content, createdAt ve isRead
        type: 'admin_message',
        isRead: false,
        createdAt: new Date().toISOString(),
        timestamp: new Date()
      };

      const docRef = await db.collection(COLLECTIONS.NOTIFICATIONS).add(notification);
      console.log(`[Notification] Kullanıcıya (${targetUserId}) direkt mesaj kaydedildi: ${docRef.id}`);
      return { id: docRef.id, ...notification };
    } catch (error) {
      console.error('[Notification] Direkt mesaj kaydı hatası:', error);
      throw error;
    }
  }

  async _resolveMessageUserIds(userId) {
    const ids = new Set([String(userId)]);
    try {
      const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.authId) ids.add(String(data.authId));
      }
      const byAuth = await db
        .collection(COLLECTIONS.USERS)
        .where('authId', '==', userId)
        .limit(1)
        .get();
      if (!byAuth.empty) {
        ids.add(byAuth.docs[0].id);
        if (byAuth.docs[0].data().authId) ids.add(String(byAuth.docs[0].data().authId));
      }
    } catch (e) {
      console.warn('[Notification] userId çözümleme:', e.message);
    }
    return ids;
  }

  async getUserMessages(userId) {
    try {
      const acceptedIds = await this._resolveMessageUserIds(userId);
      const byDocId = new Map();

      const mergeSnapshot = (snapshot) => {
        snapshot.docs.forEach((doc) => {
          byDocId.set(doc.id, { id: doc.id, ...doc.data() });
        });
      };

      try {
        for (const id of acceptedIds) {
          const snapshot = await db
            .collection(COLLECTIONS.NOTIFICATIONS)
            .where('userId', '==', id)
            .get();
          mergeSnapshot(snapshot);
        }
      } catch (queryError) {
        const messages = await runQueryWithFallback({
          collectionName: COLLECTIONS.NOTIFICATIONS,
          runIndexedQuery: async () => {
            throw queryError;
          },
          filter: (d) => acceptedIds.has(String(d.userId)),
          sort: (a, b) => {
            const tA = toDate(a.timestamp) || new Date(a.createdAt || 0);
            const tB = toDate(b.timestamp) || new Date(b.createdAt || 0);
            return tB - tA;
          },
        });
        return messages.map((m) => ({
          ...m,
          title: m.title || 'Uzman Tavsiyesi',
          content: m.content || m.message || '',
        }));
      }

      const messages = [...byDocId.values()].sort((a, b) => {
        const tA = toDate(a.timestamp) || new Date(a.createdAt || 0);
        const tB = toDate(b.timestamp) || new Date(b.createdAt || 0);
        return tB - tA;
      });

      return messages.map((m) => ({
        ...m,
        title: m.title || 'Uzman Tavsiyesi',
        content: m.content || m.message || '',
      }));
    } catch (error) {
      console.error('[Notification] Mesajları getirme hatası:', error);
      throw error;
    }
  }

  async markAsRead(messageId) {
    try {
      await db.collection(COLLECTIONS.NOTIFICATIONS).doc(messageId).update({
        isRead: true
      });
    } catch (error) {
      console.error('[Notification] Mesaj okundu işaretleme hatası:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
