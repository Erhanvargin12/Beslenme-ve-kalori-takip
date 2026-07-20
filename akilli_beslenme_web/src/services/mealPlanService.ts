/**
 * Akıllı Öğün Planlayıcı - API Servis Katmanı
 * weeklyPlans ve water_logs koleksiyonları ile iletişim
 */

import { getApiBaseUrl } from '../config/api';
import { getErrorMessageFromBody, parseFetchJson } from '../utils/httpResponse';

const API_URL = getApiBaseUrl();

// ===== Tip Tanımları =====

export interface MealPlanItem {
  id?: string;
  userId: string;
  weekStart: string;
  dayIndex: number;
  dayName: string;
  meal: string;
  type: string; // Kahvaltı, Öğle, Akşam, Ara Öğün
  calories: number;
  source: 'ai' | 'manual';
  createdAt?: string;
}

export interface WaterLog {
  id?: string;
  userId: string;
  date: string;
  glasses: number;
}

// ===== Yardımcı Fonksiyonlar =====

/**
 * Haftanın başlangıç tarihini (Pazartesi) hesaplar.
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi'ye ayarla
  d.setDate(diff);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Bugünün tarihini YYYY-MM-DD formatında döndürür.
 */
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ===== Haftalık Plan API =====

/**
 * AI ile otomatik öğün planı üret ve Firestore'a kaydet.
 */
export async function generateAiPlan(
  userId: string,
  vki: number,
  dailyCalorieTarget: number,
  weekStart: string,
  emptyDays?: number[]
): Promise<{ message: string; plan: MealPlanItem[] }> {
  try {
    const response = await fetch(`${API_URL}/meal-plan/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, vki, dailyCalorieTarget, weekStart, emptyDays }),
    });

    const data = await parseFetchJson<{ error?: string; message?: string; plan?: MealPlanItem[] }>(
      response
    );
    if (!response.ok) {
      throw new Error(getErrorMessageFromBody(data, `HTTP ${response.status}`));
    }
    return data as { message: string; plan: MealPlanItem[] };
  } catch (error) {
    console.error("AI Plan üretme hatası:", error);
    throw error;
  }
}

/**
 * Haftalık planı Firestore'dan getir (tarihe göre sıralı).
 */
export async function fetchWeeklyPlan(userId: string, weekStart: string): Promise<MealPlanItem[]> {
  try {
    const response = await fetch(`${API_URL}/meal-plan/${userId}/${weekStart}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Plan getirme hatası:", error);
    return [];
  }
}

/**
 * Manuel öğün ekle.
 */
export async function addMealToPlan(data: {
  userId: string;
  weekStart: string;
  dayIndex: number;
  dayName: string;
  meal: string;
  type: string;
  calories: number;
}): Promise<MealPlanItem> {
  const response = await fetch(`${API_URL}/meal-plan/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await parseFetchJson<{ error?: string; meal?: MealPlanItem }>(response);
  if (!response.ok) {
    throw new Error(getErrorMessageFromBody(result, 'Öğün eklenemedi.'));
  }
  if (!result.meal) {
    throw new Error('Sunucudan öğün verisi alınamadı.');
  }
  return result.meal;
}

/**
 * Öğün sil.
 */
export async function deleteMealFromPlan(docId: string): Promise<void> {
  const response = await fetch(`${API_URL}/meal-plan/${docId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`Silme hatası: HTTP ${response.status}`);
}

// ===== Su Takibi API =====

/**
 * Bugünün su kaydını getir.
 */
export async function fetchWaterLog(userId: string, date: string): Promise<WaterLog> {
  try {
    const response = await fetch(`${API_URL}/water-log/${userId}/${date}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Su kaydı getirme hatası:", error);
    return { userId, date, glasses: 0 };
  }
}

/**
 * Su tüketimini güncelle (Firestore'da water_logs koleksiyonuna kaydeder).
 */
export async function updateWaterLog(userId: string, date: string, glasses: number): Promise<WaterLog> {
  const response = await fetch(`${API_URL}/water-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, date, glasses }),
  });

  if (!response.ok) throw new Error(`Su kaydı güncellenemedi: HTTP ${response.status}`);
  const result = await response.json();
  return result.log;
}

// ===== Dinamik İstatistik Hesaplama =====

/**
 * Planlanan toplam kaloriyi hesaplar.
 */
export function calculateTotalCalories(plan: MealPlanItem[]): number {
  return plan.reduce((sum, item) => sum + (item.calories || 0), 0);
}

/**
 * AI Güven Skoru hesaplar.
 * Planlanan toplam kalorinin ideal kalori hedefinden sapmasına göre puan verir.
 * Formül: 100 - (|sapma_yüzdesi|)
 *   %5 sapma → %95 güven, %10 sapma → %90 güven, vs.
 */
export function calculateConfidenceScore(totalCalories: number, idealWeeklyCalories: number): {
  score: number;
  label: string;
  deviation: number;
} {
  if (idealWeeklyCalories === 0 || totalCalories === 0) {
    return { score: 0, label: 'Veri Yok', deviation: 0 };
  }

  const deviation = Math.abs(((totalCalories - idealWeeklyCalories) / idealWeeklyCalories) * 100);
  const score = Math.max(0, Math.round(100 - deviation));

  let label: string;
  if (score >= 95) label = 'Mükemmel';
  else if (score >= 85) label = 'Çok İyi';
  else if (score >= 70) label = 'İyi';
  else if (score >= 50) label = 'Orta';
  else label = 'Düşük';

  return { score, label, deviation: Math.round(deviation * 10) / 10 };
}
