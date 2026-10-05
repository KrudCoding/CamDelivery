import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Package,
  TrendingUp,
  Star,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Gift,
  HelpCircle,
  Check,
  ExternalLink,
  Crown
} from 'lucide-react';
import { Language, Currency, LoyaltyProgramState, LoyaltyHistoryEntry } from '../types';
import {
  getLoyaltyData,
  addDeliveryPoints,
  resetLoyaltyData,
  TARGET_RELIABLE_USER_POINTS,
  POINTS_PER_COMPLETED_SHIPMENT,
  POINTS_PER_FEEDBACK_SUBMISSION,
  LOYALTY_EVENT
} from '../utils/loyaltyService';
import { hasTopRatedSenderBadge } from './ReferAFriendModal';

interface UserLoyaltyProgramCardProps {
  language: Language;
  currency: Currency;
  onNotify?: (msg: string) => void;
  className?: string;
}

export const UserLoyaltyProgramCard: React.FC<UserLoyaltyProgramCardProps> = ({
  language,
  currency,
  onNotify,
  className = '',
}) => {
  const isKm = language === 'km';
  const [loyalty, setLoyalty] = useState<LoyaltyProgramState>(getLoyaltyData);
  const [showHistory, setShowHistory] = useState(false);
  const [showPerksModal, setShowPerksModal] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [isTopRatedSender, setIsTopRatedSender] = useState(hasTopRatedSenderBadge);

  // Listen for external updates (e.g. from shipment marked delivered in Track tab)
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<LoyaltyProgramState>;
      if (custom.detail) {
        setLoyalty(custom.detail);
      } else {
        setLoyalty(getLoyaltyData());
      }
    };

    const handleBadgeChange = () => setIsTopRatedSender(hasTopRatedSenderBadge());

    window.addEventListener(LOYALTY_EVENT, handleUpdate);
    window.addEventListener('camdelivery_badge_updated', handleBadgeChange);
    return () => {
      window.removeEventListener(LOYALTY_EVENT, handleUpdate);
      window.removeEventListener('camdelivery_badge_updated', handleBadgeChange);
    };
  }, []);

  const pointsNeeded = Math.max(0, TARGET_RELIABLE_USER_POINTS - loyalty.totalPoints);
  const isCertified = loyalty.isCertifiedReliableUser;
  const progressPercent = Math.min(100, Math.round((loyalty.totalPoints / TARGET_RELIABLE_USER_POINTS) * 100));

  // Handler: Simulate completing a shipment to earn points
  const handleSimulateCompletedShipment = () => {
    const sampleTrackingNumber = `KH-TEST-${Math.floor(100000 + Math.random() * 900000)}`;
    const wasCertifiedBefore = loyalty.isCertifiedReliableUser;

    const updated = addDeliveryPoints(
      POINTS_PER_COMPLETED_SHIPMENT,
      `Completed delivery shipment ${sampleTrackingNumber} (Phnom Penh → Siem Reap)`,
      `បានបញ្ចប់ការដឹកជញ្ជូនកញ្ចប់ ${sampleTrackingNumber} (ភ្នំពេញ → សៀមរាប)`,
      sampleTrackingNumber,
      'delivery_completed'
    );
    setLoyalty(updated);

    if (!wasCertifiedBefore && updated.isCertifiedReliableUser) {
      setJustUnlocked(true);
      if (onNotify) {
        onNotify(
          isKm
            ? '🎉 អបអរសាទរ! អ្នកបានដោះសោផ្លាកសញ្ញា "អ្នកប្រើប្រាស់គួរឲ្យទុកចិត្តបានបញ្ជាក់" (Certified Reliable User) ជោគជ័យ!'
            : '🎉 Congratulations! You have unlocked the "Certified Reliable User" badge!'
        );
      }
    } else if (onNotify) {
      onNotify(
        isKm
          ? `+${POINTS_PER_COMPLETED_SHIPMENT} ពិន្ទុដឹកជញ្ជូន ទទួលបានពីការបញ្ចប់ការដឹក ${sampleTrackingNumber}!`
          : `+${POINTS_PER_COMPLETED_SHIPMENT} Delivery Points earned from completed shipment ${sampleTrackingNumber}!`
      );
    }
  };

  // Handler: Simulate rating feedback bonus
  const handleSimulateRatingBonus = () => {
    const wasCertifiedBefore = loyalty.isCertifiedReliableUser;
    const updated = addDeliveryPoints(
      POINTS_PER_FEEDBACK_SUBMISSION,
      '5-Star Delivery Rating & Courier Review Feedback bonus',
      'ប្រាក់រង្វាន់សម្រាប់ការវាយតម្លៃផ្កាយ ៥ និងផ្តល់មតិលើអ្នកដឹក',
      undefined,
      'rating_submitted'
    );
    setLoyalty(updated);

    if (!wasCertifiedBefore && updated.isCertifiedReliableUser) {
      setJustUnlocked(true);
      if (onNotify) {
        onNotify(
          isKm
            ? '🎉 អបអរសាទរ! អ្នកបានដោះសោផ្លាកសញ្ញា "អ្នកប្រើប្រាស់គួរឲ្យទុកចិត្តបានបញ្ជាក់" ជោគជ័យ!'
            : '🎉 Congratulations! You have unlocked the "Certified Reliable User" badge!'
        );
      }
    } else if (onNotify) {
      onNotify(
        isKm
          ? `+${POINTS_PER_FEEDBACK_SUBMISSION} ពិន្ទុដឹកជញ្ជូន ទទួលបានពីការផ្តល់មតិលើអ្នកដឹក!`
          : `+${POINTS_PER_FEEDBACK_SUBMISSION} Delivery Points earned for submitting driver feedback!`
      );
    }
  };

  // Handler: Reset to baseline
  const handleReset = () => {
    const resetState = resetLoyaltyData();
    setLoyalty(resetState);
    setJustUnlocked(false);
    if (onNotify) {
      onNotify(isKm ? 'បានកំណត់ពិន្ទុឡើងវិញទៅសភាពដើម' : 'Reset loyalty points to baseline');
    }
  };

  return (
    <div
      id="loyalty-program-section"
      className={`rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isCertified
          ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white border-emerald-500/60 shadow-lg shadow-emerald-950/20'
          : 'bg-white border-slate-200 shadow-sm text-slate-900'
      } ${className}`}
    >
      {/* Decorative background glow for Certified status */}
      {isCertified && (
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Header Bar */}
      <div className="p-5 md:p-6 pb-4 border-b border-slate-100/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isCertified
                  ? 'bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 text-slate-950 ring-4 ring-amber-400/20'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isCertified ? (
                <Award className="w-6 h-6 animate-pulse" />
              ) : (
                <Sparkles className="w-6 h-6 text-emerald-600" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base md:text-lg font-black ${isCertified ? 'text-white' : 'text-slate-900'}`}>
                  {isKm ? 'កម្មវិធីភក្តីភាព & ពិន្ទុដឹកជញ្ជូន' : 'Delivery Points Loyalty Program'}
                </h3>

                {isCertified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-950 text-xs font-black shadow-xs ring-2 ring-amber-400/40 animate-in fade-in duration-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                    <span>{isKm ? 'អ្នកប្រើប្រាស់គួរឲ្យទុកចិត្តបានបញ្ជាក់' : 'Certified Reliable User'}</span>
                    <Crown className="w-3.5 h-3.5 text-amber-900" />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>{isKm ? `${progressPercent}% ឆ្ពោះទៅផ្លាកទុកចិត្ត` : `${progressPercent}% toward Certified Badge`}</span>
                  </span>
                )}

                {isTopRatedSender && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 text-xs font-black shadow-xs ring-1 ring-amber-400/50">
                    <Crown className="w-3.5 h-3.5 text-slate-950 fill-current" />
                    <span>{isKm ? 'អ្នកផ្ញើឆ្នើមលំដាប់កំពូល' : 'Top-Rated Sender'}</span>
                  </span>
                )}
              </div>

              <p className={`text-xs mt-1 ${isCertified ? 'text-emerald-200/90' : 'text-slate-500'}`}>
                {isKm
                  ? 'ទទួលបាន ៥០ ពិន្ទុក្នុងរាល់ការដឹកជញ្ជូនកញ្ចប់ឥវ៉ាន់បានជោគជ័យ ដើម្បីដោះសោផ្លាកសញ្ញាទុកចិត្ត និងសិទ្ធិអាទិភាព'
                  : 'Earn 50 Delivery Points per completed shipment to unlock the official Certified Reliable User trust badge & perks'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2.5 rounded-xl border text-center ${
              isCertified 
                ? 'bg-white/10 border-white/15 backdrop-blur-xs text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                {isKm ? 'ពិន្ទុសរុប' : 'Total Points'}
              </span>
              <div className="text-xl font-black flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{loyalty.totalPoints}</span>
                <span className="text-xs font-bold opacity-75">{isKm ? 'ពិន្ទុ' : 'pts'}</span>
              </div>
            </div>

            <div className={`px-4 py-2.5 rounded-xl border text-center ${
              isCertified 
                ? 'bg-white/10 border-white/15 backdrop-blur-xs text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                {isKm ? 'កញ្ចប់ដឹកជោគជ័យ' : 'Deliveries'}
              </span>
              <div className="text-xl font-black flex items-center justify-center gap-1">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>{loyalty.completedShipmentsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Progress Bar toward 'Certified Reliable User' */}
      <div className="p-5 md:p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <div className="flex items-center gap-1.5">
              <span className={isCertified ? 'text-emerald-300' : 'text-slate-700'}>
                {isKm ? 'វឌ្ឍនភាពផ្លាកសញ្ញាទុកចិត្ត៖' : 'Progress toward Certified Reliable User:'}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                isCertified ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-800'
              }`}>
                {loyalty.totalPoints} / {TARGET_RELIABLE_USER_POINTS} {isKm ? 'ពិន្ទុ' : 'pts'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-black ${isCertified ? 'text-amber-300' : 'text-emerald-700'}`}>
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* Visual Progress Bar Track */}
          <div className={`w-full h-4 rounded-full p-0.5 overflow-hidden ${
            isCertified ? 'bg-emerald-950/80 border border-emerald-500/40' : 'bg-slate-100 border border-slate-200'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-700 relative overflow-hidden ${
                isCertified
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-md shadow-amber-400/50'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            >
              {/* Highlight shimmer animation */}
              <div className="absolute inset-0 bg-white/30 animate-[pulse_2s_infinite] w-full" />
            </div>
          </div>

          {/* Milestones Markers */}
          <div className="grid grid-cols-3 gap-2 mt-2.5 text-[11px]">
            {/* Bronze Tier (150 pts) */}
            <div className={`flex items-center gap-1.5 ${
              loyalty.totalPoints >= 150 
                ? (isCertified ? 'text-emerald-300 font-bold' : 'text-emerald-700 font-bold') 
                : 'text-slate-400'
            }`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${loyalty.totalPoints >= 150 ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span>150 pts: {isKm ? 'សមាជិកប្រាក់ (Silver)' : 'Active Patron'}</span>
            </div>

            {/* Gold Tier (300 pts) */}
            <div className={`flex items-center justify-center gap-1.5 ${
              loyalty.totalPoints >= 300 
                ? (isCertified ? 'text-emerald-300 font-bold' : 'text-emerald-700 font-bold') 
                : 'text-slate-400'
            }`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${loyalty.totalPoints >= 300 ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span>300 pts: {isKm ? 'សមាជិកមាស (Gold)' : 'Priority Patron'}</span>
            </div>

            {/* Target: Certified Reliable User (500 pts) */}
            <div className={`flex items-center justify-end gap-1.5 ${
              isCertified 
                ? 'text-amber-300 font-black' 
                : 'text-slate-500 font-bold'
            }`}>
              {isCertified ? (
                <Award className="w-4 h-4 text-amber-400 animate-bounce" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>500 pts: {isKm ? 'ផ្លាកទុកចិត្ត (Certified)' : 'Certified Reliable User'}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Status / Callout banner */}
        {isCertified ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-900/80 to-teal-900/60 border border-emerald-400/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-black text-amber-200">
                  {isKm
                    ? 'អ្នកបានទទួលការបញ្ជាក់ជា «អ្នកប្រើប្រាស់គួរឲ្យទុកចិត្ត» រួចរាល់!'
                    : 'Certified Reliable User Status Active!'}
                </h4>
                <p className="text-[11px] text-emerald-100/90 mt-0.5">
                  {isKm
                    ? 'រាល់ការផ្ញើឥវ៉ាន់របស់អ្នកទទួលបានការលើកលែងការតម្កល់ប្រាក់កក់ COD និងអាទិភាពខ្ពស់បំផុតក្នុងការបញ្ជូនអ្នកដឹក'
                    : 'Your orders enjoy 0% COD collateral requirements and priority driver dispatch nationwide.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPerksModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition shrink-0 border border-white/20"
            >
              {isKm ? 'មើលសិទ្ធិពិសេស' : 'View Perks'}
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold text-amber-950">
                  {isKm
                    ? `ត្រូវការត្រឹមតែ ${pointsNeeded} ពិន្ទុទៀត (${Math.ceil(pointsNeeded / POINTS_PER_COMPLETED_SHIPMENT)} កញ្ចប់ដឹក) ដើម្បីដោះសោផ្លាកទុកចិត្ត`
                    : `Only ${pointsNeeded} more points needed (${Math.ceil(pointsNeeded / POINTS_PER_COMPLETED_SHIPMENT)} completed shipments) to unlock badge`}
                </h4>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  {isKm
                    ? 'បញ្ចប់ការទទួល ឬផ្ញើកញ្ចប់ឥវ៉ាន់ដើម្បីដោះសោសិទ្ធិអាទិភាពដឹក និងការធានា COD ឥតគិតថ្លៃ'
                    : 'Complete delivery orders or provide driver reviews to reach the 500 points milestone.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPerksModal(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-xs font-bold transition shrink-0"
            >
              {isKm ? 'អត្ថប្រយោជន៍' : 'Perks Info'}
            </button>
          </div>
        )}

        {/* 4 Certified Reliable User Perks Showcase */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className={`p-3 rounded-xl border text-xs ${
            isCertified 
              ? 'bg-white/5 border-white/10 text-white' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="font-extrabold text-[11px]">
              {isKm ? 'លើកលែងប្រាក់កក់ COD' : 'Zero COD Collateral'}
            </div>
            <div className={`text-[10px] mt-0.5 ${isCertified ? 'text-slate-300' : 'text-slate-500'}`}>
              {isKm ? 'ទូទាត់ COD ផ្ទាល់ ១០០%' : 'Direct cash collection'}
            </div>
          </div>

          <div className={`p-3 rounded-xl border text-xs ${
            isCertified 
              ? 'bg-white/5 border-white/10 text-white' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5 font-bold">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="font-extrabold text-[11px]">
              {isKm ? 'អាទិភាពផ្គូផ្គងអ្នកដឹក' : 'Express Driver Match'}
            </div>
            <div className={`text-[10px] mt-0.5 ${isCertified ? 'text-slate-300' : 'text-slate-500'}`}>
              {isKm ? 'អ្នកដឹកទទួលភ្លាមៗ' : 'Instant dispatch priority'}
            </div>
          </div>

          <div className={`p-3 rounded-xl border text-xs ${
            isCertified 
              ? 'bg-white/5 border-white/10 text-white' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1.5 font-bold">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div className="font-extrabold text-[11px]">
              {isKm ? 'ត្រាទុកចិត្តលើប័ណ្ណដឹក' : 'Certified Trust Seal'}
            </div>
            <div className={`text-[10px] mt-0.5 ${isCertified ? 'text-slate-300' : 'text-slate-500'}`}>
              {isKm ? 'បង្ហាញលើ QR & PDF' : 'Shown on labels & PDF'}
            </div>
          </div>

          <div className={`p-3 rounded-xl border text-xs ${
            isCertified 
              ? 'bg-white/5 border-white/10 text-white' 
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1.5 font-bold">
              <Star className="w-3.5 h-3.5" />
            </div>
            <div className="font-extrabold text-[11px]">
              {isKm ? 'ជំនួយការ VIP ២៤/៧' : 'VIP Telegram Dispatch'}
            </div>
            <div className={`text-[10px] mt-0.5 ${isCertified ? 'text-slate-300' : 'text-slate-500'}`}>
              {isKm ? 'ដោះស្រាយបញ្ហារហ័ស' : 'Fast-track issue resolve'}
            </div>
          </div>
        </div>

        {/* Action Controls & Interactive Testing Simulator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100/10 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Simulate Complete Shipment (+50 Pts) */}
            <button
              type="button"
              onClick={handleSimulateCompletedShipment}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                isCertified
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={isKm ? 'សាកល្បងបញ្ចប់ការដឹកជញ្ជូន ១ កញ្ចប់ ដើម្បីបន្ថែម ៥០ ពិន្ទុ' : 'Simulate completing a shipment to earn 50 points'}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{isKm ? '+៥០ ពិន្ទុ (បញ្ចប់ការដឹកជញ្ជូន)' : '+50 Pts (Complete Shipment)'}</span>
            </button>

            {/* Simulate Driver Feedback Rating (+25 Pts) */}
            <button
              type="button"
              onClick={handleSimulateRatingBonus}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                isCertified
                  ? 'bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/15'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title={isKm ? 'សាកល្បងផ្តល់មតិលើអ្នកដឹក ដើម្បីបន្ថែម ២៥ ពិន្ទុ' : 'Simulate submitting driver review to earn 25 points'}
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{isKm ? '+២៥ ពិន្ទុ (វាយតម្លៃអ្នកដឹក)' : '+25 Pts (Driver Review)'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle History Log */}
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isCertified
                  ? 'text-emerald-200 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isKm ? `ប្រវត្តិពិន្ទុ (${loyalty.history.length})` : `Point Logs (${loyalty.history.length})`}</span>
              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Reset to baseline */}
            <button
              type="button"
              onClick={handleReset}
              className={`p-2 rounded-xl text-xs transition cursor-pointer ${
                isCertified
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={isKm ? 'កំណត់ពិន្ទុឡើងវិញ' : 'Reset points baseline'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Points History Drawer */}
        {showHistory && (
          <div className={`mt-3 pt-3 border-t text-xs space-y-2 max-h-56 overflow-y-auto pr-1 ${
            isCertified ? 'border-white/10' : 'border-slate-100'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-bold opacity-75 pb-1">
              <span>{isKm ? 'កំណត់ត្រាពិន្ទុដែលបានទទួល' : 'Recent Points Earned'}</span>
              <span>{isKm ? 'កាលបរិច្ឆេទ & ពិន្ទុ' : 'Date & Points'}</span>
            </div>

            {loyalty.history.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className={`p-2 rounded-lg flex items-center justify-between gap-2 text-[11px] ${
                  isCertified ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    entry.type === 'delivery_completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : entry.type === 'rating_submitted'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {entry.type === 'delivery_completed' ? (
                      <Package className="w-3 h-3" />
                    ) : (
                      <Star className="w-3 h-3" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-semibold block truncate">
                      {isKm ? entry.reasonKm : entry.reasonEn}
                    </span>
                    <span className="text-[10px] opacity-60 block">
                      {entry.date} {entry.trackingNumber ? `• ${entry.trackingNumber}` : ''}
                    </span>
                  </div>
                </div>

                <div className="font-black text-emerald-400 shrink-0">
                  +{entry.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Perks Explanation Modal */}
      {showPerksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black">
                    {isKm ? 'សិទ្ធិពិសេស «អ្នកប្រើប្រាស់គួរឲ្យទុកចិត្ត»' : 'Certified Reliable User Privileges'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {isKm ? 'ដោះសោពេលទទួលបាន ៥០០ ពិន្ទុ' : 'Unlocked at 500 Delivery Points'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPerksModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950">
                    {isKm ? '១. ការលើកលែងការធានាប្រាក់កក់ COD' : '1. Zero COD Collateral Requirement'}
                  </h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {isKm
                      ? 'អ្នកអាចផ្ញើទំនិញ COD ក្នុងតម្លៃរហូតដល់ $1,000 ឬ ៤ លានរៀល ដោយមិនចាំបាច់មានការទាមទារប្រាក់តម្កល់ទុកមុន។'
                      : 'Send shipments with COD collection up to $1,000 / 4,000,000 KHR with zero advance deposit requirements.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950">
                    {isKm ? '២. អាទិភាពខ្ពស់ក្នុងការបញ្ជូនអ្នកដឹក (Express Match)' : '2. Instant High-Priority Driver Match'}
                  </h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {isKm
                      ? 'រាល់ការស្នើសុំកញ្ចប់ដឹករបស់អ្នក ត្រូវបានផ្ញើជូនអ្នកដឹកដែលនៅជិតបំផុតមុនគេ ធានាការមកទទួលលឿនរហ័ស។'
                      : 'Pickup requests bypass standard queues and are prioritized across all available local courier networks.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
                <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-950">
                    {isKm ? '៣. ត្រាទុកចិត្តផ្លូវការលើប័ណ្ណដឹកជញ្ជូន' : '3. Official Trust Stamp on All Waybills'}
                  </h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {isKm
                      ? 'ប័ណ្ណដឹក និងឯកសារ PDF របស់អ្នកនឹងមានត្រា «Certified Reliable User» បញ្ជាក់ទំនុកចិត្តដល់អតិថិជន។'
                      : 'All generated shipping labels, invoices, and exported PDF statements feature the official Certified stamp.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-2.5">
                <Star className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-purple-950">
                    {isKm ? '៤. ជំនួយការផ្ទាល់ VIP ២៤ ម៉ោង' : '4. 24/7 Dedicated Telegram VIP Support'}
                  </h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {isKm
                      ? 'ខ្សែទូរស័ព្ទ និង Telegram ផ្ទាល់ជាមួយប្រធានផ្នែកដឹកជញ្ជូនសម្រាប់ដោះស្រាយបញ្ហាបន្ទាន់។'
                      : 'Direct escalation line with Cambodia delivery dispatch managers for immediate real-time assistance.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPerksModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
            >
              {isKm ? 'យល់ព្រម' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
