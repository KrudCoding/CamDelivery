import { CourierSpeedTier, EstimatedDeliverySchedule } from '../types';

// Khmer day of week names
const KHMER_DAYS = [
  'ថ្ងៃអាទិត្យ', // Sunday
  'ថ្ងៃចន្ទ',    // Monday
  'ថ្ងៃអង្គារ',   // Tuesday
  'ថ្ងៃពុធ',     // Wednesday
  'ថ្ងៃព្រហស្បតិ៍', // Thursday
  'ថ្ងៃសុក្រ',    // Friday
  'ថ្ងៃសៅរ៍',    // Saturday
];

// Khmer month names
const KHMER_MONTHS = [
  'មករា',    // Jan
  'កុម្ភៈ',    // Feb
  'មីនា',    // Mar
  'មេសា',    // Apr
  'ឧសភា',   // May
  'មិថុនា',   // Jun
  'កក្កដា',   // Jul
  'សីហា',    // Aug
  'កញ្ញា',    // Sep
  'តុលា',    // Oct
  'វិច្ឆិកា',   // Nov
  'ធ្នូ',     // Dec
];

// Convert Arabic digits to Khmer numerals
export function toKhmerNumber(num: number | string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num).replace(/[0-9]/g, (digit) => khmerDigits[parseInt(digit, 10)]);
}

/**
 * Format date in English (e.g. "Mon, 21 Sep 2026")
 */
export function formatEnglishDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format date in Khmer (e.g. "ថ្ងៃចន្ទ ទី២១ ខែកញ្ញា ឆ្នាំ២០២៦")
 */
export function formatKhmerDate(date: Date): string {
  const dayName = KHMER_DAYS[date.getDay()];
  const dayNum = toKhmerNumber(date.getDate());
  const monthName = KHMER_MONTHS[date.getMonth()];
  const yearNum = toKhmerNumber(date.getFullYear());
  return `${dayName} ទី${dayNum} ខែ${monthName} ឆ្នាំ${yearNum}`;
}

/**
 * Format 12h time string with AM/PM
 */
export function formatEnglishTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const hoursStr = hours < 10 ? `0${hours}` : hours;
  return `${hoursStr}:${minutesStr} ${ampm}`;
}

/**
 * Format Khmer time string with appropriate Khmer time period
 */
export function formatKhmerTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hours12 = hours % 12 || 12;
  const khmerHours = toKhmerNumber(hours12 < 10 ? `0${hours12}` : hours12);
  const khmerMins = toKhmerNumber(minutes < 10 ? `0${minutes}` : minutes);

  let period = 'ព្រឹក'; // Morning
  if (hours >= 12 && hours < 17) {
    period = 'រសៀល'; // Afternoon
  } else if (hours >= 17 && hours < 21) {
    period = 'ល្ងាច'; // Evening
  } else if (hours >= 21 || hours < 5) {
    period = 'យប់'; // Night
  }

  return `ម៉ោង ${khmerHours}:${khmerMins} ${period}`;
}

export interface CourierCalculationConfig {
  speedTier: CourierSpeedTier;
  transitHours: number;
  typeLabelEn: string;
  typeLabelKm: string;
  windowSpreadHours: number; // e.g. 2 for 2-hour delivery window
  cutoffNoticeEn: string;
  cutoffNoticeKm: string;
  targetHourWindowStart?: number; // preferred daytime delivery hour
}

