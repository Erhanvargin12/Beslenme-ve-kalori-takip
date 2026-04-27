const aiService = require('../services/aiService');

class AiController {
  async analyze(req, res) {
    try {
      const { gorselBase64, mimeType } = req.body;
      if (!gorselBase64) {
        return res.status(400).send("Analiz için bir fotoğraf gönderilmedi.");
      }
      
      const result = await aiService.analyzeFoodImage(gorselBase64, mimeType);
      res.send(result);
    } catch (error) {
      res.status(500).send("Analiz sırasında bir hata oluştu.");
    }
  }

  async getAdvice(req, res) {
    try {
      const userData = req.body;
      const advice = await aiService.generateWeeklyReportAdvice(userData);
      res.send(advice);
    } catch (error) {
      res.status(500).send("Tavsiye alınırken bir hata oluştu.");
    }
  }
}

module.exports = new AiController();
