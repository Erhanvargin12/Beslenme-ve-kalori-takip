const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAMzK9KCYhhpoa7dXuHH6YS3cIdf5NLKlw");

async function listModels() {
  try {
    const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent("Test");
    console.log("Success with gemini-1.5-flash");
  } catch (e) {
    console.error("Failed with gemini-1.5-flash:", e.message);
  }

  try {
    const result = await genAI.getGenerativeModel({ model: "gemini-pro-vision" }).generateContent("Test");
    console.log("Success with gemini-pro-vision");
  } catch (e) {
    console.error("Failed with gemini-pro-vision:", e.message);
  }
}

listModels();
