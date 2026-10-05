import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  X,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { Language, TrackingItem } from '../types';
import { ProximityNotificationEvent } from '../services/notificationService';

interface ProximityArrivalAlertBannerProps {
  notification: ProximityNotificationEvent;
  language: Language;
  onDismiss: () => void;
  onOpenChat?: () => void;
  shipment?: TrackingItem | null;
}

export const ProximityArrivalAlertBanner: React.FC<ProximityArrivalAlertBannerProps> = ({
  notification,
  language,
  onDismiss,
  onOpenChat,
  shipment,
}) => {
  const isKm = language === 'km';
  const [pulseCount, setPulseCount] = useState(0);

  // Auto-pulse animation ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount((p) => (p + 1) % 4);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-3 pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto bg-slate-950/95 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-500/80 backdrop-blur-md relative overflow-hidden ring-4 ring-emerald-500/20">
        {/* Radar concentric sweep gradient */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Animated Radar Pulse Beacon */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-2xl bg-emerald-400 opacity-40 animate-ping" />
              <Navigation className="w-5 h-5 animate-pulse transform -rotate-45" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
                  </span>
                  <span>{isKm ? 'ដំណឹងជិតមកដល់ (Under 500m)' : 'Proximity Push Alert'}</span>
                </span>

                <span className="font-mono text-[11px] font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                  📍 {notification.distanceMeters}m Away • ~{notification.etaMinutes} min
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5 pt-0.5">
                <span>{isKm ? `អ្នកដឹកជញ្ជូននៅចម្ងាយត្រឹម ${notification.distanceMeters} ម៉ែត្រ!` : `Courier is within 500 meters of destination!`}</span>
              </h4>

              <p className="text-xs text-slate-300 leading-snug">
                {isKm
                  ? `${notification.driverName} (${notification.driverVehicle}) កំពុងមកដល់មុខទីតាំងរបស់អ្នកហើយ។ សូមត្រៀមខ្លួនទទួលទូរស័ព្ទ និងកញ្ចប់ឥវ៉ាន់!`
                  : `${notification.driverName} (${notification.driverVehicle}) is turning onto your street. Please prepare for arrival!`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition"
            title={isKm ? 'បិទការជូនដំណឹង' : 'Dismiss Alert'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Courier Info & Quick Action Buttons Strip */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-300">
              {notification.driverName}
            </span>
            {notification.driverPlate && (
              <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                {notification.driverPlate}
              </span>
            )}
            <span className="text-slate-500">•</span>
            <span className="text-[11px] text-emerald-400 font-semibold font-mono">
              #{notification.trackingNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${notification.driverPhone.replace(/\s/g, '')}`}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isKm ? 'ទូរស័ព្ទ' : 'Call'}</span>
            </a>

            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>{isKm ? 'ឆាត' : 'Chat'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onDismiss();
                document.getElementById('shipment-details-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1"
            >
              <span>{isKm ? 'មើលផែនទី' : 'Map'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
