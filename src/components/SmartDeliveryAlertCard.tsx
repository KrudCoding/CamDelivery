import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';
import { Language } from '../types';

interface SmartDeliveryAlertCardProps {
  language: Language;
  onApplyOptimalWindow?: (timeSlotId: string, timeLabel: string) => void;
  onNotify?: (msg: string) => void;
  className?: string;
}

interface RegionCongestionData {
  id: string;
  nameEn: string;
  nameKm: string;
  bottlenecksEn: string;
  bottlenecksKm: string;
  peakHours: string;
  peakHoursKm: string;
  optimalSlotId: string;
  optimalWindowEn: string;
  optimalWindowKm: string;
  timeSavedMin: number;
  efficiencyRating: number;
  hourlyCongestion: { hour: string; level: number }[];
}

const REGION_DATA: RegionCongestionData[] = [
  {
    id: 'phnom-penh',
    nameEn: 'Phnom Penh Metropolitan',
    nameKm: 'រាជធានីភ្នំពេញ (ក្រុងភ្នំពេញ)',
    bottlenecksEn: 'Russian Blvd, St 271, Monivong Blvd & Veng Sreng',
    bottlenecksKm: 'មហាវិថីសហព័ន្ធរុស្ស៊ី, ផ្លូវ ២៧១, មហាវិថីព្រះមុនីវង្ស & វេងស្រេង',
    peakHours: '07:15 AM - 08:45 AM & 05:00 PM - 06:45 PM',
    peakHoursKm: '០៧:១៥ ព្រឹក - ០៨:៤៥ ព្រឹក & ០៥:០០ ល្ងាច - ០៦:៤៥ ល្ងាច',
    optimalSlotId: 'morning_09_11',
    optimalWindowEn: '09:30 AM - 11:30 AM (Low Traffic Window)',
    optimalWindowKm: '០៩:៣០ ព្រឹក - ១១:៣០ ព្រឹក (ចរាចរណ៍រលូនបំផុត)',
    timeSavedMin: 42,
    efficiencyRating: 95,
    hourlyCongestion: [
      { hour: '7am', level: 5 },
      { hour: '8am', level: 5 },
      { hour: '9am', level: 3 },
      { hour: '10am', level: 1 },
      { hour: '11am', level: 1 },
      { hour: '12pm', level: 2 },
      { hour: '2pm', level: 2 },
      { hour: '3pm', level: 2 },
      { hour: '5pm', level: 5 },
      { hour: '6pm', level: 5 },
    ],
  },
  {
    id: 'siem-reap',
    nameEn: 'Siem Reap Town & Ring Road',
    nameKm: 'ក្រុងសៀមរាប & ផ្លូវវាងក្រុង',
    bottlenecksEn: 'Sivutha Blvd, Old Market & Heritage Corridor',
    bottlenecksKm: 'មហាវិថីស៊ីវត្ថា, ផ្សារចាស់ & ផ្លូវរមណីយដ្ឋាន',
    peakHours: '08:00 AM - 09:30 AM & 04:30 PM - 06:00 PM',
    peakHoursKm: '០៨:០០ ព្រឹក - ០៩:៣០ ព្រឹក & ០៤:៣០ ល្ងាច - ០៦:០០ ល្ងាច',
    optimalSlotId: 'afternoon_14_16',
    optimalWindowEn: '02:00 PM - 04:00 PM (Afternoon Express)',
    optimalWindowKm: '០២:០០ រសៀល - ០៤:០០ រសៀល (ជើងរសៀលល្បឿនលឿន)',
    timeSavedMin: 28,
    efficiencyRating: 92,
    hourlyCongestion: [
      { hour: '7am', level: 2 },
      { hour: '8am', level: 4 },
      { hour: '9am', level: 3 },
      { hour: '10am', level: 2 },
      { hour: '11am', level: 2 },
      { hour: '12pm', level: 2 },
      { hour: '2pm', level: 1 },
      { hour: '3pm', level: 1 },
      { hour: '5pm', level: 4 },
      { hour: '6pm', level: 4 },
    ],
  },
  {
    id: 'battambang',
    nameEn: 'Battambang National Road 5',
    nameKm: 'ខេត្តបាត់ដំបង (ច្រកផ្លូវជាតិលេខ ៥)',
    bottlenecksEn: 'Riverside Bridge & Svay Pao Market Crossing',
    bottlenecksKm: 'ស្ពានមាត់ស្ទឹង & កំណាត់ផ្សារស្វាយប៉ោ',
    peakHours: '07:30 AM - 09:00 AM & 05:00 PM - 06:15 PM',
    peakHoursKm: '០៧:៣០ ព្រឹក - ០៩:០០ ព្រឹក & ០៥:០០ ល្ងាច - ០៦:១៥ ល្ងាច',
    optimalSlotId: 'morning_09_11',
    optimalWindowEn: '09:00 AM - 11:00 AM (Depot Departure Run)',
    optimalWindowKm: '០៩:០០ ព្រឹក - ១១:០០ ព្រឹក (ជើងចេញឡានស្ថានីយ៍)',
    timeSavedMin: 35,
    efficiencyRating: 94,
    hourlyCongestion: [
      { hour: '7am', level: 3 },
      { hour: '8am', level: 4 },
      { hour: '9am', level: 2 },
      { hour: '10am', level: 1 },
      { hour: '11am', level: 1 },
      { hour: '12pm', level: 2 },
      { hour: '2pm', level: 2 },
      { hour: '3pm', level: 2 },
      { hour: '5pm', level: 4 },
      { hour: '6pm', level: 4 },
    ],
  },
];

