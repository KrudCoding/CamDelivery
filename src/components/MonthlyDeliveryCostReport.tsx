import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Download,
  Filter,
  DollarSign,
  PackageCheck,
  Truck,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { Language, Currency } from '../types';

interface MonthlyDeliveryCostReportProps {
  language: Language;
  currency: Currency;
  onNotify?: (message: string) => void;
  onOpenPdfExport?: (monthKey: string) => void;
}

interface MonthlyDataRecord {
  monthKey: string;
  monthNameEn: string;
  monthNameKm: string;
  totalSpentKHR: number;
  totalSpentUSD: number;
  shipmentCount: number;
  avgDeliveryKHR: number;
  avgDeliveryUSD: number;
  codCollectedKHR: number;
  codCollectedUSD: number;
  topCarrier: string;
  categories: {
    id: string;
    nameEn: string;
    nameKm: string;
    amountKHR: number;
    amountUSD: number;
    count: number;
    color: string;
  }[];
  weeklyBreakdown: {
    weekEn: string;
    weekKm: string;
    baseFeeKHR: number;
    baseFeeUSD: number;
    extraFeeKHR: number;
    extraFeeUSD: number;
    totalKHR: number;
    totalUSD: number;
    deliveries: number;
  }[];
  carrierShare: {
    carrier: string;
    packages: number;
    amountKHR: number;
    amountUSD: number;
    color: string;
  }[];
}

