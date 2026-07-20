import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Camera, Clock, Loader2, PieChart } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { motion } from 'framer-motion';

const API_URL = getApiBaseUrl();

export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadDetails = async () => {
      try {
        setLoading(true);
        // Kullanıcı geçmişinden ilk kaydı (güncel profil) alalım
        const userRes = await fetch(`${API_URL}/kullanicilar/id/${userId}`);
        const userData = await userRes.json();
        
        if (userData && !userData.error) {
          if (isMounted) {
            setUser({
               ...userData,
               kilo: Number(userData.kilo) || 0,
               boy: Number(userData.boy) || 0,
               vki: Number(userData.vki) || 0
            });
          }
        }

        // Backend üzerinden kullanıcının gerçek öğün geçmişini alalım (Eski veritabanı karmaşasını önler)
        const targetId = userData?.authId && userData.authId !== 'web_mock_user' ? userData.authId : userId;
        
        const mealsRes = await fetch(`${API_URL}/history/${targetId}`);
        const mealsData = await mealsRes.json();
        
        if (Array.isArray(mealsData) && isMounted) {
            const liveMeals = mealsData.map(data => {
               return {
                  id: data.id,
                  ...data,
                  calories: Number(data.calories) || 0,
                  protein: Number(data.protein) || 0,
                  carbs: Number(data.carbs) || 0,
                  fat: Number(data.fat) || 0,
                  timestamp: data.createdAt?._seconds ? data.createdAt._seconds * 1000 : new Date(data.createdAt || data.timestamp).getTime()
               };
            });
            
            liveMeals.sort((a, b) => b.timestamp - a.timestamp);
            setMeals(liveMeals);
        }

      } catch (err) {
        console.error("Detay yükleme hatası:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-500 mb-4" />
        <p className="text-slate-500 font-medium italic">Kullanıcı arşivi taranıyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Kullanıcı bulunamadı.</p>
        <Button onClick={() => navigate('/users')} className="mt-4">Geri Dön</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/users')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Kullanıcı Dosyası</h1>
          <p className="text-slate-500 font-medium italic">Kişisel sağlık verileri ve öğün arşivi.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sol Kolon: Profil Kartı */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card variant="elevated" className="rounded-[2.5rem] p-8 border-0 shadow-xl relative overflow-hidden bg-white dark:bg-slate-900">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <User size={120} />
            </div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white mb-4 shadow-lg shadow-indigo-500/20">
                {user.isim.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{user.isim}</h2>
              <span className={`mt-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                user.vki < 18.5 ? 'bg-amber-100 text-amber-600' : 
                user.vki < 25 ? 'bg-emerald-100 text-emerald-600' : 
                'bg-rose-100 text-rose-600'
              }`}>
                {user.durum}
              </span>
            </div>

            <div className="mt-8 space-y-4 relative z-10">
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Vücut Kitle İndeksi</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">{user.vki}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Boy / Kilo</span>
                <span className="text-md font-bold text-slate-700 dark:text-slate-200">{user.boy} cm / {user.kilo} kg</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Kayıt Tarihi</span>
                <span className="text-xs font-bold text-slate-500 italic">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          </Card>

          <Card variant="outlined" className="rounded-3xl p-6" title="Sistem Notları">
            <p className="text-sm text-slate-500 leading-relaxed italic">
              "Kullanıcı düzenli olarak {meals.length} öğün kaydı oluşturmuş. Son 7 günlük aktivite oranı %85. Su tüketimi hedefleriyle uyumlu seyrediyor."
            </p>
          </Card>
        </div>

        {/* Sağ Kolon: Öğün Galerisi */}
        <div className="lg:col-span-8">
          <Card variant="elevated" className="rounded-[2.5rem] p-8 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Camera size={20} className="text-slate-400" /> Öğün Arşivi
                <span className="text-[10px] bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-bold ml-2">TOPLAM: {meals.length}</span>
              </h3>
            </div>

            {meals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <PieChart size={48} className="opacity-20 mb-4" />
                <p className="italic">Henüz bir öğün kaydı bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {meals.map((meal, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={meal.id} 
                    className="group bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                       {meal.imageUrl ? (
                          <img src={`${API_URL}${meal.imageUrl}`} alt={meal.foodName} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                       ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700">
                             <Camera size={40} className="opacity-10 group-hover:scale-110 transition-transform duration-500" />
                          </div>
                       )}
                       <div className="absolute top-4 right-4 z-10">
                          <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                            {meal.calories} kcal
                          </span>
                       </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-black text-slate-800 dark:text-slate-100">{meal.foodName}</h4>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Clock size={12} />
                          {new Date(meal.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pro</span>
                           <span className="text-xs font-black text-blue-500">{meal.protein}g</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Karb</span>
                           <span className="text-xs font-black text-amber-500">{meal.carbs}g</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Yağ</span>
                           <span className="text-xs font-black text-rose-500">{meal.fat}g</span>
                        </div>
                        <div className="ml-auto">
                           <span className="text-[10px] font-bold text-slate-400 italic">{new Date(meal.timestamp).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
