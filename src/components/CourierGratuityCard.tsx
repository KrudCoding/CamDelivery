import React, { useState } from 'react';
import {
  Coins,
  Heart,
  CheckCircle2,
  Sparkles,
  QrCode,
  DollarSign,
  Coffee,
  ThumbsUp,
  Award,
  ShieldCheck,
  Send,
  Zap,
  ArrowRight
} from 'lucide-react';
import { TrackingItem, Language, Currency } from '../types';

interface CourierGratuityCardProps {
  shipment: TrackingItem;
  language: Language;
  currency: Currency;
  onTipSubmitted?: (amountKHR: number) => void;
  className?: string;
}

interface PredefinedTipOption {
  amountKHR: number;
  amountUSD: number;
  labelKm: string;
  labelEn: string;
  icon: string;
  recommended?: boolean;
}

const PREDEFINED_TIPS: PredefinedTipOption[] = [
  {
    amountKHR: 1000,
    amountUSD: 0.25,
    labelKm: 'ទឹកអំពៅ / ភេសជ្ជៈ',
    labelEn: 'Sugarcane Drink',
    icon: '🥤',
  },
  {
    amountKHR: 2000,
    amountUSD: 0.5,
    labelKm: 'កាហ្វេទឹកដោះគោត្រជាក់',
    labelEn: 'Iced Milk Coffee',
    icon: '☕',
    recommended: true,
  },
  {
    amountKHR: 4000,
    amountUSD: 1.0,
    labelKm: 'អាហារពេលព្រឹក / គុយទាវ',
    labelEn: 'Breakfast / Noodle Meal',
    icon: '🍜',
  },
  {
    amountKHR: 8000,
    amountUSD: 2.0,
    labelKm: 'លើកទឹកចិត្តពិសេស',
    labelEn: 'Super Courier Bonus',
    icon: '⭐',
  },
];

