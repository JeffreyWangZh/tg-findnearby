import { useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { Plus, MapPin, Camera, UserPlus, ArrowRight, ArrowLeft, Trash2, Loader2, AlignLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { supabase } from '../lib/supabase'
import { getCurrentTgUser } from '../utils/telegram'
import LocationPicker from './LocationPicker'

const STEPS = [
  { title: "基本信息", subtitle: "填写商户的基础资料", icon: Plus },
  { title: "联系方式", subtitle: "关联老板的 Telegram 账号", icon: UserPlus },
  { title: "上传照片", subtitle: "展示商户的实景风貌", icon: Camera },
  { title: "标记位置", subtitle: "在地图上精准定位", icon: MapPin },
]

const CATEGORIES = [
  "餐饮美食", "咖啡茶饮", "零售购物", 
  "生活服务", "美容健身", "教育培训", "科技互联"
];

export default function AddMerchantForm({ onFinish }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const getInitialGeo = () => {
    try {
      const saved = localStorage.getItem('last_geo');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { lat: 22.54, lng: 114.05 };
  };

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    address: '',
    description: '',
    owner_tg: '',
    media: [],
    geo: getInitialGeo()
  });
  
  const fileInputRef = useRef(null);
  const currentUser = getCurrentTgUser();

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    else handleFinalSubmit();
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image') ? 'image' : 'video'
    }));
    setFormData({ ...formData, media: [...formData.media, ...newMedia] });
  }

  const removeMedia = (index) => {
    const updatedMedia = [...formData.media];
    updatedMedia.splice(index, 1);
    setFormData({ ...formData, media: updatedMedia });
  }

  const uploadMedia = async () => {
    const urls = [];
    for (const item of formData.media) {
      const fileName = `merchants/${Date.now()}_${item.file.name}`;
      const { data, error } = await supabase.storage
        .from('merchant-media')
        .upload(fileName, item.file, { cacheControl: '3600', upsert: false });
      
      if (!error && data) {
        const { data: publicUrl } = supabase.storage
          .from('merchant-media')
          .getPublicUrl(data.path);
        urls.push({ url: publicUrl.publicUrl, type: item.type });
      }
    }
    return urls;
  }

  const handleFinalSubmit = () => {
    WebApp.showConfirm("确认提交该商户信息吗？", async (confirmed) => {
      if (!confirmed) return;
      
      setSubmitting(true);
      try {
        let mediaUrls = [];
        if (formData.media.length > 0) {
          mediaUrls = await uploadMedia();
        }

        const { error } = await supabase.from('merchants').insert({
          name: formData.name,
          category: formData.category,
          physical_address: formData.address,
          description: formData.description,
          owner_tg_id: formData.owner_tg,
          submitter_tg_id: currentUser.id,
          lat: formData.geo.lat,
          lng: formData.geo.lng,
          media_urls: mediaUrls,
          status: 'pending',
        });

        if (error) throw error;

        // 记录积分
        await supabase.from('points_history').insert({
          tg_user_id: currentUser.id,
          action: `推荐新店 - ${formData.name.substring(0, 10)}`,
          points: 20
        });

        WebApp.showPopup({ 
          title: '提交成功 🎉', 
          message: '商户已被收录，即将可以在发现页查看。\n奖励 20 积分将自动发放！',
          buttons: [{ type: 'ok', text: '好的' }]
        });
        onFinish();
      } catch (err) {
        console.error('Submit error:', err);
        WebApp.showPopup({ 
          title: '提交失败', 
          message: '网络异常，请稍后重试。',
          buttons: [{ type: 'ok' }]
        });
      } finally {
        setSubmitting(false);
      }
    });
  }

  const isStepValid = () => {
    if (currentStep === 0) return formData.name.trim() && formData.category;
    return true;
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5">
        {STEPS.map((_, idx) => (
          <div key={idx} className="step-indicator">
            <div className={clsx("step-indicator-active", idx <= currentStep ? "w-full" : "w-0")} />
          </div>
        ))}
      </div>

      <div className="px-1">
         <div className="flex items-baseline gap-2">
           <span className="text-2xl font-black text-tg-link">{currentStep + 1}</span>
           <span className="text-lg font-black text-tg-text">{STEPS[currentStep].title}</span>
         </div>
         <p className="text-sm text-tg-hint mt-0.5">{STEPS[currentStep].subtitle}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="glass-card p-5 space-y-4"
        >
          {currentStep === 0 && (
            <>
              <div>
                <label className="label-text">商户名称</label>
                <input 
                  type="text" 
                  placeholder="例如：街角咖啡馆" 
                  className="tg-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="label-text">经营类目</label>
                <select 
                  className="tg-input appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">请选择类目</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">商户描述</label>
                <textarea 
                  rows={2} 
                  placeholder="店铺特色、招牌推荐（选填）" 
                  className="tg-input resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                 <p className="text-xs font-bold text-emerald-600">💬 Telegram 直连</p>
                 <p className="text-xs text-emerald-600/70 mt-1 leading-relaxed">
                   绑定商户老板的 Telegram，用户可以一键联系。
                 </p>
              </div>
              <div>
                 <label className="label-text">老板的 Telegram 用户名 (选填)</label>
                 <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tg-hint text-sm font-medium">t.me/</div>
                   <input 
                    type="text" 
                    placeholder="username" 
                    className="tg-input pl-[4rem]"
                    value={formData.owner_tg}
                    onChange={(e) => setFormData({...formData, owner_tg: e.target.value})}
                  />
                 </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                {formData.media.map((item, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-black/5">
                    {item.type === 'image' ? (
                      <img src={item.url} className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" />
                    )}
                    <button 
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white active:scale-90 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-tg-hint hover:border-tg-link hover:text-tg-link transition-all active:scale-95"
                >
                  <Plus size={20} />
                  <span className="text-[9px] font-bold">添加</span>
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="image/*,video/*"
                onChange={handleMediaChange}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
               <div>
                  <label className="label-text">详细地址</label>
                  <input 
                    type="text" 
                    placeholder="街道、楼栋、门牌号..." 
                    className="tg-input mb-4"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
               </div>
               <div className="aspect-[16/10] rounded-xl relative overflow-hidden">
                  <LocationPicker 
                    geo={formData.geo} 
                    onChange={(geo) => setFormData({ ...formData, geo })}
                  />
               </div>
               <p className="text-[10px] text-tg-hint text-center mt-2">
                 拖动大头针，或者点击地图定位
               </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 pt-1">
        {currentStep > 0 && (
          <button onClick={prevStep} className="flex-1 py-3.5 px-5 rounded-2xl text-tg-text font-bold active:scale-[0.97] transition-all text-sm flex items-center justify-center gap-1.5 border border-black/5" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)' }}>
            <ArrowLeft size={15} /> 上一步
          </button>
        )}
        <button 
          onClick={nextStep} 
          disabled={submitting || !isStepValid()}
          className={clsx(
            "flex-[2] py-3.5 px-5 tg-button flex items-center justify-center gap-1.5 text-sm",
            (submitting || !isStepValid()) && "opacity-50 pointer-events-none"
          )}
        >
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> 提交中...</>
          ) : currentStep === STEPS.length - 1 ? (
            <>提交审核 <ArrowRight size={15} /></>
          ) : (
            <>下一步 <ArrowRight size={15} /></>
          )}
        </button>
      </div>
    </div>
  )
}
