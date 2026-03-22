import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Target, CheckCircle2, Loader2, Star, Target as TargetIcon, Search, Filter } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

import { FALLBACK_IMAGES } from '../utils/telegram';
import { useRef } from 'react';

function MerchantImageCarousel({ images }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const nextIdx = (index + 1) % images.length;
        const width = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({ left: nextIdx * width, behavior: 'smooth' });
        setIndex(nextIdx);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [images, index]);

  return (
    <div className="w-full h-full relative group overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar" 
        style={{ scrollBehavior: 'smooth' }}
        onScroll={(e) => {
           const idx = Math.round(e.target.scrollLeft / e.target.offsetWidth);
           if (idx !== index) setIndex(idx);
        }}
      >
        {images.map((img, i) => (
          <img key={i} src={img} className="w-full h-full object-cover flex-shrink-0 snap-center" />
        ))}
      </div>
      
      {images.length > 1 && (
        <div className="absolute top-3 right-3 flex gap-1 z-10 bg-black/40 px-1.5 py-1 rounded-full backdrop-blur-md">
           {images.map((_, i) => (
             <div key={i} className={clsx("w-1.5 h-1.5 rounded-full transition-all", i === index ? "bg-white w-3" : "bg-white/40")} />
           ))}
        </div>
      )}
    </div>
  );
}

