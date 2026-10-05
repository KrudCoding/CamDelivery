import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Truck,
  Clock,
  Send,
} from 'lucide-react';
import { Language } from '../types';

interface DeliveryStatusAlertsToggleProps {
  language: Language;
  onNotify?: (msg: string) => void;
  className?: string;
}

interface AlertSettings {
  enabled: boolean;
  inTransit: boolean;
  outForDelivery: boolean;
  delivered: boolean;
  exceptions: boolean;
  soundAlert: boolean;
}

const STORAGE_KEY = 'camdelivery_status_alert_settings';

export const DeliveryStatusAlertsToggle: React.FC<DeliveryStatusAlertsToggleProps> = ({
  language,
  onNotify,
  className = '',
}) => {
  const isKm = language === 'km';

  // Notification API support & permission
  const [hasBrowserSupport, setHasBrowserSupport] = useState<boolean>(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Stored alert settings
  const [settings, setSettings] = useState<AlertSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      enabled: true,
      inTransit: true,
      outForDelivery: true,
      delivered: true,
      exceptions: true,
      soundAlert: true,
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasBrowserSupport(true);
      setPermissionStatus(Notification.permission);
    } else {
      setHasBrowserSupport(false);
    }
  }, []);

  const saveSettings = (newSettings: AlertSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {}
  };

  const handleRequestPermission = async () => {
    if (!hasBrowserSupport) return;
    try {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);
      if (perm === 'granted') {
        saveSettings({ ...settings, enabled: true });
        if (onNotify) {
          onNotify(isKm ? 'បានបើកសិទ្ធិទទួលការជូនដំណឹង Push Notifications ជោគជ័យ!' : 'Browser push notifications successfully enabled!');
        }
      } else if (perm === 'denied') {
        if (onNotify) {
          onNotify(isKm ? 'ការជូនដំណឹងត្រូវបានបដិសេធក្នុង Browser' : 'Notifications were blocked in your browser settings');
        }
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  };

  const handleToggleEvent = (key: keyof AlertSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    saveSettings(updated);
    if (onNotify) {
      onNotify(isKm ? 'បានកត់ត្រាការកំណត់ដំណឹង' : 'Alert preferences updated');
    }
  };

  const handleSendTestNotification = () => {
    const title = isKm ? '🚚 CamDelivery: កញ្ចប់ឥវ៉ាន់ជិតដល់ហើយ!' : '🚚 CamDelivery: Out for Delivery!';
    const body = isKm
      ? 'អ្នកដឹកជញ្ជូនកំពុងធ្វើដំណើរមកកាន់ទីតាំងរបស់អ្នក (ចម្ងាយប្រហែល ១.២ គ.ម ទៀតដល់)'
      : 'Courier driver is 1.2 km away from your delivery address.';

    if (hasBrowserSupport && permissionStatus === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Error displaying native notification:', err);
      }
    }

    if (onNotify) {
      onNotify(isKm ? `🔔 [សាកល្បង] ${title} - ${body}` : `🔔 [Test Alert] ${title} - ${body}`);
    }
  };

  return (
    <div className={`bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-sm md:text-base">
                {isKm ? 'ការជូនដំណឹងស្ថានភាពកញ្ចប់ឥវ៉ាន់ (Delivery Alerts)' : 'Delivery Status Alerts & Push Notifications'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Push Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKm
                ? 'បើកដំណឹងលើ Browser ឬទូរស័ព្ទ ដើម្បីដឹងភ្លាមៗពេលកញ្ចប់ចេញដំណើរ ជិតដល់ ឬបានដឹកជោគជ័យ'
                : 'Enable real-time push alerts to stay notified when parcels depart depots, arrive near you, or deliver.'}
            </p>
          </div>
        </div>

        {/* Action: Enable / Test */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {permissionStatus !== 'granted' ? (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isKm ? 'អនុញ្ញាតដំណឹង Push' : 'Enable Push Alerts'}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isKm ? 'បានបើកសិទ្ធិ' : 'Push Active'}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleSendTestNotification}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title={isKm ? 'ផ្ញើសារសាកល្បង' : 'Send Test Notification'}
          >
            <Send className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">{isKm ? 'សាកល្បង' : 'Test Alert'}</span>
          </button>
        </div>
      </div>

      {/* Status Toggle Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Toggle 1: In Transit */}
        <div
          onClick={() => handleToggleEvent('inTransit')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
            settings.inTransit
              ? 'bg-blue-50/80 border-blue-400/80 shadow-2xs'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="font-extrabold text-xs text-slate-900">
                {isKm ? 'កំពុងដឹក (In Transit)' : 'In Transit'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isKm ? 'ពេលកញ្ចប់ចេញពីស្ថានីយ៍ឡានខេត្ត' : 'When van departs provincial depot'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.inTransit}
            onChange={() => {}}
            className="w-4 h-4 rounded text-blue-600 accent-blue-600 mt-1 cursor-pointer"
          />
        </div>

        {/* Toggle 2: Out for Delivery */}
        <div
          onClick={() => handleToggleEvent('outForDelivery')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
            settings.outForDelivery
              ? 'bg-amber-50/80 border-amber-400/80 shadow-2xs'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="font-extrabold text-xs text-slate-900">
                {isKm ? 'ជិតដល់ (Out for Delivery)' : 'Out for Delivery'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isKm ? 'អ្នកដឹកជញ្ជូននៅចម្ងាយ ១-២ គ.ម ពីផ្ទះ' : 'Driver arrives within 1-2 km radius'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.outForDelivery}
            onChange={() => {}}
            className="w-4 h-4 rounded text-amber-600 accent-amber-600 mt-1 cursor-pointer"
          />
        </div>

        {/* Toggle 3: Delivered */}
        <div
          onClick={() => handleToggleEvent('delivered')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
            settings.delivered
              ? 'bg-emerald-50/80 border-emerald-400/80 shadow-2xs'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-extrabold text-xs text-slate-900">
                {isKm ? 'បានដឹកដល់ (Delivered)' : 'Delivered'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isKm ? 'ប្រគល់កញ្ចប់ & បង្កាន់ដៃបាគង' : 'Parcel handed over & receipt logged'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.delivered}
            onChange={() => {}}
            className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 mt-1 cursor-pointer"
          />
        </div>

        {/* Toggle 4: Delays & Traffic Exceptions */}
        <div
          onClick={() => handleToggleEvent('exceptions')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
            settings.exceptions
              ? 'bg-rose-50/80 border-rose-400/80 shadow-2xs'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span className="font-extrabold text-xs text-slate-900">
                {isKm ? 'បញ្ហាផ្លូវ (Delays & Weather)' : 'Traffic & Exceptions'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isKm ? 'ដំណឹងពេលមានការរាំងស្ទះផ្លូវជាតិ' : 'Highway bottlenecks & rain delays'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.exceptions}
            onChange={() => {}}
            className="w-4 h-4 rounded text-rose-600 accent-rose-600 mt-1 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
