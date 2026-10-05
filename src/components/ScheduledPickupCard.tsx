import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  X,
  Copy,
  Check,
  Timer,
  Info,
  CalendarCheck,
  Package,
  Layers,
  Trash2
} from 'lucide-react';
import { Language, Currency, ScheduledPickupReservation } from '../types';
import { CAMBODIA_PROVINCES, CARRIERS_LIST } from '../data/carriers';
import { loadScheduledPickups, saveScheduledPickup, cancelScheduledPickup } from '../utils/offlineStorage';
import { formatKhmerDate, formatEnglishDate } from '../utils/deliveryCalculator';

interface ScheduledPickupCardProps {
  language: Language;
  currency: Currency;
  onNavigateTab: (tabId: 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
  onNotify?: (message: string) => void;
}

interface TimeSlotOption {
  id: string;
  timeEn: string;
  timeKm: string;
  labelEn: string;
  labelKm: string;
  period: 'morning' | 'afternoon' | 'evening';
  icon: string;
}

const TIME_SLOTS: TimeSlotOption[] = [
  {
    id: 'early_morning',
    timeEn: '08:00 AM - 10:00 AM',
    timeKm: '០៨:០០ ព្រឹក - ១០:០០ ព្រឹក',
    labelEn: 'Early Morning Run',
    labelKm: 'ជើងព្រឹកព្រលឹម',
    period: 'morning',
    icon: '🌅',
  },
  {
    id: 'mid_morning',
    timeEn: '10:00 AM - 12:00 PM',
    timeKm: '១០:០០ ព្រឹក - ១២:០០ ថ្ងៃត្រង់',
    labelEn: 'Pre-Noon Express Van',
    labelKm: 'ឡានវ៉ែនមុនថ្ងៃត្រង់',
    period: 'morning',
    icon: '☀️',
  },
  {
    id: 'early_afternoon',
    timeEn: '01:00 PM - 03:00 PM',
    timeKm: '០១:០០ រសៀល - ០៣:០០ រសៀល',
    labelEn: 'Post-Lunch Dispatch',
    labelKm: 'ជើងរសៀលដើម',
    period: 'afternoon',
    icon: '🌤️',
  },
  {
    id: 'late_afternoon',
    timeEn: '03:00 PM - 05:00 PM',
    timeKm: '០៣:០០ រសៀល - ០៥:០០ ល្ងាច',
    labelEn: 'Provincial Van Departures',
    labelKm: 'ជើងឡានវ៉ែនអន្តរខេត្ត',
    period: 'afternoon',
    icon: '🌇',
  },
  {
    id: 'evening',
    timeEn: '05:00 PM - 07:00 PM',
    timeKm: '០៥:០០ ល្ងាច - ០៧:០០ យប់',
    labelEn: 'After-Work Pickup',
    labelKm: 'ជើងល្ងាចក្រោយម៉ោងការងារ',
    period: 'evening',
    icon: '🌙',
  },
];

export const ScheduledPickupCard: React.FC<ScheduledPickupCardProps> = ({
  language,
  currency,
  onNavigateTab,
  onNotify,
}) => {
  const isKm = language === 'km';

  // Mode: 'schedule' (form) vs 'my_pickups' (list of active scheduled pickups)
  const [activeTab, setActiveTab] = useState<'schedule' | 'my_pickups'>('schedule');

  // Stored reservations from local storage
  const [scheduledList, setScheduledList] = useState<ScheduledPickupReservation[]>(() => loadScheduledPickups());

  // Form states
  const [dispatchMode, setDispatchMode] = useState<'scheduled' | 'immediate'>('scheduled');

  // Date selection states
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const in2DaysStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('mid_morning');
  const [customTime, setCustomTime] = useState<string>('10:30');
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);

