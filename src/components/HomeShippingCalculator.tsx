import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  MapPin,
  Package,
  ArrowRightLeft,
  Truck,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  TrendingDown,
  Info,
  Check,
  Zap,
  Box
} from 'lucide-react';
import { CAMBODIA_PROVINCES, calculateCourierQuotes } from '../data/carriers';
import { Language, Currency, TrackingItem, SavedAddressItem } from '../types';
import { getSavedAddresses, SAVED_ADDRESSES_EVENT } from '../utils/savedAddressService';

interface HomeShippingCalculatorProps {
  language: Language;
  currency: Currency;
  onNavigateTab: (tabId: 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
  onNotify?: (message: string) => void;
  onScheduleShipment?: (newShipment: TrackingItem) => void;
  className?: string;
}

export type PackageSizeTier = 'small' | 'medium' | 'large' | 'xlarge' | 'bulk';

interface PackageSizeOption {
  id: PackageSizeTier;
  labelEn: string;
  labelKm: string;
  subEn: string;
  subKm: string;
  weightEquivalentKg: number;
  dimensionsEn: string;
  dimensionsKm: string;
  icon: string;
}

const PACKAGE_SIZE_OPTIONS: PackageSizeOption[] = [
  {
    id: 'small',
    labelEn: 'Small / Pouch',
    labelKm: 'កញ្ចប់តូច / ស្រោមសំបុត្រ',
    subEn: 'Documents, cosmetics, phone accessories (< 1kg)',
    subKm: 'ឯកសារ គ្រឿងសម្អាង ស្រោមទូរស័ព្ទ (< ១គីឡូ)',
    weightEquivalentKg: 0.8,
    dimensionsEn: 'Up to 25 × 20 × 5 cm',
    dimensionsKm: 'រហូតដល់ ២៥ × ២០ × ៥ ស.ម',
    icon: '✉️',
  },
  {
    id: 'medium',
    labelEn: 'Standard Box',
    labelKm: 'ប្រអប់ស្តង់ដារ',
    subEn: 'Apparel, shoes, multiple small goods (1 - 3kg)',
    subKm: 'សម្លៀកបំពាក់ ស្បែកជើង ឥវ៉ាន់ទូទៅ (១ - ៣គីឡូ)',
    weightEquivalentKg: 2.5,
    dimensionsEn: 'Up to 35 × 25 × 15 cm',
    dimensionsKm: 'រហូតដល់ ៣៥ × ២៥ × ១៥ ស.ម',
    icon: '📦',
  },
  {
    id: 'large',
    labelEn: 'Medium Carton',
    labelKm: 'កេសកាតុងមធ្យម',
    subEn: 'Kitchenware, dry groceries, bulk gifts (3 - 8kg)',
    subKm: 'សម្ភារៈផ្ទះបាយ គ្រឿងទេស កាដូធំ (៣ - ៨គីឡូ)',
    weightEquivalentKg: 5.5,
    dimensionsEn: 'Up to 45 × 35 × 25 cm',
    dimensionsKm: 'រហូតដល់ ៤៥ × ៣៥ × ២៥ ស.ម',
    icon: '📦',
  },
  {
    id: 'xlarge',
    labelEn: 'Large Box',
    labelKm: 'កេសធំ / គ្រឿងអគ្គិសនី',
    subEn: 'Electronics, appliances, bulky parcels (8 - 20kg)',
    subKm: 'កង្ហារ ឆ្នាំងដាំបាយ ឥវ៉ាន់ធ្ងន់ (៨ - ២០គីឡូ)',
    weightEquivalentKg: 12.0,
    dimensionsEn: 'Up to 60 × 45 × 35 cm',
    dimensionsKm: 'រហូតដល់ ៦០ × ៤៥ × ៣៥ ស.ម',
    icon: '🧳',
  },
  {
    id: 'bulk',
    labelEn: 'Bulk / Commercial',
    labelKm: 'ឥវ៉ាន់ដុំពាណិជ្ជកម្ម',
    subEn: 'Wholesale sacks, machinery parts (20 - 50kg)',
    subKm: 'បាវទំនិញ គ្រឿងម៉ាស៊ីន ឥវ៉ាន់ដុំ (២០ - ៥០គីឡូ)',
    weightEquivalentKg: 30.0,
    dimensionsEn: 'Over 60 cm (Heavy)',
    dimensionsKm: 'លើសពី ៦០ ស.ម (ទម្ងន់ធ្ងន់)',
    icon: '🏗️',
  },
];

const POPULAR_ROUTES = [
  { fromId: 'phnom-penh', toId: 'siem-reap', labelEn: 'Phnom Penh ➔ Siem Reap', labelKm: 'ភ្នំពេញ ➔ សៀមរាប' },
  { fromId: 'phnom-penh', toId: 'battambang', labelEn: 'Phnom Penh ➔ Battambang', labelKm: 'ភ្នំពេញ ➔ បាត់ដំបង' },
  { fromId: 'phnom-penh', toId: 'sihanoukville', labelEn: 'Phnom Penh ➔ Sihanoukville', labelKm: 'ភ្នំពេញ ➔ ព្រះសីហនុ' },
  { fromId: 'phnom-penh', toId: 'kampot', labelEn: 'Phnom Penh ➔ Kampot', labelKm: 'ភ្នំពេញ ➔ កំពត' },
  { fromId: 'siem-reap', toId: 'phnom-penh', labelEn: 'Siem Reap ➔ Phnom Penh', labelKm: 'សៀមរាប ➔ ភ្នំពេញ' },
];

export const HomeShippingCalculator: React.FC<HomeShippingCalculatorProps> = ({
  language,
  currency,
  onNavigateTab,
  onNotify,
  className = '',
}) => {
  const isKm = language === 'km';

  // Province and Size state
  const [originId, setOriginId] = useState<string>('phnom-penh');
  const [destinationId, setDestinationId] = useState<string>('siem-reap');
  const [selectedSizeTier, setSelectedSizeTier] = useState<PackageSizeTier>('medium');
  const [selectedCarrierQuoteId, setSelectedCarrierQuoteId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>(getSavedAddresses);

  useEffect(() => {
    const handleUpdate = () => setSavedAddresses(getSavedAddresses());
    window.addEventListener(SAVED_ADDRESSES_EVENT, handleUpdate);
    return () => window.removeEventListener(SAVED_ADDRESSES_EVENT, handleUpdate);
  }, []);

  // Selected size metadata
  const currentSizeOption = useMemo(() => {
    return PACKAGE_SIZE_OPTIONS.find((s) => s.id === selectedSizeTier) || PACKAGE_SIZE_OPTIONS[1];
  }, [selectedSizeTier]);

  // Real-time quotes from Cambodian carriers
  const quotesData = useMemo(() => {
    return calculateCourierQuotes(originId, destinationId, currentSizeOption.weightEquivalentKg);
  }, [originId, destinationId, currentSizeOption.weightEquivalentKg]);

  const originProvince = useMemo(() => {
    return CAMBODIA_PROVINCES.find((p) => p.id === originId) || CAMBODIA_PROVINCES[0];
  }, [originId]);

  const destinationProvince = useMemo(() => {
    return CAMBODIA_PROVINCES.find((p) => p.id === destinationId) || CAMBODIA_PROVINCES[1];
  }, [destinationId]);

  const handleSwap = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
  };

  const formatPrice = (khr: number, usd: number) => {
    if (currency === 'KHR') {
      return `${khr.toLocaleString()} ៛`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const handleBookNow = (quote: any) => {
    if (onNotify) {
      onNotify(
        isKm
          ? `បានជ្រើសរើសសេវា ${quote.carrierNameKm} តម្លៃ ${formatPrice(quote.priceKHR, quote.priceUSD)}! កំពុងផ្ទេរទៅទំព័រកក់...`
          : `Selected ${quote.carrierName} for ${formatPrice(quote.priceKHR, quote.priceUSD)}! Navigating to booking...`
      );
    }
    onNavigateTab('courier');
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden ${className}`}>
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base sm:text-lg text-white">
                {isKm ? 'គណនាតម្លៃផ្ញើឥវ៉ាន់ ២៥ ខេត្ត-ក្រុង' : 'Instant Shipping Cost Calculator'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-2xs">
                {isKm ? 'ថ្លៃផ្ទាល់ 0% កម្រៃ' : '0% Commission'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {isKm
                ? 'ជ្រើសរើសខេត្តផ្ញើ/ទទួល និងទំហំកញ្ចប់ ដើម្បីទទួលបានតម្លៃដឹកជញ្ជូនច្បាស់លាស់ និងតម្លាភាពភ្លាមៗ'
                : 'Select origin & destination provinces and package size for instant, transparent courier quotes'}
            </p>
          </div>
        </div>

        {/* 0% Commission Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-rose-200 shrink-0 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">
            {isKm ? 'គ្មានការកាត់កម្រៃជើងសារ' : 'No Middleman Surcharge'}
          </span>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Step 1: Origin & Destination Selector with Swap */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            {isKm ? '១. ជ្រើសរើសផ្លូវដឹកជញ្ជូន (Origin & Destination)' : '1. Select Delivery Route (25 Provinces)'}
          </label>

          {/* Quick Autofill from Saved Addresses */}
          {savedAddresses.length > 0 && (
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-slate-50 to-amber-50/50 border border-slate-200 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>{isKm ? 'បំពេញរហ័សពីអាសយដ្ឋានរក្សាទុក៖' : 'Autofill from Saved:'}</span>
              </span>

              {savedAddresses.map((addr) => (
                <div key={addr.id} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1 text-[11px] shadow-2xs">
                  <span className="font-extrabold text-slate-800">
                    {isKm ? addr.labelKm : addr.label}
                  </span>
                  <span className="text-[10px] text-slate-400">({isKm ? addr.provinceNameKm : addr.provinceName})</span>
                  <div className="flex items-center gap-1 ml-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOriginId(addr.provinceId);
                        if (onNotify) {
                          onNotify(
                            isKm
                              ? `បានកំណត់ទីតាំងផ្ញើចេញ: ${addr.provinceNameKm} (${addr.labelKm})`
                              : `Set Origin to ${addr.provinceName} (${addr.label})`
                          );
                        }
                      }}
                      className="px-1.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-[10px] transition cursor-pointer"
                      title={isKm ? 'កំណត់ជាទីតាំងផ្ញើចេញ' : 'Set as Origin'}
                    >
                      {isKm ? 'ផ្ញើចេញ' : 'From'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDestinationId(addr.provinceId);
                        if (onNotify) {
                          onNotify(
                            isKm
                              ? `បានកំណត់ទីតាំងទទួល: ${addr.provinceNameKm} (${addr.labelKm})`
                              : `Set Destination to ${addr.provinceName} (${addr.label})`
                          );
                        }
                      }}
                      className="px-1.5 py-0.5 rounded-md bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-[10px] transition cursor-pointer"
                      title={isKm ? 'កំណត់ជាទីតាំងទទួល' : 'Set as Destination'}
                    >
                      {isKm ? 'ទទួល' : 'To'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* Origin Select */}
            <div className="md:col-span-5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{isKm ? 'ខេត្ត-ក្រុង ផ្ញើចេញ (Shipping From)' : 'Origin Province'}</span>
              </span>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                {CAMBODIA_PROVINCES.map((p) => (
                  <option key={`orig-${p.id}`} value={p.id}>
                    {isKm ? p.nameKm : p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                className="p-2.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 shadow-xs transition cursor-pointer"
                title={isKm ? 'ប្តូរទិសដៅ' : 'Swap Origin & Destination'}
              >
                <ArrowRightLeft className="w-4 h-4 rotate-90 md:rotate-0" />
              </button>
            </div>

            {/* Destination Select */}
            <div className="md:col-span-5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>{isKm ? 'ខេត្ត-ក្រុង ទទួល (Shipping To)' : 'Destination Province'}</span>
              </span>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                {CAMBODIA_PROVINCES.map((p) => (
                  <option key={`dest-${p.id}`} value={p.id}>
                    {isKm ? p.nameKm : p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Route Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">
              {isKm ? 'ផ្លូវពេញនិយម៖' : 'Popular Routes:'}
            </span>
            {POPULAR_ROUTES.map((route, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOriginId(route.fromId);
                  setDestinationId(route.toId);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  originId === route.fromId && destinationId === route.toId
                    ? 'bg-rose-600 text-white font-bold border-rose-600 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {isKm ? route.labelKm : route.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Package Size Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{isKm ? '២. ជ្រើសរើសទំហំ និងទម្ងន់កញ្ចប់ (Package Size)' : '2. Select Package Size Tier'}</span>
            </label>
            <span className="text-xs font-mono font-bold text-slate-500">
              ~{currentSizeOption.weightEquivalentKg} kg ({currentSizeOption.dimensionsEn})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {PACKAGE_SIZE_OPTIONS.map((size) => {
              const isSelected = selectedSizeTier === size.id;
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setSelectedSizeTier(size.id)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xl">{size.icon}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                      {isKm ? size.labelKm : size.labelEn}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1 leading-snug">
                      {isKm ? size.subKm : size.subEn}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100/80 text-[10px] text-emerald-700 font-bold">
                    {size.dimensionsEn}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Instant Transparent Shipping Quotes Results */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-rose-600" />
                <span>
                  {isKm
                    ? `តម្លៃដឹកជញ្ជូនជាក់ស្តែង (${originProvince.nameKm} ➔ ${destinationProvince.nameKm})`
                    : `Instant Transparent Quotes (${originProvince.name} ➔ ${destinationProvince.name})`}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                {isKm
                  ? 'តម្លៃរួមបញ្ចូលទាំងថ្លៃសាំង និងថ្លៃដឹកជញ្ជូន គ្មានការលួចដំឡើងថ្លៃកម្រៃជើងសារ'
                  : 'Guaranteed 100% transparent rates from Cambodia logistics operators'}
              </p>
            </div>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
              {quotesData.quotes.length} {isKm ? 'ជម្រើសសេវា' : 'Active Carriers'}
            </span>
          </div>

          {/* Quotes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quotesData.quotes.map((quote) => {
              const isSelected = selectedCarrierQuoteId === quote.carrierId;
              const formattedFare = formatPrice(quote.priceKHR, quote.priceUSD);

              return (
                <div
                  key={quote.carrierId}
                  onClick={() => setSelectedCarrierQuoteId(quote.carrierId)}
                  className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50/70 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Carrier Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-2xs"
                          style={{ backgroundColor: quote.brandColor }}
                        >
                          {quote.carrierId.slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                            {isKm ? quote.carrierNameKm : quote.carrierName}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {isKm ? quote.serviceTypeKm : quote.serviceType}
                          </span>
                        </div>
                      </div>

                      {quote.carrierId === 'cam-van-express' && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {isKm ? 'ពេញនិយម' : 'Best Value'}
                        </span>
                      )}
                    </div>

                    {/* ETA & Delivery Method */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isKm ? quote.estimatedTransitTimeKm : quote.estimatedTransitTime}</span>
                      </span>
                      <span>•</span>
                      <span>{isKm ? quote.deliveryMethodKm : quote.deliveryMethod}</span>
                    </div>

                    {/* Transparent Cost Breakdown */}
                    <div className="text-[11px] space-y-1 text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span>{isKm ? 'ថ្លៃគោលផ្លូវខេត្ត៖' : 'Base Route Fare:'}</span>
                        <span className="font-mono text-slate-700 font-bold">
                          {formatPrice(quote.priceKHR - 1000, Number(((quote.priceKHR - 1000) / 4100).toFixed(2)))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{isKm ? 'ទំហំកញ្ចប់ (' + currentSizeOption.labelKm + ')៖' : 'Package Size Factor:'}</span>
                        <span className="font-mono text-slate-700 font-bold">
                          +{formatPrice(1000, 0.25)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-700 font-bold">
                        <span>{isKm ? 'កម្រៃជើងសារ CamDelivery៖' : 'Platform Markup Fee:'}</span>
                        <span>{formatPrice(0, 0)} (0%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">
                        {isKm ? 'តម្លៃសរុប' : 'Total Quote'}
                      </span>
                      <span className="font-mono font-black text-lg text-slate-900">
                        {formattedFare}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookNow(quote);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 active:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>{isKm ? 'កក់ឥឡូវ' : 'Book Now'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reassurance Footer */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isKm
                ? 'តម្លៃទាំងអស់ខាងលើគឺសុទ្ធសាធ និងបង់ត្រង់ជូនអ្នកដឹកជញ្ជូន គ្មានការកាត់កម្រៃជើងសារ ២០% ឡើយ'
                : 'All quotes above are 100% transparent & settled directly to couriers with zero commission deducted'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('courier')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 shrink-0 cursor-pointer underline underline-offset-2"
          >
            <span>{isKm ? 'ប្រៀបធៀបគ្រប់ក្រុមហ៊ុនទាំងអស់' : 'View Full Carrier Matrix'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
