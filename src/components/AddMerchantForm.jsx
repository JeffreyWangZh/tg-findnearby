import { useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { Plus, MapPin, Camera, UserPlus, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { supabase } from '../lib/supabase'

const STEPS = [
  { title: "Basic Information", subtitle: "Provide business details", icon: Plus },
  { title: "Contact Hub", subtitle: "Connect merchant socials", icon: UserPlus },
  { title: "Visual Showcase", subtitle: "Photos and videos", icon: Camera },
  { title: "Locate Point", subtitle: "Precision on the map", icon: MapPin },
]

const CATEGORIES = ["Restaurant", "Cafe", "Retail", "Services", "Wellness", "Art & Design", "Technology"];

export default function AddMerchantForm({ onFinish }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    address: '',
    owner_tg: '',
    media: [],
    geo: { lat: 22.54, lng: 114.05 }
  });
  
  const fileInputRef = useRef(null);

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
    WebApp.showConfirm("Are you sure you want to submit this merchant?", async (confirmed) => {
      if (!confirmed) return;
      
      setSubmitting(true);
      try {
        // Upload media files
        let mediaUrls = [];
        if (formData.media.length > 0) {
          mediaUrls = await uploadMedia();
        }

        // Insert merchant into Supabase
        const { error } = await supabase.from('merchants').insert({
          name: formData.name,
          category: formData.category,
          physical_address: formData.address,
          owner_tg_id: formData.owner_tg,
          lat: formData.geo.lat,
          lng: formData.geo.lng,
          media_urls: mediaUrls,
          status: 'pending',
        });

        if (error) throw error;

        WebApp.showPopup({ 
          title: 'Success!', 
          message: 'Your merchant submission is pending review.',
          buttons: [{ type: 'ok', text: 'Awesome' }]
        });
        onFinish();
      } catch (err) {
        console.error('Submit error:', err);
        WebApp.showPopup({ 
          title: 'Error', 
          message: 'Failed to submit. Please try again.',
          buttons: [{ type: 'ok' }]
        });
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex gap-2">
        {STEPS.map((step, idx) => (
          <div key={idx} className="step-indicator">
            <div 
              className={clsx(
                "step-indicator-active",
                idx <= currentStep ? "w-full" : "w-0"
              )}
            />
          </div>
        ))}
      </div>

      <div className="px-2">
         <h2 className="text-2xl font-black text-tg-text uppercase tracking-tight flex items-center gap-2">
           <span className="text-tg-link italic">0{currentStep + 1}.</span> {STEPS[currentStep].title}
         </h2>
         <p className="text-sm text-tg-hint font-medium leading-relaxed">{STEPS[currentStep].subtitle}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="glass-card p-6 space-y-5"
        >
          {currentStep === 0 && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tg-hint uppercase tracking-widest pl-1">Business Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., The Cozy Corner" 
                  className="tg-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tg-hint uppercase tracking-widest pl-1">Category</label>
                <select 
                  className="tg-input appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-tg-hint uppercase tracking-widest pl-1">Physical Address</label>
                <textarea 
                  rows={3} 
                  placeholder="Street, City, Building..." 
                  className="tg-input resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </>
          )}

          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                 <p className="text-xs font-bold uppercase tracking-wide">Direct Integration</p>
                 <p className="text-[11px] leading-relaxed mt-0.5 opacity-80">Linking the owner enables "Contact Boss" features for users.</p>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-tg-hint uppercase tracking-widest pl-1">Owner's Telegram</label>
                 <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tg-hint font-medium">t.me/</div>
                   <input 
                    type="text" 
                    placeholder="username" 
                    className="tg-input pl-[3.8rem]"
                    value={formData.owner_tg}
                    onChange={(e) => setFormData({...formData, owner_tg: e.target.value})}
                  />
                 </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {formData.media.map((item, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-white/5 shadow-md">
                    {item.type === 'image' ? (
                      <img src={item.url} className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" />
                    )}
                    <button 
                      onClick={() => removeMedia(idx)}
                      className="absolute top-2 right-2 p-2 bg-rose-500/80 backdrop-blur-md rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all border border-white/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-gray-400/30 flex flex-col items-center justify-center gap-2 text-tg-hint hover:border-tg-link hover:text-tg-link transition-all"
                >
                  <Plus size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Add Files</span>
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
              <p className="text-[10px] text-tg-hint text-center font-medium">Max file size: 20MB. Supports JPG, PNG, MP4.</p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
               <div className="aspect-video bg-tg-secondary-bg rounded-2xl flex flex-col items-center justify-center text-tg-hint border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                  <MapPin className="w-8 h-8 opacity-40 group-hover:scale-110 transition-transform" />
                  <p className="text-[11px] font-bold mt-2 uppercase tracking-tight">Interactive Map Module</p>
                  
                  <div className="absolute bottom-4 left-4 right-4 p-3 bg-white/80 backdrop-blur-lg rounded-xl border border-white/10 flex justify-between items-center scale-95 opacity-80">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-rose-500" />
                       <span className="text-[10px] font-mono text-tg-text">LAT: {formData.geo.lat}</span>
                     </div>
                     <span className="text-[10px] font-mono text-tg-text">LNG: {formData.geo.lng}</span>
                  </div>
               </div>
               <button className="w-full py-3 bg-tg-secondary-bg flex items-center justify-center gap-2 rounded-xl text-xs font-bold text-tg-text hover:bg-tg-bg transition-colors border border-white/5">
                 <Plus size={14} /> Select Exact Location
               </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-4 pt-2">
        {currentStep > 0 && (
          <button onClick={prevStep} className="flex-1 py-4 px-6 bg-tg-secondary-bg rounded-2xl text-tg-text font-bold active:scale-95 transition-all text-xs flex items-center justify-center gap-2 border border-white/5">
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <button 
          onClick={nextStep} 
          disabled={submitting}
          className={clsx(
            "flex-[2] py-4 px-6 bg-tg-button text-tg-button-text rounded-2xl font-bold active:scale-95 transition-all shadow-xl text-xs flex items-center justify-center gap-2 uppercase tracking-wide",
            submitting && "opacity-50 pointer-events-none"
          )}
        >
          {submitting ? 'Submitting...' : (currentStep === STEPS.length - 1 ? 'Publish' : 'Continue')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