export const COURIER_CONFIGS: Record<string, CourierCalculationConfig> = {
  'cam-van-express': {
    speedTier: 'same_day_van',
    transitHours: 6.5,
    typeLabelEn: 'Cambodia Inter-Provincial Van Express',
    typeLabelKm: 'បណ្តាញឡានវ៉ែនអន្តរខេត្តឯករាជ្យ (ចេញរៀងរាល់ ២ ម៉ោង)',
    windowSpreadHours: 2,
    cutoffNoticeEn: 'Departs continuously with provincial van network. Morning booking arrives same-day afternoon.',
    cutoffNoticeKm: 'ឡានវ៉ែនចេញដំណើរជាប់ជាប្រចាំ។ ផ្ញើពេលព្រឹក ឥវ៉ាន់នឹងទៅដល់នៅរសៀលថ្ងៃដដែល។',
    targetHourWindowStart: 16, // ~4:00 PM
  },
  'cam-door-express': {
    speedTier: 'door_to_door_standard',
    transitHours: 24,
    typeLabelEn: 'Direct Door-to-Door Standard Dispatch',
    typeLabelKm: 'សេវាដឹកដល់មាត់ទ្វារផ្ទះទូទាំងប្រទេស (Door-to-Door)',
    windowSpreadHours: 3,
    cutoffNoticeEn: 'Direct community driver network. Next-day door-to-door delivery with 0% platform fee.',
    cutoffNoticeKm: 'បណ្តាញអ្នកដឹកសហគមន៍ផ្ទាល់ ចែកចាយដល់មាត់ទ្វារផ្ទះនៅរសៀលស្អែកដោយឥតកាត់ថ្លៃសេវា។',
    targetHourWindowStart: 14, // ~2:00 PM next day
  },
  'cam-priority-express': {
    speedTier: 'priority_ecommerce',
    transitHours: 20,
    typeLabelEn: 'Priority Next-Morning E-Commerce Dispatch',
    typeLabelKm: 'សេវាអាទិភាពព្រឹកស្អែកសម្រាប់អ្នកលក់អនឡាញ (Priority Morning)',
    windowSpreadHours: 2.5,
    cutoffNoticeEn: 'Priority delivery window. Arrives next morning between 09:30 AM - 12:00 PM.',
    cutoffNoticeKm: 'សេវាអាទិភាពខ្ពស់ មកដល់នៅព្រឹកស្អែកចន្លោះម៉ោង ០៩:៣០ ព្រឹក ដល់ ១២:០០ ថ្ងៃត្រង់។',
    targetHourWindowStart: 10, // ~10:00 AM next day
  },
  'cam-postal-express': {
    speedTier: 'postal_ems',
    transitHours: 36,
    typeLabelEn: 'Community Postal & Regional Depot Dispatch',
    typeLabelKm: 'បញ្ញើសន្សំសំចៃសហគមន៍តាមស្រុក-ខណ្ឌ (Community Postal)',
    windowSpreadHours: 4,
    cutoffNoticeEn: 'Economical community dispatch via local district stations across 25 provinces.',
    cutoffNoticeKm: 'សេវាបញ្ញើសន្សំសំចៃទូទាំង ២៥ ខេត្ត-ក្រុង ឆ្លងកាត់ទីស្នាក់ការសហគមន៍ប្រចាំស្រុក។',
    targetHourWindowStart: 11, // ~11:00 AM in 2 days
  },
  'cam-freight-express': {
    speedTier: 'bulk_freight',
    transitHours: 28,
    typeLabelEn: 'Heavy Freight & Domestic Logistics Dispatch',
    typeLabelKm: 'សេវាបញ្ញើទំនិញធុនធ្ងន់ និងឥវ៉ាន់ដុំ (Heavy Freight)',
    windowSpreadHours: 3,
    cutoffNoticeEn: 'Optimized for commercial parcels, agricultural produce & heavy freight dispatch.',
    cutoffNoticeKm: 'សម្រិតសម្រាំងសម្រាប់ទំនិញធុនធ្ងន់ កសិផល និងឥវ៉ាន់លក់ដុំទូទាំងប្រទេស។',
    targetHourWindowStart: 13, // ~1:00 PM
  },
  'cam-cold-chain': {
    speedTier: 'same_day_van',
    transitHours: 5.0,
    typeLabelEn: 'Cold-Chain & Fresh Agriculture Transport',
    typeLabelKm: 'សេវាដឹកជញ្ជូនត្រជាក់ បន្លែ ផ្លែឈើ និងម្ហូបស្រស់ (Cold-Chain)',
    windowSpreadHours: 1.5,
    cutoffNoticeEn: 'Temperature-controlled transport keeping farm produce and fresh meals fresh.',
    cutoffNoticeKm: 'ធានារក្សាសីតុណ្ហភាពត្រជាក់ ជួយកសិករ និងអ្នកលក់ម្ហូបស្រស់ទូទាំងខេត្ត-ក្រុង។',
    targetHourWindowStart: 15,
  },
  // Backward compatibility aliases
  'vet-express': {
    speedTier: 'same_day_van',
    transitHours: 6.5,
    typeLabelEn: 'Cambodia Inter-Provincial Van Express',
    typeLabelKm: 'បណ្តាញឡានវ៉ែនអន្តរខេត្ត (ចេញរៀងរាល់ ២ ម៉ោង)',
    windowSpreadHours: 2,
    cutoffNoticeEn: 'Departs continuously with van network. Morning booking arrives same-day afternoon.',
    cutoffNoticeKm: 'ឡានវ៉ែនចេញដំណើរជាប់ជាប្រចាំ។ ផ្ញើពេលព្រឹក ឥវ៉ាន់នឹងទៅដល់នៅរសៀលថ្ងៃដដែល។',
    targetHourWindowStart: 16,
  },
  'jt-express': {
    speedTier: 'door_to_door_standard',
    transitHours: 24,
    typeLabelEn: 'Direct Door-to-Door Standard Dispatch',
    typeLabelKm: 'សេវាដឹកដល់មាត់ទ្វារផ្ទះទូទាំងប្រទេស (Door-to-Door)',
    windowSpreadHours: 3,
    cutoffNoticeEn: 'Direct community driver network. Next-day door-to-door delivery with 0% platform fee.',
    cutoffNoticeKm: 'បណ្តាញអ្នកដឹកសហគមន៍ផ្ទាល់ ចែកចាយដល់មាត់ទ្វារផ្ទះនៅរសៀលស្អែកដោយឥតកាត់ថ្លៃសេវា។',
    targetHourWindowStart: 14,
  },
  'kex-express': {
    speedTier: 'priority_ecommerce',
    transitHours: 20,
    typeLabelEn: 'Priority Next-Morning E-Commerce Dispatch',
    typeLabelKm: 'សេវាអាទិភាពព្រឹកស្អែកសម្រាប់អ្នកលក់អនឡាញ (Priority Morning)',
    windowSpreadHours: 2.5,
    cutoffNoticeEn: 'Priority delivery window. Arrives next morning between 09:30 AM - 12:00 PM.',
    cutoffNoticeKm: 'សេវាអាទិភាពខ្ពស់ មកដល់នៅព្រឹកស្អែកចន្លោះម៉ោង ០៩:៣០ ព្រឹក ដល់ ១២:០០ ថ្ងៃត្រង់។',
    targetHourWindowStart: 10,
  },
  'cambodia-post': {
    speedTier: 'postal_ems',
    transitHours: 36,
    typeLabelEn: 'Community Postal & Regional Depot Dispatch',
    typeLabelKm: 'បញ្ញើសន្សំសំចៃសហគមន៍តាមស្រុក-ខណ្ឌ (Community Postal)',
    windowSpreadHours: 4,
    cutoffNoticeEn: 'Economical community dispatch via local district stations across 25 provinces.',
    cutoffNoticeKm: 'សេវាបញ្ញើសន្សំសំចៃទូទាំង ២៥ ខេត្ត-ក្រុង ឆ្លងកាត់ទីស្នាក់ការសហគមន៍ប្រចាំស្រុក។',
    targetHourWindowStart: 11,
  },
  'zto-express': {
    speedTier: 'bulk_freight',
    transitHours: 28,
    typeLabelEn: 'Heavy Freight & Domestic Logistics Dispatch',
    typeLabelKm: 'សេវាបញ្ញើទំនិញធុនធ្ងន់ និងឥវ៉ាន់ដុំ (Heavy Freight)',
    windowSpreadHours: 3,
    cutoffNoticeEn: 'Optimized for commercial parcels, agricultural produce & heavy freight dispatch.',
    cutoffNoticeKm: 'សម្រិតសម្រាំងសម្រាប់ទំនិញធុនធ្ងន់ កសិផល និងឥវ៉ាន់លក់ដុំទូទាំងប្រទេស។',
    targetHourWindowStart: 13,
  },
  'instant': {
    speedTier: 'instant_express',
    transitHours: 0.75, // 45 mins
    typeLabelEn: 'Instant On-Demand Courier',
    typeLabelKm: 'សេវាដឹកជញ្ជូនបន្ទាន់ ៣០ - ៤៥ នាទី',
    windowSpreadHours: 0.5,
    cutoffNoticeEn: 'Direct rider delivery within the city.',
    cutoffNoticeKm: 'អ្នកដឹកជញ្ជូនផ្ទាល់ដឹកភ្លាមៗក្នុងក្រុង។',
  },
};

