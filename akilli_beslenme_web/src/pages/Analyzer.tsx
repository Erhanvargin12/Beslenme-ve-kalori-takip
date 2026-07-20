import React, { useState, useRef, useEffect } from 'react';
import { Camera, UploadCloud, Sparkles, PieChart, Save, BarChart3, Loader2, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import { getErrorMessageFromBody, parseFetchJson } from '../utils/httpResponse';
import { auth } from '../config/firebase';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { motion } from 'framer-motion';

const API_URL = getApiBaseUrl();

export default function Analyzer() {
  const [currentBase64, setCurrentBase64] = useState<string | null>(null);
  const [currentMimeType, setCurrentMimeType] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalizEdiliyor, setIsAnalizEdiliyor] = useState(false);
  const [aiSonuc, setAiSonuc] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Kamera erişimi engellendi. Tarayıcınız HTTP (yerel ağ) üzerinden kameraya izin vermiyor olabilir (HTTPS veya localhost gereklidir).");
      return;
    }

    setIsCameraOpen(true);
    try {
      let stream;
      try {
        // Önce mobil cihazlar için arka kamerayı (environment) dene
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch (e) {
        // Masaüstü cihazlarda veya arka kamerası olmayanlarda varsayılan kamerayı aç
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Kamera açılamadı:", err);
      let errMsg = "Kamera erişimi reddedildi veya cihazınızda uygun kamera bulunamadı.";
      if (err.name === 'NotAllowedError') {
        errMsg = "Lütfen tarayıcınızın adres çubuğundan kamera iznini onaylayın.";
      }
      alert(errMsg);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      const MAX_SIZE = 800;
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
      ctx?.drawImage(video, 0, 0, width, height);
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setImagePreview(compressedDataUrl);
      setCurrentBase64(compressedDataUrl.split(',')[1]);
      setCurrentMimeType('image/jpeg');
      setAiSonuc(null);
      setError(null);
      stopCamera();
    }
  };

  const handleSaveMeal = async () => {
    if (!aiSonuc) return;
    try {
      console.log("[Sistem] Veri kaydediliyor...");
      const response = await fetch(`${API_URL}/meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.currentUser?.uid || "web_mock_user",
          foodName: aiSonuc.yemek_adi || "Bilinmiyor",
          calories: Number(aiSonuc.tahmini_kalori) || 0,
          protein: Number(aiSonuc.makrolar?.protein?.toString().replace(/[^0-9.]/g, '') || "0"),
          carbs: Number(aiSonuc.makrolar?.karbonhidrat?.toString().replace(/[^0-9.]/g, '') || "0"),
          fat: Number(aiSonuc.makrolar?.yag?.toString().replace(/[^0-9.]/g, '') || "0"),
          imageUrl: aiSonuc.imageUrl || null
        })
      });
      
      if (response.ok) {
        console.log("[Sistem] Kayıt başarılı.");
        alert("Beslenme günlüğüne başarıyla kaydedildi! 🥗");
      } else {
        console.error("[Sistem] Kayıt hatası:", response.status);
        alert("Kaydedilirken sistem tarafında bir hata oluştu.");
      }
    } catch (e) {
      console.error("[Sistem] Sunucu bağlantı hatası:", e);
      alert("Sunucu ile bağlantı kurulamadı. Lütfen ağınızı kontrol edin.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("[Sistem] Dosya seçildi:", file.name);
      setCurrentMimeType('image/jpeg');
      
      const reader = new FileReader();
      reader.onload = function(event) {
        const result = event.target?.result as string;
        
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 800;
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
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          setImagePreview(compressedDataUrl);
          setCurrentBase64(compressedDataUrl.split(',')[1]);
          setAiSonuc(null);
          setError(null);
          console.log("[Sistem] Görsel optimize edildi.");
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalizSubmit = async () => {
    if (!currentBase64) return;
    setIsAnalizEdiliyor(true);
    setAiSonuc(null);
    setError(null);

    console.log("[Sistem] Makro Değer Analizi başlatıldı...");

    try {
      const cevap = await fetch(`${API_URL}/analiz-et-detayli`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gorselBase64: currentBase64, mimeType: currentMimeType })
      });

      const jsonResult = await parseFetchJson<{
        error?: string;
        yemek_adi?: string;
        status?: string;
        [key: string]: unknown;
      }>(cevap);

      if (!cevap.ok) {
        throw new Error(
          getErrorMessageFromBody(jsonResult, `Analiz başarısız (HTTP ${cevap.status})`)
        );
      }

      if (jsonResult.error) {
        throw new Error(String(jsonResult.error));
      }

      if (!jsonResult.yemek_adi) {
        throw new Error('Sunucudan geçerli analiz verisi alınamadı.');
      }

      console.log('[Sistem] Analiz tamamlandı:', jsonResult.yemek_adi);
      if (jsonResult.status === 'MAINTENANCE_MODE') {
        console.warn('[Sistem] Bakım modu — demo analiz gösteriliyor.');
      }
      setAiSonuc(jsonResult);
    } catch (err: unknown) {
      console.error("[Sistem] Analiz sırasında hata oluştu:", err);
      let friendlyError = err instanceof Error ? err.message : "Akıllı analiz bağlantı hatası!";
      
      if (friendlyError.includes('kota') || friendlyError.includes('429')) {
        friendlyError =
          '⏳ Sistem yoğunluğu nedeniyle kota doldu. Lütfen 1-2 dakika bekleyip tekrar deneyin.';
      } else if (
        friendlyError.includes('Failed to fetch') ||
        friendlyError.includes('fetch failed') ||
        friendlyError.includes('body stream already read')
      ) {
        friendlyError =
          '🔌 Sunucuya erişilemedi veya geçersiz yanıt alındı. `npm run dev` ile API ve web\'in birlikte çalıştığından emin olun.';
      } else if (friendlyError.includes('Geçersiz JSON') || friendlyError.includes('geçerli JSON')) {
        friendlyError =
          '🔌 Sunucu beklenmeyen bir yanıt döndürdü. Backend (port 3000) çalışıyor mu kontrol edin.';
      }
      
      setError(friendlyError);
    } finally {
      setIsAnalizEdiliyor(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8 text-center md:text-left">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Makro Değer Analizi</h1>
          <p className="text-gray-500 font-medium">Fotoğraflar üzerinden besin değerlerini ve porsiyonları <span className="text-fuchsia-600 font-bold">Otomatik Tanımlama</span> sistemiyle belirleyin.</p>
        </div>
        <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900 rounded-2xl hidden md:block">
          <Camera size={32} className="text-fuchsia-600 dark:text-fuchsia-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Zone */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card variant="elevated" title={<><Camera className="w-5 h-5 text-slate-400" /> Görsel Kaynak Yükle</>} className="h-full">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex gap-4">
                <Button 
                  onClick={startCamera}
                  className="flex-1 py-4 flex flex-col items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-2 border-transparent transition-all"
                >
                  <Camera size={28} className="text-fuchsia-500" />
                  <span className="font-bold text-sm">Fotoğraf Çek</span>
                </Button>
                
                <label className="flex-1 py-4 flex flex-col items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-2 border-transparent cursor-pointer rounded-xl transition-all">
                  <ImageIcon size={28} className="text-indigo-500" />
                  <span className="font-bold text-sm">Galeriden Seç</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden min-h-[300px] flex flex-col items-center justify-center bg-blue-50/50 dark:bg-slate-800/40 text-slate-500">
              {imagePreview ? (
                <img src={imagePreview} alt="Önizleme" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <UploadCloud size={48} className="mb-4 text-fuchsia-400 opacity-60 mx-auto" />
                  <p className="font-bold text-lg text-slate-700 dark:text-slate-300">Önizleme Alanı</p>
                  <p className="text-xs mt-2 font-medium opacity-70">Lütfen analiz edilecek görseli seçin veya çekin.</p>
                </div>
              )}
            </div>

            <Button 
              type="button" 
              size="lg"
              className="mt-6 w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 border-0 shadow-xl shadow-fuchsia-500/20 py-5 text-lg font-bold"
              disabled={!currentBase64 || isAnalizEdiliyor}
              onClick={handleAnalizSubmit}
            >
              {isAnalizEdiliyor ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" /> Analiz İşleniyor...
                </span>
              ) : '🔍 Akıllı Analizi Başlat'}
            </Button>
          </Card>
        </motion.div>

        {/* Result Zone */}
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Card variant="outlined" title={<><BarChart3 className="w-5 h-5 text-slate-400" /> Analiz Bulguları & Detaylar</>} className="h-[520px] relative overflow-y-auto custom-scrollbar">
            
            {isAnalizEdiliyor && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/90 z-20 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                <motion.div 
                  initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-20 h-20 border-4 border-fuchsia-100 border-t-fuchsia-600 rounded-full mb-8"
                />
                <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-100 mb-2 uppercase">Sistem İşliyor</h3>
                <p className="text-fuchsia-600 dark:text-fuchsia-400 font-bold font-mono text-sm">
                  "Otomatik tanımlama algoritmaları görseli tarıyor..."
                </p>
              </div>
            )}

            {error && (
              <Alert variant="error" title="Sistem Uyarısı" className="mb-4 mt-2 font-bold">
                <AlertCircle className="inline mr-2" size={20} /> {error}
              </Alert>
            )}

            {aiSonuc && !isAnalizEdiliyor ? (
              <div className="animate-in slide-in-from-bottom-8 duration-500">
                
                <div className="bg-fuchsia-50 dark:bg-fuchsia-900/40 p-5 rounded-2xl border border-fuchsia-100 dark:border-fuchsia-800/50 mb-6 flex flex-col items-center shadow-sm">
                  <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-2">Tanımlanan Besin</span>
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100 text-center leading-tight">{aiSonuc.yemek_adi || "Bilinmiyor"}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-indigo-50 dark:bg-indigo-900/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 text-center">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Enerji Değeri</p>
                    <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{aiSonuc.tahmini_kalori || 0} kcal</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 text-center">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Porsiyon</p>
                    <p className="text-xl font-black text-emerald-800 dark:text-emerald-300">{aiSonuc.porsiyon || "1 Porsiyon"}</p>
                  </div>
                </div>

                <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <h4 className="font-bold tracking-tight text-slate-800 dark:text-slate-200 mb-5 text-xs uppercase flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-slate-400" /> Makro Besin Profili
                  </h4>
                  
                  <div className="space-y-4">
                    <MacroBar label="Protein" color="bg-blue-500 shadow-blue-500/20" percent={parseInt(aiSonuc.makrolar?.protein?.toString().replace(/[^0-9]/g, '') || "0")} />
                    <MacroBar label="Karbonhidrat" color="bg-amber-500 shadow-amber-500/20" percent={parseInt(aiSonuc.makrolar?.karbonhidrat?.toString().replace(/[^0-9]/g, '') || "0")} />
                    <MacroBar label="Yağ" color="bg-rose-500 shadow-rose-500/20" percent={parseInt(aiSonuc.makrolar?.yag?.toString().replace(/[^0-9]/g, '') || "0")} />
                  </div>
                </div>

                <div className="mb-6 p-5 bg-gradient-to-br from-fuchsia-50 to-white dark:from-fuchsia-950/40 dark:to-slate-900 rounded-2xl border border-fuchsia-200/50 dark:border-fuchsia-800/30">
                  <h4 className="font-bold tracking-tight text-fuchsia-800 dark:text-fuchsia-300 mb-3 text-xs uppercase flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-fuchsia-500" /> Akıllı Sistem Önerisi
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium italic">
                    "{aiSonuc.oneri || "Dengeli beslenme hedeflerinizle uyumlu bir profil."}"
                  </p>
                </div>

                <Button 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-fuchsia-600 dark:hover:bg-fuchsia-500 rounded-2xl py-4 font-bold shadow-lg shadow-slate-900/10"
                  onClick={handleSaveMeal}
                >
                  <span className="flex items-center justify-center gap-2 text-md">Günlüğe Kaydet <Save className="w-4 h-4" /></span>
                </Button>
                
              </div>
            ) : !isAnalizEdiliyor && !error ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500 pt-10">
                <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-full mb-6 border border-slate-100 dark:border-slate-700 shadow-inner">
                   <Camera size={56} className="opacity-20" />
                </div>
                <p className="font-bold text-lg text-slate-500">Kaynak Yüklenmedi</p>
                <p className="text-sm mt-1 max-w-[200px]">Besin profili oluşturmak için bir görsel kaynak seçin.</p>
              </div>
            ) : null}

          </Card>
        </motion.div>
      </div>

      {/* Kamera Modalı */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-fuchsia-500" /> Fotoğraf Çek
              </h3>
              <button onClick={stopCamera} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="relative bg-black w-full aspect-[4/3] flex items-center justify-center overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900 flex justify-center">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-fuchsia-500 shadow-[0_0_0_4px_rgba(217,70,239,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-fuchsia-500 rounded-full" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroBar({label, percent, color}: {label: string, percent: number, color: string}) {
  return (
    <div>
      <div className="flex justify-between mb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
        <span>{label}</span>
        <span className="text-slate-800 dark:text-slate-200">%{percent}</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${percent}%` }} 
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          className={`h-full rounded-full shadow-lg ${color}`} 
        />
      </div>
    </div>
  )
}
