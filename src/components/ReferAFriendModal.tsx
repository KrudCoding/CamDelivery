import React, { useState, useEffect } from 'react';
import {
  Share2,
  Gift,
  Award,
  Crown,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
  MessageCircle,
  Facebook,
  Send,
  ShieldCheck,
  CheckCircle2,
  Users,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';
import { Language, UserAccountProfile } from '../types';
import { addDeliveryPoints } from '../utils/loyaltyService';

interface ReferAFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserAccountProfile;
  language: Language;
  onNotify: (msg: string) => void;
}

export const REFERRAL_BADGE_KEY = 'camdelivery_top_rated_sender_badge';

export function hasTopRatedSenderBadge(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REFERRAL_BADGE_KEY) === 'true';
}

export function awardTopRatedSenderBadge(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFERRAL_BADGE_KEY, 'true');
  window.dispatchEvent(new CustomEvent('camdelivery_badge_updated'));
}

export const ReferAFriendModal: React.FC<ReferAFriendModalProps> = ({
  isOpen,
  onClose,
  profile,
  language,
  onNotify,
}) => {
  const isKm = language === 'km';

  // Referral Code & Link derivation
  const cleanPhone = profile.phone ? profile.phone.replace(/[^0-9]/g, '').slice(-4) : '8829';
  const referralCode = `CAM-SENDER-${cleanPhone}`;
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${referralCode}`
    : `https://camdelivery.app.kh/?ref=${referralCode}`;

  const [copied, setCopied] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [badgeUnlocked, setBadgeUnlocked] = useState<boolean>(hasTopRatedSenderBadge);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Generate QR code for the referral link
  useEffect(() => {
    QRCode.toDataURL(referralUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.warn('QR code gen error:', err));
  }, [referralUrl]);

  useEffect(() => {
    setBadgeUnlocked(hasTopRatedSenderBadge());
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerBadgeAward = () => {
    if (!badgeUnlocked) {
      awardTopRatedSenderBadge();
      setBadgeUnlocked(true);
      setShowCelebration(true);

      // Add bonus loyalty points
      addDeliveryPoints(
        100,
        `Unlocked Top-Rated Sender Badge via Friend Referral program (${referralCode})`,
        `ទទួលបានមេដាយអ្នកផ្ញើឆ្នើមលំដាប់កំពូល តាមរយៈកម្មវិធីណែនាំមិត្តភក្តិ (${referralCode})`,
        undefined,
        'bonus'
      );

      onNotify(
        isKm
          ? '🎉 អបអរសាទរ! អ្នកបានទទួលផ្លាកសញ្ញា "អ្នកផ្ញើឆ្នើមលំដាប់កំពូល" (Top-Rated Sender) ជោគជ័យ (+100 ពិន្ទុ)!'
          : '🎉 Congratulations! You have unlocked the "Top-Rated Sender" badge (+100 Loyalty Points)!'
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    triggerBadgeAward();
    onNotify(isKm ? 'បានចម្លងតំណភ្ជាប់ណែនាំរួចរាល់!' : 'Referral link copied to clipboard!');
  };

  const shareText = isKm
    ? `ផ្ញើឥវ៉ាន់ ២៥ ខេត្ត-ក្រុង គ្មានកម្រៃជើងសារ 0% ជាមួយ CamDelivery! ប្រើកូដណែនាំរបស់ខ្ញុំ [${referralCode}] ដើម្បីទទួលបានការដឹកជញ្ជូនរហ័ស & ឥតគិតថ្លៃ៖ ${referralUrl}`
    : `Ship parcels across all 25 provinces in Cambodia with 0% middleman fees! Use my referral code [${referralCode}] on CamDelivery: ${referralUrl}`;

  const handleShareTelegram = () => {
    triggerBadgeAward();
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = () => {
    triggerBadgeAward();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = () => {
    triggerBadgeAward();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    triggerBadgeAward();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'CamDelivery - 0% Commission Cambodia Logistics',
          text: shareText,
          url: referralUrl,
        });
      } catch {
        // Ignore user cancel
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl relative space-y-4 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-amber-500/25">
              <Gift className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  {isKm ? 'ណែនាំមិត្តភក្តិ (Refer a Friend)' : 'Refer a Friend & Earn Badge'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {isKm ? 'កូដផ្ទាល់ខ្លួន' : 'Unique Link'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKm
                  ? 'ចែករំលែកតំណភ្ជាប់ ដើម្បីទទួលបានផ្លាកសញ្ញា "អ្នកផ្ញើឆ្នើមលំដាប់កំពូល"'
                  : 'Share your link to unlock the exclusive "Top-Rated Sender" badge & bonus points!'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top-Rated Sender Badge Status Banner */}
        <div className={`p-4 rounded-2xl border transition-all ${
          badgeUnlocked
            ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/80 border-amber-300 shadow-xs'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                badgeUnlocked
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                <Crown className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-sm text-slate-900">
                    {isKm ? 'ផ្លាកសញ្ញា៖ អ្នកផ្ញើឆ្នើមលំដាប់កំពូល' : 'Reward: Top-Rated Sender Badge'}
                  </span>
                  {badgeUnlocked ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-md bg-emerald-600 text-white shadow-2xs">
                      {isKm ? 'បានដោះសោ' : 'Unlocked'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-md bg-slate-200 text-slate-700">
                      {isKm ? 'ចែករំលែកដើម្បីដោះសោ' : 'Share to Unlock'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-0.5">
                  {badgeUnlocked
                    ? (isKm ? '✨ មេដាយកំពុងបង្ហាញលើគណនីរបស់អ្នក ផ្តល់អាទិភាពបញ្ជូន និងទំនុកចិត្តខ្ពស់!' : '✨ Active badge displayed on your profile with priority dispatch and trust badge.')
                    : (isKm ? 'ចែករំលែកតំណភ្ជាប់លើ Social Media ដើម្បីដោះសោមេដាយ និងទទួលបាន +១០០ ពិន្ទុ!' : 'Share your referral link on social media to earn the badge + 100 points!')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Unique Referral Link & Code Box */}
        <div className="space-y-3">
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
            {isKm ? 'តំណភ្ជាប់ណែនាំផ្ទាល់ខ្លួនរបស់អ្នក (Your Unique Referral Link)' : 'Your Unique Referral Deep Link'}
          </label>

          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-300">
            <span className="font-mono text-xs text-slate-800 font-bold px-2 py-1 truncate flex-1 select-all">
              {referralUrl}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isKm ? 'បានចម្លង!' : 'Copied!') : (isKm ? 'ចម្លង' : 'Copy Link')}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {isKm ? 'កូដណែនាំ៖' : 'Referral Code:'}{' '}
              <strong className="font-mono text-slate-800">{referralCode}</strong>
            </span>
            <span className="text-[11px] text-emerald-700 font-bold">
              {isKm ? 'ឥតគិតថ្លៃ ១០០% • គ្មានកម្រៃជើងសារ' : '100% Free • 0% Commission'}
            </span>
          </div>
        </div>

        {/* Social Media Share Buttons */}
        <div className="space-y-2 pt-2">
          <span className="block text-xs font-black text-slate-800 uppercase tracking-wider">
            {isKm ? 'ចែករំលែកទៅកាន់បណ្តាញសង្គម (Share on Social Media)' : 'One-Click Social Media Sharing'}
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Telegram */}
            <button
              type="button"
              onClick={handleShareTelegram}
              className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
            >
              <Send className="w-5 h-5 text-sky-600 group-hover:scale-110 transition" />
              <span className="text-xs font-black">Telegram</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={handleShareFacebook}
              className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
            >
              <Facebook className="w-5 h-5 text-blue-600 group-hover:scale-110 transition" />
              <span className="text-xs font-black">Facebook</span>
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
            >
              <MessageCircle className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition" />
              <span className="text-xs font-black">WhatsApp</span>
            </button>

            {/* System / Mobile Share */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
            >
              <Share2 className="w-5 h-5 text-slate-700 group-hover:scale-110 transition" />
              <span className="text-xs font-black">{isKm ? 'ចែករំលែក' : 'Share API'}</span>
            </button>
          </div>
        </div>

        {/* QR Code Quick Scan for Friends */}
        {qrCodeUrl && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-extrabold text-xs text-slate-900 block flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>{isKm ? 'ស្កេនកូដ QR ដើម្បីបើក' : 'Scan to Open Directly'}</span>
              </span>
              <p className="text-[11px] text-slate-500">
                {isKm
                  ? 'មិត្តភក្តិអាចស្កេនកូដ QR នេះតាមទូរស័ព្ទដៃ ដើម្បីចូលប្រើភ្លាមៗ'
                  : 'Friends can scan this QR code with camera to open the web app instantly.'}
              </p>
            </div>

            <img
              src={qrCodeUrl}
              alt="Referral QR Code"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-300 shrink-0 bg-white p-1"
            />
          </div>
        )}

        {/* Reassurance Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isKm
                ? 'មិត្តភក្តិទទួលបានសេវា 0% កម្រៃជើងសារ និងការដឹកជញ្ជូនរហ័ស'
                : 'Friends receive 0% middleman fees & direct driver connection'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
          >
            {isKm ? 'បិទ' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
