import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Lock,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Send,
  Sliders,
  Wallet
} from 'lucide-react';
import { Language, Currency } from '../types';

export const COURIER_PAYOUT_STORAGE_KEY = 'camdelivery_partner_payout_settings_v1';

export interface CourierPayoutSettings {
  payoutProvider: 'aba' | 'wing';
  abaAccountNumber: string;
  abaAccountName: string;
  wingAccountNumber: string;
  wingAccountName: string;
  payoutCurrency: Currency;
  payoutFrequency: 'instant' | 'daily_batch';
  minimumThresholdKHR: number;
  autoTransferEnabled: boolean;
  bakongId: string;
}

const DEFAULT_PAYOUT_SETTINGS: CourierPayoutSettings = {
  payoutProvider: 'aba',
  abaAccountNumber: '001 889 221',
  abaAccountName: 'SOK MEAS (CAMDELIVERY PARTNER)',
  wingAccountNumber: '012 345 678',
  wingAccountName: 'SOK MEAS',
  payoutCurrency: 'KHR',
  payoutFrequency: 'instant',
  minimumThresholdKHR: 10000,
  autoTransferEnabled: true,
  bakongId: 'sokmeas@aba',
};

interface CourierPayoutSettingsSectionProps {
  language: Language;
  currency: Currency;
  onNotify: (msg: string) => void;
  className?: string;
}

