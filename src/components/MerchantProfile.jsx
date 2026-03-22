import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { MessageCircle, MapPin, Share2, CheckCircle, Edit3, Heart, Send, Loader2 } from 'lucide-react'
import { contactMerchantOwner, getCurrentTgUser } from '../utils/telegram'
import { supabase } from '../lib/supabase'
import clsx from 'clsx'

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

  const saveEdits = async () => {
    setSubmitting(true);
    const { error } = await supabase
      .from('merchants')
      .update({
        description: editForm.description,
        physical_address: editForm.address
      })
      .eq('id', data.id);

    if (!error) {
      setData({ ...data, description: editForm.description, physical_address: editForm.address });
      setIsEditing(false);
      WebApp.HapticFeedback.notificationOccurred('success');
    }
    setSubmitting(false);
  };

  const submitReview = async () => {
    if (!newReview.trim()) return;
    setSubmitting(true);
    
    // 模拟积分奖励
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
      setNewReview('');
      fetchReviews();
      WebApp.showPopup({
         title: '🌟 评价发布成功',
         message: `感谢您的分享！系统赠送了 ${rewardPoints} 积分作为奖励！`,
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
                  {data.status === 'approved' && <CheckCircle className="text-tg-link" size={18} />}
               </h2>
               <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-tg-link">{data.category}</span>
               </div>
            </div>
            {isCreator && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"
              >
                <Edit3 size={16} />
              </button>
            )}
         </div>

         {/* Location & Description */}
         {isEditing ? (
           <div className="space-y-3 glass-card p-4 border border-blue-500/30">
              <p className="text-xs font-bold text-blue-500 mb-2">修改店铺信息 (仅创建者可见)</p>
              <div>
                <label className="text-xs text-tg-hint font-bold">详细地址</label>
                <input 
                  type="text" 
                  value={editForm.address} 
                  onChange={e => setEditForm({...editForm, address: e.target.value})} 
                  className="tg-input py-2 mt-1" 
                />
              </div>
              <div>
                <label className="text-xs text-tg-hint font-bold">店铺描述</label>
                <textarea 
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} 
                  className="tg-input py-2 mt-1 resize-none" 
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-600 font-bold text-sm"
                  style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
                >
                  取消
                </button>
                <button 
                  onClick={saveEdits} 
                  disabled={submitting}
                  className="flex-[2] py-2 rounded-xl bg-blue-500 text-white font-bold text-sm flex justify-center items-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : '保存修改'}
                </button>
              </div>
           </div>
         ) : (
           <div className="p-3.5 glass-card space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
                   <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-bold text-tg-hint">商户地址</p>
                   <p className="text-sm font-bold text-tg-text">{data.physical_address}</p>
                </div>
              </div>
              {data.description && (
                <div className="pt-3 border-t border-black/5">
                  <p className="text-sm text-tg-text leading-relaxed">{data.description}</p>
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
