import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  Heart,
  MessageSquare,
  Sparkles,
  Edit3,
  UserCheck,
  ShieldCheck,
  Send,
  Coins
} from 'lucide-react';
import { TrackingItem, Language, DeliveryReview } from '../types';
import { addDeliveryPoints, POINTS_PER_FEEDBACK_SUBMISSION } from '../utils/loyaltyService';

interface DeliveryStarRatingCardProps {
  shipment: TrackingItem;
  language: Language;
  onRatingSubmit: (review: DeliveryReview) => void;
  onOpenDetailedReviewModal?: () => void;
  className?: string;
}

interface TagOption {
  id: string;
  labelKm: string;
  labelEn: string;
  icon?: string;
}

const FEEDBACK_TAGS: TagOption[] = [
  { id: 'on_time', labelKm: '⚡ មកដល់ទាន់ពេល', labelEn: '⚡ On-Time Arrival' },
  { id: 'safe_parcel', labelKm: '📦 ឥវ៉ាន់មិនខូចខាត', labelEn: '📦 Careful Handling' },
  { id: 'polite', labelKm: '😊 អ្នកដឹកគួរសម', labelEn: '😊 Polite & Courteous' },
  { id: 'quick_call', labelKm: '📞 ខលប្រាប់មុនច្បាស់', labelEn: '📞 Clear Communication' },
  { id: 'doorstep', labelKm: '📍 ដឹកដល់មាត់ទ្វារផ្ទះ', labelEn: '📍 Direct Doorstep' },
  { id: 'correct_change', labelKm: '💵 អាប់លុយត្រឹមត្រូវ', labelEn: '💵 Accurate Change' },
];

