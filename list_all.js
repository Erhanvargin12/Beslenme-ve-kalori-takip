async function listModels() {
  const key = "AIzaSyAMzK9KCYhhpoa7dXuHH6YS3cIdf5NLKlw";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}

listModels();
