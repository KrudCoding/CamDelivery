import React, { useState, useMemo } from 'react';
import {
  Package,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Box,
  Scale,
  Maximize2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  Truck,
  RotateCcw,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Language, Currency } from '../types';

interface SmartPackagingToolProps {
  language: Language;
  currency: Currency;
  onNavigateTab: (tabId: 'map' | 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
  onNotify?: (message: string) => void;
}

interface PackagingRecommendation {
  recommendedBox: {
    sizeCode: string;
    boxDimensionsCm: { length: number; width: number; height: number };
    boxNameEn: string;
    boxNameKm: string;
  };
  metrics: {
    boxVolumeCm3: number;
    itemVolumeCm3: number;
    spaceUtilizationPct: number;
    bufferSpacePct: number;
    volumetricWeightKg: number;
    chargeableWeightKg: number;
  };
  cushioning: {
    materialEn: string;
    materialKm: string;
    layersNeeded: number;
  };
  estimatedPriceKHR: number;
  estimatedPriceUSD: number;
  aiAdviceEn: string;
  aiAdviceKm: string;
}

const ITEM_PRESETS = [
  { id: 'phone', labelKm: '📱 ទូរស័ព្ទ / ឧបករណ៍អេឡិចត្រូនិក', labelEn: '📱 Phone & Gadgets', l: 18, w: 10, h: 5, weight: 0.5, fragile: true },
  { id: 'shoes', labelKm: '👟 ស្បែកជើង / សម្លៀកបំពាក់', labelEn: '👟 Shoes & Apparel', l: 32, w: 20, h: 12, weight: 1.2, fragile: false },
  { id: 'laptop', labelKm: '💻 កុំព្យូទ័រយួរដៃ Laptop', labelEn: '💻 Laptop & Tablet', l: 38, w: 26, h: 6, weight: 2.2, fragile: true },
  { id: 'ceramic', labelKm: '🍶 វត្ថុអនុស្សាវរីយ៍ / គ្រឿងកុលាលភាជន៍', labelEn: '🍶 Ceramic & Glassware', l: 22, w: 18, h: 18, weight: 1.8, fragile: true },
  { id: 'food', labelKm: '🥭 ផ្លែឈើ / អាហារក្រៀម', labelEn: '🥭 Fresh Fruit / Produce', l: 28, w: 22, h: 15, weight: 3.5, fragile: false },
];

export const SmartPackagingTool: React.FC<SmartPackagingToolProps> = ({
  language,
  currency,
  onNavigateTab,
  onNotify,
}) => {
  const isKm = language === 'km';

  // Input states
  const [lengthCm, setLengthCm] = useState<number>(25);
  const [widthCm, setWidthCm] = useState<number>(18);
  const [heightCm, setHeightCm] = useState<number>(12);
  const [weightKg, setWeightKg] = useState<number>(1.5);
  const [itemType, setItemType] = useState<string>('shoes');
  const [isFragile, setIsFragile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PackagingRecommendation | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>('gemini-3.8-flash');

  // Apply quick preset
  const handleApplyPreset = (preset: typeof ITEM_PRESETS[0]) => {
    setItemType(preset.id);
    setLengthCm(preset.l);
    setWidthCm(preset.w);
    setHeightCm(preset.h);
    setWeightKg(preset.weight);
    setIsFragile(preset.fragile);
  };

  // Perform AI packaging analysis
  const handleCalculatePackaging = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/smart-packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lengthCm,
          widthCm,
          heightCm,
          weightKg,
          itemType: ITEM_PRESETS.find((p) => p.id === itemType)?.labelEn || 'Merchandise',
          isFragile,
          language,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          setResult(json.data);
          setEngineUsed(json.engine || 'gemini-3.8-flash');
          if (onNotify) {
            onNotify(
              isKm
                ? `✨ AI បានគណនាទំហំប្រអប់ ${json.data.recommendedBox.boxNameKm} ដោយជោគជ័យ!`
                : `✨ AI packaging analysis complete: ${json.data.recommendedBox.boxNameEn}`
            );
          }
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API call fallback to algorithmic packaging:', err);
    }

    // Client-side fallback calculation
    const clearance = isFragile ? 3 : 2;
    const boxL = Math.max(lengthCm + clearance * 2, 20);
    const boxW = Math.max(widthCm + clearance * 2, 15);
    const boxH = Math.max(heightCm + clearance * 2, 10);
    const boxVol = boxL * boxW * boxH;
    const itemVol = lengthCm * widthCm * heightCm;
    const utilPct = Math.min(85, Math.max(35, Math.round((itemVol / boxVol) * 100)));
    const volKg = Math.round(((boxL * boxW * boxH) / 5000) * 10) / 10;
    const chargeable = Math.max(weightKg, volKg);

    let sizeCode = 'Box S';
    let boxNameEn = 'CamBox Size S (Small Parcel)';
    let boxNameKm = 'ប្រអប់ទំហំ S (កញ្ចប់តូច)';
    if (boxVol > 30000) {
      sizeCode = 'Box XL';
      boxNameEn = 'CamBox Size XL (Heavy Freight)';
      boxNameKm = 'ប្រអប់ទំហំ XL (ទំនិញធ្ងន់)';
    } else if (boxVol > 15000) {
      sizeCode = 'Box L';
      boxNameEn = 'CamBox Size L (Medium-Large)';
      boxNameKm = 'ប្រអប់ទំហំ L (មធ្យមធំ)';
    } else if (boxVol > 6000) {
      sizeCode = 'Box M';
      boxNameEn = 'CamBox Size M (Standard)';
      boxNameKm = 'ប្រអប់ទំហំ M (ស្តង់ដារ)';
    }

    const priceKHR = Math.round(5000 + chargeable * 1800);
    const priceUSD = Math.round((priceKHR / 4100) * 10) / 10;

    setResult({
      recommendedBox: {
        sizeCode,
        boxDimensionsCm: { length: boxL, width: boxW, height: boxH },
        boxNameEn,
        boxNameKm,
      },
      metrics: {
        boxVolumeCm3: boxVol,
        itemVolumeCm3: itemVol,
        spaceUtilizationPct: utilPct,
        bufferSpacePct: 100 - utilPct,
        volumetricWeightKg: volKg,
        chargeableWeightKg: chargeable,
      },
      cushioning: {
        materialEn: isFragile ? '2 Layers 10mm Bubble Wrap + Foam Corners' : 'Standard 10mm Bubble Wrap',
        materialKm: isFragile ? 'ផ្លាស្ទិកពពុះខ្យល់ ២ ជាន់ + ប៉ុងការពារជ្រុង' : 'ផ្លាស្ទិកពពុះខ្យល់ ១០មម ស្តង់ដារ',
        layersNeeded: isFragile ? 2 : 1,
      },
      estimatedPriceKHR: priceKHR,
      estimatedPriceUSD: priceUSD,
      aiAdviceEn: `Pack using H-taping on all seams. Maintain ${100 - utilPct}% buffer space filled with cushioning for zero movement inside van cargo.`,
      aiAdviceKm: `សូមបិទស្កុតរាងអក្សរ H លើស្នាមតភ្ជាប់ទាំងអស់។ រក្សាគម្លាតសុវត្ថិភាព ${100 - utilPct}% ដោយញាត់ពពុះខ្យល់ការពារកុំឲ្យកញ្ចប់រង្គើពេលឡានវ៉ែនរត់ផ្លូវជាតិ។`,
    });
    setEngineUsed('smart-volumetric-engine');
    setIsLoading(false);
  };

