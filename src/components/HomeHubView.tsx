import React, { useState } from 'react';
import { 
  Truck, 
  Utensils, 
  Car, 
  Search, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  Phone, 
  Star, 
  MapPin, 
  Sparkles, 
  Package, 
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Code2,
  CreditCard,
  Building2,
  UserCheck,
  QrCode,
  X,
  Calendar,
  Compass,
  Calculator,
  Layers,
  ChevronDown,
  CheckCircle2,
  Plus,
  HelpCircle,
  LifeBuoy,
  ThumbsUp,
  Check,
  AlertTriangle
} from 'lucide-react';
import { CARRIERS_LIST, CAMBODIA_PROVINCES } from '../data/carriers';
import { Language, Currency, TrackingItem } from '../types';
import { QuickCostEstimator } from './QuickCostEstimator';
import { RouteOptimizationEngine } from './RouteOptimizationEngine';
import { ParcelSizeCostCalculator } from './ParcelSizeCostCalculator';
import { ScheduledPickupCard } from './ScheduledPickupCard';
import { MapDashboard } from './MapDashboard';
import { DeliveryPerformanceCard } from './DeliveryPerformanceCard';
import { VoiceSearchButton } from './VoiceSearchButton';
import { SmartPackagingTool } from './SmartPackagingTool';
import { SupportHub } from './SupportHub';
import { HomeWaybillQRScanner } from './HomeWaybillQRScanner';
import { HomeShippingCalculator } from './HomeShippingCalculator';
import { NearbyDropoffMapWidget } from './NearbyDropoffMapWidget';
import { HomePromoBannerCarousel } from './HomePromoBannerCarousel';
import { DeliveryStatusAlertsToggle } from './DeliveryStatusAlertsToggle';
import { SmartDeliveryAlertCard } from './SmartDeliveryAlertCard';
import { CourierRatingFeedbackModal } from './CourierRatingFeedbackModal';

