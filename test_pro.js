const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAMzK9KCYhhpoa7dXuHH6YS3cIdf5NLKlw");

async function listAllModels() {
  try {
    // There is no listModels in @google/generative-ai library directly like this,
    // usually we'd use the REST API or another library, but let's try a common one.
    // Try gemini-1.5-flash-latest or gemini-pro
    const result_pro = await genAI.getGenerativeModel({ model: "gemini-pro" }).generateContent("Say hello");
    console.log("Success with gemini-pro");
  } catch (e) {
    console.error("Failed with gemini-pro:", e.message);
  }
}

listAllModels();
