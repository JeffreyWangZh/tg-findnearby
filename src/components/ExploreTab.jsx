import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Target, CheckCircle2, BookmarkPlus, Loader2, Star, Target as TargetIcon } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { contactMerchantOwner } from '../utils/telegram';

export default function ExploreTab({ collections, setTag, onAddClick }) {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('status', 'approved') // Only show approved ones theoretically, or show all for testing
      .order('created_at', { ascending: false });

    // For demo purposes, if none are approved, fetch all
    if (!error && data.length > 0) {
      setMerchants(data);
    } else {
      const { data: allData } = await supabase.from('merchants').select('*').order('created_at', { ascending: false });
      setMerchants(allData || []);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Hero Card */}
      <div className="p-6 glass-card flex flex-col items-center text-center space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-1 relative z-10">
          <h2 className="text-[22px] font-black text-tg-text">发现附近好店</h2>
          <p className="text-sm text-tg-hint leading-relaxed font-medium">探索经过验证的优质本地商户</p>
        </div>
        <button 
          onClick={onAddClick}
          className="tg-button mt-2 active:scale-95"
        >
          我来推荐商户
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: merchants.length || '128', label: '已入驻商户', color: 'text-blue-500' },
          { num: '56', label: '本周新增', color: 'text-emerald-500' },
          { num: '1.2k', label: '用户贡献', color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 text-center space-y-1 flex flex-col items-center justify-center">
            <p className={clsx("text-2xl font-black font-mono tracking-tighter", stat.color)}>{stat.num}</p>
            <p className="text-[10px] font-bold text-tg-hint uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Merchants Feed */}
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-black text-tg-text mb-2 px-1">最新好店</h3>
        
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-tg-hint gap-3">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-sm font-bold">寻找周围的好店...</p>
          </div>
        ) : merchants.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-tg-hint gap-3 border border-dashed border-gray-300 rounded-3xl mx-1 bg-white/50 backdrop-blur" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)'}}>
            <MapPin size={40} className="text-gray-300" />
            <p className="text-sm font-bold text-tg-hint">附近暂无商户</p>
            <button onClick={onAddClick} className="text-xs font-bold text-blue-500">成第一个推荐的人</button>
          </div>
        ) : (
          merchants.map((merchant) => {
            const currentTag = collections[merchant.id]?.tag;
            return (
              <motion.div 
                key={merchant.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden"
              >
                {merchant.media_urls?.length > 0 && (
                  <div className="w-full aspect-[2/1] bg-gray-100 relative">
                    <img src={merchant.media_urls[0].url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/20">
                        {merchant.category}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-black text-tg-text leading-tight">{merchant.name}</h4>
                      <p className="text-xs text-tg-hint mt-1 flex items-center gap-1">
                        <MapPin size={12} /> {merchant.physical_address}
                      </p>
                    </div>
                    {/* Tag Buttons */}
                    <div className="flex bg-gray-100 rounded-lg p-1" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
                      <button 
                        onClick={() => setTag(merchant, '待打卡')}
                        className={clsx(
                          "px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1",
                          currentTag === '待打卡' ? "bg-amber-500 text-white shadow-sm" : "text-tg-hint hover:bg-black/5"
                        )}
                      >
                        <TargetIcon size={12} /> 待打卡
                      </button>
                      <button 
                        onClick={() => setTag(merchant, '已打卡')}
                        className={clsx(
                          "px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1",
                          currentTag === '已打卡' ? "bg-emerald-500 text-white shadow-sm" : "text-tg-hint hover:bg-black/5"
                        )}
                      >
                        <CheckCircle2 size={12} /> 已打卡
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
