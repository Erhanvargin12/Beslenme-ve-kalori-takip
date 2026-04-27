import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Camera, Users, Calendar, Settings, Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import UsersPage from './pages/Users';
import MealPlanner from './pages/MealPlanner';
import Admin from './pages/Admin';

import './index.css';

export default function App() {
  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={20} /> },
    { name: 'AI Gıda Analizi', path: '/analyzer', icon: <Camera size={20} /> },
    { name: 'Kullanıcı Yönetimi', path: '/users', icon: <Users size={20} /> },
    { name: 'Öğün Planlayıcı', path: '/planner', icon: <Calendar size={20} /> },
    { name: 'Admin & Ayarlar', path: '/admin', icon: <Settings size={20} /> },
  ];

  return (
    <BrowserRouter>
      <div className={`min-h-screen transition-colors duration-300 ${dark ? 'dark bg-slate-900' : 'bg-slate-50'} flex flex-col md:flex-row font-sans`}>
        
        {/* MOBILE HEADER */}
        <div className="md:hidden flex justify-between items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">🌿 Akıllı Beslenme</h1>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-800 dark:text-gray-200">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* SIDEBAR NAVIGATION */}
        <AnimatePresence>
          {(mobileMenuOpen || window.innerWidth >= 768) && (
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={`${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-40 w-64' : 'hidden md:flex flex-col w-64'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm transition-colors`}
            >
              <div className="p-6 hidden md:block">
                <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex flex-col">
                  🌿 Akıllı Beslenme
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 mt-2 px-2 py-1 rounded w-fit">Pro Panel / v2.0</span>
                </h1>
              </div>

              <nav className="flex-1 px-4 py-8 md:py-4 space-y-2">
                <NavLinks items={navItems} closeMobile={() => setMobileMenuOpen(false)} />
              </nav>

              <div className="p-4 border-t border-gray-200 dark:border-gray-800 hidden md:block">
                <button
                  onClick={toggleDark}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {dark ? <Sun size={20} /> : <Moon size={20} />}
                  <span className="font-medium">{dark ? 'Aydınlık Tema' : 'Karanlık Tema'}</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-x-hidden pt-4 pb-12">
          {/* ANIMATED ROUTE TRANSITIONS */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyzer" element={<Analyzer />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/planner" element={<MealPlanner />} />
            <Route path="/admin" element={<Admin />} />
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

function NavLinks({ items, closeMobile }: { items: NavItem[], closeMobile: () => void }) {
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
            className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${
              isActive 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
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
