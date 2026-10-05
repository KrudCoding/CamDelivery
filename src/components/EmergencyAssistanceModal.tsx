import React, { useState } from 'react';
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  ShieldAlert,
  X,
  Truck,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  LifeBuoy
} from 'lucide-react';
import { TrackingItem, Language } from '../types';

interface EmergencyAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: TrackingItem;
  language: Language;
}

const EMERGENCY_SERVICES = [
  {
    id: 'dispatch',
    nameEn: '24/7 Logistics Safety Hotline',
    nameKm: 'ផ្នែកសង្គ្រោះបន្ទាន់ដឹកជញ្ជូន ២៤/៧',
    phone: '012 522 225',
    descEn: 'Priority courier security, road accident, or dispatch issue',
    descKm: 'សម្រាប់ករណីគ្រោះថ្នាក់លើផ្លូវ បាត់ឥវ៉ាន់ ឬបញ្ហាសន្តិសុខអ្នកដឹក',
    isPrimary: true,
  },
  {
    id: 'police',
    nameEn: 'National Police Emergency',
    nameKm: 'នគរបាលជាតិ (សង្គ្រោះបន្ទាន់)',
    phone: '117',
    descEn: 'Severe safety threats, highway emergencies, or theft',
    descKm: 'ករណីចោរកម្ម អំពើហិង្សា ឬគ្រោះអាសន្នសន្តិសុខធ្ងន់ធ្ងរ',
    isPrimary: false,
  },
  {
    id: 'ambulance',
    nameEn: 'Emergency Medical & Ambulance',
    nameKm: 'រថយន្តសង្គ្រោះបន្ទាន់វេជ្ជសាស្ត្រ',
    phone: '119',
    descEn: 'Immediate medical assistance for road incidents',
    descKm: 'សង្គ្រោះបន្ទាន់របួស ឬគ្រោះថ្នាក់ចរាចរណ៍លើដងផ្លូវ',
    isPrimary: false,
  },
  {
    id: 'traffic',
    nameEn: 'Highway Traffic Police Patrol',
    nameKm: 'នគរបាលចរាចរណ៍ផ្លូវគោក',
    phone: '118',
    descEn: 'Interprovincial highway breakdowns or vehicle collisions',
    descKm: 'ការប៉ះទង្គិចរថយន្ត ឬខូចយានយន្តលើផ្លូវជាតិ',
    isPrimary: false,
  },
];

