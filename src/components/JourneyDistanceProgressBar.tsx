import React, { useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Gauge, 
  Clock, 
  CheckCircle2, 
  Navigation, 
  Play, 
  Pause,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { TrackingItem, Language } from '../types';

interface JourneyDistanceProgressBarProps {
  shipment: TrackingItem;
  language: Language;
  progressPct: number; // 0 to 100
  currentSpeedKmH?: number;
  isLiveMoving?: boolean;
  onTogglePlayPause?: () => void;
  className?: string;
}

// Preset realistic Cambodian national highway route total distances (km)
const KNOWN_ROUTE_DISTANCES_KM: Record<string, number> = {
  'Phnom Penh to Siem Reap': 314,
  'Siem Reap to Phnom Penh': 314,
  'Phnom Penh to Battambang': 291,
  'Battambang to Phnom Penh': 291,
  'Phnom Penh to Kampot': 148,
  'Kampot to Phnom Penh': 148,
  'Phnom Penh to Sihanoukville': 230,
  'Sihanoukville to Phnom Penh': 230,
  'Phnom Penh to Kampong Cham': 124,
  'Kampong Cham to Phnom Penh': 124,
};

// Haversine road distance calculation with highway curvature factor
function getRouteTotalDistanceKm(shipment: TrackingItem): number {
  const fromCity = shipment.senderCity.split(' ')[0];
  const toCity = shipment.receiverCity.split(' ')[0];
  const key = `${fromCity} to ${toCity}`;

  if (KNOWN_ROUTE_DISTANCES_KM[key]) {
    return KNOWN_ROUTE_DISTANCES_KM[key];
  }

  // Calculate from coordinates if available
  const start = shipment.routeCoordinates.start;
  const end = shipment.routeCoordinates.end;
  if (start && end) {
    const R = 6371; // km
    const dLat = ((end.lat - start.lat) * Math.PI) / 180;
    const dLon = ((end.lng - start.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((start.lat * Math.PI) / 180) *
        Math.cos((end.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const directKm = R * c;
    return Math.max(15, Math.round(directKm * 1.28));
  }

  return 240; // reasonable interprovincial average
}

export const JourneyDistanceProgressBar: React.FC<JourneyDistanceProgressBarProps> = ({
  shipment,
  language,
  progressPct,
  currentSpeedKmH = 65,
  isLiveMoving = true,
  onTogglePlayPause,
  className = '',
}) => {
  const isKm = language === 'km';
  const isDelivered = shipment.status === 'delivered';
  const isPickedUp = shipment.status === 'picked_up';

  // Effective progress based on status overrides if needed
  const effectiveProgressPct = useMemo(() => {
    if (isDelivered) return 100;
    if (isPickedUp) return Math.min(progressPct, 15);
    return Math.max(0, Math.min(100, progressPct));
  }, [isDelivered, isPickedUp, progressPct]);

  // Total road distance in km
  const totalDistanceKm = useMemo(() => getRouteTotalDistanceKm(shipment), [shipment]);

  // Distance traveled and distance remaining based on percentage
  const completedDistanceKm = useMemo(() => {
    if (isDelivered) return totalDistanceKm;
    return Math.max(0, Number(((totalDistanceKm * effectiveProgressPct) / 100).toFixed(1)));
  }, [totalDistanceKm, effectiveProgressPct, isDelivered]);

  const remainingDistanceKm = useMemo(() => {
    if (isDelivered) return 0;
    return Math.max(0, Number((totalDistanceKm - completedDistanceKm).toFixed(1)));
  }, [totalDistanceKm, completedDistanceKm, isDelivered]);

  // Estimated remaining duration in hours and minutes
  const remainingTimeStr = useMemo(() => {
    if (isDelivered) return isKm ? 'បានមកដល់គោលដៅ' : 'Delivered';
    const effectiveSpeed = Math.max(25, currentSpeedKmH);
    const hours = remainingDistanceKm / effectiveSpeed;
    const totalMinutes = Math.round(hours * 60);

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h > 0) {
      return isKm ? `~${h} ម៉ោង ${m} នាទី` : `~${h}h ${m}m remaining`;
    }
    return isKm ? `~${m} នាទី` : `~${m} mins remaining`;
  }, [remainingDistanceKm, currentSpeedKmH, isDelivered, isKm]);

  const roundedPct = Math.round(effectiveProgressPct);

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden relative ${className}`}>
      {/* Background Subtle Accent Glow */}
      <div 
        className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <div 
        className="absolute bottom-0 left-0 w-64 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* Header Row: Title, Percentage Badge & Traveled Distance Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950/50 shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wide">
                {isKm ? 'ដំណើរការចម្ងាយផ្លូវធ្វើដំណើរ' : 'Journey Route Distance Progress'}
              </h4>
              {isLiveMoving && !isDelivered && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isKm
                ? `ពី ${shipment.senderCityKm} ឆ្ពោះទៅកាន់ ${shipment.receiverCityKm} (ចម្ងាយសរុប ${totalDistanceKm} គ.ម)`
                : `From ${shipment.senderCity} to ${shipment.receiverCity} (${totalDistanceKm} km highway corridor)`}
            </p>
          </div>
        </div>

        {/* Live Metric Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Simulation Toggle Button if provided */}
          {onTogglePlayPause && !isDelivered && (
            <button
              type="button"
              onClick={onTogglePlayPause}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                isLiveMoving
                  ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700'
              }`}
              title={isLiveMoving ? 'Pause courier movement simulation' : 'Resume courier movement simulation'}
            >
              {isLiveMoving ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
              <span>{isLiveMoving ? (isKm ? 'ផ្អាកចលនា' : 'Pause') : (isKm ? 'បន្តចលនា' : 'Resume')}</span>
            </button>
          )}

          {/* Current Percentage Badge */}
          <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-emerald-400/30 text-emerald-300 font-mono font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{roundedPct}%</span>
            <span className="text-[10px] font-sans font-bold text-emerald-400/90 uppercase">
              {isKm ? 'សម្រេច' : 'Done'}
            </span>
          </div>

          {/* Traveled Distance Pill */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1">
            <span className="font-bold text-white">{completedDistanceKm}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400 font-semibold">{totalDistanceKm} km</span>
          </div>
        </div>
      </div>

      {/* VISUAL JOURNEY PROGRESS BAR TRACK */}
      <div className="relative pt-6 pb-2 my-2 z-10">
        {/* Background Track with Subtle Gradient & Border */}
        <div className="h-3.5 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/80 relative shadow-inner">
          {/* Subtle tick indicators at 25%, 50%, 75% */}
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-slate-600/40 z-10" />
          <div className="absolute top-0 bottom-0 left-2/4 w-px bg-slate-600/50 z-10" />
          <div className="absolute top-0 bottom-0 left-3/4 w-px bg-slate-600/40 z-10" />

          {/* Active Filled Progress Bar with Rich Glow & Striped Flow */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-md transition-all duration-700 ease-out relative"
            style={{ width: `${Math.max(2, effectiveProgressPct)}%` }}
          >
            {/* Animated Light Sweep Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Dynamic Moving Courier Vehicle Pin that glides along the progress bar */}
        <div
          className="absolute top-2 transition-all duration-700 ease-out -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center"
          style={{ left: `${Math.max(4, Math.min(96, effectiveProgressPct))}%` }}
        >
          {/* Floating Courier Distance Tooltip */}
          <div className="bg-slate-900/95 backdrop-blur-md text-emerald-400 font-mono font-black text-[10px] px-2 py-0.5 rounded-md border border-emerald-400/50 shadow-lg shadow-black/60 flex items-center gap-1 mb-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{completedDistanceKm} km</span>
          </div>

          {/* Vehicle Icon Pin */}
          <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white shadow-lg shadow-emerald-500/50 flex items-center justify-center text-slate-950 font-bold transition-transform hover:scale-110">
            <Truck className="w-3.5 h-3.5 text-slate-950" />
          </div>
        </div>

        {/* Milestone Checkpoints Under Progress Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3">
          {/* Origin Hub */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-200">{shipment.senderCity.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-500 block font-mono">0 km • {isKm ? 'ដើមទី' : 'Start'}</span>
            </div>
          </div>

          {/* Midpoint Corridor */}
          <div className="text-center hidden sm:block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isKm ? 'ផ្លូវជាតិឆ្លងខេត្ត' : 'National Highway Corridor'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ~{(totalDistanceKm / 2).toFixed(0)} km (50%)
            </span>
          </div>

          {/* Destination Hub */}
          <div className="flex items-center gap-1.5 text-right">
            <div>
              <span className="font-bold text-slate-200">{shipment.receiverCity.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {totalDistanceKm} km • {isKm ? 'គោលដៅ' : 'Destination'}
              </span>
            </div>
            <div className={`w-2 h-2 rounded-full shrink-0 ${isDelivered ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          </div>
        </div>
      </div>

      {/* Footer Metrics Grid: Traveled, Remaining, Current Speed & ETA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs">
        {/* Traveled Distance */}
        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">
            {isKm ? 'ចម្ងាយឆ្លងកាត់រួច' : 'Distance Traveled'}
          </span>
          <div className="mt-1 flex items-baseline gap-1 text-emerald-400 font-mono font-black text-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{completedDistanceKm}</span>
            <span className="text-[10px] text-slate-400 font-normal">km</span>
          </div>
        </div>

        {/* Remaining Distance */}
        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">
            {isKm ? 'ចម្ងាយនៅសល់' : 'Distance Ahead'}
          </span>
          <div className="mt-1 flex items-baseline gap-1 text-cyan-300 font-mono font-black text-sm">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{remainingDistanceKm}</span>
            <span className="text-[10px] text-slate-400 font-normal">km</span>
          </div>
        </div>

        {/* Live Courier Speed */}
        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">
            {isKm ? 'ល្បឿនមធ្យម' : 'Cruising Speed'}
          </span>
          <div className="mt-1 flex items-baseline gap-1 text-amber-300 font-mono font-black text-sm">
            <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{isDelivered ? '0' : currentSpeedKmH}</span>
            <span className="text-[10px] text-slate-400 font-normal">km/h</span>
          </div>
        </div>

        {/* Expected Remaining Time */}
        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">
            {isKm ? 'ពេលវេលារំពឹងទុក' : 'Estimated Time'}
          </span>
          <div className="mt-1 flex items-baseline gap-1 text-slate-200 font-bold text-xs truncate">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{remainingTimeStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
