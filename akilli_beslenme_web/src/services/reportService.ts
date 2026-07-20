import jsPDF from 'jspdf';
import { getApiBaseUrl } from '../config/api';

const API_URL = getApiBaseUrl();

const normalizeTr = (text: any): string => {
  if (text == null) return '';
  const trMap: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  };
  return String(text).replace(/[çÇğĞıİöÖşŞüÜ]/g, match => trMap[match] || match);
};

export async function downloadFullReport(userId: string, userName: string, setLoading?: (val: boolean) => void) {
  try {
    if (setLoading) setLoading(true);
    console.log(`[Rapor] ${userName} için tam rapor verileri çekiliyor...`);
    const response = await fetch(`${API_URL}/report/full-history/${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        alert("Henüz rapor oluşturulacak veri bulunamadı.");
        return;
      }
      throw new Error("Rapor verileri alınamadı.");
    }

    const data = await response.json();
    await generatePDF(data, userName);
  } catch (error) {
    console.error("PDF Rapor hatası:", error);
    alert("Rapor oluşturulurken bir hata oluştu. Lütfen bağlantınızı kontrol edin.");
  } finally {
    if (setLoading) setLoading(false);
  }
}

async function generatePDF(data: any, userName: string) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateStr = new Date().toLocaleDateString('tr-TR');
  const filename = `${normalizeTr(userName).replace(/\s+/g, '_')}_Tam_Rapor_${dateStr.replace(/\./g, '_')}.pdf`;

  // --- 1. Kapak Sayfası ---
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(normalizeTr("TÜM ZAMANLARIN BESLENME ANALİZİ"), pageWidth / 2, 25, { align: "center" });

  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFontSize(10);
  doc.text(normalizeTr(`Rapor Tarihi: ${dateStr}`), pageWidth - 20, 50, { align: "right" });
  doc.text(normalizeTr(`Kullanıcı: ${userName}`), 20, 50);

  // Başarı Özeti Kutusu
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 60, pageWidth - 40, 60, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(normalizeTr("BAŞARI ÖZETİ"), 30, 75);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(normalizeTr(`Toplam Kullanım Süresi:`), 35, 85);
  doc.setFont("helvetica", "bold");
  doc.text(normalizeTr(`${data.stats.totalDays} Gün`), 110, 85);

  doc.setFont("helvetica", "normal");
  doc.text(normalizeTr(`Yüklenen Toplam Fotoğraf:`), 35, 93);
  doc.setFont("helvetica", "bold");
  doc.text(normalizeTr(`${data.stats.totalPhotos} Adet`), 110, 93);

  doc.setFont("helvetica", "normal");
  doc.text(normalizeTr(`Toplam Kilo Değişimi:`), 35, 101);
  doc.setFont("helvetica", "bold");
  const sign = data.user.weightChange > 0 ? "+" : "";
  doc.text(normalizeTr(`${sign}${data.user.weightChange} kg`), 110, 101);

  // Mevcut Durum
  doc.setFont("helvetica", "normal");
  doc.text(normalizeTr(`Güncel VKİ Skoru:`), 35, 109);
  doc.setFont("helvetica", "bold");
  doc.text(normalizeTr(`${data.user.vki} (${data.user.durum})`), 110, 109);

  // --- 2. Tablo Alanı ---
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(normalizeTr("BESLENME TRENDLERİ (GÜNLÜK)"), 20, 140);

  let yPos = 150;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(normalizeTr("Tarih"), 25, yPos);
  doc.text(normalizeTr("Kalori (kcal)"), 60, yPos);
  doc.text(normalizeTr("Protein (g)"), 95, yPos);
  doc.text(normalizeTr("Karbonhidrat (g)"), 130, yPos);
  doc.text(normalizeTr("Yağ (g)"), 175, yPos);
  
  doc.setDrawColor(203, 213, 225);
  doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
  yPos += 10;

  const displayTrends = data.trends.length > 20 ? data.trends.slice(-20) : data.trends;

  displayTrends.forEach((trend: any, index: number) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 25;
    }

    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", index % 2 === 0 ? "bold" : "normal");
    doc.text(normalizeTr(trend.date), 25, yPos);
    doc.text(normalizeTr(`${trend.calories}`), 60, yPos);
    doc.text(normalizeTr(`${trend.protein.toFixed(1)}`), 95, yPos);
    doc.text(normalizeTr(`${trend.carbs.toFixed(1)}`), 130, yPos);
    doc.text(normalizeTr(`${trend.fat.toFixed(1)}`), 175, yPos);
    yPos += 8;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(normalizeTr(`Sayfa ${i} / ${pageCount}`), pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(normalizeTr("Akilli Beslenme & Saglik Asistani - Profesyonel Raporlama Sistemi"), 20, pageHeight - 10);
  }

  doc.save(filename);
}
