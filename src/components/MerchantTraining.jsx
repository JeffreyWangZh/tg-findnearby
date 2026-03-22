import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { Bookmark, Play, Clock, Star, CheckCircle2, ChevronRight, Zap, Target, BarChart3, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { id: 'Beginner', label: '入门基础', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'Marketing', label: '营销增长', icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'Operations', label: '高效运营', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
]

export default function MerchantTraining() {
  const [activeCategory, setActiveCategory] = useState('Beginner');
  const [materials, setMaterials] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

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
      message: `即将打开${material.content_type === 'video' ? '视频教程' : '图文文章'}`,
      buttons: [
        { type: 'default', text: '立即查看' },
        { type: 'cancel', text: '稍后再看' }
      ]
    });
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-2.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={clsx(
              "p-3.5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border",
              activeCategory === cat.id 
                ? `${cat.bg} border-gray-200 shadow-sm` 
                : "border-transparent opacity-50"
            )}
            style={activeCategory !== cat.id ? { backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)' } : {}}
          >
            <div className={clsx("p-1.5 rounded-lg", cat.color)}>
              <cat.icon size={18} />
            </div>
            <span className={clsx("text-[10px] font-bold", activeCategory === cat.id ? cat.color : "text-tg-hint")}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
         <div>
            <h3 className="text-base font-black text-tg-text">推荐课程</h3>
            <p className="text-[11px] text-tg-hint mt-0.5">专为商户定制的成长内容</p>
         </div>
      </div>

      {/* Material List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-tg-hint gap-2">
            <Loader2 size={28} className="animate-spin opacity-40" />
            <p className="text-xs font-bold">加载中...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-tg-hint gap-2 opacity-40">
            <CheckCircle2 size={36} />
            <p className="text-xs font-bold">暂无相关内容</p>
          </div>
        ) : (
          materials.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-3.5 p-3.5 glass-card relative overflow-hidden group active:scale-[0.99] transition-transform"
              onClick={() => openMaterial(item)}
            >
               {/* Thumbnail */}
               <div className="relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-black/5">
                  <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9px] font-bold text-white flex items-center gap-0.5">
                     {item.content_type === 'video' ? <Play size={7} fill="white" /> : <Clock size={7} />}
                     {item.duration}
                  </div>
               </div>

               {/* Info */}
               <div className="flex flex-col flex-1 justify-between py-0.5 min-w-0">
                  <div>
                     <h4 className="text-sm font-bold leading-snug text-tg-text line-clamp-2">{item.title}</h4>
                     <p className="text-[11px] text-tg-hint mt-1 line-clamp-1">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-1.5">
                     <div className="flex items-center gap-1">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <span className="text-[11px] font-bold text-tg-text">{Number(item.rating).toFixed(1)}</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                          className={clsx(
                            "p-1.5 rounded-lg transition-all",
                            bookmarks.includes(item.id) 
                              ? "bg-blue-500 text-white shadow-md" 
                              : "text-gray-400 hover:text-tg-link"
                          )}
                        >
                           <Bookmark size={13} fill={bookmarks.includes(item.id) ? "currentColor" : "none"} />
                        </button>
                        <div className="p-1.5 bg-tg-button text-tg-button-text rounded-lg">
                           <ChevronRight size={13} strokeWidth={3} />
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Growth Progress Card */}
      <div className="p-5 bg-gradient-to-br from-indigo-600/15 to-blue-500/15 rounded-2xl border border-indigo-500/10 relative overflow-hidden">
         <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/15 blur-2xl" />
         <div className="flex items-center justify-between relative z-10">
            <div>
               <h4 className="text-sm font-black text-tg-text flex items-center gap-1.5">
                 我的成长 <span className="text-tg-link text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">Pro</span>
               </h4>
               <p className="text-[11px] text-tg-hint mt-1">再完成 2 节课即可升至 Lv.3</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-tg-link font-black text-xs">
               Lv.2
            </div>
         </div>
         <div className="mt-3.5 h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div className="h-full bg-tg-link w-2/3 rounded-full shadow-[0_0_8px_rgba(51,144,236,0.5)]" />
         </div>
      </div>
    </div>
  )
}
