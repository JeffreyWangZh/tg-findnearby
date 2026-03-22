import WebApp from '@twa-dev/sdk'
import { MessageCircle, Star, MapPin, Share2, MoreHorizontal, CheckCircle } from 'lucide-react'
import { contactMerchantOwner } from '../utils/telegram'

export default function MerchantProfile({ merchant }) {
  // Mock merchant if none provided
  const data = merchant || {
    name: "Golden Lotus Tea House",
    category: "Cafe",
    address: "123 Orchard Road, District 9",
    rating: 4.8,
    reviews: 124,
    owner_tg: "lotus_owner",
    status: "approved",
    media: [
       "https://images.unsplash.com/photo-1544787210-282aa518c7c2?q=80&w=400&h=300&fit=crop"
    ]
  };

  const handleContact = () => {
    // Technical Requirement: Logically connect the t.me/ username to the button
    contactMerchantOwner(data.owner_tg);
  };

  const handleShare = () => {
    // Example of using Telegram WebApp features
    WebApp.showPopup({
      message: 'Share this merchant with friends?',
      buttons: [{ text: 'Yes, Send', type: 'default' }, { text: 'Cancel', type: 'cancel' }]
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cover Media */}
      <div className="relative aspect-[4/3] -mx-4 -mt-6 overflow-hidden border-b border-white/5">
         <img src={data.media[0]} alt={data.name} className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-tg-bg via-transparent to-black/30" />
         
         {/* Top Actions */}
         <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Open Now
            </div>
            <div className="flex gap-2">
               <button onClick={handleShare} className="p-2.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 text-white active:scale-95 transition-all">
                  <Share2 size={16} />
               </button>
               <button className="p-2.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 text-white active:scale-95 transition-all">
                  <MoreHorizontal size={16} />
               </button>
            </div>
         </div>
      </div>

      {/* Profile Details */}
      <div className="px-2 space-y-4">
         <div className="flex justify-between items-start">
            <div className="space-y-1">
               <h2 className="text-3xl font-black text-tg-text uppercase tracking-tight italic flex items-center gap-2">
                  {data.name} 
                  {data.status === 'approved' && <CheckCircle className="text-tg-link" size={24} fill="currentColor" fillOpacity={0.15} />}
               </h2>
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-tg-link uppercase tracking-widest">{data.category}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-400/30" />
                  <div className="flex items-center gap-1">
                     <Star size={12} className="text-amber-400 fill-amber-400" />
                     <span className="text-xs font-extrabold text-tg-text">{data.rating}</span>
                     <span className="text-[10px] font-medium text-tg-hint">({data.reviews} reviews)</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="p-4 glass-card flex items-center gap-4 group active:bg-tg-secondary-bg transition-colors">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 group-hover:scale-110 transition-transform">
               <MapPin size={20} />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-black uppercase tracking-widest text-tg-hint">Location</p>
               <p className="text-sm font-bold text-tg-text leading-tight">{data.address}</p>
            </div>
         </div>

         {/* Technical Requirement: Contact Boss Button */}
         <div className="pt-4 grid grid-cols-5 gap-3">
            <button 
              onClick={handleContact}
              className="col-span-4 tg-button py-5 flex items-center justify-center gap-3 bg-gradient-to-r from-tg-button to-[#40a7e3]"
            >
               <MessageCircle size={20} fill="white" fillOpacity={0.2} strokeWidth={2.5} />
               Contact Boss
            </button>
            <button className="col-span-1 py-5 bg-tg-secondary-bg rounded-2xl border border-white/5 flex items-center justify-center text-tg-link active:scale-95 transition-all shadow-lg">
               <CheckCircle size={20} />
            </button>
         </div>
         
         <p className="text-[9px] text-tg-hint text-center font-bold uppercase tracking-[0.2em] pt-2">
            Verified Partner of <span className="text-tg-link italic">NearbyPulse Pro</span>
         </p>
      </div>
    </div>
  )
}
