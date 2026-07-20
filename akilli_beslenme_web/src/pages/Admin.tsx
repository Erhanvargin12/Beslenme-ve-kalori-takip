import { useState } from 'react';
import { Settings, Server, Database, Activity, Key, ShieldCheck, Mail, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import { useSystemStatus } from '../hooks/useSystemStatus';
import { db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Admin() {
  const status = useSystemStatus();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Form State
  const [config, setConfig] = useState({
    geminiKey: 'AIzaSyDnFt7x5F4UiMoPcKYsvJY02n_y13X1LnM', 
    jwtSecret: 'akilli-beslenme-secret-2024',
    adminEmail: 'erhanvargin6@gmail.com'
  });

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    console.log("[Sistem] Admin yapılandırması güncelleniyor...");

    try {
      const configRef = doc(db, 'admin_settings', 'config');
      
      await setDoc(configRef, {
        ...config,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log("[Sistem] Yapılandırma Firestore'a başarıyla yazıldı.");
      setFeedback({ type: 'success', msg: 'Sistem yapılandırması başarıyla güncellendi.' });
      
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      console.error("[Sistem] Yapılandırma hatası:", error);
      setFeedback({ 
        type: 'error', 
        msg: `Yetki Hatası: ${error.message || 'Sistem ayarlarına erişim engellendi.'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8 text-center md:text-left">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Kontrol Merkezi</h1>
          <p className="text-gray-500 font-medium italic">Sistem altyapısı, API servisleri ve global parametre yönetimi.</p>
        </div>
        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl hidden md:block">
          <Settings size={32} className="text-rose-600 dark:text-rose-400" />
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Alert variant={feedback.type === 'success' ? 'info' : 'warning'} className="flex items-center gap-3 border-2 font-bold">
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {feedback.msg}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Ayarlar ve Form */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          <Card variant="elevated" className="rounded-3xl p-8" title="🔐 Güvenlik & API Parametreleri">
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  id="gemini_key" 
                  label="Akıllı Analiz (Gemini) API Anahtarı" 
                  type="password" 
                  value={config.geminiKey}
                  onChange={(e) => setConfig({ ...config, geminiKey: e.target.value })}
                  icon={<Key size={18} />}
                  className="rounded-2xl"
                />
                <Input 
                  id="jwt_secret" 
                  label="Güvenli Oturum (JWT) Anahtarı" 
                  type="password" 
                  value={config.jwtSecret}
                  onChange={(e) => setConfig({ ...config, jwtSecret: e.target.value })}
                  icon={<ShieldCheck size={18} />}
                  className="rounded-2xl"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <Input 
                  id="admin_email" 
                  label="Yönetici İletişim Kanalı" 
                  type="email" 
                  value={config.adminEmail}
                  onChange={(e) => setConfig({ ...config, adminEmail: e.target.value })}
                  icon={<Mail size={18} />}
                  className="rounded-2xl"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                <Button variant="ghost" disabled={loading} className="rounded-xl">Vazgeç</Button>
                <Button 
                  className="font-black flex gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-rose-600 dark:hover:bg-rose-500 rounded-xl px-8 shadow-lg shadow-rose-500/10 border-0" 
                  onClick={handleSave} 
                  disabled={loading}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {loading ? 'Güncelleniyor...' : 'Parametreleri Uygula'}
                </Button>
              </div>
            </div>
          </Card>

          <Card variant="outlined" title="💾 Veritabanı Küme Durumu" className="border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm bg-white/50 backdrop-blur-sm">
            <p className="text-sm text-slate-500 mb-8 font-medium italic">Sistem dökümanları Cloud Firestore üzerinde optimize edilmiş indekslerle saklanmaktadır.</p>
            
            <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">
                  <tr>
                    <th className="px-6 py-4">Sistem Koleksiyonu</th>
                    <th className="px-6 py-4 text-right">Kayıt Sayısı</th>
                    <th className="px-6 py-4 text-right">Sağlık</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {[
                    { key: 'users', label: 'Kullanıcı Profilleri' },
                    { key: 'meals', label: 'Öğün Kayıtları' },
                    { key: 'analyses', label: 'Analiz Arşivi' },
                    { key: 'weeklyPlans', label: 'Haftalık Programlar' },
                    { key: 'water_logs', label: 'Su Tüketim Verisi' }
                  ].map((item) => (
                    <tr key={item.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.label}</td>
                      <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                        {status.dbStats ? status.dbStats[item.key as keyof typeof status.dbStats] : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 uppercase tracking-tighter">
                          AKTİF
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sağ Kolon (Status) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card variant="elevated" className="rounded-3xl p-8 border-0 shadow-xl shadow-slate-200/50 dark:shadow-none" title="Anlık Sistem Metrikleri">
            <div className="space-y-4 font-bold text-xs mt-6">
              
              {/* AI Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Activity size={18} className="text-indigo-500" /> Analiz Motoru (AI)
                </div>
                {status.ai === 'AKTİF' ? (
                  <span className="text-emerald-500 flex items-center gap-2 text-[10px] uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> ÇALIŞIYOR</span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-2 text-[10px] uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> {status.ai}</span>
                )}
              </div>

              {/* Node.js Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Server size={18} className="text-emerald-500" /> Ana Sunucu (Node.js)
                </div>
                {status.server === 'AKTİF' ? (
                  <span className="text-emerald-500 flex items-center gap-2 text-[10px] uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> AKTİF</span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-2 text-[10px] uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> HATA</span>
                )}
              </div>

              {/* Cloud Firestore Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Database size={18} className="text-blue-500" /> Cloud Firestore
                </div>
                {status.firestore === 'BAĞLANTI AKTİF' ? (
                  <span className="text-emerald-500 flex items-center gap-2 text-[10px] uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> BAĞLI</span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-2 text-[10px] uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> HATALI</span>
                )}
              </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">İşlemci & Bellek Yükü</h4>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${status.memory.percentage}%` }} 
                  className={`h-full rounded-full shadow-lg ${status.memory.percentage > 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`} 
                />
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                 <span>Kullanım</span>
                 <span>{status.memory.label} (%{status.memory.percentage})</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
