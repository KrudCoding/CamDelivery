import { TrackingItem, Language } from '../types';

export interface OutForDeliveryNotificationEvent {
  id: string;
  trackingNumber: string;
  carrierName: string;
  carrierNameKm: string;
  driverName: string;
  driverPhone: string;
  driverVehicle: string;
  receiverCity: string;
  timestamp: string;
  etaMinutes: number;
}

type NotificationListener = (event: OutForDeliveryNotificationEvent) => void;
const listeners = new Set<NotificationListener>();

let titleFlashInterval: number | null = null;
let originalDocumentTitle = typeof document !== 'undefined' ? document.title : 'CamDelivery';

// Synthesize pleasant 3-tone chime for delivery arrival alert
export function playOutForDeliveryChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic chords: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [
      { freq: 523.25, time: now + 0.0, dur: 0.18 },
      { freq: 659.25, time: now + 0.12, dur: 0.18 },
      { freq: 783.99, time: now + 0.24, dur: 0.22 },
      { freq: 1046.5, time: now + 0.36, dur: 0.35 },
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.3, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + dur);
    });
  } catch {
    // Ignore autoplay restrictions
  }
}

// Flash document title for visual attention when user is viewing another tab or window
export function flashDocumentTitle(alertText: string, durationMs = 15000) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  if (titleFlashInterval) {
    clearInterval(titleFlashInterval);
    titleFlashInterval = null;
  }

  originalDocumentTitle = document.title.replace(/^🔔\s*\[.*?\]\s*/, '');
  let isAlertState = false;

  titleFlashInterval = window.setInterval(() => {
    isAlertState = !isAlertState;
    document.title = isAlertState ? `🚚 ${alertText}` : originalDocumentTitle;
  }, 1000);

  const stopFlashing = () => {
    if (titleFlashInterval) {
      clearInterval(titleFlashInterval);
      titleFlashInterval = null;
    }
    document.title = originalDocumentTitle;
    window.removeEventListener('focus', stopFlashing);
    window.removeEventListener('click', stopFlashing);
  };

  window.addEventListener('focus', stopFlashing, { once: true });
  window.addEventListener('click', stopFlashing, { once: true });

  window.setTimeout(stopFlashing, durationMs);
}

// Check native Notification API permission
export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission to send browser desktop/mobile notifications
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

// Send standard HTML5 Browser Notification
export function sendBrowserNotification(options: {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'camdelivery-status',
      });

      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };

      return notification;
    } catch (err) {
      console.warn('Error displaying system notification:', err);
    }
  }
  return null;
}

// Main trigger when a shipment transitions from 'in_transit' to 'out_for_delivery'
export function triggerOutForDeliveryNotification(
  shipment: TrackingItem,
  language: Language,
  onNavigate?: () => void
): OutForDeliveryNotificationEvent {
  const isKm = language === 'km';
  const driverName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូន' : 'Rider');
  const carrierName = isKm ? shipment.carrierNameKm : shipment.carrierName;

  // 1. Audio chime
  playOutForDeliveryChime();

  // 2. Tab title flash
  const titleAlert = isKm
    ? `[ឥវ៉ាន់កំពុងដឹកជូន] #${shipment.trackingNumber}`
    : `[Out for Delivery] #${shipment.trackingNumber}`;
  flashDocumentTitle(titleAlert);

  // 3. Browser system notification
  const sysTitle = isKm
    ? `🚚 កញ្ចប់ឥវ៉ាន់កំពុងចេញដឹក! #${shipment.trackingNumber}`
    : `🚚 Package Out for Delivery! #${shipment.trackingNumber}`;

  const sysBody = isKm
    ? `${carrierName}៖ អ្នកដឹក ${driverName} កំពុងធ្វើដំណើរទៅកាន់ ${shipment.receiverCityKm || shipment.receiverCity}។ សូមត្រៀមទទួលទូរស័ព្ទ!`
    : `${carrierName}: Driver ${driverName} is on the way to ${shipment.receiverCity}. ETA 25-35 mins. Please keep phone reachable!`;

  sendBrowserNotification({
    title: sysTitle,
    body: sysBody,
    tag: `out-for-delivery-${shipment.trackingNumber}`,
    onClick: onNavigate,
  });

  // 4. Dispatch in-app visual indicator event
  const event: OutForDeliveryNotificationEvent = {
    id: `event-${Date.now()}-${shipment.trackingNumber}`,
    trackingNumber: shipment.trackingNumber,
    carrierName: shipment.carrierName,
    carrierNameKm: shipment.carrierNameKm,
    driverName,
    driverPhone: shipment.driverPhone || '012 345 678',
    driverVehicle: shipment.driverVehicle || 'Motorcycle Express',
    receiverCity: isKm ? shipment.receiverCityKm : shipment.receiverCity,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    etaMinutes: 30,
  };

  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (e) {
      console.error('Error invoking notification listener', e);
    }
  });

  return event;
}

// Subscribe to in-app notification events
export function subscribeToOutForDeliveryEvents(listener: NotificationListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Synthesize high-priority proximity chime (rapid dual ping: 880Hz -> 1174Hz)
export function playProximityChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const pings = [
      { freq: 880, time: now + 0.0, dur: 0.12 },
      { freq: 1174.66, time: now + 0.10, dur: 0.25 },
    ];

    pings.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.35, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + dur);
    });
  } catch {
    // Ignore autoplay restrictions
  }
}

