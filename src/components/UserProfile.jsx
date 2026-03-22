import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle2, Navigation, MessageCircle, Star, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import { contactMerchantOwner } from '../utils/telegram';

const TABS = [
  { id: '待打卡', label: '待打卡', icon: Navigation, col: 'text-amber-500', bg: 'bg-amber-500' },
  { id: '已打卡', label: '已打卡', icon: CheckCircle2, col: 'text-emerald-500', bg: 'bg-emerald-500' },
];

export default function UserProfile({ collections, setTag }) {
  const [activeTab, setActiveTab] = useState('待打卡');

  // 从对象中转为数组
  const items = useMemo(() => {
    return Object.values(collections || {}).sort((a, b) => b.savedAt - a.savedAt);
  }, [collections]);

  const filteredItems = items.filter(item => item.tag === activeTab);

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="glass-card p-5 mt-4 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-1 flex-shrink-0">
          <div className="w-full h-full bg-white rounded-full border-2 border-transparent relative overflow-hidden flex items-center justify-center">
            {/* 模拟头像 */}
            <span className="text-xl font-black text-indigo-500">Me</span>
          </div>
        </div>
        <div className="flex-1 relative z-10">
          <h2 className="text-xl font-black text-tg-text">我的空间</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">探索家 Lv.3</span>
            <span className="text-xs text-tg-hint font-medium">收藏了 {items.length} 个好店</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-2xl" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5",
              activeTab === tab.id 
                ? "bg-white text-tg-text shadow-sm" 
                : "text-tg-hint"
            )}
            style={activeTab === tab.id ? { backgroundColor: 'var(--tg-theme-bg-color, #fff)' } : {}}
          >
            <tab.icon size={16} className={activeTab === tab.id ? tab.col : "opacity-50"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3 pb-8">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-16 flex flex-col items-center justify-center text-tg-hint opacity-50"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-200 mb-3 flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <p className="text-sm font-bold">暂时没有{activeTab}的商户</p>
              <p className="text-xs mt-1">去发现页逛逛吧</p>
            </motion.div>
          ) : (
            filteredItems.map(item => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={item.id}
                className="glass-card p-4 relative overflow-hidden group"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 relative border border-black/5">
                    {item.media_urls?.[0]?.url ? (
                      <img src={item.media_urls[0].url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="text-base font-bold text-tg-text truncate pr-8">{item.name}</h3>
                    <p className="text-xs font-bold text-tg-link mt-0.5">{item.category}</p>
                    <p className="text-[11px] text-tg-hint mt-1.5 truncate">{item.physical_address}</p>
                    
                    {/* Action Bar */}
                    <div className="flex items-center gap-2 mt-2.5">
                      <button 
                        onClick={() => contactMerchantOwner(item.owner_tg_id)}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                      >
                        <MessageCircle size={14} />
                      </button>
                      
                      <div className="flex-1" />

                      {TABS.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTag(item, t.id)}
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all active:scale-95",
                            item.tag === t.id 
                              ? `${t.bg} text-white border-transparent` 
                              : "border-black/10 text-tg-hint bg-transparent hover:bg-black/5"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
