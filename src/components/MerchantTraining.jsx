import { useState, useEffect } from 'react'
import { Play, FileText, Bookmark, Search, GraduationCap, ChevronRight, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

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

const CATEGORIES = ['全部', 'Beginner', 'Marketing', 'Operations'];
const CATEGORY_MAP = {
  'Beginner': '入门基础',
  'Marketing': '营销增长',
  'Operations': '运营管理'
};

export default function MerchantTraining() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('training_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('training_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (id) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  if (selectedTutorial) {
     return (
        <div className="space-y-6">
           <button onClick={() => setSelectedTutorial(null)} className="flex items-center gap-1 text-sm font-bold text-tg-link active:scale-95">
              <ChevronRight className="rotate-180" size={16} /> 返回列表
           </button>
           
           <div className="glass-card overflow-hidden">
              <div className="aspect-video relative bg-black">
                 {selectedTutorial.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center">
                       <Play size={48} className="text-white/50" />
                       <div className="absolute inset-0 flex items-center justify-center text-white/80 font-bold text-xs bg-black/40">
                          视频播放器组件加载中...
                       </div>
                    </div>
                 ) : (
                    <img src={selectedTutorial.thumbnail} className="w-full h-full object-cover opacity-50" />
                 )}
              </div>
              <div className="p-5 space-y-4">
                 <h2 className="text-2xl font-black text-tg-text leading-tight">{selectedTutorial.title}</h2>
                 <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase">{selectedTutorial.category}</span>
                    <span className="text-[10px] text-tg-hint font-bold">{selectedTutorial.duration}</span>
                 </div>
                 <div className="prose prose-sm text-tg-text opacity-90 leading-relaxed font-medium">
                    <p>{selectedTutorial.summary}</p>
                    <div className="h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-6 flex items-center justify-center text-tg-hint text-xs italic">
                       教程详细正文加载完毕... (HTML5 内容)
                    </div>
                 </div>
              </div>
           </div>
        </div>
     );
  }

  const filtered = MOCK_TRAINING.filter(item => {
    const matchesCategory = activeCategory === '全部' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-6">
      <div className="px-1">
         <h2 className="text-2xl font-black text-tg-text flex items-center gap-2">
           <GraduationCap className="text-blue-500" size={26} />
           商家学堂
         </h2>
         <p className="text-sm text-tg-hint mt-1 font-medium">帮助您的生意在 Telegram 生根发芽</p>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-4 px-1">
        <div className="flex bg-white rounded-2xl shadow-sm border border-black/5 items-center px-4 py-3">
          <Search size={18} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="搜索教程标题或内容..."
            className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                activeCategory === cat 
                  ? "bg-blue-500 text-white border-transparent shadow-lg shadow-blue-500/20" 
                  : "bg-white text-tg-hint border-black/5"
              )}
            >
              {CATEGORY_MAP[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-5 px-1">
        {filtered.map((item, idx) => {
          const isBookmarked = bookmarks.includes(item.id);
          return (
            <div key={item.id} onClick={() => setSelectedTutorial(item)} className="glass-card overflow-hidden group active:scale-[0.98] transition-transform">
              <div className="relative aspect-[21/9] overflow-hidden">
                <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-2 right-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                    className={clsx(
                      "p-1.5 rounded-lg border backdrop-blur-md transition-all",
                      isBookmarked ? "bg-amber-500 text-white border-amber-400" : "bg-black/30 text-white/80 border-white/20"
                    )}
                   >
                     <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
                   </button>
                </div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                  {item.type === 'video' ? <Play size={10} fill="currentColor" /> : <FileText size={10} />}
                  {item.duration}
                </div>
                {item.category === 'Beginner' && (
                   <span className="absolute bottom-2 right-2 px-2 py-1 bg-emerald-500/90 backdrop-blur-md rounded-lg text-[9px] font-black text-white">
                     必修基础
                   </span>
                )}
              </div>
              <div className="p-4">
                 <div className="flex justify-between items-start gap-3">
                   <h3 className="text-[15px] font-black text-tg-text leading-snug">{item.title}</h3>
                 </div>
                 <p className="text-xs text-tg-hint mt-1.5 leading-relaxed truncate-2">{item.summary}</p>
                 <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wide">
                      {item.category}
                    </span>
                    <button className="flex items-center gap-1 text-[11px] font-bold text-tg-link">
                      立即开始 <ChevronRight size={14} />
                    </button>
                 </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <GraduationCap className="mx-auto text-gray-200" size={48} />
            <p className="text-sm font-bold text-gray-300">暂时没有找到相关教程</p>
          </div>
        )}
      </div>

      {/* Rewards Toast */}
      <div className="mx-1 p-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
         <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
         <div className="relative z-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
               <CheckCircle2 size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-blue-100 opacity-80 uppercase tracking-widest">学习有奖</p>
               <h4 className="font-black text-[15px]">完成每篇教程可获 +5 积分</h4>
            </div>
         </div>
      </div>
    </div>
  )
}