export interface ProximityNotificationEvent {
  id: string;
  trackingNumber: string;
  carrierName: string;
  carrierNameKm: string;
  driverName: string;
  driverPhone: string;
  driverPlate?: string;
  driverVehicle?: string;
  distanceMeters: number;
  etaMinutes: number;
  timestamp: string;
  destinationAddress: string;
}

type ProximityListener = (event: ProximityNotificationEvent) => void;
const proximityListeners = new Set<ProximityListener>();

// Main trigger when assigned courier is within 500 meters of the delivery destination
export function triggerProximityAlertNotification(
  shipment: TrackingItem,
  distanceMeters: number = 450,
  language: Language = 'km',
  onNavigate?: () => void
): ProximityNotificationEvent {
  const isKm = language === 'km';
  const driverName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូន' : 'Driver');
  const carrierName = isKm ? shipment.carrierNameKm : shipment.carrierName;

  // 1. Play dual-ping radar chime
  playProximityChime();

  // 2. Vibration if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 400]);
    } catch {
      // Ignore vibration error
    }
  }

  // 3. Flash document title
  const titleText = isKm
    ? `[អ្នកដឹកជិតមកដល់ ${distanceMeters}ម] #${shipment.trackingNumber}`
    : `[Driver ${distanceMeters}m Away] #${shipment.trackingNumber}`;
  flashDocumentTitle(titleText);

  // 4. HTML5 browser system push notification
  const sysTitle = isKm
    ? `📍 អ្នកដឹកជញ្ជូននៅចម្ងាយត្រឹម ${distanceMeters} ម៉ែត្រ!`
    : `📍 Courier Approaching (${distanceMeters}m away)!`;

  const sysBody = isKm
    ? `${carrierName}៖ អ្នកដឹក ${driverName} នៅជិតដល់ទីតាំងអ្នកហើយ (~២ នាទី)។ សូមត្រៀមខ្លួនទទួលឥវ៉ាន់!`
    : `${carrierName}: Driver ${driverName} is within 500m (~2 mins away). Please be ready to receive parcel!`;

  sendBrowserNotification({
    title: sysTitle,
    body: sysBody,
    tag: `proximity-${shipment.trackingNumber}`,
    onClick: onNavigate,
  });

  // 5. In-app proximity event
  const event: ProximityNotificationEvent = {
    id: `prox-${Date.now()}-${shipment.trackingNumber}`,
    trackingNumber: shipment.trackingNumber,
    carrierName: shipment.carrierName,
    carrierNameKm: shipment.carrierNameKm,
    driverName,
    driverPhone: shipment.driverPhone || '012 345 678',
    driverPlate: shipment.driverPlate || '2AB-8829',
    driverVehicle: shipment.driverVehicle || 'Motorcycle Express',
    distanceMeters,
    etaMinutes: Math.max(1, Math.round(distanceMeters / 250)),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    destinationAddress: isKm ? shipment.receiverCityKm : shipment.receiverCity,
  };

  proximityListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (e) {
      console.error('Error invoking proximity listener', e);
    }
  });

  return event;
}

export function subscribeToProximityEvents(listener: ProximityListener) {
  proximityListeners.add(listener);
  return () => {
    proximityListeners.delete(listener);
  };
}

export interface MilestoneNotificationPreferences {
  outForDelivery: boolean;
  delivered: boolean;
  proximityArrival: boolean;
  pickedUpHub: boolean;
  rescheduled: boolean;
  codPayment: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: MilestoneNotificationPreferences = {
  outForDelivery: true,
  delivered: true,
  proximityArrival: true,
  pickedUpHub: true,
  rescheduled: true,
  codPayment: true,
  soundEnabled: true,
};

export const NOTIFICATION_PREFERENCES_KEY = 'camdelivery_milestone_notification_preferences';

export function getNotificationPreferences(): MilestoneNotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const saved = localStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore parse error
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

export function saveNotificationPreferences(prefs: MilestoneNotificationPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage error
  }
}

// Trigger Delivered milestone push notification
export function triggerDeliveredNotification(
  shipment: TrackingItem,
  language: Language,
  onNavigate?: () => void
) {
  const prefs = getNotificationPreferences();
  if (!prefs.delivered) return;

  const isKm = language === 'km';
  const carrierName = isKm ? shipment.carrierNameKm : shipment.carrierName;

  if (prefs.soundEnabled) {
    playOutForDeliveryChime();
  }

  const sysTitle = isKm
    ? `🎉 កញ្ចប់ឥវ៉ាន់ត្រូវបានប្រគល់រួចរាល់! #${shipment.trackingNumber}`
    : `🎉 Package Delivered! #${shipment.trackingNumber}`;

  const sysBody = isKm
    ? `${carrierName}៖ កញ្ចប់របស់អ្នកត្រូវបានដឹកជញ្ជូនដល់ ${shipment.receiverCityKm || shipment.receiverCity} ដោយជោគជ័យ។ សូមវាយតម្លៃអ្នកដឹកជញ្ជូន!`
    : `${carrierName}: Your package was delivered successfully to ${shipment.receiverCity}. Click to inspect proof of delivery & rate your courier!`;

  sendBrowserNotification({
    title: sysTitle,
    body: sysBody,
    tag: `delivered-${shipment.trackingNumber}`,
    onClick: onNavigate,
  });
}


