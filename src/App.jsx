import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { GraduationCap, MapPin, User, LayoutGrid, Plus } from 'lucide-react'
import AddMerchantForm from './components/AddMerchantForm'
import MerchantTraining from './components/MerchantTraining'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const NAV_ITEMS = [
  { id: 'explore', label: '发现', icon: LayoutGrid },
  { id: 'submit', label: '推荐', icon: Plus },
  { id: 'training', label: '成长', icon: GraduationCap },
  { id: 'profile', label: '我的', icon: User },
];

function App() {
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => {
    if (activeTab !== 'explore') {
      WebApp.BackButton.show();
      const handler = () => setActiveTab('explore');
      WebApp.BackButton.onClick(handler);
      return () => WebApp.BackButton.offClick(handler);
    } else {
      WebApp.BackButton.hide();
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col min-h-screen pb-[88px] overflow-x-hidden">
      {/* Header */}
      <header className="px-5 py-3.5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl border-b border-black/5" style={{ backgroundColor: 'var(--tg-theme-bg-color, rgba(255,255,255,0.85))' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <MapPin size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-black text-tg-text">附近脉动</h1>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600">在线</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-5">
        <AnimatePresence mode="wait">
          {activeTab === 'explore' && (
            <motion.div 
              key="explore"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Hero Card */}
              <div className="p-6 glass-card flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-tg-text">发现附近好店</h2>
                  <p className="text-sm text-tg-hint leading-relaxed">探索经过验证的优质本地商户</p>
                </div>
                <button 
                  onClick={() => setActiveTab('submit')}
                  className="tg-button mt-2"
                >
                  我来推荐商户
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { num: '128', label: '已入驻商户', color: 'text-blue-500' },
                  { num: '56', label: '本周新增', color: 'text-emerald-500' },
                  { num: '1.2k', label: '用户贡献', color: 'text-amber-500' },
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-4 text-center space-y-1">
                    <p className={clsx("text-xl font-black", stat.color)}>{stat.num}</p>
                    <p className="text-[10px] font-bold text-tg-hint">{stat.label}</p>
                  </div>
                ))}
              </div>
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

          {activeTab === 'training' && (
            <motion.div 
              key="training"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              <MerchantTraining />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[50vh] text-tg-hint gap-3"
            >
              <User size={40} className="opacity-30" />
              <p className="text-sm font-bold">个人中心即将上线</p>
              <p className="text-xs opacity-60">敬请期待</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 px-4 pt-2.5 pb-7 backdrop-blur-2xl border-t border-black/5 flex justify-around z-[100]" style={{ backgroundColor: 'var(--tg-theme-bg-color, rgba(255,255,255,0.92))' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              "flex flex-col items-center gap-1 transition-all relative min-w-[56px]",
              activeTab === id ? "text-tg-link" : "text-tg-hint"
            )}
          >
            <div className={clsx(
              "p-2 rounded-2xl transition-all duration-200",
              activeTab === id ? "bg-blue-500/10 scale-105" : ""
            )}>
              <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] font-bold">{label}</span>
            {activeTab === id && (
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
