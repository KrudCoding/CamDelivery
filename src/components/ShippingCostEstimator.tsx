import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Scale,
  MapPin,
  Truck,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
  DollarSign,
  Car,
  Package,
  Layers,
  Sliders,
  Check,
  Zap,
  HelpCircle,
  Clock,
  HeartHandshake
} from 'lucide-react';
import { Language, Currency, TrackingItem } from '../types';

interface ShippingCostEstimatorProps {
  language: Language;
  currency: Currency;
  onBookEstimate?: (estimateDetails: {
    vehicleName: string;
    vehicleNameKm: string;
    weightKg: number;
    distanceKm: number;
    priceKHR: number;
    priceUSD: number;
    packageType: string;
    savingsKHR: number;
  }) => void;
  className?: string;
}

interface VehicleEstimateOption {
  id: string;
  nameEn: string;
  nameKm: string;
  categoryEn: string;
  categoryKm: string;
  iconType: 'moto' | 'tuktuk' | 'van' | 'door' | 'cold';
  maxWeightKg: number;
  maxDistanceKm: number;
  etaLabelEn: string;
  etaLabelKm: string;
  calculateFare: (weightKg: number, distanceKm: number, packageType: string) => {
    priceKHR: number;
    priceUSD: number;
    commercialMarkupKHR: number;
    savingsKHR: number;
    savingsUSD: number;
  };
}

