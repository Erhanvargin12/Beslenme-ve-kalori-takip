const userService = require('../services/userService');

class UserController {
  async register(req, res) {
    try {
      const { isim, boy, kilo } = req.body;
      if (!isim || !boy || !kilo) {
        return res.status(400).send("Lütfen bilgileri eksiksiz doldurun.");
      }
      
      const user = await userService.registerUser({ isim, boy, kilo });
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
      res.status(500).send("Kullanıcılar listelenirken bir hata oluştu.");
    }
  }
}

module.exports = new UserController();
