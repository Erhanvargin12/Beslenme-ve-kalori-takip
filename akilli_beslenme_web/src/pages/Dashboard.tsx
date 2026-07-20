import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Camera, Activity, TrendingUp, Flame, PieChart as PieChartIcon, ScanLine, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { fetchDashboardStats } from '../services/historyService';
import type { UserHistory } from '../types/history';
import { db } from '../config/firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';

export default function Dashboard() {
  const [, setData] = useState<UserHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    dailyPhotoCount: 0,
    weeklyCalories: [] as { day: string, calories: number }[],
    activeUserRate: "0 dk",
    activeUserRateChange: 0,
    totalUsers: 0,
    avgVki: 0,
    vkiDistribution: { zayif: 0, normal: 0, kilolu: 0, obez: 0 },
    macroDistribution: { protein: 0, carbs: 0, fat: 0 }
  });

  useEffect(() => {
    setLoading(true);
    
    // 1. Listen for User History (Real-time feed)
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setData(users);
    }, (error) => {
      console.error("[Sistem] Kullanıcı verisi çekilirken hata:", error);
    });

    // 2. Fetch Dashboard Stats from Backend — GLOBAL (userId yok)
    const loadStats = async () => {
      try {
        const stats = await fetchDashboardStats(); // userId göndermiyoruz → genel istatistikler
        console.log("[Sistem] Dashboard istatistikleri güncellendi (GLOBAL):", stats);
        setDashboardStats(stats);
      } catch (err) {
        console.error("[Sistem] Dashboard verileri alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const intervalId = setInterval(loadStats, 30000);

    return () => {
      unsubUsers();
      clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-10 w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
        <Loader2 className="animate-spin h-12 w-12 text-emerald-500 mb-4" />
        <p className="text-slate-500 font-medium tracking-tight italic">Analiz verileri senkronize ediliyor...</p>
      </div>
    );
  }

  // VKİ Dağılım verisini grafik formatına çevir (Donut chart)
  const vkiData = [
    { name: 'Normal', value: dashboardStats.vkiDistribution?.normal || 0, color: '#10b981' },
    { name: 'Kilolu', value: dashboardStats.vkiDistribution?.kilolu || 0, color: '#f59e0b' },
    { name: 'Obez', value: dashboardStats.vkiDistribution?.obez || 0, color: '#ef4444' },
    { name: 'Zayıf', value: dashboardStats.vkiDistribution?.zayif || 0, color: '#8b5cf6' },
  ].filter(item => item.value > 0);
  
  const totalVkiUsers = vkiData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full animate-in fade-in zoom-in duration-500">
      
      {/* HERO AREA */}
      <div className="mb-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-white/60 dark:border-slate-700/50 shadow-sm">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Hoş geldin, bugün ne yedik?
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-0 font-medium leading-relaxed">
            Öğünlerini analiz et, kalorilerini takip et ve sağlıklı yaşam yolculuğunda <span className="text-emerald-600 dark:text-emerald-400 font-bold">akıllı analiz sisteminden</span> destek al.
          </p>
        </div>
        <div className="mt-8 md:mt-0 flex-shrink-0">
          <Link to="/analyzer" className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-5 rounded-full font-bold text-lg shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-1">
            <ScanLine size={24} />
            Makro Değer Analizi Yap
          </Link>
        </div>
      </div>

      {/* STAT CARDS — GLOBAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          title="Günlük Analizler" 
          value={dashboardStats.dailyPhotoCount} 
          sub="Otomatik Tanımlama" 
          icon={<Camera size={32} className="text-fuchsia-500" />} 
          gradient="from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20"
        />
        <StatCard 
          title="Sistem Ortalama VKİ" 
          value={dashboardStats.avgVki || "0.0"} 
          sub="Genel Ortalama"
          icon={<Activity size={32} className="text-emerald-500" />} 
          gradient="from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
        />
        <StatCard 
          title="Toplam Kullanıcı" 
          value={dashboardStats.totalUsers} 
          sub="Kayıtlı Profil"
          icon={<Users size={32} className="text-blue-500" />} 
          gradient="from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
        />
        <StatCard 
          title="Aktif Kullanım" 
          value={dashboardStats.activeUserRate} 
          sub={`%${dashboardStats.activeUserRateChange} değişim`} 
          icon={<TrendingUp size={32} className="text-amber-500" />} 
          gradient="from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LINE CHART — TÜM SİSTEM KALORİ VERİSİ */}
        <Card variant="elevated" title={<><Flame className="w-5 h-5 text-slate-500" /> Son 7 Gün Kalori Alımı</>} className="h-[400px]">
          <div className="h-[300px] mt-4">
            {dashboardStats.weeklyCalories.length === 0 ? (
               <div className="h-full flex items-center justify-center text-slate-400">Veri bulunamadı.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardStats.weeklyCalories}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="day" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb', backgroundColor: 'rgba(255,255,255,0.9)' }} 
                    itemStyle={{color: '#4f46e5'}}
                  />
                  <Line type="monotone" dataKey="calories" name="Kalori (kcal)" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* PIE CHART — KULLANICI VKİ DAĞILIMI */}
        <Card variant="elevated" title={<><PieChartIcon className="w-5 h-5 text-slate-500" /> Kullanıcı VKİ Dağılımı</>} className="h-[400px]">
          <div className="h-[300px] mt-4 flex items-center justify-center relative">
            {totalVkiUsers === 0 ? (
              <p className="text-gray-400 font-medium pb-10">İstatistiksel veri yok.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(value: number, name: string) => [`${value} Kişi`, name]} />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    formatter={(value) => <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                  />
                  <Pie
                    data={vkiData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {vkiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Centered Total Text */}
            {totalVkiUsers > 0 && (
              <div className="absolute text-center flex flex-col pointer-events-none" style={{ top: '38%', transform: 'translateY(-50%)' }}>
                <span className="text-3xl font-bold dark:text-white">{totalVkiUsers}</span>
                <span className="text-xs text-gray-500">Kişi</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, sub, gradient }: { title: string, value: string | number, icon: React.ReactNode, sub?: string, gradient: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-6 md:p-8 shadow-sm border border-white/60 dark:border-slate-700/50 flex items-center gap-6 hover:-translate-y-1 transition-transform`}>
      <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="text-xs font-semibold tracking-tight text-slate-500 dark:text-slate-400 uppercase mb-1">{title}</h3>
        <div className="flex flex-col">
           <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">{value}</p>
           {sub && <span className="text-[10px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400 uppercase mt-1">{sub}</span>}
        </div>
      </div>
    </div>
  );
}