export const CourierPayoutSettingsSection: React.FC<CourierPayoutSettingsSectionProps> = ({
  language,
  currency,
  onNotify,
  className = '',
}) => {
  const isKm = language === 'km';

  const [settings, setSettings] = useState<CourierPayoutSettings>(() => {
    try {
      const cached = localStorage.getItem(COURIER_PAYOUT_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Error reading payout settings:', e);
    }
    return DEFAULT_PAYOUT_SETTINGS;
  });

  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isSimulatingPayout, setIsSimulatingPayout] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync to localStorage
  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem(COURIER_PAYOUT_STORAGE_KEY, JSON.stringify(settings));
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
      onNotify(
        isKm
          ? '⚙️ ការកំណត់ការទូទាត់ប្រាក់ចំណូល (Payout Settings) ត្រូវបានរក្សាទុកជោគជ័យ!'
          : '⚙️ Courier partner payout settings successfully saved!'
      );
    } catch (e) {
      console.error('Error saving payout settings:', e);
    }
  };

  const handleCopy = (text: string, fieldId: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const handleTestDigitalPayout = () => {
    if (isSimulatingPayout) return;
    setIsSimulatingPayout(true);

    setTimeout(() => {
      setIsSimulatingPayout(false);
      const providerLabel = settings.payoutProvider === 'aba' ? 'ABA Bank (ABA PAY)' : 'Wing Bank (WingPay)';
      const targetAcc = settings.payoutProvider === 'aba' ? settings.abaAccountNumber : settings.wingAccountNumber;
      onNotify(
        isKm
          ? `💸 ការទូទាត់សាកល្បង ៥,០០០ ៛ (កាត់កម្រៃ 0%) ត្រូវបានផ្ទេរចូល ${providerLabel} #${targetAcc} ជោគជ័យ!`
          : `💸 Test digital payout 5,000 ៛ (0% fee) successfully settled into ${providerLabel} #${targetAcc}!`
      );
    }, 1200);
  };

  return (
    <div id="payout-settings-section" className={`bg-white rounded-3xl p-5 md:p-7 border border-slate-200 shadow-sm space-y-6 ${className}`}>
      {/* Header with 0% Commission Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base sm:text-lg text-slate-900">
                {isKm ? 'ការកំណត់ការទូទាត់ប្រាក់ចំណូលដៃគូដឹកជញ្ជូន (Payout Settings)' : 'Courier Partner Payout Settings'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{isKm ? 'កម្រៃជើងសារ 0% ជានិច្ច' : '0% Commission Guaranteed'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isKm
                ? 'កំណត់គណនីធនាគារ ABA ឬ Wing របស់អ្នកដើម្បីទទួលប្រាក់ចំណូលពីការដឹកជញ្ជូន និងថ្លៃសេវា។ CamDelivery មិនកាត់កម្រៃជើងសារសូម្បីតែ ១ រៀល (100% ចូលគណនីអ្នក)។'
                : 'Configure your ABA Bank or Wing account to receive automatic digital payouts for parcel deliveries. 100% of customer shipping revenue is transferred with zero platform deduction.'}
            </p>
          </div>
        </div>

        {/* 0% Guarantee Pill Box */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 p-3 rounded-2xl border border-emerald-200/80 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
            0%
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-emerald-950 block">
              {isKm ? 'ការសន្យាកម្រៃ 0%' : 'Zero Middleman Fee'}
            </span>
            <span className="text-[11px] text-emerald-700">
              {isKm ? 'ផ្ទេរផ្ទាល់តាមបាគង NBC' : 'Direct Bakong NBC Clearing'}
            </span>
          </div>
        </div>
      </div>

      {/* 0% Commission Promise Transparency Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="font-black text-sm text-white">
                {isKm ? 'តម្លាភាព ១០០% • ការសន្យាមិនកាត់កម្រៃជើងសារ CamDelivery' : '100% Transparency • Zero Commission Promise'}
              </h4>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {isKm
                ? 'ប្រាក់ឈ្នួលដឹកជញ្ជូន ថ្លៃឥវ៉ាន់លើសទម្ងន់ និងប្រាក់ឧបត្ថម្ភ (Tips) ពីអតិថិជន នឹងត្រូវផ្ទេរចូលគណនី ABA Bank ឬ Wing របស់អ្នកពេញលេញ ដោយមិនមានការកាត់ថ្លៃសេវាលាក់កំបាំងឡើយ។'
                : 'All delivery fares, excess weight fees, and customer tips are routed directly to your configured ABA or Wing digital account with no platform cut.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs shrink-0 bg-white/10 p-2.5 rounded-xl border border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">{isKm ? 'ថ្លៃអតិថិជន' : 'Customer Fee'}</span>
              <span className="font-mono font-bold text-white">100%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">{isKm ? 'កម្រៃវេទិកា' : 'Platform Cut'}</span>
              <span className="font-mono font-black text-amber-300">0%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">{isKm ? 'ចំណូលសុទ្ធ' : 'You Receive'}</span>
              <span className="font-mono font-bold text-emerald-400">100%</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* Step 1: Select Digital Payout Provider (ABA vs Wing) */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>{isKm ? '១. ជ្រើសរើសធនាគារទទួលប្រាក់ចំណូលចម្បង (ABA ឬ WING)' : '1. Select Primary Digital Payout Channel (ABA or Wing)'}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {isKm ? 'គាំទ្រទាំងពីរ' : 'Both supported'}
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ABA Bank Option */}
            <div
              onClick={() => setSettings({ ...settings, payoutProvider: 'aba' })}
              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                settings.payoutProvider === 'aba'
                  ? 'bg-blue-50/80 border-[#003B64] ring-2 ring-[#003B64]/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#003B64] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  ABA
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      ABA Bank (ABA PAY)
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-100 text-[#003B64] font-bold">
                      Instant
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {isKm ? 'ផ្ទេរប្រាក់ភ្លាមៗ ២៤/៧ តាមលេខគណនី ឬ KHQR' : 'Instant 24/7 transfers via ABA account or KHQR'}
                  </span>
                </div>
              </div>
              {settings.payoutProvider === 'aba' && (
                <div className="w-6 h-6 rounded-full bg-[#003B64] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Wing Bank Option */}
            <div
              onClick={() => setSettings({ ...settings, payoutProvider: 'wing' })}
              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                settings.payoutProvider === 'wing'
                  ? 'bg-lime-50/80 border-[#65B32E] ring-2 ring-[#65B32E]/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#65B32E] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  WING
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      Wing Bank (WingPay)
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-lime-100 text-[#4c8922] font-bold">
                      Cash-Out Easy
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {isKm ? 'ដកប្រាក់ងាយស្រួលតាមភ្នាក់ងារវីងទូទាំងប្រទេស' : 'Easy cash-out via Wing agents nationwide'}
                  </span>
                </div>
              </div>
              {settings.payoutProvider === 'wing' && (
                <div className="w-6 h-6 rounded-full bg-[#65B32E] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Account Details Form */}
        <div className="space-y-4 pt-1">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>
              {isKm 
                ? `២. បញ្ចូលព័ត៌មានគណនី ${settings.payoutProvider === 'aba' ? 'ABA Bank' : 'Wing Bank'}`
                : `2. Configure ${settings.payoutProvider === 'aba' ? 'ABA Bank' : 'Wing Bank'} Details`}
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {settings.payoutProvider === 'aba'
                  ? (isKm ? 'លេខគណនី ABA Bank (៩ ឬ ១០ ខ្ទង់)' : 'ABA Account Number (9-10 digits)')
                  : (isKm ? 'លេខគណនី Wing / លេខទូរស័ព្ទ' : 'Wing Account Number / Phone')}
              </label>
              <input
                type="text"
                required
                value={settings.payoutProvider === 'aba' ? settings.abaAccountNumber : settings.wingAccountNumber}
                onChange={(e) => {
                  if (settings.payoutProvider === 'aba') {
                    setSettings({ ...settings, abaAccountNumber: e.target.value });
                  } else {
                    setSettings({ ...settings, wingAccountNumber: e.target.value });
                  }
                }}
                placeholder={settings.payoutProvider === 'aba' ? '001 234 567' : '012 345 678'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isKm ? 'ឈ្មោះម្ចាស់គណនី (ជាអក្សរឡាតាំង ដូចក្នុងអត្តសញ្ញាណប័ណ្ណ)' : 'Account Holder Name (Latin letters as in ID)'}
              </label>
              <input
                type="text"
                required
                value={settings.payoutProvider === 'aba' ? settings.abaAccountName : settings.wingAccountName}
                onChange={(e) => {
                  if (settings.payoutProvider === 'aba') {
                    setSettings({ ...settings, abaAccountName: e.target.value.toUpperCase() });
                  } else {
                    setSettings({ ...settings, wingAccountName: e.target.value.toUpperCase() });
                  }
                }}
                placeholder="SOK MEAS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Payout Currency */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isKm ? 'រូបិយប័ណ្ណទទួលប្រាក់ (Payout Currency)' : 'Settlement Currency'}
              </label>
              <select
                value={settings.payoutCurrency}
                onChange={(e) => setSettings({ ...settings, payoutCurrency: e.target.value as Currency })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="KHR">{isKm ? '៛ ប្រាក់រៀលខ្មែរ (KHR) - គ្មានកន្ទុយសេន' : '៛ Cambodian Riel (KHR) - Standard'}</option>
                <option value="USD">{isKm ? '$ ដុល្លារអាមេរិក (USD)' : '$ US Dollar (USD)'}</option>
              </select>
            </div>

            {/* Payout Frequency / Trigger */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isKm ? 'កាលវិភាគផ្ទេរប្រាក់ចំណូល' : 'Payout Transfer Frequency'}
              </label>
              <select
                value={settings.payoutFrequency}
                onChange={(e) => setSettings({ ...settings, payoutFrequency: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="instant">{isKm ? '⚡ ផ្ទេរភ្លាមៗពេលអតិថិជនទទួលកញ្ចប់ជោគជ័យ' : '⚡ Instant Transfer after every completed delivery'}</option>
                <option value="daily_batch">{isKm ? '🌇 បូកសរុបផ្ទេរម្តងនៅចុងម៉ោងធ្វើការ (ម៉ោង ៦:០០ ល្ងាច)' : '🌇 Daily Batch at end of business hours (06:00 PM)'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Auto Transfer & Minimum Threshold */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-extrabold text-xs text-slate-900 block">
                {isKm ? 'ការផ្ទេរប្រាក់ដោយស្វ័យប្រវត្ត (Auto-Transfer)' : 'Automated Digital Payout'}
              </span>
              <p className="text-[11px] text-slate-500">
                {isKm
                  ? 'ប្រាក់ចំណូលនឹងត្រូវផ្ទេរដោយស្វ័យប្រវត្តតាមប្រព័ន្ធបាគង KHQR ចូលគណនីរបស់អ្នក ដោយមិនចាំបាច់ចុចដកឡើយ'
                  : 'Earnings settle automatically into your ABA or Wing account without manual withdrawal requests'}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.autoTransferEnabled}
              onClick={() => setSettings({ ...settings, autoTransferEnabled: !settings.autoTransferEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.autoTransferEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.autoTransferEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {isKm ? 'កម្រិតប្រាក់អប្បបរមាសម្រាប់ការផ្ទេរស្វ័យប្រវត្ត៖' : 'Minimum Auto-Payout Threshold:'}
            </span>
            <span className="font-mono font-bold text-slate-800">
              {settings.payoutCurrency === 'KHR' ? '10,000 ៛' : '$2.50'}
            </span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Test Payout Simulation */}
          <button
            type="button"
            disabled={isSimulatingPayout}
            onClick={handleTestDigitalPayout}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Simulate a test digital payout of 5,000 KHR"
          >
            {isSimulatingPayout ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>{isKm ? 'កំពុងសាកល្បង...' : 'Testing Transfer...'}</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{isKm ? 'សាកល្បងផ្ទេរ (Test Digital Payout)' : 'Simulate Test Digital Payout'}</span>
              </>
            )}
          </button>

          {/* Save Payout Settings Button */}
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 cursor-pointer"
          >
            {isSavedRecently ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>{isKm ? 'បានរក្សាទុកជោគជ័យ!' : 'Settings Saved!'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{isKm ? 'រក្សាទុកការកំណត់ការទូទាត់ (Save Payout Settings)' : 'Save Payout Settings'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
