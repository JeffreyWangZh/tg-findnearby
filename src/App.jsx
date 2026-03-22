import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { Store, GraduationCap, MapPin, User, LayoutGrid, Plus } from 'lucide-react'
import AddMerchantForm from './components/AddMerchantForm'
import MerchantTraining from './components/MerchantTraining'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const NAV_ITEMS = [
  { id: 'explore', label: 'Explore', icon: LayoutGrid },
  { id: 'submit', label: 'Add', icon: Plus },
  { id: 'training', label: 'Growth', icon: GraduationCap },
  { id: 'profile', label: 'Profile', icon: User },
];

function App() {
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => {
    // Sync with Telegram back button logic
    if (activeTab !== 'explore') {
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(() => setActiveTab('explore'));
    } else {
      WebApp.BackButton.hide();
    }
    
    return () => WebApp.BackButton.offClick();
  }, [activeTab]);

  return (
    <div className="flex flex-col min-h-screen pb-24 overflow-x-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl border-b border-white/5" style={{ backgroundColor: 'var(--tg-theme-bg-color, rgba(255,255,255,0.8))' }}>
        <h1 className="text-xl font-bold bg-gradient-to-r from-tg-link to-indigo-400 bg-clip-text text-transparent">
          NearbyPulse Pro
        </h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-tg-secondary-bg rounded-full border border-white/10 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-tg-hint uppercase tracking-tighter">Live</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'explore' && (
            <motion.div 
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="p-8 glass-card flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center shadow-inner">
                  <MapPin className="w-10 h-10 text-tg-link" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Find Local Businesses</h2>
                  <p className="text-sm text-tg-hint mt-1">Discover verified merchants in your neighborhood</p>
                </div>
                <button 
                  onClick={() => setActiveTab('submit')}
                  className="tg-button mt-4"
                >
                  Crowdsource Now
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'submit' && (
            <motion.div 
              key="submit"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
            >
              <AddMerchantForm onFinish={() => setActiveTab('explore')} />
            </motion.div>
          )}

          {activeTab === 'training' && (
            <motion.div 
              key="training"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <MerchantTraining />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              className="flex items-center justify-center min-h-[50vh] text-tg-hint"
            >
              User Profile Coming Soon...
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 px-6 py-4 pb-8 backdrop-blur-2xl border-t border-white/5 flex justify-between safe-area-bottom z-[100]" style={{ backgroundColor: 'var(--tg-theme-bg-color, rgba(255,255,255,0.9))' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              "flex flex-col items-center gap-1.5 transition-all relative group",
              activeTab === id ? "text-tg-link" : "text-tg-hint"
            )}
          >
            <div className={clsx(
              "p-2 rounded-2xl transition-all duration-300",
              activeTab === id ? "bg-blue-500/10 scale-110" : "group-hover:bg-gray-100"
            )}>
              <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 1.5} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            {activeTab === id && (
              <motion.div 
                layoutId="navTab"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-tg-link"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
