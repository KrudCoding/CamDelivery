import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Send, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Truck, 
  MessageSquare,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { TrackingItem, Language } from '../types';

interface SpecialDeliveryInstructionsCardProps {
  shipment: TrackingItem;
  language: Language;
  onUpdateInstructions: (instructions: string) => void;
  className?: string;
}

interface PresetOption {
  id: string;
  labelEn: string;
  labelKm: string;
  icon: string;
}

const PRESET_INSTRUCTIONS: PresetOption[] = [
  { id: 'gate', labelEn: 'Leave at front gate', labelKm: 'ទុកនៅមាត់ទ្វាររបង', icon: '🚪' },
  { id: 'call', labelEn: 'Call upon arrival', labelKm: 'សូមខលប្រាប់ពេលមកដល់', icon: '📞' },
  { id: 'security', labelEn: 'Leave with security guard', labelKm: 'ផ្ញើនៅកន្លែងសន្តិសុខ', icon: '🛡️' },
  { id: 'bell', labelEn: 'Ring doorbell twice', labelKm: 'ចុចកណ្តឹងទ្វារ ២ ដង', icon: '🔔' },
  { id: 'reception', labelEn: 'Leave at reception desk', labelKm: 'ផ្ញើនៅតុទទួលភ្ញៀវ Reception', icon: '🏢' },
  { id: 'fragile', labelEn: 'Fragile: handle with care', labelKm: 'ទំនិញងាយបែក សូមថ្នមដៃ', icon: '⚠️' },
];

export const SpecialDeliveryInstructionsCard: React.FC<SpecialDeliveryInstructionsCardProps> = ({
  shipment,
  language,
  onUpdateInstructions,
  className = '',
}) => {
  const isKm = language === 'km';
  const isDelivered = shipment.status === 'delivered';
  
  const [instructionText, setInstructionText] = useState(shipment.specialInstructions || '');
  const [isEditing, setIsEditing] = useState(!shipment.specialInstructions);
  const [justSaved, setJustSaved] = useState(false);

  // Sync state if shipment changes
  useEffect(() => {
    setInstructionText(shipment.specialInstructions || '');
    setIsEditing(!shipment.specialInstructions);
  }, [shipment.trackingNumber, shipment.specialInstructions]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = instructionText.trim();
    onUpdateInstructions(trimmed);
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3500);
  };

  const handleAppendPreset = (preset: PresetOption) => {
    const textToAdd = isKm ? preset.labelKm : preset.labelEn;
    setInstructionText((prev) => {
      const current = prev.trim();
      if (!current) return textToAdd;
      if (current.includes(textToAdd)) return current;
      return `${current} • ${textToAdd}`;
    });
    setIsEditing(true);
  };

  const handleClear = () => {
    setInstructionText('');
    onUpdateInstructions('');
    setIsEditing(true);
  };

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm transition hover:shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shrink-0">
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <span>{isKm ? 'សេចក្តីណែនាំពិសេសសម្រាប់ការដឹកជញ្ជូន' : 'Special Delivery Instructions'}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                {isKm ? 'អ្នកដឹកជញ្ជូន' : 'Driver Note'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isKm
                ? 'បញ្ជូនការណែនាំបន្ថែមទៅកាន់អ្នកដឹកផ្ទាល់ (ឧ. ទុកនៅមាត់ទ្វារ ឬខលប្រាប់ពេលដល់)'
                : 'Append customized drop-off instructions to the active shipment record'}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        {shipment.specialInstructions && !isEditing && (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isKm ? 'បានបញ្ជូនទៅអ្នកដឹក' : 'Synced with Courier'}</span>
            </span>
            {!isDelivered && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title={isKm ? 'កែសម្រួលការណែនាំ' : 'Edit instructions'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="text-[11px]">{isKm ? 'កែ' : 'Edit'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Just Saved Notification Banner */}
      {justSaved && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-500 text-white flex items-center justify-between gap-2 text-xs font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>
              {isKm 
                ? 'សេចក្តីណែនាំពិសេសត្រូវបានរក្សាទុក & បញ្ជូនទៅកាន់អ្នកដឹកជញ្ជូនជោគជ័យ!' 
                : 'Special delivery instructions saved & synced with courier manifest!'}
            </span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">
            OK
          </span>
        </div>
      )}

      {/* VIEW MODE: If already saved and not in edit mode */}
      {!isEditing && shipment.specialInstructions ? (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <span className="text-base mt-0.5">📌</span>
              <div>
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                  {isKm ? 'ការណែនាំសកម្មសម្រាប់អ្នកដឹក៖' : 'Active Delivery Instruction:'}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 whitespace-pre-wrap leading-relaxed">
                  "{shipment.specialInstructions}"
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {shipment.driverName
                  ? (isKm ? `អ្នកដឹក ${shipment.driverName} នឹងអនុវត្តតាមការណែនាំនេះ` : `Courier ${shipment.driverName} has received this note`)
                  : (isKm ? 'អ្នកដឹកជញ្ជូននឹងអនុវត្តតាមការណែនាំនេះ' : 'Dispatched to courier driver upon arrival')}
              </span>
            </div>
            {!isDelivered && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isKm ? 'លុប' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* EDIT / INPUT MODE */
        <form onSubmit={handleSave} className="space-y-3">
          {/* Quick Preset Shortcut Chips */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              {isKm ? 'ចុចបន្ថែមការណែនាំលឿន (Quick Presets):' : 'Quick Suggestion Chips (1-Click Append):'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_INSTRUCTIONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAppendPreset(preset)}
                  className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 active:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer group"
                >
                  <span>{preset.icon}</span>
                  <span className="text-[11px]">{isKm ? preset.labelKm : preset.labelEn}</span>
                  <Plus className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Text input / textarea */}
          <div className="relative">
            <textarea
              rows={2}
              maxLength={250}
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              placeholder={
                isKm
                  ? 'ឧទាហរណ៍៖ សូមទុកឥវ៉ាន់នៅមាត់ទ្វាររបង ឬខលមកលេខនេះពេលជិតមកដល់...'
                  : 'e.g., Leave at front gate, call upon arrival, or ring bell twice...'
              }
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs text-slate-900 placeholder:text-slate-400 outline-hidden transition resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
              <span>{isKm ? 'អាចវាយបញ្ចូលដោយសេរី ឬចុចប៊ូតុងខាងលើ' : 'Type instructions or click presets above'}</span>
              <span className="font-mono">{instructionText.length}/250</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isKm ? 'កត់ត្រាចូលក្នុងប្រព័ន្ធដឹកជញ្ជូនភ្លាមៗ' : 'Appends directly to shipment record'}</span>
            </div>

            <div className="flex items-center gap-2">
              {shipment.specialInstructions && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
              )}

              <button
                type="submit"
                disabled={!instructionText.trim()}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  instructionText.trim()
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isKm ? 'រក្សាទុកការណែនាំ' : 'Save Instructions'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
