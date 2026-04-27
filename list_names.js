async function listModels() {
  const key = "AIzaSyAMzK9KCYhhpoa7dXuHH6YS3cIdf5NLKlw";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    if (data.models) {
      console.log(data.models.map(m => m.name).join("\n"));
    } else {
      console.log("No models found or error:", JSON.stringify(data));
    }
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}

listModels();
