import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { HeartPulse, ScanLine, UserCircle, CalendarHeart, SlidersHorizontal, Moon, Sun, Menu, X, Leaf } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import UsersPage from './pages/Users';
import MealPlanner from './pages/MealPlanner';
import Admin from './pages/Admin';
import Login from './pages/Login';
import UserDetails from './pages/UserDetails';

import { auth } from './config/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import './index.css';

export default function App() {
  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const navItems = [
    { name: 'Günlüğüm', path: '/', icon: <HeartPulse size={20} /> },
    { name: 'Tabağını İncele', path: '/analyzer', icon: <ScanLine size={20} /> },
    { name: 'Topluluk', path: '/users', icon: <UserCircle size={20} /> },
    { name: 'Haftalık Planım', path: '/planner', icon: <CalendarHeart size={20} /> },
    { name: 'Ayarlar', path: '/admin', icon: <SlidersHorizontal size={20} /> },
  ];

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* We use bg-transparent here so the mesh gradient from body shows through */}
      <div className={`min-h-screen transition-colors duration-300 flex flex-col font-sans relative bg-transparent dark:bg-transparent`}>
        
        {/* HORIZONTAL NAVBAR */}
        <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/50 dark:border-slate-800/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-2">
                <Leaf className="w-7 h-7 text-emerald-500" />
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Akıllı Beslenme</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-2">
                <NavLinks items={navItems} closeMobile={() => setMobileMenuOpen(false)} isHorizontal />
              </nav>

              <div className="flex items-center gap-4">
                {user && (
                  <button 
                    onClick={() => { signOut(auth); localStorage.removeItem('authToken'); }}
                    className="text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors mr-2"
                  >
                    Çıkış
                  </button>
                )}
                <button onClick={toggleDark} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  {dark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-800 dark:text-slate-200">
                  {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE MENU */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800"
              >
                <div className="px-4 pt-2 pb-6 space-y-1">
                  <NavLinks items={navItems} closeMobile={() => setMobileMenuOpen(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* ANIMATED ROUTE TRANSITIONS */}
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
            {/* Protected Routes */}
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/analyzer" element={user ? <Analyzer /> : <Navigate to="/login" />} />
            <Route path="/users" element={user ? <UsersPage /> : <Navigate to="/login" />} />
            <Route path="/planner" element={user ? <MealPlanner /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user ? <Admin /> : <Navigate to="/login" />} />
            <Route path="/admin/user-details/:userId" element={user ? <UserDetails /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

function NavLinks({ items, closeMobile, isHorizontal }: { items: NavItem[], closeMobile: () => void, isHorizontal?: boolean }) {
  const location = useLocation();

  return (
    <>
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={closeMobile}
            className={`flex items-center gap-2.5 font-semibold tracking-tight transition-all ${
              isHorizontal 
                ? `px-4 py-2.5 rounded-full ${isActive ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'}`
                : `w-full p-4 rounded-2xl mb-2 ${isActive ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        );
      })}
    </>
  );
}
