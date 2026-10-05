import { useState, useEffect } from 'react';
import { TrackingItem, ScheduledPickupReservation, Language, Currency } from '../types';
import { INITIAL_TRACKING_DATA } from '../data/carriers';

const STORAGE_KEYS = {
  ACTIVE_SHIPMENTS: 'camdelivery_active_shipments_v2',
  RECENT_SEARCHES: 'camdelivery_recent_searches_v2',
  DELIVERY_REVIEWS: 'camdelivery_delivery_reviews_v2',
  USER_BANK_ACCOUNTS: 'camdelivery_bank_accounts_v2',
  SCHEDULED_PICKUPS: 'camdelivery_scheduled_pickups_v2',
  OFFLINE_CACHE_META: 'camdelivery_cache_timestamp',
  LANGUAGE: 'camdelivery_user_language_v1',
  CURRENCY: 'camdelivery_user_currency_v1',
};

// Safe LocalStorage helpers with memory fallback
class OfflineCacheStore {
  private memoryFallback = new Map<string, string>();

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (this.isLocalStorageAvailable()) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn('LocalStorage read error, using memory fallback:', e);
      }
    }
    return this.memoryFallback.get(key) || null;
  }

  setItem(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(key, value);
        window.localStorage.setItem(STORAGE_KEYS.OFFLINE_CACHE_META, new Date().toISOString());
        return;
      } catch (e) {
        console.warn('LocalStorage write error, using memory fallback:', e);
      }
    }
    this.memoryFallback.set(key, value);
  }
}

const cacheStore = new OfflineCacheStore();

// --- Active Shipments Persistence ---
export function loadCachedShipments(): TrackingItem[] {
  try {
    const raw = cacheStore.getItem(STORAGE_KEYS.ACTIVE_SHIPMENTS);
    const reviews = loadDeliveryReviews();
    const reviewsMap = new Map(reviews.map((r) => [r.trackingNumber, r]));

    let list: TrackingItem[] = INITIAL_TRACKING_DATA;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }

    return list.map((item) => {
      const savedReview = reviewsMap.get(item.trackingNumber);
      if (savedReview) {
        return { ...item, postDeliveryReview: savedReview };
      }
      return item;
    });
  } catch (err) {
    console.error('Error loading cached shipments:', err);
  }
  return INITIAL_TRACKING_DATA;
}

export function saveCachedShipments(shipments: TrackingItem[]): void {
  try {
    cacheStore.setItem(STORAGE_KEYS.ACTIVE_SHIPMENTS, JSON.stringify(shipments));
  } catch (err) {
    console.error('Error saving cached shipments:', err);
  }
}

// --- Recent Tracking Search History ---
export function loadRecentTrackingSearches(): string[] {
  try {
    const raw = cacheStore.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading recent searches:', err);
  }
  return ['KH-VAN-882910', 'VET-98214', 'JNT-55412'];
}

export function addRecentTrackingSearch(trackingNumber: string): string[] {
  try {
    const current = loadRecentTrackingSearches();
    const cleanNum = trackingNumber.trim().toUpperCase();
    const updated = [cleanNum, ...current.filter((n) => n.toUpperCase() !== cleanNum)].slice(0, 8);
    cacheStore.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving recent tracking search:', err);
    return [];
  }
}

