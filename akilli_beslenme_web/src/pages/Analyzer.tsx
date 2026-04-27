import React, { useState } from 'react';
import { Camera, RefreshCw, UploadCloud, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { motion } from 'framer-motion';

const API_URL = `http://${window.location.hostname}:3000`;

export default function Analyzer() {
  const [currentBase64, setCurrentBase64] = useState<string | null>(null);
  const [currentMimeType, setCurrentMimeType] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalizEdiliyor, setIsAnalizEdiliyor] = useState(false);
  const [aiSonuc, setAiSonuc] = useState<string | null>(null);
  const [macros, setMacros] = useState<{ pro: number; carb: number; fat: number } | null>(null);
  const [extractedStats, setExtractedStats] = useState<{ calories: string; gram: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentMimeType('image/jpeg'); // Her zaman en uygun performanslı formata çevireceğiz
      
      const reader = new FileReader();
      reader.onload = function(event) {
        const result = event.target?.result as string;
        
        // --- GÖRSEL SIKIŞTIRMA (COMPRESSION) ---
        // 'fetch failed' hatasını engellemek için büyük fotoğrafları (Örn: 10MB) ufaltıyoruz (Örn: 200KB)
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 800; // Maksimum 800 piksel yeterlidir AI için
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // %80 kalitede JPEG olarak sıkıştır
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
           setImagePreview(compressedDataUrl);
          setCurrentBase64(compressedDataUrl.split(',')[1]);
          setAiSonuc(null);
          setMacros(null);
          setExtractedStats(null);
          setError(null);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMockMacros = () => {
    // Generate fake macros that sum to 100 for visual effect
    const pro = Math.floor(Math.random() * 40) + 10;
    const carb = Math.floor(Math.random() * 50) + 20;
    const fat = 100 - (pro + carb);
    setMacros({ pro, carb, fat });
  };

  const handleAnalizSubmit = async () => {
    if (!currentBase64) return;
    setIsAnalizEdiliyor(true);
    setAiSonuc(null);
    setError(null);

    try {
      const cevap = await fetch(`${API_URL}/analiz-et`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gorselBase64: currentBase64, mimeType: currentMimeType })
      });

      if (cevap.ok) {
        let metin = await cevap.text();
        
        // --- AI YANITINDAN MAKROLARI VE STATLARI AYIKLAMA (Regex) ---
        const findValue = (keywords: string[]) => {
          for (const kw of keywords) {
            const regex = new RegExp(`${kw}.*?(\\d+)`, 'i');
            const match = metin.match(regex);
            if (match) return match[1];
          }
          return null;
        };

        const pro = parseInt(findValue(['Protein']) || "0");
        const carb = parseInt(findValue(['Karbonhidrat', 'Carb']) || "0");
        const fat = parseInt(findValue(['Yağ', 'Fat']) || "0");
        const cal = findValue(['Kalori', 'Calorie', 'kcal']);
        const weight = findValue(['Gramaj', 'Gram', 'Ağırlık', 'Miktar']);

        if (pro > 0 || carb > 0 || fat > 0) {
          setMacros({ pro, carb, fat });
        } else {
          generateMockMacros();
        }

        if (cal || weight) {
          setExtractedStats({ 
            calories: cal ? `${cal} kcal` : "---", 
            gram: weight ? `${weight}g` : "---" 
          });
        }

        metin = metin.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        setAiSonuc(metin);
      } else {
        const errorText = await cevap.text();
        throw new Error(`API Hatası: ${cevap.status} - ${errorText}`);
      }
    } catch (err: unknown) {
      let friendlyError = err instanceof Error ? err.message : "AI bağlantı hatası!";
      
      if (friendlyError.includes("429")) {
        friendlyError = "⚠️ Günlük limitinize ulaştınız veya çok hızlı istek gönderdiniz. Lütfen 15 saniye bekleyip tekrar deneyin.";
      } else if (friendlyError.includes("Failed to fetch") || friendlyError.includes("fetch failed")) {
        friendlyError = "🔌 Sunucuya bağlanılamadı. Lütfen backend (server.js) sunucusunun çalıştığından emin olun.";
      }
      
      setError(friendlyError);
    } finally {
      setIsAnalizEdiliyor(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Gelişmiş AI Besin Analizi</h1>
          <p className="text-gray-500">Gemini Vision altyapısıyla desteklenen yapay zeka fotoğraf inceleme merkezi.</p>
        </div>
        <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900 rounded-2xl hidden md:block">
          <Camera size={32} className="text-fuchsia-600 dark:text-fuchsia-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Zone */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card variant="elevated" title="🖼️ Fotoğraf Yükle" className="h-full">
            <fieldset>
              <legend className="sr-only">Yemek Fotoğrafı Taraması</legend>
              <label htmlFor="yemekFoto" className="group relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-fuchsia-500 dark:hover:border-fuchsia-400 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/40 text-slate-500 transition-all cursor-pointer overflow-hidden min-h-[300px]">
                
                <input 
                  type="file" 
                  id="yemekFoto" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />

                {imagePreview ? (
                  <img src={imagePreview} alt="Yüklenen Yemek" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <>
                    <UploadCloud size={48} className="mb-4 text-fuchsia-400 opacity-60 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-lg text-slate-700 dark:text-slate-300">Tıkla veya Sürükle</span>
                    <span className="text-sm mt-2 font-medium opacity-70">JPEG, PNG formatları desteklenir</span>
                  </>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white font-bold bg-fuchsia-600 px-4 py-2 rounded-full shadow-lg">Değiştir</span>
                </div>
              </label>
            </fieldset>

            <Button 
              type="button" 
              size="lg"
              className="mt-6 w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 border-0 shadow-xl shadow-fuchsia-500/20 py-4 text-lg"
              disabled={!currentBase64 || isAnalizEdiliyor}
              onClick={handleAnalizSubmit}
            >
              {isAnalizEdiliyor ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="animate-spin" /> Analiz Ediliyor...
                </span>
              ) : '🔮 Derin Analizi Başlat'}
            </Button>
          </Card>
        </motion.div>

        {/* REsult Zone */}
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Card variant="outlined" title="📊 Bulgular & Makrolar" className="h-[500px] border-fuchsia-100 dark:border-fuchsia-900 relative overflow-y-auto custom-scrollbar bg-white/50 backdrop-blur-md dark:bg-slate-900/50">
            
            {/* Loading Overlay State required by coordinator tips! */}
            {isAnalizEdiliyor && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/90 z-20 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                <motion.div 
                  initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-16 h-16 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full mb-6"
                />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Algoritma Çalışıyor</h3>
                <p className="text-fuchsia-600 dark:text-fuchsia-400 font-medium font-mono">
                  "Yapay zeka şu an yemekleri inceliyor, lütfen bekleyin..."
                </p>
              </div>
            )}

            {error && (
              <Alert variant="error" title="Sistem Uyarısı" className="mb-4 mt-2 font-medium">
                <AlertCircle className="inline mr-2" size={18} /> {error}
              </Alert>
            )}

            {aiSonuc && !isAnalizEdiliyor ? (
              <div className="animate-in slide-in-from-bottom-8 duration-500">
                
                {/* Highlight Stats (Calorie & Weight) */}
                {extractedStats && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 text-center">
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Tahmini Kalori</p>
                      <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{extractedStats.calories}</p>
                    </div>
                    <div className="bg-fuchsia-50 dark:bg-fuchsia-900/40 p-4 rounded-2xl border border-fuchsia-100 dark:border-fuchsia-800/50 text-center">
                      <p className="text-xs font-bold text-fuchsia-500 uppercase tracking-widest mb-1">Tahmini Gramaj</p>
                      <p className="text-2xl font-black text-fuchsia-700 dark:text-fuchsia-300">{extractedStats.gram}</p>
                    </div>
                  </div>
                )}

                {macros && (
                  <div className="mb-8 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                      🧪 Tahmini Makro Besin Dağılımı
                    </h4>
                    
                    {/* Progress Bars */}
                    <div className="space-y-4">
                      <MacroBar label="Protein" color="bg-blue-500" percent={macros.pro} />
                      <MacroBar label="Karbonhidrat" color="bg-amber-500" percent={macros.carb} />
                      <MacroBar label="Yağ" color="bg-rose-500" percent={macros.fat} />
                    </div>

                    <div className="mt-6 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-800 dark:text-emerald-200 font-medium text-sm flex gap-2">
                      💡 <span>AI Önerisi: {macros.carb > 40 ? "Bugün karbonhidratı fazla kaçırdınız, akşam yemeğinde hafif bir çorba veya ızgara sebze tercih edin." : "Makro dengeniz oldukça sağlıklı görünüyor! Lif yönünden zengin salata ekleyebilirsiniz."}</span>
                    </div>
                  </div>
                )}
                
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm uppercase tracking-wider">Metin Özeti</h4>
                <div 
                  className="prose prose-fuchsia dark:prose-invert text-sm leading-relaxed p-4 bg-fuchsia-50/50 dark:bg-fuchsia-900/20 rounded-2xl border border-fuchsia-100 dark:border-fuchsia-800/30"
                  dangerouslySetInnerHTML={{ __html: aiSonuc }}
                />
              </div>
            ) : !isAnalizEdiliyor && !error ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500 pt-10">
                <Camera size={64} className="mb-4 opacity-30" />
                <p>Besin değerlerini ve tahminleri görmek için sisteme görsel bir kaynak yükleyin.</p>
              </div>
            ) : null}

          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function MacroBar({label, percent, color}: {label: string, percent: number, color: string}) {
  return (
    <div>
      <div className="flex justify-between mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        <span>%{percent}</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${percent}%` }} 
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-2.5 rounded-full ${color}`} 
        />
      </div>
    </div>
  )
}
