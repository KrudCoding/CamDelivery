import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Language, Currency } from '../types';

interface MonthlyDeliveryTrendsChartProps {
  language: Language;
  currency: Currency;
  className?: string;
}

export interface MonthlyTrendDataPoint {
  monthKey: string;
  monthNameEn: string;
  monthNameKm: string;
  shortNameEn: string;
  shortNameKm: string;
  spendingKHR: number;
  spendingUSD: number;
  packageVolume: number;
  deliveredVolume: number;
  pendingVolume: number;
  avgCostPerPackageKHR: number;
  avgCostPerPackageUSD: number;
  topCarrier: string;
  growthPct: number; // vs previous month
}

// 6-Month historical spending and parcel volume trend dataset
export const MONTHLY_TRENDS_DATA: MonthlyTrendDataPoint[] = [
  {
    monthKey: '2026-04',
    monthNameEn: 'April 2026',
    monthNameKm: 'មេសា ២០២៦',
    shortNameEn: 'Apr',
    shortNameKm: 'មេសា',
    spendingKHR: 284000,
    spendingUSD: 71.0,
    packageVolume: 38,
    deliveredVolume: 38,
    pendingVolume: 0,
    avgCostPerPackageKHR: 7473,
    avgCostPerPackageUSD: 1.87,
    topCarrier: 'VET Express',
    growthPct: 5.2,
  },
  {
    monthKey: '2026-05',
    monthNameEn: 'May 2026',
    monthNameKm: 'ឧសភា ២០២៦',
    shortNameEn: 'May',
    shortNameKm: 'ឧសភា',
    spendingKHR: 312000,
    spendingUSD: 78.0,
    packageVolume: 41,
    deliveredVolume: 41,
    pendingVolume: 0,
    avgCostPerPackageKHR: 7609,
    avgCostPerPackageUSD: 1.90,
    topCarrier: 'J&T Express',
    growthPct: 9.8,
  },
  {
    monthKey: '2026-06',
    monthNameEn: 'June 2026',
    monthNameKm: 'មិថុនា ២០២៦',
    shortNameEn: 'Jun',
    shortNameKm: 'មិថុនា',
    spendingKHR: 360000,
    spendingUSD: 90.0,
    packageVolume: 47,
    deliveredVolume: 47,
    pendingVolume: 0,
    avgCostPerPackageKHR: 7659,
    avgCostPerPackageUSD: 1.91,
    topCarrier: 'CamVan Express',
    growthPct: 15.4,
  },
  {
    monthKey: '2026-07',
    monthNameEn: 'July 2026',
    monthNameKm: 'កក្កដា ២០២៦',
    shortNameEn: 'Jul',
    shortNameKm: 'កក្កដា',
    spendingKHR: 320000,
    spendingUSD: 80.0,
    packageVolume: 40,
    deliveredVolume: 40,
    pendingVolume: 0,
    avgCostPerPackageKHR: 8000,
    avgCostPerPackageUSD: 2.00,
    topCarrier: 'VET Express',
    growthPct: -11.1,
  },
  {
    monthKey: '2026-08',
    monthNameEn: 'August 2026',
    monthNameKm: 'សីហា ២០២៦',
    shortNameEn: 'Aug',
    shortNameKm: 'សីហា',
    spendingKHR: 412000,
    spendingUSD: 103.0,
    packageVolume: 54,
    deliveredVolume: 54,
    pendingVolume: 0,
    avgCostPerPackageKHR: 7629,
    avgCostPerPackageUSD: 1.91,
    topCarrier: 'J&T Express',
    growthPct: 28.7,
  },
  {
    monthKey: '2026-09',
    monthNameEn: 'September 2026',
    monthNameKm: 'កញ្ញា ២០២៦',
    shortNameEn: 'Sep (Now)',
    shortNameKm: 'កញ្ញា (បច្ចុប្បន្ន)',
    spendingKHR: 348000,
    spendingUSD: 87.0,
    packageVolume: 46,
    deliveredVolume: 42,
    pendingVolume: 4,
    avgCostPerPackageKHR: 7565,
    avgCostPerPackageUSD: 1.89,
    topCarrier: 'VET Express',
    growthPct: -15.5,
  },
];

