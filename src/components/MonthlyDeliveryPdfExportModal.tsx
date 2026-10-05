import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Building2,
  User,
  CreditCard,
  QrCode,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Info,
  ChevronDown
} from 'lucide-react';
import {
  Language,
  Currency,
  UserAccountProfile,
  MonthlyDeliveryHistoryItem
} from '../types';
import { MONTHLY_DELIVERY_HISTORY } from '../data/deliveryHistory';
import { downloadDeliveryHistoryPdf } from '../utils/pdfExport';

interface MonthlyDeliveryPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserAccountProfile;
  language: Language;
  currency: Currency;
  initialMonth?: string;
  onNotify?: (message: string) => void;
}

export const MonthlyDeliveryPdfExportModal: React.FC<MonthlyDeliveryPdfExportModalProps> = ({
  isOpen,
  onClose,
  profile,
  language,
  currency,
  initialMonth = '2026-09',
  onNotify,
}) => {
  const isKm = language === 'km';

  // Selection states
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'in_transit'>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');

  // PDF Document Customization Options
  const [includeKpiSummary, setIncludeKpiSummary] = useState(true);
  const [includeBankDetails, setIncludeBankDetails] = useState(true);
  const [includeTaxStamp, setIncludeTaxStamp] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Month Display Mapping
  const monthLabels: Record<string, { en: string; km: string }> = {
    '2026-09': { en: 'September 2026 (Current)', km: 'កញ្ញា ២០២៦ (ខែនេះ)' },
    '2026-08': { en: 'August 2026', km: 'សីហា ២០២៦' },
    '2026-07': { en: 'July 2026', km: 'កក្កដា ២០២៦' },
    all: { en: 'All Recent Months (Q3 2026)', km: 'គ្រប់ខែទាំងអស់ (ត្រីមាសទី៣ ២០២៦)' },
  };

  // Filter deliveries according to selections
  const filteredDeliveries = useMemo(() => {
    return MONTHLY_DELIVERY_HISTORY.filter((item) => {
      // Month match
      if (selectedMonth !== 'all' && item.monthKey !== selectedMonth) {
        return false;
      }
      // Status match
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Carrier match
      if (carrierFilter !== 'all' && item.carrierId !== carrierFilter) {
        return false;
      }
      return true;
    });
  }, [selectedMonth, statusFilter, carrierFilter]);

  // Aggregate statistics
  const totalDeliveries = filteredDeliveries.length;
  const totalSpentKHR = filteredDeliveries.reduce((sum, d) => sum + d.shippingFeeKHR, 0);
  const totalSpentUSD = filteredDeliveries.reduce((sum, d) => sum + d.shippingFeeUSD, 0);
  const totalCodKHR = filteredDeliveries.reduce((sum, d) => sum + (d.codAmountKHR || 0), 0);
  const totalCodUSD = filteredDeliveries.reduce((sum, d) => sum + (d.codAmountUSD || 0), 0);
  const avgCostKHR = totalDeliveries > 0 ? Math.round(totalSpentKHR / totalDeliveries) : 0;
  const avgCostUSD = totalDeliveries > 0 ? Number((totalSpentUSD / totalDeliveries).toFixed(2)) : 0;

  const currentMonthName = monthLabels[selectedMonth]
    ? isKm ? monthLabels[selectedMonth].km : monthLabels[selectedMonth].en
    : selectedMonth;

  // Format currency
  const formatMoney = (khr: number, usd: number) => {
    if (currency === 'KHR') {
      return `${khr.toLocaleString()} ៛`;
    }
    return `$${usd.toFixed(2)}`;
  };

  // Unique carriers in dataset
  const uniqueCarriers = useMemo(() => {
    const map = new Map<string, string>();
    MONTHLY_DELIVERY_HISTORY.forEach((item) => {
      if (!map.has(item.carrierId)) {
        map.set(item.carrierId, isKm ? item.carrierNameKm : item.carrierName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [isKm]);

  // Handle PDF Export and Download
  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      const fileName = downloadDeliveryHistoryPdf({
        profile,
        monthKey: selectedMonth,
        monthName: monthLabels[selectedMonth]?.en || selectedMonth,
        deliveries: filteredDeliveries,
        language,
        currency,
        includeKpiSummary,
        includeBankDetails,
        includeTaxStamp,
      });

      const notifyMsg = isKm
        ? `បានទាញយកឯកសារ PDF ថ្លៃដឹកជញ្ជូនប្រចាំខែ "${fileName}" ដោយជោគជ័យ!`
        : `Downloaded monthly delivery PDF statement "${fileName}" successfully!`;

      if (onNotify) onNotify(notifyMsg);
    } catch (err) {
      console.error('PDF export error:', err);
      if (onNotify) {
        onNotify(isKm ? 'មានបញ្ហាក្នុងការទាញយក PDF' : 'Error generating PDF document');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Browser Native Print / Save to PDF
  const handlePrint = () => {
    window.print();
  };

  // Copy scannable summary text
  const handleCopySummary = () => {
    const summaryText = `[CAMDELIVERY] Monthly Statement (${currentMonthName})
Account: ${profile.name} (${profile.phone})
Total Deliveries: ${totalDeliveries} Parcels
Shipping Cost: ${formatMoney(totalSpentKHR, totalSpentUSD)}
COD Collected: ${formatMoney(totalCodKHR, totalCodUSD)}
Average / Parcel: ${formatMoney(avgCostKHR, avgCostUSD)}
Platform Fee: 0% Free Community Guarantee
Settlement Bank: ${profile.bankAccounts[0]?.bankName || 'ABA'} (${profile.bankAccounts[0]?.accountNumber || '-'})`;

    navigator.clipboard.writeText(summaryText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (onNotify) {
      onNotify(isKm ? 'បានចម្លងសេចក្តីសង្ខេបរបាយការណ៍!' : 'Copied statement summary to clipboard!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* TOP MODAL HEADER */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isKm
                    ? 'ទាញយកប្រវត្តិដឹកជញ្ជូនប្រចាំខែជាឯកសារ PDF'
                    : 'Export Monthly Delivery History (PDF)'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  A4 Statement
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isKm
                  ? 'ឯកសារផ្លូវការសម្រាប់រក្សាទុកជាកំណត់ត្រាផ្ទាល់ខ្លួន (Personal Record-Keeping & Tax Audit)'
                  : 'Official document for personal record-keeping, accounting, and business expense verification'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition shrink-0"
          >
            ✕
          </button>
        </div>

        {/* CONTROLS BAR: Month Selector, Filters & Tabs */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Left: Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Month dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-xl font-bold bg-white border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs"
              >
                <option value="2026-09">{isKm ? 'កញ្ញា ២០២៦ (ខែនេះ)' : 'September 2026 (Current)'}</option>
                <option value="2026-08">{isKm ? 'សីហា ២០២៦' : 'August 2026'}</option>
                <option value="2026-07">{isKm ? 'កក្កដា ២០២៦' : 'July 2026'}</option>
                <option value="all">{isKm ? 'គ្រប់ខែទាំងអស់ (Q3 2026)' : 'All Recent Months (Q3)'}</option>
              </select>
            </div>

            {/* Carrier dropdown */}
            <div className="relative">
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="pl-3 pr-7 py-2 rounded-xl font-semibold bg-white border border-slate-300 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs"
              >
                <option value="all">{isKm ? 'គ្រប់ក្រុមហ៊ុនដឹក' : 'All Carriers'}</option>
                {uniqueCarriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === 'all'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isKm ? 'ទាំងអស់' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('delivered')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === 'delivered'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isKm ? 'ជោគជ័យ' : 'Delivered'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_transit')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === 'in_transit'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isKm ? 'កំពុងដឹក' : 'In-Transit'}
              </button>
            </div>
          </div>

          {/* Right: View Mode Toggle */}
          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isKm ? 'ផ្ទាំងមើលជាមុន (Preview)' : 'Document Preview'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isKm ? 'ជម្រើសឯកសារ' : 'Export Options'}</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-100/60">
          {activeTab === 'settings' ? (
            /* SETTINGS / CUSTOMIZATION TAB */
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isKm ? 'កំណត់ជម្រើសទម្រង់ឯកសារ PDF' : 'PDF Document Structure & Record-Keeping Settings'}</span>
              </h4>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={includeKpiSummary}
                    onChange={(e) => setIncludeKpiSummary(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {isKm ? 'បញ្ចូលតារាងសង្ខេបហិរញ្ញវត្ថុ & ចំនួនកញ្ចប់ (KPI Summary Cards)' : 'Include Financial & Shipment KPI Summary'}
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      {isKm
                        ? 'បង្ហាញសរុបថ្លៃដឹកជញ្ជូន, ប្រាក់ប្រមូលជំនួស (COD), និងថ្លៃដឹកជាមធ្យម'
                        : 'Displays total shipping expenses, COD amounts collected, and average fee per parcel'}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={includeBankDetails}
                    onChange={(e) => setIncludeBankDetails(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {isKm ? 'បង្ហាញព័ត៌មានគណនីធនាគារចម្បង & Bakong ID' : 'Include Primary Settlement Bank & Bakong Account ID'}
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      {isKm
                        ? 'សម្រាប់បញ្ជាក់គណនីទូទាត់ផ្លូវការ និងគណនីទទួលប្រាក់ត្រឡប់មកវិញ'
                        : 'Prints verified bank name, account number, and Bakong KHQR handle for audit cross-referencing'}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={includeTaxStamp}
                    onChange={(e) => setIncludeTaxStamp(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {isKm ? 'ត្រាឌីជីថលបញ្ជាក់ភាពត្រឹមត្រូវ (Digital Verification Stamp & SHA256)' : 'Digital Verification Seal & Audit Cryptographic Stamp'}
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      {isKm
                        ? 'ត្រាផ្លូវការនៃបណ្តាញដឹកជញ្ជូនសហគមន៍កម្ពុជា សម្រាប់ផ្ទៀងផ្ទាត់គណនេយ្យភាព'
                        : 'Official seal certifying 0% platform deductions and legitimate delivery waybills'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Record Summary Box */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs block">
                    {isKm ? 'ចំនួនកំណត់ត្រានឹងត្រូវទាញយក៖' : 'Ready to export:'}
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    {filteredDeliveries.length} {isKm ? 'កញ្ចប់ដឹកជញ្ជូន' : 'delivery shipments'} ({currentMonthName})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition"
                >
                  {isKm ? 'ត្រឡប់ទៅផ្ទាំងមើល' : 'Preview Document'}
                </button>
              </div>
            </div>
          ) : (
            /* LIVE DOCUMENT PREVIEW (Styled as authentic official A4 statement) */
            <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-5 sm:p-7 space-y-6 max-w-3xl mx-auto font-sans relative">
              {/* TOP HEADER SECTION */}
              <div className="border-b-2 border-rose-600 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                      CAMBODIA LOGISTICS & DELIVERY NETWORK
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {isKm
                      ? 'បណ្តាញដឹកជញ្ជូនសហគមន៍កម្ពុជា • របាយការណ៍បញ្ជាក់ការចំណាយប្រចាំខែ'
                      : 'Monthly Delivery History Statement & Personal Accounting Record'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    0% Platform Commission Guaranteed • Real-Time Bakong KHQR Settlement
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Statement No.</div>
                  <div className="font-mono text-xs font-black text-rose-600">
                    STMT-{selectedMonth.replace('-', '')}-{profile.nationalIdOrLicense.slice(-4) || '8812'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Period: <span className="font-bold text-slate-800">{currentMonthName}</span>
                  </div>
                </div>
              </div>

              {/* ACCOUNT HOLDER PROFILE SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/90 border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-600" />
                    <span>{isKm ? 'ម្ចាស់គណនី / អតិថិជន' : 'Account Holder Info'}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-1">
                    {isKm ? profile.nameKm : profile.name}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {profile.phone} • {isKm ? profile.cityKm : profile.city}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    ID: {profile.nationalIdOrLicense} • {profile.address}
                  </div>
                </div>

                {includeBankDetails && profile.bankAccounts.length > 0 && (
                  <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-rose-600" />
                      <span>{isKm ? 'គណនីធនាគារចម្បង' : 'Primary Settlement Bank'}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-1">
                      {profile.bankAccounts[0].bankName} ({profile.bankAccounts[0].currency})
                    </div>
                    <div className="font-mono text-slate-700 text-xs mt-0.5">
                      {profile.bankAccounts[0].accountNumber}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      Bakong ID: {profile.bankAccounts[0].bakongAccountId || 'Connected'}
                    </div>
                  </div>
                )}
              </div>

              {/* FINANCIAL & KPI SUMMARY CARDS */}
              {includeKpiSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {isKm ? 'សរុបកញ្ចប់' : 'Total Shipments'}
                    </span>
                    <span className="text-base font-black text-slate-900 mt-1 block">
                      {totalDeliveries} {isKm ? 'កញ្ចប់' : 'Parcels'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold uppercase text-rose-700 block">
                      {isKm ? 'សរុបថ្លៃដឹក' : 'Shipping Spent'}
                    </span>
                    <span className="text-base font-black text-rose-700 mt-1 block">
                      {formatMoney(totalSpentKHR, totalSpentUSD)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                      {isKm ? 'ប្រាក់ប្រមូល COD' : 'COD Collected'}
                    </span>
                    <span className="text-base font-black text-emerald-700 mt-1 block">
                      {formatMoney(totalCodKHR, totalCodUSD)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] font-bold uppercase text-indigo-700 block">
                      {isKm ? 'មធ្យម / កញ្ចប់' : 'Avg / Delivery'}
                    </span>
                    <span className="text-sm font-black text-indigo-900 mt-1 block">
                      {formatMoney(avgCostKHR, avgCostUSD)}
                    </span>
                  </div>
                </div>
              )}

              {/* ITEMIZED DELIVERY HISTORY TABLE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {isKm ? 'តារាងលម្អិតនៃប័ណ្ណដឹកជញ្ជូនប្រចាំខែ' : 'Itemized Delivery Waybill Log'}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {filteredDeliveries.length} {isKm ? 'កំណត់ត្រា' : 'records'}
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold">
                        <th className="p-2.5">{isKm ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                        <th className="p-2.5">{isKm ? 'លេខតាមដាន / Waybill' : 'Waybill #'}</th>
                        <th className="p-2.5">{isKm ? 'ក្រុមហ៊ុនដឹក' : 'Carrier'}</th>
                        <th className="p-2.5">{isKm ? 'ផ្លូវដឹកជញ្ជូន' : 'Route'}</th>
                        <th className="p-2.5">{isKm ? 'ប្រភេទទំនិញ' : 'Item Description'}</th>
                        <th className="p-2.5 text-right">{isKm ? 'ថ្លៃដឹក' : 'Fee'}</th>
                        <th className="p-2.5 text-center">{isKm ? 'ស្ថានភាព' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredDeliveries.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50 transition">
                          <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                            {d.date.slice(0, 10)}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {d.trackingNumber}
                          </td>
                          <td className="p-2.5 text-slate-700 whitespace-nowrap">
                            {isKm ? d.carrierNameKm.split('(')[0] : d.carrierName.split('(')[0]}
                          </td>
                          <td className="p-2.5 text-slate-700 whitespace-nowrap">
                            {isKm ? d.originKm : d.origin} ➔ {isKm ? d.destinationKm.split('(')[0] : d.destination.split('(')[0]}
                          </td>
                          <td className="p-2.5 text-slate-600 truncate max-w-[150px]">
                            {isKm ? d.packageTypeKm : d.packageType}
                          </td>
                          <td className="p-2.5 text-right font-black text-rose-700 whitespace-nowrap">
                            {currency === 'KHR' ? `${d.shippingFeeKHR.toLocaleString()} ៛` : `$${d.shippingFeeUSD.toFixed(2)}`}
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                d.status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {d.status === 'delivered' ? 'DELIVERED' : 'IN-TRANSIT'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FOOTER & OFFICIAL SEAL */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">
                    Cambodia Community Logistics Platform Declaration
                  </div>
                  <div className="text-[10px] text-slate-400">
                    All delivery logs are permanently preserved in local device cache & cryptographically verified.
                  </div>
                </div>

                {includeTaxStamp && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 shrink-0">
                    <ShieldCheck className="w-5 h-5 text-rose-600" />
                    <div className="text-left">
                      <div className="font-black text-[10px] uppercase">Official Audit Stamp</div>
                      <div className="text-[9px] text-rose-600 font-mono">VERIFIED • 0% COMMISSION</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {filteredDeliveries.length} {isKm ? 'កញ្ចប់ត្រូវបានជ្រើសរើស' : 'deliveries ready for PDF export'}
            </span>
            <span>•</span>
            <span className="text-slate-400">{currentMonthName}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Copy Summary */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? (isKm ? 'បានចម្លង' : 'Copied') : (isKm ? 'ចម្លងសេចក្តីសង្ខេប' : 'Copy Summary')}</span>
            </button>

            {/* Print / Save */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Print document or save using browser print to PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isKm ? 'បោះពុម្ព' : 'Print'}</span>
            </button>

            {/* Main Action: Download PDF Document */}
            <button
              type="button"
              disabled={isExporting || filteredDeliveries.length === 0}
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-50 text-white text-xs font-black transition flex items-center gap-2 shadow-md shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>
                {isExporting
                  ? (isKm ? 'កំពុងបង្កើត PDF...' : 'Generating PDF...')
                  : (isKm ? 'ទាញយកឯកសារ PDF (.pdf)' : 'Download PDF Document (.pdf)')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
