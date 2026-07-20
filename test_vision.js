const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Minimal geçerli JPEG base64 (1x1 piksel kırmızı)
const testImageBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH8AgGCwwKCgsKCwwNDxAUDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

async function testVision() {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });
  
  const prompt = 'Bu goruntudeki nesneyi JSON formatinda tanimla. Cevap: {"nesne": "...", "renk": "..."}';
  
  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: testImageBase64, mimeType: 'image/jpeg' } }
    ]);
    const text = result.response.text();
    console.log('✅ Görsel analiz BAŞARILI:', text.substring(0, 300));
  } catch(e) {
    console.log('❌ Görsel analiz HATASI:', e.message?.substring(0, 300));
  }
}
testVision();
