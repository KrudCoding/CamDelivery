import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  X,
  Sparkles,
  ThumbsUp
} from 'lucide-react';
import { Language, TrackingItem } from '../types';

interface CourierRatingFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: TrackingItem | null;
  language: Language;
  onNotify?: (msg: string) => void;
  onRatingSubmitted?: (ratingData: any) => void;
}

export const CourierRatingFeedbackModal: React.FC<CourierRatingFeedbackModalProps> = ({
  isOpen,
  onClose,
  shipment,
  language,
  onNotify,
  onRatingSubmitted,
}) => {
  const isKm = language === 'km';

  const [stars, setStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'punctual',
    'safe',
  ]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen || !shipment) return null;

  const tagOptions = [
    { id: 'punctual', labelEn: 'On-Time Punctual', labelKm: 'ដឹកទាន់ពេលវេលា', icon: '⏱️' },
    { id: 'safe', labelEn: 'Package Perfectly Safe', labelKm: 'កញ្ចប់សុវត្ថិភាពល្អ', icon: '📦' },
    { id: 'polite', labelEn: 'Polite Driver', labelKm: 'អ្នកដឹកមានសុជីវធម៌', icon: '🤝' },
    { id: 'accurate', labelEn: 'Accurate Location', labelKm: 'រកឃើញទីតាំងច្បាស់', icon: '📍' },
    { id: 'khqr', labelEn: 'Smooth Bakong KHQR', labelKm: 'ទូទាត់បាគងរហ័ស', icon: '💳' },
  ];

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ratingRecord = {
      trackingNumber: shipment.trackingNumber,
      carrierId: shipment.carrierId,
      carrierName: shipment.carrierName,
      stars,
      tags: selectedTags,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    };

    // Save to local storage history
    try {
      const existingRaw = localStorage.getItem('camdelivery_courier_ratings');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem('camdelivery_courier_ratings', JSON.stringify([ratingRecord, ...existing]));
    } catch {}

    setIsSubmitted(true);

    if (onRatingSubmitted) {
      onRatingSubmitted(ratingRecord);
    }

    if (onNotify) {
      onNotify(
        isKm
          ? `អរគុណសម្រាប់ការវាយតម្លៃសេវាដឹក! អ្នកទទួលបាន +៥ ពិន្ទុភាពស្មោះត្រង់ (Loyalty Points)`
          : `Thank you for rating! You earned +5 Community Loyalty Points!`
      );
    }

    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {isKm ? 'បានទទួលការវាយតម្លៃដោយជោគជ័យ!' : 'Feedback Submitted!'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {isKm
                ? 'មតិកែលម្អរបស់អ្នកជួយលើកកម្ពស់គុណភាពសេវាដឹកជញ្ជូនឯករាជ្យនៅកម្ពុជា'
                : 'Your feedback helps uphold high delivery quality across independent Cambodia couriers.'}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isKm ? '+៥ ពិន្ទុភក្តីភាព (Loyalty Bonus)' : '+5 Loyalty Points Awarded'}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header / Courier info */}
            <div className="flex items-center gap-3 pr-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                style={{ backgroundColor: shipment.brandColor || '#e11d48' }}
              >
                {shipment.carrierId.slice(0, 3).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    {isKm ? 'វាយតម្លៃបទពិសោធន៍ដឹកជញ្ជូន' : 'Rate Your Delivery Experience'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {shipment.carrierName} • #{shipment.trackingNumber}
                </p>
                <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-md font-bold mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isKm ? 'បានដឹកដល់ជោគជ័យ (Delivered)' : 'Delivered Successfully'}</span>
                </div>
              </div>
            </div>

            {/* Star Rating Selection */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 text-center space-y-2">
              <span className="text-xs font-black uppercase text-amber-900 tracking-wider block">
                {isKm ? 'តើអ្នកពេញចិត្តកម្រិតណា?' : 'How was the courier performance?'}
              </span>

              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = (hoveredStars !== null ? hoveredStars : stars) >= starValue;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onMouseEnter={() => setHoveredStars(starValue)}
                      onMouseLeave={() => setHoveredStars(null)}
                      onClick={() => setStars(starValue)}
                      className="p-1 transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-bold text-slate-600 block">
                {stars === 5
                  ? (isKm ? '⭐⭐⭐⭐⭐ ល្អឥតខ្ចោះ (Excellent)' : '⭐⭐⭐⭐⭐ Excellent')
                  : stars === 4
                  ? (isKm ? '⭐⭐⭐⭐ ល្អណាស់ (Very Good)' : '⭐⭐⭐⭐ Very Good')
                  : stars === 3
                  ? (isKm ? '⭐⭐⭐ មធ្យម (Average)' : '⭐⭐⭐ Average')
                  : stars === 2
                  ? (isKm ? '⭐⭐ ត្រូវការកែលម្អ (Needs Improvement)' : '⭐⭐ Needs Improvement')
                  : (isKm ? '⭐ មិនពេញចិត្ត (Poor)' : '⭐ Poor')}
              </span>
            </div>

            {/* Criteria Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {isKm ? 'ចំណុចលេចធ្លោ (Punctuality & Safety)' : 'Key Highlights'}
              </label>

              <div className="flex items-center gap-1.5 flex-wrap">
                {tagOptions.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.id)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{tag.icon}</span>
                      <span>{isKm ? tag.labelKm : tag.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {isKm ? 'មតិយោបល់បន្ថែម (Comments)' : 'Additional Comments'}
              </label>
              <textarea
                rows={2}
                placeholder={isKm ? 'ឧ. អ្នកដឹកជញ្ជូនរហ័ស ឥវ៉ាន់ខ្ចប់ស្អាតល្អ...' : 'e.g. Driver was courteous, package intact...'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{isKm ? 'ផ្ញើការវាយតម្លៃ (+៥ ពិន្ទុ)' : 'Submit Rating (+5 pts)'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
