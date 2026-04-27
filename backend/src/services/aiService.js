const { genAI, MODEL_NAMES } = require('../config/aiConfig');

class AiService {
  async analyzeFoodImage(base64Image, mimeType = "image/jpeg") {
    let modelIndex = 0;
    let lastError = null;

    while (modelIndex < MODEL_NAMES.length) {
      const currentModelName = MODEL_NAMES[modelIndex];
      const model = genAI.getGenerativeModel({ model: currentModelName });
      
      try {
        const prompt = "Bu fotoğraftaki yemeğin adını, tahmini gramajını ve toplam kalorisini kısa bir metin olarak söyle. Protein, yağ ve karbonhidrat değerlerini '%' işareti ile belirt. Yanıtın başında yemeğin adını kalın (**...**) yaz.";
        
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Image, mimeType: mimeType } }
        ]);

        const response = await result.response;
        return response.text();

      } catch (error) {
        lastError = error;
        console.error(`AI Service Error (${currentModelName}):`, error.message);
        
        if (error.message.includes("429")) {
          modelIndex++;
          continue;
        }
        break;
      }
    }

    return this.getFallbackResponse();
  }

  getFallbackResponse() {
    const mockResponses = [
      "Analiz edilen yemek: **Karışık Ev Yemeği Seansı**\n\nTahmini Gramaj: 250g\nToplam Kalori: 380 kcal\n\nMakrolar:\n- Protein: %25\n- Karbonhidrat: %45\n- Yağ: %30\n\n*Not: API bağlantı sınırı nedeniyle şu an simüle edilmiş veriler gösterilmektedir.*",
      "Analiz edilen yemek: **Sağlıklı Protein Tabağı**\n\nTahmini Gramaj: 300g\nToplam Kalori: 450 kcal\n\nMakrolar:\n- Protein: %40\n- Karbonhidrat: %30\n- Yağ: %30\n\n*Not: Şu an sistem yoğunluğu nedeniyle tahmini değerler gösterilmektedir.*"
    ];
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }
  async generateWeeklyReportAdvice(userData) {
    const { isim, vki, durum, sonYemekler } = userData;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const prompt = `Adım ${isim}. Vücut Kitle Endeksim ${vki} (${durum}). Son zamanlarda şu yemekleri yedim: ${sonYemekler}. 
      Lütfen bana bu verilere dayanarak kısa, samimi ve motive edici bir haftalık beslenme tavsiyesi ver. 
      Yanıt 3-4 cümleyi geçmesin ve doğrudan bana hitap et.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Advice Error:", error);
      return "Harika gidiyorsun! Beslenmende çeşitliliğe önem vererek hedeflerine ulaşabilirsin. Bir sonraki hafta lifli gıdaları biraz daha artırmayı deneyebilirsin.";
    }
  }
}

module.exports = new AiService();