  // Address & contact states
  const [senderName, setSenderName] = useState<string>('Sok Vicheka');
  const [senderPhone, setSenderPhone] = useState<string>('012 889 900');
  const [pickupProvinceId, setPickupProvinceId] = useState<string>('phnom-penh');
  const [pickupAddress, setPickupAddress] = useState<string>('Street 271, Sangkat Boeng Tumpun, Khan Meanchey');
  const [destinationProvinceId, setDestinationProvinceId] = useState<string>('siem-reap');
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('cam-van-express');
  const [packageType, setPackageType] = useState<string>('Standard Box (M)');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<number>(2.5);
  const [specialInstructions, setSpecialInstructions] = useState<string>('Please call 10 mins before arrival at front gate.');

  // Submission & feedback states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastBookedReservation, setLastBookedReservation] = useState<ScheduledPickupReservation | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Calculate human-friendly formatted date
  const selectedDateFormatted = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return {
        en: formatEnglishDate(d),
        km: formatKhmerDate(d),
      };
    } catch {
      return { en: selectedDate, km: selectedDate };
    }
  }, [selectedDate]);

  const selectedSlot = useMemo(() => {
    return TIME_SLOTS.find((s) => s.id === selectedSlotId) || TIME_SLOTS[0];
  }, [selectedSlotId]);

  const selectedCarrier = useMemo(() => {
    return CARRIERS_LIST.find((c) => c.id === selectedCarrierId) || CARRIERS_LIST[0];
  }, [selectedCarrierId]);

  const pickupProvince = CAMBODIA_PROVINCES.find((p) => p.id === pickupProvinceId);
  const destProvince = CAMBODIA_PROVINCES.find((p) => p.id === destinationProvinceId);

  // Handle Booking
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupAddress.trim() || !senderPhone.trim()) {
      if (onNotify) {
        onNotify(isKm ? 'សូមបញ្ចូលអាសយដ្ឋាន និងលេខទូរស័ព្ទ' : 'Please provide pickup address and phone number');
      }
      return;
    }

    setIsSubmitting(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const refCode = `SCH-${selectedDate.replace(/-/g, '').slice(2, 6)}-${randomSuffix}`;
    const newReservation: ScheduledPickupReservation = {
      id: `sch-${Date.now()}`,
      referenceNumber: refCode,
      trackingNumber: `KH-VAN-${randomSuffix}90`,
      carrierId: selectedCarrier.id,
      carrierName: isKm ? selectedCarrier.nameKm : selectedCarrier.name,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      pickupAddress: pickupAddress.trim(),
      pickupProvinceId,
      pickupProvinceName: isKm ? pickupProvince?.nameKm || '' : pickupProvince?.name || '',
      destinationProvinceId,
      destinationProvinceName: isKm ? destProvince?.nameKm || '' : destProvince?.name || '',
      scheduledDate: selectedDate,
      timeSlotId: useCustomTime ? 'custom' : selectedSlot.id,
      timeSlotLabel: useCustomTime ? `Custom Time: ${customTime}` : selectedSlot.timeEn,
      timeSlotLabelKm: useCustomTime ? `ម៉ោងកំណត់ដោយដៃ៖ ${customTime}` : selectedSlot.timeKm,
      packageType,
      packageTypeKm: packageType,
      estimatedWeightKg,
      specialInstructions: specialInstructions.trim(),
      status: 'confirmed',
      statusKm: 'បានកក់ជោគជ័យ',
      estimatedPriceKHR: 6500,
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      const updatedList = saveScheduledPickup(newReservation);
      setScheduledList(updatedList);
      setLastBookedReservation(newReservation);
      setIsSubmitting(false);

      if (onNotify) {
        onNotify(
          isKm
            ? `បានកក់ម៉ោងមកយកឥវ៉ាន់ដោយជោគជ័យ! លេខយោង៖ ${refCode}`
            : `Pickup scheduled successfully! Reference #${refCode}`
        );
      }
    }, 450);
  };

  const handleCancelReservation = (id: string) => {
    const updated = cancelScheduledPickup(id);
    setScheduledList(updated);
    if (onNotify) {
      onNotify(isKm ? 'បានលុបចោលកាលវិភាគមកយកឥវ៉ាន់' : 'Scheduled pickup cancelled');
    }
  };

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
    if (onNotify) {
      onNotify(isKm ? 'បានចម្លងលេខយោង!' : 'Reference code copied!');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-7 border border-slate-200 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20 shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {isKm ? 'កក់កាលវិភាគមកយកឥវ៉ាន់ (Schedule Pickup)' : 'Schedule Shipment Pickup Time'}
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {isKm ? 'ជ្រើសថ្ងៃ & ម៉ោង' : 'Date & Time Picker'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKm
                ? 'កំណត់កាលបរិច្ឆេទ និងចន្លោះម៉ោងឲ្យអ្នកដឹកជញ្ជូនមកយកកញ្ចប់ឥវ៉ាន់ដល់ផ្ទះ ឬទីតាំងអាជីវកម្ម'
                : 'Choose a convenient future date and time window for doorstep pickup instead of immediate dispatch'}
            </p>
          </div>
        </div>

        {/* Tab switch (Book New vs My Scheduled Pickups) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'schedule'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isKm ? 'កក់ម៉ោងថ្មី' : 'Book Pickup'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_pickups')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'my_pickups'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{isKm ? 'កាលវិភាគកក់' : 'My Pickups'}</span>
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
              {scheduledList.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'schedule' ? (
        <form onSubmit={handleScheduleSubmit} className="space-y-6">
          {/* Dispatch Timing Mode Toggle (Immediate vs Scheduled) */}
          <div className="p-1 bg-slate-100 rounded-2xl flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDispatchMode('scheduled')}
              className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                dispatchMode === 'scheduled'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{isKm ? 'កក់ម៉ោងទុកជាមុន (Schedule for Later)' : 'Schedule Pickup (Date & Time)'}</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">Recommended</span>
            </button>

            <button
              type="button"
              onClick={() => setDispatchMode('immediate')}
              className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                dispatchMode === 'immediate'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{isKm ? 'ចេញយកភ្លាមៗ (Immediate Dispatch)' : 'Immediate Dispatch (Now)'}</span>
            </button>
          </div>

          {/* DATE & TIME PICKER COMPONENT (Highlighted Box) */}
          {dispatchMode === 'scheduled' ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-white border-2 border-blue-200/80 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{isKm ? 'ជ្រើសរើសកាលបរិច្ឆេទមកយក (Pickup Date)' : 'Step 1: Select Pickup Date'}</span>
                </span>

                <span className="text-xs font-bold text-blue-700 bg-blue-100/90 px-3 py-1 rounded-full border border-blue-300/50">
                  {isKm ? selectedDateFormatted.km : selectedDateFormatted.en}
                </span>
              </div>

              {/* Quick Date Buttons & Custom Date Picker */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Today */}
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedDate === todayStr
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs font-black'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-80">{isKm ? 'ថ្ងៃនេះ' : 'Today'}</span>
                  <span className="text-xs font-bold mt-1">{todayStr}</span>
                </button>

                {/* Tomorrow */}
                <button
                  type="button"
                  onClick={() => setSelectedDate(tomorrowStr)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedDate === tomorrowStr
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs font-black'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider opacity-80">{isKm ? 'ថ្ងៃស្អែក' : 'Tomorrow'}</span>
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-md">Popular</span>
                  </div>
                  <span className="text-xs font-bold mt-1">{tomorrowStr}</span>
                </button>

                {/* In 2 Days */}
                <button
                  type="button"
                  onClick={() => setSelectedDate(in2DaysStr)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedDate === in2DaysStr
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs font-black'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-80">{isKm ? '២ ថ្ងៃទៀត' : 'In 2 Days'}</span>
                  <span className="text-xs font-bold mt-1">{in2DaysStr}</span>
                </button>

                {/* Custom Interactive HTML5 Date Picker */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    {isKm ? 'កាលបរិច្ឆេទផ្សេងទៀត' : 'Custom Date'}
                  </span>
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
                  />
                </div>
              </div>

              {/* TIME WINDOW SELECTION */}
              <div className="pt-2 border-t border-blue-100 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{isKm ? 'ជ្រើសរើសចន្លោះម៉ោងមកយក (Pickup Window)' : 'Step 2: Select Time Window'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setUseCustomTime(!useCustomTime)}
                    className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <span>{useCustomTime ? (isKm ? 'ប្រើចន្លោះស្តង់ដារ' : 'Use standard slots') : (isKm ? 'កំណត់ម៉ោងជាក់លាក់' : 'Specific exact time')}</span>
                  </button>
                </div>

                {!useCustomTime ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/90 shadow-xs ring-1 ring-blue-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{slot.icon}</span>
                            <div>
                              <div className="font-extrabold text-xs text-slate-900">
                                {isKm ? slot.timeKm : slot.timeEn}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {isKm ? slot.labelKm : slot.labelEn}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        {isKm ? 'បញ្ចូលម៉ោងមកយកជាក់លាក់ (Exact Pickup Time)' : 'Specify Exact Pickup Time'}
                      </span>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full text-sm font-black text-slate-900 bg-transparent focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">
                  {isKm ? 'ការចេញយកភ្លាមៗ (Dispatch within 15-30 mins)' : 'Immediate Courier Dispatch'}
                </span>
                <span className="text-emerald-700 text-[11px]">
                  {isKm
                    ? 'អ្នកដឹកដែលនៅជិតបំផុតនឹងធ្វើដំណើរមកយកកញ្ចប់ឥវ៉ាន់របស់អ្នកក្នុងរយៈពេល 15-30 នាទីបន្ទាប់ពីការកក់។'
                    : 'Nearest community van or motorcycle rider will be notified to collect your parcel within 15-30 minutes.'}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: PICKUP LOCATION & CONTACT DETAILS */}
          <div className="space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>{isKm ? 'ទីតាំងមកយក និងព័ត៌មានអ្នកផ្ញើ' : 'Step 3: Pickup Location & Contact Info'}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Sender Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isKm ? 'ឈ្មោះអ្នកផ្ញើ' : 'Sender Name'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Sok Vicheka"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 transition"
                />
              </div>

              {/* Sender Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isKm ? 'លេខទូរស័ព្ទអ្នកផ្ញើ' : 'Sender Phone'}</span>
                </label>
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="e.g. 012 889 900"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 transition"
                />
              </div>

              {/* Pickup Province */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isKm ? 'ខេត្ត-ក្រុងមកយក' : 'Pickup Province'}
                </label>
                <select
                  value={pickupProvinceId}
                  onChange={(e) => setPickupProvinceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 transition cursor-pointer"
                >
                  {CAMBODIA_PROVINCES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isKm ? p.nameKm : p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Province */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isKm ? 'ខេត្ត-ក្រុងគោលដៅ' : 'Destination Province'}
                </label>
                <select
                  value={destinationProvinceId}
                  onChange={(e) => setDestinationProvinceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 transition cursor-pointer"
                >
                  {CAMBODIA_PROVINCES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isKm ? p.nameKm : p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Detailed Pickup Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'អាសយដ្ឋានលម្អិតមកយកដល់ផ្ទះ (ផ្ទះលេខ, ផ្លូវ, អគារ ឬទីស្នាក់ការ)' : 'Detailed Doorstep Pickup Address (Street, Building, Landmark)'}
              </label>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="e.g. Street 271, Sangkat Boeng Tumpun, Khan Meanchey"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            {/* Carrier Selection */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'ជ្រើសរើសក្រុមហ៊ុន ឬបណ្តាញដឹកជញ្ជូន' : 'Select Courier Fleet'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {CARRIERS_LIST.slice(0, 3).map((carrier) => {
                  const isSelected = selectedCarrierId === carrier.id;
                  return (
                    <div
                      key={carrier.id}
                      onClick={() => setSelectedCarrierId(carrier.id)}
                      className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-1 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0"
                        style={{ backgroundColor: carrier.brandColor }}
                      >
                        {carrier.name.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 truncate">
                          {isKm ? carrier.nameKm : carrier.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {carrier.tagline.slice(0, 26)}...
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'សម្គាល់ ឬការណែនាំពិសេសពេលមកយក' : 'Special Pickup Instructions'}
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder={isKm ? 'ឧ. ខលប្រាប់មុន ១០ នាទី ឬយកនៅមុខរបង' : 'e.g. Call 10 mins before arrival, pickup at security booth'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* BOOKING SUMMARY & SUBMIT BUTTON */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-[11px] text-blue-300 font-bold uppercase tracking-wider block">
                {isKm ? 'សេចក្តីសង្ខេបកាលវិភាគមកយក' : 'Pickup Schedule Summary'}
              </span>
              <div className="text-sm font-extrabold text-white mt-0.5">
                {dispatchMode === 'scheduled' ? (
                  <>
                    <span>{isKm ? selectedDateFormatted.km : selectedDateFormatted.en}</span>
                    <span className="text-amber-400 font-mono ml-2">
                      ({useCustomTime ? customTime : isKm ? selectedSlot.timeKm : selectedSlot.timeEn})
                    </span>
                  </>
                ) : (
                  <span>{isKm ? 'ចេញមកយកភ្លាមៗ (១៥-៣០ នាទី)' : 'Immediate Pickup (15-30 mins)'}</span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {pickupProvince?.name} ➔ {destProvince?.name} • 0% Commission
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs md:text-sm font-black shadow-lg shadow-blue-950/40 transition flex items-center gap-2 disabled:opacity-50"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? (isKm ? 'កំពុងកក់កាលវិភាគ...' : 'Scheduling...')
                    : (isKm ? 'បញ្ជាក់ការកក់កាលវិភាគ' : 'Confirm Scheduled Pickup')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* MY SCHEDULED PICKUPS LIST TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              {isKm ? 'បញ្ជីកាលវិភាគមកយកដែលបានកក់' : 'Active Scheduled Pickup Reservations'}
            </span>
            <span className="text-xs text-slate-500">
              {scheduledList.length} {isKm ? 'ការកក់' : 'Reservations'}
            </span>
          </div>

          {scheduledList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">
                {isKm ? 'មិនទាន់មានកាលវិភាគមកយកឥវ៉ាន់នៅឡើយទេ' : 'No Scheduled Pickups Yet'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isKm
                  ? 'លោកអ្នកអាចកក់ម៉ោងឲ្យអ្នកដឹកជញ្ជូនមកយកឥវ៉ាន់ដល់ផ្ទះបានយ៉ាងងាយស្រួល'
                  : 'You can schedule doorstep courier pickups for future dates anytime.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                {isKm ? 'កក់ម៉ោងឥឡូវនេះ' : 'Book a Pickup Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledList.map((res) => (
                <div
                  key={res.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-blue-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">
                          #{res.referenceNumber}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {isKm ? res.statusKm : res.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {res.carrierName} • {isKm ? 'បានកក់កាលពី' : 'Created'}: {new Date(res.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyRef(res.referenceNumber)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition flex items-center gap-1"
                        title={isKm ? 'ចម្លងលេខយោង' : 'Copy Reference'}
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelReservation(res.id)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                        title={isKm ? 'លុបចោល' : 'Cancel Reservation'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scheduled Date & Time Pill */}
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900">{res.scheduledDate}</span>
                      <span className="text-slate-400">•</span>
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-blue-900">{res.timeSlotLabel}</span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-600">
                      {res.pickupProvinceName} ➔ {res.destinationProvinceName}
                    </div>
                  </div>

                  {/* Address and instructions */}
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      <strong className="text-slate-800">{isKm ? 'អាសយដ្ឋានមកយក៖' : 'Pickup Point:'}</strong> {res.pickupAddress}
                    </div>
                    <div>
                      <strong className="text-slate-800">{isKm ? 'ទំនាក់ទំនង៖' : 'Contact:'}</strong> {res.senderName} ({res.senderPhone})
                    </div>
                    {res.specialInstructions && (
                      <div className="text-[11px] text-slate-500 italic">
                        "{res.specialInstructions}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
