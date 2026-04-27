const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAMzK9KCYhhpoa7dXuHH6YS3cIdf5NLKlw";
const genAI = new GoogleGenerativeAI(API_KEY);

const MODEL_NAMES = [
  "gemini-1.5-flash", 
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash"
];

module.exports = {
  genAI,
  MODEL_NAMES
};
