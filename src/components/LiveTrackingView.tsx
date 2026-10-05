import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Phone, 
  PhoneCall,
  Send, 
  Truck, 
  Navigation, 
  Share2, 
  ChevronRight, 
  ShieldCheck, 
  Building2,
  Calendar,
  AlertCircle,
  Timer,
  Zap,
  Sparkles,
  Info,
  ArrowRight,
  QrCode,
  Camera,
  MessageSquare,
  MessageCircle,
  Star,
  Award,
  UserCheck,
  Car,
  Heart,
  Bell,
  RefreshCw,
  Printer,
  FileText,
  Radio,
  Compass,
  Layers,
  Copy,
  Check,
  ExternalLink,
  X,
  BadgeCheck,
  CalendarCheck,
  BellRing,
  BellOff,
  Battery
} from 'lucide-react';
import { TrackingItem, Language, Currency, EstimatedDeliverySchedule, DeliveryReview, CourierVerificationRecord, ProofOfDeliveryRecord, DeliveryIssueReport, TrackingMilestone } from '../types';
import { calculateEstimatedDeliverySchedule } from '../utils/deliveryCalculator';
import { saveDeliveryReview } from '../utils/offlineStorage';
import { isPowerSaverMode, setPowerSaverMode, POWER_SAVER_EVENT } from '../utils/powerSaverService';
import { WaybillQRScannerModal } from './WaybillQRScannerModal';
import { TrackCameraScannerCard } from './TrackCameraScannerCard';
import { CourierVerificationModal } from './CourierVerificationModal';
import { DriverChatModal } from './DriverChatModal';
import { DriverProfileModal } from './DriverProfileModal';
import { VoiceSearchButton } from './VoiceSearchButton';
import { CourierLiveSocketMessenger } from './CourierLiveSocketMessenger';
import { DriverLiveMap } from './DriverLiveMap';
import { ActiveShipmentPathOverlay } from './ActiveShipmentPathOverlay';
import { PostDeliveryReviewModal } from './PostDeliveryReviewModal';
import { DeliveryStarRatingCard } from './DeliveryStarRatingCard';
import { OutForDeliveryAlertBanner } from './OutForDeliveryAlertBanner';
import { ProximityArrivalAlertBanner } from './ProximityArrivalAlertBanner';
import { DeliveryLabelModal } from './DeliveryLabelModal';
import { ShipmentProgressTimeline } from './ShipmentProgressTimeline';
import { JourneyDistanceProgressBar } from './JourneyDistanceProgressBar';
import { CourierProfileView } from './CourierProfileView';
import { EstimatedDeliveryCountdownCard } from './EstimatedDeliveryCountdownCard';
import { CalendarReminderModal } from './CalendarReminderModal';
import { ShareTrackingModal } from './ShareTrackingModal';
import { SpecialDeliveryInstructionsCard } from './SpecialDeliveryInstructionsCard';
import { CourierWeatherBadge } from './CourierWeatherBadge';
import { EtaDistanceCalculator } from './EtaDistanceCalculator';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';
import { RescheduleDeliveryModal } from './RescheduleDeliveryModal';
import { DeliveryRescheduleCard } from './DeliveryRescheduleCard';
import { recordCompletedShipmentPoints } from '../utils/loyaltyService';
import {
  triggerOutForDeliveryNotification,
  OutForDeliveryNotificationEvent,
  triggerProximityAlertNotification,
  ProximityNotificationEvent,
  requestBrowserNotificationPermission,
  getBrowserNotificationPermission,
  sendBrowserNotification
} from '../services/notificationService';