  // Initial calculation on first render if no result
  useState(() => {
    handleCalculatePackaging();
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {isKm ? 'ឧបករណ៍វេចខ្ចប់ឆ្លាតវៃ (AI Smart Packaging)' : 'AI Smart Packaging & Box Size Optimizer'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                <span>AI Powered</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isKm
                ? 'គណនាទំហំប្រអប់ល្អបំផុតដោយស្វ័យប្រវត្ត គម្លាតសុវត្ថិភាព និងទម្ងន់មាឌ (Volumetric Weight) ដើម្បីកាត់បន្ថយថ្លៃដឹក'
                : 'Calculate optimal carton sizes, 3D space utilization, and volumetric weight to minimize shipping costs'}
            </p>
          </div>
        </div>

        {/* Engine status pill */}
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          Engine: {engineUsed}
        </span>
      </div>

      {/* Item Presets Shortcuts */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          {isKm ? 'ជ្រើសរើសប្រភេទឥវ៉ាន់គំរូរហ័ស (Quick Presets):' : 'Quick Item Presets:'}
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {ITEM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 border ${
                itemType === preset.id
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 border-slate-900 dark:border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {isKm ? preset.labelKm : preset.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Dimension & Weight Form */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
            {isKm ? 'បណ្តោយ (Length cm)' : 'Length (cm)'}
          </label>
          <input
            type="number"
            min="1"
            max="200"
            value={lengthCm}
            onChange={(e) => setLengthCm(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
            {isKm ? 'ទទឹង (Width cm)' : 'Width (cm)'}
          </label>
          <input
            type="number"
            min="1"
            max="200"
            value={widthCm}
            onChange={(e) => setWidthCm(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
            {isKm ? 'កម្ពស់ (Height cm)' : 'Height (cm)'}
          </label>
          <input
            type="number"
            min="1"
            max="200"
            value={heightCm}
            onChange={(e) => setHeightCm(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
            {isKm ? 'ទម្ងន់ជាក់ស្តែង (Weight kg)' : 'Gross Weight (kg)'}
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="100"
            value={weightKg}
            onChange={(e) => setWeightKg(Math.max(0.1, Number(e.target.value)))}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Fragile Switch & Calculate CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={isFragile}
            onChange={(e) => setIsFragile(e.target.checked)}
            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
          />
          <span>{isKm ? '⚠️ ទំនិញងាយបែក ឬផុយស្រួយ (ត្រូវការគម្លាតការពារ ២-៣cm បន្ថែម)' : '⚠️ Fragile item (Requires extra 3cm safety buffer)'}</span>
        </label>

        <button
          type="button"
          onClick={handleCalculatePackaging}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? (isKm ? 'AI កំពុងគណនា...' : 'AI Analyzing...') : (isKm ? 'គណនាទំហំប្រអប់ជាមួយ AI' : 'Run AI Packaging Analysis')}</span>
        </button>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
          {/* Main Recommendation Highlight Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white border border-slate-700 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {isKm ? 'ប្រអប់ដែល AI ណែនាំសមស្របបំផុត' : 'AI Optimal Box Recommendation'}
                </span>
                <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                  {isKm ? result.recommendedBox.boxNameKm : result.recommendedBox.boxNameEn}
                </h4>
                <div className="text-xs text-slate-300 mt-0.5">
                  {isKm ? 'វិមាត្រប្រអប់៖ ' : 'Carton Dimensions: '}
                  <strong className="text-amber-300 font-mono">
                    {result.recommendedBox.boxDimensionsCm.length} × {result.recommendedBox.boxDimensionsCm.width} × {result.recommendedBox.boxDimensionsCm.height} cm
                  </strong>
                </div>
              </div>

              <div className="text-right self-start sm:self-auto">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {isKm ? 'ថ្លៃដឹកជញ្ជូនប៉ាន់ស្មាន' : 'Estimated Shipping'}
                </span>
                <span className="text-base sm:text-xl font-black text-emerald-400">
                  {currency === 'KHR'
                    ? `${result.estimatedPriceKHR.toLocaleString()} ៛`
                    : `$${result.estimatedPriceUSD}`}
                </span>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {isKm ? 'កន្លែងប្រើប្រាស់ (Filled)' : 'Space Utilized'}
                </span>
                <span className="text-base font-black text-white">
                  {result.metrics.spaceUtilizationPct}%
                </span>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${result.metrics.spaceUtilizationPct}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {isKm ? 'គម្លាតសុវត្ថិភាព (Buffer)' : 'Buffer Space'}
                </span>
                <span className="text-base font-black text-amber-300">
                  {result.metrics.bufferSpacePct}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isKm ? 'សម្រាប់ប៉ុង/ពពុះខ្យល់' : 'For protective cushioning'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {isKm ? 'ទម្ងន់មាឌ (Volumetric)' : 'Volumetric Wt.'}
                </span>
                <span className="text-base font-black text-white">
                  {result.metrics.volumetricWeightKg} kg
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  (L×W×H)/5000 formula
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {isKm ? 'ទម្ងន់គិតថ្លៃ (Chargeable)' : 'Chargeable Wt.'}
                </span>
                <span className="text-base font-black text-emerald-400">
                  {result.metrics.chargeableWeightKg} kg
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  max(actual, volumetric)
                </span>
              </div>
            </div>

            {/* AI Advice & Cushioning Banner */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-700 text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isKm ? 'ការការពារដែលណែនាំ៖ ' : 'Recommended Cushioning: '}</span>
                <span className="text-white font-normal">
                  {isKm ? result.cushioning.materialKm : result.cushioning.materialEn}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                💡 {isKm ? result.aiAdviceKm : result.aiAdviceEn}
              </p>
            </div>
          </div>

          {/* Action Button: Book with this box size */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isKm ? 'ចំណេញកន្លែង និងកាត់បន្ថយការខូចខាតទំនិញ ១០០%' : 'Optimized packing reduces cargo damage & excess weight fees'}
            </span>

            <button
              type="button"
              onClick={() => onNavigateTab('courier')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>{isKm ? 'ផ្ញើឥវ៉ាន់ជាមួយទំហំប្រអប់នេះ' : 'Ship with this Box Size'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