export const CourierGratuityCard: React.FC<CourierGratuityCardProps> = ({
  shipment,
  language,
  currency,
  onTipSubmitted,
  className = '',
}) => {
  const isKm = language === 'km';
  const existingTip = shipment.postDeliveryReview?.tipAmountKHR || 0;

  const [selectedAmountKHR, setSelectedAmountKHR] = useState<number>(existingTip > 0 ? existingTip : 2000);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('5000');
  const [isTipped, setIsTipped] = useState<boolean>(existingTip > 0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [receiptCode, setReceiptCode] = useState<string>(() => `TIP-${Date.now().toString().slice(-6)}`);

  const driverName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូន' : 'Courier Rider');
  const driverPlate = shipment.driverPlate || '2AB-8829';

  const effectiveTipKHR = isCustom ? (parseInt(customInput, 10) || 0) : selectedAmountKHR;
  const effectiveTipUSD = Number((effectiveTipKHR / 4000).toFixed(2));

  const handleSendTip = () => {
    if (effectiveTipKHR <= 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsTipped(true);
      setReceiptCode(`TIP-${Math.floor(100000 + Math.random() * 900000)}`);
      if (onTipSubmitted) {
        onTipSubmitted(effectiveTipKHR);
      }
    }, 600);
  };

  return (
    <div className={`bg-gradient-to-br from-amber-500/10 via-amber-50/60 to-white rounded-3xl p-5 md:p-6 border-2 border-amber-300/80 shadow-sm relative overflow-hidden space-y-4 ${className}`}>
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/30 shrink-0">
            <Heart className="w-6 h-6 fill-slate-950 text-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {isKm ? 'ធីបលើកទឹកចិត្តអ្នកដឹក (Courier Gratuity)' : 'Courier Digital Gratuity'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 border border-amber-300">
                100% Direct Payout
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isKm
                ? `ឧបត្ថម្ភលើកទឹកចិត្តដល់ ${driverName} សម្រាប់ការដឹកជញ្ជូនរហ័ស និងគួរសម (0% កាត់កម្រៃ)`
                : `Send a digital tip directly to ${driverName} for excellent doorstep delivery`}
            </p>
          </div>
        </div>

        {/* Courier Identity Pill */}
        <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs self-start sm:self-auto">
          <span className="font-bold text-xs text-slate-800">{driverName}</span>
          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
            {driverPlate}
          </span>
        </div>
      </div>

      {isTipped ? (
        /* Confirmed Tip State */
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-300/80 shadow-sm text-center space-y-3 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">
              {isKm ? 'បានផ្ទេរប្រាក់ធីបជោគជ័យ!' : 'Digital Tip Transferred!'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {currency === 'KHR'
                ? `${effectiveTipKHR.toLocaleString()} ៛`
                : `$${effectiveTipUSD.toFixed(2)}`}
            </div>
            <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
              {isKm
                ? `អរគុណច្រើន! ប្រាក់ធីបរបស់អ្នកត្រូវបានទូទាត់ចូលកាបូបបាគងរបស់ ${driverName} ដោយផ្ទាល់រួចរាល់ហើយ។`
                : `Thank you! 100% of your gratuity has been deposited into ${driverName}'s account.`}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
            <span>Ref: {receiptCode}</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold font-sans">{isKm ? 'ទូទាត់រួច' : 'Settled'}</span>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsTipped(false)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline transition"
            >
              {isKm ? 'កែសម្រួល ឬបន្ថែមធីប' : 'Adjust or Add Additional Tip'}
            </button>
          </div>
        </div>
      ) : (
        /* Active Tipping Controls */
        <div className="space-y-4">
          {/* Predefined Tip Amount Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {isKm ? 'ជ្រើសរើសចំនួនប្រាក់ធីបងាយស្រួល (Predefined Amounts)' : 'Choose Convenient Tip Amount'}:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PREDEFINED_TIPS.map((opt) => {
                const isSelected = !isCustom && selectedAmountKHR === opt.amountKHR;
                return (
                  <button
                    key={opt.amountKHR}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedAmountKHR(opt.amountKHR);
                    }}
                    className={`p-3 rounded-2xl border text-left transition relative cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 shadow-sm ring-2 ring-amber-400'
                        : 'border-amber-200 bg-white hover:bg-amber-50/50'
                    }`}
                  >
                    {opt.recommended && (
                      <span className="absolute -top-2 right-2 bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-1.5 py-0.2 rounded-full shadow-2xs">
                        {isKm ? 'ពេញនិយម' : 'Popular'}
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-lg">{opt.icon}</span>
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        ${opt.amountUSD.toFixed(2)}
                      </span>
                    </div>

                    <div className="font-black text-sm sm:text-base text-slate-900 mt-1">
                      {opt.amountKHR.toLocaleString()} ៛
                    </div>

                    <div className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                      {isKm ? opt.labelKm : opt.labelEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Tip Amount Toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsCustom(!isCustom)}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isCustom ? (isKm ? '➔ ប្រើជម្រើសប្រាក់កំណត់ស្រាប់' : '➔ Use Predefined Amounts') : (isKm ? '✏️ បញ្ចូលចំនួនទឹកប្រាក់ផ្សេងទៀត' : '✏️ Enter Custom Tip Amount')}</span>
            </button>

            {isCustom && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-28 bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-600">៛ KHR</span>
              </div>
            )}
          </div>

          {/* Instant Tip Action Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                {isKm ? 'ទឹកប្រាក់ធីបសរុប (100% ជូនអ្នកដឹក)' : 'Total Digital Gratuity'}
              </span>
              <div className="text-base sm:text-lg font-black text-white mt-0.5">
                {effectiveTipKHR.toLocaleString()} ៛{' '}
                <span className="text-slate-400 font-normal text-xs">(${effectiveTipUSD})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendTip}
              disabled={isProcessing || effectiveTipKHR <= 0}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{isKm ? 'កំពុងផ្ទេរ...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>{isKm ? 'ផ្ញើធីបភ្លាមៗ (Send Tip)' : 'Confirm & Send Tip'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
