import WebApp from '@twa-dev/sdk'
import { MessageCircle, Star, MapPin, Share2, CheckCircle } from 'lucide-react'
import { contactMerchantOwner } from '../utils/telegram'

export default function MerchantProfile({ merchant }) {
  const data = merchant || {
    name: "金莲花茶馆",
    category: "咖啡茶饮",
    address: "深圳市南山区科技园南路88号",
    rating: 4.8,
    reviews: 124,
    owner_tg: "lotus_owner",
    status: "approved",
    media: [
       "https://images.unsplash.com/photo-1544787210-282aa518c7c2?q=80&w=400&h=300&fit=crop"
    ]
  };

  const handleContact = () => {
    contactMerchantOwner(data.owner_tg);
  };

  const handleShare = () => {
    WebApp.showPopup({
      message: '分享此商户给好友？',
      buttons: [{ text: '立即分享', type: 'default' }, { text: '取消', type: 'cancel' }]
    });
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Cover Image */}
      <div className="relative aspect-[4/3] -mx-4 -mt-5 overflow-hidden">
         <img src={data.media[0]} alt={data.name} className="w-full h-full object-cover" />
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

      {/* Profile Info */}
      <div className="px-1 space-y-4">
         <div>
            <h2 className="text-xl font-black text-tg-text flex items-center gap-2">
               {data.name} 
               {data.status === 'approved' && <CheckCircle className="text-tg-link" size={18} />}
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-xs font-bold text-tg-link">{data.category}</span>
               <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
               <div className="flex items-center gap-1">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-tg-text">{data.rating}</span>
                  <span className="text-[10px] text-tg-hint">({data.reviews}条评价)</span>
               </div>
            </div>
         </div>

         {/* Location */}
         <div className="p-3.5 glass-card flex items-center gap-3.5">
            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
               <MapPin size={18} />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-bold text-tg-hint">商户地址</p>
               <p className="text-sm font-bold text-tg-text truncate">{data.address}</p>
            </div>
         </div>

         {/* Contact Boss Button */}
         <button 
           onClick={handleContact}
           className="tg-button py-4 flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-500 to-blue-600"
         >
            <MessageCircle size={18} />
            联系老板
         </button>
         
         <p className="text-[10px] text-tg-hint text-center">
            点击将直接打开 Telegram 对话
         </p>
      </div>
    </div>
  )
}
