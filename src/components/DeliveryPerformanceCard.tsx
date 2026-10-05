import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Package,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Percent
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Language, Currency, TrackingItem } from '../types';

interface DeliveryPerformanceCardProps {
  language: Language;
  currency: Currency;
  activeShipments?: TrackingItem[];
}

interface DailyPerformanceDataPoint {
  dayLabel: string;
  dayLabelKm: string;
  dateKey: string;
  totalParcels: number;
  deliveredParcels: number;
  inTransitParcels: number;
  completionRatePct: number;
  onTimeRatePct: number;
}

// Generate realistic 30-day rolling performance metrics for Cambodia delivery logistics
const generate30DayPerformanceData = (): DailyPerformanceDataPoint[] => {
  const result: DailyPerformanceDataPoint[] = [];
  const now = new Date();

  // 30 days sequence
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const monthNum = d.getMonth() + 1;
    const dateNum = d.getDate();
    const dayLabel = `${monthNum}/${dateNum}`;
    const dayLabelKm = `${dateNum}/${monthNum}`;
    const dateKey = d.toISOString().split('T')[0];

    // Realistic volume curve with slight weekday peak
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseVolume = isWeekend ? 3 : 5;
    const randomVariation = Math.floor(Math.sin(i * 0.8) * 2) + Math.floor(Math.random() * 3);
    const totalParcels = Math.max(2, baseVolume + randomVariation);

    // Most recent 2 days have a few in-transit items
    const inTransit = i <= 1 ? Math.min(2, Math.floor(totalParcels * 0.4)) : 0;
    const deliveredParcels = totalParcels - inTransit;
    const completionRatePct = totalParcels > 0 ? Math.round((deliveredParcels / totalParcels) * 100) : 100;
    const onTimeRatePct = Math.min(100, Math.max(90, 95 + Math.floor(Math.random() * 6)));

    result.push({
      dayLabel,
      dayLabelKm,
      dateKey,
      totalParcels,
      deliveredParcels,
      inTransitParcels: inTransit,
      completionRatePct,
      onTimeRatePct,
    });
  }

  return result;
};