interface HomeHubViewProps {
  language: Language;
  currency: Currency;
  onNavigateTab: (tabId: 'map' | 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
  activeShipments: TrackingItem[];
  onSelectShipmentToTrack: (trackingNumber: string) => void;
  onNotify?: (message: string) => void;
  onScheduleShipment?: (newShipment: TrackingItem) => void;
}

type HomeSubTab = 'overview' | 'schedule' | 'map' | 'calculators' | 'directory' | 'support';

export const HomeHubView: React.FC<HomeHubViewProps> = ({
  language,
  currency,
  onNavigateTab,
  activeShipments,
  onSelectShipmentToTrack,
  onNotify,
  onScheduleShipment,
}) => {
  const isKm = language === 'km';
  const [activeSubTab, setActiveSubTab] = useState<HomeSubTab>('overview');
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<'all' | 'courier' | 'food' | 'ride'>('all');
  const [activeCalculatorAccordion, setActiveCalculatorAccordion] = useState<'shipping' | 'packaging' | 'size' | 'quick' | 'route'>('shipping');

  // Calendar-based future scheduling state
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>('morning_09_11');
  const [scheduledSenderProvince, setScheduledSenderProvince] = useState<string>('Phnom Penh (រាជធានីភ្នំពេញ)');
  const [scheduledReceiverProvince, setScheduledReceiverProvince] = useState<string>('Siem Reap (សៀមរាប)');
  const [scheduledSenderName, setScheduledSenderName] = useState<string>('');
  const [scheduledReceiverName, setScheduledReceiverName] = useState<string>('');
  const [scheduledWeightKg, setScheduledWeightKg] = useState<number>(2.5);
  const [scheduledPackageType, setScheduledPackageType] = useState<string>('box');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [scheduleValidationError, setScheduleValidationError] = useState<string | null>(null);
  const [selectedShipmentForRating, setSelectedShipmentForRating] = useState<TrackingItem | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const filteredCarriers = carrierFilter === 'all'
    ? CARRIERS_LIST
    : CARRIERS_LIST.filter(c => c.type.includes(carrierFilter as any));

  // Handle Future Delivery Pre-Booking with Business Hours Validation (08:00 - 18:00)
  const handleConfirmScheduleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleValidationError(null);

    const todayStr = new Date().toISOString().split('T')[0];
    if (scheduledDate < todayStr) {
      setScheduleValidationError(
        isKm
          ? '⚠️ កាលបរិច្ឆេទមិនអាចនៅក្នុងអតីតកាលបានទេ។ សូមជ្រើសរើសថ្ងៃនេះ ឬថ្ងៃអនាគត។'
          : '⚠️ Selected date cannot be in the past. Please select today or a future date.'
      );
      return;
    }

    const VALID_BUSINESS_SLOTS = [
      'morning_08_10',
      'morning_09_11',
      'midday_11_13',
      'afternoon_14_16',
      'evening_16_18',
    ];

    if (!VALID_BUSINESS_SLOTS.includes(scheduledTimeSlot)) {
      setScheduleValidationError(
        isKm
          ? '⚠️ ចន្លោះម៉ោងដែលបានជ្រើសរើសមិនស្ថិតក្នុងម៉ោងធ្វើការ (០៨:០០ ព្រឹក – ០៦:០០ ល្ងាច) របស់សេវាដឹកជញ្ជូនទេ។ សូមជ្រើសរើសចន្លោះម៉ោងធ្វើការ។'
          : '⚠️ Selected slot is outside courier operating business hours (08:00 AM – 06:00 PM). Please select a valid business hour window.'
      );
      return;
    }

    setIsSubmittingSchedule(true);

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const trackingCode = `KH-SCH-${randomSuffix}`;

    const senderCityName = scheduledSenderProvince.split(' (')[0];
    const senderCityKm = scheduledSenderProvince.includes('(') ? scheduledSenderProvince.split('(')[1].replace(')', '') : senderCityName;
    const receiverCityName = scheduledReceiverProvince.split(' (')[0];
    const receiverCityKm = scheduledReceiverProvince.includes('(') ? scheduledReceiverProvince.split('(')[1].replace(')', '') : receiverCityName;

    const timeSlotMap: Record<string, { en: string; km: string }> = {
      morning_08_10: { en: '08:30 AM - 10:30 AM (Morning Run)', km: '០៨:៣០ ព្រឹក - ១០:៣០ ព្រឹក (ជើងព្រឹកព្រលឹម)' },
      morning_09_11: { en: '09:30 AM - 11:30 AM (Optimal Low Traffic)', km: '០៩:៣០ ព្រឹក - ១១:៣០ ព្រឹក (ជើងព្រឹក AI រលូន)' },
      midday_11_13: { en: '11:30 AM - 01:30 PM (Midday Run)', km: '១១:៣០ ព្រឹក - ០១:៣០ រសៀល (ជើងថ្ងៃត្រង់)' },
      afternoon_14_16: { en: '02:00 PM - 04:00 PM (Afternoon Run)', km: '០២:០០ រសៀល - ០៤:០០ រសៀល (ជើងរសៀល)' },
      evening_16_18: { en: '04:30 PM - 06:00 PM (Closing Business Run)', km: '០៤:៣០ រសៀល - ០៦:០០ ល្ងាច (ជើងល្ងាចចុងក្រោយ)' },
    };

    const timeLabelEn = timeSlotMap[scheduledTimeSlot]?.en || '09:30 AM - 11:30 AM';
    const timeLabelKm = timeSlotMap[scheduledTimeSlot]?.km || '០៩:៣០ ព្រឹក - ១១:៣០ ព្រឹក';

    const newScheduledItem: TrackingItem = {
      trackingNumber: trackingCode,
      carrierId: 'cam-van-express',
      carrierName: 'CamExpress Van Service',
      carrierNameKm: 'ខេមអេចប្រេស សេវាឡានវ៉ែន',
      brandColor: '#2563eb',
      logoBg: 'bg-blue-600',
      serviceTitle: 'Scheduled Future Van Dispatch',
      serviceTitleKm: 'កក់ឡានវ៉ែនទុកជាមុនតាមកាលវិភាគ',
      senderName: scheduledSenderName.trim() || (isKm ? 'អ្នកផ្ញើ (កក់ទុកមុន)' : 'Sender (Pre-booked)'),
      senderPhone: '012 889 900',
      senderCity: senderCityName,
      senderCityKm: senderCityKm,
      receiverName: scheduledReceiverName.trim() || (isKm ? 'អ្នកទទួល' : 'Recipient'),
      receiverPhone: '097 554 433',
      receiverCity: receiverCityName,
      receiverCityKm: receiverCityKm,
      weightKg: scheduledWeightKg,
      packageType: scheduledPackageType === 'box' ? 'Cardboard Box' : scheduledPackageType === 'doc' ? 'Document Envelope' : 'Special Fragile Parcel',
      packageTypeKm: scheduledPackageType === 'box' ? 'កេសក្រដាសកាតុង' : scheduledPackageType === 'doc' ? 'ស្រោមសំបុត្រឯកសារ' : 'កញ្ចប់ទំនិញងាយបែក',
      totalPriceKHR: 12000,
      totalPriceUSD: 3.0,
      codAmountKHR: 0,
      isCod: false,
      status: 'scheduled',
      statusKm: 'បានកក់ទុកមុន (Scheduled)',
      estimatedDelivery: `${scheduledDate} (${timeLabelEn})`,
      estimatedDeliveryKm: `${scheduledDate} (${timeLabelKm})`,
      dispatchedAt: `${scheduledDate}T08:00:00Z`,
      driverName: 'Meng Sokha (Assigned)',
      driverPhone: '012 334 455',
      driverVehicle: 'Toyota HiAce Van',
      driverPlate: 'PP-3B-8912',
      driverRating: 4.9,
      driverRatingCount: 210,
      milestones: [
        {
          time: 'Booking Confirmed',
          date: new Date().toLocaleDateString(),
          status: 'Scheduled',
          statusKm: 'បានកក់ទុកមុន (Scheduled)',
          location: `${senderCityName} Hub`,
          locationKm: `សាខា ${senderCityKm}`,
          description: `Delivery pre-booked for ${scheduledDate} [${timeLabelEn}]. Vehicle reserved.`,
          descriptionKm: `បានកក់ការដឹកជញ្ជូនទុកមុនសម្រាប់ថ្ងៃ ${scheduledDate} [${timeLabelKm}]។ រថយន្តត្រូវបានកក់ទុកជាស្រេច។`,
          completed: true,
          current: true,
        },
      ],
      routeCoordinates: {
        start: { lat: 11.5564, lng: 104.9282, label: senderCityName },
        current: { lat: 11.5564, lng: 104.9282, label: 'Vehicle Assigned' },
        end: { lat: 13.3671, lng: 103.8448, label: receiverCityName },
      },
    };

    setTimeout(() => {
      setIsSubmittingSchedule(false);
      if (onScheduleShipment) {
        onScheduleShipment(newScheduledItem);
      }
      if (onNotify) {
        onNotify(
          isKm
            ? `✅ បានកក់ការដឹកជញ្ជូនទុកមុនជោគជ័យ! លេខតាមដានគឺ #${trackingCode} ស្ថានភាព "បានកក់ទុកមុន (Scheduled)"`
            : `✅ Successfully scheduled future delivery #${trackingCode} with status 'Scheduled'!`
        );
      }
      // Reset & jump to Overview
      setActiveSubTab('overview');
      onSelectShipmentToTrack(trackingCode);
    }, 450);
  };

