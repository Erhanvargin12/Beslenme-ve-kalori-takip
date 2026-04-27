import { useState, useEffect } from 'react';
import { Settings, Server, Database, Activity, Key, ShieldCheck, Mail, Save } from 'lucide-react';
import { motion } from 'framer-motion';

import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';

export default function Admin() {
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [geminiStatus] = useState<'online' | 'offline' | 'checking'>('online');
  
  const API_URL = `http://${window.location.hostname}:3000`;

  // Gerçek zamanlı sunucu kontrolü
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch(`${API_URL}/kullanicilar`, { method: 'GET' });
        if (res.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch {
        setServerStatus('offline');
      }
    };

    checkServer(); // İlk açılışta kontrol et
    const interval = setInterval(checkServer, 5000); // Her 5 saniyede bir kontrol et
    
    return () => clearInterval(interval);
  }, [API_URL]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Admin Paneli</h1>
          <p className="text-gray-500">Sistem yapılandırması, API anahtarları ve veritabanı ayarları.</p>
        </div>
        <div className="p-3 bg-red-100 dark:bg-rose-900/30 rounded-2xl hidden md:block">
          <Settings size={32} className="text-red-600 dark:text-rose-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Ayarlar ve Form */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          <Card variant="elevated" title="🔐 Güvenlik & API Yapılandırması">
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  id="gemini_key" 
                  label="Google Gemini Vision API Anahtarı" 
                  type="password" 
                  defaultValue="*********************************"
                  icon={<Key size={18} />}
                />
                <Input 
                  id="jwt_secret" 
                  label="JWT Oturum Anahtarı" 
                  type="password" 
                  defaultValue="*********************************"
                  icon={<ShieldCheck size={18} />}
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <Input 
                  id="admin_email" 
                  label="Sistem Yöneticisi E-Posta" 
                  type="email" 
                  defaultValue="koordinator@akillibeslenme.com"
                  icon={<Mail size={18} />}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button variant="ghost">İptal</Button>
                <Button className="font-bold flex gap-2"><Save size={18} /> Yapılandırmayı Kaydet</Button>
              </div>
            </div>
          </Card>

          <Card variant="outlined" title="💾 Veritabanı Modülü" className="border-rose-100 dark:border-rose-900/20">
            <p className="text-sm text-slate-500 mb-6">Mevcut sistem geçici JSON dosyaları üzerinden okuma/yazma yapmaktadır.</p>
            
            <Alert variant="warning" className="mb-4 text-sm font-medium">
              Sistemi JSON formatından çıkartıp MongoDB / PostgreSQL sunucusuna kalıcı göç (Migration) yapmak için bir veritabanı bağlantı dizesi (URI) girmelisiniz.
            </Alert>

            <Input 
              id="mongo_uri" 
              label="MongoDB Connection URI" 
              type="text" 
              placeholder="mongodb+srv://user:pass@cluster.mongodb.net/test"
              icon={<Database size={18} />}
            />
            <Button size="sm" variant="secondary" className="mt-4">Veritabanını MongoDB'ye Taşı (Deneysel)</Button>
          </Card>
        </div>

        {/* Sağ Kolon (Status) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card variant="elevated" title="Sistem Durumu">
            <div className="space-y-4 font-medium text-sm mt-4">
              
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Activity size={18} className="text-slate-400" /> Yapay Zeka (Gemini API)
                </div>
                {geminiStatus === 'checking' ? (
                  <span className="text-amber-500 animate-pulse flex items-center gap-2 text-xs font-bold uppercase"><div className="w-2 h-2 bg-amber-500 rounded-full" /> Kontrol</span>
                ) : geminiStatus === 'online' ? (
                  <span className="text-emerald-500 flex items-center gap-2 text-xs font-bold uppercase"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> Devrede</span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-2 text-xs font-bold uppercase"><div className="w-2 h-2 bg-rose-500 rounded-full" /> Kapalı</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Server size={18} className="text-slate-400" /> Node.js Sunucu (Core)
                </div>
                {serverStatus === 'online' ? (
                  <span className="text-emerald-500 flex items-center gap-2 text-xs font-bold uppercase"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> Devrede</span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-2 text-xs font-bold uppercase"><div className="w-2 h-2 bg-rose-500 rounded-full" /> Bağlantı Koptu</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Database size={18} className="text-slate-400" /> JSON Depolama
                </div>
                <span className="text-emerald-500 flex items-center gap-2 text-xs font-bold uppercase"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> Okuma/Yazma Aktif</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Sunucu Yükü (Tahmini)</h4>
              <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 mb-1">
                <motion.div initial={{ width: 0 }} animate={{ width: '12%' }} className="h-2 rounded-full bg-indigo-500" />
              </div>
              <p className="text-right text-xs text-slate-500">12% / 1GB RAM</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
