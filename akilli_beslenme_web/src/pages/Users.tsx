import React, { useState, useEffect } from 'react';
import { Download, Users, FileText, Search, UserCircle2, Plus, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';

import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

import type { UserHistory, Durum, SortField, SortOrder } from "../types/history";
import { fetchUserHistory, saveUserVki } from "../services/historyService";
import { applyFilters } from "../utils/historyHelpers";

export default function UsersPage() {
  const [data, setData] = useState<UserHistory[]>([]);
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState<Durum | "all">("all");
  const [sortField] = useState<SortField>("vki");
  const [sortOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isim, setIsim] = useState('');
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetchUserHistory().then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => {
      setError("Veritabanına bağlanılamadı. JSON kayıtları alınamıyor.");
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = applyFilters(data, search, kategori, sortField, sortOrder);
  const kategoriListesi: Array<Durum | "all"> = ["all", "Zayıf", "Normal", "Fazla Kilolu", "Obez"];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isim || !boy || !kilo) return;
    
    setIsSaving(true);
    try {
      const response = await saveUserVki(isim, parseInt(boy), parseInt(kilo));
      setSaveSuccess(response);
      loadData(); // Form kaydedildikten sonra listeyi güncelle
      setTimeout(() => {
        setIsModalOpen(false);
        setSaveSuccess(null);
        setIsim(''); setBoy(''); setKilo('');
      }, 2000);
    } catch {
      alert("Kullanıcı kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = async () => {
    try {
      const topUser = filteredUsers[0];
      let aiAdvice = "Genel olarak sağlıklı beslenmeye özen gösterin.";
      
      if (topUser) {
        // AI'dan gerçek zamanlı tavsiye alalım
        const { fetchAiAdvice } = await import("../services/historyService");
        aiAdvice = await fetchAiAdvice({
          isim: topUser.isim,
          vki: topUser.vki,
          durum: topUser.durum,
          sonYemekler: "Beslenme verileri analiz ediliyor..." // Gelecekte yemek logları buraya eklenebilir
        });
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const dateStr = new Date().toLocaleString('tr-TR');
      
      // --- HEADER & BRANDING ---
      pdf.setFillColor(45, 55, 72); 
      pdf.rect(0, 0, 210, 45, 'F');
      
      pdf.setFontSize(26);
      pdf.setTextColor(255, 255, 255);
      pdf.text('AKILLI SAGLIK & BESLENME', 14, 20);
      
      pdf.setFontSize(14);
      pdf.setTextColor(150, 160, 255);
      pdf.text('E-Tibbi Analiz ve Haftalik Takip Raporu', 14, 30);
      
      pdf.setFontSize(9);
      pdf.setTextColor(200, 200, 200);
      pdf.text(`Rapor No: #AKIL-PDF-${Math.floor(Math.random() * 100000)}`, 150, 20);
      pdf.text(`Düzenleme Tarihi: ${dateStr}`, 150, 25);

      // --- 1. BOLUM: KULLANICI SAGLIK OZETI ---
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(16);
      pdf.text('1. Genel Saglik ve VKI Özeti', 14, 60);
      
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, 63, 196, 63);

      if (topUser) {
        pdf.setFontSize(11);
        pdf.text(`Hasta Adi: ${topUser.isim}`, 16, 75);
        pdf.text(`Vücut Kitle Endeksi (VKI): ${topUser.vki}`, 16, 82);
        pdf.text(`Genel Durum: ${topUser.durum}`, 16, 89);
        
        // VKI Kutusu (Highlight)
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(79, 70, 229);
        pdf.roundedRect(120, 70, 70, 25, 3, 3, 'FD');
        pdf.setTextColor(79, 70, 229);
        pdf.setFontSize(12);
        pdf.text('VKI ANALIZI', 135, 78);
        pdf.setFontSize(20);
        pdf.text(topUser.vki.toString(), 142, 88);
      }

      // --- 2. BOLUM: AI ASISTAN TAVSIYESI (DINAMIK) ---
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(16);
      pdf.text('2. AI Asistan Beslenme Tavsiyesi', 14, 110);
      pdf.line(14, 113, 196, 113);
      
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      
      // AI'dan gelen tavsiyeyi PDF'e yazdıralım
      pdf.text(aiAdvice, 16, 122, { maxWidth: 170 });

      // --- 3. BOLUM: TUM KAYITLAR (TABLO) ---
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(16);
      pdf.text('3. Haftalik Veri Kayitlari (Loglar)', 14, 140);
      pdf.line(14, 143, 196, 143);

      // Tablo Header
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, 150, 182, 10, 'F');
      pdf.setFontSize(10);
      pdf.text('SIRA', 16, 156);
      pdf.text('AD SOYAD', 32, 156);
      pdf.text('BOY', 85, 156);
      pdf.text('KILO', 110, 156);
      pdf.text('DURUM', 135, 156);
      pdf.text('VKI', 180, 156);

      let y = 168;
      filteredUsers.slice(0, 15).forEach((user, idx) => { // Sayfa tasarımı için ilk 15 kayıt
        pdf.setDrawColor(241, 245, 249);
        pdf.line(14, y + 2, 196, y + 2);
        
        pdf.text(`${idx + 1}`, 16, y);
        pdf.text(user.isim, 32, y);
        pdf.text(`${user.boy}cm`, 85, y);
        pdf.text(`${user.kilo}kg`, 110, y);
        pdf.text(user.durum, 135, y);
        pdf.text(user.vki.toString(), 180, y);
        y += 10;
      });

      // --- FOOTER ---
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Bu rapor Google Gemini AI ve Akilli Beslenme Bulut Sunuculari tarafindan teshis amaçli olusturulmustur.', 40, 285);
      pdf.text('Tüm haklari saklidir © 2026', 90, 290);

      pdf.save(`Beslenme-Raporu-${topUser?.isim || 'Kullanici'}.pdf`);
    } catch (err) {
      console.error("PDF Hatası:", err);
      alert("PDF dökümanı oluşturulurken bir hata oluştu.");
    }
  };

  const getBadgeClass = (durum: string) => {
    if (durum === "Normal") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300";
    if (durum === "Zayıf") return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300";
    if (durum === "Fazla Kilolu") return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300";
    return "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 border-rose-300";
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Kullanıcı & Takip Yönetimi</h1>
          <p className="text-gray-500">Sistemdeki tüm kayıtları inceleyin, raporlayın ve yeni hastalar ekleyin.</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setIsModalOpen(true)} size="lg" className="bg-indigo-600 hover:bg-indigo-500 gap-2 font-bold shadow-lg text-white border-0">
            <Plus size={20} /> Yeni Kullanıcı Ekle
          </Button>
          <Button onClick={generatePDF} size="lg" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 gap-2 font-bold shadow-lg text-white border-0">
            <Download size={20} /> Haftalık PDF Raporu
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="error" title="Bağlantı Hatası">{error}</Alert>
      ) : (
        <Card variant="outlined" className="p-0 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-slate-800">
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              <div className="relative w-full md:w-96 group">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="TC Kimlik, İsim, Vücut Endeksi ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm outline-none dark:text-white shadow-sm"
                />
              </div>

              <div className="flex gap-2 flex-wrap w-full md:w-auto">
                {kategoriListesi.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setKategori(cat)}
                    className={`px-4 py-2 text-xs font-semibold rounded-full transition-all border ${kategori === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}
                  >
                    {cat === "all" ? "Tümü" : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div id="report-panel" className="overflow-x-auto min-h-[400px] p-4 bg-white dark:bg-slate-900">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Users size={48} className="text-indigo-200 dark:text-indigo-900/50 animate-pulse mb-4" />
                <p className="text-slate-500 font-medium">Kayıt dosyaları taranıyor...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-[300px] text-center">
                 <FileText size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
                 <p className="text-slate-500 font-medium">Bu kriterlere uygun bir hasta kaydı bulunamadı.</p>
               </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-8 w-1/3">Kullanıcı Profili</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fiziksel Veriler</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Temel Teşhis</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right pr-8">Kritiklik (VKİ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredUsers.map((user, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      key={idx} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    >
                      <td className="p-4 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <UserCircle2 size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.isim}</p>
                            <p className="text-xs text-slate-500">Kayıt ID: #AKIL-{100 + idx}-{user.kilo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Boy: {user.boy}cm</span>
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Kilo: {user.kilo}kg</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getBadgeClass(user.durum)}`}>
                          {user.durum}
                        </span>
                      </td>
                      <td className="p-4 pr-8 text-right">
                        <span className="text-xl font-black text-slate-800 dark:text-white">{user.vki}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* YENİ KULLANICI EKLEME MODALI */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold dark:text-white">Yeni Ziyaretçi Kaydı</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6">
                {saveSuccess ? (
                  <Alert variant="success" className="mb-4">{saveSuccess}</Alert>
                ) : (
                  <form onSubmit={handleSave} className="space-y-4">
                    <Input 
                      id="form-isim" 
                      label="İsim Soyisim" 
                      placeholder="Örn: Ahmet Yılmaz" 
                      value={isim}
                      onChange={(e) => setIsim(e.target.value)}
                      required 
                    />
                    <div className="flex gap-4">
                      <Input 
                        id="form-boy" 
                        label="Boy (cm)" 
                        type="number" 
                        placeholder="Örn: 175" 
                        value={boy}
                        onChange={(e) => setBoy(e.target.value)}
                        required 
                      />
                      <Input 
                        id="form-kilo" 
                        label="Kilo (kg)" 
                        type="number" 
                        placeholder="Örn: 70" 
                        value={kilo}
                        onChange={(e) => setKilo(e.target.value)}
                        required 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white" 
                      disabled={isSaving || !isim || !boy || !kilo}
                    >
                      {isSaving ? "Kaydediliyor..." : "Sisteme Eklensin"}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