const VEHICLE_ESTIMATE_OPTIONS: VehicleEstimateOption[] = [
  {
    id: 'moto_express',
    nameEn: 'Motorcycle Courier Express',
    nameKm: 'ម៉ូតូដឹកជញ្ជូនរហ័សទាន់ចិត្ត',
    categoryEn: 'Urban & Fast Parcels (< 20kg)',
    categoryKm: 'ក្នុងក្រុង & ឥវ៉ាន់តូច (< ២០គីឡូ)',
    iconType: 'moto',
    maxWeightKg: 20,
    maxDistanceKm: 60,
    etaLabelEn: '30 - 60 mins',
    etaLabelKm: '៣០ - ៦០ នាទី',
    calculateFare: (weight, dist, pkgType) => {
      // Base: 3,000 KHR for first 3km, 1,000 KHR/km after
      const baseDistKm = 3;
      const extraKm = Math.max(0, dist - baseDistKm);
      const kmCost = extraKm * 1000;
      const weightSurcharge = Math.max(0, weight - 2) * 400;
      const typeSurcharge = pkgType === 'fragile' ? 2000 : pkgType === 'food_cold' ? 3000 : 0;
      const priceKHR = Math.round(3000 + kmCost + weightSurcharge + typeSurcharge);
      const commercialMarkupKHR = Math.round(priceKHR * 0.22); // 22% typical Grab/delivery markup
      return {
        priceKHR,
        priceUSD: Number((priceKHR / 4100).toFixed(2)),
        commercialMarkupKHR,
        savingsKHR: commercialMarkupKHR,
        savingsUSD: Number((commercialMarkupKHR / 4100).toFixed(2)),
      };
    },
  },
  {
    id: 'tuktuk_cargo',
    nameEn: 'Three-Wheeler TukTuk Cargo',
    nameKm: 'កង់បីដឹកទំនិញធុនមធ្យម',
    categoryEn: 'Boxes, Appliances & Bulk (< 120kg)',
    categoryKm: 'កេសធំ គ្រឿងអេឡិចត្រូនិច (< ១២០គីឡូ)',
    iconType: 'tuktuk',
    maxWeightKg: 120,
    maxDistanceKm: 80,
    etaLabelEn: '45 - 90 mins',
    etaLabelKm: '៤៥ - ៩០ នាទី',
    calculateFare: (weight, dist, pkgType) => {
      const baseDistKm = 4;
      const extraKm = Math.max(0, dist - baseDistKm);
      const kmCost = extraKm * 1200;
      const weightSurcharge = Math.max(0, weight - 5) * 300;
      const typeSurcharge = pkgType === 'fragile' ? 3000 : 0;
      const priceKHR = Math.round(6000 + kmCost + weightSurcharge + typeSurcharge);
      const commercialMarkupKHR = Math.round(priceKHR * 0.20);
      return {
        priceKHR,
        priceUSD: Number((priceKHR / 4100).toFixed(2)),
        commercialMarkupKHR,
        savingsKHR: commercialMarkupKHR,
        savingsUSD: Number((commercialMarkupKHR / 4100).toFixed(2)),
      };
    },
  },
  {
    id: 'interprovincial_van',
    nameEn: 'Interprovincial Van Consolidated',
    nameKm: 'ឡានវ៉ែនអន្តរខេត្ត (ឃ្លាំង ទៅ ឃ្លាំង)',
    categoryEn: '25 Provinces Highway Hub Network',
    categoryKm: 'បណ្តាញផ្លូវជាតិ ២៥ ខេត្ត-ក្រុង',
    iconType: 'van',
    maxWeightKg: 60,
    maxDistanceKm: 700,
    etaLabelEn: 'Same Day / Next Morning',
    etaLabelKm: 'ល្ងាចថ្ងៃដដែល ឬព្រឹកបន្ទាប់',
    calculateFare: (weight, dist, pkgType) => {
      // Interprovincial consolidated highway rates:
      // Base: 4,000 KHR includes 30km, ~25 KHR/km highway consolidated
      const extraKm = Math.max(0, dist - 30);
      const kmCost = extraKm * 25;
      const weightSurcharge = Math.max(0, weight - 1) * 600;
      const typeSurcharge = pkgType === 'fragile' ? 2500 : 0;
      const priceKHR = Math.round(4000 + kmCost + weightSurcharge + typeSurcharge);
      const commercialMarkupKHR = Math.round(priceKHR * 0.25); // Intercity brokers take 25%
      return {
        priceKHR,
        priceUSD: Number((priceKHR / 4100).toFixed(2)),
        commercialMarkupKHR,
        savingsKHR: commercialMarkupKHR,
        savingsUSD: Number((commercialMarkupKHR / 4100).toFixed(2)),
      };
    },
  },
  {
    id: 'doorstep_van',
    nameEn: 'Door-to-Door Delivery Van',
    nameKm: 'ឡានវ៉ែនដឹកជញ្ជូនដល់មាត់ទ្វារផ្ទះ',
    categoryEn: 'Pickup from Sender & Delivery to Recipient',
    categoryKm: 'យកពីផ្ទះអ្នកផ្ញើ ប្រគល់ដល់ដៃអ្នកទទួល',
    iconType: 'door',
    maxWeightKg: 100,
    maxDistanceKm: 700,
    etaLabelEn: 'Same Day - 24 Hours',
    etaLabelKm: 'ថ្ងៃដដែល ឬ ២៤ ម៉ោង',
    calculateFare: (weight, dist, pkgType) => {
      const extraKm = Math.max(0, dist - 20);
      const kmCost = extraKm * 40;
      const weightSurcharge = Math.max(0, weight - 2) * 700;
      const typeSurcharge = pkgType === 'fragile' ? 3000 : 0;
      const priceKHR = Math.round(8000 + kmCost + weightSurcharge + typeSurcharge);
      const commercialMarkupKHR = Math.round(priceKHR * 0.20);
      return {
        priceKHR,
        priceUSD: Number((priceKHR / 4100).toFixed(2)),
        commercialMarkupKHR,
        savingsKHR: commercialMarkupKHR,
        savingsUSD: Number((commercialMarkupKHR / 4100).toFixed(2)),
      };
    },
  },
  {
    id: 'cold_chain',
    nameEn: 'Cold-Chain Chilled Transport',
    nameKm: 'រថយន្តទូរត្រជាក់ (សាច់ បន្លែ & ឱសថ)',
    categoryEn: 'Temperature Controlled (2°C - 8°C)',
    categoryKm: 'រក្សាសីតុណ្ហភាពត្រជាក់ ២°C ដល់ ៨°C',
    iconType: 'cold',
    maxWeightKg: 80,
    maxDistanceKm: 600,
    etaLabelEn: 'Express Chilled Route',
    etaLabelKm: 'គន្លងត្រជាក់រហ័ស',
    calculateFare: (weight, dist) => {
      const extraKm = Math.max(0, dist - 20);
      const kmCost = extraKm * 55;
      const weightSurcharge = Math.max(0, weight - 1) * 900;
      const priceKHR = Math.round(12000 + kmCost + weightSurcharge);
      const commercialMarkupKHR = Math.round(priceKHR * 0.25);
      return {
        priceKHR,
        priceUSD: Number((priceKHR / 4100).toFixed(2)),
        commercialMarkupKHR,
        savingsKHR: commercialMarkupKHR,
        savingsUSD: Number((commercialMarkupKHR / 4100).toFixed(2)),
      };
    },
  },
];

