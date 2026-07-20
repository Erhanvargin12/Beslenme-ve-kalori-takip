import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Filter, MoreVertical, Mail, ArrowRight, 
  Loader2, FileText, X, Send, UserX, RotateCcw, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Button from '../components/Button';
import { fetchUserHistory, saveUserVki } from '../services/historyService';
import { downloadFullReport } from '../services/reportService';
import type { UserHistory } from '../types/history';
import { getApiBaseUrl } from '../config/api';

const API_URL = getApiBaseUrl();

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // İşlem Durumları
  const [reportLoadingId, setReportLoadingId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  
  // Modal Durumları
  const [messageModalUser, setMessageModalUser] = useState<UserHistory | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Yeni Profil Modalı
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [newProfileForm, setNewProfileForm] = useState({ isim: '', boy: '', kilo: '' });
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Onay Modalı
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    authId?: string;
    type: 'deactivate' | 'reset';
    title: string;
    message: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await fetchUserHistory();
      setUsers(data);
    } catch (err) {
      console.error("[Sistem] Kullanıcı verileri alınamadı:", err);
      const message =
        err instanceof Error ? err.message : 'Kullanıcı listesi alınamadı.';
      setLoadError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter(user => 
    user.isim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Aksiyon Fonksiyonları ---

  const handleCreateProfile = async () => {
    const { isim, boy, kilo } = newProfileForm;
    if (!isim || !boy || !kilo) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }
    
    setIsCreatingProfile(true);
    try {
      await saveUserVki(isim, Number(boy), Number(kilo));
      alert('Yeni profil başarıyla oluşturuldu.');
      setIsNewProfileModalOpen(false);
      setNewProfileForm({ isim: '', boy: '', kilo: '' });
      loadUsers();
    } catch (err) {
      alert('Profil oluşturulurken bir hata oluştu.');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageModalUser || !messageText) return;

    const targetAuthId = messageModalUser.authId || messageModalUser.id;
    if (!messageModalUser.authId) {
      alert(
        'Bu kullanıcının Firebase authId kaydı yok; mesaj mobilde görünmeyebilir. Kullanıcının mobil uygulamadan en az bir kez giriş yapması gerekir.'
      );
    }

    setIsSending(true);
    console.log(`[Sistem] ${messageModalUser.isim} kullanıcısına mesaj gönderiliyor (${targetAuthId})...`);
    
    try {
      const response = await fetch(`${API_URL}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetAuthId,
          message: messageText,
          content: messageText,
        })
      });

      if (response.ok) {
        alert(`Mesaj başarıyla iletildi: ${messageModalUser.isim}`);
        setMessageModalUser(null);
        setMessageText('');
      } else {
        throw new Error("Mesaj gönderilemedi.");
      }
    } catch (err: any) {
      console.error("Mesaj gönderim hatası:", err);
      alert(`Hata: Mesaj iletilemedi.\nURL: ${API_URL}/notifications/send\nDetay: ${err.message || 'Sunucu bağlantısı kurulamadı.'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleAdminAction = async () => {
    if (!confirmAction) return;
    
    try {
      const endpoint = confirmAction.type === 'deactivate' 
        ? `${API_URL}/kullanicilar/deactivate/${confirmAction.userId}`
        : `${API_URL}/kullanicilar/reset/${confirmAction.authId || confirmAction.userId}`;

      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        alert(confirmAction.type === 'deactivate' ? "Kullanıcı pasife alındı." : "Veriler sıfırlandı.");
        loadUsers(); // Listeyi yenile
      } else {
        throw new Error("İşlem başarısız.");
      }
    } catch (err) {
      alert("Hata: İşlem gerçekleştirilemedi.");
    } finally {
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-500 mb-4" />
        <p className="text-slate-500 font-medium italic">Kullanıcı veritabanı taranıyor...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 relative">
      
      {/* Header Bölümü */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Profil Yönetimi</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Sistemdeki tüm kayıtlı kullanıcıların sağlık ve beslenme geçmişi.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter size={18} className="mr-2" /> Filtrele
          </Button>
          <Button 
            onClick={() => setIsNewProfileModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20"
          >
            <UserPlus size={18} className="mr-2" /> Yeni Profil
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold">Kullanıcı listesi yüklenemedi</p>
            <p className="mt-1 text-sm opacity-90">{loadError}</p>
            <button
              type="button"
              onClick={loadUsers}
              className="mt-3 text-sm font-semibold underline"
            >
              Tekrar dene
            </button>
          </div>
        </div>
      )}

      {/* Liste Kartı */}
      <Card className="p-0 overflow-visible border border-slate-200/60 dark:border-slate-700/50 shadow-sm rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 rounded-t-3xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="İsim veya profil ID ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/20">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Kullanıcı</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Fiziksel Bilgi</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Analiz Skoru (VKİ)</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Durum</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">Aranan kriterlere uygun kullanıcı bulunamadı.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center font-bold text-emerald-600">
                          {user.isim.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{user.isim}</p>
                          <p className="text-xs text-slate-400 font-mono">{user.id?.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{user.boy} cm / {user.kilo} kg</span>
                        <span className="text-[10px] text-slate-400">Yaş: —</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-black text-slate-800 dark:text-slate-100">{user.vki}</div>
                        <div className="w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full rounded-full ${user.vki < 18.5 ? 'bg-amber-400' : user.vki < 25 ? 'bg-emerald-500' : user.vki < 30 ? 'bg-orange-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, (user.vki / 40) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                        user.vki < 18.5 ? 'bg-amber-50 text-amber-600' : 
                        user.vki < 25 ? 'bg-emerald-50 text-emerald-600' : 
                        user.vki < 30 ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {user.vki < 18.5 ? 'Zayıf' : user.vki < 25 ? 'Normal' : user.vki < 30 ? 'Kilolu' : 'Obez'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right relative">
                       <div className="flex items-center justify-end gap-x-2">
                          
                          {/* Rapor İndir */}
                          <div className="relative group/tip">
                            <button 
                               disabled={reportLoadingId === user.id}
                               onClick={() => downloadFullReport(user.authId || user.id, user.isim, (v) => setReportLoadingId(v ? user.id : null))}
                               className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-500 hover:text-blue-700 transition-all duration-150 disabled:opacity-40 shadow-sm border border-blue-100 dark:border-blue-800/40"
                            >
                               {reportLoadingId === user.id ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                            </button>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none">
                              <span className="whitespace-nowrap bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-lg">Tam Geçmiş Raporu</span>
                              <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>

                          {/* Mesaj Gönder */}
                          <div className="relative group/tip">
                            <button 
                               onClick={() => setMessageModalUser(user)}
                               className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-500 hover:text-indigo-700 transition-all duration-150 shadow-sm border border-indigo-100 dark:border-indigo-800/40"
                            >
                               <Mail size={16} />
                            </button>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none">
                              <span className="whitespace-nowrap bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-lg">Mesaj Gönder</span>
                              <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>

                          {/* Profil Detayı */}
                          <div className="relative group/tip">
                            <button 
                               onClick={() => navigate(`/admin/user-details/${user.id}`)}
                               className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all duration-150 shadow-sm border border-slate-200 dark:border-slate-700"
                            >
                               <ArrowRight size={16} />
                            </button>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none">
                              <span className="whitespace-nowrap bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-lg">Profil Dosyası</span>
                              <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>

                          {/* Admin Menüsü */}
                          <div className="relative group/tip">
                            <div className="relative">
                              <button 
                                onClick={() => setActiveDropdownId(activeDropdownId === user.id ? null : user.id)}
                                className={`p-2.5 rounded-xl transition-all duration-150 shadow-sm border ${activeDropdownId === user.id ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 border-slate-200 dark:border-slate-700'}`}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {activeDropdownId !== user.id && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none">
                                  <span className="whitespace-nowrap bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-lg">Diğer İşlemler</span>
                                  <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                                </div>
                              )}

                              <AnimatePresence>
                                {activeDropdownId === user.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden"
                                  >
                                    <button 
                                      onClick={() => setConfirmAction({
                                        userId: user.id,
                                        type: 'deactivate',
                                        title: 'Kullanıcıyı Pasife Al',
                                        message: `${user.isim} isimli kullanıcıyı pasife almak istediğinize emin misiniz?`
                                      })}
                                      className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                    >
                                      <UserX size={14} className="text-rose-500" /> Pasife Al
                                    </button>
                                    <button 
                                      onClick={() => setConfirmAction({
                                        userId: user.id,
                                        authId: user.authId,
                                        type: 'reset',
                                        title: 'Verileri Sıfırla',
                                        message: `${user.isim} kullanıcısına ait tüm beslenme ve su kayıtlarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
                                      })}
                                      className="w-full px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors border-t border-slate-50 dark:border-slate-800"
                                    >
                                      <RotateCcw size={14} className="text-amber-500" /> Verileri Sıfırla
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                       </div>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- MODALLAR --- */}

      {/* 1. Hızlı Mesaj Modalı */}
      <AnimatePresence>
        {messageModalUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/10"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="text-emerald-500" /> Mesaj Gönder
                 </h2>
                 <button onClick={() => setMessageModalUser(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                    <X size={24} />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">{messageModalUser.isim.charAt(0)}</div>
                    <div>
                       <p className="text-sm font-black text-slate-800 dark:text-white">{messageModalUser.isim}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alıcı Profil</p>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mesaj İçeriği</label>
                    <textarea 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Kullanıcıya iletmek istediğiniz notu yazın..."
                      className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none"
                    />
                 </div>
                 <Button 
                   onClick={handleSendMessage}
                   disabled={isSending || !messageText}
                   className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 border-0 gap-2"
                 >
                    {isSending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    {isSending ? "Gönderiliyor..." : "Hızlı Mesajı İlet"}
                 </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Onay Modalı */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-rose-500/20"
            >
              <div className="p-8 text-center">
                 <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} className="text-rose-500" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{confirmAction.title}</h3>
                 <p className="text-slate-500 text-sm font-medium leading-relaxed">{confirmAction.message}</p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 flex gap-3">
                 <button 
                   onClick={() => setConfirmAction(null)}
                   className="flex-1 py-4 text-sm font-black text-slate-500 hover:text-slate-700 transition-colors"
                 >
                    Vazgeç
                 </button>
                 <button 
                   onClick={handleAdminAction}
                   className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-black shadow-lg shadow-rose-500/20 transition-all"
                 >
                    Onayla ve Uygula
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Yeni Profil Ekleme Modalı */}
      <AnimatePresence>
        {isNewProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/10"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="text-emerald-500" /> Yeni Profil Ekle
                 </h2>
                 <button onClick={() => setIsNewProfileModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                    <X size={24} />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">İsim Soyisim</label>
                    <input 
                      type="text"
                      value={newProfileForm.isim}
                      onChange={(e) => setNewProfileForm({ ...newProfileForm, isim: e.target.value })}
                      placeholder="Örn: Ahmet Yılmaz"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                 </div>
                 <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Boy (cm)</label>
                      <input 
                        type="number"
                        value={newProfileForm.boy}
                        onChange={(e) => setNewProfileForm({ ...newProfileForm, boy: e.target.value })}
                        placeholder="Örn: 180"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      />
                   </div>
                   <div className="flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Kilo (kg)</label>
                      <input 
                        type="number"
                        value={newProfileForm.kilo}
                        onChange={(e) => setNewProfileForm({ ...newProfileForm, kilo: e.target.value })}
                        placeholder="Örn: 75"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      />
                   </div>
                 </div>
                 <Button 
                   onClick={handleCreateProfile}
                   disabled={isCreatingProfile || !newProfileForm.isim || !newProfileForm.boy || !newProfileForm.kilo}
                   className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 border-0 gap-2"
                 >
                    {isCreatingProfile ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                    {isCreatingProfile ? "Oluşturuluyor..." : "Profili Oluştur"}
                 </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
