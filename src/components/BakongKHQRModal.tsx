import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, QrCode, ShieldCheck, Copy, ArrowRight } from 'lucide-react';
import { Language, Currency } from '../types';

interface BakongKHQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amountKHR: number;
  amountUSD: number;
  currency: Currency;
  language: Language;
  merchantName: string;
  orderReference: string;
}

export const BakongKHQRModal: React.FC<BakongKHQRModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amountKHR,
  amountUSD,
  currency,
  language,
  merchantName,
  orderReference,
}) => {
  const [isPaid, setIsPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const isKm = language === 'km';

  useEffect(() => {
    if (isOpen) {
      setIsPaid(false);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayAmount = currency === 'KHR' 
    ? `${amountKHR.toLocaleString()} ៛` 
    : `$${amountUSD.toFixed(2)}`;

  const handleSimulatePayment = () => {
    setIsPaid(true);
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(orderReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* KHQR Header Banner (National Red Header) */}
        <div className="bg-[#e11938] text-white p-4 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center justify-center bg-white text-[#e11938] font-black text-sm px-3 py-1 rounded tracking-wider shadow-xs mb-1">
            KHQR
          </div>
          <p className="text-xs text-rose-100 font-medium">
            {isKm ? 'ស្កេនទូទាត់ប្រាក់តាមកម្មវិធីធនាគារនានា' : 'Scan to pay with any banking app (Bakong)'}
          </p>
        </div>

        {/* Merchant & Amount Info */}
        <div className="p-5 text-center">
          <p className="text-xs text-slate-500 font-medium">{merchantName}</p>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
            {displayAmount}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-slate-500">
            <span>Ref: <strong className="text-slate-700">{orderReference}</strong></span>
            <button
              type="button"
              onClick={handleCopyRef}
              className="text-rose-600 hover:text-rose-700 transition"
              title="Copy reference"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copied && <span className="text-[10px] text-emerald-600">{isKm ? 'បានចម្លង!' : 'Copied!'}</span>}
          </div>

          {/* QR Code Container */}
          <div className="my-4 mx-auto w-52 h-52 bg-white p-3 rounded-xl border-2 border-dashed border-rose-300 flex flex-col items-center justify-center shadow-inner relative group">
            {/* Stylized QR simulation */}
            <div className="w-full h-full bg-slate-900 rounded-lg p-2 flex flex-col justify-between relative overflow-hidden">
              {/* Corner position markers */}
              <div className="flex justify-between w-full">
                <div className="w-10 h-10 border-4 border-white bg-slate-900 p-1 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white" />
                </div>
                <div className="w-10 h-10 border-4 border-white bg-slate-900 p-1 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white" />
                </div>
              </div>

              {/* Center KHQR Logo */}
              <div className="absolute inset-0 m-auto w-12 h-12 bg-[#e11938] border-2 border-white rounded-lg flex items-center justify-center text-white font-black text-[11px] shadow-lg">
                KHQR
              </div>

              {/* Bottom corner marker & patterns */}
              <div className="flex justify-between items-end w-full">
                <div className="w-10 h-10 border-4 border-white bg-slate-900 p-1 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white" />
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white rounded-xs" />
                  <div className="w-2 h-2 bg-white rounded-xs" />
                  <div className="w-2 h-2 bg-white rounded-xs" />
                </div>
              </div>
            </div>

            {isPaid && (
              <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-xs flex flex-col items-center justify-center text-white rounded-xl animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-white mb-2" />
                <span className="font-bold text-sm">{isKm ? 'ទូទាត់ជោគជ័យ!' : 'Payment Success!'}</span>
                <span className="text-xs text-emerald-100">{isKm ? 'កំពុងបង្កើតប័ណ្ណដឹក...' : 'Creating dispatch slip...'}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKm ? 'គាំទ្រ ABA, Wing, Acleda, Canadia, TrueMoney' : 'Supported: ABA, Wing, Acleda, Canadia'}</span>
          </p>

          {/* Test Trigger Button for Sandbox/Demo */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isPaid}
              onClick={handleSimulatePayment}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <span>{isKm ? 'សាកល្បង៖ បញ្ជាក់ការទូទាត់ (Simulate Scan)' : 'Simulate Payment Success'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
