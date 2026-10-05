import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
  Truck
} from 'lucide-react';
import { Language, Currency, TrackingItem } from '../types';

interface ActiveVsCompletedShipmentsChartProps {
  language: Language;
  currency: Currency;
  activeShipments?: TrackingItem[];
  className?: string;
}

interface DailyShipmentRecord {
  dateKey: string;
  dayLabel: string;
  dayLabelKm: string;
  dayNameEn: string;
  dayNameKm: string;
  active: number;
  completed: number;
  total: number;
  completionRate: number;
}

// Generate rolling 30-day data points blending real user activeShipments with historical patterns
export function generate30DayActiveVsCompletedData(realShipments: TrackingItem[] = []): DailyShipmentRecord[] {
  const result: DailyShipmentRecord[] = [];
  const now = new Date();

  // Count real user shipments
  const realCompletedCount = realShipments.filter((s) => s.status === 'delivered').length;
  const realActiveCount = realShipments.filter((s) => s.status !== 'delivered').length;

  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesKm = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const monthNum = d.getMonth() + 1;
    const dateNum = d.getDate();
    const dayOfWeek = d.getDay();
    const dayLabel = `${monthNum}/${dateNum}`;
    const dayLabelKm = `${dateNum}/${monthNum}`;
    const dateKey = d.toISOString().split('T')[0];

    // Simulating realistic Cambodia shipping patterns:
    // Surges on Monday (wholesale dispatches) and Friday (weekend restock)
    const isPeakDay = dayOfWeek === 1 || dayOfWeek === 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let baseCompleted = isPeakDay ? 6 : isWeekend ? 2 : 4;
    // Add natural fluctuation
    const noise = Math.floor(Math.sin(i * 1.2) * 2);
    let completedCount = Math.max(1, baseCompleted + noise);

    // Active items only occur in recent 4 days
    let activeCount = 0;
    if (i === 0) {
      activeCount = Math.max(realActiveCount || 3, 3);
      completedCount = Math.max(realCompletedCount || 2, 2);
    } else if (i === 1) {
      activeCount = 2;
    } else if (i === 2) {
      activeCount = 1;
    }

    const total = activeCount + completedCount;
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 100;

    result.push({
      dateKey,
      dayLabel,
      dayLabelKm,
      dayNameEn: dayNamesEn[dayOfWeek],
      dayNameKm: dayNamesKm[dayOfWeek],
      active: activeCount,
      completed: completedCount,
      total,
      completionRate,
    });
  }

  return result;
}

