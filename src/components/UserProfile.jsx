import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle2, Navigation, MessageCircle, ImageIcon, Coins, Plus, Calendar, Loader2, Bookmark, GraduationCap, Play, FileText, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { getCurrentTgUser, contactMerchantOwner, FALLBACK_IMAGES } from '../utils/telegram';

const TABS = [
  { id: '待打卡', label: '待打卡', icon: Navigation, col: 'text-amber-500', bg: 'bg-amber-500' },
  { id: '已打卡', label: '已打卡', icon: CheckCircle2, col: 'text-emerald-500', bg: 'bg-emerald-500' },
  { id: '收藏教程', label: '收藏教程', icon: Bookmark, col: 'text-purple-500', bg: 'bg-purple-500' },
  { id: '积分', label: '积分明细', icon: Coins, col: 'text-blue-500', bg: 'bg-blue-500' },
];

const MOCK_TRAINING = [
  {
    id: 't1',
    title: '如何在 Telegram 获客：私域流量运营全指南',
    category: 'Marketing',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=200&fit=crop',
    duration: '12:45',
    summary: '针对实体店老板，通过 Bot 和 Channel 建立稳定的熟客社群。'
  },
  {
    id: 't2',
    title: '从 0 到 1：配置你的第一个 TG 自动回复机器人',
    category: 'Beginner',
    type: 'article',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop',
    duration: '5 min read',
    summary: '学会使用 BotFather，让你的商铺信息 24/7 自动响应客户咨询。'
  },
  {
    id: 't3',
    title: '门店经营进阶：利用数据分析提升到店率',
    category: 'Operations',
    type: 'article',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    duration: '8 min read',
    summary: '读懂用户点击量和分享率，精确定制你的推广活动。'
  },
  {
    id: 't4',
    title: '高级品牌塑造：在同城中脱颖而出的秘诀',
    category: 'Marketing',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
    duration: '15:20',
    summary: '如何通过高质量素材和好评返利建立本地知名度。'
  }
];

export default function UserProfile({ collections, setTag }) {
  const [activeTab, setActiveTab] = useState('待打卡');
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('training_bookmarks');
    if (saved) setBookmarkedIds(JSON.parse(saved));
  }, [activeTab]);
  
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
            <span className="text-xs text-tg-hint font-medium">收藏了 {items.length} 店 · {bookmarkedIds.length} 教程</span>
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
        <AnimatePresence mode="wait">
          {activeTab === '积分' ? (
            <motion.div
              key="points"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-3"
            >
              {loadingPoints ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin opacity-20" size={32} /></div>
              ) : pointsHistory.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-tg-hint opacity-50 px-10">
                   <Coins size={32} className="mb-3" />
                   <p className="text-sm font-bold truncate w-full text-center">暂无积分记录</p>
                </div>
              ) : (
                <div className="glass-card divide-y divide-black/5">
                  {pointsHistory.map(record => (
                    <div key={record.id} className="p-4 flex items-center justify-between active:bg-black/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm",
                          record.points > 0 ? "bg-emerald-500" : "bg-rose-500"
                        )}>
                          {record.points > 0 ? <Plus size={18} /> : <Coins size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-tg-text leading-tight">{record.action}</p>
                          <p className="text-[10px] text-tg-hint flex items-center gap-1 mt-1">
                            <Calendar size={10} /> {new Date(record.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={clsx(
                        "text-lg font-black font-mono tracking-tighter shrink-0 ml-4",
                        record.points > 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {record.points > 0 ? '+' : ''}{record.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === '收藏教程' ? (
            <motion.div
              key="training"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-4"
            >
               {MOCK_TRAINING.filter(m => bookmarkedIds.includes(m.id)).map(item => (
                  <div key={item.id} className="glass-card overflow-hidden flex items-stretch h-24 border border-black/5 active:scale-[0.99] transition-transform">
                     <div className="w-28 shrink-0 relative bg-gray-100">
                       <img src={item.thumbnail} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/10" />
                       <div className="absolute inset-0 flex items-center justify-center text-white">
                          <div className="p-1.5 bg-black/40 backdrop-blur-sm rounded-full">
                            {item.type === 'video' ? <Play size={16} fill="currentColor" /> : <FileText size={16} />}
                          </div>
                       </div>
                     </div>
                     <div className="p-3 flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-[13px] font-black text-tg-text truncate">{item.title}</h4>
                          <p className="text-[10px] text-tg-hint mt-1 truncate leading-tight opacity-80">{item.summary}</p>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{item.category}</span>
                           <button className="text-[11px] font-bold text-tg-link flex items-center gap-0.5">
                             继续学习 <ChevronRight size={14} />
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
               {bookmarkedIds.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-tg-hint gap-3 opacity-40">
                    <Bookmark size={40} strokeWidth={1.5} />
                    <p className="text-sm font-bold">还没有收藏过任何教程</p>
                    <p className="text-xs">学点实战技巧？去【学堂】看看</p>
                  </div>
               )}
            </motion.div>
          ) : (
            /* Merchants Render */
            <motion.div
              key="merchants"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredItems.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-tg-hint opacity-50">
                  <div className="w-16 h-16 rounded-2xl bg-gray-200 mb-3 flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <p className="text-sm font-bold">暂时没有{activeTab}的商户</p>
                  <p className="text-xs mt-1">去发现页逛逛吧</p>
                </div>
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
                  <div
                    key={item.id}
                    className="glass-card p-4 relative overflow-hidden group shadow-sm active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-start gap-1.5">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 relative border border-black/5 shadow-inner">
                        <img src={imageUrl} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0 py-0.5 pl-2">
                        <h3 className="text-base font-black text-tg-text truncate pr-8">{item.name}</h3>
                        <p className="text-[10px] font-bold text-tg-link mt-0.5 uppercase tracking-wider opacity-80">{item.category}</p>
                        <p className="text-[11px] text-tg-hint mt-2 truncate leading-tight">{item.physical_address}</p>
                        
                        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
                          <button 
                            onClick={() => contactMerchantOwner(item.owner_tg_id)}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all active:scale-90"
                          >
                            <MessageCircle size={14} />
                          </button>
                          
                          <div className="flex-1" />

                          {TABS.filter(t => !['积分', '收藏教程'].includes(t.id)).map(t => (
                            <button
                              key={t.id}
                              onClick={() => setTag(item, t.id)}
                              className={clsx(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all active:scale-95 whitespace-nowrap",
                                item.tag === t.id 
                                  ? `${t.bg} text-white border-transparent` 
                                  : "border-black/5 text-tg-hint bg-transparent hover:bg-black/5"
                              )}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
