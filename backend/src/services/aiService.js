const { getModel, MODEL_NAME, getApiKey } = require('../config/aiConfig');
const notificationService = require('./notificationService');
const {
  MOCK_STRUCTURED_ANALYSIS,
  MOCK_TEXT_ANALYSIS,
  getMockWeeklyPlan,
} = require('../utils/aiMockData');

function cleanBase64(base64Str) {
  return base64Str.replace(/^data:.*;base64,/, '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonResponse(text) {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("JSON Parse Error on:", text);
    throw e;
  }
}

function isQuotaOrApiError(error) {
  const message = (error?.message || String(error)).toLowerCase();
  const status = error?.status || error?.statusCode;
  return (
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('rate limit') ||
    message.includes('503') ||
    message.includes('unavailable') ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    status === 429 ||
    status === 503
  );
}

function isAuthError(error) {
  const message = error?.message || String(error);
  return (
    message.includes('API_KEY_INVALID') ||
    message.includes('API_KEY_LEAKED') ||
    message.includes('403') ||
    message.includes('GEMINI_API_KEY')
  );
}

function recordError(service, error, modelName) {
  service._lastErrorTime = Date.now();
  const message = error?.message || String(error);

  if (message.includes('429') || isQuotaOrApiError(error)) {
    service._lastError = '429';
    notificationService.notifyError('AI_QUOTA_ERROR', { model: modelName, error: message }).catch(() => {});
  } else if (isAuthError(error)) {
    service._lastError = 'AUTH';
    notificationService.notifyError('AI_AUTH_ERROR', { model: modelName, error: message }).catch(() => {});
  } else {
    service._lastError = message;
  }
}

function clearErrorState(service) {
  service._lastError = null;
  service._lastErrorTime = null;
  service._maintenanceMode = false;
}

function enterMaintenanceMode(service) {
  service._maintenanceMode = true;
  service._lastError = null;
  service._lastErrorTime = null;
}

class AiService {
  _lastError = null;
  _lastErrorTime = null;
  _maintenanceMode = false;

  async getHealthStatus() {
    if (this._maintenanceMode) {
      return 'AKTİF';
    }

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    if (this._lastErrorTime && this._lastErrorTime < oneHourAgo) {
      this._lastError = null;
      this._lastErrorTime = null;
    }

    if (!getApiKey()) {
      return 'AKTİF';
    }

    if (this._lastError === '429') {
      return 'KOTA DOLU / BEKLEMEDE';
    }
    if (this._lastError === 'AUTH') {
      return 'KİMLİK DOĞRULAMA HATASI';
    }
    if (this._lastError) {
      return `HATA: ${this._lastError}`;
    }

    return 'AKTİF';
  }

