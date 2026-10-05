export type Language = 'km' | 'en';
export type Currency = 'KHR' | 'USD';

export type ServiceType = 'courier' | 'food' | 'ride' | 'instant';

export interface CarrierCompany {
  id: string;
  name: string;
  nameKm: string;
  type: ServiceType[];
  logoBg: string;
  logoTextColor: string;
  brandColor: string;
  tagline: string;
  taglineKm: string;
  rating: number;
  completedDeliveries: string;
  supportsCOD: boolean;
  provincesCoverage: number; // e.g. 25
  contactPhone: string;
  website: string;
}

export interface CourierQuote {
  id: string;
  carrierId: string;
  carrierName: string;
  carrierNameKm: string;
  logoBg: string;
  brandColor: string;
  serviceType: string;
  serviceTypeKm: string;
  estimatedTransitTime: string;
  estimatedTransitTimeKm: string;
  priceKHR: number;
  priceUSD: number;
  pickupMethod: 'door_pickup' | 'drop_off_hub';
  pickupMethodKm: string;
  deliveryMethod: 'door_delivery' | 'station_pickup';
  deliveryMethodKm: string;
  codFeeKHR: number;
  features: string[];
  featuresKm: string[];
}

export interface TrackingMilestone {
  time: string;
  date: string;
  status: string;
  statusKm: string;
  location: string;
  locationKm: string;
  description: string;
  descriptionKm: string;
  completed: boolean;
  current: boolean;
}

export type CourierSpeedTier = 
  | 'same_day_van' 
  | 'door_to_door_standard' 
  | 'priority_ecommerce' 
  | 'postal_ems' 
  | 'bulk_freight' 
  | 'instant_express';

export interface EstimatedDeliverySchedule {
  dispatchedAtISO: string;
  estimatedArrivalISO: string;
  formattedDate: string;
  formattedDateKm: string;
  formattedTimeWindow: string;
  formattedTimeWindowKm: string;
  transitDurationHours: number;
  courierSpeedTier: CourierSpeedTier;
  courierTypeLabel: string;
  courierTypeLabelKm: string;
  dispatchCutoffNotice: string;
  dispatchCutoffNoticeKm: string;
  hoursRemaining?: number;
}

export interface TrackingItem {
  trackingNumber: string;
  carrierId: string;
  carrierName: string;
  carrierNameKm: string;
  brandColor: string;
  logoBg: string;
  serviceTitle: string;
  serviceTitleKm: string;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderCityKm: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity: string;
  receiverCityKm: string;
  weightKg: number;
  packageType: string;
  packageTypeKm: string;
  totalPriceKHR: number;
  totalPriceUSD: number;
  codAmountKHR: number;
  isCod: boolean;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'scheduled';
  statusKm: string;
  estimatedDelivery: string;
  estimatedDeliveryKm: string;
  estimatedSchedule?: EstimatedDeliverySchedule;
  dispatchedAt?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  driverPlate?: string;
  driverRating?: number;
  driverRatingCount?: number;
  driverDeliveriesCount?: number;
  driverJoinedYear?: string;
  driverBadge?: string;
  driverBadgeKm?: string;
  driverBio?: string;
  driverBioKm?: string;
  isCourierVerified?: boolean;
  courierVerificationData?: CourierVerificationRecord;
  milestones: TrackingMilestone[];
  routeCoordinates: {
    start: { lat: number; lng: number; label: string };
    current: { lat: number; lng: number; label: string };
    end: { lat: number; lng: number; label: string };
  };
  postDeliveryReview?: DeliveryReview;
  specialInstructions?: string;
  proofOfDelivery?: ProofOfDeliveryRecord;
}

export interface ProofOfDeliveryRecord {
  id: string;
  photoUrl: string;
  capturedAt: string;
  capturedAtKm: string;
  location: string;
  locationKm: string;
  deliveredByCourier: string;
  recipientName: string;
  courierNotes?: string;
  courierNotesKm?: string;
}

export type VerificationIdType = 'national_id' | 'driver_license' | 'passport';

export interface CourierVerificationRecord {
  isVerified: boolean;
  verifiedAt: string;
  idType: VerificationIdType;
  idTypeLabel: string;
  idTypeLabelKm: string;
  idNumberMasked: string;
  driverName: string;
  driverPhotoUrl?: string;
  idCardPhotoUrl?: string;
  verificationMethod: 'camera_scanner' | 'ai_ocr_scan' | 'manual_review';
  badgeTitle: string;
  badgeTitleKm: string;
  issuedAuthority: string;
  issuedAuthorityKm: string;
  expiryDate?: string;
  confidenceScore: number;
  verificationHash?: string;
}

export interface DeliveryReview {
  id: string;
  trackingNumber: string;
  driverName: string;
  driverPlate?: string;
  rating: number;
  tags: string[];
  comment: string;
  tipAmountKHR: number;
  reviewedAt: string;
  customerName: string;
}

export interface FoodMerchant {
  id: string;
  name: string;
  nameKm: string;
  category: string;
  categoryKm: string;
  badgeLabel: string;
  badgeLabelKm: string;
  badgeColor: string;
  rating: number;
  reviewCount: number;
  deliveryMinutes: string;
  deliveryFeeKHR: number; // 0 for free community delivery or direct fuel fee
  minOrderKHR: number;
  distanceKm: number;
  imageUrl: string;
  featuredDishes: {
    name: string;
    nameKm: string;
    priceKHR: number;
    priceUSD: number;
  }[];
}

