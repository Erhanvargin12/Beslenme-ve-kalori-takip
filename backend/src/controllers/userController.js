const userService = require('../services/userService');

class UserController {
  async register(req, res) {
    try {
      const { isim, boy, kilo, authId } = req.body;
      if (!isim || !boy || !kilo) {
        return res.status(400).send("Lütfen bilgileri eksiksiz doldurun.");
      }
      
      const user = await userService.registerUser({ isim, boy, kilo, authId });
      res.send(`Merhaba ${user.isim}, VKİ değerin: ${user.vki}. Durumun: ${user.durum}`);
    } catch (error) {
      res.status(500).send("Kayıt işlemi sırasında bir hata oluştu.");
    }
  }

  async list(req, res) {
    try {
      const users = await userService.getAllUsers();
      console.log(`📡 API: ${users.length} kullanıcı verisi gönderildi.`);
      res.json(users);
    } catch (error) {
      if (error?.code === 'FIRESTORE_QUOTA') {
        return res.status(503).json({
          error: error.message,
          code: 'FIRESTORE_QUOTA',
        });
      }
      res.status(500).json({ error: 'Kullanıcılar listelenirken bir hata oluştu.' });
    }
  }

  async getUserHistory(req, res) {
    try {
      const { authId } = req.params;
      const users = await userService.getUserHistory(authId);
      res.json(users);
    } catch (error) {
      res.status(500).send("Geçmiş veriler alınamadı.");
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      res.json(user);
    } catch (error) {
      res.status(500).send("Kullanıcı verisi alınamadı.");
    }
  }

  async update(req, res) {
    try {
      const { userId } = req.params;
      const { boy, kilo } = req.body;
      const updatedUser = await userService.updateUser(userId, { boy, kilo });
      res.json({ message: 'Kullanıcı güncellendi', user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: 'Güncelleme sırasında hata oluştu.' });
    }
  }

  async addBodyAnalysis(req, res) {
    try {
      const { authId, kilo } = req.body;
      if (!authId || !kilo) {
        return res.status(400).json({ error: "Eksik bilgi gönderildi." });
      }
      const newAnalysis = await userService.addBodyAnalysis(authId, kilo);
      res.json({ message: 'Vücut analizi güncellendi', user: newAnalysis });
    } catch (error) {
      res.status(500).json({ error: 'Vücut analizi kaydedilirken hata oluştu.' });
    }
  }

  async deactivate(req, res) {
    try {
      const { userId } = req.params;
      await userService.deactivateUser(userId);
      res.json({ message: 'Kullanıcı başarıyla pasife alındı.' });
    } catch (error) {
      res.status(500).json({ error: 'Pasife alma sırasında hata oluştu.' });
    }
  }

  async resetData(req, res) {
    try {
      const { authId } = req.params;
      await userService.resetUserData(authId);
      res.json({ message: 'Kullanıcı verileri başarıyla sıfırlandı.' });
    } catch (error) {
      res.status(500).json({ error: 'Veri sıfırlama sırasında hata oluştu.' });
    }
  }
}

module.exports = new UserController();