const MONTHLY_REPORTS: Record<string, MonthlyDataRecord> = {
  '2026-09': {
    monthKey: '2026-09',
    monthNameEn: 'September 2026 (Current)',
    monthNameKm: 'កញ្ញា ២០២៦ (ខែនេះ)',
    totalSpentKHR: 348000,
    totalSpentUSD: 87.0,
    shipmentCount: 46,
    avgDeliveryKHR: 7565,
    avgDeliveryUSD: 1.89,
    codCollectedKHR: 1850000,
    codCollectedUSD: 462.5,
    topCarrier: 'VET Express (Virak Buntham)',
    categories: [
      {
        id: 'ecommerce',
        nameEn: 'E-Commerce Parcels',
        nameKm: 'កញ្ចប់ទំនិញអនឡាញ (E-Commerce)',
        amountKHR: 146000,
        amountUSD: 36.5,
        count: 22,
        color: '#e11d48', // rose-600
      },
      {
        id: 'interprovincial',
        nameEn: 'Interprovincial Van Freight',
        nameKm: 'ផ្ញើឥវ៉ាន់អន្តរខេត្តតាមរថយន្តវ៉ែន',
        amountKHR: 98000,
        amountUSD: 24.5,
        count: 10,
        color: '#2563eb', // blue-600
      },
      {
        id: 'food_grocery',
        nameEn: 'Food & Fresh Produce',
        nameKm: 'ម្ហូបអាហារ & កសិផលស្រស់',
        amountKHR: 52000,
        amountUSD: 13.0,
        count: 8,
        color: '#059669', // emerald-600
      },
      {
        id: 'documents',
        nameEn: 'Express Documents & Letters',
        nameKm: 'ឯកសារបន្ទាន់ & លិខិតស្នាម',
        amountKHR: 32000,
        amountUSD: 8.0,
        count: 4,
        color: '#d97706', // amber-600
      },
      {
        id: 'fragile',
        nameEn: 'Fragile / High-Value Cargo',
        nameKm: 'ទំនិញងាយបែក & តម្លៃខ្ពស់',
        amountKHR: 20000,
        amountUSD: 5.0,
        count: 2,
        color: '#7c3aed', // violet-600
      },
    ],
    weeklyBreakdown: [
      {
        weekEn: 'Week 1 (Sep 1-7)',
        weekKm: 'សប្តាហ៍ទី១ (១-៧)',
        baseFeeKHR: 68000,
        baseFeeUSD: 17.0,
        extraFeeKHR: 14000,
        extraFeeUSD: 3.5,
        totalKHR: 82000,
        totalUSD: 20.5,
        deliveries: 11,
      },
      {
        weekEn: 'Week 2 (Sep 8-14)',
        weekKm: 'សប្តាហ៍ទី២ (៨-១៤)',
        baseFeeKHR: 74000,
        baseFeeUSD: 18.5,
        extraFeeKHR: 16000,
        extraFeeUSD: 4.0,
        totalKHR: 90000,
        totalUSD: 22.5,
        deliveries: 13,
      },
      {
        weekEn: 'Week 3 (Sep 15-21)',
        weekKm: 'សប្តាហ៍ទី៣ (១៥-២១)',
        baseFeeKHR: 84000,
        baseFeeUSD: 21.0,
        extraFeeKHR: 22000,
        extraFeeUSD: 5.5,
        totalKHR: 106000,
        totalUSD: 26.5,
        deliveries: 14,
      },
      {
        weekEn: 'Week 4 (Sep 22-30)',
        weekKm: 'សប្តាហ៍ទី៤ (២២-៣០)',
        baseFeeKHR: 56000,
        baseFeeUSD: 14.0,
        extraFeeKHR: 14000,
        extraFeeUSD: 3.5,
        totalKHR: 70000,
        totalUSD: 17.5,
        deliveries: 8,
      },
    ],
    carrierShare: [
      { carrier: 'VET Express', packages: 20, amountKHR: 152000, amountUSD: 38.0, color: '#f59e0b' },
      { carrier: 'J&T Express', packages: 14, amountKHR: 104000, amountUSD: 26.0, color: '#ef4444' },
      { carrier: 'Flash Express', packages: 7, amountKHR: 56000, amountUSD: 14.0, color: '#eab308' },
      { carrier: 'Capitol Express', packages: 5, amountKHR: 36000, amountUSD: 9.0, color: '#3b82f6' },
    ],
  },
  '2026-08': {
    monthKey: '2026-08',
    monthNameEn: 'August 2026',
    monthNameKm: 'សីហា ២០២៦',
    totalSpentKHR: 412000,
    totalSpentUSD: 103.0,
    shipmentCount: 54,
    avgDeliveryKHR: 7629,
    avgDeliveryUSD: 1.91,
    codCollectedKHR: 2310000,
    codCollectedUSD: 577.5,
    topCarrier: 'J&T Express Cambodia',
    categories: [
      {
        id: 'ecommerce',
        nameEn: 'E-Commerce Parcels',
        nameKm: 'កញ្ចប់ទំនិញអនឡាញ (E-Commerce)',
        amountKHR: 182000,
        amountUSD: 45.5,
        count: 27,
        color: '#e11d48',
      },
      {
        id: 'interprovincial',
        nameEn: 'Interprovincial Van Freight',
        nameKm: 'ផ្ញើឥវ៉ាន់អន្តរខេត្តតាមរថយន្តវ៉ែន',
        amountKHR: 116000,
        amountUSD: 29.0,
        count: 12,
        color: '#2563eb',
      },
      {
        id: 'food_grocery',
        nameEn: 'Food & Fresh Produce',
        nameKm: 'ម្ហូបអាហារ & កសិផលស្រស់',
        amountKHR: 60000,
        amountUSD: 15.0,
        count: 9,
        color: '#059669',
      },
      {
        id: 'documents',
        nameEn: 'Express Documents & Letters',
        nameKm: 'ឯកសារបន្ទាន់ & លិខិតស្នាម',
        amountKHR: 28000,
        amountUSD: 7.0,
        count: 4,
        color: '#d97706',
      },
      {
        id: 'fragile',
        nameEn: 'Fragile / High-Value Cargo',
        nameKm: 'ទំនិញងាយបែក & តម្លៃខ្ពស់',
        amountKHR: 26000,
        amountUSD: 6.5,
        count: 2,
        color: '#7c3aed',
      },
    ],
    weeklyBreakdown: [
      {
        weekEn: 'Week 1 (Aug 1-7)',
        weekKm: 'សប្តាហ៍ទី១ (១-៧)',
        baseFeeKHR: 80000,
        baseFeeUSD: 20.0,
        extraFeeKHR: 18000,
        extraFeeUSD: 4.5,
        totalKHR: 98000,
        totalUSD: 24.5,
        deliveries: 13,
      },
      {
        weekEn: 'Week 2 (Aug 8-14)',
        weekKm: 'សប្តាហ៍ទី២ (៨-១៤)',
        baseFeeKHR: 88000,
        baseFeeUSD: 22.0,
        extraFeeKHR: 20000,
        extraFeeUSD: 5.0,
        totalKHR: 108000,
        totalUSD: 27.0,
        deliveries: 15,
      },
      {
        weekEn: 'Week 3 (Aug 15-21)',
        weekKm: 'សប្តាហ៍ទី៣ (១៥-២១)',
        baseFeeKHR: 82000,
        baseFeeUSD: 20.5,
        extraFeeKHR: 18000,
        extraFeeUSD: 4.5,
        totalKHR: 100000,
        totalUSD: 25.0,
        deliveries: 12,
      },
      {
        weekEn: 'Week 4 (Aug 22-31)',
        weekKm: 'សប្តាហ៍ទី៤ (២២-៣១)',
        baseFeeKHR: 86000,
        baseFeeUSD: 21.5,
        extraFeeKHR: 20000,
        extraFeeUSD: 5.0,
        totalKHR: 106000,
        totalUSD: 26.5,
        deliveries: 14,
      },
    ],
    carrierShare: [
      { carrier: 'J&T Express', packages: 22, amountKHR: 168000, amountUSD: 42.0, color: '#ef4444' },
      { carrier: 'VET Express', packages: 18, amountKHR: 140000, amountUSD: 35.0, color: '#f59e0b' },
      { carrier: 'Capitol Express', packages: 8, amountKHR: 62000, amountUSD: 15.5, color: '#3b82f6' },
      { carrier: 'Flash Express', packages: 6, amountKHR: 42000, amountUSD: 10.5, color: '#eab308' },
    ],
  },
  '2026-07': {
    monthKey: '2026-07',
    monthNameEn: 'July 2026',
    monthNameKm: 'កក្កដា ២០២៦',
    totalSpentKHR: 295000,
    totalSpentUSD: 73.75,
    shipmentCount: 39,
    avgDeliveryKHR: 7564,
    avgDeliveryUSD: 1.89,
    codCollectedKHR: 1620000,
    codCollectedUSD: 405.0,
    topCarrier: 'VET Express (Virak Buntham)',
    categories: [
      {
        id: 'ecommerce',
        nameEn: 'E-Commerce Parcels',
        nameKm: 'កញ្ចប់ទំនិញអនឡាញ (E-Commerce)',
        amountKHR: 128000,
        amountUSD: 32.0,
        count: 18,
        color: '#e11d48',
      },
      {
        id: 'interprovincial',
        nameEn: 'Interprovincial Van Freight',
        nameKm: 'ផ្ញើឥវ៉ាន់អន្តរខេត្តតាមរថយន្តវ៉ែន',
        amountKHR: 84000,
        amountUSD: 21.0,
        count: 9,
        color: '#2563eb',
      },
      {
        id: 'food_grocery',
        nameEn: 'Food & Fresh Produce',
        nameKm: 'ម្ហូបអាហារ & កសិផលស្រស់',
        amountKHR: 46000,
        amountUSD: 11.5,
        count: 7,
        color: '#059669',
      },
      {
        id: 'documents',
        nameEn: 'Express Documents & Letters',
        nameKm: 'ឯកសារបន្ទាន់ & លិខិតស្នាម',
        amountKHR: 22000,
        amountUSD: 5.5,
        count: 3,
        color: '#d97706',
      },
      {
        id: 'fragile',
        nameEn: 'Fragile / High-Value Cargo',
        nameKm: 'ទំនិញងាយបែក & តម្លៃខ្ពស់',
        amountKHR: 15000,
        amountUSD: 3.75,
        count: 2,
        color: '#7c3aed',
      },
    ],
    weeklyBreakdown: [
      {
        weekEn: 'Week 1 (Jul 1-7)',
        weekKm: 'សប្តាហ៍ទី១ (១-៧)',
        baseFeeKHR: 62000,
        baseFeeUSD: 15.5,
        extraFeeKHR: 12000,
        extraFeeUSD: 3.0,
        totalKHR: 74000,
        totalUSD: 18.5,
        deliveries: 10,
      },
      {
        weekEn: 'Week 2 (Jul 8-14)',
        weekKm: 'សប្តាហ៍ទី២ (៨-១៤)',
        baseFeeKHR: 60000,
        baseFeeUSD: 15.0,
        extraFeeKHR: 11000,
        extraFeeUSD: 2.75,
        totalKHR: 71000,
        totalUSD: 17.75,
        deliveries: 9,
      },
      {
        weekEn: 'Week 3 (Jul 15-21)',
        weekKm: 'សប្តាហ៍ទី៣ (១៥-២១)',
        baseFeeKHR: 68000,
        baseFeeUSD: 17.0,
        extraFeeKHR: 13000,
        extraFeeUSD: 3.25,
        totalKHR: 81000,
        totalUSD: 20.25,
        deliveries: 11,
      },
      {
        weekEn: 'Week 4 (Jul 22-31)',
        weekKm: 'សប្តាហ៍ទី៤ (២២-៣១)',
        baseFeeKHR: 58000,
        baseFeeUSD: 14.5,
        extraFeeKHR: 11000,
        extraFeeUSD: 2.75,
        totalKHR: 69000,
        totalUSD: 17.25,
        deliveries: 9,
      },
    ],
    carrierShare: [
      { carrier: 'VET Express', packages: 17, amountKHR: 130000, amountUSD: 32.5, color: '#f59e0b' },
      { carrier: 'J&T Express', packages: 12, amountKHR: 90000, amountUSD: 22.5, color: '#ef4444' },
      { carrier: 'Flash Express', packages: 6, amountKHR: 45000, amountUSD: 11.25, color: '#eab308' },
      { carrier: 'Capitol Express', packages: 4, amountKHR: 30000, amountUSD: 7.5, color: '#3b82f6' },
    ],
  },
};

