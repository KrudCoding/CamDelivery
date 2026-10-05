import { LoyaltyProgramState, LoyaltyHistoryEntry } from '../types';
import { MONTHLY_DELIVERY_HISTORY } from '../data/deliveryHistory';

const STORAGE_KEY = 'camdelivery_loyalty_data_v1';
export const TARGET_RELIABLE_USER_POINTS = 500;
export const POINTS_PER_COMPLETED_SHIPMENT = 50;
export const POINTS_PER_FEEDBACK_SUBMISSION = 25;

export const LOYALTY_EVENT = 'camdelivery_loyalty_updated';

/**
 * Build initial realistic history based on completed deliveries
 */
function buildInitialLoyaltyState(): LoyaltyProgramState {
  const deliveredItems = MONTHLY_DELIVERY_HISTORY.filter(
    (item) => item.status === 'delivered' || item.status === 'completed'
  );

  const history: LoyaltyHistoryEntry[] = [];
  let pointsSum = 0;

  // Account verification bonus
  history.push({
    id: 'loyalty-init-verify',
    date: '2026-07-01 09:00',
    reasonEn: 'Verified National ID & Citizen Profile Bonus',
    reasonKm: 'ប្រាក់រង្វាន់ផ្ទៀងផ្ទាត់អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ',
    points: 50,
    type: 'verification_bonus',
  });
  pointsSum += 50;

  // Recent completed deliveries
  deliveredItems.forEach((item, index) => {
    history.push({
      id: `loyalty-del-${item.id}`,
      date: item.date,
      trackingNumber: item.trackingNumber,
      reasonEn: `Completed delivery ${item.trackingNumber} (${item.origin} → ${item.destination})`,
      reasonKm: `បានបញ្ចប់ការដឹកជញ្ជូន ${item.trackingNumber} (${item.originKm} → ${item.destinationKm})`,
      points: POINTS_PER_COMPLETED_SHIPMENT,
      type: 'delivery_completed',
    });
    pointsSum += POINTS_PER_COMPLETED_SHIPMENT;

    // Add a bonus review on one delivery
    if (index === 0) {
      history.push({
        id: `loyalty-review-${item.id}`,
        date: item.date,
        trackingNumber: item.trackingNumber,
        reasonEn: `5-Star Courier Driver Experience Rating for ${item.trackingNumber}`,
        reasonKm: `ការវាយតម្លៃផ្កាយ ៥ និងផ្តល់មតិលើអ្នកដឹកសម្រាប់ ${item.trackingNumber}`,
        points: POINTS_PER_FEEDBACK_SUBMISSION,
        type: 'rating_submitted',
      });
      pointsSum += POINTS_PER_FEEDBACK_SUBMISSION;
    }
  });

  // Include KH-EX-77120 from initial active shipments if not duplicate
  const has77120 = history.some((h) => h.trackingNumber === 'KH-EX-77120');
  if (!has77120) {
    history.push({
      id: 'loyalty-del-77120',
      date: '2026-09-19 11:20',
      trackingNumber: 'KH-EX-77120',
      reasonEn: 'Completed doorstep delivery KH-EX-77120 (Phnom Penh → Kampot)',
      reasonKm: 'បានបញ្ចប់ការដឹកជញ្ជូនដល់ផ្ទះ KH-EX-77120 (ភ្នំពេញ → កំពត)',
      points: POINTS_PER_COMPLETED_SHIPMENT,
      type: 'delivery_completed',
    });
    pointsSum += POINTS_PER_COMPLETED_SHIPMENT;
  }

  // Sort history newest first
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const completedCount = history.filter((h) => h.type === 'delivery_completed').length;
  const progress = Math.min(100, Math.round((pointsSum / TARGET_RELIABLE_USER_POINTS) * 100));

  return {
    totalPoints: pointsSum,
    completedShipmentsCount: completedCount,
    isCertifiedReliableUser: pointsSum >= TARGET_RELIABLE_USER_POINTS,
    targetPoints: TARGET_RELIABLE_USER_POINTS,
    progressPercentage: progress,
    history,
  };
}

/**
 * Retrieve current loyalty program state from storage or initialize
 */
export function getLoyaltyData(): LoyaltyProgramState {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: LoyaltyProgramState = JSON.parse(raw);
        if (parsed && typeof parsed.totalPoints === 'number') {
          return {
            ...parsed,
            targetPoints: TARGET_RELIABLE_USER_POINTS,
            isCertifiedReliableUser: parsed.totalPoints >= TARGET_RELIABLE_USER_POINTS,
            progressPercentage: Math.min(100, Math.round((parsed.totalPoints / TARGET_RELIABLE_USER_POINTS) * 100)),
          };
        }
      }
    }
  } catch (err) {
    console.warn('Error reading loyalty state, initializing default:', err);
  }

  const initial = buildInitialLoyaltyState();
  saveLoyaltyData(initial);
  return initial;
}

/**
 * Save loyalty data and notify listeners
 */
export function saveLoyaltyData(state: LoyaltyProgramState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent(LOYALTY_EVENT, { detail: state }));
    }
  } catch (err) {
    console.error('Error saving loyalty data:', err);
  }
}

/**
 * Add delivery points with history log
 */
export function addDeliveryPoints(
  points: number,
  reasonEn: string,
  reasonKm: string,
  trackingNumber?: string,
  type: LoyaltyHistoryEntry['type'] = 'delivery_completed'
): LoyaltyProgramState {
  const current = getLoyaltyData();
  const now = new Date();
  const formattedDate = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

  const newEntry: LoyaltyHistoryEntry = {
    id: `loyalty-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    date: formattedDate,
    trackingNumber,
    reasonEn,
    reasonKm,
    points,
    type,
  };

  const newTotal = current.totalPoints + points;
  const newCompletedCount = type === 'delivery_completed'
    ? current.completedShipmentsCount + 1
    : current.completedShipmentsCount;

  const updated: LoyaltyProgramState = {
    totalPoints: newTotal,
    completedShipmentsCount: newCompletedCount,
    isCertifiedReliableUser: newTotal >= TARGET_RELIABLE_USER_POINTS,
    targetPoints: TARGET_RELIABLE_USER_POINTS,
    progressPercentage: Math.min(100, Math.round((newTotal / TARGET_RELIABLE_USER_POINTS) * 100)),
    history: [newEntry, ...current.history],
  };

  saveLoyaltyData(updated);
  return updated;
}

/**
 * Record a completed shipment points reward
 */
export function recordCompletedShipmentPoints(
  trackingNumber: string,
  originCity = 'Phnom Penh',
  destinationCity = 'Province'
): LoyaltyProgramState {
  // Check if points already awarded for this tracking number
  const current = getLoyaltyData();
  const alreadyAwarded = current.history.some(
    (h) => h.trackingNumber === trackingNumber && h.type === 'delivery_completed'
  );

  if (alreadyAwarded) {
    return current;
  }

  return addDeliveryPoints(
    POINTS_PER_COMPLETED_SHIPMENT,
    `Completed shipment ${trackingNumber} (${originCity} → ${destinationCity})`,
    `បានបញ្ចប់ការដឹកជញ្ជូនកញ្ចប់ ${trackingNumber} (${originCity} → ${destinationCity})`,
    trackingNumber,
    'delivery_completed'
  );
}

/**
 * Reset loyalty program data to initial state
 */
export function resetLoyaltyData(): LoyaltyProgramState {
  const initial = buildInitialLoyaltyState();
  saveLoyaltyData(initial);
  return initial;
}
