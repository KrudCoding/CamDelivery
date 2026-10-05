import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TrackingItem, Language } from '../types';

interface DeliveryRescheduleCardProps {
  shipment: TrackingItem;
  language: Language;
  onConfirmReschedule: (
    newDateStr: string,
    newDateStrKm: string,
    timeSlotLabel: string,
    timeSlotLabelKm: string,
    reasonText: string
  ) => void;
  className?: string;
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

export const DeliveryRescheduleCard: React.FC<DeliveryRescheduleCardProps> = ({
  shipment,
  language,
  onConfirmReschedule,
  className = '',
}) => {
  const isKm = language === 'km';
  const isEligible = shipment.status === 'pending' || shipment.status === 'in_transit' || shipment.status === 'scheduled';

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Compute upcoming candidate dates starting tomorrow
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
  const [rescheduleSuccess, setRescheduleSuccess] = useState<boolean>(false);

  const selectedDayInfo = candidateDays.find((d) => d.isoDate === selectedDateISO) || candidateDays[0];
  const selectedSlot = TIME_SLOT_OPTIONS.find((s) => s.id === selectedSlotId) || TIME_SLOT_OPTIONS[1];
  const selectedReason = RESCHEDULE_REASONS.find((r) => r.id === selectedReasonId) || RESCHEDULE_REASONS[0];

  const handleConfirm = () => {
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
      setRescheduleSuccess(true);
    }, 600);
  };

  // If status is out_for_delivery or delivered, show friendly notice
  if (!isEligible) {
    return (
      <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between gap-2 ${className}`}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {isKm
              ? 'ការកែសម្រួលកាលវិភាគត្រូវបានបិទ ដោយសារកញ្ចប់កំពុងចេញដឹក ឬដឹកដល់រួចរាល់'
              : 'Rescheduling is closed as shipment is already out for doorstep delivery or completed.'}
          </span>
        </div>
        <span className="font-bold text-slate-700 font-mono">#{shipment.trackingNumber}</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-blue-200/90 shadow-sm overflow-hidden transition-all duration-300 ${className}`}>
      {/* Accent Header Ribbon */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-4 py-3 text-white flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-xs sm:text-sm tracking-wide">
                {isKm ? 'កែសម្រួលកាលបរិច្ឆេទ & ម៉ោងដឹក (Reschedule)' : 'Reschedule Delivery Appointment'}
              </h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 shadow-2xs">
                {isKm ? 'ឥតគិតថ្លៃ' : 'Free 1x'}
              </span>
            </div>
            <p className="text-[11px] text-blue-100 mt-0.5">
              {isKm
                ? 'ជ្រើសរើសថ្ងៃ និងចន្លោះម៉ោងថ្មី ប្រសិនបើលោកអ្នកមិនទាន់ងាយស្រួលទទួលឥវ៉ាន់'
                : 'Select a preferred date and time-slot if you need to receive your delivery later.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 active:scale-95 text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <span>{isExpanded ? (isKm ? 'បិទវិញ' : 'Collapse') : (isKm ? 'ជ្រើសថ្ងៃ & ម៉ោងថ្មី' : 'Select Date & Slot')}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Current Schedule Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-600">
              {isKm ? 'កាលបរិច្ឆេទគ្រោងទុកបច្ចុប្បន្ន៖' : 'Currently Scheduled Arrival:'}
            </span>
            <strong className="text-blue-950 font-bold">
              {isKm ? shipment.estimatedDeliveryKm : shipment.estimatedDelivery}
            </strong>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {isKm ? `ស្ថានភាព៖ ${shipment.statusKm}` : `Status: ${shipment.status.replace(/_/g, ' ').toUpperCase()}`}
          </span>
        </div>

        {/* Success Confirmation Notice */}
        {rescheduleSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-extrabold block">
                  {isKm ? 'កាលបរិច្ឆេទដឹកជញ្ជូនថ្មីត្រូវបានកែសម្រួលជោគជ័យ!' : 'Delivery Appointment Rescheduled Successfully!'}
                </span>
                <span className="text-[11px] text-emerald-800">
                  {isKm
                    ? `${selectedDayInfo?.fullFormattedKm} (${selectedSlot.timeWindowKm})`
                    : `${selectedDayInfo?.fullFormattedEn} (${selectedSlot.timeWindowEn})`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRescheduleSuccess(false)}
              className="text-[11px] font-black underline text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              {isKm ? 'កែប្រែបន្ថែម' : 'Change again'}
            </button>
          </div>
        )}

        {/* Expandable Date-Picker & Time-Slot Selector Form */}
        {isExpanded && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            {/* 1. Date Picker Section */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>{isKm ? '១. ជ្រើសរើសកាលបរិច្ឆេទថ្មី (Date Picker)' : '1. Select New Delivery Date'}</span>
                <span className="text-[11px] font-normal text-slate-500 lowercase">
                  {candidateDays.length} {isKm ? 'ថ្ងៃអាចជ្រើសបាន' : 'days available'}
                </span>
              </label>

              {/* Quick Select Candidate Days */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
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

              {/* Custom Calendar Date Input */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[11px] text-slate-500 shrink-0">
                  {isKm ? 'ឬជ្រើសកាលបរិច្ឆេទជាក់លាក់ក្នុងប្រតិទិន៖' : 'Or pick custom calendar date:'}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TIME_SLOT_OPTIONS.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`p-3 rounded-2xl border text-left flex items-start justify-between gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{slot.iconText}</span>
                          <span className={`text-xs font-extrabold truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                            {isKm ? slot.titleKm : slot.titleEn}
                          </span>
                        </div>
                        <span className="text-[10.5px] font-mono text-slate-500 block mt-1">
                          {isKm ? slot.timeWindowKm : slot.timeWindowEn}
                        </span>
                      </div>

                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Reason for Rescheduling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isKm ? 'មូលហេតុនៃការប្តូរ' : 'Reason for Adjustment'}
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
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isKm ? 'កំណត់សម្គាល់បន្ថែមទៅកាន់អ្នកដឹក' : 'Optional Delivery Note'}
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder={isKm ? 'ឧ. សូមទូរស័ព្ទមុន ១៥ នាទី...' : 'e.g. Please call 15 mins ahead...'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Confirmation CTA Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {isKm
                    ? 'កញ្ចប់ទំនិញត្រូវបានរក្សាទុកក្នុងឃ្លាំងត្រជាក់ និងមានសុវត្ថិភាព'
                    : 'Held securely at regional hub until chosen appointment'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-blue-900/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting
                      ? (isKm ? 'កំពុងកែសម្រួល...' : 'Rescheduling...')
                      : (isKm ? 'បញ្ជាក់កាលបរិច្ឆេទថ្មី' : 'Confirm New Date & Slot')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