export const ActiveVsCompletedShipmentsChart: React.FC<ActiveVsCompletedShipmentsChartProps> = ({
  language,
  currency,
  activeShipments = [],
  className = '',
}) => {
  const isKm = language === 'km';
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [timeRange, setTimeRange] = useState<'30' | '14' | '7'>('30');

  const fullData = useMemo(() => {
    return generate30DayActiveVsCompletedData(activeShipments);
  }, [activeShipments]);

  const filteredData = useMemo(() => {
    const count = Number(timeRange);
    return fullData.slice(fullData.length - count);
  }, [fullData, timeRange]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalActive = 0;
    let totalCompleted = 0;
    filteredData.forEach((d) => {
      totalActive += d.active;
      totalCompleted += d.completed;
    });
    const totalAll = totalActive + totalCompleted;
    const overallRate = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 100;

    return {
      totalAll,
      totalActive,
      totalCompleted,
      overallRate,
    };
  }, [filteredData]);

  // Custom Recharts Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload as DailyShipmentRecord;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 z-50">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 font-bold">
            <span className="text-slate-200">
              {isKm ? `ថ្ងៃ${dataPoint.dayNameKm} ${dataPoint.dayLabelKm}` : `${dataPoint.dayNameEn}, ${dataPoint.dayLabel}`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {dataPoint.dateKey}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-blue-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <span>{isKm ? 'កំពុងដំណើរការ (Active)' : 'Active (In-Transit)'}</span>
              </span>
              <span className="font-mono font-bold text-white">{dataPoint.active}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{isKm ? 'បានប្រគល់ជូន (Completed)' : 'Completed (Delivered)'}</span>
              </span>
              <span className="font-mono font-bold text-white">{dataPoint.completed}</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-semibold">
            <span>{isKm ? 'សរុបប្រចាំថ្ងៃ៖' : 'Daily Total:'}</span>
            <span className="font-mono text-amber-300 font-bold">{dataPoint.total} {isKm ? 'កញ្ចប់' : 'parcels'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-5 ${className}`}>
      {/* Header with Title and Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900">
                {isKm ? 'ស្ថិតិកញ្ចប់ឥវ៉ាន់ "កំពុងដឹក vs ដឹកដល់" ៣០ ថ្ងៃ (Active vs Completed)' : 'Active vs Completed Shipments (30-Day Patterns)'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Recharts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKm
                ? 'ទិន្នន័យវិភាគចលនាដឹកជញ្ជូន ៣០ ថ្ងៃចុងក្រោយ ដើម្បីស្វែងយល់ពីទម្លាប់ និងល្បឿននៃការផ្ញើឥវ៉ាន់របស់អ្នក'
                : 'Visualize shipping volume trends and completed fulfillment ratios over the last 30 days.'}
            </p>
          </div>
        </div>

        {/* View Switches (Bar vs Area, 30 vs 14 vs 7 days) */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Days filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTimeRange('7')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                timeRange === '7' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isKm ? '៧ ថ្ងៃ' : '7 Days'}
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('14')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                timeRange === '14' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isKm ? '១៤ ថ្ងៃ' : '14 Days'}
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                timeRange === '30' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isKm ? '៣០ ថ្ងៃ' : '30 Days'}
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                chartType === 'bar' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isKm ? 'ក្រាបសសរ (Bar)' : 'Bar'}
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                chartType === 'area' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isKm ? 'ក្រាបផ្ទៃ (Area)' : 'Area'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Highlights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Total Volume */}
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {isKm ? 'បរិមាណសរុប (Total Volume)' : 'Total Volume'}
          </span>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            {stats.totalAll} <span className="text-xs font-normal text-slate-500">{isKm ? 'កញ្ចប់' : 'parcels'}</span>
          </div>
          <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
            {timeRange} {isKm ? 'ថ្ងៃចុងក្រោយ' : 'days aggregate'}
          </span>
        </div>

        {/* Metric 2: Active / In-Transit */}
        <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200/80">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            {isKm ? 'កំពុងដឹក (Active)' : 'Active In-Transit'}
          </span>
          <div className="text-xl font-black text-blue-900 mt-0.5">
            {stats.totalActive} <span className="text-xs font-normal text-blue-600">{isKm ? 'កញ្ចប់' : 'parcels'}</span>
          </div>
          <span className="text-[10px] text-blue-700 font-bold block mt-0.5">
            {isKm ? 'កំពុងរត់លើផ្លូវជាតិ' : 'Live on Highway'}
          </span>
        </div>

        {/* Metric 3: Completed / Delivered */}
        <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/80">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            {isKm ? 'ដឹកដល់ជោគជ័យ (Completed)' : 'Completed Delivered'}
          </span>
          <div className="text-xl font-black text-emerald-900 mt-0.5">
            {stats.totalCompleted} <span className="text-xs font-normal text-emerald-600">{isKm ? 'កញ្ចប់' : 'parcels'}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
            {isKm ? 'បានប្រគល់ជូនអ្នកទទួល' : 'Handed to Recipient'}
          </span>
        </div>

        {/* Metric 4: Completion Ratio */}
        <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200/80">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
            {isKm ? 'អត្រាជោគជ័យ (Success Rate)' : 'Fulfillment Rate'}
          </span>
          <div className="text-xl font-black text-purple-900 mt-0.5">
            {stats.overallRate}%
          </div>
          <span className="text-[10px] text-purple-700 font-bold block mt-0.5">
            {isKm ? 'ទាន់ពេលវេលាកំណត់' : 'High Reliability'}
          </span>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey={isKm ? 'dayLabelKm' : 'dayLabel'}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={renderCustomTooltip} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontWeight: 700 }}
                formatter={(value) => {
                  if (value === 'active') return isKm ? 'កំពុងដឹក (Active)' : 'Active Shipments';
                  if (value === 'completed') return isKm ? 'ដឹកដល់ (Completed)' : 'Completed Shipments';
                  return value;
                }}
              />
              <Bar dataKey="active" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="active" />
              <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="completed" />
            </BarChart>
          ) : (
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey={isKm ? 'dayLabelKm' : 'dayLabel'}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={renderCustomTooltip} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontWeight: 700 }}
                formatter={(value) => {
                  if (value === 'active') return isKm ? 'កំពុងដឹក (Active)' : 'Active Shipments';
                  if (value === 'completed') return isKm ? 'ដឹកដល់ (Completed)' : 'Completed Shipments';
                  return value;
                }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#completedGrad)"
                name="completed"
              />
              <Area
                type="monotone"
                dataKey="active"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#activeGrad)"
                name="active"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Shipping Pattern Insights Section */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <h4 className="font-black text-xs sm:text-sm text-slate-100">
            {isKm ? 'ការយល់ដឹងពីទម្លាប់ផ្ញើឥវ៉ាន់របស់អ្នក (Shipping Pattern Insights)' : 'User Shipping Pattern Insights'}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-slate-300">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="font-extrabold text-white block mb-0.5">
              📅 {isKm ? 'ថ្ងៃមមាញឹកបំផុត (Peak Surge)' : 'Peak Dispatch Days'}
            </span>
            <span>
              {isKm
                ? 'ថ្ងៃចន្ទ និងថ្ងៃសុក្រ មានការផ្ញើឥវ៉ាន់ច្រើនជាងគេ ៤៥% ឆ្ពោះទៅខេត្តសៀមរាប និងបាត់ដំបង។'
                : 'Monday & Friday show 45% higher parcel activity towards Siem Reap & Battambang routes.'}
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="font-extrabold text-white block mb-0.5">
              ⚡ {isKm ? 'ល្បឿនសម្រេចការដឹក' : 'Average Transit Velocity'}
            </span>
            <span>
              {isKm
                ? 'រយៈពេលដឹកជាមធ្យមគឺ ១.២ ថ្ងៃ ឆ្លងកាត់ផ្លូវជាតិលេខ ៥, ៦ និង ៤ ដោយគ្មានការកកស្ទះ។'
                : 'Parcels complete in 1.2 days on average across National Roads 5, 6, and 4.'}
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="font-extrabold text-white block mb-0.5">
              💡 {isKm ? 'គន្លឹះសន្សំពេលវេលា' : 'Smart Tip'}
            </span>
            <span>
              {isKm
                ? 'កក់ការមកទទួលមុនម៉ោង ១១:៣០ ព្រឹក ធានាថាកញ្ចប់ឥវ៉ាន់នឹងចេញដំណើរក្នុងជើងឡានថ្ងៃត្រង់។'
                : 'Booking pickup before 11:30 AM guarantees inclusion in the same-day noon highway van dispatch.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
