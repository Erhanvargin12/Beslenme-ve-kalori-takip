const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// A slightly larger valid JPEG base64 (10x10 gray square)
const validImageBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function testModel(modelName) {
  console.log(`\nTesting model: ${modelName}`);
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
    });
    
    const prompt = 'What is this image? Just answer short.';
    
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: validImageBase64, mimeType: 'image/jpeg' } }
    ]);
    const text = result.response.text();
    console.log(`✅ Success (${modelName}):`, text);
  } catch(e) {
    console.log(`❌ Error (${modelName}):`, e.message);
  }
}

async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-2.5-flash');
}

run();
