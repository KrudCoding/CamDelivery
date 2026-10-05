import React, { useState, useEffect } from 'react';
import {
  Truck,
  Phone,
  MessageSquare,
  X,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Volume2
} from 'lucide-react';
import { Language, TrackingItem } from '../types';
import {
  OutForDeliveryNotificationEvent,
  playOutForDeliveryChime,
  requestBrowserNotificationPermission,
  getBrowserNotificationPermission
} from '../services/notificationService';

interface OutForDeliveryAlertBannerProps {
  notification: OutForDeliveryNotificationEvent;
  language: Language;
  onDismiss: () => void;
  onOpenChat: () => void;
  shipment?: TrackingItem | null;
}

export const OutForDeliveryAlertBanner: React.FC<OutForDeliveryAlertBannerProps> = ({
  notification,
  language,
  onDismiss,
  onOpenChat,
  shipment,
}) => {
  const isKm = language === 'km';
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [isAudioReplaying, setIsAudioReplaying] = useState(false);

  useEffect(() => {
    setPermissionState(getBrowserNotificationPermission());
  }, []);

  const handleEnableBrowserNotifications = async () => {
    const res = await requestBrowserNotificationPermission();
    setPermissionState(res);
  };

  const handleReplayChime = () => {
    setIsAudioReplaying(true);
    playOutForDeliveryChime();
    setTimeout(() => setIsAudioReplaying(false), 800);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-600 p-0.5 shadow-2xl animate-in slide-in-from-top-4 duration-500">
      {/* Outer ambient glow */}
      <div className="bg-slate-950 text-white rounded-[14px] p-4 sm:p-5 relative overflow-hidden">
        {/* Animated background pulse beam */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Animated Icon & Status Headline */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <Truck className="w-6 h-6 animate-bounce" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                  <Zap className="w-3 h-3 text-slate-950 fill-current" />
                  <span>{isKm ? 'ការផ្លាស់ប្តូរស្ថានភាពផ្ទាល់' : 'Status Changed'}</span>
                </span>
                <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{notification.timestamp}</span>
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-black text-white mt-1 flex items-center gap-2 flex-wrap">
                <span>{isKm ? 'កញ្ចប់ឥវ៉ាន់កំពុងចេញដឹកជូនអ្នកហើយ! (Out for Delivery)' : 'Package is Out for Delivery!'}</span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/80">
                  #{notification.trackingNumber}
                </span>
              </h4>

              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {isKm ? (
                  <>
                    រថយន្តបានទៅដល់សាខាគោលដៅ ហើយអ្នកដឹកជញ្ជូន{' '}
                    <strong className="text-white font-bold">{notification.driverName}</strong> ({notification.driverVehicle}){' '}
                    កំពុងធ្វើដំណើរមកកាន់អាសយដ្ឋានរបស់អ្នក។ សូមត្រៀមទូរស័ព្ទ!
                  </>
                ) : (
                  <>
                    Package reached destination hub. Driver{' '}
                    <strong className="text-white font-bold">{notification.driverName}</strong> ({notification.driverVehicle}){' '}
                    is currently en route for final doorstep drop-off. ETA ~25-35 minutes!
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right: Interactive Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            {/* Audio Replay Chime */}
            <button
              type="button"
              onClick={handleReplayChime}
              className={`p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition ${
                isAudioReplaying ? 'scale-110 text-emerald-400 border-emerald-500' : ''
              }`}
              title={isKm ? 'ស្តាប់សំឡេងរោទិ៍ម្តងទៀត' : 'Replay Alert Sound'}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Browser Permission Request Button */}
            {permissionState === 'default' && (
              <button
                type="button"
                onClick={handleEnableBrowserNotifications}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/40 transition flex items-center gap-1.5"
                title={isKm ? 'បើកការជូនដំណឹងលើកុំព្យូទ័រ/ទូរស័ព្ទ' : 'Enable Browser Desktop/Mobile Alerts'}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isKm ? 'បើកដំណឹងលើ Browser' : 'Enable System Alert'}</span>
              </button>
            )}

            {permissionState === 'granted' && (
              <div className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1.5 rounded-xl border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isKm ? 'ដំណឹង Browser: បានបើក' : 'System Alerts: Active'}</span>
              </div>
            )}

            {/* Direct Call Button */}
            <a
              href={`tel:${notification.driverPhone.replace(/\s+/g, '')}`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{notification.driverPhone}</span>
            </a>

            {/* Chat with Driver Button */}
            <button
              type="button"
              onClick={onOpenChat}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-950"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isKm ? 'ឆាតជាមួយអ្នកដឹក' : 'Chat Driver'}</span>
            </button>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title={isKm ? 'បិទសារ' : 'Dismiss'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
