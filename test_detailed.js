const aiService = require('./backend/src/services/aiService');

const validImageBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function run() {
  try {
    const result = await aiService.analyzeFoodImageStructured(validImageBase64, 'image/jpeg');
    console.log("SUCCESS:", result);
  } catch(e) {
    console.error("FAILED:", e.message);
  }
}
run();
