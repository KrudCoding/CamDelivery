import React, { useState } from 'react';
import {
  Star,
  X,
  ThumbsUp,
  Heart,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
  Coins,
  MessageSquare,
  Truck
} from 'lucide-react';
import { TrackingItem, Language, DeliveryReview } from '../types';

interface PostDeliveryReviewModalProps {
  shipment: TrackingItem;
  language: Language;
  onClose: () => void;
  onSubmitReview: (review: DeliveryReview) => void;
}

const REVIEW_TAGS = [
  { id: 'on_time', labelKm: 'មកដល់ទាន់ពេល', labelEn: 'On-Time Delivery' },
  { id: 'polite', labelKm: 'គួរសមរួសរាយ', labelEn: 'Polite & Courteous' },
  { id: 'safe_parcel', labelKm: 'ថែទាំឥវ៉ាន់ល្អឥតខ្ចោះ', labelEn: 'Careful Parcel Handling' },
  { id: 'quick_call', labelKm: 'ខលប្រាប់ច្បាស់លាស់', labelEn: 'Clear Calling Ahead' },
  { id: 'correct_change', labelKm: 'អាប់លុយត្រឹមត្រូវ', labelEn: 'Accurate Change' },
  { id: 'safe_driver', labelKm: 'បើកបរមានសុវត្ថិភាព', labelEn: 'Safe Driving' },
];

export const PostDeliveryReviewModal: React.FC<PostDeliveryReviewModalProps> = ({
  shipment,
  language,
  onClose,
  onSubmitReview,
}) => {
  const isKm = language === 'km';
  const existingReview = shipment.postDeliveryReview;

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    existingReview?.tags || ['on_time', 'safe_parcel', 'polite']
  );
  const [comment, setComment] = useState<string>(
    existingReview?.comment || ''
  );
  const [tipAmountKHR, setTipAmountKHR] = useState<number>(
    existingReview?.tipAmountKHR || 2000
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const driverName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូនសហគមន៍' : 'Community Courier');
  const driverPlate = shipment.driverPlate || 'PP-3B-8912';

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return isKm ? 'ល្អឥតខ្ចោះ (៥/៥)' : 'Excellent (5/5)';
      case 4:
        return isKm ? 'ល្អណាស់ (៤/៥)' : 'Very Good (4/5)';
      case 3:
        return isKm ? 'ល្អបង្គួរ (៣/៥)' : 'Good (3/5)';
      case 2:
        return isKm ? 'ធម្មតា (២/៥)' : 'Fair (2/5)';
      case 1:
        return isKm ? 'ត្រូវកែលម្អ (១/៥)' : 'Needs Improvement (1/5)';
      default:
        return '';
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReview: DeliveryReview = {
      id: `rev-${Date.now()}`,
      trackingNumber: shipment.trackingNumber,
      driverName,
      driverPlate,
      rating,
      tags: selectedTags,
      comment: comment.trim(),
      tipAmountKHR,
      reviewedAt: new Date().toISOString(),
      customerName: shipment.receiverName || (isKm ? 'អតិថិជន' : 'Valued Customer'),
    };

    onSubmitReview(newReview);
    setIsSubmitted(true);

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {isKm ? 'វាយតម្លៃសេវាដឹកជញ្ជូន' : 'Post-Delivery Driver Review'}
                </h3>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {isKm ? 'បានដឹកដល់' : 'Delivered'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isKm ? `កញ្ចប់ #${shipment.trackingNumber}` : `Parcel #${shipment.trackingNumber}`} • {shipment.senderCity.split(' ')[0]} ➔ {shipment.receiverCity.split(' ')[0]}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {isSubmitted ? (
          <div className="p-8 text-center flex flex-col items-center justify-center my-auto space-y-3 animate-in zoom-in-90">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg">
              <Heart className="w-8 h-8 fill-emerald-500 text-emerald-600 animate-bounce" />
            </div>
            <h4 className="text-lg font-black text-slate-900">
              {isKm ? 'សូមអរគុណសម្រាប់ការវាយតម្លៃ!' : 'Thank You for Your Feedback!'}
            </h4>
            <p className="text-xs text-slate-600 max-w-sm">
              {isKm
                ? `មតិយោបល់ និងការវាយតម្លៃផ្កាយ ${rating} ត្រូវបានបញ្ជូនជូនអ្នកដឹកជញ្ជូន ${driverName} រួចរាល់។`
                : `Your rating of ${rating} stars and comments have been delivered to driver ${driverName}.`}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isKm ? 'បានរក្សាទុកក្នុងទូរស័ព្ទ / កុំព្យូទ័ររួចរាល់' : 'Saved to offline local storage'}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
            
            {/* Driver Profile Mini Banner */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  🚚
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">{driverName}</span>
                    <span className="bg-slate-900 text-amber-400 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-sm">
                      {driverPlate}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {shipment.carrierNameKm || shipment.carrierName}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>4.96</span>
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isKm ? '៤២៦ ការវាយតម្លៃ' : '426 reviews'}
                </div>
              </div>
            </div>

            {/* Interactive 5-Star Rating Selector */}
            <div className="text-center py-2 bg-gradient-to-b from-amber-50/50 to-white rounded-2xl border border-amber-100 p-4">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                {isKm ? 'តើលោកអ្នកពេញចិត្តកម្រិតណា?' : 'How was your delivery experience?'}
              </label>

              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStars = hoverRating !== null ? hoverRating : rating;
                  const isFilled = star <= activeStars;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1.5 rounded-xl transition hover:scale-125 focus:outline-hidden"
                      title={`${star} Stars`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                            : 'text-slate-300 fill-slate-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="text-xs font-bold text-amber-800 tracking-wide">
                {getRatingLabel(hoverRating !== null ? hoverRating : rating)}
              </div>
            </div>

            {/* Quick Tag Praise Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>{isKm ? 'ចំណុចដែលពេញចិត្ត (ជ្រើសរើសបានច្រើន)' : 'Compliments & Highlights'}</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REVIEW_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                        isSelected
                          ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {isKm ? tag.labelKm : tag.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Community Tip (0% middleman, directly to driver) */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isKm ? 'ជូនធីបលើកទឹកចិត្តអ្នកដឹក (Tip Driver)' : 'Add a Driver Appreciation Tip'}</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  {isKm ? '0% មិនកាត់កម្រៃ' : '0% commission'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[0, 1000, 2000, 4000].map((amount) => {
                  const isSelected = tipAmountKHR === amount;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTipAmountKHR(amount)}
                      className={`py-2 rounded-xl text-xs font-bold transition border text-center ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {amount === 0
                        ? isKm ? 'មិនជូន' : 'None'
                        : `${amount.toLocaleString()} ៛`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isKm ? 'សរសេរមតិយោបល់បន្ថែម' : 'Detailed Feedback / Note'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {comment.length}/300
                </span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                rows={3}
                placeholder={
                  isKm
                    ? 'ឧ. អ្នកដឹកមកដល់ទាន់ពេល និយាយគួរសម និងជួយលើកឥវ៉ាន់ដល់ក្នុងផ្ទះ...'
                    : 'e.g. Courier arrived promptly, very polite and handled parcel with great care...'
                }
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none bg-slate-50/50"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
              >
                {isKm ? 'ទុកពេលក្រោយ' : 'Maybe Later'}
              </button>
              <button
                type="submit"
                className="flex-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-950/20 transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isKm ? 'បញ្ជូនការវាយតម្លៃ' : 'Submit Review'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