export interface RideServiceOption {
  id: string;
  name: string;
  nameKm: string;
  serviceCategory: 'rickshaw' | 'motor' | 'remorque' | 'taxi';
  serviceCategoryKm: string;
  categoryColor: string;
  vehicleType: 'rickshaw' | 'motor' | 'sedan' | 'remorque';
  vehicleTypeKm: string;
  capacity: string;
  etaMinutes: number;
  baseFareKHR: number;
  pricePerKmKHR: number;
  recommended: boolean;
  communityBenefitsKm: string;
  communityBenefitsEn: string;
}

export type AccountRole = 'customer' | 'provider';

export type ProviderServiceCategory = 
  | 'driver_courier' // អ្នកដឹកជញ្ជូន ឬអ្នកបើកបរកង់បី/ម៉ូតូ
  | 'merchant_food'  // អាជីវករហាងម្ហូប ឬកសិផល
  | 'fleet_logistics'; // សហគ្រាសដឹកជញ្ជូនរថយន្តវ៉ែនអន្តរខេត្ត

export interface BankAccount {
  id: string;
  bankName: string;
  bankNameKm: string;
  bankCode: 'ABA' | 'ACLEDA' | 'WING' | 'CANADIA' | 'SATHAPANA' | 'BAKONG';
  accountNumber: string;
  accountName: string;
  currency: Currency;
  isDefault: boolean;
  bakongAccountId?: string;
  verified: boolean;
  brandColor: string;
  logoBg: string;
  forRole: AccountRole | 'both';
}

export interface UserAccountProfile {
  id: string;
  role: AccountRole;
  providerCategory?: ProviderServiceCategory;
  name: string;
  nameKm: string;
  phone: string;
  email: string;
  city: string;
  cityKm: string;
  address: string;
  avatarUrl: string;
  nationalIdOrLicense: string;
  businessOrVehicleTitle?: string;
  businessOrVehicleTitleKm?: string;
  vehiclePlate?: string;
  bankAccounts: BankAccount[];
  balanceKHR: number;
  balanceUSD: number;
  pendingPayoutKHR: number;
  totalTransactions: number;
  rating?: number;
  isVerified: boolean;
  commissionRate: number; // 0%
  memberSince: string;
}

export interface BankTransactionRecord {
  id: string;
  date: string;
  description: string;
  descriptionKm: string;
  amountKHR: number;
  amountUSD: number;
  type: 'payment' | 'payout' | 'refund' | 'deposit';
  status: 'completed' | 'pending' | 'processing';
  bankName: string;
  accountNumber: string;
  referenceNumber: string;
}

export interface MonthlyDeliveryHistoryItem {
  id: string;
  trackingNumber: string;
  date: string;
  monthKey: string; // e.g. '2026-09'
  carrierId: string;
  carrierName: string;
  carrierNameKm: string;
  origin: string;
  originKm: string;
  destination: string;
  destinationKm: string;
  recipientName: string;
  recipientPhone: string;
  packageType: string;
  packageTypeKm: string;
  weightKg: number;
  shippingFeeKHR: number;
  shippingFeeUSD: number;
  codAmountKHR?: number;
  codAmountUSD?: number;
  status: 'delivered' | 'completed' | 'in_transit' | 'scheduled';
  statusKm: string;
  paymentMethod: string;
  paymentMethodKm: string;
  paidViaBank?: string;
  waybillRef: string;
}

export interface LoyaltyHistoryEntry {
  id: string;
  date: string;
  trackingNumber?: string;
  reasonEn: string;
  reasonKm: string;
  points: number;
  type: 'delivery_completed' | 'rating_submitted' | 'on_time_bonus' | 'verification_bonus' | 'bonus';
}

export interface LoyaltyProgramState {
  totalPoints: number;
  completedShipmentsCount: number;
  isCertifiedReliableUser: boolean;
  targetPoints: number;
  progressPercentage: number;
  history: LoyaltyHistoryEntry[];
}

export interface ScheduledPickupReservation {
  id: string;
  referenceNumber: string;
  trackingNumber?: string;
  carrierId: string;
  carrierName: string;
  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  pickupProvinceId: string;
  pickupProvinceName: string;
  destinationProvinceId: string;
  destinationProvinceName: string;
  scheduledDate: string; // YYYY-MM-DD
  timeSlotId: string;
  timeSlotLabel: string;
  timeSlotLabelKm: string;
  packageType: string;
  packageTypeKm: string;
  estimatedWeightKg: number;
  specialInstructions?: string;
  status: 'confirmed' | 'dispatched' | 'completed' | 'cancelled';
  statusKm: string;
  estimatedPriceKHR: number;
  createdAt: string;
}

export interface DeliveryIssueReport {
  id: string;
  ticketNumber: string;
  trackingNumber: string;
  courierName: string;
  category: 'delay' | 'address' | 'damage' | 'unreachable' | 'cod' | 'instructions' | 'other';
  categoryLabel: string;
  categoryLabelKm: string;
  description: string;
  isUrgent: boolean;
  contactPhone: string;
  timestamp: string;
  timestampKm: string;
  status: 'submitted' | 'investigating' | 'resolved';
}

export type SavedAddressCategory = 'home' | 'office' | 'warehouse' | 'store' | 'other';

export interface SavedAddressItem {
  id: string;
  label: string;
  labelKm: string;
  contactName: string;
  contactPhone: string;
  provinceId: string;
  provinceName: string;
  provinceNameKm: string;
  detailAddress: string;
  isDefaultPickup: boolean;
  isDefaultDelivery: boolean;
  category: SavedAddressCategory;
  createdAt: string;
}