export const DeliveryStarRatingCard: React.FC<DeliveryStarRatingCardProps> = ({
  shipment,
  language,
  onRatingSubmit,
  onOpenDetailedReviewModal,
  className = '',
}) => {
  const isKm = language === 'km';
  const existingReview = shipment.postDeliveryReview;

  const [isEditing, setIsEditing] = useState<boolean>(!existingReview);
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    existingReview?.tags || ['on_time', 'safe_parcel', 'polite']
  );
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [justSubmitted, setJustSubmitted] = useState<boolean>(false);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const getRatingDescriptor = (stars: number) => {
    switch (stars) {
      case 5:
        return {
          title: isKm ? 'ល្អឥតខ្ចោះ ៥/៥ (Outstanding!)' : 'Outstanding (5/5)',
          desc: isKm ? 'សេវាដឹកជញ្ជូនរហ័ស សុវត្ថិភាព និងគួរឲ្យទុកចិត្តបំផុត' : 'Fast, secure, and delightfully dependable delivery.',
          color: 'text-amber-500 bg-amber-50 border-amber-200',
        };
      case 4:
        return {
          title: isKm ? 'ល្អប្រសើរណាស់ ៤/៥ (Very Good)' : 'Very Good (4/5)',
          desc: isKm ? 'បទពិសោធន៍ទទួលឥវ៉ាន់បានយ៉ាងរលូន និងគួរសម' : 'Smooth delivery experience and courteous courier.',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        };
      case 3:
        return {
          title: isKm ? 'ល្អបង្គួរ ៣/៥ (Good)' : 'Good (3/5)',
          desc: isKm ? 'បានទទួលឥវ៉ាន់ត្រឹមត្រូវតាមស្តង់ដារ' : 'Acceptable service matching expected delivery standard.',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
        };
      case 2:
        return {
          title: isKm ? 'មធ្យមធម្មតា ២/៥ (Fair)' : 'Fair (2/5)',
          desc: isKm ? 'មានការយឺតយ៉ាវ ឬខ្វះការទំនាក់ទំនងខ្លះៗ' : 'Some minor delays or communication gaps occurred.',
          color: 'text-orange-600 bg-orange-50 border-orange-200',
        };
      case 1:
        return {
          title: isKm ? 'ត្រូវកែលម្អ ១/៥ (Needs Improvement)' : 'Needs Improvement (1/5)',
          desc: isKm ? 'បទពិសោធន៍មិនពេញចិត្ត សូមផ្តល់ព័ត៌មានបន្ថែមដើម្បីដោះស្រាយ' : 'Subpar experience. Please leave details so we can assist.',
          color: 'text-rose-600 bg-rose-50 border-rose-200',
        };
      default:
        return {
          title: isKm ? 'សូមជ្រើសរើសពិន្ទុផ្កាយ' : 'Tap a star to rate',
          desc: isKm ? 'វាយតម្លៃបទពិសោធន៍នៃការទទួលកញ្ចប់ឥវ៉ាន់' : 'Rate your delivery experience',
          color: 'text-slate-600 bg-slate-50 border-slate-200',
        };
    }
  };

  const descriptor = getRatingDescriptor(activeRating);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);

    const newReview: DeliveryReview = {
      id: existingReview?.id || `rev-${Date.now()}`,
      trackingNumber: shipment.trackingNumber,
      driverName: shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូនសហគមន៍' : 'Community Courier'),
      driverPlate: shipment.driverPlate,
      rating,
      tags: selectedTags,
      comment: comment.trim(),
      tipAmountKHR: existingReview?.tipAmountKHR || 0,
      reviewedAt: new Date().toISOString(),
      customerName: shipment.receiverName || (isKm ? 'អតិថិជនកម្ពុជា' : 'Valued Customer'),
    };

    setTimeout(() => {
      onRatingSubmit(newReview);
      // Award loyalty bonus points for submitting courier experience feedback
      addDeliveryPoints(
        POINTS_PER_FEEDBACK_SUBMISSION,
        `Courier Driver Rating & Review Feedback (${rating} Stars) for ${shipment.trackingNumber}`,
        `ការវាយតម្លៃ ${rating} ផ្កាយ និងផ្តល់មតិលើអ្នកដឹកសម្រាប់ ${shipment.trackingNumber}`,
        shipment.trackingNumber,
        'rating_submitted'
      );
      setIsSubmitting(false);
      setIsEditing(false);
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 4000);
    }, 300);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const driverDisplayName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូនសហគមន៍' : 'Courier Rider');

  return (
    <div
      id="delivery-rating-section"
      className={`rounded-2xl transition-all duration-300 overflow-hidden ${
        existingReview && !isEditing
          ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200 shadow-sm'
          : 'bg-white border-2 border-emerald-500/40 shadow-md ring-4 ring-emerald-500/5'
      } ${className}`}
    >
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {isKm ? 'វាយតម្លៃបទពិសោធន៍ដឹកជញ្ជូន' : 'Delivery Experience Feedback'}
              </h3>
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{isKm ? 'បានដឹកដល់' : 'Delivered'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKm
                ? `កញ្ចប់ #${shipment.trackingNumber} ដឹកដោយ ${driverDisplayName}`
                : `Waybill #${shipment.trackingNumber} delivered by ${driverDisplayName}`}
            </p>
          </div>
        </div>

        {/* Existing review status & action */}
        {existingReview && !isEditing && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isKm ? 'បានវាយតម្លៃរួច' : 'Feedback Submitted'}</span>
            </span>
            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs shadow-2xs transition hover:text-emerald-700"
              title={isKm ? 'កែសម្រួលការវាយតម្លៃរបស់អ្នក' : 'Edit your rating and review'}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isKm ? 'កែសម្រួល' : 'Edit'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Just submitted celebration toast banner */}
      {justSubmitted && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              {isKm
                ? 'សូមអរគុណ! ការវាយតម្លៃរបស់អ្នកត្រូវបានរក្សាទុក និងបញ្ជូនទៅកាន់ប្រព័ន្ធដោយជោគជ័យ។'
                : 'Thank you! Your delivery rating and feedback have been successfully recorded.'}
            </span>
          </div>
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-md font-mono shrink-0">
            ★ {rating}.0
          </span>
        </div>
      )}

      {/* VIEW MODE: When already rated and not editing */}
      {existingReview && !isEditing ? (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-emerald-100/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Star Rating Display */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                {isKm ? 'ពិន្ទុដែលអ្នកបានផ្តល់' : 'Your Star Rating'}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= existingReview.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-base font-black text-slate-900 ml-1">
                  {existingReview.rating}.0 / 5
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${descriptor.color}`}>
                  {descriptor.title}
                </span>
              </div>
            </div>

            {/* Courier driver badge */}
            <div className="flex items-center gap-2.5 sm:border-l sm:border-slate-100 sm:pl-4">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                {driverDisplayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-xs">
                <span className="text-slate-400 text-[10px] block">{isKm ? 'អ្នកដឹកជញ្ជូន' : 'Courier Rider'}</span>
                <span className="font-bold text-slate-900">{driverDisplayName}</span>
                {existingReview.driverPlate && (
                  <span className="text-[10px] text-slate-500 font-mono ml-1.5">
                    ({existingReview.driverPlate})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer Comment */}
          {existingReview.comment && (
            <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKm ? 'មតិយោបល់របស់អ្នក' : 'Your Written Feedback'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 italic pl-5 border-l-2 border-emerald-400 leading-relaxed">
                "{existingReview.comment}"
              </p>
            </div>
          )}

          {/* Selected Compliment Tags */}
          {existingReview.tags && existingReview.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">
                {isKm ? 'ចំណុចល្អៗ៖' : 'Highlights:'}
              </span>
              {existingReview.tags.map((tagId) => {
                const tagInfo = FEEDBACK_TAGS.find((t) => t.id === tagId);
                const label = isKm
                  ? tagInfo?.labelKm || tagId
                  : tagInfo?.labelEn || tagId;
                return (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs font-bold"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{label}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Footer date & optional tip badge */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-emerald-100/60">
            <span>
              {isKm ? 'កាលបរិច្ឆេទវាយតម្លៃ៖ ' : 'Reviewed on: '}
              {new Date(existingReview.reviewedAt).toLocaleDateString(isKm ? 'km-KH' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {existingReview.tipAmountKHR > 0 && (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {isKm ? 'បានជូនធីប៖ ' : 'Driver Tip: '}{existingReview.tipAmountKHR.toLocaleString()} ៛
              </span>
            )}
          </div>
        </div>
      ) : (
        /* INTERACTIVE EDIT / RATE FORM */
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Main 5-Star Interactive Selector */}
          <div className="text-center py-2 sm:py-3 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200/80 p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              {isKm ? 'ចុចលើផ្កាយដើម្បីវាយតម្លៃ (Tap to rate)' : 'Select Your Rating (1 to 5 Stars)'}
            </span>

            {/* Interactive Stars Row */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 mb-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = starValue <= activeRating;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 sm:p-1.5 rounded-xl hover:bg-amber-50 active:scale-95 transition transform focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    aria-label={`Rate ${starValue} of 5 stars`}
                  >
                    <Star
                      className={`w-8 h-8 sm:w-10 sm:h-10 transition-all duration-200 ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm scale-105'
                          : 'fill-slate-100 text-slate-300 hover:text-amber-300 hover:fill-amber-100'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Dynamic Sentiment Descriptor Box */}
            <div className="inline-flex flex-col items-center max-w-md mx-auto">
              <div className={`px-3 py-1 rounded-xl text-xs font-black border transition-all duration-200 ${descriptor.color}`}>
                {descriptor.title}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                {descriptor.desc}
              </p>
            </div>
          </div>

          {/* Quick Experience Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKm ? 'ចំណុចដែលអ្នកពេញចិត្ត (ជ្រើសរើសបានច្រើន)' : 'What went well? (Select tags)'}</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {selectedTags.length} {isKm ? 'បានជ្រើស' : 'selected'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FEEDBACK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition border flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{isKm ? tag.labelKm : tag.labelEn}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Comment Input */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKm ? 'មតិយោបល់បន្ថែម (ស្រេចចិត្ត)' : 'Written Feedback (Optional)'}</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400">
                {comment.length}/200
              </span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 200))}
              placeholder={
                isKm
                  ? 'ឧទាហរណ៍៖ អ្នកដឹកជញ្ជូនរហ័ស គួរសម និងទាក់ទងមកមុនច្បាស់លាស់... ឬចំណុចដែលគួរកែលម្អ'
                  : 'e.g. Courier arrived right on time, very polite and called ahead clearly... or any tips to improve'
              }
              rows={2}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition"
            />
          </div>

          {/* Actions Bar */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            {/* Cancel editing if already had review */}
            {existingReview ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                {isKm ? 'ថយក្រោយ' : 'Cancel'}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKm ? 'ការវាយតម្លៃរបស់អ្នកមានសុវត្ថិភាព' : 'Verified feedback'}</span>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {/* Optional tip modal shortcut */}
              {onOpenDetailedReviewModal && (
                <button
                  type="button"
                  onClick={onOpenDetailedReviewModal}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition flex items-center gap-1.5"
                  title={isKm ? 'ផ្តល់កម្រៃធីប (Tip) ដល់អ្នកដឹកជញ្ជូន' : 'Give Courier Tip & Detailed Form'}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">{isKm ? 'ជូនធីប' : 'Tip Courier'}</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black shadow-md shadow-emerald-900/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>{isKm ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {existingReview
                        ? (isKm ? 'ធ្វើបច្ចុប្បន្នភាពការវាយតម្លៃ' : 'Update Feedback')
                        : (isKm ? 'បញ្ជូនការវាយតម្លៃ' : 'Submit Feedback')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
