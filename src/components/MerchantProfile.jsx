import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { MessageCircle, MapPin, Share2, CheckCircle, Edit3, Heart, Send, Loader2, ShieldCheck, Ticket, Zap } from 'lucide-react'
import { contactMerchantOwner, getCurrentTgUser } from '../utils/telegram'
import { supabase } from '../lib/supabase'
import clsx from 'clsx'
import LocationPicker from './LocationPicker'

export default function MerchantProfile({ merchant, onBack }) {
  const [data, setData] = useState(merchant);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const currentUser = getCurrentTgUser();
  const isCreator = data.submitter_tg_id === currentUser.id;

  const [editForm, setEditForm] = useState({
    description: data.description || '',
    address: data.physical_address || '',
    geo: { lat: data.lat || 22.54, lng: data.lng || 114.05 },
    deal_title: data.deal_title || '',
    deal_points: data.deal_points || 0
  });

  useEffect(() => {
    fetchReviews();
  }, [data.id]);

  const fetchReviews = async () => {
    const { data: revs, error } = await supabase
      .from('reviews')
      .select('*, review_likes(tg_user_id)')
      .eq('merchant_id', data.id)
      .order('created_at', { ascending: false });

    if (!error && revs) {
      const formatted = revs.map(r => ({
        ...r,
        likedByMe: r.review_likes.some(like => like.tg_user_id === currentUser.id)
      }));
      setReviews(formatted);
    }
  };

  const handleContact = () => contactMerchantOwner(data.owner_tg_id);

  const handleShare = () => {
    WebApp.showPopup({
      message: '分享此商户给好友？',
      buttons: [{ text: '立即分享', type: 'default' }, { text: '取消', type: 'cancel' }]
    });
  };

  const handleBoost = async () => {
    WebApp.showConfirm("消耗 1000 积分将店铺置顶至首页精选，确认操作？", async (ok) => {
      if (!ok) return;
      setSubmitting(true);
      await supabase.from('points_history').insert({
        tg_user_id: currentUser.id, action: `购买首页爆量精选曝光`, points: -1000
      });
      await supabase.from('merchants').update({ is_sponsored: true }).eq('id', data.id);
      setData({...data, is_sponsored: true});
      setSubmitting(false);
      WebApp.HapticFeedback.notificationOccurred('success');
      WebApp.showPopup({ title: '👑 置顶成功', message: '您的店铺已被置顶展示！' });
    });
  };

  const handleClaim = () => {
    WebApp.showConfirm("需支付 500 积分认证成为官方蓝V老板，开启专属营销权限全功能，是否确认？", async (ok) => {
      if (!ok) return;
      setSubmitting(true);
      await supabase.from('points_history').insert({
        tg_user_id: currentUser.id, action: `官方认证蓝V - ${data.name}`, points: -500
      });
      await supabase.from('merchants').update({
        is_verified: true,
        submitter_tg_id: currentUser.id
      }).eq('id', data.id);
      setData({...data, is_verified: true, submitter_tg_id: currentUser.id});
      setSubmitting(false);
      WebApp.HapticFeedback.notificationOccurred('success');
      WebApp.showPopup({ title: '💎 认领成功', message: '您现在享有该店的完全编辑与营销配置权限！' });
    });
  };

  const handleBuyDeal = () => {
    WebApp.showConfirm(`将扣除 ${data.deal_points} 积分抢购 [${data.deal_title}]，不可退换。确认兑换？`, async (ok) => {
      if (!ok) return;
      setSubmitting(true);
      await supabase.from('points_history').insert({
        tg_user_id: currentUser.id, action: `购买特权 - ${data.deal_title}`, points: -data.deal_points
      });
      setSubmitting(false);
      WebApp.HapticFeedback.notificationOccurred('success');
      WebApp.showPopup({ title: '🎉 兑换成功', message: `请向商家出示此购买记录以核销 ${data.deal_title}` });
    });
  };

  const saveEdits = async () => {
    setSubmitting(true);
    const { error } = await supabase
      .from('merchants')
      .update({
        description: editForm.description,
        physical_address: editForm.address,
        lat: editForm.geo.lat,
        lng: editForm.geo.lng,
        deal_title: editForm.deal_title,
        deal_points: editForm.deal_points
      })
      .eq('id', data.id);

    if (!error) {
      setData({ ...data, description: editForm.description, physical_address: editForm.address, lat: editForm.geo.lat, lng: editForm.geo.lng, deal_title: editForm.deal_title, deal_points: editForm.deal_points });
      setIsEditing(false);
      WebApp.HapticFeedback.notificationOccurred('success');
    }
    setSubmitting(false);
  };

  const submitReview = async () => {
    if (!newReview.trim()) return;
    setSubmitting(true);
    
    // 模拟积分奖励 5-10
    const rewardPoints = Math.floor(Math.random() * 5) + 5;

    const { error } = await supabase
      .from('reviews')
      .insert({
        merchant_id: data.id,
        tg_user_id: currentUser.id,
        tg_username: currentUser.username,
        content: newReview.trim()
      });

    if (!error) {
      // 记录积分历史
      await supabase.from('points_history').insert({
        tg_user_id: currentUser.id,
        action: `发布评价 - ${data.name.substring(0, 10)}`,
        points: rewardPoints
      });

      setNewReview('');
      fetchReviews();
      WebApp.showPopup({
         title: '🌟 评价发布成功',
         message: `感谢您的分享！系统赠送了 ${rewardPoints} 积分！\n可在【我的】中查看明细。`,
         buttons: [{ type: 'ok', text: '收下积分' }]
      });
    }
    setSubmitting(false);
  };

  const toggleLike = async (review) => {
    WebApp.HapticFeedback.impactOccurred('light');
    const newLikedStatus = !review.likedByMe;
    const newLikesCount = review.likes + (newLikedStatus ? 1 : -1);

    // 乐观更新 UI
    setReviews(reviews.map(r => 
      r.id === review.id ? { ...r, likedByMe: newLikedStatus, likes: newLikesCount } : r
    ));

    if (newLikedStatus) {
      await supabase.from('review_likes').insert({ review_id: review.id, tg_user_id: currentUser.id });
      await supabase.from('reviews').update({ likes: newLikesCount }).eq('id', review.id);
    } else {
      await supabase.from('review_likes').delete().eq('review_id', review.id).eq('tg_user_id', currentUser.id);
      await supabase.from('reviews').update({ likes: newLikesCount }).eq('id', review.id);
    }
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Cover Image */}
      {data.media_urls?.[0] && (
        <div className="relative aspect-[4/3] -mx-4 -mt-5 overflow-hidden">
           <img src={data.media_urls[0].url} alt={data.name} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-tg-bg via-transparent to-black/20" />
           
           <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
              <div className="px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 营业中
              </div>
              <button onClick={handleShare} className="p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 text-white active:scale-95 transition-all">
                 <Share2 size={15} />
              </button>
           </div>
        </div>
      )}

       {/* Profile Info */}
       <div className="px-1 space-y-4">
          <div className="flex justify-between items-start">
             <div>
                <h2 className="text-xl font-black text-tg-text flex items-center gap-2">
                   {data.name} 
                   {data.is_verified && <CheckCircle className="text-blue-500" size={18} fill="currentColor" color="white" />}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs font-bold text-tg-link">{data.category}</span>
                </div>
             </div>
             {isCreator && !isEditing ? (
               <button 
                 onClick={() => setIsEditing(true)}
                 className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"
               >
                 <Edit3 size={16} />
               </button>
             ) : (!isCreator && !data.is_verified) ? (
               <button onClick={handleClaim} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold active:scale-95 shadow-sm">
                 <ShieldCheck size={14}/> 认领该店
               </button>
             ) : null}
          </div>

          {/* Location & Description */}
          {isEditing ? (
            <div className="space-y-3 glass-card p-4 border border-blue-500/30">
               <p className="text-xs font-bold text-blue-500 mb-2">修改店铺信息 (仅老板可见)</p>
               <div>
                 <label className="text-xs text-tg-hint font-bold">详细地址</label>
                 <input 
                   type="text" 
                   value={editForm.address} 
                   onChange={e => setEditForm({...editForm, address: e.target.value})} 
                   className="tg-input py-2 mt-1" 
                 />
               </div>
               <div className="aspect-[16/10] rounded-xl overflow-hidden my-3 border border-black/10 shadow-inner">
                  <LocationPicker 
                    geo={editForm.geo} 
                    onChange={(geo) => setEditForm({ ...editForm, geo })}
                  />
               </div>
               <div>
                 <label className="text-xs text-tg-hint font-bold">店铺描述</label>
                 <textarea 
                   value={editForm.description} 
                   onChange={e => setEditForm({...editForm, description: e.target.value})} 
                   className="tg-input py-2 mt-1 resize-none h-20" 
                 />
               </div>

               {/* 营销增值模块 */}
               <div className="pt-3 border-t border-blue-500/20 mt-3">
                 <p className="text-xs font-bold text-amber-500 mb-2.5 flex items-center gap-1.5"><Ticket size={14}/> 营销中心：发放引流获客券</p>
                 <div className="flex gap-2">
                    <div className="flex-[2]">
                      <label className="text-[10px] text-tg-hint font-bold">福利名称 (如: 5折咖啡券)</label>
                      <input type="text" placeholder="留空则不发放" value={editForm.deal_title} onChange={e => setEditForm({...editForm, deal_title: e.target.value})} className="tg-input py-2 mt-1 w-full text-xs bg-amber-50/50" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-tg-hint font-bold">单份兑换(积分)</label>
                      <input type="number" min="0" value={editForm.deal_points} onChange={e => setEditForm({...editForm, deal_points: parseInt(e.target.value) || 0})} className="tg-input py-2 mt-1 w-full text-xs bg-amber-50/50" />
                    </div>
                 </div>
               </div>

               {!data.is_sponsored && (
                 <button onClick={handleBoost} type="button" className="w-full mt-3 py-3 rounded-xl border border-rose-500/30 text-rose-500 bg-rose-500/5 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                   <Zap size={16} /> 消耗 1000 积分将店铺在首页置顶
                 </button>
               )}

               <div className="flex gap-2 mt-4 pt-3 border-t border-blue-500/20">
                 <button 
                   onClick={() => setIsEditing(false)} 
                   className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition-all"
                   style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
                 >
                   取消
                 </button>
                 <button 
                   onClick={saveEdits} 
                   disabled={submitting}
                   className="flex-[2] py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm flex justify-center items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                 >
                   {submitting ? <Loader2 size={16} className="animate-spin" /> : '确认发布'}
                 </button>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 glass-card space-y-3">
                 <div className="flex items-start gap-3.5">
                   <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
                      <MapPin size={18} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-tg-hint">商户地址</p>
                      <p className="text-sm font-bold text-tg-text pr-2 leading-tight">{data.physical_address}</p>
                   </div>
                 </div>
                 <div className="aspect-[21/9] rounded-xl overflow-hidden border border-black/5 opacity-80 pointer-events-none">
                    <LocationPicker 
                      geo={{ lat: data.lat, lng: data.lng }} 
                      readonly={true}
                    />
                 </div>
                 {data.description && (
                   <div className="pt-2 border-t border-black/5">
                     <p className="text-sm text-tg-text leading-relaxed whitespace-pre-wrap">{data.description}</p>
                   </div>
                 )}
              </div>
              
              {/* O2O 变现核心区 - Deal / Coupon Card */}
              {data.deal_title && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 shadow-lg shadow-orange-500/20 text-white flex justify-between items-center relative overflow-hidden transform active:scale-[0.98] transition-transform">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl z-0" />
                   <div className="z-10 flex-1 pr-4">
                      <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-bold mb-1 opacity-90"><Ticket size={14} /> 粉丝专属特供福利</div>
                      <p className="text-lg font-black leading-tight drop-shadow-sm">{data.deal_title}</p>
                      <p className="text-xs font-bold mt-1 text-white/90 bg-black/10 inline-block px-2 py-0.5 rounded pl-1">💎 兑换需 {data.deal_points} 积分</p>
                   </div>
                   <button onClick={handleBuyDeal} disabled={submitting} className="z-10 flex-shrink-0 px-4 py-2 bg-white text-orange-500 rounded-xl font-black text-sm shadow-sm active:scale-90 transition-transform disabled:opacity-50 tracking-wide">
                      抢名额
                   </button>
                </div>
              )}
            </div>
          )}

         {/* Contact Boss Button */}
         {data.owner_tg_id && (
           <button 
             onClick={handleContact}
             className="tg-button py-3.5 flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/20"
           >
              <MessageCircle size={18} />
              联系老板
           </button>
         )}
      </div>

      <hr className="border-black/5 mx-1 my-5" />

      {/* Reviews Section */}
      <div className="px-1 space-y-4">
        <h3 className="text-lg font-black text-tg-text">商户评价 <span className="text-tg-hint text-sm font-normal">({reviews.length})</span></h3>
        
        {/* Write Review */}
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="写下你的评价..." 
            value={newReview}
            onChange={e => setNewReview(e.target.value)}
            className="tg-input py-2.5 flex-1 bg-gray-100"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          />
          <button 
            onClick={submitReview}
            disabled={submitting || !newReview.trim()}
            className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center text-white disabled:opacity-50 active:scale-95"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>

        {/* Reviews List */}
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