export const SmartDeliveryAlertCard: React.FC<SmartDeliveryAlertCardProps> = ({
  language,
  onApplyOptimalWindow,
  onNotify,
  className = '',
}) => {
  const isKm = language === 'km';
  const [selectedRegionId, setSelectedRegionId] = useState<string>('phnom-penh');

  const activeRegion = useMemo(() => {
    return REGION_DATA.find((r) => r.id === selectedRegionId) || REGION_DATA[0];
  }, [selectedRegionId]);

  const handleApply = () => {
    if (onApplyOptimalWindow) {
      onApplyOptimalWindow(activeRegion.optimalSlotId, isKm ? activeRegion.optimalWindowKm : activeRegion.optimalWindowEn);
    }
    if (onNotify) {
      onNotify(
        isKm
          ? `បានអនុវត្តចន្លោះម៉ោងល្អបំផុត (${activeRegion.optimalWindowKm}) ជៀសវាងការស្ទះចរាចរណ៍!`
          : `Applied optimal pickup window (${activeRegion.optimalWindowEn}) to avoid traffic!`
      );
    }
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 md:p-6 border border-indigo-500/30 shadow-md space-y-4 relative overflow-hidden ${className}`}>
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 pb-3 border-b border-indigo-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center font-bold shadow-inner shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm md:text-base text-white">
                {isKm ? 'AI ណែនាំម៉ោងមកយកឥវ៉ាន់ល្អបំផុត (Smart Delivery Alert)' : 'AI Smart Delivery Alert • Avoid Traffic'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isKm ? 'វិភាគចរាចរណ៍ AI' : 'Live Traffic AI'}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              {isKm
                ? 'ប្រព័ន្ធ AI វិភាគទិន្នន័យចរាចរណ៍ប្រវត្តិសាស្ត្រ ដើម្បីណែនាំចន្លោះម៉ោងមកយកកញ្ចប់ឥវ៉ាន់លឿនបំផុត'
                : 'Analyzes regional traffic patterns & historical delivery logs to suggest optimal low-congestion pickup windows.'}
            </p>
          </div>
        </div>

        {/* Region Switcher */}
        <select
          value={selectedRegionId}
          onChange={(e) => setSelectedRegionId(e.target.value)}
          className="bg-indigo-950/80 border border-indigo-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-400 self-start sm:self-auto cursor-pointer"
        >
          {REGION_DATA.map((r) => (
            <option key={r.id} value={r.id} className="bg-slate-900 text-white">
              {isKm ? r.nameKm : r.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Main Analysis Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10">
        {/* Recommendation Box (7 columns) */}
        <div className="md:col-span-7 bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-extrabold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isKm ? 'ចន្លោះម៉ោងណែនាំ (Recommended Pickup Window)' : 'Recommended Pickup Window'}</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                {activeRegion.efficiencyRating}% {isKm ? 'ប្រសិទ្ធភាព' : 'Efficiency'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="font-extrabold text-sm sm:text-base text-emerald-300 block">
                ⭐ {isKm ? activeRegion.optimalWindowKm : activeRegion.optimalWindowEn}
              </span>
              <p className="text-[11px] text-slate-300 mt-1">
                {isKm
                  ? `ជៀសវាងការកកស្ទះលើ៖ ${activeRegion.bottlenecksKm}។ សន្សំសំចៃពេលវេលាដឹកប្រមាណ ${activeRegion.timeSavedMin} នាទី!`
                  : `Bypasses congestion bottlenecks on: ${activeRegion.bottlenecksEn}. Saves approx ${activeRegion.timeSavedMin} mins!`}
              </p>
            </div>

            {/* Peak traffic warning */}
            <div className="flex items-center gap-2 text-[11px] text-amber-300/90 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {isKm
                  ? `ម៉ោងកកស្ទះខ្ពស់៖ ${activeRegion.peakHoursKm}`
                  : `Peak congestion window: ${activeRegion.peakHours}`}
              </span>
            </div>
          </div>

          {/* 1-Click Apply Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleApply}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-98 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>{isKm ? 'កំណត់ចន្លោះម៉ោងនេះក្នុងកាលវិភាគកក់' : 'Apply Optimal Window to Schedule'}</span>
            </button>
          </div>
        </div>

        {/* Hourly Congestion Chart (5 columns) */}
        <div className="md:col-span-5 bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-extrabold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isKm ? 'កម្រិតកកស្ទះតាមម៉ោង' : 'Hourly Traffic Profile'}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {isKm ? 'ទាប ➔ ខ្ពស់' : 'Low ➔ High'}
              </span>
            </div>

            {/* Congestion Bars */}
            <div className="flex items-end justify-between gap-1 pt-4 h-24">
              {activeRegion.hourlyCongestion.map((slot, i) => {
                const heightPercent = slot.level * 20;
                const isOptimal = slot.level === 1;
                const isHeavy = slot.level >= 4;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isOptimal
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                          : isHeavy
                          ? 'bg-rose-500'
                          : 'bg-indigo-400/60'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      title={`${slot.hour}: Level ${slot.level}/5`}
                    />
                    <span className="text-[9px] font-mono text-slate-400">{slot.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{isKm ? 'រលូនបំផុត' : 'Optimal'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>{isKm ? 'មធ្យម' : 'Moderate'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{isKm ? 'ស្ទះខ្លាំង' : 'Heavy'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
