import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { Bookmark, Play, Clock, Star, CheckCircle2, ChevronRight, Zap, Target, BarChart3, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { id: 'Beginner', label: 'Starting Out', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'Marketing', label: 'Growth & Ads', icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'Operations', label: 'Efficient Ops', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
]

export default function MerchantTraining() {
  const [activeCategory, setActiveCategory] = useState('Beginner');
  const [materials, setMaterials] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch training materials from Supabase
  useEffect(() => {
    fetchMaterials();
  }, [activeCategory]);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('training_materials')
      .select('*')
      .eq('category', activeCategory)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setMaterials(data);
    }
    setLoading(false);
  }

  const toggleBookmark = (id) => {
    if (bookmarks.includes(id)) {
      setBookmarks(bookmarks.filter(b => b !== id));
    } else {
      setBookmarks([...bookmarks, id]);
    }
    try {
      WebApp.HapticFeedback.impactOccurred('medium');
    } catch (e) { /* ignore outside TG */ }
  }

  const openMaterial = (material) => {
    WebApp.showPopup({
      title: material.title,
      message: `Open ${material.content_type === 'video' ? 'video player' : 'full article'}?`,
      buttons: [
        { type: 'default', text: 'Start' },
        { type: 'cancel', text: 'Later' }
      ]
    });
  }

  return (
    <div className="space-y-8">
      {/* Category Selector */}
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={clsx(
              "p-4 rounded-3xl flex flex-col items-center gap-2 transition-all active:scale-95 border",
              activeCategory === cat.id 
                ? `${cat.bg} border-gray-300/30 ring-2 ring-gray-300/20` 
                : "bg-gray-100 border-white/5 opacity-60 grayscale-[40%]"
            )}
          >
            <div className={clsx("p-2 rounded-xl bg-white/10", cat.color)}>
              <cat.icon size={20} />
            </div>
            <span className={clsx("text-[10px] font-black uppercase tracking-widest", activeCategory === cat.id ? cat.color : "text-tg-hint")}>
              {cat.id}
            </span>
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-2">
         <div className="flex flex-col">
            <h3 className="text-xl font-black text-tg-text uppercase tracking-tight italic">Recommended Content</h3>
            <p className="text-[10px] text-tg-hint font-bold uppercase tracking-widest mt-0.5">Custom training for your business</p>
         </div>
         <div className="p-2 bg-tg-secondary-bg rounded-xl border border-white/5">
            <BarChart3 size={16} className="text-tg-link" />
         </div>
      </div>

      {/* Material List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-tg-hint gap-3">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-tg-hint gap-3 grayscale opacity-40">
            <CheckCircle2 size={40} />
            <p className="text-xs font-bold uppercase tracking-widest">No materials found in this section</p>
          </div>
        ) : (
          materials.map((item) => (
            <motion.div 
              layout
              key={item.id}
              className="flex gap-4 p-4 glass-card relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                  {item.content_type === 'video' ? <Play size={40} /> : <Target size={40} />}
               </div>
               
               <div className="relative w-32 h-24 rounded-2xl overflow-hidden flex-shrink-0 group-hover:scale-[1.02] transition-transform shadow-lg border border-white/5">
                  <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-bold text-white uppercase tracking-tighter flex items-center gap-1">
                     {item.content_type === 'video' ? <Play size={8} fill="white" /> : <Clock size={8} />}
                     {item.duration}
                  </div>
               </div>

               <div className="flex flex-col flex-1 justify-between py-1">
                  <div className="space-y-1">
                     <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">{item.category}</span>
                     </div>
                     <h4 className="text-sm font-bold leading-snug line-clamp-2 text-tg-text group-hover:text-tg-link transition-colors">{item.title}</h4>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-1.5">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-bold text-tg-text">{Number(item.rating).toFixed(1)}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleBookmark(item.id)}
                          className={clsx(
                            "p-2 rounded-xl transition-all border",
                            bookmarks.includes(item.id) 
                              ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30 scale-105" 
                              : "bg-gray-100 text-gray-500 border-white/5 hover:bg-white/5"
                          )}
                        >
                           <Bookmark size={14} fill={bookmarks.includes(item.id) ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={() => openMaterial(item)}
                          className="p-2 bg-tg-button text-tg-button-text rounded-xl border border-white/10 active:scale-95 shadow-md"
                        >
                           <ChevronRight size={14} strokeWidth={3} />
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Gamification / Progress */}
      <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-blue-500/20 rounded-[32px] border border-white/10 relative overflow-hidden group shadow-xl">
         <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-all" />
         <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
               <h4 className="text-md font-black uppercase tracking-tight flex items-center gap-2">
                 Your Growth <span className="text-tg-link italic">Pro</span>
               </h4>
               <p className="text-[10px] font-medium text-tg-hint">Complete 2 more sessions for Level 3</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-tg-link font-black text-xs">
               Lvl 2
            </div>
         </div>
         <div className="mt-4 h-2 bg-black/20 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-tg-link w-2/3 shadow-[0_0_12px_rgba(51,144,236,0.6)]" />
         </div>
      </div>
    </div>
  )
}
