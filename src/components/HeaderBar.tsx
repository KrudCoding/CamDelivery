import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  DollarSign, 
  Smartphone, 
  Monitor, 
  MapPin, 
  Sparkles, 
  CreditCard, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Home, 
  Truck, 
  UtensilsCrossed, 
  Search, 
  Code2, 
  Calendar, 
  Compass, 
  ChevronRight,
  ChevronDown,
  Check,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Language, Currency } from '../types';
import { MainTab } from './BottomNavBar';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { setSavedLanguage } from '../utils/offlineStorage';

interface HeaderBarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (cur: Currency) => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  selectedCity: string;
  onOpenAccount?: () => void;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
  currentTab?: MainTab;
  onSelectTab?: (tab: MainTab) => void;
  onNotify?: (msg: string) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  language,
  setLanguage,
  currency,
  setCurrency,
  isMobileFrame,
  setIsMobileFrame,
  selectedCity,
  onOpenAccount,
  themeMode = 'light',
  onToggleTheme,
  currentTab = 'home',
  onSelectTab,
  onNotify,
}) => {
  const isKm = language === 'km';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangDropdownOpen]);

  const handleSelectLanguage = (newLang: Language) => {
    setLanguage(newLang);
    setSavedLanguage(newLang);
    setIsLangDropdownOpen(false);
    if (onNotify) {
      onNotify(
        newLang === 'km'
          ? '🇰🇭 បានប្តូរភាសាទៅជា ភាសាខ្មែរ (រក្សាទុកក្នុង Session ជានិច្ច)'
          : '🇬🇧 Language switched to English (Saved globally across app sessions)'
      );
    }
  };

  return (
    <header className="bg-slate-900 dark:bg-[#070b12] text-white sticky top-0 z-40 border-b border-slate-800 dark:border-slate-800/80 shadow-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-950/40 text-white tracking-wider">
            CD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base md:text-lg tracking-tight text-slate-50">
                {isKm ? 'ដឹកជញ្ជូនកម្ពុជា (CamDelivery)' : 'CamDelivery Free'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                <span>{isKm ? 'ឥតគិតថ្លៃ ១០០%' : '100% Free'}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">{isKm ? 'កម្មវិធីឯករាជ្យ' : 'Independent'}</span>
              <span>•</span>
              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate max-w-[140px] md:max-w-xs">{selectedCity}</span>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* Server Sync Status Indicator (Local-Only vs Cloud-Connected & Timestamp) */}
          <SyncStatusIndicator
            language={language}
            onNotify={onNotify}
          />

          {/* Account & Banking quick button */}
          {onOpenAccount && (
            <button
              type="button"
              onClick={onOpenAccount}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer"
              title={isKm ? 'គណនីប្រើប្រាស់ និងគណនីធនាគារ' : 'User Accounts & Banking'}
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{isKm ? 'គណនី & ធនាគារ' : 'Banking'}</span>
            </button>
          )}

          {/* Frame switch button (Desktop vs Mobile Flutter Phone view) */}
          <button
            type="button"
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title={isMobileFrame ? 'ប្តូរទៅទម្រង់អេក្រង់ធំ (Desktop View)' : 'ប្តូរទៅទម្រង់ទូរស័ព្ទ Flutter (Phone Frame)'}
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">{isKm ? 'អេក្រង់ធំ' : 'Desktop View'}</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">{isKm ? 'ទូរស័ព្ទ Flutter' : 'Mobile Frame'}</span>
              </>
            )}
          </button>

          {/* Global Dark Mode Theme Toggle with Smooth Rotation & Color Shift Animation */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to High-Contrast Dark Mode'}
              className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all duration-300 cursor-pointer active:scale-95 ${
                themeMode === 'dark'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30 hover:border-amber-400/60 shadow-xs shadow-amber-500/10'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
              }`}
              title={
                themeMode === 'dark'
                  ? (isKm ? 'ប្តូរទៅម៉ូដពន្លឺ (Switch to Light Mode)' : 'Switch to Light Mode')
                  : (isKm ? 'ប្តូរទៅម៉ូដងងឹត កាត់បន្ថយការចាំងភ្នែក (Switch to Dark Mode)' : 'Switch to High-Contrast Dark Mode')
              }
            >
              {/* Animated Theme Toggle Icon Container with Rotation and Color Shift */}
              <div className="relative w-4 h-4 flex items-center justify-center">
                <Sun
                  className={`w-3.5 h-3.5 absolute transform transition-all duration-500 ease-in-out ${
                    themeMode === 'dark'
                      ? 'rotate-0 scale-100 opacity-100 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                      : 'rotate-90 scale-0 opacity-0 text-amber-500'
                  }`}
                />
                <Moon
                  className={`w-3.5 h-3.5 absolute transform transition-all duration-500 ease-in-out ${
                    themeMode === 'dark'
                      ? '-rotate-90 scale-0 opacity-0 text-indigo-400'
                      : 'rotate-0 scale-100 opacity-100 text-indigo-300 drop-shadow-[0_0_5px_rgba(165,180,252,0.4)]'
                  }`}
                />
              </div>
              <span className={`hidden sm:inline transition-colors duration-300 ${
                themeMode === 'dark' ? 'text-amber-300 font-bold' : 'text-slate-200'
              }`}>
                {themeMode === 'dark' ? (isKm ? 'ពន្លឺ' : 'Light') : (isKm ? 'ងងឹត' : 'Dark')}
              </span>
            </button>
          )}

          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrency('KHR')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                currency === 'KHR'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ៛ KHR
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                currency === 'USD'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              $ USD
            </button>
          </div>

          {/* Dedicated Persistent Language Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 via-slate-800 to-blue-600/30 hover:from-emerald-600/50 hover:to-blue-600/50 text-white border border-emerald-500/50 text-xs font-black transition shadow-xs cursor-pointer active:scale-95 group"
              title={isKm ? 'ជ្រើសរើសភាសាកម្មវិធី (Language Selection)' : 'Select App Language'}
              aria-label="Language selector dropdown"
              aria-expanded={isLangDropdownOpen}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform" />
              <span className="flex items-center gap-1">
                <span>{language === 'km' ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN'}</span>
                <span className="text-[10px] text-emerald-300 font-bold px-1.5 py-0.2 rounded-md bg-emerald-950/60 border border-emerald-500/30 hidden sm:inline">
                  {language === 'km' ? 'KM' : 'EN'}
                </span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-emerald-400/80 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Language Dropdown Menu */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/98 dark:bg-[#070b12]/98 border border-slate-700/80 shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 space-y-1">
                <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>{isKm ? 'ជ្រើសរើសភាសា' : 'Select Language'}</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono">
                    {isKm ? 'រក្សាទុក' : 'Persistent'}
                  </span>
                </div>

                {/* Option 1: Khmer */}
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('km')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition cursor-pointer group ${
                    language === 'km'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-black shadow-2xs'
                      : 'text-slate-200 hover:bg-slate-800/80 border border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl leading-none">🇰🇭</span>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>ភាសាខ្មែរ</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Khmer)</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isKm ? 'ភាសាផ្លូវការកម្ពុជា' : 'Official Cambodian language'}
                      </div>
                    </div>
                  </div>
                  {language === 'km' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Option 2: English */}
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('en')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition cursor-pointer group ${
                    language === 'en'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-black shadow-2xs'
                      : 'text-slate-200 hover:bg-slate-800/80 border border-transparent font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl leading-none">🇬🇧</span>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>English</span>
                        <span className="text-[10px] text-slate-400 font-normal">(អង់គ្លេស)</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isKm ? 'ភាសាអន្តរជាតិ' : 'International standard'}
                      </div>
                    </div>
                  </div>
                  {language === 'en' && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                <div className="pt-1.5 border-t border-slate-800/80 px-2 text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{isKm ? 'ចងចាំជម្រើសភាសាគ្រប់ Session ទាំងអស់' : 'Saved globally across app sessions'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Menu Button (មីនុយ) to jump directly to any view without scrolling */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
              isMenuOpen
                ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/40'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-sm'
            }`}
            title={isKm ? 'បើកមីនុយជ្រើសរើស (Quick Navigation Menu)' : 'Open Quick Menu'}
            aria-label="Navigation Menu"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden sm:inline">{isKm ? 'មីនុយ' : 'Menu'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Navigation Menu Panel (មីនុយរហ័សដើម្បីកុំឲ្យអូសចុះក្រោមវែង) */}
      {isMenuOpen && (
        <div className="border-t border-slate-800 bg-slate-900/98 dark:bg-[#070b12]/98 backdrop-blur-xl px-4 py-4 animate-in fade-in slide-in-from-top-3 shadow-2xl">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                  {isKm ? 'មីនុយរហ័ស CamDelivery • ជ្រើសរើសផ្នែកភ្លាមៗ' : 'CamDelivery Quick Menu • Jump Directly'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {isKm ? 'មិនបាច់អូសវែង ចូលប្រើភ្លាមៗ' : 'Instant Jump Without Scrolling'}
              </span>
            </div>

            {/* Quick Menu Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {[
                {
                  id: 'home' as MainTab,
                  labelKm: 'ទំព័រដើម',
                  labelEn: 'Home Hub',
                  subKm: 'សង្ខេប & រហ័ស',
                  subEn: 'Overview & Hub',
                  icon: <Home className="w-4 h-4 text-emerald-400" />,
                  bg: 'hover:bg-emerald-950/40 hover:border-emerald-500/50',
                },
                {
                  id: 'map' as MainTab,
                  labelKm: 'ផែនទី Google',
                  labelEn: 'Google Live Map',
                  subKm: 'ចរាចរណ៍ & គន្លងឡាន',
                  subEn: 'Traffic & Couriers',
                  icon: <Compass className="w-4 h-4 text-blue-400 animate-spin" />,
                  badge: isKm ? 'ថ្មី!' : 'NEW',
                  bg: 'hover:bg-blue-950/40 hover:border-blue-500/50',
                },
                {
                  id: 'courier' as MainTab,
                  labelKm: 'ផ្ញើឥវ៉ាន់ ២៥ ខេត្ត',
                  labelEn: 'Courier Shipping',
                  subKm: 'ឡានវ៉ែន & ដល់ផ្ទះ',
                  subEn: 'Van Fleets',
                  icon: <Truck className="w-4 h-4 text-indigo-400" />,
                  bg: 'hover:bg-indigo-950/40 hover:border-indigo-500/50',
                },
                {
                  id: 'food_ride' as MainTab,
                  labelKm: 'ម្ហូប & កង់បី',
                  labelEn: 'Food & Rides',
                  subKm: 'ផ្សារ & កង់បី 0%',
                  subEn: 'Market & TukTuks',
                  icon: <UtensilsCrossed className="w-4 h-4 text-amber-400" />,
                  bg: 'hover:bg-amber-950/40 hover:border-amber-500/50',
                },
                {
                  id: 'track' as MainTab,
                  labelKm: 'តាមដានកញ្ចប់',
                  labelEn: 'Universal Track',
                  subKm: 'ស្កេនបាកូដ & QR',
                  subEn: 'Barcode & Status',
                  icon: <Search className="w-4 h-4 text-rose-400" />,
                  bg: 'hover:bg-rose-950/40 hover:border-rose-500/50',
                },
                {
                  id: 'account' as MainTab,
                  labelKm: 'គណនី & ធនាគារ',
                  labelEn: 'Accounts & Bank',
                  subKm: 'Bakong KHQR & វិក្កយបត្រ',
                  subEn: 'KHQR & Invoices',
                  icon: <CreditCard className="w-4 h-4 text-teal-400" />,
                  bg: 'hover:bg-teal-950/40 hover:border-teal-500/50',
                },
              ].map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (onSelectTab) onSelectTab(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                        : `bg-slate-800/60 border-slate-700/80 ${item.bg}`
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60">
                        {item.icon}
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5">
                      <h4 className="font-bold text-xs text-white truncate">
                        {isKm ? item.labelKm : item.labelEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {isKm ? item.subKm : item.subEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Feature Shortcuts inside the Menu */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400">
                  {isKm ? 'ឧបករណ៍សំខាន់ៗ៖' : 'Shortcuts:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTab) onSelectTab('map');
                    setIsMenuOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 border border-blue-700/50 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span>{isKm ? 'ផ្ទាំងផែនទី Google Map' : 'Google Map Live'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTab) onSelectTab('home');
                    setIsMenuOpen(false);
                    setTimeout(() => {
                      document.getElementById('home-tab-schedule')?.click();
                    }, 100);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 border border-emerald-700/50 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>{isKm ? 'កក់ថ្ងៃដឹកទុកមុន (Scheduled)' : 'Schedule Pickup'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTab) onSelectTab('track');
                    setIsMenuOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-800/50 text-rose-300 border border-rose-700/50 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{isKm ? 'ស្កេនបាកូដ / QR កញ្ចប់' : 'Scan Waybill QR'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="text-[11px] text-slate-400 hover:text-slate-200 transition font-medium cursor-pointer"
              >
                {isKm ? '✕ បិទមីនុយ' : '✕ Close Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