  async analyzeFoodImage(base64Image, mimeType = 'image/jpeg') {
    if (!getApiKey()) {
      throw new Error('API Anahtarı eksik. Lütfen .env dosyasındaki GEMINI_API_KEY değerini kontrol edin.');
    }

    const model = getModel();
    try {
      console.log(`🔍 analyzeFoodImage: ${MODEL_NAME}`);
      const prompt =
        'Bu fotoğraftaki yemeğin adını, tahmini gramajını ve toplam kalorisini kısa bir metin olarak söyle. Protein, yağ ve karbonhidrat değerlerini \'%\' işareti ile belirt. Yanıtın başında yemeğin adını kalın (**...**) yaz.';
      const cleanedBase64 = cleanBase64(base64Image);
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: cleanedBase64, mimeType } },
      ]);
      const response = await result.response;
      clearErrorState(this);
      return response.text();
    } catch (error) {
      console.error(`AI Service Error (${MODEL_NAME}):`, error);
      recordError(this, error, MODEL_NAME);

      if (isAuthError(error)) {
        throw new Error(
          'API_KEY_LEAKED: Google API anahtarınız geçersiz veya engellenmiş. Lütfen .env dosyasındaki GEMINI_API_KEY değerini güncelleyin.'
        );
      }

      if (isQuotaOrApiError(error) || !this._lastError) {
        enterMaintenanceMode(this);
        await sleep(500);
        throw error;
      }

      enterMaintenanceMode(this);
      throw error;
    }
  }

  async analyzeFoodImageStructured(base64Image, mimeType = 'image/jpeg') {
    try {
      if (!getApiKey()) {
        throw new Error('API Anahtarı eksik. Lütfen .env dosyasındaki GEMINI_API_KEY değerini kontrol edin.');
      }

      const model = getModel({ responseMimeType: 'application/json' });

      console.log(`🔍 Detaylı analiz: ${MODEL_NAME}`);

      const prompt = `SİSTEM TALİMATI: Sen dünyanın en iyi görsel diyetisyen yapay zekasısın. Görevin, fotoğraftaki yemeği en küçük detayına kadar analiz etmek.

PROTOKOL:
Asla "Bilinmiyor" veya boş veri döndürme. Eğer fotoğraf bulanıksa bile "Şerbetli Tatlı" veya "Suluboya Yemek" gibi görsel tahminlerde bulun.
makrolar değerleri (protein, karbonhidrat, yag) toplamda 100 edecek şekilde mutlaka doldurulmalıdır.

KESİN ÇIKTI FORMATI: Yanıtın sadece aşağıdaki JSON objesi olmalı.
{
  "yemek_adi": "Baklava (Şerbetli Tatlı)",
  "porsiyon": "1 dilim (~50g)",
  "tahmini_kalori": 250,
  "makrolar": {
    "protein": 5,
    "karbonhidrat": 60,
    "yag": 35
  },
  "oneri": "Bu tatlının yanına şekersiz çay içerek kan şekerindeki ani yükselmeyi dengeleyebilirsiniz."
}`;

      const cleanedBase64 = cleanBase64(base64Image);
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: cleanedBase64, mimeType } },
      ]);

      const response = await result.response;
      const parsed = parseJsonResponse(response.text());
      console.log(`✅ Detaylı analiz başarılı: ${parsed.yemek_adi}`);
      clearErrorState(this);
      return parsed;
    } catch (error) {
      console.error(`❌ AI Error (${MODEL_NAME}):`, error);
      console.log("FULL ERROR DETAILS:", error);
      recordError(this, error, MODEL_NAME);

      if (isAuthError(error)) {
        throw new Error(
          'API_KEY_LEAKED: Google API anahtarınız geçersiz veya engellenmiş. Lütfen .env dosyasındaki GEMINI_API_KEY değerini güncelleyin.'
        );
      }

      enterMaintenanceMode(this);
      throw error;
    }
  }

  async generateWeeklyMealPlan(vki, dailyCalorieTarget, emptyDays = [0, 1, 2, 3, 4, 5, 6]) {
    if (!getApiKey()) {
      throw new Error('API Anahtarı eksik. Lütfen .env dosyasındaki GEMINI_API_KEY değerini kontrol edin.');
    }

    const model = getModel({ responseMimeType: 'application/json' });
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const requestedDays = emptyDays.map((i) => dayNames[i]).join(', ');

    try {
      console.log(`🍽️ Haftalık plan üretiliyor: ${MODEL_NAME}`);

      const prompt = `Sen profesyonel bir diyetisyen yapay zekasısın. Türk mutfağını ve dünya mutfağını iyi biliyorsun.

KULLANICI VERİLERİ:
- VKİ (Vücut Kitle Endeksi): ${vki}
- Günlük Kalori Hedefi: ${dailyCalorieTarget} kcal

GÖREV:
Şu günler için öğün planı oluştur: ${requestedDays}

HER GÜN İÇİN 3 ÖĞÜN OLUŞTUR: Kahvaltı, Öğle, Akşam Yemeği.
- VKİ değerine göre plan ayarla (yüksek VKİ = düşük kalorili yemekler, düşük VKİ = daha kalorili yemekler).
- Türkçe yemek isimleri kullan (Izgara Somon, Avokadolu Tost, Mercimek Çorbası, vb.).
- Her öğün için tahmini kalori değeri ver.
- Günlük toplam kalori hedefin yakınında olsun.

KESİN JSON FORMATI:
{
  "plan": [
    { "dayIndex": 0, "dayName": "Pazartesi", "meal": "Yulaf Ezmesi & Muz", "type": "Kahvaltı", "calories": 320 },
    { "dayIndex": 0, "dayName": "Pazartesi", "meal": "Izgara Tavuk Salata", "type": "Öğle", "calories": 450 },
    { "dayIndex": 0, "dayName": "Pazartesi", "meal": "Fırında Somon & Sebze", "type": "Akşam", "calories": 520 }
  ]
}

ÖNEMLİ: dayIndex değerlerini şu listeye göre ayarla: ${emptyDays.map((i) => `${i}=${dayNames[i]}`).join(', ')}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const parsed = parseJsonResponse(response.text());
      console.log(`✅ Haftalık plan başarıyla üretildi: ${parsed.plan?.length || 0} öğün`);
      clearErrorState(this);
      return parsed.plan || [];
    } catch (error) {
      console.error(`❌ Plan üretme hatası (${MODEL_NAME}):`, error.message?.substring(0, 120));
      recordError(this, error, MODEL_NAME);

      if (isAuthError(error)) {
        throw new Error(
          'API_KEY_LEAKED: Google API anahtarınız geçersiz veya engellenmiş. Lütfen .env dosyasındaki GEMINI_API_KEY değerini güncelleyin.'
        );
      }

      throw error;
    }
  }

  async generateWeeklyReportAdvice(userData) {
    const profile = userData?.profile || {};
    const dailySummary = userData?.dailySummary || {};
    if (!getApiKey()) {
      enterMaintenanceMode(this);
      return 'Bugün makro dengenizi korumak için protein ve lif alımınıza odaklanın; canlı AI geçici olarak bakım modunda.';
    }

    const model = getModel();

    try {
      const prompt = `Kullanıcı Profil Verileri:
- Boy: ${profile.boy ?? 170} cm
- Kilo: ${profile.kilo ?? 70} kg
- Yaş: ${profile.yas ?? 25}
- Hedef: ${profile.hedef ?? 'Sağlıklı Beslenme'}
- Alerjiler: ${profile.alerjiler ?? 'Yok'}

Bugünkü Beslenme Özeti:
- Toplam Kalori: ${dailySummary.totalCalories ?? 0} kcal
- Makrolar: Protein: ${dailySummary.protein ?? 0}g, Karbonhidrat: ${dailySummary.carbs ?? dailySummary.carb ?? 0}g, Yağ: ${dailySummary.fat ?? 0}g

TALİMAT: Kullanıcının fiziksel verilerini ve bugün yediklerini analiz et. Hedefine ulaşması için ona kısa (maksimum 2 cümle), motivasyonel ve bilimsel bir tavsiye ver. Tavsiye doğrudan kullanıcının eksiklerine (örn: daha fazla protein, daha az karbonhidrat) odaklansın.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      clearErrorState(this);
      return response.text().trim();
    } catch (error) {
      console.error('Advice Error:', error);
      recordError(this, error, MODEL_NAME);
      throw error;
    }
  }

  async generateWeeklyAdvice(userData) {
    const { profile, weeklySummary } = userData;
    if (!getApiKey()) {
      throw new Error('API Anahtarı eksik. Lütfen .env dosyasındaki GEMINI_API_KEY değerini kontrol edin.');
    }

    const model = getModel();

    try {
      const prompt = `Aşağıdaki verilere sahip kullanıcının haftalık beslenme karnesini analiz et: 
- Ortalama Kalori: ${weeklySummary.avgCalories} kcal
- Ortalama Protein: ${weeklySummary.avgProtein}g
- Ortalama Karbonhidrat: ${weeklySummary.avgCarbs}g
- Ortalama Yağ: ${weeklySummary.avgFat}g

Kullanıcın hedefi: ${profile.hedef || 'Kilo Vermek'}. 

Bu kişiye özel, PDF raporunda yer alacak, 3-4 cümleden oluşan, profesyonel bir diyetisyen edasında haftalık değerlendirme yazısı yaz. Gereksiz giriş cümleleri kurma, doğrudan analizini söyle.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      clearErrorState(this);
      return response.text().trim();
    } catch (error) {
      console.error('Weekly Advice Error:', error);
      recordError(this, error, MODEL_NAME);
      throw error;
    }
  }
}

module.exports = new AiService();