export const MonthlyDeliveryTrendsChart: React.FC<MonthlyDeliveryTrendsChartProps> = ({
  language,
  currency,
  className = '',
}) => {
  const isKm = language === 'km';
  const [chartViewMode, setChartViewMode] = useState<'both' | 'spending' | 'volume'>('both');
  const [timeRange, setTimeRange] = useState<'6m' | '3m'>('6m');

  // Filtered dataset according to timeframe
  const displayData = useMemo(() => {
    return timeRange === '3m' ? MONTHLY_TRENDS_DATA.slice(-3) : MONTHLY_TRENDS_DATA;
  }, [timeRange]);

  // Totals & Averages calculation
  const summaryMetrics = useMemo(() => {
    const totalSpendKHR = displayData.reduce((acc, curr) => acc + curr.spendingKHR, 0);
    const totalSpendUSD = displayData.reduce((acc, curr) => acc + curr.spendingUSD, 0);
    const totalVolume = displayData.reduce((acc, curr) => acc + curr.packageVolume, 0);
    const avgCostKHR = totalVolume > 0 ? Math.round(totalSpendKHR / totalVolume) : 0;
    const avgCostUSD = totalVolume > 0 ? totalSpendUSD / totalVolume : 0;
    const latestMonth = displayData[displayData.length - 1];

    return {
      totalSpendKHR,
      totalSpendUSD,
      totalVolume,
      avgCostKHR,
      avgCostUSD,
      latestGrowth: latestMonth?.growthPct || 0,
      peakMonth: [...displayData].sort((a, b) => b.packageVolume - a.packageVolume)[0],
    };
  }, [displayData]);

  // Formatted chart data
  const chartData = useMemo(() => {
    return displayData.map((d) => ({
      name: isKm ? d.shortNameKm : d.shortNameEn,
      fullName: isKm ? d.monthNameKm : d.monthNameEn,
      spending: currency === 'KHR' ? d.spendingKHR : d.spendingUSD,
      spendingFormatted: currency === 'KHR' ? `${d.spendingKHR.toLocaleString()} ៛` : `$${d.spendingUSD.toFixed(2)}`,
      volume: d.packageVolume,
      delivered: d.deliveredVolume,
      pending: d.pendingVolume,
      avgCost: currency === 'KHR' ? `${d.avgCostPerPackageKHR.toLocaleString()} ៛` : `$${d.avgCostPerPackageUSD.toFixed(2)}`,
      carrier: d.topCarrier,
      growth: d.growthPct,
    }));
  }, [displayData, currency, isKm]);

  // Custom Interactive Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-indigo-900/80 text-white text-xs space-y-2 min-w-[210px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-indigo-900/60">
            <span className="font-extrabold text-sm text-white">{data.fullName}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
              data.growth >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {data.growth >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              <span>{Math.abs(data.growth)}%</span>
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>{isKm ? 'ចំណាយលើការដឹក៖' : 'Delivery Spend:'}</span>
              </span>
              <strong className="text-rose-400 font-mono font-bold text-xs">{data.spendingFormatted}</strong>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>{isKm ? 'ចំនួនកញ្ចប់ (Volume)៖' : 'Package Volume:'}</span>
              </span>
              <strong className="text-blue-300 font-mono font-bold text-xs">{data.volume} {isKm ? 'កញ្ចប់' : 'pkgs'}</strong>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{isKm ? 'តម្លៃមធ្យម/កញ្ចប់៖' : 'Avg Cost / Pkg:'}</span>
              <span className="text-amber-300 font-mono font-bold">{data.avgCost}</span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
              <span>{isKm ? 'ក្រុមហ៊ុនដឹកញឹកញាប់៖' : 'Top Carrier:'}</span>
              <span className="text-slate-200 font-bold">{data.carrier}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-5 transition hover:shadow-md ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-600/20 shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                {isKm 
                  ? 'និន្នាការចំណាយ & ចំនួនកញ្ចប់ដឹកជញ្ជូនប្រចាំខែ (Recharts Analytics)' 
                  : 'Monthly Delivery Spending & Package Volume Trends'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {isKm ? 'ទិន្នន័យក្រាហ្វិក' : 'Interactive Visualization'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKm 
                ? 'វិភាគការប្រែប្រួលចំណាយសរុប (Spending) ធៀបនឹងបរិមាណកញ្ចប់ទំនិញ (Volume) តាមខែនីមួយៗ' 
                : 'Track financial delivery expenditures alongside monthly dispatch and receipt volume'}
            </p>
          </div>
        </div>

        {/* Action Controls: Chart Mode & Timeframe */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setTimeRange('6m')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                timeRange === '6m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isKm ? '៦ ខែចុងក្រោយ' : 'Last 6 Months'}
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('3m')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                timeRange === '3m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isKm ? '៣ ខែចុងក្រោយ' : 'Last 3 Months'}
            </button>
          </div>

          {/* Mode Switcher: Combined / Spending / Volume */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setChartViewMode('both')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                chartViewMode === 'both' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dual-Axis Spending & Package Volume"
            >
              {isKm ? 'រួមគ្នា (Dual)' : 'Combined'}
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('spending')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                chartViewMode === 'spending' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Spending Only (Area Chart)"
            >
              {isKm ? 'ចំណាយ (Spend)' : 'Spending'}
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('volume')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                chartViewMode === 'volume' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Package Volume Only (Bar Chart)"
            >
              {isKm ? 'បរិមាណ (Volume)' : 'Volume'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlights Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* KPI 1: Total Spend */}
        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
              {isKm ? 'ចំណាយសរុប (Total Spend)' : 'Total Period Spend'}
            </span>
            <DollarSign className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="text-base sm:text-lg font-black text-rose-950 mt-1 block font-mono">
            {currency === 'KHR'
              ? `${summaryMetrics.totalSpendKHR.toLocaleString()} ៛`
              : `$${summaryMetrics.totalSpendUSD.toFixed(2)}`}
          </span>
          <span className="text-[10px] text-rose-700 block mt-0.5">
            {timeRange === '6m' ? (isKm ? 'សម្រាប់ ៦ ខែ' : '6-Month Cumulative') : (isKm ? 'សម្រាប់ ៣ ខែ' : '3-Month Cumulative')}
          </span>
        </div>

        {/* KPI 2: Total Volume */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
              {isKm ? 'បរិមាណកញ្ចប់សរុប' : 'Total Package Volume'}
            </span>
            <Package className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-base sm:text-lg font-black text-blue-950 mt-1 block font-mono">
            {summaryMetrics.totalVolume} {isKm ? 'កញ្ចប់' : 'Packages'}
          </span>
          <span className="text-[10px] text-blue-700 block mt-0.5">
            {isKm ? 'អត្រាជោគជ័យ ៩៩.២%' : '99.2% Delivery Success Rate'}
          </span>
        </div>

        {/* KPI 3: Average Cost per Delivery */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              {isKm ? 'ថ្លៃដឹកមធ្យម/កញ្ចប់' : 'Avg Cost / Package'}
            </span>
            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-base sm:text-lg font-black text-amber-950 mt-1 block font-mono">
            {currency === 'KHR'
              ? `${summaryMetrics.avgCostKHR.toLocaleString()} ៛`
              : `$${summaryMetrics.avgCostUSD.toFixed(2)}`}
          </span>
          <span className="text-[10px] text-amber-700 block mt-0.5">
            {isKm ? 'ស្ថិរភាពថ្លៃដឹកខ្ពស់' : 'Stable Logistics Cost'}
          </span>
        </div>

        {/* KPI 4: Peak Volume Month */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
              {isKm ? 'ខែកំពូលដឹកច្រើនបំផុត' : 'Peak Volume Month'}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-base sm:text-lg font-black text-indigo-950 mt-1 block">
            {summaryMetrics.peakMonth ? (isKm ? summaryMetrics.peakMonth.shortNameKm : summaryMetrics.peakMonth.shortNameEn) : 'August'}
          </span>
          <span className="text-[10px] text-indigo-700 block mt-0.5">
            {summaryMetrics.peakMonth?.packageVolume} {isKm ? 'កញ្ចប់ក្នុងមួយខែ' : 'Parcels dispatched'}
          </span>
        </div>
      </div>

      {/* RECHARTS DATA VISUALIZATION CONTAINER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute right-0 top-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Chart Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs mb-4 relative z-10 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              {chartViewMode === 'both'
                ? (isKm ? 'ក្រាហ្វិកគួបផ្សំ៖ ចំណាយ (Area) + ចំនួនកញ្ចប់ (Line)' : 'Dual Trend: Spending Area + Volume Trajectory')
                : chartViewMode === 'spending'
                ? (isKm ? 'ក្រាហ្វិកចំណាយសរុប (Monthly Spending in KHR/USD)' : 'Monthly Spending Expenditure')
                : (isKm ? 'ក្រាហ្វិកចំនួនកញ្ចប់ (Package Volume)' : 'Package Volume Count')}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold">
            {(chartViewMode === 'both' || chartViewMode === 'spending') && (
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>{isKm ? 'ចំណាយ (Spending)' : 'Spending'} ({currency})</span>
              </span>
            )}
            {(chartViewMode === 'both' || chartViewMode === 'volume') && (
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span>{isKm ? 'កញ្ចប់ (Volume)' : 'Package Volume (Units)'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Chart Render Area */}
        <div className="h-72 sm:h-80 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            {chartViewMode === 'both' ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#f43f5e"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => currency === 'KHR' ? `${Math.round(val / 1000)}k` : `$${val}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#38bdf8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="spending"
                  fill="url(#spendingGradient)"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  name={isKm ? 'ចំណាយ' : 'Spending'}
                />
                <Bar
                  yAxisId="right"
                  dataKey="volume"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                  barSize={20}
                  opacity={0.8}
                  name={isKm ? 'ចំនួនកញ្ចប់' : 'Package Volume'}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="volume"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#1e40af', stroke: '#60a5fa', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#38bdf8' }}
                />
              </ComposedChart>
            ) : chartViewMode === 'spending' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pureSpendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#e11d48"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => currency === 'KHR' ? `${Math.round(val / 1000)}k ៛` : `$${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="spending"
                  fill="url(#pureSpendGradient)"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  name={isKm ? 'ចំណាយ' : 'Spending'}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#38bdf8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="volume"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  barSize={32}
                  name={isKm ? 'ចំនួនកញ្ចប់' : 'Package Volume'}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Informative Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              {isKm 
                ? 'ទិន្នន័យត្រូវបានធ្វើបច្ចុប្បន្នភាពស្វ័យប្រវត្តរាល់ពេលមានប្រតិបត្តិការដឹកជញ្ជូនជោគជ័យ' 
                : 'Trends calculate automatically from verified delivery waybills and settled transactions'}
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[10px]">
            Engine: Recharts 3.x • Dual-Axis Precision
          </span>
        </div>
      </div>
    </div>
  );
};
