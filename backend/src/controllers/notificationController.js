const notificationService = require('../services/notificationService');

class NotificationController {
  async sendDirectMessage(req, res) {
    try {
      const { userId, message, content } = req.body;
      const text = (message || content || '').trim();

      if (!userId || !text) {
        return res.status(400).json({ error: 'Kullanıcı ID ve mesaj içeriği gereklidir.' });
      }

      const result = await notificationService.sendDirectMessage(userId, text);
      res.json({ message: 'Mesaj başarıyla gönderildi.', data: result });
    } catch (error) {
      console.error('sendDirectMessage hatası:', error);
      res.status(500).json({ error: 'Mesaj gönderilirken sunucu hatası oluştu.' });
    }
  }

  async getUserMessages(req, res) {
    try {
      const { userId } = req.params;
      const messages = await notificationService.getUserMessages(userId);
      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('getUserMessages hatası:', error);
      res.status(500).json({ error: 'Mesajlar alınırken sunucu hatası oluştu.' });
    }
  }

  async markAsRead(req, res) {
    try {
      const { messageId } = req.params;
      await notificationService.markAsRead(messageId);
      res.json({ success: true, message: 'Mesaj okundu olarak işaretlendi.' });
    } catch (error) {
      console.error('markAsRead hatası:', error);
      res.status(500).json({ error: 'İşlem sırasında hata oluştu.' });
    }
  }
}

module.exports = new NotificationController();
