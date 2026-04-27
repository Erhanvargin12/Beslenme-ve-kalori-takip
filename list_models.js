const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAMzK9KCYhhpoa7dXuHH6YS3cIdf5NLKlw"); // The exact key the user provided

async function listModels() {
    try {
        console.log("Sunucudaki mevcut modeller sorgulanıyor...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${"AIzaSyAMzK9KCYhhpoa7dXuHH6YS3cIdf5NLKlw"}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("--- KULLANILABİLİR MODELLER ---");
            data.models.forEach(model => {
                if (model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`Model Adı: ${model.name}`);
                }
            });
            console.log("-------------------------------");
        } else {
            console.log("Hata (Modeller alınamadı):", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Modeller alınırken hata oluştu:", e);
    }
}

listModels();
