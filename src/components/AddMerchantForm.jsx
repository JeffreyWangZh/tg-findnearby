import { useState, useRef, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { Plus, Camera, Trash2, Loader2, Link as LinkIcon, Tag, MapPin, Search } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../lib/supabase'
import { getCurrentTgUser, safeShowPopup, safeShowConfirm } from '../utils/telegram'
import LocationPicker from './LocationPicker'

const CATEGORIES = [
  "餐饮美食", "咖啡茶饮", "零售购物", 
  "生活服务", "美容健身", "教育培训", "科技互联"
];
const DRAFT_KEY = 'draft_merchant_form';

export default function AddMerchantForm({ onFinish }) {
  const [submitting, setSubmitting] = useState(false);
  
  const getInitialGeo = () => {
    try {
      const saved = localStorage.getItem('last_geo');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { lat: 22.54, lng: 114.05 };
  };

  const getInitialForm = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name !== undefined) return { ...parsed, media: [] };
      }
    } catch(e) {}
    return {
      name: '',
      category: '',
      address: '',
      description: '',
      owner_tg: '',
      homepage_url: '',
      tags: [],
      media: [],
      geo: getInitialGeo()
    };
  };

  const [formData, setFormData] = useState(getInitialForm());
  const [tagInput, setTagInput] = useState('');
  
  // Auto-save logic
  useEffect(() => {
    const { media, ...rest } = formData;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
  }, [formData]);

  const fileInputRef = useRef(null);
  const currentUser = getCurrentTgUser();

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

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !formData.tags.includes(val)) {
        setFormData({ ...formData, tags: [...formData.tags, val] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  const uploadMedia = async () => {
    const urls = [];
    for (const item of formData.media) {
      const fileName = `merchants/${Date.now()}_${item.file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      console.log('[Upload] Attempting upload:', fileName, 'size:', item.file.size);
      const { data, error } = await supabase.storage
        .from('merchant-media')
        .upload(fileName, item.file, { cacheControl: '3600', upsert: false });
      
      if (error) {
        console.error('[Upload] Failed:', error.message, error);
      }
      if (!error && data) {
        const { data: publicUrl } = supabase.storage
          .from('merchant-media')
          .getPublicUrl(data.path);
        console.log('[Upload] Success, publicUrl:', publicUrl.publicUrl);
        urls.push({ url: publicUrl.publicUrl, type: item.type });
      }
    }
    console.log('[Upload] Final urls array:', urls);
    return urls;
  }

  const handleFinalSubmit = () => {
    if (!formData.name.trim() || !formData.category) {
      safeShowPopup({ title: '信息不全', message: '请填写商户名称和核心类目！' });
      return;
    }

    safeShowConfirm("确认提交该商户信息吗？", async (confirmed) => {
      if (!confirmed) return;
      
      setSubmitting(true);
      try {
        let mediaUrls = [];
        if (formData.media.length > 0) {
          mediaUrls = await uploadMedia();
          if (mediaUrls.length === 0 && formData.media.length > 0) {
            console.warn('[Submit] Photo upload returned 0 results for', formData.media.length, 'files — storage bucket may not exist');
            safeShowPopup({ 
              title: '⚠️ 照片上传失败', 
              message: '照片未能上传成功，可能是存储桶尚未创建。商户信息仍会被提交，但不包含照片。\n\n请在 Supabase Dashboard 创建名为 merchant-media 的公共存储桶。' 
            });
          }
        }

        console.log('[Submit] Inserting merchant with media_urls:', mediaUrls);
        const { data: insertedMerchant, error } = await supabase.from('merchants').insert({
          name: formData.name,
          category: formData.category,
          physical_address: formData.address,
          description: formData.description,
          owner_tg_id: formData.owner_tg,
          homepage_url: formData.homepage_url,
          submitter_tg_id: currentUser.id,
          lat: formData.geo.lat,
          lng: formData.geo.lng,
          media_urls: mediaUrls,
          status: 'pending',
        }).select().single();

        if (error) throw error;

        // Insert Tags
        if (insertedMerchant && formData.tags.length > 0) {
          const tagsToInsert = formData.tags.map(t => ({
             merchant_id: insertedMerchant.id,
             tag_name: t,
             user_id: String(currentUser.id)
          }));
          const { error: tagErr } = await supabase.from('merchant_tag_votes').insert(tagsToInsert);
          if (tagErr) console.warn("Tag insertion failed (maybe table missing)", tagErr);
        }

        // 记录积分
        await supabase.from('points_history').insert({
          tg_user_id: currentUser.id,
          action: `推荐新店 - ${formData.name.substring(0, 10)}`,
          points: 20
        });

        localStorage.removeItem(DRAFT_KEY);

        safeShowPopup({ 
          title: '提交成功 🎉', 
          message: '商户已被收录，即将可以在发现页查看。\n奖励 20 积分将自动发放！',
          buttons: [{ type: 'ok', text: '好的' }]
        });
        onFinish();
      } catch (err) {
        console.error('Submit error:', err);
        safeShowPopup({ 
          title: '提交失败', 
          message: '网络异常，请稍后重试。',
          buttons: [{ type: 'ok' }]
        });
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <div className="space-y-4 pb-12 h-content">
      <div className="px-1 mb-2">
         <h2 className="text-xl font-black text-tg-text">推荐优质商户</h2>
         <p className="text-sm text-tg-hint mt-0.5">一页填完，防重载自动保存的内容</p>
      </div>

      <div className="glass-card p-5 space-y-4">
        {/* Name & Category */}
        <div>
          <label className="label-text">商户名称 <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            placeholder="例如：街角咖啡馆" 
            className="tg-input"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <label className="label-text">经营类目 <span className="text-red-500">*</span></label>
          <select 
            className="tg-input appearance-none bg-white"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="">请选择核心类目</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <hr className="border-black/5 border-dashed" />

        {/* Contact info & Links */}
        <div>
          <label className="label-text">联系/社媒主页链接 (选填)</label>
          <div className="relative mb-3">
            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="https://..." 
              className="tg-input pl-9"
              value={formData.homepage_url}
              onChange={(e) => setFormData({...formData, homepage_url: e.target.value})}
            />
          </div>
          <label className="label-text">老板 Telegram (选填)</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tg-hint text-sm font-medium">t.me/</div>
            <input 
              type="text" 
              placeholder="username" 
              className="tg-input pl-[3.5rem]"
              value={formData.owner_tg}
              onChange={(e) => setFormData({...formData, owner_tg: e.target.value})}
            />
          </div>
        </div>

        <hr className="border-black/5 border-dashed" />

        {/* Dynamic Tags Input */}
        <div>
           <label className="label-text">自由标签 (输入后按回车添加)</label>
           <div className="flex flex-wrap gap-2 mb-2">
             {formData.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-blue-50 text-blue-600 font-bold text-[11px] rounded-lg border border-blue-200 flex items-center gap-1">
                   {tag}
                   <button onClick={() => removeTag(tag)} className="text-blue-400 hover:text-blue-600"><Trash2 size={12}/></button>
                </span>
             ))}
           </div>
           <div className="relative">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="例如: 环境好、咖啡浓郁..." 
                className="tg-input pl-9"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                onBlur={handleAddTag}
              />
           </div>
        </div>

        <hr className="border-black/5 border-dashed" />

        {/* Media Upload (Images viewable as Carousel in next step) */}
        <div>
          <label className="label-text">上传照片/小视频</label>
          <div className="grid grid-cols-3 gap-2.5 mt-1">
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
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-tg-hint hover:border-tg-link hover:text-tg-link transition-all active:scale-95 bg-gray-50/50"
            >
              <Camera size={20} />
              <span className="text-[9px] font-bold">添加图片</span>
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

        <hr className="border-black/5 border-dashed" />

        {/* Map & Geography */}
        <div>
           <label className="label-text">详细地址及地图定位</label>
           <input 
             type="text" 
             placeholder="街道、楼栋、门牌号..." 
             className="tg-input mb-3"
             value={formData.address}
             onChange={(e) => setFormData({...formData, address: e.target.value})}
           />
           <div className="aspect-[16/10] rounded-xl relative overflow-hidden bg-gray-100 shadow-inner">
              <LocationPicker 
                geo={formData.geo} 
                onChange={(geo) => setFormData({ ...formData, geo })}
              />
           </div>
           <p className="text-[10px] text-tg-hint text-center mt-2 flex items-center justify-center gap-1">
             <MapPin size={12} /> 搜索或拖动地图精确定位
           </p>
        </div>
      </div>

      <div className="pt-2 sticky bottom-4 z-10 px-1">
        <button 
          onClick={handleFinalSubmit} 
          disabled={submitting}
          className={clsx(
            "w-full py-4 tg-button font-bold text-lg flex items-center justify-center gap-2 shadow-2xl shadow-blue-500/30",
            submitting && "opacity-50 pointer-events-none"
          )}
        >
          {submitting ? (
            <><Loader2 size={18} className="animate-spin" /> 数据提交中...</>
          ) : (
            <>提交审核并获得积分</>
          )}
        </button>
      </div>
    </div>
  )
}