export default function ExploreTab({ currentGeo, collections, setTag, onAddClick, onMerchantClick }) {
  const FILTERS = ['全部', '最新探店', '品牌认领', '活动精选'];
  const [activeFilter, setActiveFilter] = useState('全部');
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Extract unique tags assigned by the user to ANY merchant
  const availableTags = Array.from(new Set(Object.values(collections).map(v => v.tag).filter(Boolean)));

  // Haversine formula calculation for real-world distance
  const getDistanceNum = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  const formatDistance = (dist) => {
    if (dist === Infinity) return '';
    if (dist < 1) return (dist * 1000).toFixed(0) + 'm';
    return dist.toFixed(1) + 'km';
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('merchants')
      .select('*, reviews(id)')
      .order('is_sponsored', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!error) setMerchants(data || []);
    setLoading(false);
  };

  const filteredMerchants = merchants
    .map(m => {
       const distNum = getDistanceNum(currentGeo?.lat, currentGeo?.lng, m.lat, m.lng);
       return { ...m, distanceNum: distNum, distanceStr: formatDistance(distNum) };
    })
    .filter(m => m.distanceNum <= 80) // Only show merchants within an 80km radius of the selected city/point
    .filter(m => {
       if (activeFilter === '最新探店') return (m.reviews?.length || 0) < 5;
       if (activeFilter === '品牌认领') return m.is_verified;
       if (activeFilter === '活动精选') return m.deal_title || m.is_sponsored;
       return true;
    })
    .filter(m => {
       if (!searchQuery.trim()) return true;
       return m.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    })
    .filter(m => {
       if (selectedTags.length === 0) return true;
       const userTag = collections[m.id]?.tag;
       return selectedTags.includes(userTag);
    })
    .sort((a,b) => {
       // Sponsored ALWAYS overrides distance and stays sticky physically on top
       if (a.is_sponsored && !b.is_sponsored) return -1;
       if (!a.is_sponsored && b.is_sponsored) return 1;
       // Afterwards, sort strictly by physical distance to the user's selected location map pin
       return a.distanceNum - b.distanceNum;
    });

  return (
    <div className="space-y-2 pb-8">
      {/* Hero Card */}
      {/* <div className="p-6 glass-card flex flex-col items-center text-center space-y-4 relative overflow-hidden">
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
      </div> */}

      {/* Quick Stats */}
      {/* <div className="grid grid-cols-3 gap-3">
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
      </div> */}

      {/* Filter Stats Feed */}
      <div className="space-y-4 pt-2">
        {/* Search and Tag Dropdown */}
        <div className="flex gap-2 relative px-1 z-30">
          <div className="flex-1 bg-white rounded-xl shadow border border-black/5 flex items-center px-3 py-2">
            <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="搜索商户名称..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 text-[13px] outline-none bg-transparent placeholder-gray-400"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={clsx(
                "h-full px-3.5 bg-white rounded-xl shadow border border-black/5 flex items-center gap-1.5 text-[13px] font-bold transition-all active:scale-95",
                selectedTags.length > 0 ? "text-blue-600 border-blue-200 bg-blue-50" : "text-tg-text"
              )}
            >
              <Filter size={14} className={selectedTags.length > 0 ? "text-blue-500" : "text-gray-400"} /> 
              {selectedTags.length > 0 ? `已选(${selectedTags.length})` : '标签筛选'}
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                   <motion.div 
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 5 }}
                     transition={{ duration: 0.15 }}
                     className="absolute right-0 top-full mt-2 w-[160px] bg-white rounded-2xl shadow-xl border border-black/5 p-1.5 z-50 flex flex-col gap-0.5"
                   >
                     {availableTags.length === 0 ? (
                       <div className="p-3 text-center text-xs text-gray-400 font-medium">您还没有添加过任何店铺标签</div>
                     ) : (
                       availableTags.map(tag => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button 
                              key={tag}
                              onClick={() => {
                                setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                              }}
                              className={clsx(
                                "text-left px-3 py-2 rounded-xl text-[13px] font-bold transition-colors flex items-center justify-between",
                                isSelected ? "bg-blue-50 text-blue-600" : "hover:bg-gray-50 text-gray-700 active:bg-gray-100"
                              )}
                            >
                              <span className="truncate pr-2">{tag}</span>
                              {isSelected && <CheckCircle2 size={14} className="flex-shrink-0" />}
                            </button>
                          )
                       })
                     )}
                   </motion.div>
                 </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 mb-2 mt-4">
           <h3 className="text-lg font-black text-tg-text">最新好店</h3>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 px-1 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 border",
                activeFilter === f
                  ? "bg-tg-text text-tg-bg border-transparent shadow-sm"
                  : "bg-black/5 text-tg-hint border-black/5 hover:bg-black/10"
              )}
              style={activeFilter === f ? { backgroundColor: 'var(--tg-theme-text-color)', color: 'var(--tg-theme-bg-color)' } : {}}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-tg-hint gap-3">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-sm font-bold">寻找周围的好店...</p>
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-tg-hint gap-3 border border-dashed border-gray-300 rounded-3xl mx-1 bg-white/50 backdrop-blur" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <Target size={40} className="text-gray-300" />
            <p className="text-sm font-bold text-tg-hint">没有符合条件的商铺</p>
            <button onClick={() => setActiveFilter('全部')} className="text-xs font-bold text-blue-500">查看其他推荐</button>
          </div>
        ) : (
          filteredMerchants.map((merchant) => {
            const currentTag = collections[merchant.id]?.tag;

            // Extract all media URLs
            let images = [];
            try {
              let media = merchant.media_urls;
              if (typeof media === 'string') media = JSON.parse(media);
              if (Array.isArray(media) && media.length > 0) {
                 images = media.map(m => m?.url || m).filter(Boolean);
              }
            } catch (e) { }

            // Debug: log what we got
            if (images.length > 0) {
              console.log(`[Carousel] ${merchant.name}: ${images.length} images`, images);
            } else {
              console.log(`[Carousel] ${merchant.name}: NO images, media_urls =`, merchant.media_urls, '→ using fallback');
            }

            if (images.length === 0) {
               images = [FALLBACK_IMAGES[merchant.category] || FALLBACK_IMAGES['默认']];
            }

            return (
              <motion.div
                key={merchant.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden active:scale-[0.98] transition-transform"
                onClick={() => onMerchantClick(merchant)}
              >
                <div className="w-full aspect-[2/1] bg-gray-100 relative group overflow-hidden">
                  <MerchantImageCarousel images={images} />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 flex gap-2 pointer-events-none">
                    {merchant.is_sponsored && (
                      <span className="px-2 py-0.5 bg-rose-500/90 backdrop-blur-md rounded-full text-[10px] font-bold text-white shadow shadow-rose-500/20">
                        👑 赞助精选
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/20">
                      {merchant.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-lg font-black text-tg-text leading-tight truncate flex items-center gap-1.5">
                        {merchant.name}
                        {merchant.is_verified && <CheckCircle2 size={16} fill="currentColor" className="text-blue-500 text-white flex-shrink-0" />}
                      </h4>
                      <p className="text-xs text-tg-hint mt-1 flex items-center gap-1 truncate max-w-[95%]">
                        <MapPin size={12} className="flex-shrink-0" />
                        {merchant.distanceStr && <span className="font-bold text-blue-500 whitespace-nowrap">{merchant.distanceStr}</span>}
                        <span className="truncate">{merchant.physical_address}</span>
                      </p>
                    </div>
                    {/* Tag Buttons */}
                    <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }} onClick={e => e.stopPropagation()}>
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
