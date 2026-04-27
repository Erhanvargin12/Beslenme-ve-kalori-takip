import { useState } from 'react';
import { Calendar, Droplet, Plus, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import Button from '../components/Button';

export default function MealPlanner() {
  const [waterGlasses, setWaterGlasses] = useState(3);
  const targetGlasses = 8;
  
  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const mockupMeals = [
    { day: 0, meal: "Yulaf & Çilek", type: "Kahvaltı", cal: 320 },
    { day: 0, meal: "Izgara Somon", type: "Akşam", cal: 550 },
    { day: 1, meal: "Avokado Tost", type: "Kahvaltı", cal: 400 },
    { day: 2, meal: "Tavuklu Salata", type: "Öğle", cal: 350 },
    { day: 3, meal: "Detoks Suyu", type: "Ara Öğün", cal: 50 },
  ];

  const handleWaterClick = (idx: number) => {
    if (idx < waterGlasses) {
      setWaterGlasses(idx); // Click filled glass to remove one
    } else {
      setWaterGlasses(idx + 1); // Click empty glass to fill up to it
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Akıllı Öğün Planlayıcı</h1>
          <p className="text-gray-500">Gelecek haftanızı AI tavsiyeleri gölgesinde planlayın.</p>
        </div>
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-2xl hidden md:block">
          <Calendar size={32} className="text-indigo-600 dark:text-indigo-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Weekly Calendar */}
        <div className="lg:col-span-8">
          <Card variant="elevated" className="h-full bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Haftalık Takvim</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30">AI ile Otomatik Doldur</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {days.map((day, dIdx) => (
                <div key={day} className="flex flex-col gap-3">
                  <div className="text-center font-bold text-sm text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest">{day}</div>
                  
                  <div className="space-y-3 min-h-[300px] border-2 border-dashed border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-xl p-1 transition-colors">
                    {mockupMeals.filter(m => m.day === dIdx).map((meal, mIdx) => (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        key={mIdx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab hover:shadow-md transition-shadow group"
                      >
                       <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">{meal.type}</span>
                        <MoreHorizontal size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                       </div>
                       <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{meal.meal}</p>
                       <p className="text-xs text-slate-400 mt-1">{meal.cal} kcal</p>
                      </motion.div>
                    ))}
                    
                    <button className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Widgets Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Water Tracker */}
          <Card variant="elevated" className="bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-slate-800 dark:to-cyan-900 overflow-hidden relative border-0">
            <h3 className="text-xl font-black text-cyan-800 dark:text-cyan-100 mb-2 z-10 relative">Su Tüketimi</h3>
            <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300 mb-6 z-10 relative">Bugünkü Hedef: {waterGlasses} / {targetGlasses}</p>

            <div className="grid grid-cols-4 gap-4 z-10 relative">
              {Array.from({ length: targetGlasses }).map((_, idx) => (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  key={idx}
                  onClick={() => handleWaterClick(idx)}
                  className={`aspect-square rounded-2xl flex items-center justify-center transition-all shadow-sm ${idx < waterGlasses ? 'bg-cyan-500 text-white shadow-cyan-500/30 font-bold' : 'bg-white/60 dark:bg-slate-900/40 text-cyan-300 dark:text-cyan-700 border border-cyan-200 dark:border-cyan-800/50'}`}
                >
                  <Droplet fill={idx < waterGlasses ? "currentColor" : "none"} size={28} />
                </motion.button>
              ))}
            </div>

            <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12 pointer-events-none">
              <Droplet size={200} fill="currentColor" className="text-cyan-600" />
            </div>
          </Card>

          {/* Tips / Summary */}
          <Card variant="outlined" title="Haftalık Özet">
            <ul className="space-y-4 text-sm mt-2">
              <li className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Planlanan Kalori</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">12,450 kcal</span>
              </li>
              <li className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">AI Güven Skoru</span>
                <span className="font-bold text-emerald-500">%94 (Mükemmel)</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Tamamlanan Öğün</span>
                <span className="font-bold text-indigo-500">2 / 21</span>
              </li>
            </ul>
          </Card>
        </div>

      </div>
    </div>
  );
}
