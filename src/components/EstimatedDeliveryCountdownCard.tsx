import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Timer, 
  MapPin, 
  Truck, 
  Navigation, 
  CheckCircle2, 
  Zap, 
  Gauge, 
  CloudRain, 
  AlertTriangle, 
  Sliders, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { TrackingItem, Language } from '../types';

interface EstimatedDeliveryCountdownCardProps {
  shipment: TrackingItem;
  language: Language;
  onSimulateStatus?: (newStatus: TrackingItem['status']) => void;
  onSaveToCalendar?: () => void;
  className?: string;
}

export type TrafficCondition = 'normal' | 'moderate' | 'peak' | 'rain';

export const EstimatedDeliveryCountdownCard: React.FC<EstimatedDeliveryCountdownCardProps> = ({
  shipment,
  language,
  onSimulateStatus,
  onSaveToCalendar,
  className = '',
}) => {
  const isKm = language === 'km';
  const isDelivered = shipment.status === 'delivered';

  // Traffic condition state
  const [trafficCondition, setTrafficCondition] = useState<TrafficCondition>('moderate');

  // Custom distance adjustment override (null = use calculated live GPS distance)
  const [manualDistanceKm, setManualDistanceKm] = useState<number | null>(null);
  const [isAdjustingDistance, setIsAdjustingDistance] = useState(false);

  // Live seconds ticker for countdown
  const [ticker, setTicker] = useState<number>(0);

  // Run 1-second interval to keep the countdown live and ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute base direct road distance between start/current and destination
  const calculatedGpsDistanceKm = useMemo(() => {
    const currentCoords = shipment.routeCoordinates?.current;
    const destCoords = shipment.routeCoordinates?.end;

    if (!currentCoords || !destCoords) {
      return shipment.status === 'out_for_delivery' ? 8 : 145;
    }

    // Haversine formula
    const R = 6371; // Earth radius km
    const dLat = (destCoords.lat - currentCoords.lat) * (Math.PI / 180);
    const dLon = (destCoords.lng - currentCoords.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(currentCoords.lat * (Math.PI / 180)) *
        Math.cos(destCoords.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const directKm = Math.round(R * c);

    // Cambodian highway curvature factor ~1.28x
    const roadKm = Math.max(3, Math.round(directKm * 1.28));

    // When out for delivery, adjust to last-mile distance (e.g. 3km to 12km)
    if (shipment.status === 'out_for_delivery') {
      return Math.min(roadKm, 12);
    }
    return roadKm;
  }, [shipment.routeCoordinates, shipment.status]);

  // Effective distance to use
  const effectiveDistanceKm = isDelivered 
    ? 0 
    : (manualDistanceKm !== null ? manualDistanceKm : calculatedGpsDistanceKm);

  // Compute speed based on Courier Status
  const courierStatusSpeedProfile = useMemo(() => {
    switch (shipment.status) {
      case 'picked_up':
        return {
          baseSpeedKmH: 40,
          label: 'Hub Sorting & Dispatch Speed (~40 km/h)',
          labelKm: 'ល្បឿនចេញពីឃ្លាំង & រៀបចំ (~៤០ គ.ម/ម៉)',
          statusDelayMinutes: 20, // Depot handling buffer
          modeIcon: Truck,
        };
      case 'in_transit':
        return {
          baseSpeedKmH: 65,
          label: 'National Highway Cruising Speed (~65 km/h)',
          labelKm: 'ល្បឿនផ្លូវជាតិអន្តរខេត្ត (~៦៥ គ.ម/ម៉)',
          statusDelayMinutes: 10,
          modeIcon: Truck,
        };
      case 'out_for_delivery':
        return {
          baseSpeedKmH: 30,
          label: 'Doorstep Last-Mile Delivery Speed (~30 km/h)',
          labelKm: 'ល្បឿនអ្នកដឹកដល់ផ្ទះ Last-Mile (~៣០ គ.ម/ម៉)',
          statusDelayMinutes: 5,
          modeIcon: Navigation,
        };
      case 'delivered':
        return {
          baseSpeedKmH: 0,
          label: 'Delivered (0 km/h)',
          labelKm: 'បានដឹកដល់រួចរាល់ (០ គ.ម/ម៉)',
          statusDelayMinutes: 0,
          modeIcon: CheckCircle2,
        };
      default: // pending or scheduled
        return {
          baseSpeedKmH: 45,
          label: 'Scheduled Highway Speed (~45 km/h)',
          labelKm: 'ល្បឿនកាលវិភាគ (~៤៥ គ.ម/ម៉)',
          statusDelayMinutes: 30,
          modeIcon: Clock,
        };
    }
  }, [shipment.status]);

  // Traffic multiplier
  const trafficMultiplier = useMemo(() => {
    switch (trafficCondition) {
      case 'normal':
        return 1.0;
      case 'moderate':
        return 1.18;
      case 'peak':
        return 1.55;
      case 'rain':
        return 1.35;
      default:
        return 1.18;
    }
  }, [trafficCondition]);

  // Calculate Total Travel Time in Seconds
  const totalTravelSeconds = useMemo(() => {
    if (isDelivered || effectiveDistanceKm <= 0) return 0;

    const baseHours = effectiveDistanceKm / courierStatusSpeedProfile.baseSpeedKmH;
    const baseMinutes = baseHours * 60;
    const adjustedMinutes = (baseMinutes + courierStatusSpeedProfile.statusDelayMinutes) * trafficMultiplier;

    return Math.round(adjustedMinutes * 60);
  }, [effectiveDistanceKm, courierStatusSpeedProfile, trafficMultiplier, isDelivered]);

  // Base arrival timestamp
  const targetArrivalTimestamp = useMemo(() => {
    if (isDelivered) return Date.now();
    return Date.now() + totalTravelSeconds * 1000;
  }, [totalTravelSeconds, isDelivered]);

  // Live remaining seconds calculation (ticks down every second)
  const remainingSeconds = useMemo(() => {
    if (isDelivered) return 0;
    const diff = Math.max(0, Math.round((targetArrivalTimestamp - Date.now()) / 1000));
    return diff;
    // ticker is passed to force recalculation every second
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetArrivalTimestamp, ticker, isDelivered]);

  // Format Countdown into Hours, Minutes, Seconds
  const countdownHours = Math.floor(remainingSeconds / 3600);
  const countdownMinutes = Math.floor((remainingSeconds % 3600) / 60);
  const countdownSecs = remainingSeconds % 60;

  // Format Arrival Time Clock
  const arrivalDate = useMemo(() => {
    if (isDelivered) return new Date();
    return new Date(targetArrivalTimestamp);
  }, [targetArrivalTimestamp, isDelivered]);

  const arrivalClockStr = useMemo(() => {
    return arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [arrivalDate]);

  const arrivalDateStr = useMemo(() => {
    return arrivalDate.toLocaleDateString(isKm ? 'km-KH' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [arrivalDate, isKm]);

  // Traffic delay in minutes
  const trafficDelayMinutes = useMemo(() => {
    if (isDelivered || effectiveDistanceKm <= 0) return 0;
    const baseMinutes = (effectiveDistanceKm / courierStatusSpeedProfile.baseSpeedKmH) * 60;
    const adjusted = (baseMinutes + courierStatusSpeedProfile.statusDelayMinutes) * trafficMultiplier;
    return Math.max(0, Math.round(adjusted - baseMinutes));
  }, [effectiveDistanceKm, courierStatusSpeedProfile, trafficMultiplier, isDelivered]);

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-4 sm:p-6 border border-indigo-800/80 shadow-lg relative overflow-hidden ${className}`}>
      {/* Decorative Glow */}
      <div className="absolute right-0 top-0 -mt-10 -mr-10 w-52 h-52 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 -mb-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER: Title & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-900/60 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-blue-400 flex items-center justify-center border border-blue-400/30 shrink-0 shadow-inner">
            <Timer className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {isKm ? 'ការគណនាពេលវេលាមកដល់ & នាឡិការាប់ថយក្រោយ' : 'Estimated Delivery Time & Live Countdown'}
              </h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                isDelivered
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : shipment.status === 'out_for_delivery'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
              }`}>
                {isDelivered 
                  ? (isKm ? 'បានដឹកដល់' : 'Delivered') 
                  : shipment.status === 'out_for_delivery'
                  ? (isKm ? 'ជិតដល់ផ្ទះ' : 'Out for Delivery')
                  : (isKm ? 'កំពុងធ្វើដំណើរ' : 'In Transit')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isKm
                ? `គណនាស្វ័យប្រវត្តផ្អែកលើចម្ងាយ ${effectiveDistanceKm} គ.ម និងស្ថានភាពជាក់ស្តែងរបស់អ្នកដឹក`
                : `Calculated dynamically from shipment distance (${effectiveDistanceKm} km) & active courier status`}
            </p>
          </div>
        </div>

        {/* Traffic Condition Selector */}
        <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-indigo-900/80 self-start sm:self-auto text-xs">
          <span className="text-[10px] text-slate-400 px-1.5 font-bold flex items-center gap-1">
            <Gauge className="w-3 h-3 text-slate-400" />
            <span>{isKm ? 'ចរាចរណ៍៖' : 'Traffic:'}</span>
          </span>
          {(['normal', 'moderate', 'peak', 'rain'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTrafficCondition(mode)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                trafficCondition === mode
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={
                mode === 'normal' ? 'Normal Traffic (1.0x)' :
                mode === 'moderate' ? 'Moderate Traffic (1.18x)' :
                mode === 'peak' ? 'Peak Congestion (1.55x)' : 'Monsoon Rain & Wet Roads (1.35x)'
              }
            >
              {mode === 'normal'
                ? (isKm ? 'ធម្មតា' : 'Normal')
                : mode === 'moderate'
                ? (isKm ? 'មធ្យម' : 'Moderate')
                : mode === 'peak'
                ? (isKm ? 'កកស្ទះ' : 'Peak')
                : (isKm ? 'ភ្លៀង' : 'Rain')}
            </button>
          ))}
        </div>
      </div>

      {/* PROMINENT LIVE COUNTDOWN & ESTIMATED ARRIVAL HERO DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 relative z-10">
        {/* HERO BOX 1: LIVE COUNTDOWN TIMER */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-indigo-800/70 shadow-inner flex flex-col justify-between backdrop-blur-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              <span>{isKm ? 'នាឡិការាប់ថយក្រោយ (Countdown)' : 'Live Delivery Countdown'}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 font-mono font-bold flex items-center gap-1 border border-amber-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>{isKm ? 'រាប់វិនាទីផ្ទាល់' : 'Live Ticking'}</span>
            </span>
          </div>

          {isDelivered ? (
            <div className="py-3 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-black">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{isKm ? 'កញ្ចប់ឥវ៉ាន់ត្រូវបានដឹកជញ្ជូនដល់ដៃរួចរាល់' : 'Parcel Delivered Successfully!'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">00h : 00m : 00s</p>
            </div>
          ) : (
            <div>
              {/* Digit Cards */}
              <div className="grid grid-cols-3 gap-2 my-1 text-center font-mono">
                {/* Hours Box */}
                <div className="p-2 sm:p-3 rounded-xl bg-slate-900 border border-indigo-900/80 shadow-xs">
                  <span className="text-2xl sm:text-3xl font-black text-amber-300 block">
                    {String(countdownHours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block mt-0.5">
                    {isKm ? 'ម៉ោង (Hours)' : 'Hours'}
                  </span>
                </div>

                {/* Minutes Box */}
                <div className="p-2 sm:p-3 rounded-xl bg-slate-900 border border-indigo-900/80 shadow-xs">
                  <span className="text-2xl sm:text-3xl font-black text-white block">
                    {String(countdownMinutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block mt-0.5">
                    {isKm ? 'នាទី (Mins)' : 'Minutes'}
                  </span>
                </div>

                {/* Seconds Box */}
                <div className="p-2 sm:p-3 rounded-xl bg-slate-900 border border-indigo-900/80 shadow-xs">
                  <span className="text-2xl sm:text-3xl font-black text-blue-400 block">
                    {String(countdownSecs).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block mt-0.5">
                    {isKm ? 'វិនាទី (Secs)' : 'Seconds'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-900">
                <span>
                  {isKm ? 'ស្ថានភាពអ្នកដឹក៖' : 'Courier Status:'}
                </span>
                <span className="text-amber-300 font-bold">
                  {isKm ? shipment.statusKm : shipment.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* HERO BOX 2: ESTIMATED ARRIVAL TIME & CLOCK */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-indigo-800/70 shadow-inner flex flex-col justify-between backdrop-blur-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{isKm ? 'ម៉ោងមកដល់រំពឹងទុក (Estimated Arrival)' : 'Target Arrival Time'}</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span>{arrivalDateStr}</span>
              </span>
              {onSaveToCalendar && !isDelivered && (
                <button
                  type="button"
                  onClick={onSaveToCalendar}
                  className="px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1 transition cursor-pointer"
                  title={isKm ? 'រក្សាទុកកាលបរិច្ឆេទក្នុងប្រតិទិន (ICS / Google)' : 'Save delivery date to Calendar (ICS / Google)'}
                >
                  <Calendar className="w-2.5 h-2.5 text-rose-400" />
                  <span>{isKm ? 'ដាក់ក្នុងប្រតិទិន' : 'Add to Calendar'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-black text-amber-300 tracking-tight">
                ~{arrivalClockStr}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {isKm ? '(ម៉ោងនៅកម្ពុជា ICT / GMT+7)' : '(Cambodia Time GMT+7)'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>
                {isKm ? 'ទិសដៅមកដល់៖ ' : 'Destination: '}
                <strong className="text-white font-bold">{isKm ? shipment.receiverCityKm : shipment.receiverCity}</strong>
              </span>
            </p>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
            <span>{isKm ? 'កម្រិតល្បឿនបច្ចុប្បន្ន៖' : 'Effective Velocity:'}</span>
            <span className="text-emerald-400 font-bold">
              ~{courierStatusSpeedProfile.baseSpeedKmH} km/h
            </span>
          </div>
        </div>
      </div>

      {/* METRICS STRIP: DISTANCE + COURIER STATUS SPEED + DELAYS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 relative z-10">
        {/* Metric 1: Distance */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-indigo-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isKm ? 'ចម្ងាយនៅសល់' : 'Distance'}
            </span>
            <button
              type="button"
              onClick={() => setIsAdjustingDistance(!isAdjustingDistance)}
              className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 text-blue-300 border border-indigo-800 transition cursor-pointer"
              title={isKm ? 'កែសម្រួលចម្ងាយដើម្បីសាកល្បង' : 'Adjust distance to simulate'}
            >
              {isAdjustingDistance ? (isKm ? 'បិទ' : 'Close') : (isKm ? 'កែសម្រួល' : 'Adjust')}
            </button>
          </div>
          <span className="text-base sm:text-lg font-black text-white mt-1 block">
            {effectiveDistanceKm} km
          </span>
          <span className="text-[10px] text-slate-400 block truncate">
            {manualDistanceKm !== null 
              ? (isKm ? 'កំណត់ដោយដៃ' : 'Custom simulation') 
              : (isKm ? 'គណនាតាម GPS ផ្លូវជាតិ' : 'Live Highway GPS')}
          </span>
        </div>

        {/* Metric 2: Effective Courier Speed */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-indigo-900/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {isKm ? 'ល្បឿនតាមស្ថានភាព' : 'Status Speed'}
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-400 mt-1 block">
            ~{courierStatusSpeedProfile.baseSpeedKmH} km/h
          </span>
          <span className="text-[10px] text-slate-400 block truncate">
            {isKm ? courierStatusSpeedProfile.labelKm : courierStatusSpeedProfile.label}
          </span>
        </div>

        {/* Metric 3: Travel Duration */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-indigo-900/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {isKm ? 'រយៈពេលធ្វើដំណើរ' : 'Duration'}
          </span>
          <span className="text-base sm:text-lg font-black text-white mt-1 block">
            {isDelivered 
              ? '0m' 
              : countdownHours > 0 
              ? `${countdownHours}h ${countdownMinutes}m` 
              : `${countdownMinutes}m`}
          </span>
          <span className="text-[10px] text-blue-300 block">
            {isKm ? `សរុប ~${Math.round(totalTravelSeconds / 60)} នាទី` : `Total ~${Math.round(totalTravelSeconds / 60)} mins`}
          </span>
        </div>

        {/* Metric 4: Traffic Delay Adjustment */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-indigo-900/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {isKm ? 'ពន្យារពេលចរាចរណ៍' : 'Traffic Delay'}
          </span>
          <span className="text-base sm:text-lg font-black text-rose-400 mt-1 block">
            +{trafficDelayMinutes}m
          </span>
          <span className="text-[10px] text-slate-400 block truncate">
            {trafficCondition === 'peak'
              ? (isKm ? 'ម៉ោងកកស្ទះ' : 'Peak Traffic')
              : trafficCondition === 'rain'
              ? (isKm ? 'អាកាសធាតុភ្លៀង' : 'Monsoon Rain')
              : trafficCondition === 'moderate'
              ? (isKm ? 'លំហូរមធ្យម' : 'Moderate')
              : (isKm ? 'ផ្លូវស្រឡះ' : 'Smooth Flow')}
          </span>
        </div>
      </div>

      {/* OPTIONAL DISTANCE SLIDER (when user clicks Adjust) */}
      {isAdjustingDistance && !isDelivered && (
        <div className="mb-4 p-3.5 rounded-xl bg-slate-950/90 border border-indigo-800/80 relative z-10 animate-fadeIn">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-blue-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>{isKm ? 'សាកល្បងចម្ងាយ (Interactive Distance Simulation):' : 'Interactive Distance Simulator:'}</span>
            </span>
            {manualDistanceKm !== null && (
              <button
                type="button"
                onClick={() => setManualDistanceKm(null)}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isKm ? 'កំណត់ដើមតាម GPS' : 'Reset GPS'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={2}
              max={350}
              step={1}
              value={effectiveDistanceKm}
              onChange={(e) => setManualDistanceKm(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <span className="font-mono font-black text-amber-300 text-sm shrink-0 w-16 text-right">
              {effectiveDistanceKm} km
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[10px] text-slate-400">{isKm ? 'ផ្លូវសំខាន់ៗ៖' : 'Presets:'}</span>
            {[
              { km: 5, label: 'Doorstep (5 km)', labelKm: 'ជិតដល់ផ្ទះ (៥ គ.ម)' },
              { km: 25, label: 'Kandal Hub (25 km)', labelKm: 'កណ្តាល (២៥ គ.ម)' },
              { km: 145, label: 'Kampong Thom (145 km)', labelKm: 'កំពង់ធំ (១៤៥ គ.ម)' },
              { km: 230, label: 'Sihanoukville (230 km)', labelKm: 'ក្រុងព្រះសីហនុ (២៣០ គ.ម)' },
              { km: 314, label: 'Siem Reap (314 km)', labelKm: 'សៀមរាប (៣១៤ គ.ម)' },
            ].map((preset) => (
              <button
                key={preset.km}
                type="button"
                onClick={() => setManualDistanceKm(preset.km)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                  effectiveDistanceKm === preset.km
                    ? 'bg-blue-600 text-white border-blue-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {isKm ? preset.labelKm : preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* QUICK STATUS SWITCHER TEST BUTTONS (ALLOWS IMMEDIATE RECALCULATION) */}
      {onSimulateStatus && (
        <div className="pt-3 border-t border-indigo-900/60 relative z-10 flex items-center justify-between gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isKm ? 'សាកល្បងប្តូរស្ថានភាពដើម្បីមើលការគណនា៖' : 'Test Status Impact on ETA:'}</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onSimulateStatus('in_transit')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                shipment.status === 'in_transit'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              🚚 {isKm ? 'កំពុងធ្វើដំណើរ (Highway 65 km/h)' : 'In Transit (65 km/h)'}
            </button>

            <button
              type="button"
              onClick={() => onSimulateStatus('out_for_delivery')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                shipment.status === 'out_for_delivery'
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-xs font-black'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              🛵 {isKm ? 'ចេញដឹកដល់ផ្ទះ (Last Mile 30 km/h)' : 'Out for Delivery (30 km/h)'}
            </button>

            <button
              type="button"
              onClick={() => onSimulateStatus('delivered')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                shipment.status === 'delivered'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              ✅ {isKm ? 'បានដឹកដល់ (Delivered 0m)' : 'Mark Delivered (0m)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
