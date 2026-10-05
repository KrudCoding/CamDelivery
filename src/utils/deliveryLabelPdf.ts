import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { TrackingItem, Language, Currency } from '../types';

export interface DeliveryLabelPdfOptions {
  shipment: TrackingItem;
  language: Language;
  currency: Currency;
  labelSize?: '4x6' | 'a4';
}

/**
 * Generates a high-resolution, printable PDF delivery label (standard 4x6 inch / 100mm x 150mm waybill)
 * with carrier branding, recipient & sender details, parcel specifications, COD status,
 * barcode, and scannable tracking QR code.
 */
export async function generateDeliveryLabelPdf(options: DeliveryLabelPdfOptions): Promise<jsPDF> {
  const { shipment, currency, labelSize = '4x6' } = options;

  // 4x6 inches is ~101.6mm x 152.4mm (we use 100mm x 150mm standard shipping label size)
  const isA4 = labelSize === 'a4';
  const width = isA4 ? 210 : 100;
  const height = isA4 ? 297 : 150;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : [width, height],
  });

  const margin = 5;
  const contentWidth = width - margin * 2;

  // Generate QR Code Data URL
  const qrPayload = JSON.stringify({
    tn: shipment.trackingNumber,
    carrier: shipment.carrierId,
    to: shipment.receiverName,
    city: shipment.receiverCity,
    phone: shipment.receiverPhone,
    app: 'CambodiaLogistics',
  });

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (e) {
    // Fallback simple tracking string
    qrDataUrl = await QRCode.toDataURL(shipment.trackingNumber, { margin: 1, width: 256 });
  }

  // Generate Sort Routing Code based on city
  const cityCodeMap: Record<string, string> = {
    'Phnom Penh': 'PNH',
    'Siem Reap': 'REP',
    'Battambang': 'BBM',
    'Preah Sihanouk': 'KOS',
    'Sihanoukville': 'KOS',
    'Kampot': 'KPT',
    'Kampong Cham': 'KCM',
    'Kandal': 'KDL',
    'Takeo': 'TKO',
    'Pursat': 'PST',
    'Svay Rieng': 'SVR',
    'Prey Veng': 'PVG',
    'Banteay Meanchey': 'BMC',
    'Kratie': 'KTI',
  };

  const toCityCode = cityCodeMap[shipment.receiverCity] || shipment.receiverCity.slice(0, 3).toUpperCase();
  const fromCityCode = cityCodeMap[shipment.senderCity] || shipment.senderCity.slice(0, 3).toUpperCase();
  const routingHubCode = `${toCityCode}-HUB-${shipment.trackingNumber.slice(-3)}`;

  // Outer Border
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, contentWidth, height - margin * 2);

  // 1. HEADER SECTION (Carrier Branding & Service Tier)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, contentWidth, 18, 'F');

  // Carrier Logo / Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(shipment.carrierName.toUpperCase(), margin + 3, margin + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('CAMBODIA DOMESTIC EXPRESS LOGISTICS • 25 PROVINCES', margin + 3, margin + 12);
  doc.text('0% Platform Commission • Bakong KHQR Verified', margin + 3, margin + 15.5);

  // Top Right Service Type Badge
  doc.setFillColor(225, 29, 72); // rose-600
  doc.roundedRect(width - margin - 28, margin + 3, 25, 12, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('EXPRESS', width - margin - 15.5, margin + 8, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('WAYBILL', width - margin - 15.5, margin + 12.5, { align: 'center' });

  // 2. ROUTING HUB & TRACKING CODE BAR
  let curY = margin + 18;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, curY, width - margin, curY);

  // Big Destination Hub Code
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, curY, contentWidth * 0.45, 14, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(routingHubCode, margin + 3, curY + 9);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`DEST: ${shipment.receiverCity.toUpperCase()}`, margin + 3, curY + 12.5);

  // Route Corridor (From -> To)
  doc.line(margin + contentWidth * 0.45, curY, margin + contentWidth * 0.45, curY + 14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${fromCityCode} ➔ ${toCityCode}`, margin + contentWidth * 0.48, curY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Transit: Standard Direct Van`, margin + contentWidth * 0.48, curY + 11.5);

  curY += 14;
  doc.line(margin, curY, width - margin, curY);

  // 3. BARCODE & TRACKING NUMBER STRIP
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, curY, contentWidth, 18, 'F');

  // Simulated Code-128 visual barcode pattern
  const barcodeX = margin + 4;
  const barcodeY = curY + 2.5;
  const barcodeW = contentWidth - 8;
  const barcodeH = 9;

  // Draw simulated barcode lines
  doc.setFillColor(15, 23, 42);
  const pattern = [2, 1, 3, 1, 1, 2, 4, 1, 2, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 3, 1, 1, 4, 1, 2, 2, 3, 1, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3, 2, 1, 3, 1, 2];
  let lineX = barcodeX;
  const unitW = barcodeW / 95;
  for (let i = 0; i < pattern.length; i++) {
    const w = pattern[i] * unitW;
    if (i % 2 === 0) {
      doc.rect(lineX, barcodeY, w, barcodeH, 'F');
    }
    lineX += w;
  }

  // Tracking Number text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`* ${shipment.trackingNumber} *`, width / 2, curY + 15, { align: 'center' });

  curY += 18;
  doc.line(margin, curY, width - margin, curY);

  // 4. RECIPIENT ("SHIP TO") SECTION - PROMINENT HIGH CONTRAST
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, curY, contentWidth, 32, 'F');

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 2.5, curY + 2, 16, 5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SHIP TO:', margin + 4, curY + 5.5);

  // Recipient Name
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(shipment.receiverName, margin + 22, curY + 6);

  // Recipient Phone (Big & highlighted)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(`TEL: ${shipment.receiverPhone}`, margin + 3, curY + 13);

  // Recipient City & Detailed Address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`City: ${shipment.receiverCity}`, margin + 3, curY + 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const deliveryAddress = `${shipment.receiverCity} Depot Delivery / Doorstep Drop-off`;
  doc.text(`Address: ${deliveryAddress}`, margin + 3, curY + 23);
  doc.text(`Dispatch Hub: ${shipment.receiverCity} Regional Parcel Station`, margin + 3, curY + 27.5);

  curY += 32;
  doc.line(margin, curY, width - margin, curY);

  // 5. SENDER ("FROM") SECTION
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, curY, contentWidth, 19, 'F');

  doc.setFillColor(100, 116, 139);
  doc.roundedRect(margin + 2.5, curY + 2, 14, 4.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('FROM:', margin + 4, curY + 5.2);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(shipment.senderName, margin + 19, curY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`TEL: ${shipment.senderPhone}  |  City: ${shipment.senderCity}`, margin + 3, curY + 10.5);
  doc.text(`Pickup Station: ${shipment.senderCity} Central Dispatch Hub`, margin + 3, curY + 14.5);

  curY += 19;
  doc.line(margin, curY, width - margin, curY);

  // 6. PARCEL DETAILS & QR CODE SPLIT SECTION
  const qrSectionHeight = 33;
  const qrBoxWidth = 32;

  // Left side: Parcel Specs & COD Box
  const specsWidth = contentWidth - qrBoxWidth;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, curY, specsWidth, qrSectionHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PARCEL INFORMATION', margin + 3, curY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Weight: ${shipment.weightKg} kg`, margin + 3, curY + 9.5);
  doc.text(`Type: ${shipment.packageType || 'Standard Parcel'}`, margin + 3, curY + 13.5);
  doc.text(`Delivery Fee: ${currency === 'KHR' ? `${shipment.totalPriceKHR.toLocaleString()} KHR` : `$${shipment.totalPriceUSD.toFixed(2)}`} (PAID)`, margin + 3, curY + 17.5);

  // COD Highlight Pill
  if (shipment.isCod && shipment.codAmountKHR > 0) {
    doc.setFillColor(254, 242, 242); // rose-50
    doc.setDrawColor(225, 29, 72); // rose-600
    doc.setLineWidth(0.5);
    doc.roundedRect(margin + 2, curY + 20, specsWidth - 4, 10, 1, 1, 'FD');
    doc.setTextColor(225, 29, 72);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('C.O.D. CASH ON DELIVERY', margin + 4, curY + 24.5);
    doc.setFontSize(9);
    doc.text(`${shipment.codAmountKHR.toLocaleString()} KHR ($${(shipment.codAmountKHR / 4000).toFixed(2)})`, margin + 4, curY + 28.5);
  } else {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setLineWidth(0.5);
    doc.roundedRect(margin + 2, curY + 20, specsWidth - 4, 10, 1, 1, 'FD');
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('NO C.O.D. • NO CASH DUE', margin + 4, curY + 24.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Deliver directly to recipient without collection', margin + 4, curY + 28.5);
  }

  // Right side: QR Code
  doc.line(margin + specsWidth, curY, margin + specsWidth, curY + qrSectionHeight);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + specsWidth, curY, qrBoxWidth, qrSectionHeight, 'F');

  // Add QR Code image
  if (qrDataUrl) {
    const qrSize = 25;
    const qrX = margin + specsWidth + (qrBoxWidth - qrSize) / 2;
    const qrY = curY + 2;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text('SCAN TO TRACK', margin + specsWidth + qrBoxWidth / 2, curY + 30, { align: 'center' });

  curY += qrSectionHeight;
  doc.line(margin, curY, width - margin, curY);

  // 7. FOOTER AUDIT & SECURITY NOTICE
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, curY, contentWidth, height - margin - curY, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  const printDate = new Date().toISOString().replace('T', ' ').slice(0, 19);
  doc.text(`Generated: ${printDate} | Cambodia Logistics Platform | Zero Middleman Commission`, margin + 3, curY + 4);
  doc.text(`Driver: ${shipment.driverName || 'Depot Courier Fleet'} (${shipment.driverPhone || '012 888 999'}) | Plate: ${shipment.driverPlate || '2AB-8829'}`, margin + 3, curY + 7.5);
  doc.text('Please verify parcel condition upon receipt. For live tracking, scan QR code with any smartphone camera.', margin + 3, curY + 11);

  return doc;
}

/**
 * Downloads the generated PDF label directly to the user's browser.
 */
export async function downloadDeliveryLabelPdf(options: DeliveryLabelPdfOptions): Promise<void> {
  const doc = await generateDeliveryLabelPdf(options);
  const fileName = `DeliveryLabel-${options.shipment.trackingNumber}.pdf`;
  doc.save(fileName);
}
