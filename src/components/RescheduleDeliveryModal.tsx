import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import { TrackingItem, Language } from '../types';

interface RescheduleDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: TrackingItem;
  language: Language;
  onConfirmReschedule: (
    newDateStr: string,
    newDateStrKm: string,
    timeSlotLabel: string,
    timeSlotLabelKm: string,
    reasonText: string
  ) => void;
}

interface TimeSlotOption {
  id: string;
  timeWindowEn: string;
  timeWindowKm: string;
  titleEn: string;
  titleKm: string;
  iconText: string;
  recommended?: boolean;
}

const TIME_SLOT_OPTIONS: TimeSlotOption[] = [
  {
    id: 'morning',
    titleEn: 'Morning Express',
    titleKm: 'ពេលព្រឹកព្រលឹម',
    timeWindowEn: '08:30 AM – 11:30 AM',
    timeWindowKm: 'ម៉ោង ០៨:៣០ - ១១:៣០ ព្រឹក',
    iconText: '🌅',
  },
  {
    id: 'afternoon',
    titleEn: 'Afternoon Standard',
    titleKm: 'ពេលរសៀលទូទៅ',
    timeWindowEn: '01:30 PM – 04:30 PM',
    timeWindowKm: 'ម៉ោង ០១:៣០ - ០៤:៣០ រសៀល',
    iconText: '☀️',
    recommended: true,
  },
  {
    id: 'evening',
    titleEn: 'Evening After-Work',
    titleKm: 'ពេលល្ងាចក្រោយម៉ោងការងារ',
    timeWindowEn: '05:00 PM – 07:30 PM',
    timeWindowKm: 'ម៉ោង ០៥:០០ - ០៧:៣០ ល្ងាច',
    iconText: '🌆',
  },
];

const RESCHEDULE_REASONS = [
  {
    id: 'not_home',
    en: 'Not available at home address',
    km: 'មិននៅផ្ទះ ឬរវល់នៅក្រៅ',
  },
  {
    id: 'business_hours',
    en: 'Prefer delivery during office hours',
    km: 'ចង់ទទួលនៅម៉ោងធ្វើការការិយាល័យ',
  },
  {
    id: 'traveling',
    en: 'Currently traveling inter-province',
    km: 'កំពុងធ្វើដំណើរឆ្លងខេត្ត',
  },
  {
    id: 'weekend',
    en: 'Prefer Saturday / Sunday delivery',
    km: 'ចង់ទទួលនៅចុងសប្តាហ៍ (សៅរ៍/អាទិត្យ)',
  },
  {
    id: 'other',
    en: 'Other personal schedule adjustment',
    km: 'ការកែសម្រួលកាលវិភាគផ្ទាល់ខ្លួន',
  },
];

