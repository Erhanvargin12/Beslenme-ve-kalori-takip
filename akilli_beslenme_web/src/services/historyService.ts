import type { UserHistory } from "../types/history";

import { getApiBaseUrl } from '../config/api';

const API_URL = getApiBaseUrl();

export async function fetchUserHistory(): Promise<UserHistory[]> {
  try {
    const response = await fetch(`${API_URL}/kullanicilar`);

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.error) detail = errJson.error;
        if (errJson?.code === 'FIRESTORE_QUOTA') {
          throw new Error(
            'Firestore kotası dolu — kayıtlar silinmedi. Firebase Console → Usage bölümünü kontrol edin veya kotanın yenilenmesini bekleyin.'
          );
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('Firestore kotası')) throw e;
      }
      throw new Error(`Veri sunucudan çekilemedi (${detail})`);
    }

    const data: UserHistory[] = await response.json();
    
    // Sistem JSON olarak son eklenenleri alta koyuyor
    // Biz ise React arayüzünde en yeniyi en üstte görmek isteyebiliriz.
    // Bu reverse işlemini daha doğru yapmak için:
    return data.reverse(); 

  } catch (error) {
    if (error instanceof TypeError) {
      console.error("Ağ bağlantısı hatası (Sunucu kapalı olabilir):", error);
    } else {
      console.error("Geçmiş veri çekme hatası:", error);
    }
    throw error; // UI katmanına fırlat
  }
}

export async function saveUserVki(isim: string, boy: number, kilo: number): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/kayit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isim, boy, kilo }),
    });

    if (!response.ok) {
      throw new Error(`Kayıt başarısız oldu (Hata: ${response.status})`);
    }

    const sonucMetni = await response.text();
    return sonucMetni;
  } catch (error) {
    console.error("VKI kaydetme hatası:", error);
    throw error;
  }
}

export async function fetchAiAdvice(userData: any): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/tavsiye-al`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      return "Beslenme rutininiz hakkında veri eksikliği nedeniyle tavsiye oluşturulamadı. Dengeli beslenmeye özen gösterin.";
    }

    return await response.text();
  } catch (error) {
    console.error("AI Advice fetch error:", error);
    return "Bağlantı sorunu nedeniyle şu an tavsiye alınamıyor. Ancak genel olarak bol su içmeniz ve lifli gıdalar tüketmeniz önerilir.";
  }
}

export async function fetchWeeklyAiAdvice(userId: string): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/tavsiye-al-haftalik/${userId}`);

    if (!response.ok) {
      return "Haftalık beslenme verileriniz incelendiğinde, genel olarak dengeli bir rota izlediğiniz görülmektedir. Su tüketiminizi artırmanız önerilir.";
    }

    return await response.text();
  } catch (error) {
    console.error("Weekly AI Advice fetch error:", error);
    return "Haftalık rapor analizine şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.";
  }
}

export async function fetchDashboardStats(userId?: string): Promise<any> {
  try {
    const url = userId ? `${API_URL}/dashboard/stats?userId=${userId}` : `${API_URL}/dashboard/stats`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Dashboard istatistikleri çekilemedi (Hata: ${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error("Dashboard stats fetch error:", error);
    return {
      dailyPhotoCount: 0,
      weeklyCalories: [],
      activeUserRate: 0,
      activeUserRateChange: 0,
      macroDistribution: { protein: 0, carbs: 0, fat: 0 }
    };
  }
}
