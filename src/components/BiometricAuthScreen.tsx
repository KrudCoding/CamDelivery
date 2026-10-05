import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ScanFace,
  Fingerprint,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  CreditCard,
  Building2,
  Smartphone
} from 'lucide-react';
import { Language } from '../types';

interface BiometricAuthScreenProps {
  language: Language;
  onSuccess: () => void;
  onCancel: () => void;
  accountName?: string;
}

// Biometric audio beep chime
function playBiometricBeep(success: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (success) {
      // 2-tone melodic success chime (F5 -> C6)
      [698.46, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.25);
      });
    } else {
      // Gentle double error pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Ignore audio restriction
  }
}

export const BiometricAuthScreen: React.FC<BiometricAuthScreenProps> = ({
  language,
  onSuccess,
  onCancel,
  accountName = 'Sok Vicheka',
}) => {
  const isKm = language === 'km';

  // Biometric preferences state (stored in localStorage)
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('camdelivery_biometric_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [authMethod, setAuthMethod] = useState<'face' | 'fingerprint' | 'pin'>('face');
  const [authStatus, setAuthStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Save biometric toggle preference
  const handleToggleBiometricPreference = (enabled: boolean) => {
    setIsBiometricEnabled(enabled);
    try {
      localStorage.setItem('camdelivery_biometric_enabled', String(enabled));
    } catch {
      // Ignore
    }
  };

  // Trigger simulated biometric verification
  const handleScanBiometrics = () => {
    if (authStatus === 'scanning') return;
    setAuthStatus('scanning');

    setTimeout(() => {
      setAuthStatus('success');
      playBiometricBeep(true);

      setTimeout(() => {
        onSuccess();
      }, 750);
    }, 1200);
  };

  // Trigger PIN verification fallback
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput.length >= 4) {
      setAuthStatus('success');
      playBiometricBeep(true);
      setTimeout(() => {
        onSuccess();
      }, 600);
    } else {
      setPinError(isKm ? 'លេខកូដ PIN មិនត្រឹមត្រូវ (សូមសាកល្បងលេខ 1234)' : 'Incorrect PIN. (Try demo PIN: 1234)');
      playBiometricBeep(false);
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-lg animate-fade-in overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl text-white overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Background Aura */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {isKm ? 'ការផ្ទៀងផ្ទាត់សុវត្ថិភាពជីវមាត្រ' : 'Biometric Security Access'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isKm ? 'ការពារគណនី និងទិន្នន័យធនាគារ Bakong KHQR' : 'Protected Shipping & Bank Accounts'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 relative z-10 text-center">
          {/* Target Profile Card */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                {accountName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {isKm ? 'គណនីដឹកជញ្ជូន & ធនាគារ' : 'Shipping & Banking Profile'}
                </span>
                <span className="text-sm font-bold text-white block">
                  {accountName}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-emerald-400" />
              <span>{isKm ? 'សុវត្ថិភាព' : 'Encrypted'}</span>
            </span>
          </div>

          {/* Biometric Method Selector (Face ID vs Fingerprint vs PIN) */}
          <div className="flex items-center justify-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('face');
                setAuthStatus('idle');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMethod === 'face'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Face ID</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('fingerprint');
                setAuthStatus('idle');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMethod === 'fingerprint'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>{isKm ? 'ស្នាមម្រាមដៃ' : 'Touch ID'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('pin');
                setAuthStatus('idle');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMethod === 'pin'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN</span>
            </button>
          </div>

          {/* INTERACTIVE SCANNER VISUALIZER */}
          {authMethod === 'face' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div 
                onClick={handleScanBiometrics}
                className="relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer group"
                title={isKm ? 'ចុចដើម្បីស្កេនផ្ទៃមុខ Face ID' : 'Click to scan Face ID'}
              >
                {/* Outer aperture ring */}
                <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
                  authStatus === 'scanning'
                    ? 'border-emerald-400 animate-spin border-t-transparent'
                    : authStatus === 'success'
                    ? 'border-emerald-500 ring-4 ring-emerald-500/30'
                    : 'border-slate-700 group-hover:border-emerald-500/80'
                }`} />

                {/* Inner target frame */}
                <div className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                  authStatus === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/30'
                    : authStatus === 'scanning'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'bg-slate-950 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-800/80'
                }`}>
                  {authStatus === 'success' ? (
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-in zoom-in-75 duration-300" />
                  ) : (
                    <ScanFace className={`w-14 h-14 transition ${authStatus === 'scanning' ? 'animate-pulse text-emerald-400' : ''}`} />
                  )}
                </div>

                {/* Scanning horizontal line beam */}
                {authStatus === 'scanning' && (
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[bounce_1.2s_infinite] shadow-[0_0_8px_#10b981]" />
                )}
              </div>

              <div>
                <p className="font-extrabold text-sm text-white">
                  {authStatus === 'scanning'
                    ? (isKm ? 'កំពុងស្កេនទម្រង់ផ្ទៃមុខ 3D Biometrics...' : 'Scanning 3D facial landmarks...')
                    : authStatus === 'success'
                    ? (isKm ? '✓ បានផ្ទៀងផ្ទាត់ Face ID ជោគជ័យ!' : '✓ Face ID Verified Successfully!')
                    : (isKm ? 'ចុចលើស៊ុមខាងលើ ដើម្បីស្កេន Face ID' : 'Tap the circle above to scan Face ID')}
                </p>
                <span className="text-[11px] text-slate-400">
                  {isKm ? 'ប្រើកាមេរ៉ាស្កេនផ្ទៃមុខយ៉ាងរហ័ស ០.៨ វិនាទី' : 'Quick secure 3D face recognition on device'}
                </span>
              </div>

              {authStatus !== 'scanning' && authStatus !== 'success' && (
                <button
                  type="button"
                  onClick={handleScanBiometrics}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-950/60 transition flex items-center gap-2 cursor-pointer"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>{isKm ? 'ផ្ទៀងផ្ទាត់ដោយ Face ID' : 'Verify with Face ID'}</span>
                </button>
              )}
            </div>
          )}

          {authMethod === 'fingerprint' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div 
                onClick={handleScanBiometrics}
                className="relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer group"
                title={isKm ? 'ចុចដាក់ម្រាមដៃលើសញ្ញាស្នាមម្រាមដៃ' : 'Touch fingerprint sensor'}
              >
                {/* Ripple wave animations */}
                {authStatus === 'scanning' && (
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                )}

                <div className={`w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  authStatus === 'success'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/30'
                    : authStatus === 'scanning'
                    ? 'border-emerald-400 bg-slate-800 text-emerald-400'
                    : 'border-slate-700 bg-slate-950 text-slate-400 group-hover:border-emerald-500/80 group-hover:text-emerald-400'
                }`}>
                  {authStatus === 'success' ? (
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-in zoom-in-75 duration-300" />
                  ) : (
                    <Fingerprint className={`w-14 h-14 transition ${authStatus === 'scanning' ? 'animate-pulse text-emerald-400 scale-110' : ''}`} />
                  )}
                </div>
              </div>

              <div>
                <p className="font-extrabold text-sm text-white">
                  {authStatus === 'scanning'
                    ? (isKm ? 'កំពុងអានក្រយ៉ៅដៃ (Fingerprint Sensor)...' : 'Reading capacitive fingerprint ridges...')
                    : authStatus === 'success'
                    ? (isKm ? '✓ បានផ្ទៀងផ្ទាត់ស្នាមម្រាមដៃជោគជ័យ!' : '✓ Fingerprint Matched Successfully!')
                    : (isKm ? 'ដាក់ម្រាមដៃលើរូបខាងលើដើម្បីស្កេន' : 'Place finger on sensor to unlock')}
                </p>
                <span className="text-[11px] text-slate-400">
                  {isKm ? 'គាំទ្រ Touch ID និងឧបករណ៍ចាប់សញ្ញាលើអេក្រង់' : 'Supports capacitive and under-display optical sensors'}
                </span>
              </div>

              {authStatus !== 'scanning' && authStatus !== 'success' && (
                <button
                  type="button"
                  onClick={handleScanBiometrics}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-950/60 transition flex items-center gap-2 cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>{isKm ? 'ស្កេនស្នាមម្រាមដៃឥឡូវនេះ' : 'Scan Fingerprint Sensor'}</span>
                </button>
              )}
            </div>
          )}

          {authMethod === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4 max-w-xs mx-auto py-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isKm ? 'បញ្ចូលលេខកូដសម្ងាត់ PIN (៤ ខ្ទង់)' : 'Enter 4-Digit Security PIN'}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="••••"
                  className="w-full text-center tracking-widest text-2xl font-mono py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  autoFocus
                />
                {pinError && (
                  <p className="text-[11px] text-rose-400 mt-1 font-medium">{pinError}</p>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isKm ? 'លេខកូដគំរូសាកល្បង៖ 1234' : 'Default demo PIN: 1234'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-md transition cursor-pointer"
              >
                {isKm ? 'បញ្ជាក់លេខកូដ PIN' : 'Confirm PIN & Unlock'}
              </button>
            </form>
          )}

          {/* Quick Option to Enable/Disable Biometrics */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-left">
            <div>
              <div className="text-xs font-bold text-slate-200">
                {isKm ? 'បើកដំណើរការ Face ID / ស្នាមម្រាមដៃ' : 'Enable Face ID / Fingerprint'}
              </div>
              <div className="text-[10px] text-slate-400">
                {isKm ? 'ចូលប្រើប្រវត្តិរូប និងគណនីធនាគារបានរហ័ស' : 'Quick secure access to shipping & banking'}
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isBiometricEnabled}
                onChange={(e) => handleToggleBiometricPreference(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Modal Bottom Cancel / Bypass Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white transition cursor-pointer font-medium"
          >
            {isKm ? '← ត្រឡប់ទៅទំព័រដើមវិញ' : '← Return to Hub'}
          </button>

          <button
            type="button"
            onClick={onSuccess}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer flex items-center gap-1"
          >
            <span>{isKm ? 'រំលងការស្កេន (Demo Bypass)' : 'Bypass for Demo'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
