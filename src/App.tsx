/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, Currency, TrackingItem } from './types';
import { INITIAL_TRACKING_DATA } from './data/carriers';
import { HeaderBar } from './components/HeaderBar';
import { BottomNavBar, MainTab } from './components/BottomNavBar';
import { HomeHubView } from './components/HomeHubView';
import { MapDashboard } from './components/MapDashboard';
import { CourierCompareView } from './components/CourierCompareView';
import { FoodAndRideView } from './components/FoodAndRideView';
import { LiveTrackingView } from './components/LiveTrackingView';
import { FlutterExportView } from './components/FlutterExportView';
import { AccountAndBankingView } from './components/AccountAndBankingView';
import { BiometricAuthScreen } from './components/BiometricAuthScreen';
import { 
  loadCachedShipments, 
  saveCachedShipments, 
  useOnlineStatus,
  getSavedLanguage,
  setSavedLanguage,
  getSavedCurrency,
  setSavedCurrency
} from './utils/offlineStorage';
import { getSavedTheme, applyTheme, ThemeMode } from './utils/themeService';
import { CheckCircle, Smartphone, Wifi, WifiOff, Battery, Signal, Database, Globe } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => getSavedLanguage());
  const [isLanguageSwitching, setIsLanguageSwitching] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [langPillNotification, setLangPillNotification] = useState<{ text: string; sub: string; flag: string } | null>(null);
  const [currency, setCurrency] = useState<Currency>(() => getSavedCurrency());
  const [themeMode, setThemeMode] = useState<ThemeMode>(getSavedTheme);
  const [currentTab, setCurrentTab] = useState<MainTab>('home');
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [activeShipments, setActiveShipments] = useState<TrackingItem[]>(() => loadCachedShipments());
  const [selectedTrackingCode, setSelectedTrackingCode] = useState<string>('KH-VAN-882910');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAccountAuthenticated, setIsAccountAuthenticated] = useState<boolean>(false);

  const isOnline = useOnlineStatus();
  const isKm = language === 'km';

  // Apply theme to DOM on mount and updates
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  // Sync language to persistent offline storage
  useEffect(() => {
    setSavedLanguage(language);
  }, [language]);

  // Sync currency to persistent offline storage
  useEffect(() => {
    setSavedCurrency(currency);
  }, [currency]);

  const handleToggleTheme = () => {
    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    applyTheme(next);
    showToast(
      next === 'dark'
        ? (isKm ? '🌙 បានបើកដំណើរការម៉ូដងងឹត (High-Contrast Dark Mode)' : '🌙 High-contrast dark mode enabled')
        : (isKm ? '☀️ បានបើកដំណើរការម៉ូដពន្លឺ (Light Mode)' : '☀️ Light mode enabled')
    );
  };

  // Toggle currency globally across App, CourierCompareView, and HomeHubView
  const handleToggleCurrency = (nextCurrency: Currency) => {
    setCurrency(nextCurrency);
    setSavedCurrency(nextCurrency);
    showToast(
      nextCurrency === 'KHR'
        ? (isKm ? 'បានប្តូររូបិយប័ណ្ណបង្ហាញទៅជា ៛ KHR (ប្រាក់រៀល) • តម្លៃទំនិញត្រូវបានធ្វើបច្ចុប្បន្នភាព' : 'Display currency switched to ៛ KHR • Price labels updated across Home Hub & Courier Compare')
        : (isKm ? 'បានប្តូររូបិយប័ណ្ណបង្ហាញទៅជា $ USD (ដុល្លារ) • តម្លៃទំនិញត្រូវបានធ្វើបច្ចុប្បន្នភាព' : 'Display currency switched to $ USD • Price labels updated across Home Hub & Courier Compare')
    );
  };

  // Smooth fade-in transition when switching language
  const handleToggleLanguage = (targetLang: Language) => {
    setSavedLanguage(targetLang);
    if (targetLang === language) return;

    // Begin subtle fade-out transition
    setIsLanguageSwitching(true);

    setTimeout(() => {
      setLanguage(targetLang);
      setIsLanguageSwitching(false);
      setIsFadingIn(true);

      const pill = targetLang === 'km'
        ? { text: 'ភាសាខ្មែរ', sub: 'Khmer Language Enabled', flag: '🇰🇭' }
        : { text: 'English', sub: 'ភាសាអង់គ្លេស', flag: '🇬🇧' };
      setLangPillNotification(pill);

      setTimeout(() => {
        setIsFadingIn(false);
      }, 420);

      setTimeout(() => {
        setLangPillNotification(null);
      }, 2200);
    }, 120);
  };

  // Persist shipments into offline storage on any change
  useEffect(() => {
    saveCachedShipments(activeShipments);
  }, [activeShipments]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleBookShipmentSuccess = (newShipment: TrackingItem) => {
    setActiveShipments((prev) => {
      const next = [newShipment, ...prev];
      saveCachedShipments(next);
      return next;
    });
    setSelectedTrackingCode(newShipment.trackingNumber);
    showToast(
      isKm
        ? `កក់ជោគជ័យ! លេខកូដតាមដានគឺ #${newShipment.trackingNumber}`
        : `Booking confirmed! Tracking #${newShipment.trackingNumber}`
    );
    // Switch to Tracking view automatically
    setCurrentTab('track');
  };

  const handleUpdateShipment = (updatedShipment: TrackingItem) => {
    setActiveShipments((prev) => {
      const next = prev.map((s) => (s.trackingNumber === updatedShipment.trackingNumber ? updatedShipment : s));
      saveCachedShipments(next);
      return next;
    });
    showToast(
      isKm
        ? `បានកែសម្រួលទិន្នន័យកញ្ចប់ #${updatedShipment.trackingNumber} ជោគជ័យ`
        : `Updated #${updatedShipment.trackingNumber} successfully`
    );
  };

  const handleSelectShipment = (trackingNum: string) => {
    setSelectedTrackingCode(trackingNum);
    setCurrentTab('track');
  };

  const renderActiveTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeHubView
            language={language}
            currency={currency}
            onNavigateTab={(tab) => setCurrentTab(tab as any)}
            activeShipments={activeShipments}
            onSelectShipmentToTrack={handleSelectShipment}
            onNotify={(msg) => showToast(msg)}
            onScheduleShipment={(scheduledItem) => {
              setActiveShipments((prev) => {
                const next = [scheduledItem, ...prev];
                saveCachedShipments(next);
                return next;
              });
              showToast(
                isKm
                  ? `បានកក់ការដឹកជញ្ជូនទុកមុនជោគជ័យ! លេខកូដ #${scheduledItem.trackingNumber}`
                  : `Scheduled delivery pre-booked! Tracking #${scheduledItem.trackingNumber}`
              );
            }}
          />
        );
      case 'map':
        return (
          <MapDashboard
            language={language}
            currency={currency}
            activeShipments={activeShipments}
            onSelectShipmentToTrack={handleSelectShipment}
            onNavigateTab={(tab) => setCurrentTab(tab as any)}
            onNotify={(msg) => showToast(msg)}
          />
        );
      case 'courier':
        return (
          <CourierCompareView
            language={language}
            currency={currency}
            onBookSuccess={handleBookShipmentSuccess}
          />
        );
      case 'food_ride':
        return (
          <FoodAndRideView
            language={language}
            currency={currency}
            onDispatchActive={(info) => showToast(info)}
          />
        );
      case 'track':
        return (
          <LiveTrackingView
            language={language}
            currency={currency}
            activeShipments={activeShipments}
            selectedTrackingNumber={selectedTrackingCode}
            onUpdateShipment={handleUpdateShipment}
          />
        );
      case 'account':
        if (!isAccountAuthenticated) {
          return (
            <BiometricAuthScreen
              language={language}
              onSuccess={() => {
                setIsAccountAuthenticated(true);
                showToast(
                  isKm
                    ? '🔓 ការផ្ទៀងផ្ទាត់ជីវមាត្រជោគជ័យ! បានចូលប្រើប្រាស់គណនី និងធនាគារ'
                    : '🔓 Biometric access verified! Welcome to Account & Banking Profile'
                );
              }}
              onCancel={() => {
                setCurrentTab('home');
              }}
            />
          );
        }
        return (
          <AccountAndBankingView
            language={language}
            currency={currency}
            onCurrencyChange={handleToggleCurrency}
            onNotify={(msg) => showToast(msg)}
            onLockProfile={() => {
              setIsAccountAuthenticated(false);
              showToast(
                isKm
                  ? '🔒 បានចាក់សោសុវត្ថិភាពជីវមាត្រឡើងវិញ'
                  : '🔒 Profile locked with biometric security'
              );
            }}
          />
        );
      case 'flutter_code':
        return <FlutterExportView language={language} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-rose-500 selection:text-white transition-all duration-300 ease-out ${
        isLanguageSwitching
          ? 'opacity-25 scale-[0.998] blur-[0.5px] pointer-events-none'
          : isFadingIn
          ? 'animate-lang-fade-in opacity-100 scale-100 blur-0'
          : 'opacity-100 scale-100 blur-0'
      }`}
    >
      {/* Global Top App Bar */}
      <HeaderBar
        language={language}
        setLanguage={handleToggleLanguage}
        currency={currency}
        setCurrency={handleToggleCurrency}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        selectedCity={isKm ? 'រាជធានីភ្នំពេញ • សង្កាត់បឹងកេងកង' : 'Phnom Penh • BKK1'}
        onOpenAccount={() => setCurrentTab('account')}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onNotify={(msg) => showToast(msg)}
      />

      {/* Language Switch Floating Pill Badge */}
      {langPillNotification && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl border border-emerald-500/60 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-none">
          <span className="text-base">{langPillNotification.flag}</span>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-emerald-400">{langPillNotification.text}</span>
            <span className="text-slate-400 text-[11px] font-normal">• {langPillNotification.sub}</span>
          </div>
        </div>
      )}

      {/* Offline Status Persistent Alert Strip (when disconnected) */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
          <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
          <span>
            {isKm
              ? 'កំពុងដំណើរការក្រៅបណ្តាញ (Offline Mode) • ប្រវត្តិតាមដាន និងគណនីរបស់អ្នកត្រូវបានរក្សាទុកក្នុងទូរស័ព្ទ / កុំព្យូទ័រ'
              : 'Offline Mode • Recent tracking history and account details are safely cached locally in LocalStorage'}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 bg-amber-600/30 px-2 py-0.5 rounded-full text-[11px]">
            <Database className="w-3 h-3" />
            <span>Cached</span>
          </span>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-500/50 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* App Body Container */}
      <main className="flex-1 flex justify-center py-4 px-2 sm:px-4 pb-24">
        {isMobileFrame ? (
          /* Mobile Phone Mockup (Flutter device shell) */
          <div className="w-full max-w-[420px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative">
            {/* Speaker & camera notch */}
            <div className="h-6 flex items-center justify-between px-6 text-white text-[11px] mb-1 font-semibold">
              <span>9:41</span>
              <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto" />
              <div className="flex items-center gap-1 text-[10px]">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Inner screen viewport */}
            <div className="bg-slate-50 rounded-[32px] overflow-hidden min-h-[720px] max-h-[780px] overflow-y-auto p-3 shadow-inner relative">
              {renderActiveTabContent()}
            </div>

            {/* Home indicator bar */}
            <div className="h-4 flex items-center justify-center pt-1">
              <div className="w-28 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>
        ) : (
          /* Fluid Wide / Standard Viewport */
          <div className="w-full max-w-6xl mx-auto">
            {renderActiveTabContent()}
          </div>
        )}
      </main>

      {/* Flutter Style Bottom Navigation Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        language={language}
      />
    </div>
  );
}