interface LiveTrackingViewProps {
  language: Language;
  currency: Currency;
  activeShipments: TrackingItem[];
  selectedTrackingNumber?: string;
  onUpdateShipment?: (updatedShipment: TrackingItem) => void;
}

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  language,
  currency,
  activeShipments,
  selectedTrackingNumber,
  onUpdateShipment,
}) => {
  const isKm = language === 'km';
  const [searchInput, setSearchInput] = useState(selectedTrackingNumber || (activeShipments[0]?.trackingNumber ?? 'KH-VAN-882910'));
  const [currentShipment, setCurrentShipment] = useState<TrackingItem | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [simulatedVehicleProgress, setSimulatedVehicleProgress] = useState(65);
  const [comparisonCourierId, setComparisonCourierId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanToast, setScanToast] = useState<string | null>(null);
  const [wasScannedViaCamera, setWasScannedViaCamera] = useState(false);
  const [activeDeliveryAlert, setActiveDeliveryAlert] = useState<OutForDeliveryNotificationEvent | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDriverProfileOpen, setIsDriverProfileOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDeliveryLabelOpen, setIsDeliveryLabelOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [proximityAlert, setProximityAlert] = useState<ProximityNotificationEvent | null>(null);
  const [courierDistanceMeters, setCourierDistanceMeters] = useState<number>(450);
  const [trackingViewMode, setTrackingViewMode] = useState<'timeline' | 'map' | 'split'>('timeline');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [trafficFactor, setTrafficFactor] = useState<'normal' | 'moderate' | 'peak' | 'rain'>('moderate');
  const [isOptimizedRouteActive, setIsOptimizedRouteActive] = useState<boolean>(false);
  const [showPastRoute, setShowPastRoute] = useState<boolean>(true);
  const [isProofModalOpen, setIsProofModalOpen] = useState<boolean>(false);
  const [liveCourierSpeed, setLiveCourierSpeed] = useState<number>(68);
  const [isLiveCourierMoving, setIsLiveCourierMoving] = useState<boolean>(true);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
  const [isArrivalAlertEnabled, setIsArrivalAlertEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('camdelivery_arrival_alert_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isPowerSaver, setIsPowerSaver] = useState<boolean>(isPowerSaverMode);

  useEffect(() => {
    const handlePowerSaver = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail && typeof custom.detail.enabled === 'boolean') {
        setIsPowerSaver(custom.detail.enabled);
      } else {
        setIsPowerSaver(isPowerSaverMode());
      }
    };
    window.addEventListener(POWER_SAVER_EVENT, handlePowerSaver);
    return () => window.removeEventListener(POWER_SAVER_EVENT, handlePowerSaver);
  }, []);

  const handleTogglePowerSaver = () => {
    const next = !isPowerSaver;
    setPowerSaverMode(next);
    setIsPowerSaver(next);
    setScanToast(
      next
        ? (isKm
            ? '🔋 បានបើកម៉ូដសន្សំថ្ម (Power Saver Mode)! កាត់បន្ថយការ refresh ផែនទី និង polling មក ៦ វិនាទី ដើម្បីសន្សំថ្ម ៤៥% លើផ្លូវឆ្ងាយ។'
            : '🔋 Power Saver Mode enabled! Map refresh rate throttled to 6.0s (~45% battery savings for long journeys).')
        : (isKm
            ? '⚡ បានបិទម៉ូដសន្សំថ្ម! ផែនទីដំណើរការ refresh ល្បឿនលឿនធម្មតា (១.៥ វិនាទី)។'
            : '⚡ Power Saver disabled! Real-time map polling restored to standard 1.5s rate.')
    );
    setTimeout(() => setScanToast(null), 4500);
  };

  const prevStatusRef = useRef<string | null>(null);
  const prevShipmentIdRef = useRef<string | null>(null);

  // Sync browser notification permission state
  useEffect(() => {
    setBrowserPermission(getBrowserNotificationPermission());
  }, []);

  // Detect status transition from 'in_transit' to 'out_for_delivery' and trigger notification service
  useEffect(() => {
    if (!currentShipment) {
      prevStatusRef.current = null;
      prevShipmentIdRef.current = null;
      return;
    }

    const isSameShipment = prevShipmentIdRef.current === currentShipment.trackingNumber;

    if (isSameShipment && prevStatusRef.current === 'in_transit' && currentShipment.status === 'out_for_delivery') {
      const event = triggerOutForDeliveryNotification(currentShipment, language, () => {
        document.getElementById('shipment-details-section')?.scrollIntoView({ behavior: 'smooth' });
      });
      setActiveDeliveryAlert(event);
    }

    prevStatusRef.current = currentShipment.status;
    prevShipmentIdRef.current = currentShipment.trackingNumber;
  }, [currentShipment?.status, currentShipment?.trackingNumber, language]);

  const handleRequestBrowserPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      setScanToast(
        isKm
          ? 'ការជូនដំណឹងតាម Browser ត្រូវបានបើកដោយជោគជ័យ! លោកអ្នកនឹងទទួលបានដំណឹងពេលឥវ៉ាន់ចេញដឹក។'
          : 'Browser notifications enabled! You will receive system alerts when shipments go out for delivery.'
      );
      setTimeout(() => setScanToast(null), 4500);
    }
  };

  const handleSimulateOutForDelivery = () => {
    if (!currentShipment) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: TrackingItem = {
      ...currentShipment,
      status: 'out_for_delivery',
      statusKm: 'កំពុងចេញដឹកជញ្ជូនដល់ផ្ទះ',
      milestones: [
        ...currentShipment.milestones.map((m) => ({ ...m, current: false })),
        {
          time: nowTime,
          date: 'Today',
          status: 'Out for Delivery',
          statusKm: 'កំពុងចេញដឹកជញ្ជូនដល់ផ្ទះ',
          location: `${currentShipment.receiverCity} Distribution Hub`,
          locationKm: `${currentShipment.receiverCityKm} / ចេញដឹកជូនអ្នកទទួល`,
          description: `Rider ${currentShipment.driverName || 'Courier'} has collected your parcel and is en route for final doorstep delivery.`,
          descriptionKm: `អ្នកដឹកជញ្ជូន ${currentShipment.driverName || 'Courier'} បានទទួលកញ្ចប់ឥវ៉ាន់ និងកំពុងធ្វើដំណើរចេញដឹកជូនអ្នកដល់ផ្ទះ។`,
          completed: true,
          current: true,
        },
      ],
    };
    setCurrentShipment(updated);
    setSimulatedVehicleProgress(88);
    if (onUpdateShipment) {
      onUpdateShipment(updated);
    }
  };

  const handleResetToInTransit = () => {
    if (!currentShipment) return;
    const updated: TrackingItem = {
      ...currentShipment,
      status: 'in_transit',
      statusKm: 'កំពុងដឹកជញ្ជូនលើផ្លូវជាតិ',
    };
    setCurrentShipment(updated);
    setSimulatedVehicleProgress(65);
    setActiveDeliveryAlert(null);
    if (onUpdateShipment) {
      onUpdateShipment(updated);
    }
  };

  const handleSimulate500mProximityPush = (distanceMeters: number = 450) => {
    if (!currentShipment) return;

    if (currentShipment.status !== 'out_for_delivery' && currentShipment.status !== 'delivered') {
      const updated: TrackingItem = {
        ...currentShipment,
        status: 'out_for_delivery',
        statusKm: 'កំពុងចេញដឹកជញ្ជូនដល់ផ្ទះ',
      };
      setCurrentShipment(updated);
      if (onUpdateShipment) onUpdateShipment(updated);
    }

    setSimulatedVehicleProgress(93);
    setCourierDistanceMeters(distanceMeters);

    if (isArrivalAlertEnabled) {
      const event = triggerProximityAlertNotification(
        currentShipment,
        distanceMeters,
        language,
        () => {
          document.getElementById('proximity-radar-section')?.scrollIntoView({ behavior: 'smooth' });
        }
      );
      setProximityAlert(event);
    } else {
      setScanToast(
        isKm
          ? `📍 អ្នកដឹកស្ថិតនៅចម្ងាយ ${distanceMeters}ម (ដំណឹង Arrival Alert ត្រូវបានបិទ - សូមបើក Alert ដើម្បីទទួលដំណឹងតាម Browser)`
          : `📍 Courier is ${distanceMeters}m away (Arrival Alert is muted - turn on Arrival Alert toggle to receive browser notifications)`
      );
      setTimeout(() => setScanToast(null), 5000);
    }
  };

  const handleToggleArrivalAlert = async (nextState: boolean) => {
    if (nextState) {
      const currentPerm = getBrowserNotificationPermission();
      if (currentPerm !== 'granted') {
        const requested = await requestBrowserNotificationPermission();
        setBrowserPermission(requested);
        if (requested !== 'granted') {
          setScanToast(
            isKm
              ? '⚠️ សូមអនុញ្ញាត Browser Notification ដើម្បីទទួលដំណឹងពេលអ្នកដឹកមកដល់ចម្ងាយក្រោម ៥០០ម!'
              : '⚠️ Please allow browser notifications in settings to receive the 500m arrival alert!'
          );
          setTimeout(() => setScanToast(null), 5000);
          setIsArrivalAlertEnabled(false);
          try { localStorage.setItem('camdelivery_arrival_alert_enabled', 'false'); } catch {}
          return;
        }
      }

      setIsArrivalAlertEnabled(true);
      try { localStorage.setItem('camdelivery_arrival_alert_enabled', 'true'); } catch {}

      sendBrowserNotification({
        title: isKm ? '🔔 ដំណឹងមកដល់ (Arrival Alert) ត្រូវបានបើក!' : '🔔 Arrival Alert Active (< 500m Radius)!',
        body: isKm
          ? `អ្នកនឹងទទួលបានការជូនដំណឹងតាម Browser ភ្លាមៗពេលអ្នកដឹកស្ថិតនៅចម្ងាយក្រោម ៥០០ ម៉ែត្រពីទីតាំងទទួល #${currentShipment?.trackingNumber || ''}`
          : `You will be alerted instantly when the courier is within 500 meters of your destination for #${currentShipment?.trackingNumber || ''}`,
        tag: 'arrival-alert-active',
      });

      setScanToast(
        isKm
          ? '🔔 ដំណឹងមកដល់ត្រូវបានបើក! លោកអ្នកនឹងទទួលបានការជូនដំណឹងតាម Browser ពេលអ្នកដឹកចូលដល់ចម្ងាយ ៥០០ ម៉ែត្រ។'
          : '🔔 Arrival Alert active! Browser notification will trigger when courier is within 500m radius.'
      );
      setTimeout(() => setScanToast(null), 5000);
    } else {
      setIsArrivalAlertEnabled(false);
      try { localStorage.setItem('camdelivery_arrival_alert_enabled', 'false'); } catch {}
      setScanToast(
        isKm
          ? '🔕 ដំណឹងមកដល់ (Arrival Alert) ត្រូវបានបិទ។'
          : '🔕 Arrival Alert muted.'
      );
      setTimeout(() => setScanToast(null), 3000);
    }
  };

  const handleRescheduleDelivery = (
    newDateStr: string,
    newDateStrKm: string,
    timeSlotLabel: string,
    timeSlotLabelKm: string,
    reasonText: string
  ) => {
    if (!currentShipment) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedMilestone: TrackingMilestone = {
      time: nowTime,
      date: 'Today',
      status: 'Appointment Rescheduled',
      statusKm: 'បានកែសម្រួលកាលវិភាគដឹក',
      location: currentShipment.receiverCity,
      locationKm: currentShipment.receiverCityKm,
      description: `Delivery appointment rescheduled to ${newDateStr} [${timeSlotLabel}] - Reason: ${reasonText}`,
      descriptionKm: `កាលបរិច្ឆេទប្រគល់កញ្ចប់ត្រូវបានកែប្រែមក ${newDateStrKm} [${timeSlotLabelKm}] - មូលហេតុ៖ ${reasonText}`,
      completed: true,
      current: true,
    };

    const updated: TrackingItem = {
      ...currentShipment,
      estimatedDelivery: `${newDateStr} (${timeSlotLabel})`,
      estimatedDeliveryKm: `${newDateStrKm} (${timeSlotLabelKm})`,
      milestones: [
        ...currentShipment.milestones.map((m) => ({ ...m, current: false })),
        updatedMilestone,
      ],
    };

    setCurrentShipment(updated);
    if (onUpdateShipment) {
      onUpdateShipment(updated);
    }

    setScanToast(
      isKm
        ? `📅 កាលបរិច្ឆេទដឹកជញ្ជូនត្រូវបានកែប្រែជោគជ័យមក៖ ${newDateStrKm} (${timeSlotLabelKm})!`
        : `📅 Delivery appointment rescheduled successfully to ${newDateStr} (${timeSlotLabel})!`
    );
    setTimeout(() => setScanToast(null), 5000);
  };

  const handleReviewSubmitted = (review: DeliveryReview) => {
    if (!currentShipment) return;
    const updated: TrackingItem = {
      ...currentShipment,
      postDeliveryReview: review,
      driverRating: Math.round(((currentShipment.driverRating || 4.9) * 0.9 + review.rating * 0.1) * 10) / 10,
      driverRatingCount: (currentShipment.driverRatingCount || 120) + 1,
    };
    setCurrentShipment(updated);
    saveDeliveryReview(review);
    if (onUpdateShipment) {
      onUpdateShipment(updated);
    }
  };

  const handleUpdateSpecialInstructions = (instructions: string) => {
    if (!currentShipment) return;
    const updated: TrackingItem = {
      ...currentShipment,
      specialInstructions: instructions,
    };
    setCurrentShipment(updated);
    if (onUpdateShipment) {
      onUpdateShipment(updated);
    }
  };

  const handleMarkAsDelivered = () => {
    if (!currentShipment) return;
    handleStatusChange('delivered');
  };

  const handleStatusChange = (newStatus: TrackingItem['status']) => {
    if (!currentShipment) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let statusKm = currentShipment.statusKm;
    let simulatedProgress = 65;

    if (newStatus === 'picked_up') {
      statusKm = isKm ? 'បានទទួលកញ្ចប់ពីអ្នកផ្ញើ' : 'Package Picked Up';
      simulatedProgress = 25;
    } else if (newStatus === 'in_transit') {
      statusKm = isKm ? 'កំពុងធ្វើដំណើរលើផ្លូវជាតិ' : 'In Transit along Highway';
      simulatedProgress = 65;
    } else if (newStatus === 'out_for_delivery') {
      statusKm = isKm ? 'កំពុងចេញដឹកជញ្ជូនដល់ផ្ទះ' : 'Out for Delivery';
      simulatedProgress = 90;
    } else if (newStatus === 'delivered') {
      statusKm = isKm ? 'បានដឹកជញ្ជូនដល់' : 'Delivered';
      simulatedProgress = 100;
      recordCompletedShipmentPoints(
        currentShipment.trackingNumber,
        currentShipment.senderCity,
        currentShipment.receiverCity
      );
      setTimeout(() => {
        document.getElementById('delivery-rating-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }

    const updated: TrackingItem = {
      ...currentShipment,
      status: newStatus,
      statusKm,
      milestones: [
        ...currentShipment.milestones.map((m) => ({ ...m, current: false })),
        {
          time: nowTime,
          date: 'Today',
          status: newStatus === 'delivered' ? 'Delivered' : newStatus === 'out_for_delivery' ? 'Out for Delivery' : newStatus === 'in_transit' ? 'In Transit' : 'Package Picked Up',
          statusKm: statusKm,
          location: newStatus === 'delivered' 
            ? `${currentShipment.receiverCity} Destination Address` 
            : newStatus === 'out_for_delivery' 
            ? `${currentShipment.receiverCity} Local Station` 
            : `${currentShipment.senderCity} Highway Route`,
          locationKm: newStatus === 'delivered' 
            ? `អាសយដ្ឋានអ្នកទទួល ${currentShipment.receiverCityKm}` 
            : newStatus === 'out_for_delivery' 
            ? `សាខាចែកចាយ ${currentShipment.receiverCityKm}` 
            : 'ផ្លូវជាតិ',
          description: newStatus === 'delivered' 
            ? 'Package handed over and verified by recipient' 
            : newStatus === 'out_for_delivery' 
            ? 'Courier en route for final delivery' 
            : 'Vehicle moving along highway',
          descriptionKm: newStatus === 'delivered' 
            ? 'បានប្រគល់ជូនអ្នកទទួលរួចរាល់' 
            : newStatus === 'out_for_delivery' 
            ? 'អ្នកដឹកកំពុងចេញដឹកជូនដល់ផ្ទះ' 
            : 'រថយន្តកំពុងធ្វើដំណើរលើផ្លូវជាតិ',
          completed: true,
          current: newStatus !== 'delivered',
        }
      ]
    };
    setCurrentShipment(updated);
    setSimulatedVehicleProgress(simulatedProgress);
    if (onUpdateShipment) onUpdateShipment(updated);
  };

  const handleCourierVerificationCompleted = (record: CourierVerificationRecord) => {
    if (!currentShipment) return;
    const updated: TrackingItem = {
      ...currentShipment,
      isCourierVerified: true,
      courierVerificationData: record,
      driverBadge: 'Official ID Verified Courier',
      driverBadgeKm: 'អ្នកដឹកបានផ្ទៀងផ្ទាត់អត្តសញ្ញាណប័ណ្ណផ្លូវការ',
    };
    setCurrentShipment(updated);
    if (onUpdateShipment) {
      onUpdateShipment(updated);
    }
    setScanToast(
      isKm
        ? `🛡️ អត្តសញ្ញាណប័ណ្ណរបស់អ្នកដឹក ${record.driverName} ត្រូវបានផ្ទៀងផ្ទាត់ជោគជ័យ!`
        : `🛡️ Courier ${record.driverName} official ID successfully verified via device camera!`
    );
    setTimeout(() => setScanToast(null), 5000);
  };

  const handleSaveProofOfDelivery = (proof: ProofOfDeliveryRecord) => {
    if (!currentShipment) return;
    const updatedMilestones = [...currentShipment.milestones];
    const deliveredIdx = updatedMilestones.findIndex(m => m.status.toLowerCase().includes('deliver'));
    if (deliveredIdx >= 0) {
      updatedMilestones[deliveredIdx] = {
        ...updatedMilestones[deliveredIdx],
        description: `Delivered safely - Proof photo attached (${proof.location})`,
        descriptionKm: `បានប្រគល់ជូនអ្នកទទួលរួចរាល់ - មានភ្ជាប់រូបថតភស្តុតាង (${proof.locationKm})`,
      };
    }

    const updated: TrackingItem = {
      ...currentShipment,
      status: 'delivered',
      statusKm: isKm ? 'បានប្រគល់ជូនអ្នកទទួល' : 'Delivered to Recipient',
      proofOfDelivery: proof,
      milestones: updatedMilestones,
    };
    setCurrentShipment(updated);
    setSimulatedVehicleProgress(100);
    if (onUpdateShipment) {
      onUpdateShipment(updated);
    }
    setScanToast(
      isKm
        ? '📷 រូបថតភស្តុតាងប្រគល់ទំនិញត្រូវបានភ្ជាប់ក្នុង Timeline ជោគជ័យ!'
        : '📷 Proof of delivery photo successfully attached to the status timeline!'
    );
    setTimeout(() => setScanToast(null), 5000);
  };

  useEffect(() => {
    if (selectedTrackingNumber) {
      setSearchInput(selectedTrackingNumber);
      const match = activeShipments.find(s => s.trackingNumber.toLowerCase() === selectedTrackingNumber.toLowerCase());
      if (match) {
        setCurrentShipment(match);
        setComparisonCourierId(null);
      }
    } else if (activeShipments.length > 0 && !currentShipment) {
      setCurrentShipment(activeShipments[0]);
      setComparisonCourierId(null);
    }
  }, [selectedTrackingNumber, activeShipments]);

  // Handle Search
  const handleSearch = (codeToSearch?: string) => {
    const query = (codeToSearch || searchInput).trim().toLowerCase();
    const found = activeShipments.find(s => s.trackingNumber.toLowerCase() === query);
    if (found) {
      setCurrentShipment(found);
      setSimulatedVehicleProgress(found.status === 'delivered' ? 100 : found.status === 'out_for_delivery' ? 90 : 60);
    } else {
      // If not in preloaded list, create an active generic item for user's convenience
      const generated: TrackingItem = {
        trackingNumber: (codeToSearch || searchInput).toUpperCase(),
        carrierId: 'cam-van-express',
        carrierName: 'CamExpress Interprovincial Van',
        carrierNameKm: 'ខេមអេចប្រេស រថយន្តវ៉ែនអន្តរខេត្ត',
        brandColor: '#2563eb',
        logoBg: '#1e3a8a',
        serviceTitle: 'Interprovincial Van Express',
        serviceTitleKm: 'ឡានវ៉ែនអន្តរខេត្ត',
        senderName: 'Sok Meas',
        senderPhone: '012 345 678',
        senderCity: 'Phnom Penh',
        senderCityKm: 'រាជធានីភ្នំពេញ',
        receiverName: 'Keo Sophea',
        receiverPhone: '098 776 543',
        receiverCity: 'Siem Reap',
        receiverCityKm: 'ខេត្តសៀមរាប',
        weightKg: 1.5,
        packageType: 'Parcel Box',
        packageTypeKm: 'កញ្ចប់ទំនិញ',
        totalPriceKHR: 6000,
        totalPriceUSD: 1.5,
        codAmountKHR: 0,
        isCod: false,
        status: 'in_transit',
        statusKm: isKm ? 'កំពុងដឹកជញ្ជូនលើផ្លូវជាតិ' : 'In Transit along Highway',
        estimatedDelivery: 'Tomorrow Morning',
        estimatedDeliveryKm: 'ព្រឹកថ្ងៃស្អែក',
        dispatchedAt: new Date().toISOString(),
        estimatedSchedule: calculateEstimatedDeliverySchedule('cam-van-express', new Date().toISOString(), 'Phnom Penh', 'Siem Reap'),
        driverName: 'Chorn Ratanak',
        driverPhone: '012 998 877',
        driverVehicle: 'Toyota HiAce Transit Van',
        milestones: [
          {
            time: '09:00 AM',
            date: 'Today',
            status: 'Accepted at Hub',
            statusKm: 'ទទួលកញ្ចប់នៅសាខាដើមទី',
            location: 'Phnom Penh Hub',
            locationKm: 'សាខាភ្នំពេញ',
            description: 'Barcode registered into national network',
            descriptionKm: 'បានស្កេនបាកូដបញ្ចូលប្រព័ន្ធ',
            completed: true,
            current: false,
          },
          {
            time: '01:30 PM',
            date: 'Today',
            status: 'In Transit',
            statusKm: 'កំពុងធ្វើដំណើរឆ្លងកាត់ខេត្ត',
            location: 'Highway Transit',
            locationKm: 'កំពុងធ្វើដំណើរលើផ្លូវជាតិ',
            description: 'Van currently heading towards destination depot',
            descriptionKm: 'រថយន្តកំពុងធ្វើដំណើរឆ្ពោះទៅកាន់ខេត្តអ្នកទទួល',
            completed: true,
            current: true,
          },
        ],
        routeCoordinates: {
          start: { lat: 11.5564, lng: 104.9282, label: 'Phnom Penh' },
          current: { lat: 12.5, lng: 104.5, label: 'En-route' },
          end: { lat: 13.3671, lng: 103.8448, label: 'Siem Reap' },
        },
      };
      setCurrentShipment(generated);
      setSimulatedVehicleProgress(55);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleScanSuccess = (scannedCode: string) => {
    setSearchInput(scannedCode);
    setWasScannedViaCamera(true);
    handleSearch(scannedCode);
    setScanToast(
      isKm 
        ? `បានស្កេនបាកូដ #${scannedCode} ជោគជ័យតាមកាមេរ៉ា! ស្ថានភាពកញ្ចប់ត្រូវបានទាញយកភ្លាមៗ។` 
        : `Waybill #${scannedCode} scanned via Camera! Package status retrieved instantly.`
    );
    setTimeout(() => setScanToast(null), 5000);
    setTimeout(() => {
      document.getElementById('shipment-details-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleTogglePlayPause = () => {
    setIsLiveCourierMoving((prev) => !prev);
  };

  const handleIssueReportSubmitted = (issue: DeliveryIssueReport) => {
    setScanToast(
      isKm
        ? `⚠️ ពាក្យបណ្តឹង #${issue.ticketNumber} ត្រូវបានបញ្ជូនទៅកាន់ Dispatcher រួចរាល់!`
        : `⚠️ Issue ticket #${issue.ticketNumber} reported to dispatcher!`
    );
    setTimeout(() => setScanToast(null), 5000);
  };

  // Animated simulation for journey progress updating as courier moves along highway (respects Power Saver rate)
  useEffect(() => {
    if (currentShipment && currentShipment.status === 'in_transit' && isLiveCourierMoving) {
      const intervalMs = isPowerSaver ? 6000 : 1500;
      const progressStep = isPowerSaver ? 1.4 : 0.35;
      const interval = setInterval(() => {
        setSimulatedVehicleProgress((prev) => {
          if (prev >= 96) return 32;
          return Number((prev + progressStep).toFixed(2));
        });

        // Fluctuate speed slightly
        setLiveCourierSpeed((prev) => {
          const delta = (Math.random() - 0.5) * 4;
          return Math.round(Math.min(80, Math.max(55, prev + delta)));
        });
      }, intervalMs);
      return () => clearInterval(interval);
    }
  }, [currentShipment, isLiveCourierMoving, isPowerSaver]);

  // Compute calculated estimated delivery schedule based on courier type
  const activeSchedule: EstimatedDeliverySchedule | null = currentShipment
    ? (currentShipment.estimatedSchedule || calculateEstimatedDeliverySchedule(
        currentShipment.carrierId,
        currentShipment.dispatchedAt,
        currentShipment.senderCity,
        currentShipment.receiverCity
      ))
    : null;

  const displaySchedule: EstimatedDeliverySchedule | null = currentShipment && activeSchedule
    ? (comparisonCourierId
        ? calculateEstimatedDeliverySchedule(
            comparisonCourierId,
            currentShipment.dispatchedAt,
            currentShipment.senderCity,
            currentShipment.receiverCity
          )
        : activeSchedule)
    : null;

  // Dynamic Distance-Based ETA Calculator with Real-Time Traffic Approximation
  const dynamicEtaMetrics = useMemo(() => {
    if (!currentShipment) return null;
    const currentCoords = currentShipment.routeCoordinates.current;
    const destCoords = currentShipment.routeCoordinates.end;

    // Haversine direct distance
    const R = 6371; // km
    const dLat = (destCoords.lat - currentCoords.lat) * (Math.PI / 180);
    const dLon = (destCoords.lng - currentCoords.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(currentCoords.lat * (Math.PI / 180)) *
        Math.cos(destCoords.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const directKm = Math.round(R * c);
    // Cambodian road network factor ~1.28x
    const roadKm = Math.max(8, Math.round(directKm * 1.28));

    // Vehicle highway speed assumption
    const baseSpeed = currentShipment.status === 'out_for_delivery' ? 32 : 62; // km/h
    const baseTravelMinutes = Math.round((roadKm / baseSpeed) * 60);

    // Real-time Traffic Approximation Factor
    const trafficMultiplier =
      trafficFactor === 'peak'
        ? 1.55
        : trafficFactor === 'rain'
        ? 1.35
        : trafficFactor === 'moderate'
        ? 1.18
        : 1.0;

    const adjustedMinutes = Math.round(baseTravelMinutes * trafficMultiplier);
    const delayMinutes = Math.max(0, adjustedMinutes - baseTravelMinutes);

    const arrivalDate = new Date(Date.now() + adjustedMinutes * 60 * 1000);
    const arrivalTimeClock = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const hoursRemaining = Math.floor(adjustedMinutes / 60);
    const minsRemaining = adjustedMinutes % 60;

    return {
      roadKm,
      baseSpeed,
      trafficMultiplier,
      adjustedMinutes,
      delayMinutes,
      arrivalTimeClock,
      hoursRemaining,
      minsRemaining,
    };
  }, [currentShipment, trafficFactor]);

  // Filter completed deliveries for quick star-rating access
  const deliveredShipments = activeShipments.filter((s) => s.status === 'delivered');

  return (
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2 mb-0.5">
              <Search className="w-5 h-5 text-emerald-600" />
              <span>{isKm ? 'តាមដានកញ្ចប់ឥវ៉ាន់ទូទាំង ២៥ ខេត្ត-ក្រុង' : 'National Parcel Universal Tracking'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {isKm 
                ? 'បញ្ចូលលេខកូដតាមដានកញ្ចប់ឥវ៉ាន់ឯករាជ្យទូទាំង ២៥ រាជធានី-ខេត្ត (ឥតគិតថ្លៃ ១០០%)'
                : 'Enter parcel tracking code across all 25 provinces in Cambodia (100% Free Platform)'}
            </p>
          </div>

          {/* Notification Controls: 500m Arrival Alert Toggle & Browser Permission Chip */}
          <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* 500m Arrival Alert Browser Push Notification Toggle */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold border border-slate-700 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isArrivalAlertEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                {isArrivalAlertEnabled ? (
                  <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{isKm ? 'ដំណឹងមកដល់ (< ៥០០ម)' : 'Arrival Alert (< 500m)'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleArrivalAlert(!isArrivalAlertEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isArrivalAlertEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={isArrivalAlertEnabled}
                title={isKm ? 'បើក/បិទ ការជូនដំណឹងពេលអ្នកដឹកមកដល់ចម្ងាយក្រោម ៥០០ម' : 'Toggle 500m arrival browser push notification'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isArrivalAlertEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Browser Notification Permission Status Chip */}
            {browserPermission === 'granted' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKm ? 'ដំណឹង Browser៖ សកម្ម' : 'Browser Alerts: Active'}</span>
              </div>
            ) : browserPermission === 'denied' ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                <Bell className="w-3 h-3 text-slate-400" />
                <span>{isKm ? 'Browser បានបិទដំណឹង' : 'Browser Alerts: Blocked'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestBrowserPermission}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 text-[11px] font-bold border border-amber-300 transition shadow-2xs group cursor-pointer"
                title={isKm ? 'បើកការជូនដំណឹងពេលឥវ៉ាន់ចេញដឹក (Out-for-Delivery)' : 'Enable browser alerts for Out-for-Delivery status changes'}
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 group-hover:animate-bounce" />
                <span>{isKm ? 'បើកដំណឹង Browser' : 'Enable Browser Alerts'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input Box */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={isKm ? 'ឧទាហរណ៍៖ KH-VAN-882910, KH-DIR-492011, KH-PRI-77120...' : 'e.g. KH-VAN-882910, KH-DIR-492011, KH-PRI-77120...'}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-12 py-2.5 text-xs md:text-sm font-semibold text-slate-800 uppercase tracking-wide focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            {/* Inline Voice-to-Text Dictation Button */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <VoiceSearchButton
                language={language}
                onTranscript={(transcript) => {
                  setSearchInput(transcript);
                  handleSearch(transcript);
                }}
                onNotify={(msg) => {
                  setScanToast(msg);
                  setTimeout(() => setScanToast(null), 3000);
                }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs md:text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
          >
            <span>{isKm ? 'ស្វែងរក' : 'Track'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 sm:px-4 py-2.5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 hover:from-slate-800 hover:to-slate-800 active:scale-95 text-white text-xs md:text-sm font-black rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 border border-emerald-500/40 cursor-pointer group"
            title={isKm ? 'ស្កេន QR Code ឬ Barcode លើប័ណ្ណដឹកជញ្ជូនតាមកាមេរ៉ា' : 'Scan Physical Delivery Label QR Code or Barcode with Camera'}
          >
            <div className="relative">
              <QrCode className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              <Camera className="w-2.5 h-2.5 text-white absolute -bottom-1 -right-1 bg-slate-900 rounded-full" />
            </div>
            <span className="hidden sm:inline">{isKm ? 'ស្កេន QR ប័ណ្ណដឹក (Camera)' : 'Scan Delivery Label QR'}</span>
            <span className="sm:hidden">{isKm ? 'ស្កេន QR' : 'Scan QR'}</span>
          </button>
        </div>

        {/* Quick Sample Tracking Codes */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 flex-wrap text-xs">
          <span className="text-slate-400 text-[11px] font-medium">{isKm ? 'លេខសាកល្បង៖' : 'Quick samples:'}</span>
          {activeShipments.slice(0, 4).map((ship) => {
            const isDelivered = ship.status === 'delivered';
            const isSelected = currentShipment?.trackingNumber === ship.trackingNumber;
            return (
              <button
                key={ship.trackingNumber}
                type="button"
                onClick={() => {
                  setSearchInput(ship.trackingNumber);
                  handleSearch(ship.trackingNumber);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-2xs'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isDelivered && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                )}
                <span>{ship.trackingNumber}</span>
                {isDelivered && ship.postDeliveryReview && (
                  <span className="text-amber-500 font-mono text-[10px]">★{ship.postDeliveryReview.rating}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dedicated Completed Deliveries Quick-Selector & Star Rating Strip */}
        {deliveredShipments.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-dashed border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKm ? 'កញ្ចប់ដឹកដល់រួចរាល់' : 'Completed Deliveries'}</span>
                <span className="ml-0.5 bg-emerald-600 text-white rounded-full px-1.5 py-0.2 text-[9px] font-bold">
                  {deliveredShipments.length}
                </span>
              </span>
              <span className="text-[11px] text-slate-500 hidden md:inline">
                {isKm ? 'ចុចដើម្បីវាយតម្លៃផ្កាយ ផ្តល់មតិ ឬកែប្រែ' : 'Select a parcel to rate your delivery experience'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {deliveredShipments.map((deliv) => {
                const isSelected = currentShipment?.trackingNumber === deliv.trackingNumber;
                const review = deliv.postDeliveryReview;
                return (
                  <button
                    key={deliv.trackingNumber}
                    type="button"
                    onClick={() => {
                      setSearchInput(deliv.trackingNumber);
                      handleSearch(deliv.trackingNumber);
                      setTimeout(() => {
                        document.getElementById('delivery-rating-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 120);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-500/30'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                    }`}
                    title={
                      review
                        ? (isKm ? `បានវាយតម្លៃ ${review.rating} ផ្កាយ` : `Rated ${review.rating} stars`)
                        : (isKm ? 'ចុចដើម្បីវាយតម្លៃផ្កាយ' : 'Click to submit star rating')
                    }
                  >
                    <span>{deliv.trackingNumber}</span>
                    {review ? (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-white/20 text-amber-300' : 'bg-amber-100 text-amber-900 border border-amber-300/50'
                      }`}>
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>{review.rating}.0</span>
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded-md animate-pulse ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-400/90 text-slate-950 shadow-2xs'
                      }`}>
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>{isKm ? 'វាយតម្លៃ' : 'Rate'}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Delivery Label QR & Barcode Camera Scanner */}
      <TrackCameraScannerCard
        language={language}
        activeShipments={activeShipments}
        onScanSuccess={handleScanSuccess}
        onOpenFullModal={() => setIsScannerOpen(true)}
      />

      {/* Active Out-for-Delivery Visual Indicator Alert Banner */}
      {activeDeliveryAlert && (
        <OutForDeliveryAlertBanner
          notification={activeDeliveryAlert}
          language={language}
          onDismiss={() => setActiveDeliveryAlert(null)}
          onOpenChat={() => setIsChatOpen(true)}
          shipment={currentShipment}
        />
      )}

      {/* Real-Time Courier 500m Proximity Push Alert Banner */}
      {proximityAlert && (
        <ProximityArrivalAlertBanner
          notification={proximityAlert}
          language={language}
          onDismiss={() => setProximityAlert(null)}
          onOpenChat={() => setIsChatOpen(true)}
          shipment={currentShipment}
        />
      )}

      {/* Lightweight Visual Map Overlay for Active Shipments (Coordinates Path Projection) */}
      {currentShipment && (
        <ActiveShipmentPathOverlay
          shipments={activeShipments}
          currentShipment={currentShipment}
          language={language}
          currency={currency}
          onSelectShipment={(ship) => {
            setCurrentShipment(ship);
            setSearchInput(ship.trackingNumber);
          }}
          onOpenDriverProfile={() => setIsDriverProfileOpen(true)}
          onOpenChat={() => setIsChatOpen(true)}
        />
      )}

      {/* Real-Time Courier Proximity Push Alert Simulation Widget (< 500 Meters) */}
      {currentShipment && (
        <div id="proximity-radar-section" className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-4 sm:p-5 border border-emerald-500/50 shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-2xl bg-emerald-400 opacity-30 animate-ping" />
                <Navigation className="w-5 h-5 transform -rotate-45 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    {isKm ? 'ការជូនដំណឹងជំរុញតាមផ្កាយរណប (ចម្ងាយក្រោម ៥០០ម)' : 'Real-Time 500m Courier Proximity Alert'}
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                    {isKm ? 'Push Alert ស្វ័យប្រវត្ត' : 'Push Notification'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isKm
                    ? `អ្នកដឹកជញ្ជូន ${currentShipment.driverName || 'Rider'} ស្ថិតនៅចម្ងាយ ${courierDistanceMeters} ម៉ែត្រពីទីតាំងទទួល (${currentShipment.receiverCity})`
                    : `Driver ${currentShipment.driverName || 'Courier'} live distance: ${courierDistanceMeters}m from delivery address (${currentShipment.receiverCity})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              {/* Notification Toggle Control in Proximity Radar */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-xs">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isKm ? 'ដំណឹង Browser' : 'Browser Alert'}
                  </span>
                  <span className="text-xs font-black text-white flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isArrivalAlertEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                    {isArrivalAlertEnabled ? (isKm ? 'សកម្ម (Active)' : 'Active') : (isKm ? 'បិទ (Muted)' : 'Muted')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleArrivalAlert(!isArrivalAlertEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isArrivalAlertEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                  role="switch"
                  aria-checked={isArrivalAlertEnabled}
                  title={isKm ? 'បើក/បិទ ការជូនដំណឹងពេលអ្នកដឹកមកដល់ចម្ងាយក្រោម ៥០០ម' : 'Toggle 500m arrival browser push notification'}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isArrivalAlertEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSimulate500mProximityPush(450)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-950/40 transition flex items-center gap-2 cursor-pointer"
                title={isKm ? 'សាកល្បងដំណឹង Push ពេលអ្នកដឹកចូលដល់ចម្ងាយ ៤៥០ ម៉ែត្រ' : 'Simulate courier entering 500m proximity zone to test real-time push alert'}
              >
                <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>{isKm ? 'សាកល្បងដំណឹង (៤៥០ម)' : 'Test 500m Alert'}</span>
              </button>

              <div className="flex items-center bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold border border-slate-700">
                <button
                  type="button"
                  onClick={() => handleSimulate500mProximityPush(250)}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition"
                  title="250m"
                >
                  250m
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulate500mProximityPush(80)}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-700 text-emerald-400 font-black transition"
                  title="80m at door"
                >
                  80m
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top View Mode Switcher: Timeline vs Dynamic Map View vs Split */}
      {currentShipment && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setTrackingViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                trackingViewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>{isKm ? 'កាលវិភាគលម្អិត (Timeline)' : 'Timeline & Waybill'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTrackingViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                trackingViewMode === 'map'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isKm ? 'ទិដ្ឋភាពផែនទីផ្ទាល់ (Dynamic Map View)' : 'Dynamic Map View'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>

            <button
              type="button"
              onClick={() => setTrackingViewMode('split')}
              className={`px-3 py-1.5 rounded-lg transition items-center gap-1.5 cursor-pointer hidden md:flex ${
                trackingViewMode === 'split'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isKm ? 'ទិដ្ឋភាពភ្លោះ (Split View)' : 'Split View'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 text-xs text-slate-500 flex-wrap">
            {/* Quick Toggle for Past Route overlay */}
            <button
              type="button"
              onClick={() => setShowPastRoute(!showPastRoute)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                showPastRoute
                  ? 'bg-purple-50 text-purple-900 border-purple-300 shadow-2xs font-extrabold'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
              title={isKm ? 'បើក/បិទ បង្ហាញគន្លងផ្លូវបានកន្លងលើផែនទី' : 'Toggle Past Route overlay on map'}
            >
              <span className={`w-2 h-2 rounded-full ${showPastRoute ? 'bg-purple-600 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isKm ? 'ផ្លូវបានកន្លង' : 'Past Route'}</span>
            </button>

            {/* Quick Toggle for Power Saver Mode (Throttled Map Refresh & Polling) */}
            <button
              type="button"
              onClick={handleTogglePowerSaver}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isPowerSaver
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs font-extrabold'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
              title={
                isPowerSaver
                  ? (isKm ? 'ម៉ូដសន្សំថ្ម៖ បើក (Refresh ៦ វិនាទី) - ចុចដើម្បីបិទ' : 'Power Saver: Active (6.0s Refresh) - Click to disable')
                  : (isKm ? 'ម៉ូដសន្សំថ្ម៖ បិទ (Refresh ១.៥ វិនាទី) - ចុចដើម្បីបើក' : 'Power Saver: Off (1.5s Refresh) - Click to activate')
              }
            >
              <Battery className={`w-3.5 h-3.5 ${isPowerSaver ? 'text-emerald-600 fill-emerald-500/20' : 'text-slate-400'}`} />
              <span>{isKm ? 'សន្សំថ្ម' : 'Power Saver'}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-black ${
                isPowerSaver ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {isPowerSaver ? '6s' : '1.5s'}
              </span>
            </button>

            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-slate-800">
              #{currentShipment.trackingNumber}
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-600">
              {isKm ? currentShipment.senderCityKm : currentShipment.senderCity} ➔ {isKm ? currentShipment.receiverCityKm : currentShipment.receiverCity}
            </span>
          </div>
        </div>
      )}

      {/* DEDICATED FULL DYNAMIC MAP VIEW */}
      {currentShipment && trackingViewMode === 'map' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20 shrink-0">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-slate-900">
                      {isKm ? 'ផែនទីចល័តគន្លងផ្លូវដឹកជញ្ជូនជាក់ស្តែង' : 'Real-Time Courier Route Map'}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {isKm ? 'កំពុងផ្លាស់ទី' : 'Live Highway Tracking'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isKm
                      ? `បង្ហាញទីតាំងជាក់ស្តែងរបស់អ្នកដឹកជញ្ជូនធៀបនឹងទីតាំងទទួល ${currentShipment.receiverCityKm} និងចម្ងាយដែលនៅសល់`
                      : `Visualizing courier vehicle progression relative to destination ${currentShipment.receiverCity} with live spatial context`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {/* Past Route Toggle Button in Map View */}
                <button
                  type="button"
                  onClick={() => setShowPastRoute(!showPastRoute)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    showPastRoute
                      ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-2xs font-black'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={isKm ? 'បើក/បិទ បង្ហាញគន្លងផ្លូវបានកន្លង (Past Route Overlay)' : 'Toggle courier past route overlay on map'}
                >
                  <span className={`w-2 h-2 rounded-full ${showPastRoute ? 'bg-purple-600 animate-pulse' : 'bg-slate-400'}`} />
                  <span>{isKm ? 'ផ្លូវបានកន្លង (Past Route)' : 'Past Route'}</span>
                </button>

                {/* Power Saver Toggle in Map View */}
                <button
                  type="button"
                  onClick={handleTogglePowerSaver}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isPowerSaver
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs font-black'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={isKm ? 'បើក/បិទ ម៉ូដសន្សំថ្ម (Power Saver Mode)' : 'Toggle power saver mode for map refresh'}
                >
                  <Battery className={`w-3.5 h-3.5 ${isPowerSaver ? 'text-emerald-600 fill-emerald-500/20' : 'text-slate-400'}`} />
                  <span>{isKm ? 'សន្សំថ្ម' : 'Power Saver'}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isPowerSaver ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isPowerSaver ? '6.0s (-45%)' : '1.5s'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTrackingViewMode('timeline')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKm ? 'ប្តូរទៅកាលវិភាគ' : 'Switch to Timeline'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Leaflet Driver Live Map Component */}
            <DriverLiveMap
              shipment={currentShipment}
              language={language}
              onOpenDriverProfile={() => setIsDriverProfileOpen(true)}
              externalShowOptimized={isOptimizedRouteActive}
              onOptimizedChange={setIsOptimizedRouteActive}
              externalShowPastRoute={showPastRoute}
              onPastRouteChange={setShowPastRoute}
              onProgressUpdate={(pct, speed) => {
                setSimulatedVehicleProgress(pct);
                setLiveCourierSpeed(speed);
              }}
            />
          </div>
        </div>
      )}

      {currentShipment && trackingViewMode !== 'map' ? (
        <div id="shipment-details-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-24">
          {/* Main Tracking Details & Timeline (Left column) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Header Info Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              {/* Carrier Brand Accent Bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: currentShipment.brandColor }}
              />

              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                    style={{ backgroundColor: currentShipment.brandColor }}
                  >
                    {currentShipment.carrierId.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {isKm ? currentShipment.carrierNameKm : currentShipment.carrierName}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                        #{currentShipment.trackingNumber}
                      </div>
                      {wasScannedViaCamera && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>{isKm ? 'បានស្កេនតាមកាមេរ៉ា' : 'Scanned via Camera'}</span>
                        </span>
                      )}
                      {currentShipment.isCourierVerified ? (
                        <button
                          type="button"
                          onClick={() => setIsVerificationModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 text-emerald-800 border border-emerald-400 hover:bg-emerald-500/25 transition shadow-2xs cursor-pointer group"
                          title={isKm ? 'អ្នកដឹកជញ្ជូនបានស្កេនផ្ទៀងផ្ទាត់អត្តសញ្ញាណប័ណ្ណផ្លូវការ (ចុចមើលវិញ្ញាបនបត្រ)' : 'Courier ID Verified via Device Camera (Click to view certificate)'}
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600 group-hover:scale-110 transition" />
                          <span>{isKm ? 'អ្នកដឹកបានផ្ទៀងផ្ទាត់ (Verified)' : 'Verified Courier'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsVerificationModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition cursor-pointer"
                          title={isKm ? 'ចុចដើម្បីស្កេនអត្តសញ្ញាណប័ណ្ណអ្នកដឹក' : 'Scan ID to verify courier'}
                        >
                          <Camera className="w-3 h-3 text-amber-600" />
                          <span>{isKm ? 'ស្កេន ID អ្នកដឹក' : 'Verify Courier ID'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Quick Call Dispatcher Action Button */}
                  <a
                    href={`tel:${currentShipment.driverPhone || '+85512889001'}`}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm shadow-emerald-700/20 ring-1 ring-emerald-400/40"
                    title={
                      isKm
                        ? `ហៅទូរស័ព្ទទៅកាន់ Dispatcher / អ្នកដឹកជញ្ជូន (${currentShipment.driverPhone || '+855 12 889 001'})`
                        : `Quick Call Dispatcher (${currentShipment.driverPhone || '+855 12 889 001'})`
                    }
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span>{isKm ? 'ហៅ Dispatcher' : 'Quick Call Dispatcher'}</span>
                  </a>

                  {/* Scan Physical Delivery Label QR Button */}
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs border border-slate-700 cursor-pointer"
                    title={isKm ? 'ស្កេនបាកូដ ឬ QR Code លើប័ណ្ណដឹកជញ្ជូនតាមកាមេរ៉ា' : 'Scan physical delivery label QR with camera'}
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isKm ? 'ស្កេន QR' : 'Scan Label QR'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeliveryLabelOpen(true)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                    title={isKm ? 'បង្កើត ឬបោះពុម្ពប័ណ្ណដឹកជញ្ជូន (PDF)' : 'Generate Printable Delivery Label (PDF)'}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isKm ? 'ប័ណ្ណដឹកទំនិញ (PDF)' : 'Delivery Label (PDF)'}</span>
                  </button>

                  {currentShipment.status === 'delivered' && (
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(true)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      title={isKm ? 'វាយតម្លៃបទពិសោធន៍អ្នកដឹកជញ្ជូន' : 'Rate & review courier experience'}
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>
                        {currentShipment.postDeliveryReview
                          ? `${currentShipment.postDeliveryReview.rating}.0 ★ (${isKm ? 'កែសម្រួល' : 'Edit'})`
                          : (isKm ? 'វាយតម្លៃអ្នកដឹក' : 'Rate Courier')}
                      </span>
                    </button>
                  )}

                  {/* Historical Traffic Route Optimization Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isOptimizedRouteActive;
                      setIsOptimizedRouteActive(nextState);
                      if (nextState) {
                        setScanToast(
                          isKm
                            ? '⚡ គន្លងផ្លូវវាងកាត់បន្ថយការស្ទះត្រូវបានបង្ហាញលើផែនទី! (សន្សំសំចៃពេល ~៥៥ នាទី)'
                            : '⚡ Historical traffic optimized route overlay active! Potential time savings: ~55 mins.'
                        );
                        setTimeout(() => setScanToast(null), 5000);
                      }
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
                      isOptimizedRouteActive
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-cyan-400 shadow-cyan-900/30 ring-1 ring-cyan-300'
                        : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-200'
                    }`}
                    title={
                      isKm
                        ? 'គណនាគន្លងផ្លូវកាត់បន្ថយការកកស្ទះ និងសន្សំសំចៃពេល ~៥៥ នាទីផ្អែកលើទិន្នន័យចរាចរណ៍'
                        : 'Fetch & overlay traffic-optimized route suggesting ~55 min time savings'
                    }
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                    <span>{isOptimizedRouteActive ? (isKm ? '⚡ ផ្លូវវាងឆ្លាតវៃ (បើក)' : '⚡ Route Optimized') : (isKm ? '⚡ គណនាផ្លូវវាងស្ទះ' : '⚡ Optimize Route')}</span>
                    {isOptimizedRouteActive && (
                      <span className="bg-cyan-950/80 text-cyan-200 text-[9px] px-1 py-0.2 rounded-xs font-mono font-bold">
                        -55m
                      </span>
                    )}
                  </button>

                  {/* Reschedule Delivery Appointment Action Button (Eligible for Pending or In Transit) */}
                  {(currentShipment.status === 'pending' || currentShipment.status === 'in_transit' || currentShipment.status === 'scheduled') && (
                    <button
                      type="button"
                      onClick={() => setIsRescheduleModalOpen(true)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-900 border border-indigo-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title={isKm ? 'កែសម្រួលកាលបរិច្ឆេទ និងចន្លោះពេលទទួលកញ្ចប់' : 'Reschedule delivery appointment date and time-slot'}
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isKm ? 'ប្តូរកាលបរិច្ឆេទដឹក' : 'Reschedule Delivery'}</span>
                    </button>
                  )}

                  {/* Save to Calendar Action Button */}
                  <button
                    type="button"
                    onClick={() => setIsCalendarModalOpen(true)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-800 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title={isKm ? 'រក្សាទុកកាលបរិច្ឆេទ & ម៉ោងមកដល់ក្នុងប្រតិទិន (Apple / Google / ICS)' : 'Save estimated delivery time to Calendar (Apple, Google, ICS)'}
                  >
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    <span>{isKm ? 'ប្រតិទិន (Calendar)' : 'Save to Calendar'}</span>
                  </button>

                  {/* Share Tracking Button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-800 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title={isKm ? 'ចែករំលែកតំណភ្ជាប់តាមដានកញ្ចប់ ឬផ្ញើសារស្ថានភាពតាម SMS/Social' : 'Share Tracking Deep Link & Status via SMS/Social'}
                  >
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isKm ? 'ចែករំលែក (Share)' : 'Share Tracking'}</span>
                  </button>
                </div>
              </div>

              {/* Status Banner with Delivered Simulation & Post-Delivery Review Actions */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        currentShipment.status === 'delivered' 
                          ? 'bg-emerald-400' 
                          : currentShipment.status === 'out_for_delivery' 
                          ? 'bg-amber-400' 
                          : 'bg-blue-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        currentShipment.status === 'delivered' 
                          ? 'bg-emerald-500' 
                          : currentShipment.status === 'out_for_delivery' 
                          ? 'bg-amber-500' 
                          : 'bg-blue-500'
                      }`}></span>
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {isKm ? currentShipment.statusKm : currentShipment.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {currentShipment.status === 'out_for_delivery' && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md shadow-2xs">
                        {isKm ? 'កំពុងចេញដឹក' : 'Out for Delivery'}
                      </span>
                    )}

                    {/* Dynamic Real-Time Estimated Arrival Time (ETA) Distance Calculator */}
                    <EtaDistanceCalculator
                      shipment={currentShipment}
                      language={language}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {currentShipment.status === 'delivered'
                      ? (isKm ? 'បានប្រគល់ជូនអ្នកទទួលរួចរាល់' : 'Delivered directly to recipient')
                      : currentShipment.status === 'out_for_delivery'
                      ? (isKm 
                          ? `អ្នកដឹក ${currentShipment.driverName || 'Rider'} កំពុងធ្វើដំណើរចេញដឹកជូនអ្នកដល់ផ្ទះ` 
                          : `Driver ${currentShipment.driverName || 'Rider'} is en route for final doorstep delivery`)
                      : (
                        <>
                          {isKm ? 'កាលបរិច្ឆេទ & ម៉ោងមកដល់៖ ' : 'Estimated Arrival: '}
                          <strong className="text-slate-800 font-bold">
                            {activeSchedule
                              ? (isKm 
                                  ? `${activeSchedule.formattedDateKm} (${activeSchedule.formattedTimeWindowKm})`
                                  : `${activeSchedule.formattedDate} (${activeSchedule.formattedTimeWindow})`)
                              : (isKm ? currentShipment.estimatedDeliveryKm : currentShipment.estimatedDelivery)}
                          </strong>
                        </>
                      )}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Transition trigger: In-Transit -> Out-for-Delivery */}
                  {currentShipment.status === 'in_transit' && (
                    <button
                      type="button"
                      onClick={handleSimulateOutForDelivery}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 text-[11px] font-bold border border-amber-300 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title={isKm ? 'សាកល្បងប្តូរស្ថានភាពជា កំពុងចេញដឹក ដើម្បីពិនិត្យការជូនដំណឹង' : 'Simulate status change from In-Transit to Out-for-Delivery to test notifications'}
                    >
                      <Truck className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>{isKm ? 'ប្តូរជា ចេញដឹក (Test Alert)' : 'Simulate Out-for-Delivery'}</span>
                    </button>
                  )}

                  {/* Reset trigger: Out-for-Delivery -> In-Transit */}
                  {currentShipment.status === 'out_for_delivery' && (
                    <button
                      type="button"
                      onClick={handleResetToInTransit}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-[11px] font-bold border border-slate-300 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title={isKm ? 'កំណត់ស្ថានភាពត្រឡប់មក In-Transit ដើម្បីសាកល្បងការជូនដំណឹងម្តងទៀត' : 'Reset status back to In-Transit to test again'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isKm ? 'កំណត់ឡើងវិញ (In-Transit)' : 'Reset to In-Transit'}</span>
                    </button>
                  )}

                  {currentShipment.status !== 'delivered' && (
                    <button
                      type="button"
                      onClick={handleMarkAsDelivered}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-300/80 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title={isKm ? 'សាកល្បងប្តូរស្ថានភាពជា Delivered និងវាយតម្លៃអ្នកដឹក' : 'Simulate delivery and open review'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isKm ? 'ប្តូរជា បានដឹកដល់' : 'Mark Delivered'}</span>
                    </button>
                  )}

                  {currentShipment.status === 'delivered' && (
                    <button
                      type="button"
                      onClick={() => setIsProofModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      title={isKm ? 'ថត ឬពិនិត្យមើលរូបថតភស្តុតាងប្រគល់ទំនិញ' : 'Take or view proof of delivery photo'}
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {currentShipment.proofOfDelivery
                          ? (isKm ? 'រូបថតប្រគល់ (POD)' : 'View Proof Photo')
                          : (isKm ? 'ថតរូបប្រគល់ (POD)' : 'Add Proof Photo')}
                      </span>
                    </button>
                  )}

                  <div className="text-right pl-2 border-l border-slate-200">
                    <div className="text-xs font-bold text-slate-900">
                      {currentShipment.weightKg} kg
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isKm ? currentShipment.packageTypeKm : currentShipment.packageType}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated Star-Rating & Experience Feedback System (for Completed Deliveries) */}
              {currentShipment.status === 'delivered' && (
                <DeliveryStarRatingCard
                  shipment={currentShipment}
                  language={language}
                  onRatingSubmit={handleReviewSubmitted}
                  onOpenDetailedReviewModal={() => setIsReviewModalOpen(true)}
                  className="mt-3.5"
                />
              )}

              {/* Origin -> Destination route snippet */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">{isKm ? 'ទីតាំងផ្ញើ' : 'From'}</span>
                  <span className="font-bold text-slate-800">{isKm ? currentShipment.senderCityKm : currentShipment.senderCity}</span>
                  <span className="block text-[11px] text-slate-500 truncate">{currentShipment.senderName} ({currentShipment.senderPhone})</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">{isKm ? 'ទីតាំងទទួល' : 'To'}</span>
                  <span className="font-bold text-slate-800">{isKm ? currentShipment.receiverCityKm : currentShipment.receiverCity}</span>
                  <span className="block text-[11px] text-slate-500 truncate">{currentShipment.receiverName} ({currentShipment.receiverPhone})</span>
                </div>
              </div>

              {/* COD amount if applicable */}
              {currentShipment.isCod && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>{isKm ? 'ប្រាក់ប្រមូលជំនួស (COD)' : 'Cash On Delivery'}</span>
                  </div>
                  <span className="font-black text-amber-800">
                    {currency === 'KHR'
                      ? `${currentShipment.codAmountKHR.toLocaleString()} ៛`
                      : `$${(currentShipment.codAmountKHR / 4100).toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>

            {/* Real-Time Courier Location Weather (Open Weather API Check) Alongside Status Timeline */}
            <div className="mt-4">
              <CourierWeatherBadge
                lat={currentShipment.routeCoordinates.current?.lat || 11.5564}
                lng={currentShipment.routeCoordinates.current?.lng || 104.9282}
                locationLabel={currentShipment.routeCoordinates.current?.label || currentShipment.senderCity}
                locationLabelKm={currentShipment.senderCityKm}
                language={language}
              />
            </div>

            {/* Visual Step-by-Step Progress Timeline ('Picked Up', 'In Transit', 'Out for Delivery', 'Delivered') with Timestamps */}
            <ShipmentProgressTimeline
              shipment={currentShipment}
              language={language}
              estimatedArrivalClock={dynamicEtaMetrics?.arrivalTimeClock}
              className="mt-3"
              onOpenProofModal={() => setIsProofModalOpen(true)}
            />

            {/* Visual Route Distance Progress Bar beneath delivery status timeline indicating journey completion percentage based on route distance */}
            <JourneyDistanceProgressBar
              shipment={currentShipment}
              language={language}
              progressPct={simulatedVehicleProgress}
              currentSpeedKmH={liveCourierSpeed}
              isLiveMoving={isLiveCourierMoving}
              onTogglePlayPause={handleTogglePlayPause}
              className="mt-4"
            />

            {/* Special Delivery Instructions Input Card (e.g., 'leave at gate', 'call upon arrival') */}
            <SpecialDeliveryInstructionsCard
              shipment={currentShipment}
              language={language}
              onUpdateInstructions={handleUpdateSpecialInstructions}
              className="mt-4"
            />

            {/* Estimated Delivery Time Calculation Card with Live Ticking Countdown based on Shipment Distance & Courier Status */}
            <EstimatedDeliveryCountdownCard
              shipment={currentShipment}
              language={language}
              onSimulateStatus={handleStatusChange}
              onSaveToCalendar={() => setIsCalendarModalOpen(true)}
              className="mt-4"
            />

            {/* Delivery Appointment Reschedule Card with Date-Picker & Time-Slot Selector (Active for Pending & In-Transit) */}
            <DeliveryRescheduleCard
              shipment={currentShipment}
              language={language}
              onConfirmReschedule={handleRescheduleDelivery}
              className="mt-4"
            />

            {/* Comprehensive Estimated Delivery Date & Time (Courier Speed Profile) Card */}
            {displaySchedule && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md relative overflow-hidden">
                {/* Decorative Subtle Glow */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Card Title Bar */}
                <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                      <Timer className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{isKm ? 'កាលបរិច្ឆេទ & ពេលវេលាមកដល់ប៉ាន់ស្មាន' : 'Estimated Delivery Schedule'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                          {isKm ? 'គណនាតាមប្រភេទសេវា' : 'Courier Tier ETA'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {isKm 
                          ? 'គណនាស្វ័យប្រវត្តផ្អែកលើបណ្តាញដឹក និងកាលវិភាគបញ្ជូនរបស់ក្រុមហ៊ុន' 
                          : 'Calculated dynamically from courier speed tier and dispatch cutoff'}
                      </p>
                    </div>
                  </div>

                  {comparisonCourierId && (
                    <button
                      type="button"
                      onClick={() => setComparisonCourierId(null)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-semibold transition shrink-0"
                    >
                      {isKm ? 'ត្រឡប់ទៅក្រុមហ៊ុនដើម' : 'Reset Original'}
                    </button>
                  )}
                </div>

                {/* Main Prominent Schedule Display Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 mb-3.5 backdrop-blur-xs relative z-10">
                  {/* Target Delivery Date */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        {isKm ? 'កាលបរិច្ឆេទមកដល់ (Delivery Date)' : 'Target Delivery Date'}
                      </span>
                      <div className="text-sm md:text-base font-extrabold text-white mt-0.5 leading-snug">
                        {isKm ? displaySchedule.formattedDateKm : displaySchedule.formattedDate}
                      </div>
                      <div className="text-[11px] text-blue-300 font-medium">
                        {isKm ? displaySchedule.courierTypeLabelKm : displaySchedule.courierTypeLabel}
                      </div>
                    </div>
                  </div>

                  {/* Target Time Window */}
                  <div className="flex items-start gap-3 sm:border-l sm:border-slate-700/80 sm:pl-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        {isKm ? 'ចន្លោះម៉ោងដឹកជញ្ជូន (Time Window)' : 'Delivery Time Window'}
                      </span>
                      <div className="text-sm md:text-base font-extrabold text-amber-300 mt-0.5 leading-snug">
                        {isKm ? displaySchedule.formattedTimeWindowKm : displaySchedule.formattedTimeWindow}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isKm 
                          ? `រយៈពេលដំណើរការសរុប៖ ~${displaySchedule.transitDurationHours} ម៉ោង` 
                          : `Total Calculated Transit: ~${displaySchedule.transitDurationHours} hrs`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Speed Tier & Countdown Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300">
                      <strong className="text-white font-bold">
                        {isKm ? displaySchedule.courierTypeLabelKm : displaySchedule.courierTypeLabel}
                      </strong>
                    </span>
                  </div>
                  <div>
                    {currentShipment.status === 'delivered' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px]">
                        {isKm ? 'បានចែកជូនជោគជ័យ' : 'Delivered Successfully'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>
                          {isKm 
                            ? `នៅសល់ប្រហែល ${displaySchedule.hoursRemaining} ម៉ោងទៀត` 
                            : `Est. ~${displaySchedule.hoursRemaining}h remaining`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Operating Schedule & Cutoff Notice */}
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-start gap-2.5 text-[11px] text-slate-300 mb-3 relative z-10">
                  <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      {isKm ? 'គោលការណ៍កាលវិភាគ & ឃ្លាំងចែកចាយ' : 'Logistics Schedule & Hub Cutoff Rule'}
                    </strong>
                    <span>
                      {isKm ? displaySchedule.dispatchCutoffNoticeKm : displaySchedule.dispatchCutoffNotice}
                    </span>
                  </div>
                </div>

                {/* Interactive Courier Type Simulator / Comparison */}
                <div className="pt-3 border-t border-slate-800 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isKm ? 'ប្រៀបធៀបពេលវេលាមកដល់តាមក្រុមហ៊ុនផ្សេងៗ' : 'Compare ETA by Courier Type'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isKm ? 'ចុចដើម្បីពិនិត្យមើលការគណនា' : 'Select courier to compare ETA'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'cam-van-express', name: 'CamExpress Van', nameKm: 'ឡានវ៉ែន', speedKm: 'ឡានវ៉ែន (~6-8h)', speedEn: 'Van (~6-8h)' },
                      { id: 'cam-door-express', name: 'CamDirect Door', nameKm: 'ដល់ផ្ទះ', speedKm: 'ដល់ផ្ទះ (~24h)', speedEn: 'Door (~24h)' },
                      { id: 'cam-priority-express', name: 'CamPriority Air', nameKm: 'អាទិភាព', speedKm: 'ព្រឹកស្អែក (~20h)', speedEn: 'Morning (~20h)' },
                      { id: 'cam-cold-chain', name: 'CamCold Fresh', nameKm: 'ទូត្រជាក់', speedKm: 'ទូត្រជាក់ (~8h)', speedEn: 'Cold (~8h)' },
                      { id: 'cam-postal-express', name: 'CamPostal Post', nameKm: 'ប្រៃសណីយ៍', speedKm: 'ប្រៃសណីយ៍ (~36h)', speedEn: 'Postal (~36h)' },
                    ].map((c) => {
                      const isSelected = (comparisonCourierId || currentShipment.carrierId) === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setComparisonCourierId(c.id)}
                          className={`p-2 rounded-xl text-left border transition relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? 'bg-rose-500/20 border-rose-500 text-white shadow-xs'
                              : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[11px] truncate">
                              {isKm ? c.nameKm : c.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {isKm ? c.speedKm : c.speedEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step Milestones Timeline */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-600" />
                <span>{isKm ? 'ដំណាក់កាលដឹកជញ្ជូន (Milestone Timeline)' : 'Shipping Milestones'}</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {currentShipment.milestones.map((step, sidx) => (
                  <div key={sidx} className="relative group">
                    {/* Circle Indicator */}
                    <div 
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition ${
                        step.current 
                          ? 'border-rose-600 ring-4 ring-rose-100' 
                          : step.completed 
                          ? 'border-emerald-600 bg-emerald-600' 
                          : 'border-slate-300'
                      }`}
                    >
                      {step.completed && !step.current && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                      {step.current && (
                        <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
                      )}
                    </div>

                    {/* Milestone Content */}
                    <div className="flex flex-col">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-xs font-bold ${step.current ? 'text-rose-600' : step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                          {isKm ? step.statusKm : step.status}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {step.date}, {step.time}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-700 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{isKm ? step.locationKm : step.location}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {isKm ? step.descriptionKm : step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier Profile View Component: Displays Courier Rating, Total Deliveries Completed, and 'Report Issue' Button */}
            <CourierProfileView
              shipment={currentShipment}
              language={language}
              onOpenChat={() => setIsChatOpen(true)}
              onOpenVerification={() => setIsVerificationModalOpen(true)}
              onOpenFullProfile={() => setIsDriverProfileOpen(true)}
              onReportIssueSubmitted={handleIssueReportSubmitted}
              className="mt-4"
            />
          </div>

          {/* Interactive Leaflet Map & Live GPS Route (Right column) */}
          <div className="lg:col-span-5 space-y-4">
            <DriverLiveMap
              shipment={currentShipment}
              language={language}
              onOpenDriverProfile={() => setIsDriverProfileOpen(true)}
              externalShowOptimized={isOptimizedRouteActive}
              onOptimizedChange={setIsOptimizedRouteActive}
              externalShowPastRoute={showPastRoute}
              onPastRouteChange={setShowPastRoute}
              onProgressUpdate={(pct, speed) => {
                setSimulatedVehicleProgress(pct);
                setLiveCourierSpeed(speed);
              }}
            />

            {/* Real-time Courier Live Messenger & Delivery Instructions via Mock Socket */}
            <CourierLiveSocketMessenger
              shipment={currentShipment}
              language={language}
              onCallDriver={() => {
                if (currentShipment.driverPhone) window.location.href = `tel:${currentShipment.driverPhone}`;
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{isKm ? 'រកមិនឃើញកញ្ចប់ឥវ៉ាន់ទេ' : 'No Shipment Found'}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isKm ? 'សូមពិនិត្យមើលលេខកូដតាមដាន ឬបើកកាមេរ៉ាស្កេនបាកូដ/QR លើប័ណ្ណដឹកជញ្ជូន' : 'Please check your tracking code or scan the waybill barcode/QR code with your camera.'}
          </p>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-700/25 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-200" />
            <Camera className="w-3.5 h-3.5 text-white" />
            <span>{isKm ? 'បើកកាមេរ៉ាស្កេនប័ណ្ណដឹកជញ្ជូន (QR / Barcode)' : 'Scan Physical Delivery Label (Camera QR)'}</span>
          </button>
        </div>
      )}

      {/* Floating Scan Success Toast */}
      {scanToast && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 max-w-md w-[90%]">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-xs font-medium leading-tight">
            {scanToast}
          </div>
        </div>
      )}

      {/* Waybill QR / Barcode Scanner Modal */}
      <WaybillQRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        language={language}
        activeShipments={activeShipments}
      />

      {/* Floating Quick Action Group: Quick Call Dispatcher & Driver Live Chat */}
      {currentShipment && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex items-center gap-2">
          {/* Quick Call Dispatcher Floating Dialer Button */}
          <a
            href={`tel:${currentShipment.driverPhone || '+85512889001'}`}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white p-3 sm:px-4 sm:py-3 rounded-2xl shadow-xl shadow-emerald-950/40 border border-emerald-400/40 flex items-center gap-2 group transition"
            title={
              isKm
                ? `ហៅទូរស័ព្ទទៅកាន់ Dispatcher (${currentShipment.driverPhone || '+855 12 889 001'})`
                : `Quick Call Dispatcher (${currentShipment.driverPhone || '+855 12 889 001'})`
            }
          >
            <div className="relative">
              <PhoneCall className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-emerald-700" />
            </div>
            <div className="flex flex-col text-left leading-tight hidden sm:flex">
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                {isKm ? 'ហៅទូរស័ព្ទផ្ទាល់' : 'Instant Dialer'}
              </span>
              <span className="text-xs font-black">
                {isKm ? 'ហៅ Dispatcher' : 'Quick Call Dispatcher'}
              </span>
            </div>
          </a>

          {/* Floating Real-Time Courier Chat Button for Delivery Instructions */}
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-850 hover:to-indigo-900 active:scale-95 text-white p-3 sm:px-4 sm:py-3 rounded-2xl shadow-2xl border border-indigo-500/50 flex items-center gap-2.5 group transition cursor-pointer ring-2 ring-indigo-500/20"
            title={
              isKm
                ? `ឆាតផ្ទាល់ជាមួយអ្នកដឹកជញ្ជូន (${currentShipment.driverName || 'Courier'}) អំពីការណែនាំទីតាំង និងការប្រគល់ឥវ៉ាន់`
                : `Open real-time messaging with courier (${currentShipment.driverName || 'Courier'}) for delivery instructions`
            }
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5 text-indigo-300 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>
            <div className="flex flex-col text-left leading-tight hidden sm:flex">
              <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <span>{isKm ? 'ឆាតជាមួយអ្នកដឹក' : 'Chat with Courier'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-black text-white">
                {isKm ? 'ផ្ញើការណែនាំទីតាំង' : 'Delivery Instructions'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Driver Live Chat Modal Interface for Delivery Instructions */}
      {currentShipment && (
        <DriverChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          shipment={currentShipment}
          language={language}
        />
      )}

      {/* Proof of Delivery Photo Capture Modal */}
      {currentShipment && (
        <ProofOfDeliveryModal
          isOpen={isProofModalOpen}
          onClose={() => setIsProofModalOpen(false)}
          shipment={currentShipment}
          language={language}
          onSaveProof={handleSaveProofOfDelivery}
        />
      )}

      {/* Driver Profile & Star Ratings Modal */}
      {currentShipment && (
        <DriverProfileModal
          isOpen={isDriverProfileOpen}
          onClose={() => setIsDriverProfileOpen(false)}
          shipment={currentShipment}
          language={language}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenVerification={() => setIsVerificationModalOpen(true)}
        />
      )}

      {/* Courier ID Verification Modal (Camera Document Scanner) */}
      {currentShipment && (
        <CourierVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          shipment={currentShipment}
          language={language}
          onVerificationComplete={handleCourierVerificationCompleted}
        />
      )}

      {/* Post-Delivery Driver Review Modal */}
      {currentShipment && isReviewModalOpen && (
        <PostDeliveryReviewModal
          shipment={currentShipment}
          language={language}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmitReview={handleReviewSubmitted}
        />
      )}

      {/* Printable / Shareable PDF Delivery Waybill Label Modal */}
      {currentShipment && (
        <DeliveryLabelModal
          isOpen={isDeliveryLabelOpen}
          onClose={() => setIsDeliveryLabelOpen(false)}
          shipment={currentShipment}
          language={language}
          currency={currency}
          onNotify={(msg) => {
            setScanToast(msg);
            setTimeout(() => setScanToast(null), 3000);
          }}
        />
      )}

      {/* Share Tracking Modal (Generates Deep Link, QR Code, and SMS/Social Shareable Status Messages) */}
      {currentShipment && (
        <ShareTrackingModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shipment={currentShipment}
          language={language}
        />
      )}

      {/* Save to Calendar Reminder Modal (Triggers ICS File Download & Google/Outlook 1-Click Reminder Integration) */}
      {currentShipment && (
        <CalendarReminderModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          shipment={currentShipment}
          language={language}
          targetArrivalDate={dynamicEtaMetrics ? new Date(Date.now() + dynamicEtaMetrics.adjustedMinutes * 60000) : undefined}
        />
      )}

      {/* Reschedule Delivery Appointment Modal (Date-Picker & Time-Slot Selector) */}
      {currentShipment && (
        <RescheduleDeliveryModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          shipment={currentShipment}
          language={language}
          onConfirmReschedule={handleRescheduleDelivery}
        />
      )}
    </div>
  );
};