  return (
    <div className="space-y-5">
      {/* COMPACT SUB-NAVIGATION MENU (Tabs & Pills to eliminate endless scrolling) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 sm:p-2 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-14 z-30 backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            {
              id: 'overview' as HomeSubTab,
              labelKm: 'សង្ខេប & រហ័ស',
              labelEn: 'Quick Hub',
              icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
            },
            {
              id: 'schedule' as HomeSubTab,
              labelKm: 'កាលវិភាគកក់ទុកមុន',
              labelEn: 'Schedule Booking',
              icon: <Calendar className="w-4 h-4 text-indigo-500" />,
              badge: isKm ? 'កក់ថ្ងៃ' : 'Calendar',
            },
            {
              id: 'map' as HomeSubTab,
              labelKm: 'ផែនទី Google Map',
              labelEn: 'Google Live Map',
              icon: <Compass className="w-4 h-4 text-blue-500" />,
              badge: isKm ? 'ផ្ទាល់' : 'Live',
            },
            {
              id: 'calculators' as HomeSubTab,
              labelKm: 'គណនាថ្លៃដឹក & ទំហំ',
              labelEn: 'Cost Calculators',
              icon: <Calculator className="w-4 h-4 text-amber-500" />,
            },
            {
              id: 'directory' as HomeSubTab,
              labelKm: 'បណ្តាញឡាន ២៥ ខេត្ត',
              labelEn: '25-Province Fleets',
              icon: <Truck className="w-4 h-4 text-slate-500" />,
            },
            {
              id: 'support' as HomeSubTab,
              labelKm: 'ជំនួយ & សំណួរឆ្លើយ (FAQ)',
              labelEn: 'Support Hub & FAQ',
              icon: <HelpCircle className="w-4 h-4 text-emerald-500" />,
              badge: isKm ? 'ជំនួយ' : 'Help',
            },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`home-tab-${tab.id}`}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{isKm ? tab.labelKm : tab.labelEn}</span>
                {tab.badge && (
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-emerald-400 text-slate-950' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================== TAB 1: OVERVIEW & QUICK HUB ===================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* FEATURE: Promotional Banner Carousel (0% Commission & Community Promos) */}
          <HomePromoBannerCarousel
            language={language}
            currency={currency}
            onNavigateTab={onNavigateTab as any}
          />

          {/* Hero Welcome & Platform Banner */}
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white p-5 md:p-8 shadow-xl overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 -top-10 w-48 h-48 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isKm ? 'កម្មវិធីឯករាជ្យឥតគិតថ្លៃ ១០០% • ជួយប្រជាជនកម្ពុជា' : '100% Free Independent Platform for Cambodia'}</span>
              </div>

