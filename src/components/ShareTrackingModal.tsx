import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Send, 
  MessageCircle, 
  Phone, 
  X, 
  ShieldCheck, 
  QrCode, 
  Sparkles, 
  ExternalLink,
  Smartphone,
  Facebook
} from 'lucide-react';
import { TrackingItem, Language } from '../types';

interface ShareTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: TrackingItem;
  language: Language;
}

export const ShareTrackingModal: React.FC<ShareTrackingModalProps> = ({
  isOpen,
  onClose,
  shipment,
  language,
}) => {
  const isKm = language === 'km';
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  // Canonical deep link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://camdelivery.kh';
  const deepLink = `${origin}/?track=${shipment.trackingNumber}&carrier=${encodeURIComponent(shipment.carrierId)}&status=${encodeURIComponent(shipment.status)}`;

  // Status text
  const statusLabel = isKm ? shipment.statusKm : shipment.status.replace(/_/g, ' ').toUpperCase();
  const routeText = isKm 
    ? `${shipment.senderCityKm} ➔ ${shipment.receiverCityKm}` 
    : `${shipment.senderCity} ➔ ${shipment.receiverCity}`;

  // Complete rich shareable message
  const shareableMessage = isKm
    ? `📦 ព័ត៌មានតាមដានកញ្ចប់ឥវ៉ាន់ CamDelivery
លេខកូដ៖ #${shipment.trackingNumber}
ក្រុមហ៊ុន៖ ${shipment.carrierNameKm}
ស្ថានភាព៖ ${statusLabel}
ទិសដៅ៖ ${routeText}
អ្នកទទួល៖ ${shipment.receiverName} (${shipment.receiverPhone})
${shipment.driverName ? `អ្នកដឹកជញ្ជូន៖ ${shipment.driverName} (${shipment.driverPhone || ''})\n` : ''}កាលបរិច្ឆេទមកដល់៖ ${shipment.estimatedDeliveryKm || shipment.estimatedDelivery}
${shipment.isCod ? `ប្រាក់ COD៖ ${shipment.codAmountKHR.toLocaleString()} ៛\n` : ''}ចុចតាមដានទីតាំងផ្ទាល់៖ ${deepLink}`
    : `📦 CamDelivery Live Tracking Update
Tracking #: #${shipment.trackingNumber}
Carrier: ${shipment.carrierName}
Status: ${statusLabel}
Route: ${routeText}
Recipient: ${shipment.receiverName} (${shipment.receiverPhone})
${shipment.driverName ? `Courier: ${shipment.driverName} (${shipment.driverPhone || ''})\n` : ''}Estimated Delivery: ${shipment.estimatedDelivery}
${shipment.isCod ? `COD Amount: ${shipment.codAmountKHR.toLocaleString()} KHR\n` : ''}Live GPS Deep Link: ${deepLink}`;

  // Copy Deep Link
  const handleCopyDeepLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(deepLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Copy Full Status Message
  const handleCopyMessage = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareableMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 3000);
    }
  };

  // Native Web Share API if supported
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CamDelivery #${shipment.trackingNumber}`,
          text: shareableMessage,
          url: deepLink,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyMessage();
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // QR Code URL using standard Google Charts QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(deepLink)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200/60 shadow-2xs">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {isKm ? 'ចែករំលែកការតាមដាន (Share Tracking)' : 'Share Tracking Status'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isKm ? 'ផ្ញើតំណភ្ជាប់ Deep Link ឬសារជាអក្សរទៅកាន់អ្នកទទួល' : 'Generate deep link & social shareable message'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status Pill Preview */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-900/60 flex items-center justify-between gap-2 shadow-inner">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              #{shipment.trackingNumber}
            </span>
            <span className="text-xs font-black text-amber-300 block mt-0.5">
              {statusLabel}
            </span>
            <span className="text-[10px] text-slate-300 block">
              {routeText}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowQrCode(!showQrCode)}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-300" />
            <span>{showQrCode ? (isKm ? 'លាក់ QR' : 'Hide QR') : (isKm ? 'មើល QR' : 'View QR')}</span>
          </button>
        </div>

        {/* QR Code Card if toggled */}
        {showQrCode && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 animate-fadeIn">
            <span className="text-xs font-extrabold text-slate-800 block">
              {isKm ? 'ស្កេន QR ដើម្បីបើកតំណភ្ជាប់តាមដានផ្ទាល់' : 'Scan to Open Live Deep Link'}
            </span>
            <div className="w-44 h-44 mx-auto p-2 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
              <img 
                src={qrCodeUrl} 
                alt="Tracking Deep Link QR" 
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono select-all truncate">
              {deepLink}
            </p>
          </div>
        )}

        {/* Deep Link Input Box with 1-Click Copy */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>{isKm ? 'តំណភ្ជាប់ផ្ទាល់ (Deep Link URL)' : 'Tracking Deep Link'}</span>
            <span className="text-[10px] text-emerald-700 font-bold">{isKm ? 'មិនបាច់ដំឡើង App' : 'No App Needed'}</span>
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-xs font-mono text-slate-800 truncate flex-1 select-all">
              {deepLink}
            </span>
            <button
              type="button"
              onClick={handleCopyDeepLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? (isKm ? 'បានចម្លង!' : 'Copied!') : (isKm ? 'ចម្លងតំណ' : 'Copy Link')}</span>
            </button>
          </div>
        </div>

        {/* Shareable Status Message Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700">
              {isKm ? 'សារជាអក្សរពេញលេញ (Shareable Text Message)' : 'Formatted Shareable Message'}
            </label>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedMessage ? (isKm ? 'បានចម្លងសារ!' : 'Message Copied!') : (isKm ? 'ចម្លងសារទាំងអស់' : 'Copy Message')}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto select-all">
            {shareableMessage}
          </div>
        </div>

        {/* Native Mobile Share Button (if supported) */}
        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>{isKm ? 'ចែករំលែកតាមទូរស័ព្ទ (System Share Sheet)' : 'Share via Device (AirDrop, Apps, etc.)'}</span>
          </button>
        )}

        {/* 1-Click Social & Messaging Channels */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {isKm ? 'ផ្ញើទៅកាន់កម្មវិធីសាររហ័ស (Instant Channels)' : 'Quick Share to Channels'}
          </span>

          <div className="grid grid-cols-4 gap-2">
            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(shareableMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-center font-bold text-xs transition flex flex-col items-center justify-center gap-1 shadow-2xs"
            >
              <Send className="w-4 h-4 text-sky-500" />
              <span className="text-[11px]">Telegram</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareableMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center font-bold text-xs transition flex flex-col items-center justify-center gap-1 shadow-2xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px]">WhatsApp</span>
            </a>

            {/* SMS */}
            <a
              href={`sms:?body=${encodeURIComponent(shareableMessage)}`}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-center font-bold text-xs transition flex flex-col items-center justify-center gap-1 shadow-2xs"
            >
              <Phone className="w-4 h-4 text-slate-600" />
              <span className="text-[11px]">SMS</span>
            </a>

            {/* Facebook Share */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(deepLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-center font-bold text-xs transition flex flex-col items-center justify-center gap-1 shadow-2xs"
            >
              <Facebook className="w-4 h-4 text-indigo-600" />
              <span className="text-[11px]">Facebook</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{isKm ? 'តំណភ្ជាប់សុវត្ថិភាពផ្លូវការ' : 'Verified Secure Deep Link'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
          >
            {isKm ? 'រួចរាល់' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
