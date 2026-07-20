const MOCK_STRUCTURED_ANALYSIS = {
  status: 'MAINTENANCE_MODE',
  yemek_adi: 'Dengeli Tabak (Tahmini)',
  porsiyon: '1 porsiyon (~200g)',
  tahmini_kalori: 420,
  makrolar: {
    protein: 30,
    karbonhidrat: 45,
    yag: 25,
  },
  oneri:
    'Makro dengenizi korumak için öğün başına ~25–30g protein, kompleks karbonhidrat ve sağlıklı yağ hedefleyin. Canlı AI geçici olarak bakım modunda; bu tahmin demo amaçlıdır.',
};

const MOCK_TEXT_ANALYSIS =
  '**Dengeli Tabak (Tahmini)** — Yaklaşık 420 kcal. Makrolar: Protein %30, Karbonhidrat %45, Yağ %25. Bakım modunda demo analiz; günlük makro dengenizi korumaya devam edin.';

function getMockWeeklyPlan(emptyDays = [0, 1, 2, 3, 4, 5, 6]) {
  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const meals = [
    { meal: 'Yulaf & Muz', type: 'Kahvaltı', calories: 320 },
    { meal: 'Izgara Tavuk Salata', type: 'Öğle', calories: 450 },
    { meal: 'Fırında Balık & Sebze', type: 'Akşam', calories: 480 },
  ];
  const plan = [];
  for (const dayIndex of emptyDays) {
    for (const m of meals) {
      plan.push({
        dayIndex,
        dayName: dayNames[dayIndex],
        meal: m.meal,
        type: m.type,
        calories: m.calories,
      });
    }
  }
  return plan;
}

module.exports = {
  MOCK_STRUCTURED_ANALYSIS,
  MOCK_TEXT_ANALYSIS,
  getMockWeeklyPlan,
};
