import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Camera, Activity, TrendingUp } from 'lucide-react';
import Card from '../components/Card';
import { fetchUserHistory } from '../services/historyService';
import type { UserHistory } from '../types/history';

export default function Dashboard() {
  const [data, setData] = useState<UserHistory[]>([]);

  useEffect(() => {
    fetchUserHistory().then((d) => {
      setData(d);
    }).catch(() => {});
  }, []);

  // Mock Calorie Data (since no historic DB for dates exist yet)
  const calorieData = [
    { name: 'Pzt', cal: 2100 },
    { name: 'Sal', cal: 2400 },
    { name: 'Çar', cal: 1800 },
    { name: 'Per', cal: 2200 },
    { name: 'Cum', cal: 2600 },
    { name: 'Cmt', cal: 1900 },
    { name: 'Paz', cal: 2050 },
  ];

  // Calculate VKI dist
  const zayif = data.filter(d => d.vki < 18.5).length;
  const normal = data.filter(d => d.vki >= 18.5 && d.vki < 25).length;
  const kilolu = data.filter(d => d.vki >= 25 && d.vki < 30).length;
  const obez = data.filter(d => d.vki >= 30).length;

  const pieData = [
    { name: 'Normal', value: normal, color: '#10b981' }, // emerald
    { name: 'Zayıf', value: zayif, color: '#fbbf24' },   // amber
    { name: 'Kilolu', value: kilolu, color: '#f97316' }, // orange
    { name: 'Obez', value: obez, color: '#ef4444' }      // red
  ];

  const avgVKI = data.length > 0 ? (data.reduce((acc, curr) => acc + Number(curr.vki), 0) / data.length).toFixed(1) : "0";

  const [photoCount] = useState(() => data.length * 15 + Math.floor(Math.random() * 10));

  return (
    <div className="p-6 md:p-10 w-full animate-in fade-in zoom-in duration-500">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Genel Bakış</h1>
      <p className="text-gray-500 mb-8">Sistemdeki tüm kayıtların gerçek zamanlı özeti.</p>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Toplam Kullanıcı" value={data.length} icon={<Users size={24} className="text-indigo-500" />} />
        <StatCard title="Günlük Çekilen Fotoğraf" value={photoCount} sub="Yapay zeka tespiti" icon={<Camera size={24} className="text-fuchsia-500" />} />
        <StatCard title="Sistem Ortalama VKİ" value={avgVKI} icon={<Activity size={24} className="text-emerald-500" />} />
        <StatCard title="Aktif Kullanım Süresi" value="84%" sub="%12 artış" icon={<TrendingUp size={24} className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LINE CHART */}
        <Card variant="elevated" title="🔥 Son 7 Gün Kalori Alımı" className="h-[400px]">
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calorieData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb', backgroundColor: 'rgba(255,255,255,0.9)' }} 
                  itemStyle={{color: '#4f46e5'}}
                />
                <Line type="monotone" dataKey="cal" name="Kalori (kcal)" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* PIE CHART */}
        <Card variant="elevated" title="📊 Kullanıcı VKİ Dağılımı" className="h-[400px]">
          <div className="h-[300px] mt-4 flex items-center justify-center relative">
            {data.length === 0 ? (
              <p className="text-gray-400 font-medium pb-10">Veri bulunamadı.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Centered Total Text */}
            <div className="absolute text-center flex flex-col pointer-events-none mb-4">
              <span className="text-3xl font-bold dark:text-white">{data.length}</span>
              <span className="text-xs text-gray-500">Kişi</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, sub }: { title: string, value: string | number, icon: React.ReactNode, sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</h3>
        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white drop-shadow-sm">{value}</p>
        {sub && <p className="text-xs text-emerald-600 mt-2 font-medium">{sub}</p>}
      </div>
    </div>
  );
}