export const DeliveryPerformanceCard: React.FC<DeliveryPerformanceCardProps> = ({
  language,
  currency,
  activeShipments = [],
}) => {
  const isKm = language === 'km';
  const [metricView, setMetricView] = useState<'volume' | 'completion'>('volume');
  const [timeWindow, setTimeWindow] = useState<'30_days' | '7_days'>('30_days');

  const raw30DaysData = useMemo(() => generate30DayPerformanceData(), []);

  // Filter based on 7 days vs 30 days
  const chartData = useMemo(() => {
    return timeWindow === '7_days' ? raw30DaysData.slice(-7) : raw30DaysData;
  }, [timeWindow, raw30DaysData]);

  // Aggregate 30-day KPIs
  const summaryStats = useMemo(() => {
    const totalVolume = raw30DaysData.reduce((acc, curr) => acc + curr.totalParcels, 0);
    const totalDelivered = raw30DaysData.reduce((acc, curr) => acc + curr.deliveredParcels, 0);
    const avgCompletion = totalVolume > 0 ? ((totalDelivered / totalVolume) * 100).toFixed(1) : '98.5';
    const avgOnTime = (
      raw30DaysData.reduce((acc, curr) => acc + curr.onTimeRatePct, 0) / raw30DaysData.length
    ).toFixed(1);

    return {
      totalVolume,
      totalDelivered,
      avgCompletion,
      avgOnTime,
      activePending: activeShipments.filter((s) => s.status !== 'delivered').length,
      averageTransitHours: '6.4h',
    };
  }, [raw30DaysData, activeShipments]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {isKm ? 'ស្ថិតិ & ប្រសិទ្ធភាពនៃការដឹកជញ្ជូន ៣០ ថ្ងៃ' : '30-Day Delivery Volume & Completion Rates'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                {summaryStats.avgCompletion}% Success
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isKm
                ? 'តារាងស្ថិតិ និងការវិភាគបរិមាណកញ្ចប់ឥវ៉ាន់ និងអត្រាប្រគល់ជោគជ័យតាមប្រព័ន្ធ Recharts'
                : 'Interactive volume and on-time completion performance visualized with Recharts'}
            </p>
          </div>
        </div>

        {/* View mode toggle & Timeframe toggle */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Chart Metric Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMetricView('volume')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                metricView === 'volume'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{isKm ? 'បរិមាណកញ្ចប់' : 'Parcel Volume'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricView('completion')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                metricView === 'completion'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>{isKm ? 'អត្រាជោគជ័យ (%)' : 'Success Rate %'}</span>
            </button>
          </div>

          {/* Time Window (30 Days vs 7 Days) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTimeWindow('30_days')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                timeWindow === '30_days'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {isKm ? '៣០ ថ្ងៃ' : '30 Days'}
            </button>
            <button
              type="button"
              onClick={() => setTimeWindow('7_days')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                timeWindow === '7_days'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {isKm ? '៧ ថ្ងៃ' : '7 Days'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlights Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
            <span>{isKm ? 'កញ្ចប់សរុប (៣០ ថ្ងៃ)' : 'Total 30-Day Shipments'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summaryStats.totalVolume} <span className="text-xs font-bold text-slate-500">{isKm ? 'កញ្ចប់' : 'parcels'}</span>
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
            ↑ 18.4% {isKm ? 'ធៀបនឹងខែមុន' : 'vs last month'}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
          <div className="flex items-center justify-between text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
            <span>{isKm ? 'អត្រាប្រគល់ជោគជ័យ' : 'Completion Rate'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summaryStats.avgCompletion}%
          </div>
          <div className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold mt-0.5">
            {summaryStats.totalDelivered} / {summaryStats.totalVolume} {isKm ? 'បានប្រគល់រួចរាល់' : 'delivered'}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
            <span>{isKm ? 'ទាន់ពេលវេលា' : 'On-Time Rate'}</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summaryStats.avgOnTime}%
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
            {isKm ? 'មកដល់តាមកាលវិភាគ' : 'Met ETA schedule'}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
          <div className="flex items-center justify-between text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">
            <span>{isKm ? 'រយៈពេលដឹកមធ្យម' : 'Avg. Transit Time'}</span>
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            ~{summaryStats.averageTransitHours}
          </div>
          <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold mt-0.5">
            {isKm ? 'ឡានវ៉ែនល្បឿនលឿន' : 'Express Highway Fleet'}
          </div>
        </div>
      </div>

      {/* Recharts Visualization Container */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {metricView === 'volume'
              ? (isKm ? 'ក្រាហ្វិកបរិមាណកញ្ចប់ឥវ៉ាន់ប្រចាំថ្ងៃ (Parcels Shipped & Delivered)' : 'Daily Parcel Shipment Volume (Shipped vs Delivered)')
              : (isKm ? 'ក្រាហ្វិកអត្រាជោគជ័យ និងទាន់ពេលវេលា (%)' : 'Completion & On-Time Performance Rates (%)')}
          </span>
          <span className="text-[11px] text-slate-400">
            {timeWindow === '30_days' ? (isKm ? 'ទិន្នន័យ ៣០ ថ្ងៃចុងក្រោយ' : 'Last 30 Days Trend') : (isKm ? 'ទិន្នន័យ ៧ ថ្ងៃចុងក្រោយ' : 'Last 7 Days Trend')}
          </span>
        </div>

        <div className="w-full h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            {metricView === 'volume' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey={isKm ? 'dayLabelKm' : 'dayLabel'}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '11px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  }}
                  formatter={(value: any, name: any) => {
                    const label = String(name) === 'totalParcels' 
                      ? (isKm ? 'កញ្ចប់ផ្ញើសរុប' : 'Total Shipped')
                      : (isKm ? 'បានប្រគល់ជោគជ័យ' : 'Delivered');
                    return [`${value} ${isKm ? 'កញ្ចប់' : 'parcels'}`, label];
                  }}
                  labelFormatter={(label) => `${isKm ? 'កាលបរិច្ឆេទ' : 'Date'}: ${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                  formatter={(value) => {
                    if (value === 'totalParcels') return isKm ? 'កញ្ចប់ផ្ញើសរុប (Shipped)' : 'Total Shipped';
                    if (value === 'deliveredParcels') return isKm ? 'បានប្រគល់ (Delivered)' : 'Delivered';
                    return value;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalParcels"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="deliveredParcels"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDelivered)"
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey={isKm ? 'dayLabelKm' : 'dayLabel'}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[80, 100]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '11px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  }}
                  formatter={(value: any, name: any) => {
                    const label = String(name) === 'completionRatePct' 
                      ? (isKm ? 'អត្រាប្រគល់ជោគជ័យ' : 'Completion Rate')
                      : (isKm ? 'ទាន់ពេលវេលា' : 'On-Time Arrival');
                    return [`${value}%`, label];
                  }}
                  labelFormatter={(label) => `${isKm ? 'កាលបរិច្ឆេទ' : 'Date'}: ${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                  formatter={(value) => {
                    if (value === 'completionRatePct') return isKm ? 'អត្រាជោគជ័យ (%)' : 'Completion Rate %';
                    if (value === 'onTimeRatePct') return isKm ? 'ទាន់ពេលវេលា (%)' : 'On-Time Rate %';
                    return value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completionRatePct"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="onTimeRatePct"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: '#f59e0b' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
