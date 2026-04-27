const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    const { email, password, isim } = req.body;
    
    if (!email || !password || !isim) {
      return res.status(400).json({ error: 'E-posta, şifre ve isim alanları zorunludur.' });
    }

    try {
      const user = await authService.register(email, password, isim);
      res.status(201).json({ 
        message: 'Kullanıcı başarıyla oluşturuldu.',
        uid: user.uid 
      });
    } catch (error) {
      res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu: ' + error.message });
    }
  }

  async verify(req, res) {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Token gereklidir.' });
    }

    try {
      const decodedToken = await authService.verifyToken(idToken);
      res.json({ uid: decodedToken.uid, email: decodedToken.email });
    } catch (error) {
      res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
  }
}

module.exports = new AuthController();
