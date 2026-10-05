import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Navigation, 
  Gauge, 
  MapPin, 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  CloudRain,
  ShieldCheck
} from 'lucide-react';
import { TrackingItem, Language } from '../types';

interface EtaDistanceCalculatorProps {
  shipment: TrackingItem;
  currentCourierCoords?: { lat: number; lng: number };
  language: Language;
  className?: string;
  showCard?: boolean;
}

// Haversine formula with realistic road curvature factor (1.28x)
function calculateRoadDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;
  // Apply highway winding factor of 1.28
  return Math.max(0.5, Number((straightLineKm * 1.28).toFixed(1)));
}

export const EtaDistanceCalculator: React.FC<EtaDistanceCalculatorProps> = ({
  shipment,
  currentCourierCoords,
  language,
  className = '',
  showCard = false,
}) => {
  const isKm = language === 'km';
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [customSpeedKmH, setCustomSpeedKmH] = useState<number>(
    shipment.status === 'out_for_delivery' ? 35 : 65
  );
  const [trafficBufferMin, setTrafficBufferMin] = useState<number>(10);

  // Determine current coordinates
  const courierLat = currentCourierCoords?.lat ?? shipment.routeCoordinates.current.lat;
  const courierLng = currentCourierCoords?.lng ?? shipment.routeCoordinates.current.lng;

  // Determine destination coordinates
  const destLat = shipment.routeCoordinates.end.lat;
  const destLng = shipment.routeCoordinates.end.lng;

  // Calculate distance between courier and destination
  const remainingDistanceKm = useMemo(() => {
    if (shipment.status === 'delivered') return 0;
    return calculateRoadDistanceKm(courierLat, courierLng, destLat, destLng);
  }, [courierLat, courierLng, destLat, destLng, shipment.status]);

  // Compute duration based on distance and speed
  const calculation = useMemo(() => {
    if (shipment.status === 'delivered') {
      return {
        hours: 0,
        minutes: 0,
        totalMinutes: 0,
        arrivalClockStr: isKm ? 'បានប្រគល់រួចរាល់' : 'Delivered',
        arrivalClockStrKm: 'បានប្រគល់រួចរាល់',
      };
    }

    // Base transit minutes: (distance / speed) * 60
    const rawTransitMinutes = (remainingDistanceKm / Math.max(15, customSpeedKmH)) * 60;
    const totalMinutes = Math.max(5, Math.round(rawTransitMinutes + trafficBufferMin));

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Projected arrival clock
    const arrivalDate = new Date(Date.now() + totalMinutes * 60 * 1000);
    const hours12 = arrivalDate.getHours() % 12 || 12;
    const minsStr = arrivalDate.getMinutes().toString().padStart(2, '0');
    const ampm = arrivalDate.getHours() >= 12 ? 'PM' : 'AM';
    const ampmKm = arrivalDate.getHours() >= 12 ? 'រសៀល/ល្ងាច' : 'ព្រឹក';

    const arrivalClockStr = `${hours12}:${minsStr} ${ampm}`;
    const arrivalClockStrKm = `ម៉ោង ${hours12}:${minsStr} ${ampmKm}`;

    return {
      hours,
      minutes,
      totalMinutes,
      arrivalClockStr,
      arrivalClockStrKm,
    };
  }, [remainingDistanceKm, customSpeedKmH, trafficBufferMin, shipment.status, isKm]);

  // Format Duration string
  const durationLabel = useMemo(() => {
    if (shipment.status === 'delivered') {
      return isKm ? 'បានមកដល់រួចរាល់' : 'Delivered';
    }
    if (calculation.hours > 0) {
      return isKm
        ? `~${calculation.hours} ម៉ោង ${calculation.minutes} នាទី`
        : `~${calculation.hours}h ${calculation.minutes}m`;
    }
    return isKm ? `~${calculation.minutes} នាទី` : `~${calculation.minutes} mins`;
  }, [calculation, isKm, shipment.status]);

  if (shipment.status === 'delivered') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>{isKm ? 'បានដឹកដល់គោលដៅ' : 'Arrived at Destination'}</span>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Sleek ETA Badge (Rendered next to delivery status) */}
      <button
        type="button"
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 hover:from-blue-500/20 hover:to-emerald-500/20 text-slate-800 dark:text-slate-100 border border-blue-300/80 dark:border-blue-700/80 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer group"
        title={isKm ? 'ចុចដើម្បីពិនិត្យម៉ាស៊ីនគណនា ETA និងចម្ងាយ' : 'Click to inspect dynamic ETA Distance Calculator'}
      >
        <div className="relative flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:rotate-45 transition-transform" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <span className="text-blue-700 dark:text-blue-300 font-extrabold uppercase text-[10px] tracking-wide">
          ETA:
        </span>
        <span className="font-black text-slate-900 dark:text-white font-mono">
          {durationLabel}
        </span>

        <span className="text-slate-400 dark:text-slate-500 text-[10px] hidden sm:inline">
          ({remainingDistanceKm} km • {isKm ? calculation.arrivalClockStrKm : calculation.arrivalClockStr})
        </span>

        <Calculator className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition ml-0.5" />
      </button>

      {/* Interactive Popover Modal / Calculator Card */}
      {isPopoverOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-80 sm:w-88 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{isKm ? 'ម៉ាស៊ីនគណនា ETA ផ្ទាល់ (Distance Calculator)' : 'Live ETA Distance Calculator'}</span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isKm ? 'គណនារយៈពេលផ្អែកលើចម្ងាយរវាងអ្នកដឹក និងអ្នកទទួល' : 'Computes duration from live courier distance to destination'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPopoverOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-md text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Computed Highlight */}
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 border border-blue-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                {isKm ? 'ពេលវេលាមកដល់ប៉ាន់ស្មាន' : 'Expected Arrival Time'}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px]">
                ● {isKm ? 'គណនាជាក់ស្តែង' : 'Real-Time Sync'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {isKm ? calculation.arrivalClockStrKm : calculation.arrivalClockStr}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                ({durationLabel})
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200/60 dark:border-slate-700/80 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>{isKm ? 'ចម្ងាយនៅសល់៖' : 'Remaining Distance:'}</span>
              </span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {remainingDistanceKm} km
              </strong>
            </div>
          </div>

          {/* Speed & Transit Simulator Adjuster */}
          <div className="mt-3 space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isKm ? 'ល្បឿនមធ្យមអ្នកដឹក' : 'Average Courier Speed'}:</span>
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {customSpeedKmH} km/h
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={customSpeedKmH}
                onChange={(e) => setCustomSpeedKmH(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                <span>City 20 km/h</span>
                <span>Highway 65 km/h</span>
                <span>Express 90 km/h</span>
              </div>
            </div>

            {/* Quick Speed Preset Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCustomSpeedKmH(65);
                  setTrafficBufferMin(10);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex-1 border ${
                  customSpeedKmH === 65
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isKm ? 'ផ្លូវជាតិ 65 km/h' : 'Highway (65)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomSpeedKmH(40);
                  setTrafficBufferMin(25);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex-1 border ${
                  customSpeedKmH === 40
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isKm ? 'ស្ទះ/ភ្លៀង 40 km/h' : 'Rain/Slow (40)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomSpeedKmH(30);
                  setTrafficBufferMin(5);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex-1 border ${
                  customSpeedKmH === 30
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isKm ? 'ក្នុងក្រុង 30 km/h' : 'City (30)'}
              </button>
            </div>

            {/* Formula Explanation Callout */}
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>📐 {isKm ? 'រូបមន្តគណនា៖' : 'Mathematical Formula:'}</span>
              </div>
              <p className="font-mono text-[9.5px]">
                Duration = ({remainingDistanceKm} km ÷ {customSpeedKmH} km/h) + {trafficBufferMin}m buffer = {durationLabel}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
