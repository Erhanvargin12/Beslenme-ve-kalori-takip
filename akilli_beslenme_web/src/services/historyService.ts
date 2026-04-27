import type { UserHistory } from "../types/history";

const API_URL = "http://127.0.0.1:3000"; // Daha kararlı yerel bağlantı

export async function fetchUserHistory(): Promise<UserHistory[]> {
  try {
    const response = await fetch(`${API_URL}/kullanicilar`);

    if (!response.ok) {
      throw new Error(`Veri sunucudan çekilemedi (HTTP Hata: ${response.status})`);
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
