import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  Truck,
  PackageCheck,
  Navigation,
  CalendarCheck,
  CreditCard,
  Volume2,
  VolumeX,
  Send,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Smartphone,
  RefreshCw,
  Battery,
  Zap
} from 'lucide-react';
import { Language } from '../types';
import { isPowerSaverMode, setPowerSaverMode, POWER_SAVER_EVENT } from '../utils/powerSaverService';
import {
  MilestoneNotificationPreferences,
  getNotificationPreferences,
  saveNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
  playOutForDeliveryChime,
  playProximityChime
} from '../services/notificationService';

interface NotificationSettingsSectionProps {
  language: Language;
  onNotify: (msg: string) => void;
  className?: string;
}

export const NotificationSettingsSection: React.FC<NotificationSettingsSectionProps> = ({
  language,
  onNotify,
  className = '',
}) => {
  const isKm = language === 'km';

  const [preferences, setPreferences] = useState<MilestoneNotificationPreferences>(getNotificationPreferences);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isPowerSaver, setIsPowerSaver] = useState<boolean>(isPowerSaverMode);

  useEffect(() => {
    setBrowserPermission(getBrowserNotificationPermission());
  }, []);

  useEffect(() => {
    const handlePowerSaver = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail && typeof custom.detail.enabled === 'boolean') {
        setIsPowerSaver(custom.detail.enabled);
      } else {
        setIsPowerSaver(isPowerSaverMode());
      }
    };
    window.addEventListener(POWER_SAVER_EVENT, handlePowerSaver);
    return () => window.removeEventListener(POWER_SAVER_EVENT, handlePowerSaver);
  }, []);

  const handleTogglePowerSaver = () => {
    const next = !isPowerSaver;
    setPowerSaverMode(next);
    setIsPowerSaver(next);
    onNotify(
      next
        ? (isKm ? 'បានបើកម៉ូដសន្សំថ្ម (Power Saver)! កាត់បន្ថយការ refresh ផែនទី និង polling មកត្រឹម ៦ វិនាទី' : 'Power Saver enabled! Map refresh rate throttled to 6.0s to preserve battery on long trips.')
        : (isKm ? 'បានបិទម៉ូដសន្សំថ្ម! ផែនទីដំណើរការក្នុងល្បឿនធម្មតា ១.៥ វិនាទី' : 'Power Saver disabled. Map polling restored to standard 1.5s rate.')
    );
  };

  const handleTogglePreference = (key: keyof MilestoneNotificationPreferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(updated);
    saveNotificationPreferences(updated);

    onNotify(
      isKm
        ? 'ការកំណត់ដំណឹងត្រូវបានធ្វើបច្ចុប្បន្នភាព!'
        : 'Notification preferences updated!'
    );
  };

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      onNotify(
        isKm
          ? 'ការអនុញ្ញាត Browser Push Notification ត្រូវបានបើកជោគជ័យ!'
          : 'Browser Push Notification permissions granted!'
      );
    } else {
      onNotify(
        isKm
          ? 'ការអនុញ្ញាតត្រូវបានបដិសេធ។ សូមបើកសិទ្ធិក្នុង Browser settings។'
          : 'Notification permissions were blocked. Please enable in browser settings.'
      );
    }
  };

  const handleSendTestPush = async (type: 'out_for_delivery' | 'delivered') => {
    setIsSendingTest(true);

    if (browserPermission !== 'granted') {
      const perm = await requestBrowserNotificationPermission();
      setBrowserPermission(perm);
      if (perm !== 'granted') {
        setIsSendingTest(false);
        onNotify(
          isKm
            ? '⚠️ សូមអនុញ្ញាត Browser Notification ជាមុនសិនដើម្បីទទួលសារសាកល្បង!'
            : '⚠️ Please grant browser notification permission first!'
        );
        return;
      }
    }

    if (preferences.soundEnabled) {
      if (type === 'out_for_delivery') playOutForDeliveryChime();
      else playProximityChime();
    }

    setTimeout(() => {
      if (type === 'out_for_delivery') {
        sendBrowserNotification({
          title: isKm ? '🚚 [សាកល្បង] កញ្ចប់ឥវ៉ាន់កំពុងចេញដឹក! #PP-882910-SR' : '🚚 [Test] Package Out for Delivery! #PP-882910-SR',
          body: isKm
            ? 'J&T Express៖ អ្នកដឹក លី ហុង កំពុងធ្វើដំណើរទៅកាន់ សៀមរាប។ ETA ~២៥ នាទី។'
            : 'J&T Express: Driver Ly Hong is on the way to your address. Estimated arrival in 25 mins.',
          tag: 'test-out-for-delivery',
        });
      } else {
        sendBrowserNotification({
          title: isKm ? '🎉 [សាកល្បង] បានប្រគល់កញ្ចប់ជោគជ័យ! #PP-882910-SR' : '🎉 [Test] Package Delivered! #PP-882910-SR',
          body: isKm
            ? 'កញ្ចប់របស់អ្នកត្រូវបានចុះហត្ថលេខាទទួលរួចរាល់។ សូមពិនិត្យរូបភាព និងវាយតម្លៃអ្នកដឹក!'
            : 'Your package was signed and delivered at doorstep. Check proof of delivery and rate courier!',
          tag: 'test-delivered',
        });
      }

      setIsSendingTest(false);
      onNotify(
        isKm
          ? `បានផ្ញើសារសាកល្បង "${type === 'out_for_delivery' ? 'កំពុងចេញដឹក' : 'ដឹកដល់រួចរាល់'}" ទៅកាន់ Browser!`
          : `Dispatched test ${type === 'out_for_delivery' ? 'Out for Delivery' : 'Delivered'} push notification!`
      );
    }, 400);
  };

  const handleResetToDefault = () => {
    setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    saveNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    onNotify(
      isKm
        ? 'បានកំណត់ការជូនដំណឹងទៅទម្រង់ដើមវិញ!'
        : 'Notification preferences reset to defaults!'
    );
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden ${className}`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <BellRing className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-white">
                {isKm ? 'ការកំណត់ការជូនដំណឹង (Notification Settings)' : 'Milestone Push Notification Settings'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-2xs">
                {isKm ? 'ពេលវេលាជាក់ស្តែង' : 'Real-Time'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {isKm
                ? 'កំណត់ការជូនដំណឹង Push តាមទូរស័ព្ទ និងកុំព្យូទ័រ សម្រាប់ដំណាក់កាលដឹកជញ្ជូននីមួយៗ'
                : 'Configure native browser push notifications and audio alerts for specific delivery lifecycle milestones.'}
            </p>
          </div>
        </div>

        {/* Browser Permission Chip */}
        <div className="self-start sm:self-auto shrink-0">
          {browserPermission === 'granted' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isKm ? 'Browser សកម្ម (Granted)' : 'Browser Push: Enabled'}</span>
            </div>
          ) : browserPermission === 'denied' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-bold">
              <BellOff className="w-4 h-4 text-rose-400" />
              <span>{isKm ? 'Browser បានបិទសិទ្ធិ' : 'Browser Push: Blocked'}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isKm ? 'បើកសិទ្ធិ Browser' : 'Enable Browser Push'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Permission Advisory Banner if not granted */}
        {browserPermission !== 'granted' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-black block">
                  {isKm ? 'Browser Push Notifications មិនទាន់ត្រូវបានបើកដំណើរការទេ' : 'Browser Push Notifications Not Yet Activated'}
                </span>
                <span className="text-[11px] text-amber-800">
                  {isKm
                    ? 'សូមចុច "បើកសិទ្ធិ Browser" ដើម្បីធានាថាអ្នកទទួលបានសារជូនដំណឹងទោះបីកំពុងបិទទំព័រនេះក៏ដោយ។'
                    : 'Click "Enable Browser Push" so alerts appear as native desktop and mobile push banners.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              {isKm ? 'អនុញ្ញាតឥឡូវនេះ' : 'Grant Permission'}
            </button>
          </div>
        )}

        {/* Milestone Push Notification Toggles Grid */}
        <div>
          <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{isKm ? 'ដំណាក់កាលនៃការជូនដំណឹង (Status Milestones)' : 'Delivery Milestone Event Toggles'}</span>
          </h4>

          <div className="space-y-3">
            {/* 1. Out for Delivery Milestone */}
            <div className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {isKm ? 'កញ្ចប់កំពុងចេញដឹកដល់ផ្ទះ (Out for Delivery)' : 'Out for Delivery Milestone'}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-md bg-blue-100 text-blue-800">
                      {isKm ? 'អាទិភាពខ្ពស់' : 'High Priority'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKm
                      ? 'ជូនដំណឹងភ្លាមៗនៅពេលអ្នកដឹកជញ្ជូនទទួលកញ្ចប់ពីឃ្លាំង និងកំពុងធ្វើដំណើរចេញដឹកជូនដល់ផ្ទះ'
                      : 'Alerts as soon as the courier loads your parcel for final doorstep delivery with rider phone & ETA.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePreference('outForDelivery')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.outForDelivery ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={preferences.outForDelivery}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.outForDelivery ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. Delivered Milestone */}
            <div className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {isKm ? 'បានប្រគល់កញ្ចប់ជោគជ័យ (Delivered)' : 'Package Delivered Milestone'}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                      {isKm ? 'វិញ្ញាបនបត្រ' : 'Receipt'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKm
                      ? 'ផ្ញើសារបញ្ជាក់ពេលកញ្ចប់ត្រូវបានប្រគល់រួចរាល់ រួមជាមួយរូបភាពភស្តុតាង និងទម្រង់វាយតម្លៃផ្កាយ'
                      : 'Confirmation notification upon drop-off with proof-of-delivery photo and driver rating prompt.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePreference('delivered')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.delivered ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={preferences.delivered}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.delivered ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 3. 500m Proximity Radar Arrival Alert */}
            <div className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Navigation className="w-5 h-5 transform -rotate-45" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {isKm ? 'ដំណឹងជិតមកដល់ចម្ងាយក្រោម ៥០០ម (Arrival Alert)' : '500-Meter Proximity Arrival Alert'}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-md bg-teal-100 text-teal-800">
                      {isKm ? 'រ៉ាដាផ្កាយរណប' : 'GPS Radar'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKm
                      ? 'ការជូនដំណឹងជំរុញពិសេសនៅពេលអ្នកដឹកជញ្ជូនចូលដល់រង្វង់ ៥០០ ម៉ែត្រជុំវិញទីតាំងទទួល (~២ នាទី)'
                      : 'Rapid proximity push chime when courier enters within 500m radius of your delivery destination.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePreference('proximityArrival')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.proximityArrival ? 'bg-teal-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={preferences.proximityArrival}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.proximityArrival ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. Picked Up & Hub Departure */}
            <div className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {isKm ? 'បានទទួលកញ្ចប់ & កំពុងឆ្លងកាត់ខេត្ត (In Transit)' : 'Hub Transit & Highway Departure'}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKm
                      ? 'ជូនដំណឹងនៅពេលកញ្ចប់ចេញដំណើរពីឃ្លាំងខេត្តដើមទី ឬឆ្លងកាត់ឃ្លាំងអន្តរខេត្ត'
                      : 'Updates as shipment departs provincial logistics sorting centers onto national highways.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePreference('pickedUpHub')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.pickedUpHub ? 'bg-amber-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={preferences.pickedUpHub}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.pickedUpHub ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 5. Rescheduled Appointment */}
            <div className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {isKm ? 'ការកែសម្រួលកាលបរិច្ឆេទដឹក (Appointment Rescheduled)' : 'Delivery Reschedule Confirmation'}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKm
                      ? 'ជូនដំណឹងបញ្ជាក់នៅពេលកាលបរិច្ឆេទ ឬចន្លោះម៉ោងទទួលឥវ៉ាន់ត្រូវបានកែសម្រួលឡើងវិញ'
                      : 'Confirmation alert when appointment date or time slot is modified by recipient.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePreference('rescheduled')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.rescheduled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={preferences.rescheduled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.rescheduled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 6. COD & Bakong KHQR Payment Receipt */}
            <div className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {isKm ? 'បង្កាន់ដៃទូទាត់ប្រាក់ COD & KHQR (Payment Receipt)' : 'COD & Bakong KHQR Settlement Alerts'}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKm
                      ? 'ជូនដំណឹងបញ្ជាក់ការប្រមូលប្រាក់ទំនិញ ឬការផ្ទេរប្រាក់ Bakong ជោគជ័យ'
                      : 'Instant financial verification when COD cash collection or KHQR transfer is recorded.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePreference('codPayment')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.codPayment ? 'bg-purple-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={preferences.codPayment}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.codPayment ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 7. Sound / Chime Toggle */}
            <div className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  {preferences.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {isKm ? 'សំឡេងរោទ៍ជូនដំណឹង (Harmonic Sound Chime)' : 'Notification Audio Chimes'}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKm
                      ? 'បន្លឺសំឡេងរោទ៍ ៣ តង់ រួសរាយរាក់ទាក់ នៅពេលមានការជូនដំណឹងថ្មី'
                      : 'Plays synthesized multi-harmonic chime tones on status milestone events.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePreference('soundEnabled')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.soundEnabled ? 'bg-rose-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={preferences.soundEnabled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: POWER SAVER & BATTERY OPTIMIZATION FOR LONG DISTANCE */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-slate-50 to-teal-50 border border-emerald-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                isPowerSaver
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs sm:text-sm text-slate-900">
                    {isKm ? 'ម៉ូដសន្សំថ្មសម្រាប់ការដឹកជញ្ជូនផ្លូវឆ្ងាយ (Power Saver Mode)' : 'Power Saver Mode (Long-Distance Optimization)'}
                  </h4>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isPowerSaver
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isPowerSaver ? (isKm ? 'កំពុងដំណើរការ' : 'Active') : (isKm ? 'បិទ' : 'Off')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                  {isKm
                    ? 'កាត់បន្ថយការ refresh ផែនទី និងប្រេកង់ polling ក្នុងទំព័រ LiveTrackingView (ពី ១.៥ វិនាទី មក ៦.០ វិនាទី) ដើម្បីសន្សំថ្មទូរស័ព្ទប្រមាណ ៤៥% សម្រាប់អ្នកដឹកជញ្ជូន និងអតិថិជនតាមផ្លូវជាតិខេត្តឆ្ងាយៗ។'
                    : 'Throttles live map refresh rates and polling frequency in LiveTrackingView (from 1.5s to 6.0s), saving ~45% device battery during long provincial van routes.'}
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              role="switch"
              aria-checked={isPowerSaver}
              onClick={handleTogglePowerSaver}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                isPowerSaver ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isPowerSaver ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Metrics summary banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
            <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{isKm ? 'ប្រេកង់ Refresh' : 'Map Refresh Rate'}</span>
              <span className="font-mono font-bold text-slate-800">{isPowerSaver ? '6.0s (Throttled)' : '1.5s (Standard)'}</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{isKm ? 'ការសន្សំថាមពល' : 'Battery Savings'}</span>
              <span className="font-mono font-bold text-emerald-700">{isPowerSaver ? '~45% Less Power' : 'Standard Drain'}</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">{isKm ? 'អនុសាសន៍' : 'Recommended For'}</span>
              <span className="font-bold text-slate-800">{isKm ? 'ផ្លូវជាតិ ២៥ ខេត្ត' : 'Highway 4-6h Trips'}</span>
            </div>
          </div>
        </div>

        {/* Live Testing & Action Bar */}
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-extrabold text-xs text-slate-800 block">
              {isKm ? 'សាកល្បងការជូនដំណឹង (Live Test Push)' : 'Test Push Notification Delivery'}
            </span>
            <span className="text-[11px] text-slate-500">
              {isKm
                ? 'ផ្ញើសារ Push សាកល្បងទៅកាន់ Browser ដើម្បីផ្ទៀងផ្ទាត់សំឡេង និងផ្ទាំងបង្ហាញ'
                : 'Send simulated milestone pushes to verify audio chime and browser banner.'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              disabled={isSendingTest}
              onClick={() => handleSendTestPush('out_for_delivery')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{isKm ? 'សាកល្បង "កំពុងចេញដឹក"' : 'Test Out-for-Delivery'}</span>
            </button>

            <button
              type="button"
              disabled={isSendingTest}
              onClick={() => handleSendTestPush('delivered')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>{isKm ? 'សាកល្បង "ដឹកដល់"' : 'Test Delivered'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-white text-xs font-bold transition cursor-pointer"
            >
              {isKm ? 'កំណត់ដើម' : 'Reset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
