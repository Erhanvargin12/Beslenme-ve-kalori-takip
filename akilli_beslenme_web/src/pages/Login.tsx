import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Mail, Lock, AlertCircle, ArrowRight, Activity, HeartPulse } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/');
      }
    } catch (err: any) {
      // Firebase auth error translation
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-posta adresi veya şifre hatalı.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi ile zaten bir hesap mevcut.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifreniz en az 6 karakter olmalıdır.');
      } else {
        setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-emerald-300/10 blur-[80px] pointer-events-none" />

      {/* LEFT PANEL - BRANDING */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <Leaf className="w-8 h-8 text-emerald-500" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Akıllı Beslenme
            </span>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-md"
          >
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
              Sağlıklı Yaşam <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                Sizin Elinizde
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Yapay zeka destekli analizlerle öğünlerinizi takip edin, kalori hedeflerinizi yönetin ve kişisel sağlık asistanınızla tanışın.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex gap-8"
        >
          <div className="flex items-center gap-3">
            <Activity className="text-emerald-500 w-5 h-5" />
            <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">Gelişmiş AI Analizi</span>
          </div>
          <div className="flex items-center gap-3">
            <HeartPulse className="text-teal-500 w-5 h-5" />
            <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">Kişisel Sağlık Verileri</span>
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-slate-700/50"
        >
          {/* Mobile Header (Only visible on small screens) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden justify-center">
            <div className="bg-emerald-500/10 p-2 rounded-xl">
              <Leaf className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Akıllı Beslenme
            </span>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              {isLogin ? 'Tekrar Hoş Geldiniz' : 'Aramıza Katılın'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {isLogin ? 'Devam etmek için bilgilerinizi girin.' : 'Sağlık yolculuğunuza bugün başlayın.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-start gap-3 border border-red-100 dark:border-red-900/30"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">E-posta Adresi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="ornek@mail.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Şifre</label>
                {isLogin && (
                  <button type="button" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                    Şifremi Unuttum
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all font-medium tracking-widest"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex items-center justify-center py-4 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-2xl font-bold tracking-tight shadow-xl shadow-slate-900/10 dark:shadow-emerald-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Sisteme Giriş Yap' : 'Hesabımı Oluştur'}
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {isLogin ? 'Hesabınız yok mu?' : 'Zaten bir hesabınız var mı?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors focus:outline-none"
              >
                {isLogin ? 'Ücretsiz Kayıt Olun' : 'Giriş Yapın'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
