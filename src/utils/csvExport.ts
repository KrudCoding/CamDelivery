import { MonthlyDeliveryHistoryItem, Language, Currency } from '../types';

export interface CsvExportOptions {
  monthKey?: string; // 'all' or specific month like '2026-09'
  language?: Language;
  currency?: Currency;
}

/**
 * Escapes a single CSV value according to RFC 4180:
 * Wraps values containing commas, double quotes, or newlines in double quotes,
 * and escapes internal double quotes by doubling them.
 */
function escapeCsvValue(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of MonthlyDeliveryHistoryItem records into a formatted CSV string.
 * Prepends UTF-8 Byte Order Mark (\uFEFF) so Excel and spreadsheet applications
 * natively parse Khmer, English, and Unicode characters without garbled text.
 */
export function generateDeliveryHistoryCsv(
  items: MonthlyDeliveryHistoryItem[],
  options: CsvExportOptions = {}
): string {
  const isKm = options.language === 'km';

  // Define CSV Header Columns
  const headers = isKm
    ? [
        'លេខកូដប័ណ្ណ (Tracking Number)',
        'កាលបរិច្ឆេទ (Date & Time)',
        'ខែ (Month)',
        'ក្រុមហ៊ុនដឹកជញ្ជូន (Carrier)',
        'ទីតាំងផ្ញើ (Origin)',
        'ទីតាំងទទួល (Destination)',
        'អ្នកទទួល (Recipient Name)',
        'លេខទូរស័ព្ទ (Recipient Phone)',
        'ប្រភេទទំនិញ (Package Type)',
        'ទម្ងន់ គ.ក (Weight kg)',
        'ថ្លៃដឹកជញ្ជូន ៛ (Shipping Fee KHR)',
        'ថ្លៃដឹកជញ្ជូន $ (Shipping Fee USD)',
        'ប្រាក់ប្រមូលជំនួស ៛ (COD KHR)',
        'ប្រាក់ប្រមូលជំនួស $ (COD USD)',
        'ស្ថានភាព (Status)',
        'មធ្យោបាយទូទាត់ (Payment Method)',
        'ធនាគារទូទាត់ (Paid Via Bank)',
        'លេខយោងប័ណ្ណ (Waybill Ref)',
      ]
    : [
        'Tracking Number',
        'Date & Time',
        'Month Period',
        'Carrier Name',
        'Origin City',
        'Destination City',
        'Recipient Name',
        'Recipient Phone',
        'Package Type',
        'Weight (kg)',
        'Shipping Fee (KHR)',
        'Shipping Fee (USD)',
        'COD Amount (KHR)',
        'COD Amount (USD)',
        'Delivery Status',
        'Payment Method',
        'Settled Bank',
        'Waybill Reference',
      ];

  // Map each item to CSV row
  const rows = items.map((item) => {
    return [
      escapeCsvValue(item.trackingNumber),
      escapeCsvValue(item.date),
      escapeCsvValue(item.monthKey),
      escapeCsvValue(isKm ? item.carrierNameKm : item.carrierName),
      escapeCsvValue(isKm ? item.originKm : item.origin),
      escapeCsvValue(isKm ? item.destinationKm : item.destination),
      escapeCsvValue(item.recipientName),
      escapeCsvValue(item.recipientPhone),
      escapeCsvValue(isKm ? item.packageTypeKm : item.packageType),
      escapeCsvValue(item.weightKg),
      escapeCsvValue(item.shippingFeeKHR),
      escapeCsvValue(item.shippingFeeUSD),
      escapeCsvValue(item.codAmountKHR || 0),
      escapeCsvValue(item.codAmountUSD || 0),
      escapeCsvValue(item.status === 'delivered' ? (isKm ? 'បានប្រគល់' : 'Delivered') : (isKm ? 'កំពុងដឹក' : 'In-Transit')),
      escapeCsvValue(isKm ? item.paymentMethodKm : item.paymentMethod),
      escapeCsvValue(item.paidViaBank || 'Bakong KHQR'),
      escapeCsvValue(item.waybillRef),
    ].join(',');
  });

  // Calculate Summary Totals Row
  const totalShippingKHR = items.reduce((acc, i) => acc + i.shippingFeeKHR, 0);
  const totalShippingUSD = items.reduce((acc, i) => acc + i.shippingFeeUSD, 0);
  const totalCodKHR = items.reduce((acc, i) => acc + (i.codAmountKHR || 0), 0);
  const totalCodUSD = items.reduce((acc, i) => acc + (i.codAmountUSD || 0), 0);

  const summaryRow = [
    escapeCsvValue(isKm ? 'សរុបទាំងអស់ (TOTAL)' : 'TOTAL SUMMARY'),
    escapeCsvValue(`${items.length} shipments`),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    escapeCsvValue(totalShippingKHR),
    escapeCsvValue(totalShippingUSD),
    escapeCsvValue(totalCodKHR),
    escapeCsvValue(totalCodUSD),
    '',
    '',
    '',
    '',
  ].join(',');

  // UTF-8 BOM (\uFEFF) ensures proper rendering in Microsoft Excel, Apple Numbers & Google Sheets
  return '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\r\n');
}

/**
 * Generates and triggers browser download of the delivery history CSV file.
 */
export function downloadDeliveryHistoryCsv(
  items: MonthlyDeliveryHistoryItem[],
  filenamePrefix = 'Delivery-History',
  options: CsvExportOptions = {}
): void {
  const csvContent = generateDeliveryHistoryCsv(items, options);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  const dateStr = new Date().toISOString().slice(0, 10);
  const monthTag = options.monthKey && options.monthKey !== 'all' ? `-${options.monthKey}` : '-Q3-2026';
  link.setAttribute('download', `${filenamePrefix}${monthTag}-${dateStr}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