/**
 * Calculate Estimated Delivery Schedule based on courier type, dispatch time, and route
 */
export function calculateEstimatedDeliverySchedule(
  carrierId: string,
  dispatchedTimeStr?: string,
  originCity?: string,
  destinationCity?: string
): EstimatedDeliverySchedule {
  const config = COURIER_CONFIGS[carrierId] || COURIER_CONFIGS['jt-express'];
  
  // Base dispatch date
  const dispatchDate = dispatchedTimeStr ? new Date(dispatchedTimeStr) : new Date();
  if (isNaN(dispatchDate.getTime())) {
    // fallback to current time
    dispatchDate.setTime(Date.now());
  }

  // Adjust transit hours if origin & destination are same province vs far provinces
  let adjustedTransitHours = config.transitHours;
  if (originCity && destinationCity) {
    const isLocal = originCity.toLowerCase().includes('phnom penh') && destinationCity.toLowerCase().includes('phnom penh');
    const isSameProvince = originCity.toLowerCase() === destinationCity.toLowerCase();
    if (isLocal) {
      adjustedTransitHours = Math.max(2, Math.round(config.transitHours * 0.4));
    } else if (isSameProvince) {
      adjustedTransitHours = Math.max(3, Math.round(config.transitHours * 0.6));
    }
  }

  // Calculate target arrival date
  const arrivalDate = new Date(dispatchDate.getTime() + adjustedTransitHours * 3600 * 1000);

  // If carrier has a target daytime window (avoid delivering at 2 AM)
  if (arrivalDate.getHours() < 8) {
    arrivalDate.setHours(8 + Math.floor(Math.random() * 2), 30, 0, 0);
  } else if (arrivalDate.getHours() > 19) {
    // push to next morning 9 AM
    arrivalDate.setDate(arrivalDate.getDate() + 1);
    arrivalDate.setHours(9, 30, 0, 0);
  }

  // Calculate time window (e.g. arrivalDate to arrivalDate + windowSpreadHours)
  const windowEndDate = new Date(arrivalDate.getTime() + (config.windowSpreadHours || 2) * 3600 * 1000);

  const formattedDateEn = formatEnglishDate(arrivalDate);
  const formattedDateKm = formatKhmerDate(arrivalDate);

  const timeStartEn = formatEnglishTime(arrivalDate);
  const timeEndEn = formatEnglishTime(windowEndDate);
  const formattedTimeWindowEn = `${timeStartEn} - ${timeEndEn}`;

  const timeStartKm = formatKhmerTime(arrivalDate);
  const timeEndKm = formatKhmerTime(windowEndDate);
  const formattedTimeWindowKm = `${timeStartKm} ដល់ ${timeEndKm}`;

  const now = Date.now();
  const hoursRemaining = Math.max(0, Number(((arrivalDate.getTime() - now) / (1000 * 3600)).toFixed(1)));

  return {
    dispatchedAtISO: dispatchDate.toISOString(),
    estimatedArrivalISO: arrivalDate.toISOString(),
    formattedDate: formattedDateEn,
    formattedDateKm: formattedDateKm,
    formattedTimeWindow: formattedTimeWindowEn,
    formattedTimeWindowKm: formattedTimeWindowKm,
    transitDurationHours: adjustedTransitHours,
    courierSpeedTier: config.speedTier,
    courierTypeLabel: config.typeLabelEn,
    courierTypeLabelKm: config.typeLabelKm,
    dispatchCutoffNotice: config.cutoffNoticeEn,
    dispatchCutoffNoticeKm: config.cutoffNoticeKm,
    hoursRemaining,
  };
}
