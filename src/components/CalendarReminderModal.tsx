import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Download, 
  ExternalLink, 
  Check, 
  X, 
  Bell, 
  MapPin, 
  Truck, 
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import { TrackingItem, Language } from '../types';
import { 
  downloadIcsFile, 
  getGoogleCalendarUrl, 
  getOutlookCalendarUrl, 
  getDeliveryEventDates 
} from '../utils/calendarService';

interface CalendarReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: TrackingItem;
  language: Language;
  targetArrivalDate?: Date;
}

export const CalendarReminderModal: React.FC<CalendarReminderModalProps> = ({
  isOpen,
  onClose,
  shipment,
  language,
  targetArrivalDate,
}) => {
  const isKm = language === 'km';
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const { startDate, endDate } = getDeliveryEventDates(shipment, targetArrivalDate);

  const formattedDate = startDate.toLocaleDateString(isKm ? 'km-KH' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTimeWindow = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const handleDownloadIcs = () => {
    const success = downloadIcsFile(shipment, { arrivalDate: startDate, language });
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    }
  };

  const handleGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(shipment, { arrivalDate: startDate, language });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOutlookCalendar = () => {
    const url = getOutlookCalendarUrl(shipment, { arrivalDate: startDate, language });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-200/60 shadow-2xs">
              <Calendar className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {isKm ? 'រក្សាទុកក្នុងប្រតិទិន (Save to Calendar)' : 'Save Delivery to Calendar'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isKm ? 'រំលឹកកាលបរិច្ឆេទ & ម៉ោងកញ្ចប់ឥវ៉ាន់មកដល់' : 'Set automated reminders for expected delivery'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Delivery Event Card Summary */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/80 shadow-inner space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isKm ? 'ព្រឹត្តិការណ៍ដឹកជញ្ជូន' : 'Scheduled Delivery Event'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
              <Bell className="w-2.5 h-2.5" />
              <span>{isKm ? 'រំលឹកមុន ៣០ នាទី' : '30-min Pre-alert'}</span>
            </span>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>#{shipment.trackingNumber}</span>
              <span className="text-slate-400 font-normal">({isKm ? shipment.carrierNameKm : shipment.carrierName})</span>
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mt-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formattedTimeWindow}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-indigo-900/60 flex items-center justify-between text-[11px] text-slate-300">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>{isKm ? shipment.receiverCityKm : shipment.receiverCity}</span>
            </div>
            <span className="text-slate-400">
              {shipment.driverName ? `Courier: ${shipment.driverName}` : 'Express Courier'}
            </span>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {isKm ? 'ជ្រើសរើសមធ្យោបាយរក្សាទុក' : 'Choose Calendar Format'}
          </span>

          {/* Primary Action: Download ICS File */}
          <button
            type="button"
            onClick={handleDownloadIcs}
            className={`w-full p-3 rounded-2xl text-xs font-bold transition flex items-center justify-between shadow-sm cursor-pointer border ${
              downloadSuccess
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800 active:scale-98'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                {downloadSuccess ? <Check className="w-4 h-4 text-emerald-200" /> : <Download className="w-4 h-4 text-white" />}
              </div>
              <div className="text-left">
                <span className="block font-black">
                  {downloadSuccess
                    ? (isKm ? 'បានទាញយកឯកសារ .ICS ជោគជ័យ!' : 'ICS File Downloaded!')
                    : (isKm ? 'ទាញយកឯកសារ .ICS (Apple & Android)' : 'Download .ICS File (Universal)')}
                </span>
                <span className="text-[10px] text-slate-300 block font-normal">
                  {isKm ? 'គាំទ្រ Apple Calendar, iPhone, Mac, Windows, Outlook' : 'Compatible with Apple Calendar, iOS, Android & Outlook'}
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/15 font-mono">
              .ics
            </span>
          </button>

          {/* Web Calendars */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleGoogleCalendar}
              className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-left transition flex items-center gap-2 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-white text-blue-600 flex items-center justify-center shadow-2xs shrink-0 font-black text-xs">
                G
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-extrabold truncate">Google Calendar</span>
                <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                  <span>{isKm ? 'បើកផ្ទាល់' : 'Open 1-Click'}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleOutlookCalendar}
              className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-left transition flex items-center gap-2 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-white text-sky-600 flex items-center justify-center shadow-2xs shrink-0 font-black text-xs">
                O
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-extrabold truncate">Outlook Online</span>
                <span className="text-[10px] text-sky-600 flex items-center gap-0.5">
                  <span>{isKm ? 'បើកផ្ទាល់' : 'Open 1-Click'}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Tip */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
          <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            {isKm
              ? 'ឯកសារប្រតិទិនរួមបញ្ចូលទាំងព័ត៌មានលម្អិតអំពីលេខកូដតាមដាន ឈ្មោះអ្នកដឹក លេខទូរស័ព្ទ និងតំណភ្ជាប់ GPS ផ្ទាល់។'
              : 'The calendar event automatically embeds your tracking number, driver contact, and live deep link.'}
          </span>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            {isKm ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