export const MonthlyDeliveryCostReport: React.FC<MonthlyDeliveryCostReportProps> = ({
  language,
  currency,
  onNotify,
  onOpenPdfExport,
}) => {
  const isKm = language === 'km';
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [chartMode, setChartMode] = useState<'both' | 'categories' | 'trend'>('both');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const report = useMemo(() => {
    return MONTHLY_REPORTS[selectedMonth] || MONTHLY_REPORTS['2026-09'];
  }, [selectedMonth]);

  // Format currency helper
  const formatMoney = (khr: number, usd: number) => {
    if (currency === 'KHR') {
      return `${khr.toLocaleString()} ៛`;
    }
    return `$${usd.toFixed(2)}`;
  };

  // Prepare data for Category PieChart
  const pieData = useMemo(() => {
    return report.categories.map((c) => ({
      name: isKm ? c.nameKm : c.nameEn,
      value: currency === 'KHR' ? c.amountKHR : c.amountUSD,
      khr: c.amountKHR,
      usd: c.amountUSD,
      count: c.count,
      color: c.color,
      id: c.id,
    }));
  }, [report, currency, isKm]);

  // Prepare data for Weekly BarChart
  const barData = useMemo(() => {
    return report.weeklyBreakdown.map((w) => ({
      name: isKm ? w.weekKm : w.weekEn,
      baseFee: currency === 'KHR' ? w.baseFeeKHR : w.baseFeeUSD,
      extraFee: currency === 'KHR' ? w.extraFeeKHR : w.extraFeeUSD,
      total: currency === 'KHR' ? w.totalKHR : w.totalUSD,
      deliveries: w.deliveries,
      baseKhr: w.baseFeeKHR,
      baseUsd: w.baseFeeUSD,
      extraKhr: w.extraFeeKHR,
      extraUsd: w.extraFeeUSD,
    }));
  }, [report, currency, isKm]);

  // Handle Export / Download Action
  const handleExportStatement = () => {
    if (onOpenPdfExport) {
      onOpenPdfExport(selectedMonth);
      return;
    }
    const msg = isKm
      ? `បានបើកផ្ទាំងទាញយករបាយការណ៍ថ្លៃដឹកជញ្ជូនប្រចាំខែ ${isKm ? report.monthNameKm : report.monthNameEn} (PDF)`
      : `Opened monthly delivery PDF statement for ${report.monthNameEn}`;
    if (onNotify) {
      onNotify(msg);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-900">
              {isKm ? 'របាយការណ៍ចំណាយដឹកជញ្ជូនប្រចាំខែ' : 'Monthly Delivery Cost & Spending Report'}
            </h3>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              {isKm ? 'វិភាគទិន្នន័យ' : 'Analytics'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isKm
              ? 'ផ្ទៀងផ្ទាត់ការចំណាយលើថ្លៃដឹកជញ្ជូន តាមប្រភេទទំនិញ និងទំហំសេវាអន្តរខេត្ត'
              : 'Interactive visualization of monthly shipping fees, category allocation, and carrier share'}
          </p>
        </div>

        {/* Month Selector & Export Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:bg-white cursor-pointer"
            >
              <option value="2026-09">{isKm ? 'កញ្ញា ២០២៦ (ខែនេះ)' : 'September 2026 (Current)'}</option>
              <option value="2026-08">{isKm ? 'សីហា ២០២៦' : 'August 2026'}</option>
              <option value="2026-07">{isKm ? 'កក្កដា ២០២៦' : 'July 2026'}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportStatement}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Export Monthly Delivery History Statement to PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-100" />
            <span>{isKm ? 'ទាញយក PDF' : 'Export PDF Statement'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Shipping Fees */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {isKm ? 'សរុបថ្លៃដឹកប្រចាំខែ' : 'Total Shipping Fees'}
            </span>
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-lg md:text-xl font-black text-rose-700 mt-1">
            {formatMoney(report.totalSpentKHR, report.totalSpentUSD)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">
              {isKm ? `${report.shipmentCount} កញ្ចប់` : `${report.shipmentCount} packages`}
            </span>
            <span>• {report.monthNameEn.split(' ')[0]}</span>
          </div>
        </div>

        {/* Average Delivery Cost */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {isKm ? 'មធ្យមភាគក្នុង ១ កញ្ចប់' : 'Avg Cost / Package'}
            </span>
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <PackageCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-lg md:text-xl font-black text-blue-700 mt-1">
            {formatMoney(report.avgDeliveryKHR, report.avgDeliveryUSD)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {isKm ? 'តម្លៃសមរម្យទូទាំងប្រទេស' : 'National competitive rate'}
          </div>
        </div>

        {/* COD Escrow Volume */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {isKm ? 'ប្រាក់ទំនិញ COD ទទួល' : 'COD Collected'}
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-lg md:text-xl font-black text-emerald-700 mt-1">
            {formatMoney(report.codCollectedKHR, report.codCollectedUSD)}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{isKm ? '100% ផ្ទេរចូល Bakong' : 'Settled via Bakong'}</span>
          </div>
        </div>

        {/* Most Used Carrier */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {isKm ? 'ក្រុមហ៊ុនដឹកជញ្ជូនចម្បង' : 'Primary Carrier'}
            </span>
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Truck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-sm md:text-base font-black text-amber-800 mt-1 truncate">
            {report.topCarrier.split('(')[0].trim()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            {isKm ? 'ចំណែកទីផ្សារខ្ពស់ជាងគេ' : 'Highest monthly volume'}
          </div>
        </div>
      </div>

      {/* View Switcher for Charts */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setChartMode('both')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              chartMode === 'both'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isKm ? 'ក្រាហ្វទាំងពីរ' : 'Both Charts'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('categories')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              chartMode === 'categories'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>{isKm ? 'តាមប្រភេទទំនិញ' : 'By Category'}</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('trend')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              chartMode === 'trend'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isKm ? 'តាមសប្តាហ៍' : 'Weekly Fee Trend'}</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {isKm ? 'គិតជា៖ ' : 'Displaying in: '}
            <strong className="text-slate-700 font-bold">{currency === 'KHR' ? 'រៀល (KHR)' : 'US Dollar (USD)'}</strong>
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div
        className={`grid gap-5 ${
          chartMode === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        {/* CHART 1: Category Spending Breakdown (Donut Chart) */}
        {(chartMode === 'both' || chartMode === 'categories') && (
          <div
            className={`p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col ${
              chartMode === 'both' ? 'lg:col-span-5' : 'w-full'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-rose-600" />
                  <span>{isKm ? 'ចំណាយតាមប្រភេទទំនិញ (Spending by Category)' : 'Spending Categories'}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isKm ? 'ភាគរយនៃថវិកាដឹកជញ្ជូនក្នុងខែ' : 'Distribution of monthly delivery costs'}
                </p>
              </div>
            </div>

            {/* Recharts Donut Pie */}
            <div className="w-full h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => {
                      const payload = item?.payload;
                      const formatted = formatMoney(payload.khr, payload.usd);
                      const percent = Math.round((payload.khr / report.totalSpentKHR) * 100);
                      return [`${formatted} (${percent}%) • ${payload.count} pkgs`, name];
                    }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                  />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    onClick={(entry: any) => setSelectedCategory(entry?.id ?? entry?.payload?.id ?? null)}
                    cursor="pointer"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Overlay Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isKm ? 'សរុប' : 'Total'}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  {formatMoney(report.totalSpentKHR, report.totalSpentUSD)}
                </span>
              </div>
            </div>

            {/* Category Legend & List */}
            <div className="space-y-1.5 mt-2 divide-y divide-slate-100">
              {report.categories.map((cat) => {
                const percent = Math.round((cat.amountKHR / report.totalSpentKHR) * 100);
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                    className={`w-full pt-1.5 flex items-center justify-between text-left transition rounded-lg p-1 ${
                      isSelected ? 'bg-rose-50 ring-1 ring-rose-300' : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {isKm ? cat.nameKm : cat.nameEn}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900">
                        {formatMoney(cat.amountKHR, cat.amountUSD)}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1.5 font-medium">
                        ({percent}%)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CHART 2: Weekly Delivery Cost Progression & Fee Breakdown */}
        {(chartMode === 'both' || chartMode === 'trend') && (
          <div
            className={`p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col ${
              chartMode === 'both' ? 'lg:col-span-7' : 'w-full'
            }`}
          >
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>{isKm ? 'ការវិវត្តថ្លៃដឹកជញ្ជូនប្រចាំសប្តាហ៍ (Weekly Shipping Fees)' : 'Weekly Shipping Fee Breakdown'}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isKm ? 'ប្រៀបធៀបថ្លៃដឹកគោល និងសេវាបន្ថែម (COD / Insurance)' : 'Base shipping fee vs value-added charges'}
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" />
                  <span>{isKm ? 'ថ្លៃដឹកគោល' : 'Base Fee'}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                  <span>{isKm ? 'សេវាបន្ថែម/COD' : 'Extra/COD'}</span>
                </span>
              </div>
            </div>

            {/* Recharts Stacked Bar Chart */}
            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => {
                      if (currency === 'KHR') {
                        return `${Math.round(val / 1000)}k`;
                      }
                      return `$${val}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => {
                      const payload = item.payload;
                      const isBase = name === (isKm ? 'ថ្លៃដឹកគោល' : 'Base Shipping Fee');
                      const khr = isBase ? payload.baseKhr : payload.extraKhr;
                      const usd = isBase ? payload.baseUsd : payload.extraUsd;
                      return [formatMoney(khr, usd), name];
                    }}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="baseFee"
                    name={isKm ? 'ថ្លៃដឹកគោល' : 'Base Shipping Fee'}
                    stackId="a"
                    fill="#e11d48"
                    radius={[0, 0, 4, 4]}
                  />
                  <Bar
                    dataKey="extraFee"
                    name={isKm ? 'សេវាបន្ថែម/COD' : 'Value-Added Services'}
                    stackId="a"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Carrier Share Distribution Mini-Bar */}
            <div className="mt-4 pt-3 border-t border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-700 block mb-2">
                {isKm ? 'ចំណែកទីផ្សារក្រុមហ៊ុនដឹកជញ្ជូន (Carrier Distribution):' : 'Carrier Volume Distribution:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {report.carrierShare.map((cs) => (
                  <div
                    key={cs.carrier}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cs.color }}
                      />
                      <span className="truncate">{cs.carrier}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">
                        {cs.packages} {isKm ? 'កញ្ចប់' : 'pkgs'}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {formatMoney(cs.amountKHR, cs.amountUSD)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Itemized Category Breakdown Table */}
      <div className="overflow-x-auto pt-1">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>{isKm ? 'តារាងសង្ខេបលម្អិតតាមប្រភេទទំនិញ' : 'Itemized Delivery Cost Breakdown'}</span>
        </div>

        <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-100 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">{isKm ? 'ប្រភេទទំនិញដឹកជញ្ជូន' : 'Category'}</th>
              <th className="py-2.5 px-3 text-center">{isKm ? 'ចំនួនកញ្ចប់' : 'Deliveries'}</th>
              <th className="py-2.5 px-3 text-right">{isKm ? 'ថ្លៃសរុប (Total Cost)' : 'Total Cost'}</th>
              <th className="py-2.5 px-3 text-right">{isKm ? 'មធ្យមភាគ / កញ្ចប់' : 'Avg / Package'}</th>
              <th className="py-2.5 px-3 text-right">{isKm ? 'ភាគរយថវិកា' : '% Budget'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {report.categories.map((cat) => {
              const percent = Math.round((cat.amountKHR / report.totalSpentKHR) * 100);
              const avgKhr = Math.round(cat.amountKHR / cat.count);
              const avgUsd = cat.amountUSD / cat.count;
              return (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{isKm ? cat.nameKm : cat.nameEn}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-700 font-mono font-medium">
                    {cat.count}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    {formatMoney(cat.amountKHR, cat.amountUSD)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                    {formatMoney(avgKhr, avgUsd)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800">
                      {percent}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 text-slate-900 font-black border-t border-slate-200">
            <tr>
              <td className="py-2.5 px-3">{isKm ? 'សរុបទាំងអស់ (Total)' : 'Total Overview'}</td>
              <td className="py-2.5 px-3 text-center font-mono">{report.shipmentCount}</td>
              <td className="py-2.5 px-3 text-right text-rose-700 font-black">
                {formatMoney(report.totalSpentKHR, report.totalSpentUSD)}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                {formatMoney(report.avgDeliveryKHR, report.avgDeliveryUSD)}
              </td>
              <td className="py-2.5 px-3 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