const PRESET_DISTANCES = [
  { labelEn: '15 km (Phnom Penh City)', labelKm: '១៥ គ.ម (ភ្នំពេញ)', km: 15 },
  { labelEn: '45 km (PP → Kandal)', labelKm: '៤៥ គ.ម (ភ្នំពេញ → កណ្តាល)', km: 45 },
  { labelEn: '120 km (PP → Kg. Cham)', labelKm: '១២០ គ.ម (ភ្នំពេញ → កំពង់ចាម)', km: 120 },
  { labelEn: '190 km (PP → Sihanoukville)', labelKm: '១៩០ គ.ម (ភ្នំពេញ → ព្រះសីហនុ)', km: 190 },
  { labelEn: '290 km (PP → Battambang)', labelKm: '២៩០ គ.ម (ភ្នំពេញ → បាត់ដំបង)', km: 290 },
  { labelEn: '314 km (PP → Siem Reap)', labelKm: '៣១៤ គ.ម (ភ្នំពេញ → សៀមរាប)', km: 314 },
];

const PRESET_WEIGHTS = [0.5, 1, 2, 5, 10, 20, 40];

export const ShippingCostEstimator: React.FC<ShippingCostEstimatorProps> = ({
  language,
  currency,
  onBookEstimate,
  className = '',
}) => {
  const isKm = language === 'km';

  // State inputs
  const [weightKg, setWeightKg] = useState<number>(2.5);
  const [distanceKm, setDistanceKm] = useState<number>(45);
  const [packageType, setPackageType] = useState<string>('general');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('interprovincial_van');

  // Compute estimates for all vehicles in real-time
  const calculatedVehicles = useMemo(() => {
    return VEHICLE_ESTIMATE_OPTIONS.map((veh) => {
      const fare = veh.calculateFare(weightKg, distanceKm, packageType);
      const isEligible = weightKg <= veh.maxWeightKg && distanceKm <= veh.maxDistanceKm;
      return {
        ...veh,
        ...fare,
        isEligible,
      };
    });
  }, [weightKg, distanceKm, packageType]);

  const activeVehicle = calculatedVehicles.find((v) => v.id === selectedVehicleId) || calculatedVehicles[0];

  const formatMoney = (khr: number, usd: number) => {
    if (currency === 'KHR') {
      return `${khr.toLocaleString()} ៛`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const handleBookNow = () => {
    if (!onBookEstimate || !activeVehicle) return;
    onBookEstimate({
      vehicleName: activeVehicle.nameEn,
      vehicleNameKm: activeVehicle.nameKm,
      weightKg,
      distanceKm,
      priceKHR: activeVehicle.priceKHR,
      priceUSD: activeVehicle.priceUSD,
      packageType,
      savingsKHR: activeVehicle.savingsKHR,
    });
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden ${className}`}>
      {/* 0% Commission Hero Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 sm:p-6 border-b border-emerald-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-emerald-500/25">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white">
                  {isKm ? 'ម៉ាស៊ីនគណនាតម្លៃដឹកជញ្ជូន (0% កម្រៃជើងសារ)' : 'Real-Time Shipping Cost Estimator'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 shadow-xs">
                  {isKm ? 'កម្រៃជើងសារ 0%' : '0% Platform Commission'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-1 max-w-xl">
                {isKm
                  ? 'បញ្ចូលទម្ងន់ (គីឡូ) និងចម្ងាយ (គ.ម) ដើម្បីដឹងតម្លៃជាក់ស្តែងភ្លាមៗ។ គ្មានការកាត់កម្រៃជើងសារ ២០% ដូចកម្មវិធីពាណិជ្ជកម្មដទៃឡើយ!'
                  : 'Enter parcel weight (kg) and delivery distance (km) for instant transparent pricing with zero middleman deductions.'}
              </p>
            </div>
          </div>

          {/* 0% Commission Badge */}
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-emerald-400/40 text-left shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isKm ? 'ធានាតម្លៃផ្ទាល់ជូនអ្នកដឹក' : '100% Direct to Drivers'}</span>
            </div>
            <div className="text-xs font-black text-white mt-0.5">
              {isKm ? 'សន្សំបាន ២០% - ២៥% គ្រប់ជើង' : 'Save 20% - 25% on every shipment'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Controls & Estimation Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Two-Column Inputs: Weight & Distance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Weight Input Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>{isKm ? '១. ទម្ងន់ឥវ៉ាន់ (Weight in kg)' : '1. Parcel Weight (kg)'}</span>
              </label>
              <span className="font-mono font-black text-base sm:text-lg text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-xl border border-emerald-300">
                {weightKg} kg
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            {/* Quick Weight Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{isKm ? 'រហ័ស៖' : 'Quick:'}</span>
              {PRESET_WEIGHTS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeightKg(w)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    weightKg === w
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {w}kg
                </button>
              ))}
            </div>
          </div>

          {/* 2. Distance Input Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{isKm ? '២. ចម្ងាយដឹកជញ្ជូន (Distance in km)' : '2. Delivery Distance (km)'}</span>
              </label>
              <span className="font-mono font-black text-base sm:text-lg text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-xl border border-blue-300">
                {distanceKm} km
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="1"
              max="600"
              step="1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Quick Distance Route Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {PRESET_DISTANCES.map((p) => (
                  <option key={p.km} value={p.km}>
                    {isKm ? p.labelKm : p.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Package Category Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider mr-2">
            {isKm ? 'ប្រភេទឥវ៉ាន់៖' : 'Package Type:'}
          </span>
          {[
            { id: 'general', labelEn: 'General Box', labelKm: 'ប្រអប់ទូទៅ', icon: '📦' },
            { id: 'fragile', labelEn: 'Fragile / Electronic', labelKm: 'របស់បែកបាក់', icon: '⚠️' },
            { id: 'food_cold', labelEn: 'Food / Perishable', labelKm: 'ម្ហូប / ត្រជាក់', icon: '🥬' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setPackageType(type.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                packageType === type.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{type.icon}</span>
              <span>{isKm ? type.labelKm : type.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Real-Time Cost Breakdown & 0% Commission Comparison Card */}
        {activeVehicle && (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border-2 border-emerald-300 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left: Estimated Fare & Savings Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-lg">
                    {isKm ? activeVehicle.nameKm : activeVehicle.nameEn}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    ({weightKg} kg • {distanceKm} km • {activeVehicle.etaLabelEn})
                  </span>
                </div>

                <div className="flex items-baseline gap-3 flex-wrap">
                  <div>
                    <span className="text-xs text-slate-500 block">
                      {isKm ? 'តម្លៃកម្មវិធី CamDelivery (កម្រៃជើងសារ 0%)៖' : 'CamDelivery Fair Rate (0% Commission):'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                      {formatMoney(activeVehicle.priceKHR, activeVehicle.priceUSD)}
                    </span>
                  </div>

                  {/* Strikethrough Commercial App Comparison */}
                  <div className="pl-3 border-l border-emerald-300/80">
                    <span className="text-[11px] text-slate-400 block line-through">
                      {isKm ? 'កម្មវិធីពាណិជ្ជកម្មដទៃ (+២០%)៖ ' : 'Commercial Broker Apps (+20% fee): '}
                      {formatMoney(activeVehicle.priceKHR + activeVehicle.commercialMarkupKHR, activeVehicle.priceUSD + activeVehicle.savingsUSD)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 bg-emerald-200/90 px-2 py-0.5 rounded-md">
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {isKm
                          ? `សន្សំបាន ${formatMoney(activeVehicle.savingsKHR, activeVehicle.savingsUSD)}`
                          : `You Save ${formatMoney(activeVehicle.savingsKHR, activeVehicle.savingsUSD)} (0% Fee)`}
                      </span>
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-900 leading-relaxed max-w-xl">
                  {isKm
                    ? '✨ ទឹកប្រាក់ ១០០% ត្រូវបានផ្ទេរដោយផ្ទាល់ទៅកាន់អ្នកបើកបរ/អ្នកដឹកជញ្ជូន តាមរយៈ Bakong KHQR ដោយគ្មានការកាត់កម្រៃជើងសារឡើយ។'
                    : '✨ 100% of this fee goes directly to local Cambodian couriers via Bakong KHQR with zero middleman deductions.'}
                </p>
              </div>

              {/* Right: Booking CTA */}
              <div className="flex items-center gap-2.5 shrink-0">
                {onBookEstimate && (
                  <button
                    type="button"
                    onClick={handleBookNow}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isKm ? 'កក់ដឹកជញ្ជូនភ្លាមៗ (កម្រៃ 0%)' : 'Book with 0% Commission'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Rates Across All Cambodian Vehicles Grid */}
        <div>
          <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>{isKm ? 'ជម្រើសយានយន្ត និងមធ្យោបាយដឹកជញ្ជូន' : 'Estimated Rates by Cambodian Transport Mode'}</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {calculatedVehicles.map((v) => {
              const isSelected = selectedVehicleId === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`p-4 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {v.iconType === 'moto' && <Car className="w-4 h-4" />}
                          {v.iconType === 'tuktuk' && <Truck className="w-4 h-4" />}
                          {v.iconType === 'van' && <Truck className="w-4 h-4" />}
                          {v.iconType === 'door' && <Package className="w-4 h-4" />}
                          {v.iconType === 'cold' && <Zap className="w-4 h-4" />}
                        </div>
                        <span className="font-extrabold text-xs text-slate-900">
                          {isKm ? v.nameKm : v.nameEn}
                        </span>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mb-2 line-clamp-1">
                      {isKm ? v.categoryKm : v.categoryEn}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {isKm ? 'តម្លៃ 0% កម្រៃ៖' : '0% Commission Fare:'}
                      </span>
                      <span className="font-mono font-black text-sm text-emerald-950">
                        {formatMoney(v.priceKHR, v.priceUSD)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        {isKm ? `សន្សំ ${formatMoney(v.savingsKHR, v.savingsUSD)}` : `Save ${formatMoney(v.savingsKHR, v.savingsUSD)}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {isKm ? v.etaLabelKm : v.etaLabelEn}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 0% Commission Benefit Comparison Table & Reassurance */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
            <h5 className="font-bold text-white">
              {isKm ? 'ហេតុអ្វី CamDelivery ផ្តល់អត្ថប្រយោជន៍ 0% កម្រៃជើងសារ?' : 'Why 0% Commission Benefits Everyone in Cambodia'}
            </h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <strong className="text-emerald-300 block mb-0.5">
                {isKm ? '១. អ្នកផ្ញើចំណេញប្រាក់' : '1. Senders Save 20%'}
              </strong>
              <span>
                {isKm
                  ? 'គ្មានការបូកបន្ថែមថ្លៃ Platform Markup ១៥%-២៥%។ អ្នកបង់ត្រឹមតែថ្លៃសាំង និងថ្លៃដឹកជាក់ស្តែង។'
                  : 'No 15%-25% platform markup added to your shipping quote.'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <strong className="text-teal-300 block mb-0.5">
                {isKm ? '២. អ្នកដឹកជញ្ជូនទទួល ១០០%' : '2. Couriers Earn 100%'}
              </strong>
              <span>
                {isKm
                  ? 'អ្នករត់ម៉ូតូ និងឡានវ៉ែនទទួលបានកម្រៃពេញលេញ គ្មានការកាត់ប្រាក់ ជួយលើកកម្ពស់ជីវភាពប្រជាជន។'
                  : 'Riders and van drivers keep 100% of deliveries to support their families.'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <strong className="text-amber-300 block mb-0.5">
                {isKm ? '៣. គាំទ្រសេដ្ឋកិច្ចជាតិ' : '3. National Digital Public Good'}
              </strong>
              <span>
                {isKm
                  ? 'ទូទាត់តាមប្រព័ន្ធ Bakong KHQR ផ្ទាល់ និងមិនបញ្ជូនប្រាក់កម្រៃជើងសារទៅក្រៅប្រទេស។'
                  : 'Direct Bakong KHQR settlements without sending platform commissions overseas.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