export const RescheduleDeliveryModal: React.FC<RescheduleDeliveryModalProps> = ({
  isOpen,
  onClose,
  shipment,
  language,
  onConfirmReschedule,
}) => {
  const isKm = language === 'km';

  // Compute upcoming candidate dates (next 7 days starting tomorrow)
  const candidateDays = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 1; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const weekdayEn = d.toLocaleDateString('en-US', { weekday: 'short' });
      const weekdayKm = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'][d.getDay()];

      const monthEn = d.toLocaleDateString('en-US', { month: 'short' });
      const monthKm = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'][d.getMonth()];

      const dayNumber = d.getDate();
      const labelEn = i === 1 ? 'Tomorrow' : `${weekdayEn}, ${monthEn} ${dayNumber}`;
      const labelKm = i === 1 ? 'ថ្ងៃស្អែក' : `ថ្ងៃ${weekdayKm} ទី${dayNumber}`;

      days.push({
        isoDate,
        dateObj: d,
        dayOffset: i,
        labelEn,
        labelKm,
        fullFormattedEn: `${weekdayEn}, ${monthEn} ${dayNumber}, ${yyyy}`,
        fullFormattedKm: `ថ្ងៃ${weekdayKm} ទី${dayNumber} ខែ${monthKm} ឆ្នាំ${yyyy}`,
      });
    }
    return days;
  }, []);

  const [selectedDateISO, setSelectedDateISO] = useState<string>(candidateDays[0]?.isoDate || '');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('afternoon');
  const [selectedReasonId, setSelectedReasonId] = useState<string>('not_home');
  const [customNote, setCustomNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected date metadata
  const selectedDayInfo = candidateDays.find((d) => d.isoDate === selectedDateISO) || candidateDays[0];
  const selectedSlot = TIME_SLOT_OPTIONS.find((s) => s.id === selectedSlotId) || TIME_SLOT_OPTIONS[1];
  const selectedReason = RESCHEDULE_REASONS.find((r) => r.id === selectedReasonId) || RESCHEDULE_REASONS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const dateTextEn = selectedDayInfo ? selectedDayInfo.fullFormattedEn : selectedDateISO;
      const dateTextKm = selectedDayInfo ? selectedDayInfo.fullFormattedKm : selectedDateISO;

      const reasonCombined = customNote.trim()
        ? `${isKm ? selectedReason.km : selectedReason.en} (${customNote.trim()})`
        : (isKm ? selectedReason.km : selectedReason.en);

      onConfirmReschedule(
        dateTextEn,
        dateTextKm,
        selectedSlot.timeWindowEn,
        selectedSlot.timeWindowKm,
        reasonCombined
      );
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-4 p-5 sm:p-6 relative">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-600/25">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  {isKm ? 'កំណត់កាលបរិច្ឆេទដឹកឡើងវិញ' : 'Reschedule Delivery Appointment'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {isKm ? 'ឥតគិតថ្លៃ' : 'Free 1st Reschedule'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKm 
                  ? `កញ្ចប់ #${shipment.trackingNumber} • ស្ថានភាព៖ ${shipment.statusKm}`
                  : `Waybill #${shipment.trackingNumber} • Status: ${shipment.status.replace(/_/g, ' ').toUpperCase()}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Scheduled Delivery Notice */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs flex-wrap">
          <span className="text-slate-500">
            {isKm ? 'កាលបរិច្ឆេទបច្ចុប្បន្ន៖' : 'Current Schedule:'}
          </span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{isKm ? shipment.estimatedDeliveryKm : shipment.estimatedDelivery}</span>
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Date Picker Section */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{isKm ? '១. ជ្រើសរើសកាលបរិច្ឆេទថ្មី (Date Picker)' : '1. Choose New Delivery Date'}</span>
              <span className="text-[11px] font-medium text-slate-500 lowercase">
                {candidateDays.length} {isKm ? 'ថ្ងៃអាចជ្រើសបាន' : 'days available'}
              </span>
            </label>

            {/* Quick-Select Date Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {candidateDays.map((d) => {
                const isSelected = selectedDateISO === d.isoDate;
                return (
                  <button
                    key={d.isoDate}
                    type="button"
                    onClick={() => setSelectedDateISO(d.isoDate)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`text-[10px] font-extrabold uppercase block tracking-wider ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {isKm ? d.labelKm : d.labelEn}
                    </span>
                    <span className="text-xs sm:text-sm font-black mt-0.5 block">
                      {d.dateObj.getDate()} {d.dateObj.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Manual Date Input Picker fallback */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-500 shrink-0">
                {isKm ? 'ឬជ្រើសកាលបរិច្ឆេទផ្សេងទៀត៖' : 'Or choose specific calendar date:'}
              </span>
              <input
                type="date"
                value={selectedDateISO}
                min={candidateDays[0]?.isoDate}
                onChange={(e) => setSelectedDateISO(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 text-slate-800 font-mono bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 2. Time-Slot Selector Section */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
              {isKm ? '២. ជ្រើសរើសចន្លោះពេលដឹក (Time-Slot Selector)' : '2. Select Preferred Time Slot'}
            </label>

            <div className="space-y-2">
              {TIME_SLOT_OPTIONS.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl sm:text-2xl">{slot.iconText}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-extrabold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                            {isKm ? slot.titleKm : slot.titleEn}
                          </span>
                          {slot.recommended && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                              {isKm ? 'ពេញនិយម' : 'Popular'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                          {isKm ? slot.timeWindowKm : slot.timeWindowEn}
                        </span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Reason for Rescheduling */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
              {isKm ? '៣. មូលហេតុនៃការប្តូរកាលបរិច្ឆេទ' : '3. Reason for Rescheduling (Optional)'}
            </label>
            <select
              value={selectedReasonId}
              onChange={(e) => setSelectedReasonId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {RESCHEDULE_REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {isKm ? r.km : r.en}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={isKm ? 'ចំណាំបន្ថែមទៅកាន់អ្នកដឹក (ឧ. សូមទូរស័ព្ទមុន ១៥ នាទី)...' : 'Additional note for courier (e.g. please call 15 mins prior)...'}
              className="mt-1.5 w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Policy & Reassurance Notice */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {isKm ? 'ការកំណត់កាលបរិច្ឆេទឡើងវិញដោយឥតគិតថ្លៃ៖ ' : 'Free Rescheduling Policy: '}
              </span>
              <span>
                {isKm
                  ? 'អ្នកដឹកជញ្ជូននឹងរក្សាទុកកញ្ចប់ក្នុងឃ្លាំងសុវត្ថិភាព និងចេញដឹកតាមពេលវេលាដែលអ្នកបានកំណត់។'
                  : 'Your package will be held safely in our provincial hub and dispatched on your selected time slot.'}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              {isKm ? 'បោះបង់' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-black shadow-md shadow-blue-900/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (isKm ? 'កំពុងកែសម្រួលកាលវិភាគ...' : 'Updating Appointment...')
                  : (isKm ? 'បញ្ជាក់ការកែសម្រួលកាលវិភាគ' : 'Confirm New Appointment')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
