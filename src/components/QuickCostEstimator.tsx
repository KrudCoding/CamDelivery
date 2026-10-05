import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Scale,
  MapPin,
  Truck,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Info,
  Layers,
  HelpCircle,
  Clock,
  Compass,
  Zap,
  RotateCcw,
  Sliders,
  DollarSign,
  HeartHandshake,
  Timer,
  Gauge
} from 'lucide-react';
import { Language, Currency } from '../types';
import { CAMBODIA_PROVINCES } from '../data/carriers';

interface QuickCostEstimatorProps {
  language: Language;
  currency: Currency;
  onNavigateTab: (tabId: 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
  onNotify?: (message: string) => void;
}

export type DeliveryVehicleMode = 
  | 'interprovincial_van' 
  | 'door_courier' 
  | 'moto_express' 
  | 'rickshaw_tuktuk' 
  | 'cold_chain' 
  | 'heavy_freight';

interface VehicleOption {
  id: DeliveryVehicleMode;
  nameEn: string;
  nameKm: string;
  descEn: string;
  descKm: string;
  baseFareKHR: number;
  baseFareUSD: number;
  includedKm: number;
  includedKg: number;
  perKmRateKHR: number;
  perKgRateKHR: number;
  maxDistanceKm: number;
  maxWeightKg: number;
  // Speed & ETA benchmarking
  avgSpeedKmH: number; // Hardcoded average road speed in km/h
  handlingBufferMins: number; // Depot dispatch and pickup handling buffer in minutes
  speedLabelKm: string;
  speedLabelEn: string;
  badgeEn?: string;
  badgeKm?: string;
  badgeColor?: string;
  iconName: 'van' | 'door' | 'moto' | 'tuktuk' | 'cold' | 'truck';
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'interprovincial_van',
    nameEn: 'Interprovincial Van',
    nameKm: 'ឡានវ៉ែនអន្តរខេត្ត',
    descEn: 'Departs every 2 hours to 25 provinces. Best value for interprovincial parcels.',
    descKm: 'ចេញដំណើររៀងរាល់ ២ ម៉ោង ទៅកាន់ ២៥ ខេត្ត-ក្រុង តម្លៃសមរម្យបំផុត។',
    baseFareKHR: 4000,
    baseFareUSD: 1.0,
    includedKm: 30,
    includedKg: 1,
    perKmRateKHR: 12, // Long distance highway rate consolidation
    perKgRateKHR: 800,
    maxDistanceKm: 600,
    maxWeightKg: 40,
    avgSpeedKmH: 60, // Highway speed on NR4, NR5, NR6 & Expressways (1.0 min/km)
    handlingBufferMins: 20, // Depot consolidation buffer
    speedLabelKm: '៦០ គ.ម/ម៉ោង (ផ្លូវជាតិ)',
    speedLabelEn: '60 km/h (Highway)',
    badgeEn: 'Most Popular',
    badgeKm: 'ពេញនិយមបំផុត',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    iconName: 'van',
  },
  {
    id: 'door_courier',
    nameEn: 'Door-to-Door Courier',
    nameKm: 'ដឹកដល់មាត់ទ្វារផ្ទះ',
    descEn: 'Pickup from your address and direct delivery to recipient front door.',
    descKm: 'មកយកដល់ផ្ទះ និងដឹកជូនដល់ដៃអ្នកទទួលទូទាំងប្រទេស។',
    baseFareKHR: 5000,
    baseFareUSD: 1.25,
    includedKm: 15,
    includedKg: 1,
    perKmRateKHR: 15,
    perKgRateKHR: 1000,
    maxDistanceKm: 550,
    maxWeightKg: 30,
    avgSpeedKmH: 38, // Doorstep pickup stops & road navigation (~1.58 min/km)
    handlingBufferMins: 25,
    speedLabelKm: '៣៨ គ.ម/ម៉ោង (ដល់ផ្ទះ)',
    speedLabelEn: '38 km/h (Doorstep)',
    badgeEn: 'Full Convenience',
    badgeKm: 'ស្រួលបំផុត',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconName: 'door',
  },
  {
    id: 'moto_express',
    nameEn: 'City Moto Express',
    nameKm: 'ម៉ូតូដឹកជញ្ជូនរហ័សក្នុងក្រុង',
    descEn: 'Instant on-demand intra-city delivery within 30-45 minutes.',
    descKm: 'ដឹកភ្លាមៗក្នុងរាជធានី-ក្រុង រហ័សទាន់ចិត្តក្នុងរង្វង់ ៣០-៤៥ នាទី។',
    baseFareKHR: 2500,
    baseFareUSD: 0.62,
    includedKm: 2,
    includedKg: 1,
    perKmRateKHR: 600,
    perKgRateKHR: 500,
    maxDistanceKm: 35,
    maxWeightKg: 15,
    avgSpeedKmH: 28, // City street rush & traffic (~2.14 min/km)
    handlingBufferMins: 10,
    speedLabelKm: '២៨ គ.ម/ម៉ោង (ក្នុងក្រុង)',
    speedLabelEn: '28 km/h (City Express)',
    badgeEn: 'Fastest 45m',
    badgeKm: 'ល្បឿនលឿន ៤៥នាទី',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    iconName: 'moto',
  },
  {
    id: 'rickshaw_tuktuk',
    nameEn: 'Community Tuk-Tuk',
    nameKm: 'កង់បីឥណ្ឌាសហគមន៍',
    descEn: 'Spacious for multiple packages, bulky boxes, or fragile products.',
    descKm: 'ទូលាយ ដាក់កញ្ចប់ឥវ៉ាន់បានច្រើន ប្រអប់ធំ ឬទំនិញងាយបែកបាក់។',
    baseFareKHR: 3500,
    baseFareUSD: 0.88,
    includedKm: 3,
    includedKg: 2,
    perKmRateKHR: 750,
    perKgRateKHR: 600,
    maxDistanceKm: 45,
    maxWeightKg: 50,
    avgSpeedKmH: 22, // Moderate community speeds (~2.73 min/km)
    handlingBufferMins: 15,
    speedLabelKm: '២២ គ.ម/ម៉ោង (កង់បី)',
    speedLabelEn: '22 km/h (Tuk-Tuk)',
    badgeEn: 'Bulky Parcels',
    badgeKm: 'ឥវ៉ាន់ធំទូលាយ',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    iconName: 'tuktuk',
  },
  {
    id: 'cold_chain',
    nameEn: 'Cold-Chain Fresh Produce',
    nameKm: 'បញ្ញើត្រជាក់បន្លែត្រីសាច់',
    descEn: 'Refrigerated 4°C container for seafood, fresh meat, and fresh fruits.',
    descKm: 'ប្រអប់ត្រជាក់ ៤°C រក្សាភាពស្រស់បន្លែ ផ្លែឈើ និងគ្រឿងសមុទ្រ។',
    baseFareKHR: 6000,
    baseFareUSD: 1.5,
    includedKm: 25,
    includedKg: 2,
    perKmRateKHR: 18,
    perKgRateKHR: 1200,
    maxDistanceKm: 500,
    maxWeightKg: 40,
    avgSpeedKmH: 52, // Refrigerated van highway transit (~1.15 min/km)
    handlingBufferMins: 30, // Pre-chill and temperature check
    speedLabelKm: '៥២ គ.ម/ម៉ោង (ទូរត្រជាក់)',
    speedLabelEn: '52 km/h (Cold Van)',
    badgeEn: 'Fresh 4°C',
    badgeKm: 'ត្រជាក់ ៤°C',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    iconName: 'cold',
  },
  {
    id: 'heavy_freight',
    nameEn: 'Heavy Cargo Freight',
    nameKm: 'ទំនិញធុនធ្ងន់ & លក់ដុំ',
    descEn: 'Wholesale pallet freight, construction materials, and farm harvests.',
    descKm: 'ដឹកទំនិញលក់ដុំ កសិផលប្រមូលផល និងឥវ៉ាន់ទម្ងន់ធ្ងន់ទូទាំងប្រទេស។',
    baseFareKHR: 8000,
    baseFareUSD: 2.0,
    includedKm: 30,
    includedKg: 5,
    perKmRateKHR: 22,
    perKgRateKHR: 700,
    maxDistanceKm: 600,
    maxWeightKg: 200,
    avgSpeedKmH: 42, // Heavy truck speed governor (~1.43 min/km)
    handlingBufferMins: 45, // Forklift & strapping buffer
    speedLabelKm: '៤២ គ.ម/ម៉ោង (ឡានធំ)',
    speedLabelEn: '42 km/h (Heavy Truck)',
    badgeEn: 'Up to 200kg',
    badgeKm: 'រហូតដល់ ២០០គីឡូ',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    iconName: 'truck',
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

// Calculate realistic road distance between any two Cambodian provinces
function getProvinceDistanceKm(fromId: string, toId: string): number {
  if (fromId === toId) return 12; // Same province intra-district baseline
  const dFromPP = PROVINCE_DISTANCES_FROM_PP[fromId] ?? 150;
  const dToPP = PROVINCE_DISTANCES_FROM_PP[toId] ?? 150;

  if (fromId === 'phnom-penh') return dToPP;
  if (toId === 'phnom-penh') return dFromPP;

  // Triangle approximation based on road network hub in central Cambodia
  const diff = Math.abs(dFromPP - dToPP);
  const sum = dFromPP + dToPP;
  // If in the same directional corridor (e.g. Pursat and Battambang on NR5)
  if ((dFromPP > 150 && dToPP > 150) || (dFromPP < 150 && dToPP < 150)) {
    return Math.max(35, Math.round(diff * 1.05));
  }
  // Cross corridor through central hub
  return Math.max(45, Math.round((sum * 0.72)));
}

// Formats an arrival Date into Khmer and English with relative day (Today/Tomorrow) and 12-hour clock
export function formatEtaArrivalDetails(date: Date) {
  const now = new Date();
  const isToday = now.getDate() === date.getDate() && now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = tomorrow.getDate() === date.getDate() && tomorrow.getMonth() === date.getMonth() && tomorrow.getFullYear() === date.getFullYear();

  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const isPM = h >= 12;
  const displayH = h % 12 === 0 ? 12 : h % 12;

  // Khmer formatting
  let periodKm = 'ព្រឹក';
  if (h >= 12 && h < 17) periodKm = 'រសៀល';
  else if (h >= 17) periodKm = 'ល្ងាច/យប់';

  const relativeDayKm = isToday ? 'ថ្ងៃនេះ' : isTomorrow ? 'ថ្ងៃស្អែក' : `ថ្ងៃទី ${date.getDate()}/${date.getMonth() + 1}`;
  const clockTimeKm = `ម៉ោង ${displayH.toString().padStart(2, '0')}:${m} ${periodKm}`;

  // English formatting
  const periodEn = isPM ? 'PM' : 'AM';
  const relativeDayEn = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const clockTimeEn = `${displayH}:${m} ${periodEn}`;

  return {
    arrivalClockKm: {
      relativeDay: relativeDayKm,
      clockTime: clockTimeKm,
      fullText: `${relativeDayKm} ${clockTimeKm}`,
    },
    arrivalClockEn: {
      relativeDay: relativeDayEn,
      clockTime: clockTimeEn,
      fullText: `${relativeDayEn}, ${clockTimeEn}`,
    }
  };
}

// Quick helper to format vehicle duration string on cards
export function getVehicleQuickDuration(v: VehicleOption, km: number, isKm: boolean): string {
  const roadMins = Math.max(1, Math.round(km * (60 / v.avgSpeedKmH)));
  const totalMins = roadMins + v.handlingBufferMins;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (isKm) {
    return h > 0 ? (m > 0 ? `${h}ម៉ោង ${m}ន.` : `${h} ម៉ោង`) : `${m} នាទី`;
  }
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export const QuickCostEstimator: React.FC<QuickCostEstimatorProps> = ({
  language,
  currency,
  onNavigateTab,
  onNotify,
}) => {
  const isKm = language === 'km';

  // Input states
  const [weightKg, setWeightKg] = useState<number>(2.0);
  const [distanceKm, setDistanceKm] = useState<number>(314); // default PP -> Siem Reap
  const [selectedVehicleId, setSelectedVehicleId] = useState<DeliveryVehicleMode>('interprovincial_van');
  const [isRouteMode, setIsRouteMode] = useState<boolean>(true);
  const [originProvince, setOriginProvince] = useState<string>('phnom-penh');
  const [destinationProvince, setDestinationProvince] = useState<string>('siem-reap');
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Synchronize route selection with distance
  const handleOriginChange = (val: string) => {
    setOriginProvince(val);
    const dist = getProvinceDistanceKm(val, destinationProvince);
    setDistanceKm(dist);
  };

  const handleDestinationChange = (val: string) => {
    setDestinationProvince(val);
    const dist = getProvinceDistanceKm(originProvince, val);
    setDistanceKm(dist);
  };

  const handleCustomDistanceChange = (kmVal: number) => {
    setDistanceKm(kmVal);
  };

  // Selected vehicle specs
  const selectedVehicle = useMemo(() => {
    return VEHICLE_OPTIONS.find((v) => v.id === selectedVehicleId) || VEHICLE_OPTIONS[0];
  }, [selectedVehicleId]);

  // Adjust selected vehicle if distance or weight exceeds max
  const isVehicleCompatible = distanceKm <= selectedVehicle.maxDistanceKm && weightKg <= selectedVehicle.maxWeightKg;

  // Calculation breakdown
  const calculation = useMemo(() => {
    const base = selectedVehicle.baseFareKHR;

    // Extra distance cost
    const chargeableKm = Math.max(0, distanceKm - selectedVehicle.includedKm);
    let distanceCost = Math.round(chargeableKm * selectedVehicle.perKmRateKHR);

    // Extra weight cost
    const chargeableWeight = Math.max(0, weightKg - selectedVehicle.includedKg);
    let weightCost = Math.round(chargeableWeight * selectedVehicle.perKgRateKHR);

    // Volume discount for long highway trips
    if (distanceKm > 200 && selectedVehicleId === 'interprovincial_van') {
      distanceCost = Math.round(distanceCost * 0.9); // Consolidated logistics discount
    }

    // CamDelivery Platform Commission: 0% ALWAYS
    const platformCommissionPercent = 0;
    const platformFeeKHR = 0;

    const totalKHR = Math.round((base + distanceCost + weightCost) / 100) * 100; // round to neat 100 KHR
    const totalUSD = Number((totalKHR / 4100).toFixed(2));

    // Traditional commercial aggregators take 15% to 25% (average 20%)
    const traditionalCommissionPercent = 20;
    const traditionalMarkupKHR = Math.round((totalKHR * traditionalCommissionPercent) / 100 / 100) * 100;
    const traditionalMarkupUSD = Number((traditionalMarkupKHR / 4100).toFixed(2));
    const traditionalTotalKHR = totalKHR + traditionalMarkupKHR;
    const traditionalTotalUSD = Number((traditionalTotalKHR / 4100).toFixed(2));

    // What the driver receives
    const driverPayoutKHR = totalKHR;
    const driverPayoutUSD = totalUSD;

    // Comprehensive ETA calculation based on hardcoded average speed per kilometer
    const avgSpeedKmH = selectedVehicle.avgSpeedKmH; // e.g., 60 km/h
    const minutesPerKm = Number((60 / avgSpeedKmH).toFixed(2)); // e.g., 1.00 min/km
    const roadTravelMinutes = Math.max(1, Math.round(distanceKm * (60 / avgSpeedKmH)));
    const bufferMinutes = selectedVehicle.handlingBufferMins; // depot dispatch & sorting buffer
    const totalDurationMinutes = roadTravelMinutes + bufferMinutes;

    const totalHours = Math.floor(totalDurationMinutes / 60);
    const remainingMins = totalDurationMinutes % 60;

    const formattedDurationEn = totalHours > 0 
      ? (remainingMins > 0 ? `${totalHours}h ${remainingMins}m` : `${totalHours} hrs`) 
      : `${remainingMins} mins`;

    const formattedDurationKm = totalHours > 0 
      ? (remainingMins > 0 ? `${totalHours} ម៉ោង ${remainingMins} នាទី` : `${totalHours} ម៉ោង`) 
      : `${remainingMins} នាទី`;

    const arrivalDate = new Date(Date.now() + totalDurationMinutes * 60 * 1000);
    const { arrivalClockKm, arrivalClockEn } = formatEtaArrivalDetails(arrivalDate);

    // Human-readable transit category
    let transitTimeEn = `~${formattedDurationEn} (by ${arrivalClockEn.clockTime})`;
    let transitTimeKm = `~${formattedDurationKm} (ត្រឹម ${arrivalClockKm.clockTime})`;
    if (selectedVehicleId === 'moto_express') {
      transitTimeEn = `Express Dispatch: ~${formattedDurationEn}`;
      transitTimeKm = `ដឹកបន្ទាន់៖ ~${formattedDurationKm}`;
    }

    const eta = {
      avgSpeedKmH,
      minutesPerKm,
      roadTravelMinutes,
      bufferMinutes,
      totalDurationMinutes,
      formattedDurationEn,
      formattedDurationKm,
      arrivalClockKm,
      arrivalClockEn,
    };

    return {
      baseFareKHR: base,
      baseFareUSD: Number((base / 4100).toFixed(2)),
      distanceCostKHR: distanceCost,
      distanceCostUSD: Number((distanceCost / 4100).toFixed(2)),
      weightCostKHR: weightCost,
      weightCostUSD: Number((weightCost / 4100).toFixed(2)),
      platformCommissionPercent,
      platformFeeKHR,
      platformFeeUSD: 0,
      totalKHR,
      totalUSD,
      traditionalMarkupKHR,
      traditionalMarkupUSD,
      traditionalTotalKHR,
      traditionalTotalUSD,
      driverPayoutKHR,
      driverPayoutUSD,
      transitTimeEn,
      transitTimeKm,
      eta,
    };
  }, [distanceKm, weightKg, selectedVehicle, selectedVehicleId]);

  // Format money helper
  const formatMoney = (khr: number, usd: number) => {
    if (currency === 'KHR') {
      return `${khr.toLocaleString()} ៛`;
    }
    return `$${usd.toFixed(2)}`;
  };

  // Copy transparent quote details to clipboard
  const handleCopyQuote = () => {
    const originName = CAMBODIA_PROVINCES.find((p) => p.id === originProvince)?.name || originProvince;
    const destName = CAMBODIA_PROVINCES.find((p) => p.id === destinationProvince)?.name || destinationProvince;
    const quoteText = `🇰🇭 CamDelivery Quick Cost & ETA Estimate
📍 Route: ${isRouteMode ? `${originName} ➔ ${destName}` : `${distanceKm} km`}
⚖️ Weight: ${weightKg} kg
🚚 Vehicle: ${selectedVehicle.nameEn} (${selectedVehicle.avgSpeedKmH} km/h avg benchmark speed)
💵 Transparent Rate: ${formatMoney(calculation.totalKHR, calculation.totalUSD)}
✨ Platform Commission: 0% Free (0 ៛) - 100% directly to Driver
⏱️ Estimated Delivery (ETA): ~${calculation.eta.formattedDurationEn} (Expected: ${calculation.eta.arrivalClockEn.fullText})`;

    navigator.clipboard?.writeText?.(quoteText);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);

    if (onNotify) {
      onNotify(
        isKm
          ? `បានចម្លងសម្រង់តម្លៃ & ម៉ោងមកដល់៖ ${formatMoney(calculation.totalKHR, calculation.totalUSD)} (ETA: ${calculation.eta.arrivalClockKm.fullText})`
          : `Copied quote & ETA: ${formatMoney(calculation.totalKHR, calculation.totalUSD)} (ETA: ${calculation.eta.arrivalClockEn.fullText})`
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-7 border border-slate-200 shadow-sm space-y-6">
      {/* Header & 0% Promise Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-2xs">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base md:text-lg">
              {isKm ? 'គណនាតម្លៃដឹកជញ្ជូនរហ័ស (Quick Cost Estimator)' : 'Quick Cost Estimator'}
            </h3>
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300/80 shadow-2xs">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>0% COMMISSION</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isKm
              ? 'បញ្ចូលទម្ងន់ និងចម្ងាយដឹកជញ្ជូន ដើម្បីទទួលបានតម្លៃច្បាស់លាស់តាមទីផ្សារកម្ពុជា ដោយគ្មានការបំប៉ោងតម្លៃ'
              : 'Calculate instant fair market rates by weight and destination distance with 100% transparent pricing'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('courier')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>{isKm ? 'ប្រៀបធៀបគ្រប់ក្រុមហ៊ុន' : 'Compare 6 Carriers'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 0% Commission Promise Highlight Ribbon */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-emerald-700/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-300 tracking-wide uppercase">
                {isKm ? 'ការសន្យាសេវាឥតកាត់កម្រៃជើងសារ 0%' : 'Our 0% Commission Promise'}
              </span>
              <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-md">
                100% to Driver
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isKm
                ? 'គ្មានកាត់កម្រៃជើងសារ ១៥%-២៥% ដូចកម្មវិធីពាណិជ្ជកម្មដទៃ។ ប្រាក់ឈ្នួលដឹកជញ្ជូន ១០០% ផ្ទេរចូល Bakong អ្នកដឹកផ្ទាល់។'
                : 'Zero platform cuts. 100% of your shipping fee goes straight to the local Cambodian courier or driver.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right shrink-0">
          <div className="text-xs font-black text-emerald-400 bg-emerald-900/50 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            {isKm ? 'សន្សំបាន' : 'You Save'}:{' '}
            <span className="text-white font-extrabold">
              {formatMoney(calculation.traditionalMarkupKHR, calculation.traditionalMarkupUSD)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual Inputs: Weight & Distance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* INPUT 1: WEIGHT (KG) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Scale className="w-4 h-4 text-rose-600" />
              <span>{isKm ? 'ទម្ងន់កញ្ចប់ឥវ៉ាន់ (Weight)' : 'Package Weight'}</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                value={weightKg}
                onChange={(e) => setWeightKg(Math.max(0.1, Number(e.target.value) || 0.1))}
                className="w-20 px-2 py-1 text-right text-xs font-extrabold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-xs font-bold text-slate-600">kg</span>
            </div>
          </div>

          {/* Interactive Weight Slider */}
          <div className="pt-1">
            <input
              type="range"
              min={0.5}
              max={30}
              step={0.5}
              value={Math.min(30, weightKg)}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-bold mt-1">
              <span>0.5 kg (Document)</span>
              <span>5 kg (Standard)</span>
              <span>15 kg (Bulk)</span>
              <span>30 kg+</span>
            </div>
          </div>

          {/* Fast Preset Weight Chips */}
          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1.5">
              {isKm ? 'ទម្ងន់ទូទៅ៖' : 'Common Weights:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '0.5 kg', val: 0.5, desc: isKm ? 'លិខិត/ឯកសារ' : 'Document' },
                { label: '1.0 kg', val: 1.0, desc: isKm ? 'ខោអាវ/គ្រឿងសម្អាង' : 'Clothing' },
                { label: '2.0 kg', val: 2.0, desc: isKm ? 'ស្បែកជើង/គ្រឿងអគ្គិសនី' : 'Standard' },
                { label: '5.0 kg', val: 5.0, desc: isKm ? 'ម្ហូបអាហារ/កសិផល' : 'Groceries' },
                { label: '10 kg', val: 10.0, desc: isKm ? 'កេសផ្លែឈើ' : 'Fruit Box' },
                { label: '25 kg', val: 25.0, desc: isKm ? 'បាវអង្ករ/ទំនិញដុំ' : 'Rice Sack' },
              ].map((chip) => (
                <button
                  key={`weight-${chip.val}`}
                  type="button"
                  onClick={() => setWeightKg(chip.val)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    weightKg === chip.val
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* INPUT 2: DESTINATION DISTANCE (KM) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>{isKm ? 'ចម្ងាយដឹកជញ្ជូន (Distance)' : 'Destination Distance'}</span>
            </label>

            {/* Mode Switcher: Route vs Slider */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setIsRouteMode(true)}
                className={`px-2 py-0.5 rounded-md transition ${
                  isRouteMode ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isKm ? 'រើសខេត្ត' : 'By Province'}
              </button>
              <button
                type="button"
                onClick={() => setIsRouteMode(false)}
                className={`px-2 py-0.5 rounded-md transition ${
                  !isRouteMode ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isKm ? 'ចម្ងាយផ្ទាល់ (KM)' : 'Custom KM'}
              </button>
            </div>
          </div>

          {/* Province Route Selector Mode */}
          {isRouteMode ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    {isKm ? 'ចេញពី (Origin)' : 'From'}
                  </span>
                  <select
                    value={originProvince}
                    onChange={(e) => handleOriginChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  >
                    {CAMBODIA_PROVINCES.map((p) => (
                      <option key={`orig-${p.id}`} value={p.id}>
                        {isKm ? p.nameKm : p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    {isKm ? 'ទៅកាន់ (Destination)' : 'To'}
                  </span>
                  <select
                    value={destinationProvince}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  >
                    {CAMBODIA_PROVINCES.map((p) => (
                      <option key={`dest-${p.id}`} value={p.id}>
                        {isKm ? p.nameKm : p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Highway distance indicator */}
              <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">
                  {isKm ? 'ចម្ងាយផ្លូវជាតិប៉ាន់ស្មាន៖' : 'Estimated Highway Distance:'}
                </span>
                <span className="font-black text-rose-600 font-mono text-sm">
                  {distanceKm} km
                </span>
              </div>
            </div>
          ) : (
            /* Custom KM Direct Slider Mode */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {distanceKm < 20 ? (isKm ? 'ក្នុងក្រុង / សង្កាត់' : 'Intra-City') : (isKm ? 'ឆ្លងខេត្តលើផ្លូវជាតិ' : 'Interprovincial Highway')}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={distanceKm}
                    onChange={(e) => handleCustomDistanceChange(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 px-2 py-1 text-right text-xs font-extrabold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-600">km</span>
                </div>
              </div>

              <input
                type="range"
                min={1}
                max={450}
                value={distanceKm}
                onChange={(e) => handleCustomDistanceChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                <span>1 km (City)</span>
                <span>150 km (Kampot)</span>
                <span>314 km (Siem Reap)</span>
                <span>450 km+</span>
              </div>
            </div>
          )}

          {/* Fast Route Presets */}
          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1.5">
              {isKm ? 'គោលដៅញឹកញាប់៖' : 'Popular Corridors:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '5 km (PP Inner City)', km: 5, orig: 'phnom-penh', dest: 'phnom-penh' },
                { label: '48 km (PP ⇄ Speu)', km: 48, orig: 'phnom-penh', dest: 'kampong-speu' },
                { label: '148 km (PP ⇄ Kampot)', km: 148, orig: 'phnom-penh', dest: 'kampot' },
                { label: '190 km (PP ⇄ SHV)', km: 190, orig: 'phnom-penh', dest: 'sihanoukville' },
                { label: '290 km (PP ⇄ BTB)', km: 290, orig: 'phnom-penh', dest: 'battambang' },
                { label: '314 km (PP ⇄ Siem Reap)', km: 314, orig: 'phnom-penh', dest: 'siem-reap' },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setOriginProvince(p.orig);
                    setDestinationProvince(p.dest);
                    setDistanceKm(p.km);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                    distanceKm === p.km
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* INPUT 3: VEHICLE / SERVICE CATEGORY SELECTOR */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Truck className="w-4 h-4 text-rose-600" />
            <span>{isKm ? 'ប្រភេទមធ្យោបាយដឹកជញ្ជូន (Delivery Vehicle Mode)' : 'Transport Vehicle Mode'}</span>
          </label>
          <span className="text-[11px] text-slate-500">
            {isKm ? 'ជ្រើសរើសតាមទំហំ និងប្រភេទឥវ៉ាន់' : 'Select best suited for your cargo'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {VEHICLE_OPTIONS.map((v) => {
            const isSelected = selectedVehicleId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVehicleId(v.id)}
                className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-600 bg-rose-50/50 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">
                      {v.iconName === 'van' && '🚐'}
                      {v.iconName === 'door' && '🚪'}
                      {v.iconName === 'moto' && '🛵'}
                      {v.iconName === 'tuktuk' && '🛺'}
                      {v.iconName === 'cold' && '❄️'}
                      {v.iconName === 'truck' && '🚚'}
                    </span>
                    {v.badgeEn && (
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${v.badgeColor}`}>
                        {isKm ? v.badgeKm : v.badgeEn}
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-black text-slate-900 leading-tight">
                    {isKm ? v.nameKm : v.nameEn}
                  </h5>
                  <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                    {isKm ? v.descKm : v.descEn}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-bold">{isKm ? 'ចាប់ផ្តើម' : 'From'}</span>
                    <span className="text-xs font-extrabold text-rose-700">
                      {formatMoney(v.baseFareKHR, v.baseFareUSD)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 bg-amber-50/90 px-1.5 py-0.5 rounded-md border border-amber-200/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      <span>~{getVehicleQuickDuration(v, distanceKm, isKm)}</span>
                    </span>
                    <span className="text-slate-500 font-semibold text-[9px]">{v.avgSpeedKmH} km/h</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* COMPATIBILITY NOTICE IF WEIGHT OR DISTANCE EXCEEDS */}
      {!isVehicleCompatible && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isKm
              ? `ចំណាំ៖ មធ្យោបាយ ${isKm ? selectedVehicle.nameKm : selectedVehicle.nameEn} ស័ក្តិសមបំផុតសម្រាប់ចម្ងាយក្រោម ${selectedVehicle.maxDistanceKm}km និងទម្ងន់ក្រោម ${selectedVehicle.maxWeightKg}kg។ យើងណែនាំឱ្យជ្រើសរើស ឡានវ៉ែន ឬឡានធំ។`
              : `Note: ${selectedVehicle.nameEn} is optimized for under ${selectedVehicle.maxDistanceKm} km and ${selectedVehicle.maxWeightKg} kg. Consider Interprovincial Van or Heavy Freight for long distances.`}
          </span>
        </div>
      )}

      {/* RESULT SECTION: TRANSPARENT COST ESTIMATION & 0% COMMISSION BREAKDOWN */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white shadow-lg space-y-5 border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400">
                {isKm ? 'ការប៉ាន់ស្មានតម្លៃតម្លាភាព ១០០%' : '100% Transparent Rate Estimation'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.2 rounded-full border border-emerald-500/40">
                {isKm ? 'គ្មានកម្រៃលាក់កំបាំង' : 'No Hidden Fees'}
              </span>
            </div>
            <h4 className="text-lg md:text-xl font-black text-white mt-1">
              {isRouteMode ? (
                <>
                  {CAMBODIA_PROVINCES.find((p) => p.id === originProvince)?.[isKm ? 'nameKm' : 'name'] || originProvince}
                  {' ➔ '}
                  {CAMBODIA_PROVINCES.find((p) => p.id === destinationProvince)?.[isKm ? 'nameKm' : 'name'] || destinationProvince}
                </>
              ) : (
                <>{distanceKm} km Delivery Route</>
              )}
            </h4>
            <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
              <span>{weightKg} kg</span>
              <span>•</span>
              <span>{isKm ? selectedVehicle.nameKm : selectedVehicle.nameEn}</span>
              <span>•</span>
              <span className="text-amber-300 flex items-center gap-1 font-bold">
                <Clock className="w-3 h-3" />
                <span>{isKm ? calculation.transitTimeKm : calculation.transitTimeEn}</span>
              </span>
            </div>
          </div>

          {/* Final Price Highlight */}
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">
              {isKm ? 'តម្លៃសរុបត្រូវទូទាត់' : 'Total Fair Cost'}
            </span>
            <div className="text-2xl md:text-3xl font-black text-rose-400">
              {formatMoney(calculation.totalKHR, calculation.totalUSD)}
            </div>
            <span className="text-[11px] text-emerald-400 font-bold block">
              {currency === 'KHR' ? `$${calculation.totalUSD.toFixed(2)} USD` : `${calculation.totalKHR.toLocaleString()} ៛ KHR`}
            </span>
          </div>
        </div>

        {/* COMPREHENSIVE ETA & ARRIVAL TIME EXPECTATION DASHBOARD */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-800/90 to-emerald-500/15 border border-amber-400/40 text-white space-y-3.5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-inner">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    <span>{isKm ? 'ពេលវេលាមកដល់ប៉ាន់ស្មាន (Delivery ETA)' : 'Estimated Arrival Expectation (ETA)'}</span>
                  </h5>
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                    <Gauge className="w-3 h-3 text-slate-950" />
                    <span>{calculation.eta.avgSpeedKmH} km/h {isKm ? 'ល្បឿនមធ្យម' : 'avg benchmark speed'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {isKm
                    ? `គណនាលើចម្ងាយផ្លូវ ${distanceKm} គ.ម × ${calculation.eta.minutesPerKm} នាទី/គ.ម (${calculation.eta.roadTravelMinutes} នាទីលើផ្លូវ) + ${calculation.eta.bufferMinutes} នាទីលើកដាក់កញ្ចប់`
                    : `Derived from ${distanceKm} km route × ${calculation.eta.minutesPerKm} mins/km speed pace (${calculation.eta.roadTravelMinutes} mins transit) + ${calculation.eta.bufferMinutes} mins depot handling`}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-black/30 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-xl shrink-0">
              <div className="text-[11px] text-slate-400 font-semibold">
                {isKm ? 'រយៈពេលដឹកសរុប' : 'Total Transit Time'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                ~{isKm ? calculation.eta.formattedDurationKm : calculation.eta.formattedDurationEn}
              </div>
            </div>
          </div>

          {/* Prominent Arrival Window Banner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3.5 rounded-xl bg-slate-950/70 border border-white/10">
            <div className="md:col-span-7 flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
                  {isKm ? 'កាលបរិច្ឆេទ & ម៉ោងមកដល់រំពឹងទុក' : 'Estimated Arrival Target Window'}
                </span>
                <div className="text-sm sm:text-base font-black text-emerald-300 mt-0.5">
                  {isKm ? calculation.eta.arrivalClockKm.fullText : calculation.eta.arrivalClockEn.fullText}
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-1.5 flex-wrap">
              <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 font-semibold">
                <span className="text-slate-400">{isKm ? 'រៀបចំ/លើកដាក់៖ ' : 'Handling Buffer: '}</span>
                <span className="text-amber-300 font-bold">{calculation.eta.bufferMinutes}m</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 font-semibold">
                <span className="text-slate-400">{isKm ? 'បើកបរលើផ្លូវ៖ ' : 'Road Transit: '}</span>
                <span className="text-sky-300 font-bold">{calculation.eta.roadTravelMinutes}m</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{isKm ? 'ដល់ដៃអ្នកទទួល' : 'Doorstep Handover'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Line-by-Line Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Base Transport Fee */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block">
              {isKm ? 'ថ្លៃដឹកជញ្ជូនគោល (Base Fare)' : 'Base Transport Fee'}
            </span>
            <div className="text-sm font-bold text-white mt-0.5">
              {formatMoney(calculation.baseFareKHR, calculation.baseFareUSD)}
            </div>
            <span className="text-[10px] text-slate-400">
              {isKm ? `រួមបញ្ចូល ${selectedVehicle.includedKm}km & ${selectedVehicle.includedKg}kg` : `Includes ${selectedVehicle.includedKm}km & ${selectedVehicle.includedKg}kg`}
            </span>
          </div>

          {/* Distance Fare */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block">
              {isKm ? 'ចម្ងាយលើសគោល (Distance Rate)' : 'Distance Charge'}
            </span>
            <div className="text-sm font-bold text-white mt-0.5">
              {formatMoney(calculation.distanceCostKHR, calculation.distanceCostUSD)}
            </div>
            <span className="text-[10px] text-slate-400">
              {distanceKm} km {isKm ? 'ផ្លូវជាតិ/ក្នុងក្រុង' : 'highway distance'}
            </span>
          </div>

          {/* Weight Fare */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block">
              {isKm ? 'ទម្ងន់បន្ថែម (Weight Surcharge)' : 'Weight Surcharge'}
            </span>
            <div className="text-sm font-bold text-white mt-0.5">
              {formatMoney(calculation.weightCostKHR, calculation.weightCostUSD)}
            </div>
            <span className="text-[10px] text-slate-400">
              {weightKg} kg {isKm ? 'ទម្ងន់ជាក់ស្តែង' : 'total package weight'}
            </span>
          </div>

          {/* Platform Commission Cut */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[11px] text-emerald-300 font-bold block flex items-center justify-between">
              <span>{isKm ? 'កម្រៃប្រព័ន្ធ (Commission)' : 'Platform Commission'}</span>
              <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-sm font-black">
                0% FREE
              </span>
            </span>
            <div className="text-sm font-black text-emerald-400 mt-0.5">
              0 ៛ ($0.00)
            </div>
            <span className="text-[10px] text-emerald-300">
              {isKm ? '១០០% ទៅដល់អ្នកដឹកផ្ទាល់' : '100% paid directly to driver'}
            </span>
          </div>
        </div>

        {/* The 0% Commission Difference Comparison Banner */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/40 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-white text-xs">
                {isKm ? 'ការប្រៀបធៀប៖ CamDelivery ទល់នឹង កម្មវិធីពាណិជ្ជកម្មដទៃ' : 'Comparison: CamDelivery vs Commercial Aggregators'}
              </span>
            </div>
            <span className="text-emerald-400 font-black text-xs">
              {isKm ? 'សន្សំបាន ' : 'Total Savings: '}
              {formatMoney(calculation.traditionalMarkupKHR, calculation.traditionalMarkupUSD)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            {/* CamDelivery */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-400">CamDelivery (0% Cut)</span>
                <span className="font-black text-white">{formatMoney(calculation.totalKHR, calculation.totalUSD)}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {isKm
                  ? 'អ្នកដឹកជញ្ជូនទទួលបាន ១០០% ពេញលេញតាមរយៈ Bakong KHQR។ គ្មានកាត់ប្រាក់កម្រៃជើងសារពីហោប៉ៅអ្នករត់ឡាន ឬម៉ូតូ។'
                  : 'Driver receives full 100% fare directly via Bakong KHQR. 0% middleman deduction.'}
              </p>
            </div>

            {/* Other Commercial Apps */}
            <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-300">Commercial Apps (~20% Cut)</span>
                <span className="font-black text-slate-300 line-through">
                  {formatMoney(calculation.traditionalTotalKHR, calculation.traditionalTotalUSD)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isKm
                  ? `កាត់កម្រៃជើងសារខ្ពស់ (${formatMoney(calculation.traditionalMarkupKHR, calculation.traditionalMarkupUSD)}) ពីអ្នកដឹក ឬបូកបន្ថែមលើតម្លៃអតិថិជន។`
                  : `Deducts 15%-25% commission (${formatMoney(calculation.traditionalMarkupKHR, calculation.traditionalMarkupUSD)}) from driver or charges inflated merchant fees.`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Book & Share Quote */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyQuote}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
            >
              {copiedQuote ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">{isKm ? 'បានចម្លងសម្រង់តម្លៃ' : 'Quote Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isKm ? 'ចម្លងសម្រង់តម្លៃ' : 'Copy Quote'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{isKm ? 'រូបមន្តគណនា' : 'Rate Formula'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateTab('courier')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:from-rose-700 active:to-rose-800 text-white text-xs font-black transition flex items-center gap-2 shadow-md shadow-rose-950/40"
            >
              <span>{isKm ? 'កក់ការផ្ញើឥឡូវនេះ (Book Now)' : 'Book Shipment Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Explanation of Formula */}
        {showExplanation && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-3 animate-in fade-in duration-200">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{isKm ? 'របៀបគណនាតម្លៃយុត្តិធម៌តាមទីផ្សារកម្ពុជា៖' : 'How local market rates are calculated:'}</span>
              </div>
              <p className="text-[11px] leading-relaxed mt-1 whitespace-pre-line text-slate-300">
                {isKm
                  ? `• តម្លៃដឹកគោល៖ ${formatMoney(selectedVehicle.baseFareKHR, selectedVehicle.baseFareUSD)} (រួមបញ្ចូល ${selectedVehicle.includedKm}km និង ${selectedVehicle.includedKg}kg ដំបូង)\n• ចម្ងាយលើស៖ ${selectedVehicle.perKmRateKHR} ៛ ក្នុង ១គីឡូម៉ែត្រ (គិតតាមអត្រាឡានវ៉ែនផ្លូវជាតិ)\n• ទម្ងន់លើស៖ ${selectedVehicle.perKgRateKHR} ៛ ក្នុង ១គីឡូក្រាម\n• កម្រៃជើងសារប្រព័ន្ធ៖ 0% (គ្មានការកាត់កម្រៃ ឬថ្លៃលាក់កំបាំងឡើយ)`
                  : `• Base transport rate: ${formatMoney(selectedVehicle.baseFareKHR, selectedVehicle.baseFareUSD)} (includes first ${selectedVehicle.includedKm} km & ${selectedVehicle.includedKg} kg)\n• Extra distance: ${selectedVehicle.perKmRateKHR} KHR / km highway consolidation rate\n• Extra weight: ${selectedVehicle.perKgRateKHR} KHR / kg\n• Platform Commission: 0% Guaranteed (100% of payout goes straight to driver)`}
              </p>
            </div>

            <div className="pt-2.5 border-t border-white/10">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>{isKm ? 'របៀបគណនាពេលវេលាមកដល់ (ETA Benchmark Formula)៖' : 'How delivery ETA is calculated:'}</span>
              </div>
              <p className="text-[11px] leading-relaxed mt-1 whitespace-pre-line text-slate-300">
                {isKm
                  ? `• រយៈពេលសរុប = (ចម្ងាយ ${distanceKm} គ.ម ÷ ល្បឿនមធ្យម ${calculation.eta.avgSpeedKmH} គ.ម/ម៉ោង) + ${calculation.eta.bufferMinutes} នាទីលើកដាក់កញ្ចប់\n• ល្បឿនគិតជាមធ្យម៖ ${calculation.eta.minutesPerKm} នាទី ក្នុង ១គីឡូម៉ែត្រ (${calculation.eta.roadTravelMinutes} នាទីធ្វើដំណើរលើផ្លូវ)\n• ពេលវេលាមកដល់រំពឹងទុក៖ ${calculation.eta.arrivalClockKm.fullText}`
                  : `• Total Duration = (${distanceKm} km ÷ ${calculation.eta.avgSpeedKmH} km/h avg speed) + ${calculation.eta.bufferMinutes} mins depot handling buffer\n• Speed Pace: ${calculation.eta.minutesPerKm} mins per km (${calculation.eta.roadTravelMinutes} mins driving time)\n• Expected Arrival Target: ${calculation.eta.arrivalClockEn.fullText}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