export const EmergencyAssistanceModal: React.FC<EmergencyAssistanceModalProps> = ({
  isOpen,
  onClose,
  shipment,
  language,
}) => {
  const isKm = language === 'km';
  const [selectedIssueType, setSelectedIssueType] = useState<string>('safety');
  const [customNote, setCustomNote] = useState<string>('');
  const [smsSentNotice, setSmsSentNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const driverName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូន' : 'Courier');
  const driverPhone = shipment.driverPhone || '012 345 678';
  const locationDesc = isKm ? shipment.receiverCityKm : shipment.receiverCity;

  // Construct urgent SMS body with waybill context
  const smsBody = encodeURIComponent(
    `[CAMDELIVERY EMERGENCY SOS]\nWaybill: #${shipment.trackingNumber}\nCarrier: ${shipment.carrierName}\nCourier: ${driverName} (${driverPhone}, ${shipment.driverPlate || 'N/A'})\nLocation: ${locationDesc}\nIssue: ${selectedIssueType.toUpperCase()}${customNote ? ` - ${customNote}` : ''}\nURGENT: Please dispatch immediate assistance.`
  );

  const handleSendUrgentSms = () => {
    // Open system SMS client with prefilled number and body
    window.location.href = `sms:012522225?body=${smsBody}`;
    setSmsSentNotice(true);
    setTimeout(() => setSmsSentNotice(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-rose-500/80 space-y-4 my-auto relative">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-lg shadow-rose-600/30 shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-rose-700">
                  {isKm ? 'ជំនួយសង្គ្រោះបន្ទាន់ & សុវត្ថិភាព' : 'Emergency Assistance & Safety'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  SOS 24/7
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKm
                  ? 'ទាក់ទងបន្ទាន់ទៅកាន់ផ្នែកសន្តិសុខដឹកជញ្ជូន ឬនគរបាលជាតិក្នុងករណីមានគ្រោះអាសន្ន'
                  : 'Quick-dial security dispatch or trigger an urgent SMS alert for delivery safety'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shrink-0"
            title={isKm ? 'បិទ' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Incident Context Box */}
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold uppercase tracking-wider text-rose-400">
              {isKm ? 'ព័ត៌មានប័ណ្ណដឹកជញ្ជូនភ្ជាប់មកជាមួយ' : 'Attached Shipment Telemetry'}
            </span>
            <span className="font-mono font-bold text-white">#{shipment.trackingNumber}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block">{isKm ? 'អ្នកដឹកជញ្ជូន' : 'Assigned Courier'}:</span>
              <strong className="text-white font-bold">{driverName}</strong>{' '}
              <span className="text-slate-400">({driverPhone})</span>
            </div>
            <div>
              <span className="text-slate-400 block">{isKm ? 'ទីតាំងគោលដៅ' : 'Destination Area'}:</span>
              <strong className="text-emerald-400 font-bold">{locationDesc}</strong>
            </div>
          </div>
        </div>

        {/* Issue Type Selector for SMS */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            {isKm ? 'ជ្រើសរើសប្រភេទបញ្ហាបន្ទាន់' : 'Select Urgent Incident Category'}:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            {[
              { id: 'safety', labelKm: '🚨 សុវត្ថិភាព / គ្រោះថ្នាក់លើផ្លូវ', labelEn: '🚨 Safety / Road Accident' },
              { id: 'cargo_damage', labelKm: '📦 ទំនិញខូចខាតធ្ងន់ធ្ងរ', labelEn: '📦 Severe Cargo Damage' },
              { id: 'wrong_location', labelKm: '📍 ទីតាំងខុស ឬតំបន់មិនមានសុវត្ថិភាព', labelEn: '📍 Unsafe / Wrong Location' },
              { id: 'fraud', labelKm: '⚠️ សង្ស័យក្លែងបន្លំ ឬចោរកម្ម', labelEn: '⚠️ Theft / Suspected Fraud' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedIssueType(cat.id)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  selectedIssueType === cat.id
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isKm ? cat.labelKm : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Additional Note */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            {isKm ? 'ព័ត៌មានលម្អិតបន្ថែម (ស្រេចចិត្ត)' : 'Additional Brief Details (Optional)'}:
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder={isKm ? 'ឧទាហរណ៍៖ ត្រូវការជំនួយជិតផ្សារដំដែក...' : 'e.g., Courier vehicle broken down near junction...'}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-500 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* ONE-TAP URGENT SMS TRIGGER BUTTON */}
        <div>
          <button
            type="button"
            onClick={handleSendUrgentSms}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 hover:from-rose-700 hover:to-red-900 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-700/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-white animate-bounce" />
            <span>{isKm ? 'ផ្ញើសារ SMS សង្គ្រោះបន្ទាន់ឥឡូវនេះ (Send SOS SMS)' : 'Trigger Urgent SOS SMS Alert'}</span>
          </button>
          {smsSentNotice && (
            <p className="text-[11px] text-emerald-600 font-bold text-center mt-1.5 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isKm ? 'បានបើកកម្មវិធីផ្ញើសារ SMS ជាមួយនឹងព័ត៌មានប័ណ្ណរួចរាល់' : 'Opening SMS app with prefilled tracking info'}</span>
            </p>
          )}
        </div>

        {/* DIRECT DIAL EMERGENCY NUMBERS */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            {isKm ? 'ឬចុចទូរស័ព្ទហៅផ្ទាល់ (Direct Phone Hotlines)' : 'Or Dial Directly via Phone'}:
          </span>

          <div className="space-y-1.5">
            {EMERGENCY_SERVICES.map((srv) => (
              <a
                key={srv.id}
                href={`tel:${srv.phone.replace(/\s/g, '')}`}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                  srv.isPrimary
                    ? 'border-rose-300 bg-rose-50/70 hover:bg-rose-100'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">
                      {isKm ? srv.nameKm : srv.nameEn}
                    </span>
                    {srv.isPrimary && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-rose-600 text-white rounded">
                        24/7 Dispatch
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    {isKm ? srv.descKm : srv.descEn}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs shrink-0 shadow-2xs hover:bg-rose-700 transition">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>{srv.phone}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
