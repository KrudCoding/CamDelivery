import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Server,
  ShieldCheck,
  X,
  ChevronDown
} from 'lucide-react';
import { Language } from '../types';
import {
  getSyncStatus,
  setSyncMode,
  performServerSync,
  SYNC_STATUS_EVENT,
  SyncStatusData,
  SyncMode
} from '../utils/syncStatusService';

interface SyncStatusIndicatorProps {
  language: Language;
  onNotify?: (msg: string) => void;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  language,
  onNotify,
  className = '',
}) => {
  const isKm = language === 'km';
  const [syncData, setSyncData] = useState<SyncStatusData>(getSyncStatus);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state listener
  useEffect(() => {
    const handleUpdate = () => {
      setSyncData(getSyncStatus());
    };
    window.addEventListener(SYNC_STATUS_EVENT, handleUpdate);
    return () => window.removeEventListener(SYNC_STATUS_EVENT, handleUpdate);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleToggleMode = (newMode: SyncMode) => {
    const updated = setSyncMode(newMode);
    setSyncData(updated);
    if (onNotify) {
      onNotify(
        newMode === 'cloud'
          ? (isKm ? 'បានប្តូរទៅម៉ូដ Cloud-Connected (ធ្វើសមកាលកម្មទិន្នន័យ)' : 'Switched to Cloud-Connected synchronization mode')
          : (isKm ? 'បានប្តូរទៅម៉ូដ Local-Only (រក្សាទុកក្នុងម៉ាស៊ីនប៉ុណ្ណោះ)' : 'Switched to Local-Only offline storage mode')
      );
    }
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const updated = await performServerSync();
      setSyncData(updated);
      if (onNotify) {
        onNotify(
          isKm
            ? `បានធ្វើសមកាលកម្មទិន្នន័យជាមួយ Server ជោគជ័យ! (${updated.lastSyncFormattedKm})`
            : `Server sync completed successfully! (${updated.lastSyncFormattedEn})`
        );
      }
    } catch {
      if (onNotify) {
        onNotify(isKm ? 'ការធ្វើសមកាលកម្មមានបញ្ហា' : 'Sync encountered an error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const isLocalOnly = syncData.mode === 'local_only';

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Header Bar Button Trigger */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 ${
          isLocalOnly
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
        }`}
        title={
          isLocalOnly
            ? (isKm ? 'ការព្រមាន៖ កំពុងស្ថិតក្នុងម៉ូដ Local-Only' : 'Alert: Currently in Local-Only storage mode')
            : (isKm ? `Cloud Sync ជោគជ័យ (${syncData.lastSyncFormattedKm})` : `Cloud Sync Active (${syncData.lastSyncFormattedEn})`)
        }
        aria-label="Toggle Server Sync Status Popover"
      >
        {isLocalOnly ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-extrabold text-[11px]">
              {isKm ? 'Local-Only' : 'Local-Only'}
            </span>
            <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-extrabold text-[11px] hidden sm:inline">
              {isKm ? 'Cloud' : 'Cloud'}
            </span>
            <span className="text-[10px] text-emerald-200/80 font-mono hidden md:inline">
              {syncData.lastSyncTimestamp ? new Date(syncData.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
            </span>
          </>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Popover Card */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                isLocalOnly ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {isLocalOnly ? <HardDrive className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                  <span>{isKm ? 'ស្ថានភាពធ្វើសមកាលកម្ម (Sync Status)' : 'Server Synchronization Status'}</span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  {isLocalOnly ? (isKm ? 'រក្សាទុកក្នុង Browser ប៉ុណ្ណោះ' : 'Browser Cached Only') : (isKm ? 'ភ្ជាប់ទៅកាន់ Cloud Server' : 'Cloud-Connected Node')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDropdownOpen(false)}
              className="w-6 h-6 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sync Status Banner */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isLocalOnly
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          }`}>
            {isLocalOnly ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 text-xs">
              <span className="font-black block">
                {isLocalOnly
                  ? (isKm ? '⚠️ កំពុងស្ថិតក្នុងម៉ូដ Local-Only' : '⚠️ Alert: Currently in Local-Only Mode')
                  : (isKm ? '✅ Cloud-Connected: ភ្ជាប់ប្រព័ន្ធជោគជ័យ' : '✅ Cloud-Connected: Server Live')}
              </span>
              <p className="text-[11px] text-slate-300 leading-snug">
                {isLocalOnly
                  ? (isKm
                    ? 'ទិន្នន័យត្រូវបានរក្សាទុកតែក្នុងម៉ាស៊ីនអ្នកប៉ុណ្ណោះ។ មិនមានការបញ្ជូនទៅ Cloud ឡើយ។'
                    : 'Changes are cached locally in your browser storage. No external server sync is performed.')
                  : (isKm
                    ? 'កញ្ចប់ឥវ៉ាន់ អាសយដ្ឋាន និងកំណត់ត្រាត្រូវបានធ្វើសមកាលកម្មទៅ Cloud ជាបន្តបន្ទាប់។'
                    : 'Shipments, waybills, and banking profiles automatically synchronize with the central node.')}
              </p>
            </div>
          </div>

          {/* Timestamp Details */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isKm ? 'សមកាលកម្មជោគជ័យចុងក្រោយ៖' : 'Last Successful Sync:'}</span>
              </span>
              <span className="font-mono font-bold text-slate-200 text-[11px]">
                {isKm ? syncData.lastSyncFormattedKm : syncData.lastSyncFormattedEn}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Server className="w-3 h-3 text-slate-400" />
                <span>{isKm ? 'Server Gateway:' : 'Server Gateway:'}</span>
              </span>
              <span className="font-mono text-emerald-400 text-[10px]">
                {syncData.serverNode} (24ms)
              </span>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              {isKm ? 'ជ្រើសរើសរបៀបរក្សាទុក (Sync Mode):' : 'Select Synchronization Mode:'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleMode('cloud')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  !isLocalOnly
                    ? 'bg-emerald-600/30 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  {!isLocalOnly && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                </div>
                <span className="text-xs font-black block">Cloud-Connected</span>
                <span className="text-[10px] opacity-75">{isKm ? 'ធ្វើសមកាលកម្មទូទាំង' : 'Online multi-device'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleMode('local_only')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isLocalOnly
                    ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  {isLocalOnly && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
                <span className="text-xs font-black block">Local-Only Mode</span>
                <span className="text-[10px] opacity-75">{isKm ? 'ក្នុងម៉ាស៊ីនប៉ុណ្ណោះ' : 'Offline local cache'}</span>
              </button>
            </div>
          </div>

          {/* Action: Sync Now Button */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isKm ? 'ធានាសុវត្ថិភាពទិន្នន័យ' : 'Zero data loss cache'}</span>
            </span>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (isKm ? 'កំពុង Sync...' : 'Syncing...') : (isKm ? 'Sync ឥឡូវ' : 'Sync Now')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
