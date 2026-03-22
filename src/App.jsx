import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { MapPin, User, LayoutGrid, Plus, ChevronLeft } from 'lucide-react'
import AddMerchantForm from './components/AddMerchantForm'
import ExploreTab from './components/ExploreTab'
import UserProfile from './components/UserProfile'
import MerchantProfile from './components/MerchantProfile'
import { useCollections } from './hooks/useCollections'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const NAV_ITEMS = [
  { id: 'explore', label: '发现', icon: LayoutGrid },
  { id: 'submit', label: '推荐', icon: Plus },
  { id: 'profile', label: '我的', icon: User },
];

function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const { collections, setTag } = useCollections();

  useEffect(() => {
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

  return (
    <div className="flex flex-col min-h-screen pb-[88px] overflow-x-hidden">
      {/* Header */}
      <header className="px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl border-b border-black/5" style={{ backgroundColor: 'var(--tg-theme-bg-color, rgba(255,255,255,0.85))' }}>
        <div className="flex items-center gap-2">
          {selectedMerchant ? (
            <button onClick={() => setSelectedMerchant(null)} className="p-1 -ml-2 rounded-lg text-blue-500 hover:bg-blue-500/10">
               <ChevronLeft size={24} />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
          )}
          <h1 className="text-lg font-black text-tg-text">
            {selectedMerchant ? '商户详情' : '附近脉动'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600">在线</span>
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
            </>
          )}
        </AnimatePresence>
      </main>

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
