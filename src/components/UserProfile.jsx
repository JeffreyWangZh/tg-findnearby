import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle2, Navigation, MessageCircle, ImageIcon, Coins, Plus, Calendar, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { getCurrentTgUser, contactMerchantOwner, FALLBACK_IMAGES } from '../utils/telegram';

const TABS = [
  { id: '待打卡', label: '待打卡', icon: Navigation, col: 'text-amber-500', bg: 'bg-amber-500' },
  { id: '已打卡', label: '已打卡', icon: CheckCircle2, col: 'text-emerald-500', bg: 'bg-emerald-500' },
  { id: '积分', label: '积分明细', icon: Coins, col: 'text-blue-500', bg: 'bg-blue-500' },
];

export default function UserProfile({ collections, setTag }) {
  const [activeTab, setActiveTab] = useState('待打卡');
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  
  const currentUser = getCurrentTgUser();

  // 整理收藏数据
  const items = useMemo(() => {
    return Object.values(collections || {}).sort((a, b) => b.savedAt - a.savedAt);
  }, [collections]);

  const filteredItems = items.filter(item => item.tag === activeTab);

  // 获取积分历史
  useEffect(() => {
    if (activeTab === '积分') {
      fetchPoints();
    }
  }, [activeTab]);

  const fetchPoints = async () => {
    setLoadingPoints(true);
    const { data } = await supabase
      .from('points_history')
      .select('*')
      .eq('tg_user_id', currentUser.id)
      .order('created_at', { ascending: false });
    
    setPointsHistory(data || []);
    setLoadingPoints(false);
  };

  const totalPoints = pointsHistory.reduce((sum, record) => sum + record.points, 0);

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="glass-card p-5 mt-4 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-1 flex-shrink-0">
          <div className="w-full h-full bg-white rounded-full border-2 border-transparent relative overflow-hidden flex items-center justify-center">
            <span className="text-xl font-black text-indigo-500">
              {currentUser.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
        <div className="flex-1 relative z-10">
          <h2 className="text-xl font-black text-tg-text">{currentUser.username}</h2>
          <div className="flex items-center gap-2 mt-1">
            <button 
              onClick={() => {
                WebApp.showConfirm('是否使用测试通道免费充值 5000 积分？', async (ok) => {
                  if(ok) {
                    await supabase.from('points_history').insert({ tg_user_id: currentUser.id, action: '模拟内购', points: 5000 });
                    if (activeTab === '积分') fetchPoints(); 
                    else setActiveTab('积分');
                  }
                })
              }}
              className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all rounded-full flex items-center gap-1 active:scale-95"
            >
              <Coins size={12} /> {activeTab === '积分' ? totalPoints : '查看总'} 积分 <Plus size={10}/>
            </button>
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
                : "text-tg-hint hover:bg-black/5"
            )}
            style={activeTab === tab.id ? { backgroundColor: 'var(--tg-theme-bg-color, #fff)' } : {}}
          >
            <tab.icon size={16} className={activeTab === tab.id ? tab.col : "opacity-50"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="space-y-3 pb-8">
        <AnimatePresence mode="popLayout">
          {activeTab === '积分' ? (
            /* Points History Render */
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              {loadingPoints ? (
                <div className="py-12 flex flex-col items-center justify-center text-tg-hint gap-2">
                  <Loader2 size={24} className="animate-spin" />
                  <p className="text-xs font-bold">载入中...</p>
                </div>
              ) : pointsHistory.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-tg-hint opacity-50">
                  <div className="w-16 h-16 rounded-2xl bg-gray-200 mb-3 flex items-center justify-center">
                    <Coins size={24} />
                  </div>
                  <p className="text-sm font-bold">暂无积分记录</p>
                  <p className="text-xs mt-1">去贡献评价或推荐商户赚取吧！</p>
                </div>
              ) : (
                <div className="glass-card divide-y divide-black/5">
                  {pointsHistory.map(record => (
                    <div key={record.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                          record.points > 0 ? "bg-emerald-500" : "bg-rose-500"
                        )}>
                          {record.points > 0 ? <Plus size={18} /> : <Coins size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-tg-text">{record.action}</p>
                          <p className="text-[10px] text-tg-hint flex items-center gap-1 mt-0.5">
                            <Calendar size={10} /> {new Date(record.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={clsx(
                        "text-lg font-black font-mono tracking-tighter",
                        record.points > 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {record.points > 0 ? '+' : ''}{record.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* Merchants Render */
            filteredItems.length === 0 ? (
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
              filteredItems.map((item) => {
                let imageUrl = null;
                try {
                  let media = item.media_urls;
                  if (typeof media === 'string') media = JSON.parse(media);
                  if (Array.isArray(media) && media.length > 0) imageUrl = media[0]?.url || media[0];
                } catch (e) {}
                imageUrl = imageUrl || FALLBACK_IMAGES[item.category] || FALLBACK_IMAGES['默认'];

                return (
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
                      <img src={imageUrl} className="w-full h-full object-cover" />
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

                        {TABS.filter(t => t.id !== '积分').map(t => (
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
                );
              })
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
