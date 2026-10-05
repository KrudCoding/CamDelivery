import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageSquare,
  Truck,
  Car,
  UserCheck,
  Clock,
  ChevronRight,
  Send,
  X,
  Upload,
  Camera,
  Headphones,
  Award,
  ThumbsUp,
  FileText
} from 'lucide-react';
import { TrackingItem, Language, DeliveryIssueReport } from '../types';

interface CourierProfileViewProps {
  shipment: TrackingItem;
  language: Language;
  onOpenChat?: () => void;
  onOpenVerification?: () => void;
  onOpenFullProfile?: () => void;
  onReportIssueSubmitted?: (issue: DeliveryIssueReport) => void;
  className?: string;
}

const ISSUE_CATEGORIES = [
  {
    key: 'delay',
    labelEn: 'Delivery Delay / Late Arrival',
    labelKm: 'ការពន្យារពេល ឬមកដល់យឺតយ៉ាវ',
    icon: Clock,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    key: 'address',
    labelEn: 'Wrong Location / Address Issue',
    labelKm: 'ទីតាំង ឬអាសយដ្ឋានមិនត្រឹមត្រូវ',
    icon: Truck,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    key: 'damage',
    labelEn: 'Package Damaged / Broken',
    labelKm: 'កញ្ចប់ឥវ៉ាន់ខូចខាត ឬបែកបាក់',
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  {
    key: 'unreachable',
    labelEn: 'Courier Unreachable / No Answer',
    labelKm: 'ទាក់ទងអ្នកដឹកមិនបាន ឬមិនលើកទូរស័ព្ទ',
    icon: Phone,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    key: 'cod',
    labelEn: 'Incorrect COD Amount Requested',
    labelKm: 'ចំនួនប្រាក់ COD មិនត្រូវតាមវិក្កយបត្រ',
    icon: FileText,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    key: 'instructions',
    labelEn: 'Delivery Instructions Not Followed',
    labelKm: 'មិនបានអនុវត្តតាមការណែនាំទីតាំង',
    icon: MessageSquare,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    key: 'other',
    labelEn: 'Other Delivery Concern',
    labelKm: 'បញ្ហាផ្សេងៗទាក់ទងនឹងការដឹក',
    icon: AlertTriangle,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
  },
] as const;

export const CourierProfileView: React.FC<CourierProfileViewProps> = ({
  shipment,
  language,
  onOpenChat,
  onOpenVerification,
  onOpenFullProfile,
  onReportIssueSubmitted,
  className = '',
}) => {
  const isKm = language === 'km';
  const driverName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូនសហគមន៍' : 'Community Courier');
  const driverPhone = shipment.driverPhone || '+855 12 889 001';
  const driverRating = shipment.driverRating || 4.9;
  const ratingCount = shipment.driverRatingCount || 280;
  const deliveriesCompleted = shipment.driverDeliveriesCount || 1248;
  const driverPlate = shipment.driverPlate || 'PP-2A-8912';
  const driverVehicle = shipment.driverVehicle || (isKm ? 'ម៉ូតូដឹកជញ្ជូន Honda Wave 110cc' : 'Honda Wave 110cc Express');
  const joinedYear = shipment.driverJoinedYear || '2023';

  // Report Issue Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof ISSUE_CATEGORIES[number]['key']>('delay');
  const [issueDescription, setIssueDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [contactPhone, setContactPhone] = useState(shipment.receiverPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTicket, setActiveTicket] = useState<DeliveryIssueReport | null>(null);
  const [hasSuccessAlert, setHasSuccessAlert] = useState(false);

  // Load existing ticket for this shipment from localStorage
  const ticketStorageKey = `camdelivery_issue_ticket_${shipment.trackingNumber}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ticketStorageKey);
      if (saved) {
        setActiveTicket(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, [ticketStorageKey]);

  const handleOpenReportModal = () => {
    setIsReportModalOpen(true);
    setHasSuccessAlert(false);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const categoryObj = ISSUE_CATEGORIES.find((c) => c.key === selectedCategory) || ISSUE_CATEGORIES[0];
    const ticketId = `ISS-${shipment.trackingNumber.replace(/[^0-9]/g, '').slice(-6) || '882910'}-${Math.floor(100 + Math.random() * 900)}`;

    const newReport: DeliveryIssueReport = {
      id: `report-${Date.now()}`,
      ticketNumber: ticketId,
      trackingNumber: shipment.trackingNumber,
      courierName: driverName,
      category: selectedCategory,
      categoryLabel: categoryObj.labelEn,
      categoryLabelKm: categoryObj.labelKm,
      description: issueDescription || (isKm ? 'សំណើពិនិត្យបញ្ហាដឹកជញ្ជូន' : 'Delivery issue report request'),
      isUrgent,
      contactPhone: contactPhone || shipment.receiverPhone || '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      timestampKm: `ម៉ោង ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      status: 'submitted',
    };

    setTimeout(() => {
      try {
        localStorage.setItem(ticketStorageKey, JSON.stringify(newReport));
      } catch {
        // Ignore
      }
      setActiveTicket(newReport);
      setIsSubmitting(false);
      setHasSuccessAlert(true);
      if (onReportIssueSubmitted) {
        onReportIssueSubmitted(newReport);
      }
    }, 700);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden ${className}`}>
      {/* Top Brand Accent Bar */}
      <div 
        className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" 
      />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Main Courier Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Courier Avatar with Live Radar Indicator */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 border-2 border-emerald-400/80 shadow-md flex items-center justify-center text-white overflow-hidden group">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-emerald-300">
                  {driverName.slice(0, 2).toUpperCase()}
                </span>
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition" />
              </div>

              {/* Verified Badge Icon */}
              {shipment.isCourierVerified ? (
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-xs"
                  title={isKm ? 'បានផ្ទៀងផ្ទាត់អត្តសញ្ញាណប័ណ្ណផ្លូវការ' : 'Official ID Verified'}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-white shadow-xs"
                  title={isKm ? 'អ្នកដឹកសហគមន៍' : 'Community Courier'}
                >
                  <Award className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Courier Name, Tier & Vehicle */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                  {driverName}
                </h4>
                {shipment.isCourierVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    <span>{isKm ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified Partner'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    <span>{isKm ? 'អ្នកដឹកជញ្ជូនផ្លូវការ' : 'Active Courier'}</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{driverVehicle}</span>
                {driverPlate && (
                  <>
                    <span>•</span>
                    <span className="bg-slate-900 text-amber-400 font-mono font-bold text-[10.5px] px-1.5 py-0.2 rounded-md">
                      {driverPlate}
                    </span>
                  </>
                )}
              </p>

              <p className="text-[11px] text-slate-400 mt-0.5">
                {isKm 
                  ? `សមាជិកបម្រើការតាំងពីឆ្នាំ ${joinedYear} • គ្របដណ្តប់ផ្លូវជាតិ និងក្នុងក្រុង`
                  : `Courier partner since ${joinedYear} • Highway & doorstep coverage`}
              </p>
            </div>
          </div>

          {/* Action CTAs: Report Issue + Direct Call */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Primary 'Report Issue' Button for the Current Delivery */}
            <button
              type="button"
              onClick={handleOpenReportModal}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 hover:text-rose-800 border border-rose-300 text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer group"
              title={isKm ? 'រាយការណ៍បញ្ហាទាក់ទងនឹងការដឹកជញ្ជូននេះទៅកាន់ Dispatcher' : 'Report an issue regarding this delivery to dispatcher'}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
              <span>{isKm ? 'រាយការណ៍បញ្ហា' : 'Report Issue'}</span>
              {activeTicket && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            {/* Quick Call Courier */}
            <a
              href={`tel:${driverPhone}`}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs shadow-emerald-700/20"
              title={isKm ? `ទូរស័ព្ទទៅកាន់អ្នកដឹក (${driverPhone})` : `Call courier directly (${driverPhone})`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isKm ? 'ហៅទូរស័ព្ទ' : 'Call Courier'}</span>
            </a>

            {/* Live Chat Button */}
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                title={isKm ? 'ផ្ញើសារណែនាំទីតាំងទៅកាន់អ្នកដឹក' : 'Chat with courier for delivery instructions'}
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isKm ? 'ឆាត' : 'Chat'}</span>
              </button>
            )}

            {/* View Full Profile / Rating Details */}
            {onOpenFullProfile && (
              <button
                type="button"
                onClick={onOpenFullProfile}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold transition cursor-pointer"
                title={isKm ? 'មើលព័ត៌មានលម្អិតអ្នកដឹក' : 'View Full Profile'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Courier Key Performance Metrics: Rating & Total Deliveries Completed */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* 1. Courier Rating Metric */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-900 text-xs">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {isKm ? 'ពិន្ទុវាយតម្លៃ' : 'Courier Rating'}
              </span>
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
                {driverRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-amber-800 font-bold">
                / 5.0
              </span>
            </div>
            <p className="text-[10px] text-amber-800 font-medium mt-0.5 truncate">
              {isKm ? `ផ្អែកលើ ${ratingCount} មតិអតិថិជន` : `${ratingCount} verified ratings`}
            </p>
          </div>

          {/* 2. Total Deliveries Completed Metric */}
          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/90 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-900 text-xs">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {isKm ? 'ជើងដឹកជញ្ជូនសម្រេច' : 'Deliveries Done'}
              </span>
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">
                {deliveriesCompleted.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-700">+</span>
            </div>
            <p className="text-[10px] text-emerald-800 font-medium mt-0.5 truncate">
              {isKm ? 'ជើងដឹកជោគជ័យ ១០០%' : '100% successful drop-offs'}
            </p>
          </div>

          {/* 3. On-Time Delivery Rate */}
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/90 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-900 text-xs">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {isKm ? 'ទាន់ពេលវេលា' : 'On-Time Rate'}
              </span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-blue-950 font-mono">
                99.4%
              </span>
            </div>
            <p className="text-[10px] text-blue-800 font-medium mt-0.5 truncate">
              {isKm ? 'តាមការសន្យាកាលវិភាគ' : 'SLA benchmark standard'}
            </p>
          </div>

          {/* 4. Customer Trust & Verification Seal */}
          <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/90 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-900 text-xs">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {isKm ? 'ទំនុកចិត្តអតិថិជន' : 'Satisfaction'}
              </span>
              <ThumbsUp className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-indigo-950 font-mono">
                99.8%
              </span>
            </div>
            <p className="text-[10px] text-indigo-800 font-medium mt-0.5 truncate">
              {isKm ? 'មតិវិជ្ជមានខ្ពស់បំផុត' : 'Positive feedback score'}
            </p>
          </div>
        </div>

        {/* Existing Active Ticket Banner (If User Already Reported an Issue) */}
        {activeTicket && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/90 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <div>
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <span>{isKm ? 'បញ្ហាបានរាយការណ៍៖' : 'Active Issue Ticket:'}</span>
                  <span className="font-mono bg-rose-200/80 px-1.5 py-0.2 rounded-sm text-rose-950 font-black">
                    #{activeTicket.ticketNumber}
                  </span>
                  <span className="text-[10px] uppercase font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-md">
                    {isKm ? 'កំពុងដោះស្រាយ' : 'Investigating'}
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  {isKm ? activeTicket.categoryLabelKm : activeTicket.categoryLabel} • {activeTicket.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenReportModal}
              className="text-[11px] font-black text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
            >
              {isKm ? 'មើលព័ត៌មាន' : 'View Details'}
            </button>
          </div>
        )}

        {/* Bottom Verification & Direct Hotline Ribbon */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenVerification}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 transition cursor-pointer text-left"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${shipment.isCourierVerified ? 'text-emerald-600' : 'text-slate-400'} shrink-0`} />
            <span className="text-[11px] font-semibold">
              {shipment.isCourierVerified
                ? (isKm ? '✓ បានផ្ទៀងផ្ទាត់អត្តសញ្ញាណប័ណ្ណផ្លូវការ (Official ID Verified)' : '✓ Official Government ID Verified by Camera')
                : (isKm ? 'មិនទាន់ស្កេនប័ណ្ណ (ចុចដើម្បីស្កេនតាមកាមេរ៉ា)' : 'Unverified Courier (Click to scan ID)')}
            </span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Headphones className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKm ? 'ជំនួយការដឹកជញ្ជូន ២៤/៧៖ ' : '24/7 Dispatch Hotline: '}</span>
            <a href="tel:012522225" className="font-bold text-slate-800 hover:underline">
              012 522 225
            </a>
          </div>
        </div>
      </div>

      {/* REPORT ISSUE MODAL DIALOG */}
      {isReportModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-4 p-5 sm:p-6 relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    {isKm ? 'រាយការណ៍បញ្ហាដឹកជញ្ជូន' : 'Report Delivery Issue'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKm 
                      ? `កញ្ចប់ #${shipment.trackingNumber} • អ្នកដឹក៖ ${driverName}`
                      : `Waybill #${shipment.trackingNumber} • Courier: ${driverName}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseReportModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success State Alert Banner */}
            {hasSuccessAlert && activeTicket ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-slate-900 text-base">
                    {isKm ? 'សំណើត្រូវបានបញ្ជូនទៅកាន់ Dispatcher រួចរាល់!' : 'Issue Report Dispatched to Safety Team!'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    {isKm
                      ? `លេខប័ណ្ណតាមដាន #${activeTicket.ticketNumber} ត្រូវបានបង្កើតឡើង។ ក្រុមការងារ Dispatcher នឹងទាក់ទងមកលោកអ្នកតាមរយៈទូរស័ព្ទ ${activeTicket.contactPhone} ក្នុងរយៈពេល ៥ នាទី។`
                      : `Ticket #${activeTicket.ticketNumber} has been logged. Our national dispatch center is contacting the courier and will reach you at ${activeTicket.contactPhone} within 5 minutes.`}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isKm ? 'ប្រភេទបញ្ហា' : 'Issue Category'}</span>
                    <span className="font-bold text-slate-800">
                      {isKm ? activeTicket.categoryLabelKm : activeTicket.categoryLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isKm ? 'ពេលវេលារាយការណ៍' : 'Logged Timestamp'}</span>
                    <span className="font-mono text-slate-700">{activeTicket.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isKm ? 'លេខបន្ទាន់ ២៤/៧' : 'Priority Hotline'}</span>
                    <a href="tel:012522225" className="font-bold text-emerald-700 underline">
                      012 522 225
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseReportModal}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    {isKm ? 'យល់ព្រម និងបិទ' : 'Done & Close'}
                  </button>
                </div>
              </div>
            ) : (
              /* Report Submission Form */
              <form onSubmit={handleSubmitIssue} className="space-y-4">
                {/* 1. Category Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    {isKm ? 'ជ្រើសរើសប្រភេទបញ្ហា' : 'Select Issue Category'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ISSUE_CATEGORIES.map((cat) => {
                      const IconComp = cat.icon;
                      const isSelected = selectedCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setSelectedCategory(cat.key)}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                            isSelected
                              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs font-extrabold truncate ${isSelected ? 'text-rose-950' : 'text-slate-800'}`}>
                              {isKm ? cat.labelKm : cat.labelEn}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Priority / Urgent Toggle */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-amber-950">
                        {isKm ? 'ករណីបន្ទាន់ (Urgent Escalation)' : 'Mark as Urgent Issue'}
                      </div>
                      <p className="text-[11px] text-amber-800">
                        {isKm
                          ? 'ជូនដំណឹងភ្លាមៗទៅកាន់ Dispatcher ដើម្បីទាក់ទងត្រឡប់មកក្នុងរយៈពេល ៥ នាទី'
                          : 'Immediate notification to central dispatcher for instant resolution'}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* 3. Description Note */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    {isKm ? 'ពិពណ៌នាលម្អិតអំពីបញ្ហា' : 'Describe What Happened'}
                  </label>
                  <textarea
                    rows={3}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder={
                      isKm
                        ? 'សូមបញ្ជាក់ព័ត៌មានលម្អិត ដូចជា ទីតាំងអ្នកដឹកកំពុងនៅ ពេលវេលារង់ចាំ ឬការណែនាំពិសេស...'
                        : 'Please provide helpful details (e.g. courier location misunderstanding, delay duration, or packaging issue)...'
                    }
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:bg-white bg-slate-50 transition"
                  />
                </div>

                {/* 4. Callback Contact Number */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    {isKm ? 'លេខទូរស័ព្ទសម្រាប់ទំនាក់ទំនងត្រឡប់' : 'Your Callback Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="012 345 678"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-slate-50 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Direct Emergency Dispatcher Note */}
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between gap-2">
                  <span>
                    {isKm ? 'ត្រូវការជំនួយបន្ទាន់ភ្លាមៗ?' : 'Need immediate voice assistance?'}
                  </span>
                  <a
                    href="tel:012522225"
                    className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>012 522 225 (24/7)</span>
                  </a>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseReportModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                  >
                    {isKm ? 'បោះបង់' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-md shadow-rose-900/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSubmitting
                        ? (isKm ? 'កំពុងបញ្ជូនសំណើ...' : 'Submitting Ticket...')
                        : (isKm ? 'បញ្ជូនសំណើរាយការណ៍' : 'Submit Issue Report')}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
