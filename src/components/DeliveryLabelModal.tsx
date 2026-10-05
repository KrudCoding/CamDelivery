import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  QrCode,
  CheckCircle2,
  Copy,
  Package,
  MapPin,
  Phone,
  ShieldCheck,
  Building2,
  ExternalLink,
  Sparkles,
  Info,
  Check,
  FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import { TrackingItem, Language, Currency } from '../types';
import { downloadDeliveryLabelPdf } from '../utils/deliveryLabelPdf';

interface DeliveryLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: TrackingItem;
  language: Language;
  currency: Currency;
  onNotify?: (message: string) => void;
}

export const DeliveryLabelModal: React.FC<DeliveryLabelModalProps> = ({
  isOpen,
  onClose,
  shipment,
  language,
  currency,
  onNotify,
}) => {
  const isKm = language === 'km';
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [labelFormat, setLabelFormat] = useState<'4x6' | 'a4'>('4x6');
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Generate real dynamic QR code data URL whenever shipment changes
  useEffect(() => {
    if (!shipment) return;
    const trackingQrPayload = JSON.stringify({
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrierName,
      recipient: shipment.receiverName,
      phone: shipment.receiverPhone,
      city: shipment.receiverCity,
      feeKHR: shipment.totalPriceKHR,
      isCod: shipment.isCod,
      codKHR: shipment.codAmountKHR,
      timestamp: new Date().toISOString(),
    });

    QRCode.toDataURL(trackingQrPayload, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error('Failed to generate label QR:', err);
        // Fallback to tracking number string
        QRCode.toDataURL(shipment.trackingNumber, { width: 320, margin: 1 })
          .then(setQrDataUrl)
          .catch(() => {});
      });
  }, [shipment]);

  if (!isOpen || !shipment) return null;

  // Destination and origin codes
  const cityCodeMap: Record<string, string> = {
    'Phnom Penh': 'PNH',
    'Siem Reap': 'REP',
    'Battambang': 'BBM',
    'Preah Sihanouk': 'KOS',
    'Sihanoukville': 'KOS',
    'Kampot': 'KPT',
    'Kampong Cham': 'KCM',
    'Kandal': 'KDL',
    'Takeo': 'TKO',
    'Pursat': 'PST',
    'Svay Rieng': 'SVR',
    'Prey Veng': 'PVG',
    'Banteay Meanchey': 'BMC',
    'Kratie': 'KTI',
  };

  const toCityCode = cityCodeMap[shipment.receiverCity] || shipment.receiverCity.slice(0, 3).toUpperCase();
  const fromCityCode = cityCodeMap[shipment.senderCity] || shipment.senderCity.slice(0, 3).toUpperCase();
  const routingHubCode = `${toCityCode}-HUB-${shipment.trackingNumber.slice(-3)}`;

  // Handle PDF Download
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadDeliveryLabelPdf({
        shipment,
        language,
        currency,
        labelSize: labelFormat,
      });
      if (onNotify) {
        onNotify(isKm ? 'បានទាញយកប័ណ្ណដឹកជញ្ជូនជា PDF រួចរាល់!' : 'Delivery Label PDF downloaded successfully!');
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
      if (onNotify) {
        onNotify(isKm ? 'មានបញ្ហាក្នុងការបង្កើត PDF' : 'Failed to generate PDF label');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Direct Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Share
  const handleShare = async () => {
    const shareText = `📦 Delivery Waybill #${shipment.trackingNumber}\n` +
      `Carrier: ${shipment.carrierName}\n` +
      `Recipient: ${shipment.receiverName} (${shipment.receiverPhone})\n` +
      `Destination: ${shipment.receiverCity}\n` +
      `Status: ${shipment.status.toUpperCase()}\n` +
      `COD: ${shipment.isCod ? `${shipment.codAmountKHR.toLocaleString()} KHR` : 'None (Prepaid)'}\n` +
      `Track online at: ${window.location.origin}?track=${shipment.trackingNumber}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Delivery Label #${shipment.trackingNumber}`,
          text: shareText,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (onNotify) {
        onNotify(isKm ? 'បានចម្លងព័ត៌មានប័ណ្ណដឹកជញ្ជូន!' : 'Waybill details copied to clipboard!');
      }
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  {isKm ? 'ប័ណ្ណដឹកជញ្ជូនទំនិញ (Waybill Delivery Label)' : 'Official Delivery Waybill Label'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PDF & Print Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                #{shipment.trackingNumber} • {isKm ? 'រួមបញ្ចូលបាកូដ QR ស្កេនបាន និងព័ត៌មានអ្នកទទួល' : 'Includes scannable tracking QR and recipient details'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Action Controls Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">
              {isKm ? 'ទំហំប័ណ្ណ៖' : 'Label Size:'}
            </span>
            <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLabelFormat('4x6')}
                className={`px-2.5 py-1 rounded-md transition ${
                  labelFormat === '4x6' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4" × 6" (Waybill)
              </button>
              <button
                type="button"
                onClick={() => setLabelFormat('a4')}
                className={`px-2.5 py-1 rounded-md transition ${
                  labelFormat === 'a4' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4 Sheet
              </button>
            </div>
          </div>

          {/* Quick Print & Download Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title={isKm ? 'បោះពុម្ពប័ណ្ណដឹកជញ្ជូន' : 'Print delivery label'}
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isKm ? 'បោះពុម្ព' : 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title={isKm ? 'ទាញយកឯកសារ PDF' : 'Download high-res PDF label'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? (isKm ? 'កំពុងទាញយក...' : 'Downloading...') : (isKm ? 'ទាញយក PDF' : 'Download PDF')}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              title={isKm ? 'ចែករំលែកប័ណ្ណ' : 'Share label or copy details'}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isCopied ? (isKm ? 'បានចម្លង!' : 'Copied!') : (isKm ? 'ចែករំលែក' : 'Share')}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body: Live Printable Waybill Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/70 flex justify-center">
          {/* Printable Label Paper Card */}
          <div
            ref={printAreaRef}
            id="printable-delivery-label"
            className="w-full max-w-[420px] bg-white border-2 border-slate-900 rounded-2xl shadow-xl overflow-hidden font-sans text-slate-900 text-xs select-text relative"
            style={{ minHeight: '560px' }}
          >
            {/* Header: Carrier Info & Express Waybill Badge */}
            <div className="bg-slate-950 text-white p-3.5 flex items-center justify-between border-b-2 border-slate-900">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-xs"
                  style={{ backgroundColor: shipment.brandColor || '#2563eb' }}
                >
                  {shipment.carrierId.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wide text-white leading-tight">
                    {shipment.carrierName}
                  </h4>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    {isKm ? 'បណ្តាញដឹកជញ្ជូនឯករាជ្យ ២៥ ខេត្ត-ក្រុង' : 'Cambodia Logistics & Van Network'}
                  </p>
                  <p className="text-[9px] text-emerald-400 font-bold">
                    0% Commission • Bakong Verified
                  </p>
                </div>
              </div>

              <div className="bg-rose-600 text-white px-2.5 py-1 rounded-md text-center shadow-2xs">
                <div className="text-[9px] font-black uppercase tracking-wider">EXPRESS</div>
                <div className="text-[8px] font-bold text-rose-100">WAYBILL</div>
              </div>
            </div>

            {/* Hub Sort Code Bar & Route Corridor */}
            <div className="grid grid-cols-12 border-b-2 border-slate-900 divide-x-2 divide-slate-900 bg-slate-50">
              <div className="col-span-6 p-2.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">
                  {isKm ? 'កូដតំបន់ចែកចាយ' : 'Sort Hub Code'}
                </span>
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-950 block">
                  {routingHubCode}
                </span>
                <span className="text-[10px] font-extrabold text-rose-600 block">
                  DEST: {shipment.receiverCity.toUpperCase()}
                </span>
              </div>
              <div className="col-span-6 p-2.5 flex flex-col justify-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">
                  {isKm ? 'ខ្សែរត់ដឹកជញ្ជូន' : 'Route Transit'}
                </span>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-slate-200 rounded font-mono">{fromCityCode}</span>
                  <span>➔</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono font-bold">{toCityCode}</span>
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  {isKm ? 'សេវាឡានវ៉ែន / ដឹកដល់ផ្ទះ' : 'Direct Van / Doorstep Delivery'}
                </span>
              </div>
            </div>

            {/* Visual Simulated Barcode Strip */}
            <div className="p-3 bg-white border-b-2 border-slate-900 text-center flex flex-col items-center justify-center">
              {/* SVG-like Barcode lines */}
              <div className="h-9 w-11/12 flex items-stretch justify-center gap-[2px] bg-slate-950 p-1 rounded-xs">
                {[
                  3, 1, 2, 4, 1, 2, 3, 1, 1, 3, 2, 1, 4, 1, 2, 1, 3, 2, 1, 4,
                  2, 1, 3, 1, 2, 3, 1, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1, 2,
                  1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 2, 1
                ].map((width, idx) => (
                  <div
                    key={idx}
                    className="h-full bg-white"
                    style={{ width: `${width * 1.4}px` }}
                  />
                ))}
              </div>
              <div className="font-mono font-black text-xs sm:text-sm tracking-widest text-slate-950 mt-1">
                * {shipment.trackingNumber} *
              </div>
            </div>

            {/* RECIPIENT ("SHIP TO") SECTION - HIGHEST VISUAL PROMINENCE */}
            <div className="p-3.5 bg-amber-50/70 border-b-2 border-slate-900">
              <div className="flex items-center justify-between mb-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-slate-950 text-white px-2 py-0.5 rounded-sm">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>SHIP TO / អ្នកទទួល</span>
                </span>
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                  {isKm ? 'អាទិភាពខ្ពស់' : 'High Priority'}
                </span>
              </div>

              {/* Recipient Name */}
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
                  {shipment.receiverName}
                </h3>
              </div>

              {/* Recipient Phone (Prominent with call-out badge) */}
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{isKm ? 'លេខទូរស័ព្ទ៖' : 'Tel:'}</span>
                <span className="text-sm sm:text-base font-black text-rose-600 tracking-wide font-mono bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  {shipment.receiverPhone}
                </span>
              </div>

              {/* Recipient Destination City & Address */}
              <div className="mt-2 text-xs font-semibold text-slate-800 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <span className="text-slate-500">{isKm ? 'ខេត្ត-ក្រុង៖' : 'City/Province:'}</span>
                  <span className="font-extrabold text-slate-950">{isKm ? shipment.receiverCityKm || shipment.receiverCity : shipment.receiverCity}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  <span className="font-bold text-slate-700">{isKm ? 'ទីតាំងប្រគល់៖' : 'Delivery Point:'}</span> {shipment.receiverCity} Regional Delivery Depot / Doorstep Drop-off
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 italic">
                  {isKm ? 'ចំណាំ៖ សូមទូរស័ព្ទទៅកាន់អ្នកទទួលមុនពេលចេញដំណើរដឹកដល់ផ្ទះ' : 'Note: Please call recipient prior to final dispatch'}
                </div>
              </div>
            </div>

            {/* SENDER ("FROM") SECTION */}
            <div className="p-3 bg-white border-b-2 border-slate-900">
              <div className="flex items-center justify-between mb-1">
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-sm">
                  <span>FROM / អ្នកផ្ញើ</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="font-bold text-xs text-slate-900">{shipment.senderName}</span>
                <span className="font-mono text-xs font-bold text-slate-600">TEL: {shipment.senderPhone}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isKm ? 'ចេញដំណើរពី៖' : 'Origin:'} {isKm ? shipment.senderCityKm || shipment.senderCity : shipment.senderCity} Central Dispatch Hub
              </p>
            </div>

            {/* PARCEL SPECS & DYNAMIC QR CODE SECTION */}
            <div className="grid grid-cols-12 border-b-2 border-slate-900 divide-x-2 divide-slate-900 bg-slate-50">
              {/* Parcel Specs Left */}
              <div className="col-span-7 p-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase block">
                    {isKm ? 'ព័ត៌មានកញ្ចប់ឥវ៉ាន់' : 'Parcel Details'}
                  </span>
                  
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{isKm ? 'ទម្ងន់៖' : 'Weight:'}</span>
                    <span className="font-black text-slate-900 font-mono">{shipment.weightKg} kg</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{isKm ? 'ប្រភេទ៖' : 'Type:'}</span>
                    <span className="font-bold text-slate-800">{isKm ? shipment.packageTypeKm || shipment.packageType : shipment.packageType}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{isKm ? 'ថ្លៃដឹក៖' : 'Ship Fee:'}</span>
                    <span className="font-bold text-slate-900">
                      {currency === 'KHR' ? `${shipment.totalPriceKHR.toLocaleString()} KHR` : `$${shipment.totalPriceUSD.toFixed(2)}`}
                      <span className="ml-1 text-[9px] text-emerald-600 font-black">(PAID)</span>
                    </span>
                  </div>
                </div>

                {/* COD Status Box */}
                <div className="mt-2">
                  {shipment.isCod && shipment.codAmountKHR > 0 ? (
                    <div className="p-2 rounded-lg bg-rose-50 border-2 border-rose-500 text-rose-900">
                      <span className="text-[9px] font-black uppercase tracking-wider block">
                        C.O.D. CASH ON DELIVERY
                      </span>
                      <span className="text-sm font-black tracking-tight text-rose-700 block font-mono">
                        {shipment.codAmountKHR.toLocaleString()} KHR
                      </span>
                      <span className="text-[9px] text-rose-600 font-semibold block">
                        (${ (shipment.codAmountKHR / 4000).toFixed(2) } USD)
                      </span>
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-400 text-emerald-900">
                      <span className="text-[9px] font-black uppercase tracking-wider block text-emerald-800">
                        NO C.O.D. • 0 CASH DUE
                      </span>
                      <span className="text-[9px] text-emerald-700 font-semibold block">
                        {isKm ? 'បានទូទាត់រួច • ប្រគល់ជូនអ្នកទទួល' : 'Prepaid • Handover to recipient directly'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Right */}
              <div className="col-span-5 p-2.5 flex flex-col items-center justify-center bg-white">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Tracking QR Code"
                    className="w-28 h-28 object-contain rounded-lg p-1 bg-white border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-28 h-28 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <QrCode className="w-10 h-10 animate-pulse" />
                  </div>
                )}
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-900 mt-1">
                  SCAN TO TRACK
                </span>
                <span className="text-[7.5px] text-slate-500 text-center font-mono">
                  #{shipment.trackingNumber}
                </span>
              </div>
            </div>

            {/* Footer: Security Stamp & Official Delivery Verification */}
            <div className="p-2.5 bg-slate-100 text-[8.5px] text-slate-600 space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span>{isKm ? 'អ្នកដឹកជញ្ជូន៖' : 'Driver:'} {shipment.driverName || 'Community Van Driver'}</span>
                <span>{isKm ? 'ស្លាកលេខ៖' : 'Plate:'} {shipment.driverPlate || '2AB-8829'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[8px] pt-1 border-t border-slate-200">
                <span>Issued: {new Date().toLocaleDateString()}</span>
                <span>Zero Commission • Verified Digital Waybill</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">
              {isKm 
                ? 'អាចបិទភ្ជាប់លើប្រអប់កញ្ចប់ ឬផ្ញើរូបភាព/PDF ទៅកាន់អ្នកទទួលតាម Telegram/Messenger' 
                : 'Stick onto the parcel box or send PDF/image directly to the recipient'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              {isKm ? 'បិទ' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isKm ? 'ទាញយក PDF' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
