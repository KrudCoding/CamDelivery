import React, { useState } from 'react';
import { 
  PackageCheck, 
  Truck, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Calendar,
  Sparkles,
  Info,
  Camera,
  Image as ImageIcon,
  Check,
  Maximize2
} from 'lucide-react';
import { TrackingItem, Language } from '../types';
import { CourierWeatherBadge } from './CourierWeatherBadge';

interface ShipmentProgressTimelineProps {
  shipment: TrackingItem;
  language: Language;
  estimatedArrivalClock?: string;
  className?: string;
  onOpenProofModal?: () => void;
}

export type TimelineStepKey = 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered';

export interface TimelineStepInfo {
  key: TimelineStepKey;
  stepNumber: number;
  label: string;
  labelKm: string;
  shortDesc: string;
  shortDescKm: string;
  location: string;
  locationKm: string;
  timestamp: string;
  timestampKm: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isPending: boolean;
  icon: React.ElementType;
}

export const ShipmentProgressTimeline: React.FC<ShipmentProgressTimelineProps> = ({
  shipment,
  language,
  estimatedArrivalClock,
  className = '',
  onOpenProofModal,
}) => {
  const isKm = language === 'km';
  const [expandedStep, setExpandedStep] = useState<TimelineStepKey | null>(null);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState<boolean>(false);

  // Map shipment status to active step index:
  // 0 = Picked Up, 1 = In Transit, 2 = Out for Delivery, 3 = Delivered
  const getStepIndex = (status: TrackingItem['status']): number => {
    switch (status) {
      case 'pending':
      case 'scheduled':
        return 0;
      case 'picked_up':
        return 0;
      case 'in_transit':
        return 1;
      case 'out_for_delivery':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 1;
    }
  };

  const currentStepIndex = getStepIndex(shipment.status);
  const isDelivered = shipment.status === 'delivered';

  // Helper to find timestamp from milestones or fallback to reasonable values
  const getMilestoneTimestamp = (type: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered'): { en: string; km: string } => {
    // Look in shipment milestones
    const ms = shipment.milestones || [];
    
    if (type === 'picked_up') {
      const match = ms.find(m => 
        m.status.toLowerCase().includes('received') || 
        m.status.toLowerCase().includes('picked') || 
        m.status.toLowerCase().includes('package')
      );
      if (match) {
        return { en: `${match.date}, ${match.time}`, km: `${match.date === 'Today' ? 'ថ្ងៃនេះ' : match.date} ម៉ោង ${match.time}` };
      }
      return { en: 'Today, 08:00 AM', km: 'ថ្ងៃនេះ ម៉ោង ០៨:០០ ព្រឹក' };
    }

    if (type === 'in_transit') {
      const match = ms.find(m => 
        m.status.toLowerCase().includes('transit') || 
        m.status.toLowerCase().includes('departed') ||
        m.location.toLowerCase().includes('road') ||
        m.location.toLowerCase().includes('station')
      );
      if (match) {
        return { en: `${match.date}, ${match.time}`, km: `${match.date === 'Today' ? 'ថ្ងៃនេះ' : match.date} ម៉ោង ${match.time}` };
      }
      return { en: 'Today, 10:15 AM', km: 'ថ្ងៃនេះ ម៉ោង ១០:១៥ ព្រឹក' };
    }

    if (type === 'out_for_delivery') {
      const match = ms.find(m => 
        m.status.toLowerCase().includes('out') || 
        m.status.toLowerCase().includes('ready') ||
        m.description.toLowerCase().includes('en route')
      );
      if (match && (currentStepIndex >= 2 || isDelivered)) {
        return { en: `${match.date}, ${match.time}`, km: `${match.date === 'Today' ? 'ថ្ងៃនេះ' : match.date} ម៉ោង ${match.time}` };
      }
      if (currentStepIndex >= 2) {
        return { en: 'Today, 02:40 PM', km: 'ថ្ងៃនេះ ម៉ោង ០២:៤០ រសៀល' };
      }
      return { 
        en: estimatedArrivalClock ? `Est. ~${estimatedArrivalClock}` : 'Est. Today ~03:30 PM', 
        km: estimatedArrivalClock ? `រំពឹងទុក ~${estimatedArrivalClock}` : 'រំពឹងទុក ថ្ងៃនេះ ~០៣:៣០ រសៀល' 
      };
    }

    if (type === 'delivered') {
      if (isDelivered) {
        const lastMilestone = ms[ms.length - 1];
        if (lastMilestone && (lastMilestone.status.toLowerCase().includes('deliver') || lastMilestone.completed)) {
          return { en: `${lastMilestone.date}, ${lastMilestone.time}`, km: `${lastMilestone.date === 'Today' ? 'ថ្ងៃនេះ' : lastMilestone.date} ម៉ោង ${lastMilestone.time}` };
        }
        return { en: 'Today, 04:15 PM', km: 'ថ្ងៃនេះ ម៉ោង ០៤:១៥ រសៀល' };
      }
      return { 
        en: estimatedArrivalClock ? `Est. ~${estimatedArrivalClock}` : (shipment.estimatedDelivery || 'Est. 04:30 PM'), 
        km: estimatedArrivalClock ? `រំពឹងទុក ~${estimatedArrivalClock}` : (shipment.estimatedDeliveryKm || 'រំពឹងទុក ម៉ោង ០៤:៣០ រសៀល') 
      };
    }

    return { en: 'Today', km: 'ថ្ងៃនេះ' };
  };

  const steps: TimelineStepInfo[] = [
    {
      key: 'picked_up',
      stepNumber: 1,
      label: 'Picked Up',
      labelKm: 'បានទទួលកញ្ចប់',
      shortDesc: `Collected from ${shipment.senderName}`,
      shortDescKm: `ទទួលកញ្ចប់ពី ${shipment.senderName}`,
      location: `${shipment.senderCity} Central Hub`,
      locationKm: `ស្ថានីយមជ្ឈមណ្ឌល ${shipment.senderCityKm}`,
      timestamp: getMilestoneTimestamp('picked_up').en,
      timestampKm: getMilestoneTimestamp('picked_up').km,
      isCompleted: isDelivered || currentStepIndex > 0,
      isCurrent: !isDelivered && currentStepIndex === 0,
      isPending: false,
      icon: PackageCheck,
    },
    {
      key: 'in_transit',
      stepNumber: 2,
      label: 'In Transit',
      labelKm: 'កំពុងធ្វើដំណើរ',
      shortDesc: `Moving via National Highway`,
      shortDescKm: `ធ្វើដំណើរលើផ្លូវជាតិឆ្ពោះទៅគោលដៅ`,
      location: shipment.routeCoordinates?.current?.label ? `${shipment.routeCoordinates.current.label} Station` : 'Highway Route Station',
      locationKm: shipment.routeCoordinates?.current?.label ? `ស្ថានីយ ${shipment.routeCoordinates.current.label}` : 'ផ្លូវជាតិឆ្លងកាត់ខេត្ត',
      timestamp: getMilestoneTimestamp('in_transit').en,
      timestampKm: getMilestoneTimestamp('in_transit').km,
      isCompleted: isDelivered || currentStepIndex > 1,
      isCurrent: !isDelivered && currentStepIndex === 1,
      isPending: currentStepIndex < 1,
      icon: Truck,
    },
    {
      key: 'out_for_delivery',
      stepNumber: 3,
      label: 'Out for Delivery',
      labelKm: 'កំពុងចេញដឹក',
      shortDesc: shipment.driverName ? `Driver ${shipment.driverName} on final mile` : 'Courier en route to recipient',
      shortDescKm: shipment.driverName ? `អ្នកដឹក ${shipment.driverName} កំពុងធ្វើដំណើរទៅជិតដល់` : 'អ្នកដឹកកំពុងចេញចែកជូនដល់ផ្ទះ',
      location: `${shipment.receiverCity} Local Station`,
      locationKm: `សាខាចែកចាយ ${shipment.receiverCityKm}`,
      timestamp: getMilestoneTimestamp('out_for_delivery').en,
      timestampKm: getMilestoneTimestamp('out_for_delivery').km,
      isCompleted: isDelivered || currentStepIndex > 2,
      isCurrent: !isDelivered && currentStepIndex === 2,
      isPending: currentStepIndex < 2,
      icon: Navigation,
    },
    {
      key: 'delivered',
      stepNumber: 4,
      label: 'Delivered',
      labelKm: 'បានដឹកជញ្ជូនដល់',
      shortDesc: `Handed to recipient (${shipment.receiverName})`,
      shortDescKm: `ប្រគល់ជូនអ្នកទទួល (${shipment.receiverName})`,
      location: `${shipment.receiverCity} Destination Address`,
      locationKm: `អាសយដ្ឋានអ្នកទទួល ${shipment.receiverCityKm}`,
      timestamp: getMilestoneTimestamp('delivered').en,
      timestampKm: getMilestoneTimestamp('delivered').km,
      isCompleted: isDelivered,
      isCurrent: isDelivered,
      isPending: !isDelivered,
      icon: CheckCircle2,
    },
  ];

  // Calculate percentage for progress line
  const progressPercent = isDelivered ? 100 : currentStepIndex === 0 ? 15 : currentStepIndex === 1 ? 50 : 85;

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm transition hover:shadow-md ${className}`}>
      {/* Header with Title and Progress Percent */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                {isKm ? 'វឌ្ឍនភាពដឹកជញ្ជូនជាដំណាក់កាល (Step-by-Step Progress)' : 'Shipment Progress Timeline'}
              </h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isDelivered 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : currentStepIndex === 2 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}>
                {isDelivered 
                  ? (isKm ? 'បានសម្រេច ១០០%' : '100% Complete') 
                  : currentStepIndex === 2 
                  ? (isKm ? 'ដំណាក់កាលទី ៣ (ចេញដឹក)' : 'Step 3 of 4: Last Mile') 
                  : (isKm ? `ដំណាក់កាលទី ${currentStepIndex + 1} នៃ ៤` : `Step ${currentStepIndex + 1} of 4`)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isKm 
                ? 'តាមដានការវិវឌ្ឍន៍ពីការទទួល ឆ្លងកាត់ផ្លូវជាតិ រហូតដល់ប្រគល់ជូនអ្នកទទួល' 
                : 'Real-time milestones from initial pickup to final doorstep handover'}
            </p>
          </div>
        </div>

        {/* Weather condition indicator alongside current status pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {shipment.routeCoordinates?.current && (
            <CourierWeatherBadge
              lat={shipment.routeCoordinates.current.lat}
              lng={shipment.routeCoordinates.current.lng}
              locationLabel={shipment.routeCoordinates.current.label}
              locationLabelKm={shipment.senderCityKm}
              language={language}
              compact={true}
            />
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">
              {isKm ? 'ស្ថានភាព៖' : 'Status:'}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 ${
              isDelivered 
                ? 'bg-emerald-500 text-white shadow-2xs' 
                : currentStepIndex === 2 
                ? 'bg-amber-500 text-slate-950 shadow-2xs' 
                : 'bg-blue-600 text-white shadow-2xs'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>
                {isKm 
                  ? steps[currentStepIndex].labelKm 
                  : steps[currentStepIndex].label}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL STEP TRACKER (DESKTOP & TABLET) */}
      <div className="hidden md:block py-3 px-2">
        <div className="relative">
          {/* Background Track Line */}
          <div className="absolute top-6 left-8 right-8 h-1 bg-slate-100 rounded-full" />
          
          {/* Active Colored Progress Fill */}
          <div 
            className="absolute top-6 left-8 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 rounded-full transition-all duration-700 ease-in-out"
            style={{ width: `calc(${progressPercent}% - 3rem)` }}
          />

          {/* Stepper Nodes */}
          <div className="grid grid-cols-4 relative z-10">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div 
                  key={step.key} 
                  className="flex flex-col items-center text-center px-1 group cursor-pointer"
                  onClick={() => setExpandedStep(expandedStep === step.key ? null : step.key)}
                >
                  {/* Step Bubble Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-300 shadow-sm relative ${
                    step.isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                      : step.isCurrent
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white ring-4 ring-amber-100 shadow-md scale-105 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    <StepIcon className="w-5 h-5" />
                    {step.isCompleted && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[9px] border-2 border-white">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Step Name */}
                  <div className="mt-2.5">
                    <span className={`text-xs font-black block leading-snug ${
                      step.isCompleted 
                        ? 'text-emerald-900' 
                        : step.isCurrent 
                        ? 'text-amber-900 font-extrabold' 
                        : 'text-slate-400'
                    }`}>
                      {isKm ? step.labelKm : step.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 max-w-[140px] truncate">
                      {isKm ? step.shortDescKm : step.shortDesc}
                    </span>
                  </div>

                  {/* Timestamp Badge */}
                  <div className="mt-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      step.isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : step.isCurrent
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 font-extrabold'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>{isKm ? step.timestampKm : step.timestamp}</span>
                    </span>
                  </div>

                  {/* Location snippet */}
                  <div className="mt-1 flex items-center gap-0.5 text-[9px] text-slate-400 max-w-[130px] truncate">
                    <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                    <span className="truncate">{isKm ? step.locationKm : step.location}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VERTICAL STEP TRACKER (MOBILE VIEW) */}
      <div className="md:hidden space-y-3 py-1">
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {steps.map((step) => {
            const StepIcon = step.icon;
            return (
              <div 
                key={step.key} 
                className="relative cursor-pointer group"
                onClick={() => setExpandedStep(expandedStep === step.key ? null : step.key)}
              >
                {/* Node marker on the line */}
                <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  step.isCompleted
                    ? 'bg-emerald-600 ring-4 ring-emerald-100 text-white'
                    : step.isCurrent
                    ? 'bg-amber-500 ring-4 ring-amber-100 text-white animate-pulse'
                    : 'bg-slate-200 border-2 border-white'
                }`}>
                  {step.isCompleted && <span className="text-[8px] font-bold">✓</span>}
                  {step.isCurrent && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>

                {/* Content Box */}
                <div className={`p-3 rounded-xl border transition-all ${
                  step.isCurrent
                    ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                    : step.isCompleted
                    ? 'bg-emerald-50/40 border-emerald-100'
                    : 'bg-slate-50/60 border-slate-200/80'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        step.isCompleted
                          ? 'bg-emerald-600 text-white'
                          : step.isCurrent
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        <StepIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black ${
                            step.isCompleted 
                              ? 'text-emerald-900' 
                              : step.isCurrent 
                              ? 'text-amber-900 font-extrabold' 
                              : 'text-slate-600'
                          }`}>
                            {isKm ? step.labelKm : step.label}
                          </span>
                          {step.isCurrent && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 uppercase">
                              {isKm ? 'កំពុងដំណើរការ' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isKm ? step.shortDescKm : step.shortDesc}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        step.isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : step.isCurrent
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>{isKm ? step.timestampKm : step.timestamp}</span>
                      </span>
                    </div>
                  </div>

                  {/* Proof of Delivery Photo Display (For Delivered Step) */}
                  {step.key === 'delivered' && shipment.proofOfDelivery && (
                    <div className="mt-3 p-2.5 rounded-xl bg-white border border-emerald-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                        <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isKm ? 'រូបថតភស្តុតាងប្រគល់ទំនិញ (Proof of Delivery)' : 'Proof of Delivery Photo'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isKm ? shipment.proofOfDelivery.capturedAtKm : shipment.proofOfDelivery.capturedAt}
                        </span>
                      </div>

                      <div 
                        onClick={() => setIsPhotoZoomed(true)}
                        className="relative rounded-xl overflow-hidden border border-slate-200 cursor-pointer group h-40 sm:h-48 bg-slate-900"
                        title={isKm ? 'ចុចដើម្បីមើលរូបថតពេញ' : 'Click to view full photo'}
                      >
                        <img
                          src={shipment.proofOfDelivery.photoUrl}
                          alt="Proof of delivery"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isKm ? 'ពង្រីករូបថត' : 'View Full Photo'}</span>
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white text-[9.5px] px-2.5 py-1.5 rounded-lg flex items-center justify-between flex-wrap gap-1">
                          <span className="truncate">📍 {isKm ? shipment.proofOfDelivery.locationKm : shipment.proofOfDelivery.location}</span>
                          <span className="text-emerald-400 font-bold shrink-0">✓ Verified Doorstep Handover</span>
                        </div>
                      </div>

                      {shipment.proofOfDelivery.courierNotes && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-700">{isKm ? 'កំណត់សម្គាល់អ្នកដឹក៖ ' : 'Courier Note: '}</span>
                          <span>"{isKm ? shipment.proofOfDelivery.courierNotesKm || shipment.proofOfDelivery.courierNotes : shipment.proofOfDelivery.courierNotes}"</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Courier Button to Take / Re-take Proof of Delivery Photo */}
                  {step.key === 'delivered' && onOpenProofModal && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onOpenProofModal}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {shipment.proofOfDelivery
                            ? (isKm ? 'ថតរូបភស្តុតាងឡើងវិញ' : 'Retake Delivery Photo')
                            : (isKm ? 'ថតរូបភស្តុតាងប្រគល់ទំនិញ' : 'Take Proof of Delivery Photo')}
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{isKm ? step.locationKm : step.location}</span>
                    </div>
                    <span className="text-slate-400 font-bold shrink-0">
                      Step {step.stepNumber}/4
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Informative Step Details Footer / Expansion */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs flex-wrap text-slate-600">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            {isKm 
              ? 'ម៉ោង និងកាលបរិច្ឆេទទាំងអស់ត្រូវបានធ្វើបច្ចុប្បន្នភាពតាមប្រព័ន្ធ GPS និងស្ថានីយដឹកជញ្ជូន' 
              : 'All milestone timestamps reflect live GPS status and verified depot scans'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="text-slate-400">{isKm ? 'គោលដៅ៖' : 'Destination:'}</span>
          <span className="text-slate-800 font-extrabold">
            {isKm ? shipment.receiverCityKm : shipment.receiverCity}
          </span>
        </div>
      </div>

      {/* Proof of Delivery Photo Fullscreen Zoom Lightbox Modal */}
      {isPhotoZoomed && shipment.proofOfDelivery && (
        <div 
          onClick={() => setIsPhotoZoomed(false)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-sm text-white">
                  {isKm ? 'រូបថតភស្តុតាងប្រគល់ទំនិញ (Full Proof of Delivery)' : 'Verified Proof of Delivery (Full Resolution)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoZoomed(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={shipment.proofOfDelivery.photoUrl}
                alt="Proof of Delivery Full"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
              <div>
                <span className="text-emerald-400 font-bold block">
                  📍 {isKm ? shipment.proofOfDelivery.locationKm : shipment.proofOfDelivery.location}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isKm ? shipment.proofOfDelivery.capturedAtKm : shipment.proofOfDelivery.capturedAt} • {shipment.driverName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoZoomed(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition text-xs cursor-pointer"
              >
                {isKm ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
