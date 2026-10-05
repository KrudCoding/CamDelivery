import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  ShieldCheck,
  X,
  Package,
  ArrowDownToLine,
  Check,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Language, Currency, UserAccountProfile, MonthlyDeliveryHistoryItem } from '../types';
import { MONTHLY_DELIVERY_HISTORY } from '../data/deliveryHistory';
import { downloadDeliveryHistoryCsv } from '../utils/csvExport';
import { downloadDeliveryHistoryPdf } from '../utils/pdfExport';

interface DownloadMyActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserAccountProfile;
  language: Language;
  currency: Currency;
  onNotify?: (msg: string) => void;
}

export const DownloadMyActivityModal: React.FC<DownloadMyActivityModalProps> = ({
  isOpen,
  onClose,
  profile,
  language,
  currency,
  onNotify,
}) => {
  const isKm = language === 'km';

  // Export Configuration State
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all'); // 'all', '2026-09', '2026-08', '2026-07'
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'cod'>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Filter deliveries according to selected options
  const filteredDeliveries = useMemo(() => {
    return MONTHLY_DELIVERY_HISTORY.filter((item) => {
      // Month filter
      if (selectedPeriod !== 'all') {
        const itemMonth = item.date.slice(0, 7);
        if (itemMonth !== selectedPeriod) return false;
      }

      // Status filter
      if (statusFilter === 'delivered') {
        if (item.status !== 'delivered' && item.status !== 'completed') return false;
      } else if (statusFilter === 'cod') {
        if (!item.codAmountKHR || item.codAmountKHR <= 0) return false;
      }

      return true;
    });
  }, [selectedPeriod, statusFilter]);

  // Aggregate stats
  const totalShipments = filteredDeliveries.length;
  const totalShippingFeeKHR = filteredDeliveries.reduce((sum, d) => sum + d.shippingFeeKHR, 0);
  const totalShippingFeeUSD = filteredDeliveries.reduce((sum, d) => sum + d.shippingFeeUSD, 0);
  const totalCodKHR = filteredDeliveries.reduce((sum, d) => sum + (d.codAmountKHR || 0), 0);
  const totalCodUSD = filteredDeliveries.reduce((sum, d) => sum + (d.codAmountUSD || 0), 0);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      if (exportFormat === 'csv') {
        downloadDeliveryHistoryCsv(filteredDeliveries, 'CamDelivery-My-Activity', {
          monthKey: selectedPeriod,
          language,
          currency,
        });
      } else {
        const monthLabel =
          selectedPeriod === 'all'
            ? (isKm ? 'ប្រវត្តិទាំងអស់ (All-Time)' : 'All-Time Activity')
            : selectedPeriod === '2026-09'
            ? (isKm ? 'កញ្ញា ២០២៦' : 'September 2026')
            : selectedPeriod === '2026-08'
            ? (isKm ? 'សីហា ២០២៦' : 'August 2026')
            : (isKm ? 'កក្កដា ២០២៦' : 'July 2026');

        downloadDeliveryHistoryPdf({
          profile,
          monthKey: selectedPeriod,
          monthName: monthLabel,
          deliveries: filteredDeliveries,
          language,
          currency,
          includeKpiSummary: true,
          includeBankDetails: true,
          includeTaxStamp: true,
        });
      }

      setExportSuccess(true);
      if (onNotify) {
        onNotify(
          isKm
            ? `បានទាញយកឯកសារ ${exportFormat.toUpperCase()} កំណត់ត្រាសកម្មភាពជោគជ័យ!`
            : `Successfully downloaded your delivery activity ${exportFormat.toUpperCase()} file!`
        );
      }

      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    } catch (err) {
      console.error('Error during activity export:', err);
      setIsExporting(false);
      if (onNotify) {
        onNotify(isKm ? 'មានបញ្ហាក្នុងការបង្កើតឯកសារ' : 'Error generating activity file');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-emerald-600/25">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  {isKm ? 'ទាញយកប្រវត្តិសកម្មភាព (Download My Activity)' : 'Download My Activity Records'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  CSV • PDF
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKm
                  ? 'ទាញយករបាយការណ៍ដឹកជញ្ជូន និងចំណាយផ្ទាល់ខ្លួន សម្រាប់ទុកជាឯកសារយោង'
                  : 'Export your parcel shipments & courier history as CSV or PDF for personal records.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Format Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            {isKm ? '១. ទម្រង់ឯកសារ (Export Format)' : '1. Choose File Format'}
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* CSV Option */}
            <div
              onClick={() => setExportFormat('csv')}
              className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                exportFormat === 'csv'
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                exportFormat === 'csv' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block">
                  CSV (.csv)
                </span>
                <span className="text-[10px] text-slate-500">
                  Excel, Sheets, Data
                </span>
              </div>
            </div>

            {/* PDF Option */}
            <div
              onClick={() => setExportFormat('pdf')}
              className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                exportFormat === 'pdf'
                  ? 'bg-rose-50/80 border-rose-500 shadow-xs ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                exportFormat === 'pdf' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block">
                  PDF (.pdf)
                </span>
                <span className="text-[10px] text-slate-500">
                  Printable Statement
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Timeframe Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isKm ? '២. រយៈពេលកាលបរិច្ឆេទ (Time Period)' : '2. Time Period'}</span>
          </label>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{isKm ? 'ប្រវត្តិទាំងអស់ (All-Time Activity - Full Records)' : 'All-Time Activity (Full Archive)'}</option>
            <option value="2026-09">{isKm ? 'ខែកញ្ញា ២០២៦ (September 2026)' : 'September 2026 (Recent Month)'}</option>
            <option value="2026-08">{isKm ? 'ខែសីហា ២០២៦ (August 2026)' : 'August 2026'}</option>
            <option value="2026-07">{isKm ? 'ខែកក្កដា ២០២៦ (July 2026)' : 'July 2026'}</option>
          </select>
        </div>

        {/* 3. Activity Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>{isKm ? '៣. ប្រភេទសកម្មភាព (Shipment Type)' : '3. Filter Shipments'}</span>
          </label>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', labelEn: 'All Activity', labelKm: 'ទាំងអស់' },
              { id: 'delivered', labelEn: 'Delivered Only', labelKm: 'ដឹកជោគជ័យ' },
              { id: 'cod', labelEn: 'With COD Only', labelKm: 'មានប្រាក់ COD' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isKm ? f.labelKm : f.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Live Records Preview Metrics Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {isKm ? 'ចំនួនកំណត់ត្រានឹងទាញយក៖' : 'Matched Activity Records:'}
            </span>
            <span className="font-mono font-black text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
              {totalShipments} {isKm ? 'ជើងដឹក' : 'shipments'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">
                {isKm ? 'ថ្លៃដឹកសរុប (Shipping Spend):' : 'Total Shipping Cost:'}
              </span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {currency === 'KHR' ? `${totalShippingFeeKHR.toLocaleString()} ៛` : `$${totalShippingFeeUSD.toFixed(2)}`}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-medium">
                {isKm ? 'ប្រាក់ COD ប្រមូល (COD Collected):' : 'Total COD Handled:'}
              </span>
              <span className="font-mono font-bold text-emerald-700 text-xs">
                {currency === 'KHR' ? `${totalCodKHR.toLocaleString()} ៛` : `$${totalCodUSD.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Reassurance Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {isKm
              ? 'ឯកសាររួមបញ្ចូលលេខយោងប័ណ្ណផ្លូវការ ធានាភាពត្រឹមត្រូវ ១០០% សម្រាប់គណនេយ្យ'
              : 'Files include official waybill references and Bakong transaction refs for accounting.'}
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            {isKm ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting || totalShipments === 0}
            className={`px-5 py-2.5 rounded-xl text-white font-black text-xs transition flex items-center gap-2 shadow-md cursor-pointer ${
              exportFormat === 'csv'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            } ${totalShipments === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>
              {isExporting
                ? (isKm ? 'កំពុងបង្កើតឯកសារ...' : 'Generating...')
                : exportSuccess
                ? (isKm ? 'បានទាញយកជោគជ័យ!' : 'Downloaded!')
                : (isKm ? `ទាញយកឯកសារ ${exportFormat.toUpperCase()}` : `Download ${exportFormat.toUpperCase()}`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
