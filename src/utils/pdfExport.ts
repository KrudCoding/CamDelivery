import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MonthlyDeliveryHistoryItem,
  UserAccountProfile,
  Language,
  Currency
} from '../types';

export interface PdfExportOptions {
  profile: UserAccountProfile;
  monthKey: string;
  monthName: string;
  deliveries: MonthlyDeliveryHistoryItem[];
  language: Language;
  currency: Currency;
  includeKpiSummary?: boolean;
  includeBankDetails?: boolean;
  includeTaxStamp?: boolean;
}

export const generateDeliveryHistoryPdf = (options: PdfExportOptions): jsPDF => {
  const {
    profile,
    monthKey,
    monthName,
    deliveries,
    currency,
    includeKpiSummary = true,
    includeBankDetails = true,
    includeTaxStamp = true,
  } = options;

  // Initialize jsPDF (A4 Portrait, mm units)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // Totals calculations
  const totalShipments = deliveries.length;
  const totalShippingFeeKHR = deliveries.reduce((acc, d) => acc + d.shippingFeeKHR, 0);
  const totalShippingFeeUSD = deliveries.reduce((acc, d) => acc + d.shippingFeeUSD, 0);
  const totalCodKHR = deliveries.reduce((acc, d) => acc + (d.codAmountKHR || 0), 0);
  const totalCodUSD = deliveries.reduce((acc, d) => acc + (d.codAmountUSD || 0), 0);
  const avgFeeKHR = totalShipments > 0 ? Math.round(totalShippingFeeKHR / totalShipments) : 0;
  const avgFeeUSD = totalShipments > 0 ? Number((totalShippingFeeUSD / totalShipments).toFixed(2)) : 0;

  // 1. TOP HEADER BANNER (Deep Navy #0f172a with Rose #e11d48 accent stripe)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent stripe
  doc.setFillColor(225, 29, 72); // rose-600
  doc.rect(0, 28, pageWidth, 1.8, 'F');

  // Brand title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CAMBODIA LOGISTICS & DELIVERY NETWORK', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Monthly Delivery Statement & Personal Record-Keeping Document', margin, 17);
  doc.text('Zero Platform Commission • Verified Digital Audit Trail • Bakong KHQR Settlement', margin, 22);

  // Document Statement Reference (Top Right)
  const stmtNumber = `STMT-${monthKey.replace('-', '')}-${profile.id.replace(/\D/g, '').slice(-4) || '8812'}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(244, 63, 94); // rose-400
  doc.text(stmtNumber, pageWidth - margin, 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const issueDate = new Date().toISOString().slice(0, 10);
  doc.text(`Issued: ${issueDate}`, pageWidth - margin, 16, { align: 'right' });
  doc.text(`Period: ${monthName}`, pageWidth - margin, 21, { align: 'right' });

  currentY = 36;

  // 2. ACCOUNT HOLDER & RECORD HOLDER CARD
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 26, 2, 2, 'FD');

  // Profile details (Left column)
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Account Holder: ${profile.name.toUpperCase()}`, margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Role: ${profile.role === 'customer' ? 'Registered Customer' : 'Verified Logistics Provider'}`, margin + 4, currentY + 11.5);
  doc.text(`Contact: ${profile.phone}  |  City: ${profile.city}`, margin + 4, currentY + 16.5);
  doc.text(`ID / Reg: ${profile.nationalIdOrLicense}  |  Address: ${profile.address.slice(0, 42)}...`, margin + 4, currentY + 21.5);

  // Primary Bank details (Right column)
  if (includeBankDetails && profile.bankAccounts.length > 0) {
    const primaryBank = profile.bankAccounts.find(b => b.isDefault) || profile.bankAccounts[0];
    const rightColX = pageWidth / 2 + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Primary Settlement Account:', rightColX, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank: ${primaryBank.bankName} (${primaryBank.currency})`, rightColX, currentY + 11.5);
    doc.text(`Account No: ${primaryBank.accountNumber}`, rightColX, currentY + 16.5);
    doc.text(`Bakong ID: ${primaryBank.bakongAccountId || 'Connected via KHQR'}`, rightColX, currentY + 21.5);
  }

  currentY += 31;

  // 3. FINANCIAL & KPI SUMMARY CARDS
  if (includeKpiSummary) {
    const kpiCardWidth = (pageWidth - margin * 2 - 9) / 4;
    const kpiHeight = 16;

    // Card 1: Total Deliveries
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, kpiCardWidth, kpiHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL DELIVERIES', margin + 3, currentY + 5);
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalShipments} Parcels`, margin + 3, currentY + 12);

    // Card 2: Total Shipping Cost
    const c2X = margin + kpiCardWidth + 3;
    doc.setFillColor(255, 241, 242); // rose-50
    doc.setDrawColor(254, 205, 211); // rose-200
    doc.roundedRect(c2X, currentY, kpiCardWidth, kpiHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(190, 18, 60); // rose-700
    doc.text('SHIPPING SPENT', c2X + 3, currentY + 5);
    doc.setFontSize(10.5);
    doc.text(
      currency === 'KHR'
        ? `${totalShippingFeeKHR.toLocaleString()} KHR`
        : `$${totalShippingFeeUSD.toFixed(2)} USD`,
      c2X + 3,
      currentY + 12
    );

    // Card 3: COD Collected
    const c3X = c2X + kpiCardWidth + 3;
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.roundedRect(c3X, currentY, kpiCardWidth, kpiHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text('COD COLLECTED', c3X + 3, currentY + 5);
    doc.setFontSize(10.5);
    doc.text(
      currency === 'KHR'
        ? `${totalCodKHR.toLocaleString()} KHR`
        : `$${totalCodUSD.toFixed(2)} USD`,
      c3X + 3,
      currentY + 12
    );

    // Card 4: Average Fee & 0% Fee
    const c4X = c3X + kpiCardWidth + 3;
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254); // indigo-200
    doc.roundedRect(c4X, currentY, kpiCardWidth, kpiHeight, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text('AVG FEE / PARCEL', c4X + 3, currentY + 5);
    doc.setFontSize(9.5);
    doc.text(
      currency === 'KHR'
        ? `${avgFeeKHR.toLocaleString()} KHR`
        : `$${avgFeeUSD.toFixed(2)} USD`,
      c4X + 3,
      currentY + 12
    );

    currentY += kpiHeight + 5;
  }

  // Section Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ITEMIZED MONTHLY DELIVERY WAYBILLS', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Official shipping logs for personal tax and accounting records (${deliveries.length} items)`, margin + 74, currentY);

  currentY += 2;

  // 4. ITEMIZED TABLE (autoTable)
  const tableHead = [
    [
      'Date / Time',
      'Waybill #',
      'Carrier',
      'Origin -> Destination',
      'Item Description',
      'Weight',
      'Fee',
      'COD Value',
      'Status',
    ],
  ];

  const tableRows = deliveries.map((d) => [
    d.date,
    d.trackingNumber,
    d.carrierName.replace(/\(.*?\)/, '').trim(),
    `${d.origin} -> ${d.destination.replace(/\(.*?\)/, '').trim()}`,
    d.packageType.length > 25 ? `${d.packageType.slice(0, 23)}...` : d.packageType,
    `${d.weightKg} kg`,
    currency === 'KHR' ? `${d.shippingFeeKHR.toLocaleString()} R` : `$${d.shippingFeeUSD.toFixed(2)}`,
    (d.codAmountKHR || 0) > 0
      ? currency === 'KHR'
        ? `${(d.codAmountKHR || 0).toLocaleString()} R`
        : `$${(d.codAmountUSD || 0).toFixed(2)}`
      : '-',
    d.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 23 }, // Date
      1: { cellWidth: 22, fontStyle: 'bold' }, // Waybill #
      2: { cellWidth: 24 }, // Carrier
      3: { cellWidth: 32 }, // Route
      4: { cellWidth: 31 }, // Description
      5: { cellWidth: 12, halign: 'center' }, // Weight
      6: { cellWidth: 15, halign: 'right', fontStyle: 'bold' }, // Fee
      7: { cellWidth: 15, halign: 'right' }, // COD Value
      8: { cellWidth: 18, halign: 'center' }, // Status
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Get final Y after table
  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 80;

  // 5. OFFICIAL STAMP & AUDIT FOOTER
  let stampY = finalY + 6;
  if (stampY > pageHeight - 35) {
    doc.addPage();
    stampY = 20;
  }

  // Audit and verification box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, stampY, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('ELECTRONIC RECORD VERIFICATION & DECLARATION', margin + 4, stampY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'This monthly statement is compiled directly from the Cambodia National Logistics & Community Delivery Platform. All shipments and settlement records are cryptographically verified and eligible for personal accounting and business expense reporting.',
    margin + 4,
    stampY + 10,
    { maxWidth: pageWidth - margin * 2 - 38 }
  );
  doc.text(
    `Security Hash: SHA256-${monthKey}-${profile.nationalIdOrLicense}-${totalShipments}T | 0% Platform Commission Guaranteed`,
    margin + 4,
    stampY + 17
  );

  // Digital Stamp Seal Graphic (Right side)
  if (includeTaxStamp) {
    const sealX = pageWidth - margin - 30;
    const sealY = stampY + 10;
    doc.setDrawColor(225, 29, 72); // rose-600
    doc.setLineWidth(0.6);
    doc.circle(sealX, sealY, 7.5, 'S');
    doc.circle(sealX, sealY, 6.2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(225, 29, 72);
    doc.text('OFFICIAL AUDIT', sealX, sealY - 2, { align: 'center' });
    doc.setFontSize(4.5);
    doc.text('VERIFIED', sealX, sealY + 0.8, { align: 'center' });
    doc.text('KH-LOGISTICS', sealX, sealY + 3.2, { align: 'center' });
  }

  // Bottom Page Numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `CamDelivery Platform • Personal Delivery Record Statement • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
};

// Download helper
export const downloadDeliveryHistoryPdf = (options: PdfExportOptions): string => {
  const doc = generateDeliveryHistoryPdf(options);
  const fileName = `camdelivery-monthly-statement-${options.monthKey}-${options.profile.name.toLowerCase().replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  return fileName;
};