              <h1 className="text-xl md:text-3xl font-black tracking-tight text-white leading-tight">
                {isKm 
                  ? 'ដឹកជញ្ជូន ផ្ញើឥវ៉ាន់ អាហារ និងការធ្វើដំណើរ ២៥ ខេត្ត-ក្រុង'
                  : 'Express Logistics, Local Food & Community Rides Across Cambodia'}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed">
                {isKm
                  ? 'កម្មវិធីឯករាជ្យផ្តល់ជូនដោយឥតគិតថ្លៃ ដើម្បីជួយសម្រួលដល់អ្នកប្រើប្រាស់ ផ្ញើឥវ៉ាន់តាមឡានវ៉ែន កុម្ម៉ង់ម្ហូប និងហៅកង់បីដោយគ្មានកម្រៃជើងសារ 0%។'
                  : 'Independent Cambodian platform provided 100% free to support the public: provincial parcel shipping, local market food, and community tuk-tuks with 0% middleman fees.'}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => onNavigateTab('courier')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition flex items-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>{isKm ? 'ផ្ញើឥវ៉ាន់ ២៥ ខេត្ត' : 'Send Parcels'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('home-waybill-qr-scanner-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 transition flex items-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-slate-950" />
                  <span>{isKm ? 'ស្កេនបាកូដកញ្ចប់ (Scan QR)' : 'Scan Waybill QR'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('home-shipping-calculator-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-950/40 transition flex items-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-white" />
                  <span>{isKm ? 'គណនាតម្លៃដឹកជញ្ជូន' : 'Shipping Calculator'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('home-nearby-dropoff-map-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-950/40 transition flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-white" />
                  <span>{isKm ? 'ទីតាំងផ្ញើជិតអ្នក (GPS)' : 'Nearby Drop-off'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('map')}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-950/40 transition flex items-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>{isKm ? 'បើកផែនទី Google Map' : 'Open Google Map'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('schedule')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{isKm ? 'កក់ថ្ងៃដឹកទុកមុន' : 'Pre-book Delivery'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* FEATURE: Quick Actions Grid (Streamlining User Flow) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                {isKm ? 'ផ្លូវកាត់សកម្មភាពរហ័ស (Quick Actions)' : 'Quick Actions'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isKm ? 'ចុចចូលភ្លាមៗ' : '1-tap shortcuts'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Shortcut 1: Request Pickup */}
              <div
                onClick={() => setActiveSubTab('schedule')}
                className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-white dark:from-slate-800/90 dark:to-slate-900 border border-indigo-200 dark:border-slate-700 hover:border-indigo-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30 group-hover:scale-105 transition">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="mt-3">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{isKm ? 'ស្នើសុំមកយកឥវ៉ាន់' : 'Request Pickup'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isKm ? 'កក់ក្នុងម៉ោងធ្វើការ' : 'Book business hour slot'}
                  </p>
                </div>
              </div>

              {/* Shortcut 2: Track My Package */}
              <div
                onClick={() => {
                  document.getElementById('home-waybill-qr-scanner-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 to-white dark:from-slate-800/90 dark:to-slate-900 border border-amber-200 dark:border-slate-700 hover:border-amber-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30 group-hover:scale-105 transition">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div className="mt-3">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{isKm ? 'តាមដានកញ្ចប់ឥវ៉ាន់' : 'Track My Package'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isKm ? 'ស្កេនបាកូដ & ផែនទីផ្ទាល់' : 'Live map & QR waybill'}
                  </p>
                </div>
              </div>

              {/* Shortcut 3: Find Courier */}
              <div
                onClick={() => onNavigateTab('courier')}
                className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 to-white dark:from-slate-800/90 dark:to-slate-900 border border-blue-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30 group-hover:scale-105 transition">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div className="mt-3">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{isKm ? 'ស្វែងរកក្រុមហ៊ុនដឹក' : 'Find Courier'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isKm ? 'ឡានវ៉ែន ២៥ ខេត្ត & តម្លៃ 0%' : '25-province fleet directory'}
                  </p>
                </div>
              </div>

              {/* Shortcut 4: Emergency Support */}
              <div
                onClick={() => setActiveSubTab('support')}
                className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/90 to-white dark:from-slate-800/90 dark:to-slate-900 border border-rose-200 dark:border-slate-700 hover:border-rose-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-600/30 group-hover:scale-105 transition">
                  <LifeBuoy className="w-5 h-5 text-white" />
                </div>
                <div className="mt-3">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{isKm ? 'ជំនួយបន្ទាន់ ២៤/៧' : 'Emergency Support'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isKm ? 'ទូរស័ព្ទបន្ទាន់ & ឆ្លើយសំណួរ' : 'Helpline & dispute center'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Waybill QR Scanner Component */}
          <div id="home-waybill-qr-scanner-section">
            <HomeWaybillQRScanner
              language={language}
              activeShipments={activeShipments}
              onSelectShipmentToTrack={onSelectShipmentToTrack}
              onNavigateTab={(tab) => onNavigateTab(tab)}
              onNotify={onNotify}
            />
          </div>

          {/* Primary 4 Category Shortcuts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              onClick={() => onNavigateTab('courier')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                <Truck className="w-5 h-5" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm flex items-center justify-between">
                  <span>{isKm ? 'ផ្ញើឥវ៉ាន់ ២៥ ខេត្ត' : '25 Provinces Parcel'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isKm ? 'ឡានវ៉ែន & ដឹកដល់ផ្ទះ' : 'Van fleet & door delivery'}</p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('food_ride')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center group-hover:scale-110 transition">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm flex items-center justify-between">
                  <span>{isKm ? 'ម្ហូប & ផ្សារក្នុងស្រុក' : 'Local Food & Market'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isKm ? 'គ្មានកម្រៃជើងសារ 0%' : '0% commission free'}</p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('food_ride')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <Car className="w-5 h-5" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm flex items-center justify-between">
                  <span>{isKm ? 'កង់បី & ម៉ូតូឌុប' : 'TukTuk & Moto DUP'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isKm ? 'តម្លៃផ្ទាល់ជូនអ្នកបើកបរ' : 'Direct fare to driver'}</p>
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('track')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                <Search className="w-5 h-5" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm flex items-center justify-between">
                  <span>{isKm ? 'តាមដានកញ្ចប់ឥវ៉ាន់' : 'Live Tracking'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{isKm ? 'ស្កេនបាកូដ & ផែនទី' : 'Barcode & live map'}</p>
              </div>
            </div>
          </div>

          {/* Interactive Fast Map & Scheduled Delivery Teaser Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Map Shortcut Card */}
            <div
              onClick={() => setActiveSubTab('map')}
              className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white border border-blue-800 shadow-sm hover:border-blue-500 transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30 group-hover:scale-110 transition">
                  <Compass className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">
                    {isKm ? 'ផ្ទាំងផែនទី Google Map & គន្លងឡាន' : 'Google Map & Live Fleet Tracking'}
                  </h4>
                  <p className="text-[11px] text-blue-200 mt-0.5">
                    {isKm ? 'ពិនិត្យទីតាំងជាក់ស្តែង ចរាចរណ៍ និងគណនាផ្លូវលឿនបំផុត' : 'Live vehicle positions, traffic condition & route optimization'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition" />
            </div>

            {/* Schedule Booking Shortcut Card */}
            <div
              onClick={() => setActiveSubTab('schedule')}
              className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white border border-emerald-800/60 shadow-sm hover:border-emerald-500 transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 group-hover:scale-110 transition">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">
                    {isKm ? 'កាលវិភាគកក់ការដឹកទុកមុន (Scheduled)' : 'Pre-book Future Deliveries'}
                  </h4>
                  <p className="text-[11px] text-emerald-200 mt-0.5">
                    {isKm ? 'ជ្រើសរើសថ្ងៃ ម៉ោង និងខេត្តផ្ញើ ស្ថានភាព "បានកក់ទុកមុន"' : 'Select date & time, auto updates to Scheduled status'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Active Shipments Mini-Widget */}
          {activeShipments.length > 0 && (() => {
            const query = shipmentSearchQuery.trim().toLowerCase();
            const filteredShipments = activeShipments.filter((ship) => {
              if (!query) return true;
              const matchTracking = ship.trackingNumber.toLowerCase().includes(query);
              const matchReceiver = (ship.receiverName || '').toLowerCase().includes(query);
              const matchSender = (ship.senderName || '').toLowerCase().includes(query);
              return matchTracking || matchReceiver || matchSender;
            });

            return (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {isKm ? 'កញ្ចប់ឥវ៉ាន់កំពុងដំណើរការ' : 'Active Shipments'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {filteredShipments.length} / {activeShipments.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('track')}
                      className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>{isKm ? 'មើលទាំងអស់' : 'View all'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Search Bar with Voice-to-Text Input */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={shipmentSearchQuery}
                      onChange={(e) => setShipmentSearchQuery(e.target.value)}
                      placeholder={
                        isKm
                          ? 'ស្វែងរកតាមលេខកូដ ឬឈ្មោះ (អាចចុច Mic និយាយលេខកូដបាន)...'
                          : 'Search tracking # or recipient (tap mic to speak)...'
                      }
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    {shipmentSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setShipmentSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Voice-to-Text Dictation Button */}
                  <VoiceSearchButton
                    language={language}
                    onTranscript={(dictated) => {
                      setShipmentSearchQuery(dictated);
                    }}
                    onNotify={onNotify}
                  />
                </div>

                {/* Shipment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {filteredShipments.slice(0, 4).map((ship) => (
                    <div
                      key={ship.trackingNumber}
                      onClick={() => {
                        onSelectShipmentToTrack(ship.trackingNumber);
                        onNavigateTab('track');
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-rose-50/20 transition cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs group-hover:scale-105 transition"
                          style={{ backgroundColor: ship.brandColor }}
                        >
                          {ship.carrierId.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span>#{ship.trackingNumber}</span>
                            {ship.status === 'scheduled' && (
                              <span className="text-[10px] text-indigo-700 bg-indigo-100 dark:bg-indigo-900/60 dark:text-indigo-300 px-1.5 py-0.2 rounded-md font-bold">
                                📅 {isKm ? 'កក់ទុកមុន' : 'Scheduled'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                            {isKm ? 'អ្នកទទួល៖ ' : 'To: '}<strong className="text-slate-800 dark:text-slate-200">{ship.receiverName}</strong>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <span>{isKm ? ship.senderCityKm : ship.senderCity}</span>
                            <span>➔</span>
                            <span>{isKm ? ship.receiverCityKm : ship.receiverCity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ship.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : ship.status === 'scheduled'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {isKm ? ship.statusKm : ship.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">
                          {ship.estimatedDelivery}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {currency === 'KHR'
                            ? `${ship.totalPriceKHR.toLocaleString()} ៛`
                            : `$${ship.totalPriceUSD.toFixed(2)}`}
                        </div>

                        {ship.status === 'delivered' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedShipmentForRating(ship);
                              setIsRatingModalOpen(true);
                            }}
                            className="mt-1 px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] transition flex items-center gap-1 shadow-2xs cursor-pointer ml-auto"
                          >
                            <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                            <span>{isKm ? 'វាយតម្លៃ' : 'Rate'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* FEATURE: AI Smart Delivery Alert (Congestion Analysis & Optimal Window) */}
          <SmartDeliveryAlertCard
            language={language}
            onApplyOptimalWindow={(slotId) => {
              setScheduledTimeSlot(slotId);
              setActiveSubTab('schedule');
            }}
            onNotify={onNotify}
          />

          {/* FEATURE: Delivery Status Alerts (Browser Push Notifications Toggle) */}
          <DeliveryStatusAlertsToggle
            language={language}
            onNotify={onNotify}
          />

          {/* FEATURE 1: Instant Shipping Cost Calculator (Origin/Destination & Package Size) */}
          <div id="home-shipping-calculator-section">
            <HomeShippingCalculator
              language={language}
              currency={currency}
              onNavigateTab={onNavigateTab as any}
              onNotify={onNotify}
              onScheduleShipment={onScheduleShipment}
            />
          </div>

          {/* FEATURE 2: Nearby Drop-off Points Map Widget (Geolocation & Nearest Kiosks) */}
          <div id="home-nearby-dropoff-map-section">
            <NearbyDropoffMapWidget
              language={language}
              currency={currency}
              onNotify={onNotify}
            />
          </div>

          {/* 30-Day Delivery Volume & Completion Rates Performance Card (Recharts) */}
          <DeliveryPerformanceCard
            language={language}
            currency={currency}
            activeShipments={activeShipments}
          />

          {/* Quick Support Hub & FAQ Teaser Card */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-5 border border-emerald-500/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    {isKm ? 'មជ្ឈមណ្ឌលជំនួយ & សំណួរឆ្លើយ (Support Hub & FAQ)' : 'Support Hub & Common FAQ'}
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    {isKm ? '២៥ ខេត្ត-ក្រុង' : '25 Provinces'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isKm
                    ? 'ស្វែងរកចម្លើយច្បាស់លាស់អំពីតម្លៃដឹកជញ្ជូន ផ្លូវជាតិ ឡានវ៉ែន និងសេវាទូទាំងប្រទេសកម្ពុជា'
                    : 'Search instant answers on Cambodia van routes, door-to-door pricing, and hub procedures.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('support')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>{isKm ? 'បើកមជ្ឈមណ្ឌលជំនួយ' : 'Explore Support Hub'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: CALENDAR-BASED SCHEDULING FEATURE ===================== */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* AI Smart Congestion & Optimal Window Alert */}
          <SmartDeliveryAlertCard
            language={language}
            onApplyOptimalWindow={(slotId) => setScheduledTimeSlot(slotId)}
            onNotify={onNotify}
          />

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{isKm ? 'កក់ការដឹកជញ្ជូនទុកមុនតាមកាលវិភាគ' : 'Calendar Delivery Scheduling'}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                      Scheduled
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isKm
                      ? 'ជ្រើសរើសកាលបរិច្ឆេទ និងចន្លោះម៉ោងមកយកកញ្ចប់ឥវ៉ាន់ ស្ថានភាពដំបូងនឹងត្រូវបានកំណត់ជា "បានកក់ទុកមុន (Scheduled)"'
                      : 'Pre-book parcel shipments for specific future dates and times. Status automatically initiates as "Scheduled".'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('overview')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>{isKm ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to Hub'}</span>
              </button>
            </div>

            {/* Business Operating Hours Notice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  <strong>{isKm ? 'ម៉ោងធ្វើការសេវាដឹកជញ្ជូន៖ ' : 'Official Courier Operating Hours: '}</strong>
                  {isKm ? '០៨:០០ ព្រឹក – ០៦:០០ ល្ងាច (ចន្ទ – អាទិត្យ)' : '08:00 AM – 06:00 PM Daily across Cambodia'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 self-start sm:self-auto">
                {isKm ? 'ផ្ទៀងផ្ទាត់ម៉ោងធ្វើការ' : 'Business Hours Enforced'}
              </span>
            </div>

            {/* Validation Error Banner */}
            {scheduleValidationError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{scheduleValidationError}</span>
              </div>
            )}

            {/* Interactive Calendar Booking Form */}
            <form onSubmit={handleConfirmScheduleBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isKm ? 'ជ្រើសរើសកាលបរិច្ឆេទដឹកជញ្ជូន (Future Date)' : 'Select Future Date'}</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setScheduledDate(e.target.value);
                      setScheduleValidationError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isKm ? 'អាចកក់ទុកមុនបានរហូតដល់ ៣០ ថ្ងៃ' : 'Pre-book up to 30 days in advance'}
                  </span>
                </div>

                {/* Time Slot Picker with Business Hours Validation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isKm ? 'ចន្លោះម៉ោងមកទទួលកញ្ចប់ (08:00 - 18:00)' : 'Pickup Time Window (08:00 - 18:00)'}</span>
                  </label>
                  <select
                    value={scheduledTimeSlot}
                    onChange={(e) => {
                      setScheduledTimeSlot(e.target.value);
                      setScheduleValidationError(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="morning_08_10">
                      {isKm ? '🌅 ០៨:៣០ ព្រឹក - ១០:៣០ ព្រឹក (ជើងព្រឹកព្រលឹម • ក្នុងម៉ោងធ្វើការ)' : '🌅 08:30 AM - 10:30 AM (Early Morning Run • Business Hours)'}
                    </option>
                    <option value="morning_09_11">
                      {isKm ? '☀️ ០៩:៣០ ព្រឹក - ១១:៣០ ព្រឹក (ជើងព្រឹក AI រលូន • ក្នុងម៉ោងធ្វើការ)' : '☀️ 09:30 AM - 11:30 AM (AI Optimal Low Traffic • Business Hours)'}
                    </option>
                    <option value="midday_11_13">
                      {isKm ? '🌤️ ១១:៣០ ព្រឹក - ០១:៣០ រសៀល (ជើងថ្ងៃត្រង់ • ក្នុងម៉ោងធ្វើការ)' : '🌤️ 11:30 AM - 01:30 PM (Midday Run • Business Hours)'}
                    </option>
                    <option value="afternoon_14_16">
                      {isKm ? '☀️ ០២:០០ រសៀល - ០៤:០០ រសៀល (ជើងរសៀល • ក្នុងម៉ោងធ្វើការ)' : '☀️ 02:00 PM - 04:00 PM (Afternoon Run • Business Hours)'}
                    </option>
                    <option value="evening_16_18">
                      {isKm ? '🌇 ០៤:៣០ រសៀល - ០៦:០០ ល្ងាច (ជើងល្ងាចចុងក្រោយ • ក្នុងម៉ោងធ្វើការ)' : '🌇 04:30 PM - 06:00 PM (Final Business Run • 06:00 PM Cutoff)'}
                    </option>
                  </select>
                </div>

                {/* Origin Province */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isKm ? 'ខេត្ត-ក្រុង ផ្ញើចេញ (Origin)' : 'Origin Province'}
                  </label>
                  <select
                    value={scheduledSenderProvince}
                    onChange={(e) => setScheduledSenderProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    {CAMBODIA_PROVINCES.map((prov) => (
                      <option key={prov.name} value={`${prov.name} (${prov.nameKm})`}>
                        {isKm ? prov.nameKm : prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Province */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isKm ? 'ខេត្ត-ក្រុង ទទួល (Destination)' : 'Destination Province'}
                  </label>
                  <select
                    value={scheduledReceiverProvince}
                    onChange={(e) => setScheduledReceiverProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    {CAMBODIA_PROVINCES.map((prov) => (
                      <option key={prov.name} value={`${prov.name} (${prov.nameKm})`}>
                        {isKm ? prov.nameKm : prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isKm ? 'ឈ្មោះអ្នកផ្ញើ' : 'Sender Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isKm ? 'ឧ. កែវ សុភា (Keo Sophea)' : 'e.g. Keo Sophea'}
                    value={scheduledSenderName}
                    onChange={(e) => setScheduledSenderName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isKm ? 'ឈ្មោះអ្នកទទួល' : 'Recipient Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isKm ? 'ឧ. ចាន់ ធីតា (Chan Thida)' : 'e.g. Chan Thida'}
                    value={scheduledReceiverName}
                    onChange={(e) => setScheduledReceiverName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status Note Banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">
                    {isKm ? 'ស្ថានភាពនឹងកំណត់ជា "បានកក់ទុកមុន (Scheduled)"' : 'Initial Status: "Scheduled"'}
                  </strong>
                  <span>
                    {isKm
                      ? 'កញ្ចប់ឥវ៉ាន់នឹងត្រូវបានបញ្ចូលទៅក្នុងបញ្ជីតាមដានផ្ទាល់របស់អ្នក ហើយឡានវ៉ែននឹងមកយកតាមកាលបរិច្ឆេទដែលបានជ្រើសរើស។'
                      : 'The shipment will be registered into your active tracking list and reserved for future collection.'}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('overview')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {isSubmittingSchedule
                      ? (isKm ? 'កំពុងកក់ទុក...' : 'Booking...')
                      : (isKm ? 'បញ្ជាក់ការកក់ទុកមុន (Confirm Schedule)' : 'Confirm Pre-booking')}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Scheduled Shipments Component */}
          <ScheduledPickupCard
            language={language}
            currency={currency}
            onNavigateTab={onNavigateTab as any}
            onNotify={onNotify}
          />
        </div>
      )}

      {/* ===================== TAB 3: GOOGLE MAP DASHBOARD ===================== */}
      {activeSubTab === 'map' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <MapDashboard
            language={language}
            currency={currency}
            activeShipments={activeShipments}
            onSelectShipmentToTrack={onSelectShipmentToTrack}
            onNavigateTab={onNavigateTab as any}
            onNotify={onNotify}
          />

          {/* Nearby Drop-off Points & Kiosks Map Widget */}
          <NearbyDropoffMapWidget
            language={language}
            currency={currency}
            onNotify={onNotify}
          />
        </div>
      )}

      {/* ===================== TAB 4: CALCULATORS & PRICING ACCORDION ===================== */}
      {activeSubTab === 'calculators' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-500" />
                  <span>{isKm ? 'ឧបករណ៍គណនាថ្លៃដឹក & ទំហំកញ្ចប់' : 'Logistics Pricing & Cost Calculators'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isKm ? 'ជ្រើសរើសឧបករណ៍ដើម្បីគណនាតម្លៃ និងទំហំកញ្ចប់ដោយតម្លាភាព 0% កម្រៃជើងសារ' : 'Select calculator tool to estimate parcel sizes and transparent rates'}
                </p>
              </div>

              {/* Accordion Switcher Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveCalculatorAccordion('shipping')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    activeCalculatorAccordion === 'shipping'
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-300'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{isKm ? 'គណនាតម្លៃខេត្ត & ទំហំ' : 'Shipping Calculator'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCalculatorAccordion('packaging')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    activeCalculatorAccordion === 'packaging'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isKm ? 'AI វេចខ្ចប់ឆ្លាតវៃ' : 'AI Smart Packaging'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCalculatorAccordion('size')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                    activeCalculatorAccordion === 'size' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isKm ? 'ទំហំកញ្ចប់' : 'Parcel Size'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCalculatorAccordion('quick')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                    activeCalculatorAccordion === 'quick' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isKm ? 'គណនារហ័ស' : 'Quick Estimator'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCalculatorAccordion('route')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                    activeCalculatorAccordion === 'route' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isKm ? 'ផ្លូវច្រើនកន្លែង' : 'Multi-Stop Route'}
                </button>
              </div>
            </div>

            {/* Active Accordion Child Content */}
            {activeCalculatorAccordion === 'shipping' && (
              <HomeShippingCalculator
                language={language}
                currency={currency}
                onNavigateTab={onNavigateTab as any}
                onNotify={onNotify}
                onScheduleShipment={onScheduleShipment}
              />
            )}

            {activeCalculatorAccordion === 'packaging' && (
              <SmartPackagingTool
                language={language}
                currency={currency}
                onNavigateTab={onNavigateTab as any}
                onNotify={onNotify}
              />
            )}

            {activeCalculatorAccordion === 'size' && (
              <ParcelSizeCostCalculator
                language={language}
                currency={currency}
                onNavigateTab={onNavigateTab as any}
                onNotify={onNotify}
              />
            )}

            {activeCalculatorAccordion === 'quick' && (
              <QuickCostEstimator
                language={language}
                currency={currency}
                onNavigateTab={onNavigateTab as any}
                onNotify={onNotify}
              />
            )}

            {activeCalculatorAccordion === 'route' && (
              <RouteOptimizationEngine
                language={language}
                currency={currency}
                onNotify={onNotify}
                onNavigateTab={onNavigateTab as any}
              />
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 5: CARRIERS DIRECTORY ===================== */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                  {isKm ? 'បណ្តាញសេវាដឹកជញ្ជូនឯករាជ្យកម្ពុជា' : 'Independent Cambodia Logistics Fleets'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isKm ? 'បណ្តាញដឹកជញ្ជូនសហគមន៍ ២៥ ខេត្ត-ក្រុង ឥតគិតថ្លៃសេវា 0%' : 'Community logistics across 25 provinces with 0% platform commission'}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs">
                {(['all', 'courier', 'food', 'ride'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCarrierFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      carrierFilter === filter
                        ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {filter === 'all'
                      ? (isKm ? 'ទាំងអស់' : 'All')
                      : filter === 'courier'
                      ? (isKm ? 'បញ្ញើខេត្ត' : 'Couriers')
                      : filter === 'food'
                      ? (isKm ? 'ម្ហូប & ផ្សារ' : 'Food')
                      : (isKm ? 'កង់បី/ម៉ូតូ' : 'Rides')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
              {filteredCarriers.map((carrier) => (
                <div
                  key={carrier.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs"
                        style={{ backgroundColor: carrier.brandColor }}
                      >
                        {carrier.name.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{carrier.rating}</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm mt-2.5">
                      {isKm ? carrier.nameKm : carrier.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {isKm ? carrier.taglineKm : carrier.tagline}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <a
                      href={`tel:${carrier.contactPhone.replace(/\s/g, '')}`}
                      className="flex items-center gap-1 font-semibold text-rose-600 hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{carrier.contactPhone}</span>
                    </a>
                    <span className="text-[11px] text-slate-400">
                      {carrier.provincesCoverage} {isKm ? 'ខេត្ត-ក្រុង' : 'Provinces'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 6: SUPPORT HUB & FAQ ===================== */}
      {activeSubTab === 'support' && (
        <div className="animate-in fade-in duration-200">
          <SupportHub
            language={language}
            currency={currency}
            onNavigateTab={onNavigateTab}
            onNotify={onNotify}
          />
        </div>
      )}

      {/* Courier Rating & Feedback Modal */}
      <CourierRatingFeedbackModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        shipment={selectedShipmentForRating}
        language={language}
        onNotify={onNotify}
      />
    </div>
  );
};
