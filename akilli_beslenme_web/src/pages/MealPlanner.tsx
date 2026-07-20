import { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../config/firebase';
import { Calendar, Droplet, Plus, Sparkles, Trash2, X, Loader2, RefreshCw, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';

import {
  type MealPlanItem,
  getWeekStart,
  getTodayStr,
  fetchWeeklyPlan,
  generateAiPlan,
  addMealToPlan,
  deleteMealFromPlan,
  fetchWaterLog,
  updateWaterLog,
  calculateTotalCalories,
  calculateConfidenceScore,
} from '../services/mealPlanService';
import { getApiBaseUrl } from '../config/api';

const API_BASE = getApiBaseUrl();
const DEFAULT_DAILY_CALORIE = 2000;
const DEFAULT_VKI = 24.5;

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_FULL_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const TARGET_GLASSES = 8;

export default function MealPlanner() {
  // Plan verileri
  const [meals, setMeals] = useState<MealPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Su takibi
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [waterSaving, setWaterSaving] = useState(false);

  // Manuel öğün ekleme modalı
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addDayIndex, setAddDayIndex] = useState(0);
  const [addMealName, setAddMealName] = useState('');
  const [addMealType, setAddMealType] = useState('Kahvaltı');
  const [addMealCal, setAddMealCal] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  // Kullanıcı ayarları
  const [dailyCalorie, setDailyCalorie] = useState(DEFAULT_DAILY_CALORIE);
  const [vki, setVki] = useState(DEFAULT_VKI);
  const [userId, setUserId] = useState<string>('demo_user_001');
  const [profileLoading, setProfileLoading] = useState(true);

  // Polling interval
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const weekStart = getWeekStart();
  const todayStr = getTodayStr();

  // ===== Kullanıcı Profili Yükle (VKİ + Kalori Hedefi) =====
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) { setProfileLoading(false); return; }
      const uid = firebaseUser.uid;
      setUserId(uid);
      try {
        console.log("[Sistem] Kullanıcı profili senkronize ediliyor...");
        const res = await fetch(`${API_BASE}/kullanicilar/history/${uid}`);
        if (res.ok) {
          const history: any[] = await res.json();
          if (history.length > 0) {
            const latest = history[0]; 
            if (latest.vki) setVki(Number(latest.vki));
            const calculatedCalorie = latest.vki < 18.5 ? 2500 :
              latest.vki < 25 ? 2000 :
              latest.vki < 30 ? 1750 : 1500;
            setDailyCalorie(calculatedCalorie);
          }
        }
      } catch (e) {
        console.warn('[Sistem] Profil yüklenemedi, varsayılanlar devrede.', e);
      } finally {
        setProfileLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ===== Veri Çekme =====
  const loadPlan = useCallback(async () => {
    try {
      const data = await fetchWeeklyPlan(userId, weekStart);
      setMeals(data);
      setError(null);
    } catch (err) {
      console.error("[Sistem] Plan verisi çekilirken hata:", err);
      setError("Bağlantı sorunu: Plan verileri şu an senkronize edilemiyor.");
    } finally {
      setLoading(false);
    }
  }, [userId, weekStart]);

  const loadWater = useCallback(async () => {
    try {
      const log = await fetchWaterLog(userId, todayStr);
      setWaterGlasses(log.glasses || 0);
    } catch (err) {
      console.error("[Sistem] Su kaydı hatası:", err);
    }
  }, [userId, todayStr]);

  useEffect(() => {
    loadPlan();
    loadWater();
  }, [loadPlan, loadWater]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadPlan();
    }, 10000); // 10 saniyede bir sessiz güncelleme

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadPlan]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ===== 1. AI ile Otomatik Doldur =====
  const handleAiGenerate = async (regenerateAll = false) => {
    setAiLoading(true);
    setError(null);
    console.log("[Sistem] Akıllı öğün planı üretiliyor...");
    try {
      const filledDays = new Set(meals.map(m => m.dayIndex));
      const emptyDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !filledDays.has(d));
      const daysToFill = (regenerateAll || emptyDays.length === 0)
        ? [0, 1, 2, 3, 4, 5, 6]
        : emptyDays;

      const result = await generateAiPlan(
        userId,
        vki,
        dailyCalorie,
        weekStart,
        daysToFill
      );

      setSuccessMsg(result.message);
      await loadPlan(); 
    } catch (err: any) {
      console.error("[Sistem] Plan üretme hatası:", err);
      setError(err.message || "Akıllı analiz sistemi şu an yanıt vermiyor.");
    } finally {
      setAiLoading(false);
    }
  };

  // ===== 3. Su Takibi =====
  const handleWaterClick = async (idx: number) => {
    const newGlasses = idx < waterGlasses ? idx : idx + 1;
    setWaterGlasses(newGlasses); 
    setWaterSaving(true);

    try {
      await updateWaterLog(userId, todayStr, newGlasses);
    } catch (err) {
      console.error("[Sistem] Su kaydı güncellenemedi:", err);
      setWaterGlasses(waterGlasses);
    } finally {
      setWaterSaving(false);
    }
  };

  // ===== 4. Manuel Öğün Ekle =====
  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMealName || !addMealCal) return;

    setAddSaving(true);
    try {
      await addMealToPlan({
        userId,
        weekStart,
        dayIndex: addDayIndex,
        dayName: DAY_FULL_NAMES[addDayIndex],
        meal: addMealName,
        type: addMealType,
        calories: parseInt(addMealCal),
      });

      setSuccessMsg(`"${addMealName}" günlüğe eklendi.`);
      setAddMealName('');
      setAddMealCal('');
      setAddModalOpen(false);
      await loadPlan(); 
    } catch (err: any) {
      console.error("[Sistem] Öğün ekleme hatası:", err);
      setError("Kayıt sırasında teknik bir sorun oluştu.");
    } finally {
      setAddSaving(false);
    }
  };

  const handleDeleteMeal = async (docId: string) => {
    try {
      await deleteMealFromPlan(docId);
      setMeals(prev => prev.filter(m => m.id !== docId));
      setSuccessMsg("Kayıt silindi.");
    } catch (err) {
      console.error("[Sistem] Silme hatası:", err);
      setError("Silme işlemi gerçekleştirilemedi.");
    }
  };

  const openAddModal = (dayIdx: number) => {
    setAddDayIndex(dayIdx);
    setAddMealType('Kahvaltı');
    setAddMealName('');
    setAddMealCal('');
    setAddModalOpen(true);
  };

  const totalCalories = calculateTotalCalories(meals);
  const idealWeeklyCalories = dailyCalorie * 7;
  const completedMeals = meals.length;
  const totalPossible = 7 * 3; 
  const confidence = calculateConfidenceScore(totalCalories, idealWeeklyCalories);

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Kahvaltı': return 'text-amber-600 dark:text-amber-400';
      case 'Öğle': return 'text-sky-600 dark:text-sky-400';
      case 'Akşam': return 'text-violet-600 dark:text-violet-400';
      default: return 'text-indigo-500';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8 text-center md:text-left">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Akıllı Öğün Planlayıcı</h1>
          <p className="text-gray-500 font-medium">Haftalık beslenme rotanızı <span className="text-indigo-600 font-bold">Akıllı Analiz</span> desteğiyle oluşturun.</p>
        </div>
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-2xl hidden md:block">
          <Calendar size={32} className="text-indigo-600 dark:text-indigo-300" />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
            <Alert variant="error">{error}</Alert>
          </motion.div>
        )}
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
            <Alert variant="success">{successMsg}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ===== Haftalık Takvim ===== */}
        <div className="lg:col-span-8">
          <Card variant="elevated" className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                Haftalık Takvim
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-400">{weekStart}</span>
              </h2>
              <Button
                onClick={() => handleAiGenerate()}
                disabled={aiLoading}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 gap-2 border-0"
              >
                {aiLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Sistem Üretiyor...</>
                ) : (
                  <><Sparkles size={16} /> Akıllı Plan Oluştur</>
                )}
              </Button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 size={48} className="animate-spin text-indigo-500 mb-6" />
                <p className="text-slate-500 font-bold italic tracking-tight">Kişisel planınız senkronize ediliyor...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {DAY_NAMES.map((day, dIdx) => {
                  const dayMeals = meals.filter(m => m.dayIndex === dIdx);
                  return (
                    <div key={day} className="flex flex-col gap-3">
                      <div className="text-center font-black text-[10px] text-slate-400 dark:text-slate-600 pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-[0.2em]">{day}</div>

                      <div className="space-y-3 min-h-[350px] rounded-2xl p-1 transition-all">
                        {dayMeals.map((meal) => (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            key={meal.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${getTypeColor(meal.type)}`}>{meal.type}</span>
                              <div className="flex gap-1">
                                {meal.source === 'ai' && <Sparkles size={10} className="text-indigo-400" />}
                                <button
                                  onClick={() => meal.id && handleDeleteMeal(meal.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight">{meal.meal}</p>
                            <div className="flex items-center gap-1 mt-2">
                               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{meal.calories} kcal</p>
                            </div>
                          </motion.div>
                        ))}

                        <button
                          onClick={() => openAddModal(dIdx)}
                          className="w-full py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-300 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all flex items-center justify-center group"
                        >
                          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ===== Sağ Sütun: Widget'lar ===== */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* ===== Su Takibi ===== */}
          <Card variant="elevated" className="bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-900 dark:to-blue-950 overflow-hidden relative border-0 rounded-[2rem] p-8 shadow-xl shadow-cyan-500/20">
            <h3 className="text-2xl font-black text-white mb-1 z-10 relative flex items-center gap-2">
              Su Tüketimi
              {waterSaving && <Loader2 size={16} className="animate-spin opacity-60" />}
            </h3>
            <p className="text-sm font-bold text-cyan-100/80 mb-8 z-10 relative uppercase tracking-widest">GÜNLÜK HEDEF: {waterGlasses} / {TARGET_GLASSES}</p>

            <div className="grid grid-cols-4 gap-4 z-10 relative">
              {Array.from({ length: TARGET_GLASSES }).map((_, idx) => (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  key={idx}
                  onClick={() => handleWaterClick(idx)}
                  className={`aspect-square rounded-2xl flex items-center justify-center transition-all shadow-lg ${idx < waterGlasses ? 'bg-white text-cyan-600 shadow-white/20' : 'bg-cyan-400/30 text-white/40 border border-white/20 backdrop-blur-sm'}`}
                >
                  <Droplet fill={idx < waterGlasses ? "currentColor" : "none"} size={32} />
                </motion.button>
              ))}
            </div>

            <div className="absolute -bottom-16 -right-16 opacity-10 rotate-12 pointer-events-none">
              <Droplet size={240} fill="white" />
            </div>
          </Card>

          {/* ===== Haftalık Özet ===== */}
          <Card variant="outlined" className="rounded-3xl p-6 border-slate-200/60" title={<><BarChart size={18} className="text-slate-400" /> Haftalık Özet</>}>
            <ul className="space-y-4 text-sm mt-4">
              <li className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Planlanan Kalori</span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {totalCalories > 0 ? `${totalCalories.toLocaleString('tr-TR')} kcal` : '—'}
                </span>
              </li>
              <li className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Akıllı Sistem Skoru</span>
                <span className={`font-black ${getConfidenceColor(confidence.score)}`}>
                  {confidence.score > 0 ? `%${confidence.score}` : '—'}
                </span>
              </li>
              <li className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tamamlanan Öğün</span>
                <span className="font-black text-indigo-500">{completedMeals} / {totalPossible}</span>
              </li>
              <li className="flex justify-between items-center bg-slate-900 dark:bg-indigo-600 p-4 rounded-2xl text-white shadow-lg">
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Haftalık Hedef</span>
                <span className="text-lg font-black">{idealWeeklyCalories.toLocaleString('tr-TR')} kcal</span>
              </li>
            </ul>
          </Card>

          {/* ===== Plan Ayarları ===== */}
          <Card variant="outlined" className="rounded-3xl p-6 border-slate-200/60" title="Plan Parametreleri">
            <div className="space-y-4 mt-4">
              {profileLoading ? (
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 py-2 uppercase tracking-widest">
                  <Loader2 size={14} className="animate-spin" /> Veriler Senkronize Ediliyor...
                </div>
              ) : (
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">✓ PROFiL VERiLERi AKTİF</p>
              )}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Hedef Kalori</label>
                <input
                  type="number"
                  value={dailyCalorie}
                  onChange={(e) => setDailyCalorie(Number(e.target.value) || 2000)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Analiz Skoru (VKİ)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vki}
                  onChange={(e) => setVki(Number(e.target.value) || 24.5)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <Button
                onClick={() => handleAiGenerate(true)}
                disabled={aiLoading}
                className="w-full mt-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 text-white rounded-2xl py-4 font-black shadow-lg gap-2 border-0"
              >
                {aiLoading
                  ? <><Loader2 size={16} className="animate-spin" /> Yenileniyor...</>
                  : <><RefreshCw size={16} /> Planı Güncelle</>}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ===== Manuel Öğün Ekleme Modalı ===== */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20"
            >
              <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-black dark:text-white">
                  Öğün Ekle — <span className="text-indigo-500">{DAY_NAMES[addDayIndex]}</span>
                </h2>
                <button onClick={() => setAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                <form onSubmit={handleAddMeal} className="space-y-6">
                  <Input
                    id="meal-name"
                    label="Öğün İçeriği"
                    placeholder="Örn: Haşlanmış Yumurta & Peynir"
                    value={addMealName}
                    onChange={(e) => setAddMealName(e.target.value)}
                    required
                    className="rounded-2xl"
                  />

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Öğün Kategorisi</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Kahvaltı', 'Öğle', 'Akşam', 'Ara Öğün'].map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setAddMealType(t)}
                          className={`px-4 py-2 text-[10px] font-black uppercase tracking-tight rounded-full transition-all border ${
                            addMealType === t
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/30'
                              : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    id="meal-cal"
                    label="Enerji (kcal)"
                    type="number"
                    placeholder="Örn: 250"
                    value={addMealCal}
                    onChange={(e) => setAddMealCal(e.target.value)}
                    required
                    className="rounded-2xl"
                  />

                  <Button
                    type="submit"
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-indigo-500/20 border-0 transition-all hover:-translate-y-1"
                    disabled={addSaving || !addMealName || !addMealCal}
                  >
                    {addSaving ? "Senkronize Ediliyor..." : "Haftalık Plana Ekle"}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
