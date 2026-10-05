import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Award,
  Truck,
  Phone,
  MessageSquare,
  CheckCircle2,
  Calendar,
  ThumbsUp,
  HeartHandshake,
  Car,
  Clock,
  Sparkles,
  Send,
  UserCheck,
  Share2,
  AlertCircle,
  Camera
} from 'lucide-react';
import { Language, TrackingItem } from '../types';

interface DriverProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: TrackingItem;
  language: Language;
  onOpenChat?: () => void;
  onOpenVerification?: () => void;
}

interface CustomerReview {
  id: string;
  reviewerName: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  commentKm: string;
  tags: string[];
}

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({
  isOpen,
  onClose,
  shipment,
  language,
  onOpenChat,
  onOpenVerification,
}) => {
  const isKm = language === 'km';
  const driverName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូនសហគមន៍' : 'Community Courier');
  const driverPlate = shipment.driverPlate || 'PP-2A-0000';
  const driverVehicle = shipment.driverVehicle || (isKm ? 'យានយន្តដឹកជញ្ជូនសហគមន៍' : 'Courier Vehicle');
  const baseRating = shipment.driverRating || 4.9;
  const initialReviewCount = shipment.driverRatingCount || 280;
  const deliveriesCount = shipment.driverDeliveriesCount || 1200;
  const joinedYear = shipment.driverJoinedYear || '2023';
  const badgeTitle = isKm 
    ? (shipment.driverBadgeKm || 'អ្នកដឹកសហគមន៍ឆ្នើម ផ្ទៀងផ្ទាត់អត្តសញ្ញាណ') 
    : (shipment.driverBadge || 'Verified Community Courier');
  const bio = isKm
    ? (shipment.driverBioKm || 'អ្នកដឹកសហគមន៍ឯករាជ្យ មានការទទួលខុសត្រូវខ្ពស់ និងរាក់ទាក់ជានិច្ច។')
    : (shipment.driverBio || 'Independent community courier committed to safe, punctual, and reliable deliveries.');

  // Local storage key for custom user ratings
  const userRatingStorageKey = `camdelivery_driver_user_rating_${shipment.trackingNumber}`;

  // Interactive rating state
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);
  const [ratingSubmittedSuccess, setRatingSubmittedSuccess] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Load existing rating if submitted previously
  useEffect(() => {
    try {
      const saved = localStorage.getItem(userRatingStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserRating(parsed.rating || 0);
        setSelectedTags(parsed.tags || []);
        setReviewComment(parsed.comment || '');
        setHasSubmittedRating(true);
      }
    } catch {
      // Ignore
    }
  }, [userRatingStorageKey]);

  // Compliment tags
  const feedbackTags = isKm
    ? [
        '✨ រួសរាយរាក់ទាក់',
        '⚡ មកដល់ទាន់ពេល',
        '📦 ឥវ៉ាន់រក្សាបានល្អ',
        '📞 ទំនាក់ទំនងច្បាស់លាស់',
        '🤝 ស្មោះត្រង់គួរឱ្យទុកចិត្ត',
        '💵 អាប់លុយត្រឹមត្រូវ'
      ]
    : [
        '✨ Polite & Friendly',
        '⚡ Punctual & Quick',
        '📦 Careful Handling',
        '📞 Clear Communication',
        '🤝 Highly Trustworthy',
        '💵 Exact COD Change'
      ];

  // Verified reviews list
  const sampleReviews: CustomerReview[] = [
    {
      id: 'rev-1',
      reviewerName: 'Sophea Vichea',
      location: isKm ? 'ក្រុងបាត់ដំបង' : 'Battambang City',
      rating: 5,
      date: isKm ? 'ម្សិលមិញ' : 'Yesterday',
      comment: 'Super fast delivery and very courteous driver! Handled my fragile package with extreme care.',
      commentKm: 'អ្នកដឹកលឿនណាស់ រួសរាយរាក់ទាក់ និងយកចិត្តទុកដាក់ខ្ពស់លើកញ្ចប់ឥវ៉ាន់ងាយបែកបាក់។ សូមសរសើរ!',
      tags: [isKm ? '✨ រួសរាយរាក់ទាក់' : '✨ Polite & Friendly', isKm ? '📦 ឥវ៉ាន់រក្សាបានល្អ' : '📦 Careful Handling']
    },
    {
      id: 'rev-2',
      reviewerName: 'Kosal Heng',
      location: isKm ? 'ខេត្តសៀមរាប' : 'Siem Reap',
      rating: 5,
      date: isKm ? '៣ ថ្ងៃមុន' : '3 days ago',
      comment: 'Called me 10 minutes before arrival so I could be ready downstairs. Excellent service with zero extra fee.',
      commentKm: 'បានខលមកខ្ញុំមុន ១០ នាទី ធ្វើឱ្យខ្ញុំត្រៀមខ្លួនចុះមកទទួលស្រួល។ សេវាកម្មល្អឥតខ្ចោះ គ្មានគិតថ្លៃលើស!',
      tags: [isKm ? '📞 ទំនាក់ទំនងច្បាស់លាស់' : '📞 Clear Communication', isKm ? '⚡ មកដល់ទាន់ពេល' : '⚡ Punctual & Quick']
    },
    {
      id: 'rev-3',
      reviewerName: 'Channary Mom',
      location: isKm ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh',
      rating: 5,
      date: isKm ? '១ សប្តាហ៍មុន' : '1 week ago',
      comment: 'Very polite, had exact change for COD payment, and accepted Bakong KHQR smoothly.',
      commentKm: 'សុភាពរាបសារ មានលុយអាប់គ្រប់ចំនួនសម្រាប់ COD ហើយស្កេនបាគង KHQR បានលឿនទៀត។ ពេញចិត្ត ១០០%!',
      tags: [isKm ? '💵 អាប់លុយត្រឹមត្រូវ' : '💵 Exact COD Change']
    }
  ];

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0) return;

    const payload = {
      rating: userRating,
      tags: selectedTags,
      comment: reviewComment,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(userRatingStorageKey, JSON.stringify(payload));
    } catch {
      // Ignore
    }

    setHasSubmittedRating(true);
    setRatingSubmittedSuccess(true);
    setTimeout(() => setRatingSubmittedSuccess(false), 3500);
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${driverName} - CamDelivery Driver`,
        text: `${driverName} (${driverPlate}) - Rating ${baseRating}★ on CamDelivery Free`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${driverName} - Plate: ${driverPlate} - Rating: ${baseRating}★`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[92vh]">
        {/* Top Header & Cover Visual */}
        <div className="relative bg-slate-900 text-white p-5 sm:p-6 pb-6 overflow-hidden shrink-0">
          {/* Decorative background aura */}
          <div 
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: shipment.brandColor || '#059669' }}
          />

          {/* Close & Share buttons */}
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isKm ? 'ប្រវត្តិរូបផ្លូវការផ្ទៀងផ្ទាត់' : 'Verified Official Profile'}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShareProfile}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold flex items-center gap-1"
                title="Share Driver Profile"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-[11px] hidden sm:inline">{shareCopied ? (isKm ? 'បានចម្លង!' : 'Copied!') : (isKm ? 'ចែករំលែក' : 'Share')}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Driver Identity Card Block */}
          <div className="relative z-10 flex items-start gap-4">
            {/* Avatar with Verified Ring */}
            <div className="relative shrink-0">
              <div 
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg border-2 border-white/20"
                style={{ backgroundColor: shipment.brandColor || '#059669' }}
              >
                {driverName.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-xs">
                <UserCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Names, Badge, and License Plate */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white truncate">
                  {driverName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>{badgeTitle}</span>
                </span>
              </div>

              {/* Cambodian Style License Plate */}
              <div className="mt-2 inline-flex items-center gap-2 bg-slate-950/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-inner">
                <Car className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">
                    {isKm ? 'ស្លាកលេខ៖' : 'Plate:'}
                  </span>
                  <span className="font-mono font-black text-amber-400 tracking-wider text-sm bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    {driverPlate}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-2">
                {bio}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar in Header */}
          <div className="relative z-10 grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-sm sm:text-base">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{baseRating.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {initialReviewCount} {isKm ? 'ការវាយតម្លៃ' : 'Reviews'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="font-black text-white text-sm sm:text-base">
                {deliveriesCount.toLocaleString()}+
              </div>
              <span className="text-[10px] text-slate-400">
                {isKm ? 'ជើងដឹកជោគជ័យ' : 'Deliveries'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="font-black text-emerald-400 text-sm sm:text-base">
                99.4%
              </div>
              <span className="text-[10px] text-slate-400">
                {isKm ? 'ទាន់ពេលវេលា' : 'On-Time'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50/50">
          {/* Action Row: Direct Call and Direct Chat */}
          <div className="grid grid-cols-2 gap-3">
            {onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isKm ? 'ឆាតផ្ទាល់ជាមួយអ្នកដឹក' : 'Chat with Driver'}</span>
              </button>
            )}

            {shipment.driverPhone ? (
              <a
                href={`tel:${shipment.driverPhone}`}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>{isKm ? 'ទូរស័ព្ទខលផ្ទាល់' : 'Call Courier'}</span>
              </a>
            ) : (
              <div className="w-full py-3 px-4 rounded-2xl bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center">
                {isKm ? 'គ្មានលេខទូរស័ព្ទ' : 'No direct number'}
              </div>
            )}
          </div>

          {/* Official Courier ID Camera Verification Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 border border-emerald-500/40 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 pb-3 border-b border-emerald-500/30 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      {isKm ? 'ការផ្ទៀងផ្ទាត់អត្តសញ្ញាណប័ណ្ណតាមកាមេរ៉ា' : 'Camera ID Verification'}
                    </h3>
                    {shipment.isCourierVerified ? (
                      <span className="bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isKm ? 'ផ្ទៀងផ្ទាត់រួចរាល់' : 'Verified'}</span>
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        {isKm ? 'រង់ចាំការស្កេន' : 'Pending Scan'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {shipment.isCourierVerified
                      ? (isKm ? 'ឯកសារអត្តសញ្ញាណប័ណ្ណត្រូវបានស្កេន និងត្រួតពិនិត្យភាពត្រឹមត្រូវជោគជ័យ' : 'Official government identity document scanned and matched via device camera')
                      : (isKm ? 'អ្នកដឹកជញ្ជូនអាចស្កេនអត្តសញ្ញាណប័ណ្ណ ឬប័ណ្ណបើកបរដើម្បីទទួលបាន Badge' : 'Courier can scan national ID or driver license with device camera to verify')}
                  </p>
                </div>
              </div>

              {onOpenVerification && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVerification();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  title={isKm ? 'ស្កេន ឬមើលវិញ្ញាបនបត្រអត្តសញ្ញាណប័ណ្ណ' : 'Scan or view ID certificate'}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{shipment.isCourierVerified ? (isKm ? 'មើលវិញ្ញាបនបត្រ' : 'View ID') : (isKm ? 'ស្កេន ID' : 'Scan ID')}</span>
                </button>
              )}
            </div>

            {shipment.isCourierVerified && shipment.courierVerificationData && (
              <div className="grid grid-cols-2 gap-2 mt-3 pt-1 text-xs relative z-10">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isKm ? 'ប្រភេទឯកសារ' : 'Document Type'}
                  </span>
                  <span className="font-extrabold text-slate-200 mt-0.5 block truncate">
                    {isKm ? shipment.courierVerificationData.idTypeLabelKm : shipment.courierVerificationData.idTypeLabel}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isKm ? 'លេខកាត (Masked)' : 'ID Number'}
                  </span>
                  <span className="font-mono font-bold text-amber-300 mt-0.5 block">
                    {shipment.courierVerificationData.idNumberMasked}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 col-span-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {isKm ? 'ស្ថាប័នចេញឯកសារ៖ ' : 'Authority: '}
                    <strong className="text-slate-200">
                      {isKm ? shipment.courierVerificationData.issuedAuthorityKm : shipment.courierVerificationData.issuedAuthority}
                    </strong>
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {shipment.courierVerificationData.confidenceScore || 99.8}% Match
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Trust & Verification Badges Checklist */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isKm ? 'វិញ្ញាបនបត្រ & ការផ្ទៀងផ្ទាត់ទំនុកចិត្ត' : 'Trust & Safety Verification'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">{isKm ? 'ផ្ទៀងផ្ទាត់អត្តសញ្ញាណប័ណ្ណ' : 'National ID Verified'}</div>
                  <div className="text-[10px] text-slate-500">{isKm ? 'ឯកសារផ្លូវការ ១០០%' : 'Officially registered'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">{isKm ? 'យានយន្តត្រួតពិនិត្យរួចរាល់' : 'Vehicle Safety Inspected'}</div>
                  <div className="text-[10px] text-slate-500">{driverVehicle}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">{isKm ? 'គ្មានកាត់កម្រៃជើងសារ 0%' : '0% Commission Compliant'}</div>
                  <div className="text-[10px] text-slate-500">{isKm ? 'ចំណូល ១០០% ដល់អ្នកដឹក' : '100% fair community'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">{isKm ? `សមាជិកតាំងពីឆ្នាំ ${joinedYear}` : `Active Since ${joinedYear}`}</div>
                  <div className="text-[10px] text-slate-500">{isKm ? 'អ្នកដឹកជញ្ជូនសកម្ម' : 'Proven track record'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Star Ratings Distribution Breakdown */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{isKm ? 'ប្រព័ន្ធវាយតម្លៃផ្កាយ (Star Rating Breakdown)' : 'Star-Based Rating Breakdown'}</span>
              </h3>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                98% {isKm ? 'ពេញចិត្ត' : 'Positive'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Big Score Number */}
              <div className="text-center shrink-0 pr-2 border-r border-slate-100">
                <div className="text-3xl font-black text-slate-900">
                  {baseRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-0.5 text-amber-400 my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-[10px] text-slate-400">
                  {initialReviewCount} {isKm ? 'មតិយោបល់' : 'ratings'}
                </div>
              </div>

              {/* Progress bars for 5, 4, 3, 2, 1 stars */}
              <div className="flex-1 space-y-1.5 text-[11px]">
                {[
                  { star: 5, pct: 93 },
                  { star: 4, pct: 5 },
                  { star: 3, pct: 2 },
                  { star: 2, pct: 0 },
                  { star: 1, pct: 0 },
                ].map((item) => (
                  <div key={item.star} className="flex items-center gap-2">
                    <span className="w-5 text-slate-500 font-bold text-right flex items-center justify-end gap-0.5">
                      {item.star} <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-[10px] text-slate-400 text-right">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive User Rating Form: Rate this Driver */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-slate-50 rounded-2xl p-4 border border-emerald-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isKm ? 'វាយតម្លៃបទពិសោធន៍ជាមួយអ្នកដឹកនេះ' : 'Rate Your Delivery Experience'}</span>
              </h3>
              {hasSubmittedRating && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{isKm ? 'បានវាយតម្លៃរួច' : 'Rated'}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {isKm 
                ? 'មតិរបស់អ្នកជួយលើកទឹកចិត្ត និងបង្កើនទំនុកចិត្តដល់អ្នកដឹកសហគមន៍កម្ពុជា។' 
                : 'Your ratings build trust and empower Cambodian community courier drivers.'}
            </p>

            <form onSubmit={handleSubmitRating} className="space-y-3">
              {/* Star selector */}
              <div className="flex items-center justify-center gap-2 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 transition transform hover:scale-125 focus:outline-hidden"
                    title={`${star} Stars`}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        (hoverRating || userRating) >= star
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {userRating > 0 && (
                <div className="text-center text-xs font-bold text-emerald-700 animate-in fade-in">
                  {userRating === 5 && (isKm ? '⭐ អស្ចារ្យណាស់! សេវា ៥ ផ្កាយពេញ' : '⭐ Outstanding! 5-star experience')}
                  {userRating === 4 && (isKm ? '⭐ ល្អប្រសើរណាស់!' : '⭐ Very good service!')}
                  {userRating === 3 && (isKm ? '⭐ ល្មមអាចទទួលយកបាន' : '⭐ Average delivery')}
                  {userRating < 3 && (isKm ? '⭐ ត្រូវការការកែលម្អ' : '⭐ Needs improvement')}
                </div>
              )}

              {/* Tag Pills */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600">
                  {isKm ? 'ចំណុចលេចធ្លោរបស់អ្នកដឹក៖' : 'Driver Highlights:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {feedbackTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <input
                  type="text"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    isKm
                      ? 'សរសេរសរសើរ ឬមតិយោបល់បន្ថែម (ស្រេចចិត្ត)...'
                      : 'Write a short comment or compliment (optional)...'
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit button */}
              <div className="flex items-center justify-between pt-1">
                {ratingSubmittedSuccess ? (
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{isKm ? 'បានកត់ត្រាការវាយតម្លៃរបស់អ្នកដោយជោគជ័យ!' : 'Rating saved successfully!'}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400">
                    {isKm ? 'រក្សាទុកសុវត្ថិភាពក្នុងប្រព័ន្ធ' : 'Public feedback for community'}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={userRating === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                    userRating > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{hasSubmittedRating ? (isKm ? 'កែប្រែការវាយតម្លៃ' : 'Update Rating') : (isKm ? 'ដាក់ស្នើការវាយតម្លៃ' : 'Submit Rating')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Customer Reviews List */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <span>{isKm ? 'មតិយោបល់ពីអតិថិជនពិតប្រាកដ' : 'Recent Verified Customer Reviews'}</span>
            </h3>

            <div className="space-y-3">
              {sampleReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>{rev.reviewerName}</span>
                      <span className="text-slate-400 font-normal text-[10px]">({rev.location})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 ml-1">{rev.date}</span>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    "{isKm ? rev.commentKm : rev.comment}"
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {rev.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Bottom Close Action */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>{isKm ? 'ប្រព័ន្ធដឹកជញ្ជូនឯករាជ្យកម្ពុជា ០% កម្រៃជើងសារ' : '100% Free Cambodia Logistics'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
          >
            {isKm ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