// --- Post-Delivery Reviews Persistence ---
export interface CachedDeliveryReview {
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

export function loadDeliveryReviews(): CachedDeliveryReview[] {
  try {
    const raw = cacheStore.getItem(STORAGE_KEYS.DELIVERY_REVIEWS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading delivery reviews:', err);
  }
  return [];
}

export function saveDeliveryReview(review: CachedDeliveryReview): CachedDeliveryReview[] {
  try {
    const current = loadDeliveryReviews();
    const updated = [review, ...current.filter((r) => r.trackingNumber !== review.trackingNumber)];
    cacheStore.setItem(STORAGE_KEYS.DELIVERY_REVIEWS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving delivery review:', err);
    return [];
  }
}

// --- User Bank Accounts & Profile Offline Caching ---
export interface CachedBankAccount {
  id: string;
  bankName: string;
  bankCode: 'ABA' | 'ACLEDA' | 'WING' | 'BAKONG' | 'CANADIA';
  accountName: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'merchant_escrow';
  currency: 'KHR' | 'USD' | 'BOTH';
  isDefault: boolean;
  bakongAccountId?: string;
}

export function loadCachedBankAccounts(): CachedBankAccount[] | null {
  try {
    const raw = cacheStore.getItem(STORAGE_KEYS.USER_BANK_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error loading cached bank accounts:', err);
  }
  return null;
}

export function saveCachedBankAccounts(accounts: CachedBankAccount[]): void {
  try {
    cacheStore.setItem(STORAGE_KEYS.USER_BANK_ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Error saving cached bank accounts:', err);
  }
}

// --- Scheduled Pickup Reservations Persistence ---
const DEFAULT_INITIAL_PICKUPS: ScheduledPickupReservation[] = [
  {
    id: 'sch-demo-1',
    referenceNumber: 'SCH-202609-8812',
    trackingNumber: 'KH-VAN-882910',
    carrierId: 'cam-van-express',
    carrierName: 'CamExpress Interprovincial Van',
    senderName: 'Sok Vicheka',
    senderPhone: '012 889 900',
    pickupAddress: 'Street 271, Sangkat Boeng Tumpun, Khan Meanchey',
    pickupProvinceId: 'phnom-penh',
    pickupProvinceName: 'Phnom Penh',
    destinationProvinceId: 'siem-reap',
    destinationProvinceName: 'Siem Reap',
    scheduledDate: '2026-09-26',
    timeSlotId: 'mid_morning',
    timeSlotLabel: '10:00 AM - 12:00 PM',
    timeSlotLabelKm: 'ម៉ោង ១០:០០ ព្រឹក - ១២:០០ ថ្ងៃត្រង់',
    packageType: 'Carton Box (M)',
    packageTypeKm: 'ប្រអប់ក្រដាស (M)',
    estimatedWeightKg: 2.5,
    specialInstructions: 'Please call 10 mins before arrival at front gate.',
    status: 'confirmed',
    statusKm: 'បានកក់ជោគជ័យ',
    estimatedPriceKHR: 6500,
    createdAt: '2026-09-25T08:00:00Z',
  },
];

export function loadScheduledPickups(): ScheduledPickupReservation[] {
  try {
    const raw = cacheStore.getItem(STORAGE_KEYS.SCHEDULED_PICKUPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading scheduled pickups:', err);
  }
  return DEFAULT_INITIAL_PICKUPS;
}

export function saveScheduledPickup(reservation: ScheduledPickupReservation): ScheduledPickupReservation[] {
  try {
    const current = loadScheduledPickups();
    const updated = [reservation, ...current.filter((r) => r.id !== reservation.id)];
    cacheStore.setItem(STORAGE_KEYS.SCHEDULED_PICKUPS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving scheduled pickup:', err);
    return [];
  }
}

export function cancelScheduledPickup(reservationId: string): ScheduledPickupReservation[] {
  try {
    const current = loadScheduledPickups();
    const updated = current.filter((r) => r.id !== reservationId);
    cacheStore.setItem(STORAGE_KEYS.SCHEDULED_PICKUPS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error cancelling scheduled pickup:', err);
    return [];
  }
}

export function getLastCacheTime(): string | null {
  return cacheStore.getItem(STORAGE_KEYS.OFFLINE_CACHE_META);
}

// --- Online / Offline React Hook ---
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// --- Language Preference Persistence Across App Sessions ---
export const LANGUAGE_CHANGE_EVENT = 'camdelivery_language_changed';

export function getSavedLanguage(): Language {
  try {
    const raw = cacheStore.getItem(STORAGE_KEYS.LANGUAGE);
    if (raw === 'km' || raw === 'en') {
      return raw;
    }
  } catch (err) {
    console.error('Error reading saved language:', err);
  }
  return 'km'; // default to Khmer
}

export function setSavedLanguage(lang: Language): Language {
  try {
    cacheStore.setItem(STORAGE_KEYS.LANGUAGE, lang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { language: lang } }));
    }
  } catch (err) {
    console.error('Error saving language preference:', err);
  }
  return lang;
}

// --- Currency Preference Persistence Across App Sessions ---
export const CURRENCY_CHANGE_EVENT = 'camdelivery_currency_changed';

export function getSavedCurrency(): Currency {
  try {
    const raw = cacheStore.getItem(STORAGE_KEYS.CURRENCY);
    if (raw === 'KHR' || raw === 'USD') {
      return raw;
    }
  } catch (err) {
    console.error('Error reading saved currency:', err);
  }
  return 'KHR'; // default to Cambodian Riel
}

export function setSavedCurrency(curr: Currency): Currency {
  try {
    cacheStore.setItem(STORAGE_KEYS.CURRENCY, curr);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: { currency: curr } }));
    }
  } catch (err) {
    console.error('Error saving currency preference:', err);
  }
  return curr;
}
