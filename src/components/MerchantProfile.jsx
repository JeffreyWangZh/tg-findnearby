import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { MessageCircle, MapPin, Share2, CheckCircle, Edit3, Heart, Send, Loader2, ShieldCheck, Ticket, Zap, Link as LinkIcon, Plus } from 'lucide-react'
import { contactMerchantOwner, getCurrentTgUser, safeShowPopup, safeShowConfirm, FALLBACK_IMAGES } from '../utils/telegram'
import { supabase } from '../lib/supabase'
import clsx from 'clsx'
import LocationPicker from './LocationPicker'

const CATEGORIES = [
  "餐饮美食", "咖啡茶饮", "零售购物", 
  "生活服务", "美容健身", "教育培训", "科技互联"
];

export default function MerchantProfile({ merchant, onBack }) {
  const [data, setData] = useState(merchant);
  const [reviews, setReviews] = useState([]);
  const [tags, setTags] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const currentUser = getCurrentTgUser();
  const isCreator = String(data.submitter_tg_id) === String(currentUser.id);

  // 权限判定逻辑
  // owner_tg_id: 创建商户时填写的老板 TG username
  // submitter_tg_id: 谁提交/创建了这个商户
  const ownerTgMatch = data.owner_tg_id && (
    String(data.owner_tg_id).toLowerCase() === String(currentUser.username).toLowerCase() ||
    String(data.owner_tg_id) === String(currentUser.id)
  );

  // 谁可以编辑？
  // 1. 未认领商户 → 创建者可以编辑（除标签）
  // 2. 已认领商户 → 认领的老板可以编辑
  const canEdit = data.is_verified 
    ? String(data.submitter_tg_id) === String(currentUser.id) // 已认领：只有绑定的老板能编辑
    : isCreator; // 未认领：创建者可以编辑

  // 谁可以认领？
  // 必须：1. 商户未认领  2. 用户的 TG username/id 和 owner_tg_id 匹配  3. 不是创建者自己认领
  const canClaim = !data.is_verified && ownerTgMatch;

  // Parse deals: support legacy deal_title/deal_points OR new deals JSONB array
  const parseDeals = (d) => {
    try {
      if (d.deals && Array.isArray(d.deals) && d.deals.length > 0) return d.deals;
      if (typeof d.deals === 'string') { const parsed = JSON.parse(d.deals); if (Array.isArray(parsed)) return parsed; }
    } catch(e) {}
    // Legacy fallback
    if (d.deal_title) return [{ title: d.deal_title, points: d.deal_points || 0, quantity: 0 }];
    return [];
  };

  const [editForm, setEditForm] = useState({
    name: data.name || '',
    category: data.category || '',
    owner_tg: data.owner_tg_id || '',
    homepage_url: data.homepage_url || '',
    description: data.description || '',
    address: data.physical_address || '',
    geo: { lat: data.lat || 22.54, lng: data.lng || 114.05 },
    deals: parseDeals(data)
  });

  useEffect(() => {
    fetchReviews();
    fetchTags();
  }, [data.id]);

  const fetchTags = async () => {
    const { data: tagVotes, error } = await supabase
      .from('merchant_tag_votes')
      .select('tag_name, user_id')
      .eq('merchant_id', data.id);

    if (!error && tagVotes) {
      const tagCounts = {};
      tagVotes.forEach(v => {
         if (!tagCounts[v.tag_name]) {
            tagCounts[v.tag_name] = { count: 0, votedByMe: false };
         }
         tagCounts[v.tag_name].count++;
         if (String(v.user_id) === String(currentUser.id)) {
            tagCounts[v.tag_name].votedByMe = true;
         }
      });
      setTags(Object.keys(tagCounts).map(name => ({ ...tagCounts[name], name })).sort((a,b) => b.count - a.count));
    }
  };

  const handleUpvoteTag = async (tag) => {
    if (tag.votedByMe) return;
    try { WebApp.HapticFeedback.impactOccurred('light'); } catch (e) {}
    setTags(tags.map(t => t.name === tag.name ? { ...t, count: t.count + 1, votedByMe: true } : t));
    const { error } = await supabase.from('merchant_tag_votes').insert({
       merchant_id: data.id, tag_name: tag.name, user_id: String(currentUser.id)
    });
    if (error) console.error("Upvote failed", error);
  };

  const fetchReviews = async () => {
    const { data: revs, error } = await supabase
      .from('reviews')
      .select('*, review_likes(tg_user_id)')
      .eq('merchant_id', data.id)
      .order('created_at', { ascending: false });

    if (!error && revs) {
      const formatted = revs.map(r => ({
        ...r, likedByMe: r.review_likes.some(like => like.tg_user_id === currentUser.id)
      }));
      setReviews(formatted);
    }
  };

  const handleContact = () => contactMerchantOwner(data.owner_tg_id);

  const handleShare = () => {
    safeShowPopup({ message: '分享此商户给好友？', buttons: [{ text: '立即分享', type: 'default' }, { text: '取消', type: 'cancel' }] });
  };

  const checkBalanceAndProceed = async (cost, actionName, performAction) => {
    safeShowConfirm(`将消耗 ${cost} 积分执行 [${actionName}]，确认操作吗？`, async (ok) => {
      if (!ok) return;
      setSubmitting(true);
      const { data: pts } = await supabase.from('points_history').select('points').eq('tg_user_id', currentUser.id);
      const currentBalance = (pts || []).reduce((acc, curr) => acc + curr.points, 0);
      if (currentBalance < cost) {
        setSubmitting(false);
        safeShowConfirm(`积分不足 (余额: ${currentBalance} / 需要: ${cost})\n\n是否模拟充值 5000 积分？`, async (rechargeOk) => {
          if (rechargeOk) {
            try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}
            await supabase.from('points_history').insert({ tg_user_id: currentUser.id, action: '模拟代币充值 (Telegram Stars)', points: 5000 });
            safeShowPopup({ title: '💎 到账成功', message: '测试充值 5000 积分已发放！' });
          }
        });
        return;
      }
      await performAction();
      setSubmitting(false);
    });
  };

  const handleBoost = () => {
    checkBalanceAndProceed(1000, "置顶至首页精选", async () => {
      await supabase.from('points_history').insert({ tg_user_id: currentUser.id, action: '购买首页爆量精选曝光', points: -1000 });
      await supabase.from('merchants').update({ is_sponsored: true }).eq('id', data.id);
      setData({...data, is_sponsored: true});
      try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
      safeShowPopup({ title: '👑 置顶成功', message: '您的店铺已置顶。' });
    });
  };

  const handleClaim = () => {
    // 二次校验：必须 owner_tg_id 匹配当前用户
    if (!ownerTgMatch) {
      safeShowPopup({ 
        title: '⚠️ 无法认领', 
        message: `此商户的老板 TG 信息为 "${data.owner_tg_id}"，与您的账号 (${currentUser.username}) 不符。\n\n只有商户登记的老板本人才能认领。`,
        buttons: [{ type: 'ok', text: '知道了' }]
      });
      return;
    }
    checkBalanceAndProceed(500, "认证为官方蓝V老板", async () => {
      await supabase.from('points_history').insert({ tg_user_id: currentUser.id, action: `官方认证蓝V - ${data.name}`, points: -500 });
      await supabase.from('merchants').update({ is_verified: true, submitter_tg_id: currentUser.id }).eq('id', data.id);
      setData({...data, is_verified: true, submitter_tg_id: currentUser.id});
      try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
      safeShowPopup({ title: '💎 认领成功', message: '商铺已绑定您的账号！现在只有您可以编辑店铺信息。' });
    });
  };

  const handleBuyDeal = (deal) => {
    checkBalanceAndProceed(deal.points, `抢购: ${deal.title}`, async () => {
      await supabase.from('points_history').insert({ tg_user_id: currentUser.id, action: `抢购营销特卖 - ${deal.title}`, points: -deal.points });
      // Decrement quantity if tracked
      if (deal.quantity > 0) {
        const currentDeals = parseDeals(data);
        const updatedDeals = currentDeals.map(d => d.title === deal.title ? { ...d, quantity: Math.max(0, d.quantity - 1) } : d);
        await supabase.from('merchants').update({ deals: updatedDeals, deal_title: deal.title, deal_points: deal.points }).eq('id', data.id);
        setData({ ...data, deals: updatedDeals });
      }
      try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
      safeShowPopup({ title: '🎉 兑换成功', message: '请向商家出示此购买明细以核销。' });
    });
  };

  const saveEdits = async () => {
    if (!editForm.name.trim()) {
      safeShowPopup({ title: '提示', message: '商户名称不能为空', buttons: [{ type: 'ok' }] });
      return;
    }
    setSubmitting(true);
    const validDeals = editForm.deals.filter(d => d.title.trim());
    const updatePayload = {
      name: editForm.name.trim(),
      category: editForm.category,
      owner_tg_id: editForm.owner_tg.trim(),
      homepage_url: editForm.homepage_url.trim(),
      description: editForm.description.trim(),
      physical_address: editForm.address.trim(),
      lat: editForm.geo.lat,
      lng: editForm.geo.lng,
      deals: validDeals,
      deal_title: validDeals[0]?.title || '',
      deal_points: validDeals[0]?.points || 0
    };
    const { error } = await supabase.from('merchants').update(updatePayload).eq('id', data.id);
    if (!error) {
      setData({ ...data, ...updatePayload, physical_address: updatePayload.physical_address });
      setIsEditing(false);
      try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
    }
    setSubmitting(false);
  };

  const submitReview = async () => {
    if (!newReview.trim()) return;
    setSubmitting(true);
    const rewardPoints = Math.floor(Math.random() * 5) + 5;
    const { error } = await supabase.from('reviews').insert({
      merchant_id: data.id, tg_user_id: currentUser.id, tg_username: currentUser.username, content: newReview.trim()
    });
    if (!error) {
      await supabase.from('points_history').insert({ tg_user_id: currentUser.id, action: `发布评价 - ${data.name.substring(0, 10)}`, points: rewardPoints });
      setNewReview('');
      fetchReviews();
      safeShowPopup({ title: '🌟 评价发布成功', message: `感谢您的分享！系统赠送了 ${rewardPoints} 积分！`, buttons: [{ type: 'ok', text: '收下积分' }] });
    }
    setSubmitting(false);
  };

  const toggleLike = async (review) => {
    try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e){}
    const newLikedStatus = !review.likedByMe;
    const newLikesCount = review.likes + (newLikedStatus ? 1 : -1);
    setReviews(reviews.map(r => r.id === review.id ? { ...r, likedByMe: newLikedStatus, likes: newLikesCount } : r));
    if (newLikedStatus) {
      await supabase.from('review_likes').insert({ review_id: review.id, tg_user_id: currentUser.id });
      await supabase.from('reviews').update({ likes: newLikesCount }).eq('id', review.id);
    } else {
      await supabase.from('review_likes').delete().eq('review_id', review.id).eq('tg_user_id', currentUser.id);
      await supabase.from('reviews').update({ likes: newLikesCount }).eq('id', review.id);
    }
  };

  // --- Extract images ---
  let images = [];
  try {
    let media = data.media_urls;
    if (typeof media === 'string') media = JSON.parse(media);
    if (Array.isArray(media) && media.length > 0) {
       images = media.map(m => m?.url || m).filter(Boolean);
    }
  } catch (e) { }
  if (images.length === 0) {
    images = [FALLBACK_IMAGES[data.category] || FALLBACK_IMAGES['默认']];
  }

  return (
    <div className="space-y-5 pb-20">
      {/* ====== Cover Image ====== */}
      <div className="relative aspect-[16/9] -mx-4 -mt-5 overflow-hidden bg-gray-100">
        <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar" style={{ scrollBehavior: 'smooth' }}>
           {images.map((img, i) => (
             <img key={i} src={img} alt={data.name} className="w-full h-full object-cover flex-shrink-0 snap-center" />
           ))}
        </div>
        {images.length > 1 && (
           <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-2 py-1 rounded-full backdrop-blur-md">
              {images.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70" />)}
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
           <div className="flex items-center gap-2">
             <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 营业中
             </span>
             {data.is_sponsored && (
                <span className="px-2.5 py-1 bg-rose-500/90 backdrop-blur-md rounded-full text-[10px] font-bold text-white">👑 赞助精选</span>
             )}
           </div>
           <button onClick={handleShare} className="p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 text-white active:scale-95 transition-all">
              <Share2 size={15} />
           </button>
        </div>

        {/* Name overlay on image */}
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
           <h2 className="text-2xl font-black text-white drop-shadow-lg flex items-center gap-2 leading-none">
              {data.name}
              {data.is_verified && <CheckCircle className="text-blue-400 flex-shrink-0" size={20} fill="currentColor" color="white" />}
           </h2>
           <span className="mt-1.5 inline-block px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-md text-[11px] font-bold text-white border border-white/10">
             {data.category}
           </span>
        </div>
      </div>

      {/* ====== Info Area ====== */}
      <div className="px-1 space-y-4">
        {/* Meta + Role Badge + Actions */}
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-2">
             <span className="text-[10px] text-tg-hint font-medium">提交于 {new Date(data.created_at).toLocaleDateString()}</span>
             {data.is_verified ? (
               <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-black rounded-md">已认领</span>
             ) : (
               <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-black rounded-md">待认领</span>
             )}
           </div>
           <div className="flex items-center gap-2">
             {canEdit && !isEditing && (
               <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold active:scale-95">
                 <Edit3 size={13} /> 编辑
               </button>
             )}
             {canClaim && (
               <button onClick={handleClaim} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold active:scale-95">
                 <ShieldCheck size={14}/> 认领该店
               </button>
             )}
           </div>
        </div>

        {/* ====== EDIT MODE ====== */}
        {isEditing ? (
          <div className="space-y-3 glass-card p-4 border border-blue-500/30">
             <p className="text-xs font-bold text-blue-500 mb-2">{data.is_verified ? '修改店铺信息 (老板专属)' : '修改店铺信息 (创建者编辑)'}</p>

             {/* 商户名称 & 类目 */}
             <div>
               <label className="text-xs text-tg-hint font-bold">商户名称 <span className="text-red-500">*</span></label>
               <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="tg-input py-2 mt-1" placeholder="商户名称" />
             </div>
             <div>
               <label className="text-xs text-tg-hint font-bold">经营类目</label>
               <select className="tg-input py-2 mt-1 appearance-none bg-white" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                 <option value="">请选择类目</option>
                 {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
             </div>

             <hr className="border-black/5 border-dashed" />

             {/* 联系方式 & 频道 */}
             <div>
               <label className="text-xs text-tg-hint font-bold">频道/Channel 链接</label>
               <div className="relative">
                 <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input type="text" placeholder="https://..." className="tg-input py-2 mt-1 pl-9" value={editForm.homepage_url} onChange={e => setEditForm({...editForm, homepage_url: e.target.value})} />
               </div>
             </div>
             <div>
               <label className="text-xs text-tg-hint font-bold">老板 Telegram</label>
               <div className="relative">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tg-hint text-sm font-medium">t.me/</div>
                 <input type="text" placeholder="username" className="tg-input py-2 mt-1 pl-[3.5rem]" value={editForm.owner_tg} onChange={e => setEditForm({...editForm, owner_tg: e.target.value})} />
               </div>
             </div>

             <hr className="border-black/5 border-dashed" />

             {/* 店铺描述 */}
             <div>
               <label className="text-xs text-tg-hint font-bold">店铺描述</label>
               <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="tg-input py-2 mt-1 resize-none h-20" placeholder="介绍一下这家店..." />
             </div>

             <hr className="border-black/5 border-dashed" />

             {/* 详细地址 & 地图 */}
             <div>
               <label className="text-xs text-tg-hint font-bold">详细地址</label>
               <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="tg-input py-2 mt-1" placeholder="街道、楼栋、门牌号..." />
             </div>
             <div className="aspect-[16/10] rounded-xl overflow-hidden my-1 border border-black/10 shadow-inner">
                <LocationPicker geo={editForm.geo} onChange={(geo) => setEditForm({ ...editForm, geo })} />
             </div>
             {/* 营销福利 - 仅认领老板可编辑 */}
             {data.is_verified && (
               <div className="pt-3 border-t border-blue-500/20 mt-3">
                 <p className="text-xs font-bold text-amber-500 mb-2.5 flex items-center gap-1.5"><Ticket size={14}/> 营销中心 (老板专属)</p>
                 {editForm.deals.map((deal, idx) => (
                   <div key={idx} className="flex gap-2 items-end mb-2 p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/50">
                      <div className="flex-[3]">
                        {idx === 0 && <label className="text-[10px] text-tg-hint font-bold">福利名称</label>}
                        <input type="text" placeholder="如: 5折咖啡券" value={deal.title} onChange={e => { const d = [...editForm.deals]; d[idx] = {...d[idx], title: e.target.value}; setEditForm({...editForm, deals: d}); }} className="tg-input py-1.5 mt-0.5 w-full text-xs" />
                      </div>
                      <div className="flex-1">
                        {idx === 0 && <label className="text-[10px] text-tg-hint font-bold">积分</label>}
                        <input type="number" min="0" value={deal.points} onChange={e => { const d = [...editForm.deals]; d[idx] = {...d[idx], points: Math.max(0, parseInt(e.target.value) || 0)}; setEditForm({...editForm, deals: d}); }} className="tg-input py-1.5 mt-0.5 w-full text-xs" />
                      </div>
                      <div className="flex-1">
                        {idx === 0 && <label className="text-[10px] text-tg-hint font-bold">数量</label>}
                        <input type="number" min="0" placeholder="不限" value={deal.quantity || ''} onChange={e => { const d = [...editForm.deals]; d[idx] = {...d[idx], quantity: Math.max(0, parseInt(e.target.value) || 0)}; setEditForm({...editForm, deals: d}); }} className="tg-input py-1.5 mt-0.5 w-full text-xs" />
                      </div>
                      <button type="button" onClick={() => { const d = editForm.deals.filter((_, i) => i !== idx); setEditForm({...editForm, deals: d}); }} className="p-1.5 text-red-400 hover:text-red-600 active:scale-90 flex-shrink-0 mb-0.5">
                        <Plus size={14} className="rotate-45" />
                      </button>
                   </div>
                 ))}
                 <button type="button" onClick={() => setEditForm({...editForm, deals: [...editForm.deals, { title: '', points: 0, quantity: 0 }]})} className="w-full py-2 rounded-xl border border-dashed border-amber-300 text-amber-600 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 mt-1">
                   <Plus size={14} /> 添加营销活动
                 </button>
               </div>
             )}
             {!data.is_verified && (
               <p className="text-[10px] text-tg-hint italic text-center pt-3 border-t border-black/5 mt-3">🔒 认领商户后可发布营销福利活动</p>
             )}
             {!data.is_sponsored && data.is_verified && (
               <button onClick={handleBoost} type="button" className="w-full mt-3 py-3 rounded-xl border border-rose-500/30 text-rose-500 bg-rose-500/5 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95">
                 <Zap size={16} /> 消耗 1000 积分首页置顶
               </button>
             )}
             <div className="flex gap-2 mt-4 pt-3 border-t border-blue-500/20">
               <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-600 font-bold text-sm active:scale-95" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>取消</button>
               <button onClick={saveEdits} disabled={submitting} className="flex-[2] py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm flex justify-center items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95">
                 {submitting ? <Loader2 size={16} className="animate-spin" /> : '确认发布'}
               </button>
             </div>
          </div>
        ) : (
          <div className="space-y-4">

            {/* ① 商户简介 */}
            {data.description && (
              <div className="glass-card p-4">
                 <p className="text-[10px] font-black text-tg-hint uppercase tracking-widest mb-2">商户简介</p>
                 <p className="text-sm text-tg-text leading-relaxed whitespace-pre-wrap">{data.description}</p>
              </div>
            )}

            {/* ② 联系方式 & 链接 */}
            <div className="glass-card p-4 space-y-0">
               <p className="text-[10px] font-black text-tg-hint uppercase tracking-widest mb-3">联系方式</p>
               
               {data.owner_tg_id && (
                 <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                          <MessageCircle size={18} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-tg-text">老板 Telegram</p>
                          <p className="text-[11px] text-tg-link font-medium">t.me/{data.owner_tg_id}</p>
                       </div>
                    </div>
                    <button onClick={handleContact} className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5">
                      <MessageCircle size={13} /> 私聊
                    </button>
                 </div>
               )}

               {data.homepage_url && (
                 <div className={clsx("flex items-center justify-between py-3", data.owner_tg_id && "border-t border-black/5")}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-400 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                          <LinkIcon size={18} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-xs font-black text-tg-text">频道 / Channel</p>
                          <p className="text-[11px] text-tg-link font-medium truncate max-w-[180px]">{data.homepage_url.replace(/^https?:\/\//, '')}</p>
                       </div>
                    </div>
                    <a href={data.homepage_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex-shrink-0">
                      打开
                    </a>
                 </div>
               )}

               {!data.owner_tg_id && !data.homepage_url && (
                  <p className="text-xs text-tg-hint italic text-center py-3">暂未提供联系方式</p>
               )}
            </div>

            {/* ③ 标签 */}
            {tags.length > 0 && (
              <div className="glass-card p-4">
                 <p className="text-[10px] font-black text-tg-hint uppercase tracking-widest mb-3">用户标签 · 点击认同 +1</p>
                 <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                       <button 
                         key={tag.name}
                         onClick={() => handleUpvoteTag(tag)}
                         disabled={tag.votedByMe}
                         className={clsx(
                           "px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all",
                           tag.votedByMe ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" : "bg-white border-black/5 text-tg-hint active:scale-95 hover:bg-gray-50"
                         )}
                       >
                         <span>{tag.name}</span>
                         <span className={clsx("px-1.5 py-0.5 rounded-md text-[9px] font-black", tag.votedByMe ? "bg-amber-200/60" : "bg-gray-100")}>+{tag.count}</span>
                       </button>
                    ))}
                 </div>
              </div>
            )}

            {/* ④ 地址 & 地图 */}
            <div className="glass-card p-4 space-y-3">
               <p className="text-[10px] font-black text-tg-hint uppercase tracking-widest mb-1">详细地址</p>
               <div className="flex items-start gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-sm flex-shrink-0 mt-0.5">
                    <MapPin size={18} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-tg-text leading-snug">{data.physical_address || '暂无详细地址'}</p>
                    {data.lat && data.lng && (
                       <p className="text-[10px] text-tg-hint mt-1 font-mono opacity-60">{Number(data.lat).toFixed(4)}, {Number(data.lng).toFixed(4)}</p>
                    )}
                 </div>
               </div>
               {data.lat && data.lng && (
                 <div className="aspect-[21/9] rounded-xl overflow-hidden border border-black/5 opacity-90 pointer-events-none shadow-inner">
                    <LocationPicker geo={{ lat: data.lat, lng: data.lng }} readonly={true} />
                 </div>
               )}
            </div>

            {/* ⑤ 营销福利券列表 */}
            {(() => {
              const deals = parseDeals(data);
              if (deals.length === 0) return null;
              return (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-tg-hint uppercase tracking-widest">营销福利</p>
                  {deals.map((deal, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 shadow-lg shadow-orange-500/20 text-white flex justify-between items-center relative overflow-hidden active:scale-[0.98] transition-transform">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl z-0" />
                       <div className="z-10 flex-1 pr-4">
                          <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-bold mb-1 opacity-90"><Ticket size={14} /> 粉丝专属福利</div>
                          <p className="text-lg font-black leading-tight drop-shadow-sm">{deal.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-white/90 bg-black/10 px-2 py-0.5 rounded">💎 {deal.points} 积分</span>
                            {deal.quantity > 0 && <span className="text-xs font-bold text-white/90 bg-black/10 px-2 py-0.5 rounded">剩余 {deal.quantity} 份</span>}
                            {deal.quantity === 0 && <span className="text-[10px] text-white/70">不限量</span>}
                          </div>
                       </div>
                       <button onClick={() => handleBuyDeal(deal)} disabled={submitting || (deal.quantity > 0 && deal.quantity <= 0)} className="z-10 flex-shrink-0 px-4 py-2 bg-white text-orange-500 rounded-xl font-black text-sm shadow-sm active:scale-90 transition-transform disabled:opacity-50">
                          抢名额
                       </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <hr className="border-black/5 mx-1 my-5" />

      {/* ====== Reviews Section ====== */}
      <div className="px-1 space-y-4">
        <h3 className="text-lg font-black text-tg-text">商户评价 <span className="text-tg-hint text-sm font-normal">({reviews.length})</span></h3>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="text" placeholder="写下你的评价..." value={newReview}
            onChange={e => setNewReview(e.target.value)}
            className="tg-input py-2.5 flex-1 bg-gray-100"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          />
          <button onClick={submitReview} disabled={submitting || !newReview.trim()} className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center text-white disabled:opacity-50 active:scale-95">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>

        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="p-4 glass-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-white font-bold text-xs">
                    {review.tg_username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-tg-text">{review.tg_username}</p>
                    <p className="text-[10px] text-tg-hint">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleLike(review)}
                  className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all",
                    review.likedByMe ? "bg-rose-500/10 text-rose-500" : "bg-gray-100 text-gray-500"
                  )}
                  style={!review.likedByMe ? { backgroundColor: 'var(--tg-theme-secondary-bg-color)' } : {}}
                >
                  <Heart size={14} fill={review.likedByMe ? "currentColor" : "none"} />
                  {review.likes > 0 && review.likes}
                </button>
              </div>
              <p className="mt-2 text-sm text-tg-text leading-relaxed">{review.content}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-center text-xs text-tg-hint py-6 bg-gray-50 rounded-xl" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
              还没有人评价，来抢个沙发吧！
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
