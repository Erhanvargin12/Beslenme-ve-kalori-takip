const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash';

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !String(key).trim()) {
    return null;
  }
  return String(key).trim();
}

let genAI = null;

function getGenAI() {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY tanımlı değil. Google AI Studio anahtarınızı .env dosyasına ekleyin.'
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(key);
    console.log('✅ Google Generative AI istemcisi hazır (AI Studio / ücretsiz katman).');
  }
  return genAI;
}

if (!getApiKey()) {
  console.error('⚠️ UYARI: GEMINI_API_KEY .env dosyasında bulunamadı — analizler bakım modunda çalışacak.');
}

function getModel(generationConfig = undefined) {
  const client = getGenAI();
  const options = { model: MODEL_NAME };
  if (generationConfig) {
    options.generationConfig = generationConfig;
  }
  return client.getGenerativeModel(options);
}

module.exports = {
  MODEL_NAME,
  getGenAI,
  getModel,
  getApiKey,
  // Geriye dönük uyumluluk
  genAI: genAI || { getGenerativeModel: () => { throw new Error('GEMINI_API_KEY eksik'); } },
};
