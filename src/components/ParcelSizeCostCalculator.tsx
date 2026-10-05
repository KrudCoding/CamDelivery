import React, { useState, useMemo } from 'react';
import {
  Package,
  Calculator,
  ArrowRightLeft,
  Truck,
  MapPin,
  Clock,
  Sparkles,
  Info,
  Layers,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Box,
  Scale,
  Maximize2,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Language, Currency } from '../types';
import { CAMBODIA_PROVINCES } from '../data/carriers';

interface ParcelSizeCostCalculatorProps {
  language: Language;
  currency: Currency;
  onNavigateTab: (tabId: 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
  onNotify?: (message: string) => void;
}

export interface ParcelSizePreset {
  id: string;
  nameEn: string;
  nameKm: string;
  descEn: string;
  descKm: string;
  maxWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  icon: string;
  popularForEn: string;
  popularForKm: string;
  badgeEn?: string;
  badgeKm?: string;
}

const PARCEL_SIZE_PRESETS: ParcelSizePreset[] = [
  {
    id: 'envelope',
    nameEn: 'Document / Envelope',
    nameKm: 'ស្រោមសំបុត្រ / ឯកសារ (XS)',
    descEn: 'Contracts, passports, letters, SIM cards or small jewellery (<0.5 kg)',
    descKm: 'កិច្ចសន្យា លិខិតឆ្លងដែន ស៊ីមកាត ឬគ្រឿងអលង្ការតូចៗ (< ០.៥ គីឡូ)',
    maxWeightKg: 0.5,
    lengthCm: 28,
    widthCm: 20,
    heightCm: 3,
    icon: 'mail',
    popularForEn: 'Official Documents, Certificates',
    popularForKm: 'ឯកសារផ្លូវការ ប័ណ្ណបើកបរ',
  },
  {
    id: 'small_box',
    nameEn: 'Small Box (Shoebox)',
    nameKm: 'ប្រអប់តូច (S)',
    descEn: 'Cosmetics, t-shirts, sneakers, mobile phones & chargers (<2 kg)',
    descKm: 'គ្រឿងសម្អាង អាវយឺត ស្បែកជើង ទូរស័ព្ទដៃ (< ២ គីឡូ)',
    maxWeightKg: 2,
    lengthCm: 32,
    widthCm: 22,
    heightCm: 14,
    icon: 'box-small',
    popularForEn: 'Online Clothing, Electronics',
    popularForKm: 'ខោអាវអនឡាញ គ្រឿងអេឡិចត្រូនិក',
    badgeEn: 'Most Popular',
    badgeKm: 'ពេញនិយមបំផុត',
  },
  {
    id: 'medium_box',
    nameEn: 'Medium Box (Carton)',
    nameKm: 'ប្រអប់មធ្យម (M)',
    descEn: 'Multiple clothing items, dry snacks, kitchenware, handbags (<5 kg)',
    descKm: 'សម្លៀកបំពាក់ច្រើនឈុត នំចំណីស្ងួត កាបូប (< ៥ គីឡូ)',
    maxWeightKg: 5,
    lengthCm: 42,
    widthCm: 32,
    heightCm: 25,
    icon: 'box-medium',
    popularForEn: 'Family Care Packages, Gifts',
    popularForKm: 'អំណោយគ្រួសារ ឥវ៉ាន់ផ្ញើទៅស្រុក',
  },
  {
    id: 'large_box',
    nameEn: 'Large Carton',
    nameKm: 'ប្រអប់ធំ (L)',
    descEn: 'Microwave, fan, desktop computers, bulk e-commerce cartons (<15 kg)',
    descKm: 'កង្ហារ ម៉ាស៊ីនក្រឡុក ឥវ៉ាន់លក់ដុំ (< ១៥ គីឡូ)',
    maxWeightKg: 15,
    lengthCm: 55,
    widthCm: 45,
    heightCm: 38,
    icon: 'box-large',
    popularForEn: 'Home Appliances, Bulk Stock',
    popularForKm: 'គ្រឿងបរិក្ខារផ្ទះបាយ ទំនិញដុំ',
  },
  {
    id: 'bulky_freight',
    nameEn: 'Bulky / Rice Sack / Freight',
    nameKm: 'បាវស្រូវអង្ករ / ធុនធ្ងន់ (XL)',
    descEn: 'Sack of rice (50kg), motorcycle parts, farm harvests, furniture (<40 kg)',
    descKm: 'បាវអង្ករ (៥០ គីឡូ) គ្រឿងបន្លាស់ម៉ូតូ កសិផល (< ៤០ គីឡូ)',
    maxWeightKg: 40,
    lengthCm: 75,
    widthCm: 50,
    heightCm: 45,
    icon: 'truck',
    popularForEn: 'Agricultural Harvest, Wholesale Sacks',
    popularForKm: 'កសិផលស្រុកស្រែ បាវអង្ករធំៗ',
    badgeEn: 'Heavy Duty',
    badgeKm: 'ទំនិញធុនធ្ងន់',
  },
  {
    id: 'custom',
    nameEn: 'Custom Dimensions',
    nameKm: 'កំណត់ទំហំផ្ទាល់ខ្លួន',
    descEn: 'Enter exact length, width, height, and actual weight manually',
    descKm: 'បញ្ចូលប្រវែង ទទឹង កម្ពស់ និងទម្ងន់ជាក់ស្តែងដោយខ្លួនឯង',
    maxWeightKg: 10,
    lengthCm: 35,
    widthCm: 25,
    heightCm: 20,
    icon: 'sliders',
    popularForEn: 'Irregular Shaped Parcels',
    popularForKm: 'ឥវ៉ាន់រាងមិនស្តង់ដារ',
  },
];

// Highway road distances in km from Phnom Penh
const PROVINCE_DISTANCES_FROM_PP: Record<string, number> = {
  'phnom-penh': 0,
  'kandal': 25,
  'kampong-speu': 48,
  'takeo': 78,
  'kampong-chhnang': 91,
  'prey-veng': 92,
  'svay-rieng': 122,
  'kampong-cham': 124,
  'kep': 135,
  'kampot': 148,
  'tboung-khmum': 155,
  'kampong-thom': 168,
  'pursat': 189,
  'sihanoukville': 190, // PP-SHV Expressway route
  'kratie': 245,
  'koh-kong': 280,
  'battambang': 290,
  'preah-vihear': 300,
  'siem-reap': 314,
  'banteay-meanchey': 360,
  'pailin': 370,
  'mondulkiri': 375,
  'stung-treng': 380,
  'oddar-meanchey': 430,
  'ratanakiri': 588,
};

function getCalculatedDistanceKm(fromId: string, toId: string): number {
  if (fromId === toId) return 15; // Same province intra-district baseline
  const dFromPP = PROVINCE_DISTANCES_FROM_PP[fromId] ?? 150;
  const dToPP = PROVINCE_DISTANCES_FROM_PP[toId] ?? 150;

  if (fromId === 'phnom-penh') return dToPP;
  if (toId === 'phnom-penh') return dFromPP;

  const diff = Math.abs(dFromPP - dToPP);
  const sum = dFromPP + dToPP;
  if ((dFromPP > 150 && dToPP > 150) || (dFromPP < 150 && dToPP < 150)) {
    return Math.max(35, Math.round(diff * 1.05));
  }
  return Math.max(45, Math.round(sum * 0.72));
}

// Popular quick routes
const POPULAR_ROUTES = [
  { fromId: 'phnom-penh', toId: 'siem-reap', label: 'PP ⇄ Siem Reap' },
  { fromId: 'phnom-penh', toId: 'battambang', label: 'PP ⇄ Battambang' },
  { fromId: 'phnom-penh', toId: 'sihanoukville', label: 'PP ⇄ Sihanoukville' },
  { fromId: 'phnom-penh', toId: 'kampong-cham', label: 'PP ⇄ Kampong Cham' },
  { fromId: 'phnom-penh', toId: 'kampot', label: 'PP ⇄ Kampot' },
  { fromId: 'battambang', toId: 'siem-reap', label: 'Battambang ⇄ Siem Reap' },
];

export const ParcelSizeCostCalculator: React.FC<ParcelSizeCostCalculatorProps> = ({
  language,
  currency,
  onNavigateTab,
  onNotify,
}) => {
  const isKm = language === 'km';

  // Selected route state
  const [fromProvinceId, setFromProvinceId] = useState<string>('phnom-penh');
  const [toProvinceId, setToProvinceId] = useState<string>('siem-reap');

  // Selected size preset state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('small_box');

  // Dimensions & Weight states
  const [lengthCm, setLengthCm] = useState<number>(32);
  const [widthCm, setWidthCm] = useState<number>(22);
  const [heightCm, setHeightCm] = useState<number>(14);
  const [actualWeightKg, setActualWeightKg] = useState<number>(1.8);

  // Pick up & handling options
  const [pickupType, setPickupType] = useState<'depot_dropoff' | 'door_pickup'>('depot_dropoff');
  const [isFragile, setIsFragile] = useState<boolean>(false);

  // When preset changes, update default dimensions & weights
  const handleSelectPreset = (preset: ParcelSizePreset) => {
    setSelectedPresetId(preset.id);
    if (preset.id !== 'custom') {
      setLengthCm(preset.lengthCm);
      setWidthCm(preset.widthCm);
      setHeightCm(preset.heightCm);
      setActualWeightKg(preset.maxWeightKg * 0.75); // realistic average
    }
  };

  // Swap Route
  const handleSwapRoute = () => {
    const temp = fromProvinceId;
    setFromProvinceId(toProvinceId);
    setToProvinceId(temp);
  };

  // Distance calculation
  const distanceKm = useMemo(() => {
    return getCalculatedDistanceKm(fromProvinceId, toProvinceId);
  }, [fromProvinceId, toProvinceId]);

  // Volumetric weight calculation: (L * W * H) / 5000 (Industry Standard)
  const volumetricWeightKg = useMemo(() => {
    const vol = (lengthCm * widthCm * heightCm) / 5000;
    return Number(vol.toFixed(2));
  }, [lengthCm, widthCm, heightCm]);

  // Billable (chargeable) weight is the greater of actual vs volumetric
  const billableWeightKg = useMemo(() => {
    return Number(Math.max(actualWeightKg, volumetricWeightKg).toFixed(2));
  }, [actualWeightKg, volumetricWeightKg]);

  const isVolumetricHigher = volumetricWeightKg > actualWeightKg;

  // Origin & Destination names
  const fromProvince = CAMBODIA_PROVINCES.find((p) => p.id === fromProvinceId);
  const toProvince = CAMBODIA_PROVINCES.find((p) => p.id === toProvinceId);

  // ESTIMATED COST RANGE CALCULATOR
  // We calculate realistic cost ranges based on:
  // - Billable Weight (kg)
  // - Road Distance (km)
  // - Service Tier:
  //    1. Interprovincial Van Depot-to-Depot (budget baseline)
  //    2. Door-to-Door Courier (standard convenience)
  //    3. Priority Next-Morning Express (speed)
  //    4. Bulk Heavy Freight (heavy loads)
  const costEstimates = useMemo(() => {
    const w = billableWeightKg;
    const d = distanceKm;

    // Base formula components:
    // Distance factor: short (<100km), medium (100-300km), long (>300km)
    const distanceCostKHR = Math.round(d * 12);
    const weightCostKHR = Math.round(w * 800);
    const fragileFeeKHR = isFragile ? 2000 : 0;
    const doorPickupFeeKHR = pickupType === 'door_pickup' ? 3000 : 0;

    // 1. Van Depot-to-Depot (Budget)
    const vanBaseKHR = 3500;
    const vanMinKHR = Math.max(3500, Math.round(vanBaseKHR + distanceCostKHR * 0.7 + weightCostKHR * 0.75 + fragileFeeKHR + doorPickupFeeKHR));
    const vanMaxKHR = Math.round(vanMinKHR * 1.35);

    // 2. Door-to-Door Standard
    const doorBaseKHR = 5500;
    const doorMinKHR = Math.max(5500, Math.round(doorBaseKHR + distanceCostKHR * 0.95 + weightCostKHR * 1.05 + fragileFeeKHR + doorPickupFeeKHR));
    const doorMaxKHR = Math.round(doorMinKHR * 1.3);

    // 3. Priority Morning Express
    const priorityBaseKHR = 8500;
    const priorityMinKHR = Math.max(8500, Math.round(priorityBaseKHR + distanceCostKHR * 1.25 + weightCostKHR * 1.35 + fragileFeeKHR + doorPickupFeeKHR));
    const priorityMaxKHR = Math.round(priorityMinKHR * 1.3);

    // Overall aggregate range for summary display
    const overallMinKHR = vanMinKHR;
    const overallMaxKHR = doorMaxKHR;

    return {
      overallMinKHR,
      overallMaxKHR,
      overallMinUSD: Number((overallMinKHR / 4000).toFixed(2)),
      overallMaxUSD: Number((overallMaxKHR / 4000).toFixed(2)),
      tiers: [
        {
          id: 'van',
          nameEn: 'Interprovincial Van Depot',
          nameKm: 'ឡានវ៉ែនអន្តរខេត្ត (ស្ថានីយទៅស្ថានីយ)',
          descEn: 'Departs every 2h • Depot drop & collection',
          descKm: 'ចេញរៀងរាល់ ២ ម៉ោង • ផ្ញើនៅស្ថានីយ',
          minKHR: vanMinKHR,
          maxKHR: vanMaxKHR,
          minUSD: Number((vanMinKHR / 4000).toFixed(2)),
          maxUSD: Number((vanMaxKHR / 4000).toFixed(2)),
          transitTimeEn: distanceKm < 150 ? '2 - 4 hours' : distanceKm < 350 ? '4 - 6 hours' : '6 - 9 hours',
          transitTimeKm: distanceKm < 150 ? '២ - ៤ ម៉ោង' : distanceKm < 350 ? '៤ - ៦ ម៉ោង' : '៦ - ៩ ម៉ោង',
          badgeEn: 'Best Value',
          badgeKm: 'សន្សំសំចៃបំផុត',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          color: 'blue',
        },
        {
          id: 'door',
          nameEn: 'Door-to-Door Courier',
          nameKm: 'ដឹកដល់មាត់ទ្វារផ្ទះ',
          descEn: 'Door pickup & direct recipient doorstep delivery',
          descKm: 'មកយកដល់ផ្ទះ និងដឹកជូនដល់ដៃអ្នកទទួល',
          minKHR: doorMinKHR,
          maxKHR: doorMaxKHR,
          minUSD: Number((doorMinKHR / 4000).toFixed(2)),
          maxUSD: Number((doorMaxKHR / 4000).toFixed(2)),
          transitTimeEn: '12 - 24 hours',
          transitTimeKm: '១២ - ២៤ ម៉ោង',
          badgeEn: 'Most Convenient',
          badgeKm: 'ស្រួលបំផុត',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          color: 'emerald',
        },
        {
          id: 'priority',
          nameEn: 'Priority Next-Morning Express',
          nameKm: 'បញ្ញើអាទិភាពព្រឹកស្អែក',
          descEn: 'Guaranteed delivery before 10:30 AM next day',
          descKm: 'មកដល់មុនម៉ោង ១០:៣០ ព្រឹកស្អែក',
          minKHR: priorityMinKHR,
          maxKHR: priorityMaxKHR,
          minUSD: Number((priorityMinKHR / 4000).toFixed(2)),
          maxUSD: Number((priorityMaxKHR / 4000).toFixed(2)),
          transitTimeEn: 'Next morning',
          transitTimeKm: 'ព្រឹកស្អែក',
          badgeEn: 'Fastest',
          badgeKm: 'លឿនរហ័ស',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          color: 'amber',
        },
      ],
    };
  }, [billableWeightKg, distanceKm, isFragile, pickupType]);

  return (
    <div className="bg-white rounded-3xl p-5 md:p-7 border border-slate-200 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {isKm ? 'ម៉ាស៊ីនគណនាទំហំកញ្ចប់ & តម្លៃដឹកជញ្ជូនប៉ាន់ស្មាន' : 'Parcel Size & Delivery Cost Calculator'}
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {isKm ? 'គិតតាមទម្ងន់ & ចម្ងាយ' : 'Weight & Distance'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKm
                ? 'ប៉ាន់ស្មានតម្លៃដឹកជញ្ជូនជាចន្លោះ (Min ~ Max) ផ្អែកលើទំហំកញ្ចប់ ទម្ងន់ជាក់ស្តែង និងចម្ងាយផ្លូវ ២៥ ខេត្ត-ក្រុង'
                : 'Get transparent estimated cost ranges based on parcel dimensions, weight, and road distance'}
            </p>
          </div>
        </div>

        {/* Currency & Commission Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>0% Platform Commission</span>
          </span>
        </div>
      </div>

      {/* STEP 1: ROUTE SELECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
            <span>{isKm ? 'ជ្រើសរើសផ្លូវដឹកជញ្ជូន (ខេត្តដើម ➔ ខេត្តគោលដៅ)' : 'Select Delivery Route (Origin ➔ Destination)'}</span>
          </label>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
            {distanceKm} km {isKm ? 'ចម្ងាយផ្លូវជាតិ' : 'highway distance'}
          </span>
        </div>

        {/* Route Selectors with Swap Button */}
        <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 items-center">
          {/* Origin Province */}
          <div className="sm:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus-within:border-emerald-500 focus-within:bg-white transition">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              {isKm ? 'ផ្ញើចេញពី (Origin)' : 'Ship From (Origin)'}
            </span>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <select
                value={fromProvinceId}
                onChange={(e) => setFromProvinceId(e.target.value)}
                className="w-full bg-transparent font-bold text-xs sm:text-sm text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {CAMBODIA_PROVINCES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isKm ? p.nameKm : p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="sm:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwapRoute}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 flex items-center justify-center transition shadow-2xs group"
              title={isKm ? 'ប្តូរទិសដៅទៅវិញទៅមក' : 'Swap Origin & Destination'}
            >
              <ArrowRightLeft className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* Destination Province */}
          <div className="sm:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus-within:border-emerald-500 focus-within:bg-white transition">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              {isKm ? 'ដឹកជញ្ជូនទៅកាន់ (Destination)' : 'Deliver To (Destination)'}
            </span>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <select
                value={toProvinceId}
                onChange={(e) => setToProvinceId(e.target.value)}
                className="w-full bg-transparent font-bold text-xs sm:text-sm text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {CAMBODIA_PROVINCES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isKm ? p.nameKm : p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Popular Quick Route Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">
            {isKm ? 'ផ្លូវពេញនិយម៖' : 'Quick routes:'}
          </span>
          {POPULAR_ROUTES.map((route, idx) => {
            const isSelected = fromProvinceId === route.fromId && toProvinceId === route.toId;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setFromProvinceId(route.fromId);
                  setToProvinceId(route.toId);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {route.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: PARCEL SIZE PRESET SELECTION */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
            <span>{isKm ? 'ជ្រើសរើសទំហំ និងប្រភេទកញ្ចប់ឥវ៉ាន់' : 'Select Parcel Size Category & Dimensions'}</span>
          </label>
          <span className="text-[11px] text-slate-500">
            {isKm ? 'គិតគូរទម្ងន់មាឌ (Volumetric Weight)' : 'Includes Volumetric Weight Formula'}
          </span>
        </div>

        {/* Size Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PARCEL_SIZE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between relative text-left ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                {preset.badgeEn && (
                  <span className="absolute -top-2 right-2 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-600 text-white shadow-2xs">
                    {isKm ? preset.badgeKm : preset.badgeEn}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Box className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>

                  <h4 className="font-extrabold text-xs text-slate-900 mt-2 leading-tight">
                    {isKm ? preset.nameKm : preset.nameEn}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {isKm ? preset.descKm : preset.descEn}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-600">
                  {preset.id !== 'custom' ? (
                    <>
                      <div>≤ {preset.maxWeightKg} kg</div>
                      <div className="text-slate-400 font-mono text-[9px]">{preset.lengthCm}×{preset.widthCm}×{preset.heightCm} cm</div>
                    </>
                  ) : (
                    <div className="text-emerald-700">{isKm ? 'កំណត់ដោយដៃ' : 'Custom edit'}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Dimensions & Weight Sliders / Inputs */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{isKm ? 'កែសម្រួលទំហំវិមាត្រ (ប្រវែង × ទទឹង × កម្ពស់) & ទម្ងន់' : 'Adjust Dimensions & Actual Weight'}</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {isKm ? 'រូបមន្តស្តង់ដារឡូជីស្ទិក៖ (L × W × H) ÷ 5000' : 'Logistics standard divisor: (L × W × H) ÷ 5000'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Length */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>{isKm ? 'បណ្តោយ (L)' : 'Length (L)'}</span>
                <span className="font-mono font-bold text-slate-900">{lengthCm} cm</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                value={lengthCm}
                onChange={(e) => {
                  setLengthCm(Number(e.target.value));
                  setSelectedPresetId('custom');
                }}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Width */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>{isKm ? 'ទទឹង (W)' : 'Width (W)'}</span>
                <span className="font-mono font-bold text-slate-900">{widthCm} cm</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={widthCm}
                onChange={(e) => {
                  setWidthCm(Number(e.target.value));
                  setSelectedPresetId('custom');
                }}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Height */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>{isKm ? 'កម្ពស់ (H)' : 'Height (H)'}</span>
                <span className="font-mono font-bold text-slate-900">{heightCm} cm</span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                value={heightCm}
                onChange={(e) => {
                  setHeightCm(Number(e.target.value));
                  setSelectedPresetId('custom');
                }}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Actual Weight */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1">
                  <Scale className="w-3 h-3 text-slate-400" />
                  <span>{isKm ? 'ទម្ងន់ពិត' : 'Actual Wt'}</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{actualWeightKg} kg</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="60"
                step="0.2"
                value={actualWeightKg}
                onChange={(e) => {
                  setActualWeightKg(Number(e.target.value));
                  setSelectedPresetId('custom');
                }}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Volumetric Weight vs Actual Weight Comparison Card */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <Scale className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    {isKm ? 'ទម្ងន់គិតថ្លៃសរុប (Chargeable Weight):' : 'Chargeable Billable Weight:'}
                  </span>
                  <span className="text-sm font-black text-emerald-700 font-mono bg-emerald-100 px-2 py-0.5 rounded-md">
                    {billableWeightKg} kg
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                  <span>{isKm ? 'ទម្ងន់ជាក់ស្តែង៖' : 'Actual Weight:'} <strong className="text-slate-700 font-mono">{actualWeightKg} kg</strong></span>
                  <span>•</span>
                  <span>{isKm ? 'ទម្ងន់មាឌ (Volumetric):' : 'Volumetric Weight:'} <strong className="text-slate-700 font-mono">{volumetricWeightKg} kg</strong></span>
                  {isVolumetricHigher && (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md font-bold text-[10px]">
                      {isKm ? 'គិតតាមទំហំមាឌ' : 'Charged by Volume (Bulky)'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Handling Flags */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFragile(!isFragile)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                  isFragile
                    ? 'bg-rose-50 border-rose-400 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isKm ? 'ទំនិញងាយបែក (+២,០០០៛)' : 'Fragile (+2,000៛)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3: ESTIMATED DELIVERY COST RANGE DISPLAY */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
            <span>{isKm ? 'តម្លៃដឹកជញ្ជូនប៉ាន់ស្មាន (Estimated Cost Range)' : 'Estimated Delivery Cost Range'}</span>
          </label>

          <span className="text-[11px] font-semibold text-slate-500">
            {fromProvince?.name} ➔ {toProvince?.name} ({distanceKm} km)
          </span>
        </div>

        {/* Highlighted Master Cost Range Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 md:p-6 shadow-lg border border-slate-700 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                {isKm ? 'ចន្លោះតម្លៃដឹកជញ្ជូនប៉ាន់ស្មានសរុប' : 'Estimated Total Delivery Cost Range'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  {currency === 'KHR'
                    ? `${costEstimates.overallMinKHR.toLocaleString()} ~ ${costEstimates.overallMaxKHR.toLocaleString()} ៛`
                    : `$${costEstimates.overallMinUSD.toFixed(2)} ~ $${costEstimates.overallMaxUSD.toFixed(2)} USD`}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {currency === 'KHR'
                    ? `($${costEstimates.overallMinUSD.toFixed(2)} ~ $${costEstimates.overallMaxUSD.toFixed(2)})`
                    : `(${costEstimates.overallMinKHR.toLocaleString()} ~ ${costEstimates.overallMaxKHR.toLocaleString()} ៛)`}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 flex items-center gap-2">
                <span>{isKm ? 'ទម្ងន់គិតថ្លៃ៖' : 'Billable Wt:'} <strong>{billableWeightKg} kg</strong></span>
                <span>•</span>
                <span>{isKm ? 'ចម្ងាយ៖' : 'Distance:'} <strong>{distanceKm} km</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{isKm ? '០% កាត់ជើងសារ' : '0% Commission'}</span>
              </p>
            </div>

            {/* Fast Action CTA */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab('courier')}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs md:text-sm font-black shadow-lg shadow-emerald-950/30 transition flex items-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>{isKm ? 'កក់សេវាដឹកជញ្ជូនឥឡូវនេះ' : 'Book Delivery Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown by Transport Option */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {costEstimates.tiers.map((tier) => (
            <div
              key={tier.id}
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col justify-between shadow-2xs text-left"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${tier.badgeColor}`}>
                    {isKm ? tier.badgeKm : tier.badgeEn}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{isKm ? tier.transitTimeKm : tier.transitTimeEn}</span>
                  </div>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                  {isKm ? tier.nameKm : tier.nameEn}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isKm ? tier.descKm : tier.descEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isKm ? 'ចន្លោះតម្លៃ' : 'Cost Range'}
                  </span>
                  <span className="text-sm md:text-base font-black text-slate-900 font-mono">
                    {currency === 'KHR'
                      ? `${tier.minKHR.toLocaleString()} ~ ${tier.maxKHR.toLocaleString()} ៛`
                      : `$${tier.minUSD.toFixed(2)} ~ $${tier.maxUSD.toFixed(2)}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab('courier')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                >
                  <span>{isKm ? 'ជ្រើស' : 'Select'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Transparent Cost Range Factors Explainer */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-700">
              {isKm ? 'ហេតុអ្វីតម្លៃមានចន្លោះ (Min ~ Max)? ' : 'Why does the cost have a range? '}
            </span>
            <span>
              {isKm
                ? 'តម្លៃប្រែប្រួលផ្អែកលើការជ្រើសរើសទីតាំង (យកឥវ៉ាន់នៅស្ថានីយ depot ឬដឹកដល់ផ្ទះ door-to-door), ពេលវេលាចេញដំណើរ, និងការធានារ៉ាប់រងទំនិញងាយបែកបាក់។'
                : 'Rates vary based on depot pickup vs direct door-to-door drop-off, departure timing, and fragile package insurance handling.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
