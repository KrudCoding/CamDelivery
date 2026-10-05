import { TrackingItem, Language } from '../types';

/**
 * Helper to format Date into iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function toIcsTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Determine realistic delivery event start & end dates from TrackingItem
 */
export function getDeliveryEventDates(shipment: TrackingItem, fallbackArrivalDate?: Date): { startDate: Date; endDate: Date } {
  let startDate: Date;

  if (fallbackArrivalDate && !isNaN(fallbackArrivalDate.getTime())) {
    startDate = new Date(fallbackArrivalDate);
  } else if (shipment.estimatedSchedule?.estimatedArrivalISO) {
    startDate = new Date(shipment.estimatedSchedule.estimatedArrivalISO);
  } else {
    // Default to today + 2 hours or tomorrow morning
    const now = new Date();
    startDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  }

  // Ensure validity
  if (isNaN(startDate.getTime())) {
    startDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
  }

  // Event duration: 1 hour window
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  return { startDate, endDate };
}

/**
 * Generate standard RFC 5545 iCalendar (.ics) string
 */
export function generateIcsContent(
  shipment: TrackingItem,
  options?: { arrivalDate?: Date; language?: Language }
): string {
  const isKm = options?.language === 'km';
  const { startDate, endDate } = getDeliveryEventDates(shipment, options?.arrivalDate);
  const now = new Date();

  const dtStamp = toIcsTimestamp(now);
  const dtStart = toIcsTimestamp(startDate);
  const dtEnd = toIcsTimestamp(endDate);

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${shipment.trackingNumber}`
    : `https://camdelivery.kh/?track=${shipment.trackingNumber}`;

  const summary = isKm
    ? `📦 ការដឹកជញ្ជូន CamDelivery #${shipment.trackingNumber} (${shipment.senderCityKm} ➔ ${shipment.receiverCityKm})`
    : `📦 CamDelivery: Parcel #${shipment.trackingNumber} Delivery (${shipment.senderCity} ➔ ${shipment.receiverCity})`;

  const descriptionLines = [
    `CamDelivery Parcel Universal Tracking`,
    `Tracking Number: #${shipment.trackingNumber}`,
    `Carrier: ${isKm ? shipment.carrierNameKm : shipment.carrierName}`,
    `Status: ${isKm ? shipment.statusKm : shipment.status.replace(/_/g, ' ').toUpperCase()}`,
    `Route: ${shipment.senderCity} -> ${shipment.receiverCity}`,
    `Recipient: ${shipment.receiverName} (${shipment.receiverPhone})`,
    shipment.driverName ? `Assigned Courier: ${shipment.driverName} (${shipment.driverPhone || 'N/A'})` : '',
    shipment.isCod ? `COD Amount: ${shipment.codAmountKHR.toLocaleString()} KHR` : 'COD: None (Prepaid)',
    `Live Tracking Link: ${trackingUrl}`,
  ].filter(Boolean);

  const description = descriptionLines.join('\\n');
  const location = `${shipment.receiverCity}, Cambodia`;
  const uid = `camdelivery-${shipment.trackingNumber}-${Date.now()}@camdelivery.kh`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CamDelivery Cambodia//Parcel Tracking Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `URL:${trackingUrl}`,
    'STATUS:CONFIRMED',
    // 30 minute reminder alarm
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:CamDelivery Reminder: Parcel #${shipment.trackingNumber} is arriving soon!`,
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Trigger immediate browser download of the .ics file
 */
export function downloadIcsFile(
  shipment: TrackingItem,
  options?: { arrivalDate?: Date; language?: Language }
): boolean {
  try {
    const icsContent = generateIcsContent(shipment, options);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CamDelivery-${shipment.trackingNumber}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to download ICS calendar file:', err);
    return false;
  }
}

/**
 * Generate Google Calendar 1-click web link
 */
export function getGoogleCalendarUrl(
  shipment: TrackingItem,
  options?: { arrivalDate?: Date; language?: Language }
): string {
  const isKm = options?.language === 'km';
  const { startDate, endDate } = getDeliveryEventDates(shipment, options?.arrivalDate);
  const dtStart = toIcsTimestamp(startDate);
  const dtEnd = toIcsTimestamp(endDate);

  const title = isKm
    ? `CamDelivery #${shipment.trackingNumber} ដឹកជញ្ជូនដល់ ${shipment.receiverCityKm}`
    : `CamDelivery #${shipment.trackingNumber} Arrival (${shipment.receiverCity})`;

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${shipment.trackingNumber}`
    : `https://camdelivery.kh/?track=${shipment.trackingNumber}`;

  const details = [
    `CamDelivery Parcel Delivery Reminder`,
    `Tracking: #${shipment.trackingNumber}`,
    `Carrier: ${shipment.carrierName}`,
    `Driver: ${shipment.driverName || 'Courier Driver'} (${shipment.driverPhone || 'N/A'})`,
    `Live Tracking: ${trackingUrl}`,
  ].join('\n');

  const location = `${shipment.receiverCity}, Cambodia`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar 1-click web link
 */
export function getOutlookCalendarUrl(
  shipment: TrackingItem,
  options?: { arrivalDate?: Date; language?: Language }
): string {
  const isKm = options?.language === 'km';
  const { startDate, endDate } = getDeliveryEventDates(shipment, options?.arrivalDate);

  const title = isKm
    ? `CamDelivery #${shipment.trackingNumber} ដឹកជញ្ជូនដល់ ${shipment.receiverCityKm}`
    : `CamDelivery #${shipment.trackingNumber} Arrival (${shipment.receiverCity})`;

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?track=${shipment.trackingNumber}`
    : `https://camdelivery.kh/?track=${shipment.trackingNumber}`;

  const details = `Tracking #${shipment.trackingNumber} via ${shipment.carrierName}. Link: ${trackingUrl}`;
  const location = `${shipment.receiverCity}, Cambodia`;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: details,
    location: location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
