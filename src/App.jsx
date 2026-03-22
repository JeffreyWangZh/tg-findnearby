import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { MapPin, User, LayoutGrid, Plus, ChevronLeft, ChevronDown, GraduationCap } from 'lucide-react'
import AddMerchantForm from './components/AddMerchantForm'
import ExploreTab from './components/ExploreTab'
import UserProfile from './components/UserProfile'
import MerchantTraining from './components/MerchantTraining'
import MerchantProfile from './components/MerchantProfile'
import LocationPicker from './components/LocationPicker'
import { useCollections } from './hooks/useCollections'
import { isTelegramEnvironment } from './utils/telegram'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const NAV_ITEMS = [
  { id: 'explore', label: '发现', icon: LayoutGrid },
  { id: 'submit', label: '推荐', icon: Plus },
  // { id: 'academy', label: '学堂', icon: GraduationCap },
  { id: 'profile', label: '我的', icon: User },
];

function App() {
  const getInitialGeo = () => {
    try {
      const saved = localStorage.getItem('last_geo');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return { lat: 22.54, lng: 114.05 };
  };

  const [activeTab, setActiveTab] = useState('explore');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [currentGeo, setCurrentGeo] = useState(getInitialGeo());
  const [currentLocationName, setCurrentLocationName] = useState('定位中...');
  const [isLocationModalOpen, setLocationModalOpen] = useState(false);
  const { collections, setTag } = useCollections();
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    // Reverse geocoding to find Neighbourhood/Street Name
    const fetchLocationName = async () => {
      setCurrentLocationName('定位中...');
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentGeo.lat}&lon=${currentGeo.lng}&zoom=16&addressdetails=1&accept-language=zh`);
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const shortName = addr.neighbourhood || addr.suburb || addr.quarter || addr.road || addr.town || addr.city || addr.county || '未知区域';
          setCurrentLocationName(shortName);
        } else {
          setCurrentLocationName('未知街区');
        }
      } catch (err) {
        console.error('Reverse geocode err:', err);
        setCurrentLocationName('网络或定位异常');
      }
    };

    // add small debounce delay to avoid spamming Nominatim when modal dragging
    const timerId = setTimeout(fetchLocationName, 800);
    return () => clearTimeout(timerId);
  }, [currentGeo.lat, currentGeo.lng]);

  useEffect(() => {
    setIsAuthorized(isTelegramEnvironment());

    if (activeTab !== 'explore' || selectedMerchant) {
      WebApp.BackButton.show();
      const handler = () => {
        if (selectedMerchant) {
          setSelectedMerchant(null);
        } else {
          setActiveTab('explore');
        }
      };
      WebApp.BackButton.onClick(handler);
      return () => WebApp.BackButton.offClick(handler);
    } else {
      WebApp.BackButton.hide();
    }
  }, [activeTab, selectedMerchant]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50 text-gray-800">
        <div className="w-20 h-20 mb-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 transform -rotate-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 ml-1"><path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"></path></svg>
        </div>
        <h1 className="text-2xl font-black mb-3 text-gray-900 tracking-tight">请在 Telegram 中打开</h1>
        <p className="text-sm font-medium text-gray-500 mb-8 px-4 leading-relaxed">
          为保障您的账号和积分安全，<br />本程序只允许在 Telegram 官方内开启。
        </p>
        <button onClick={() => window.location.href = 'https://t.me/findnearby007_bot'} className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-transform flex items-center gap-2">
          前往 Telegram 打开
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-[88px] overflow-x-hidden">
      {/* Header */}
      <header className="px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl border-b border-black/5" style={{ backgroundColor: 'var(--tg-theme-bg-color, rgba(255,255,255,0.85))' }}>
        <div className="flex items-center gap-3 max-w-[85%]">
          {selectedMerchant ? (
            <button onClick={() => setSelectedMerchant(null)} className="p-1 -ml-2 rounded-lg text-blue-500 hover:bg-blue-500/10 flex-shrink-0">
              <ChevronLeft size={26} />
            </button>
          ) : (
            <button onClick={() => setLocationModalOpen(true)} className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md active:scale-95 transition-all flex-shrink-0">
              <MapPin size={16} className="text-white" />
            </button>
          )}
          <div
            className={clsx("flex flex-col cursor-pointer active:opacity-70 transition-opacity min-w-0 pr-2", selectedMerchant && 'pointer-events-none')}
            onClick={() => !selectedMerchant && setLocationModalOpen(true)}
          >
            <h1 className="text-lg font-black text-tg-text truncate flex items-center gap-1">
              {selectedMerchant ? '商户详情' : (activeTab === 'academy' ? '商家学堂' : currentLocationName)}
            </h1>
            {!selectedMerchant && activeTab !== 'academy' && (
              <span className="text-[10px] text-blue-500 font-bold flex items-center gap-0.5 mt-0.5">
                更改位置 <ChevronDown size={11} strokeWidth={3} />
              </span>
            )}
            {!selectedMerchant && activeTab === 'academy' && (
              <span className="text-[10px] text-tg-hint font-bold flex items-center gap-0.5 mt-0.5">
                成长与运营指南
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-5">
        <AnimatePresence mode="wait">
          {selectedMerchant ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <MerchantProfile merchant={selectedMerchant} />
            </motion.div>
          ) : (
            <>
              {activeTab === 'explore' && (
                <motion.div
                  key="explore"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExploreTab
                    currentGeo={currentGeo}
                    collections={collections}
                    setTag={setTag}
                    onAddClick={() => setActiveTab('submit')}
                    onMerchantClick={setSelectedMerchant}
                  />
                </motion.div>
              )}

              {activeTab === 'submit' && (
                <motion.div
                  key="submit"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AddMerchantForm onFinish={() => setActiveTab('explore')} />
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                >
                  <UserProfile collections={collections} setTag={setTag} />
                </motion.div>
              )}

              {activeTab === 'academy' && (
                <motion.div
                  key="academy"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <MerchantTraining />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Location Selection Modal */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
            style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-black/5">
              <h2 className="text-lg font-black text-tg-text">选择要探索的位置</h2>
              <button onClick={() => setLocationModalOpen(false)} className="text-blue-500 font-bold active:scale-95">关闭</button>
            </div>
            <div className="flex-1 bg-gray-50 relative p-4">
              <LocationPicker
                geo={currentGeo}
                onChange={(newGeo) => {
                  setCurrentGeo(newGeo);
                  // localStorage set happens inside LocationPicker automatically
                }}
              />
            </div>
            <div className="p-4 pb-8 border-t border-black/5 flex shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <button onClick={() => setLocationModalOpen(false)} className="tg-button flex-1 py-4 font-bold text-lg shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform">
                确认位置，探索周边
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 px-4 pt-2.5 pb-7 backdrop-blur-2xl border-t border-black/5 flex justify-around z-[100]" style={{ backgroundColor: 'var(--tg-theme-bg-color, rgba(255,255,255,0.92))' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setActiveTab(id);
              setSelectedMerchant(null);
            }}
            className={clsx(
              "flex flex-col items-center gap-1 transition-all relative min-w-[56px]",
              activeTab === id && !selectedMerchant ? "text-tg-link" : "text-tg-hint"
            )}
          >
            <div className={clsx(
              "p-2 rounded-2xl transition-all duration-200",
              activeTab === id && !selectedMerchant ? "bg-blue-500/10 scale-105" : ""
            )}>
              <Icon size={22} strokeWidth={activeTab === id && !selectedMerchant ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] font-bold">{label}</span>
            {activeTab === id && !selectedMerchant && (
              <motion.div
                layoutId="navDot"
                className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-tg-link"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
