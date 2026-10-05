import React, { useState, useMemo, useEffect } from 'react';
import {
  Fuel,
  TrendingUp,
  DollarSign,
  Gauge,
  Plus,
  Trash2,
  Calendar,
  Truck,
  Car,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin
} from 'lucide-react';
import { Language, Currency } from '../types';

export interface FuelExpenseLog {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  vehicleType: 'motorcycle' | 'tuktuk' | 'van' | 'truck';
  fuelType: 'gasoline_92' | 'gasoline_95' | 'diesel' | 'ev';
  litersOrKwh: number;
  pricePerLiterKHR: number;
  totalCostKHR: number;
  totalCostUSD: number;
  distanceTraveledKm: number;
  stationName: string;
  notes?: string;
  createdAt: string;
}

interface FuelCostMonitorProps {
  language: Language;
  currency: Currency;
  onNotify?: (message: string) => void;
  partnerBalanceKHR?: number;
}

const STORAGE_KEY = 'camdelivery_fuel_logs_v1';

// Typical Cambodian benchmark fuel prices
const DEFAULT_PRICES_KHR = {
  gasoline_92: 4250,
  gasoline_95: 4650,
  diesel: 4200,
  ev: 1200,
};

const DEFAULT_INITIAL_LOGS: FuelExpenseLog[] = [
  {
    id: 'fuel-1',
    date: new Date().toISOString().slice(0, 10),
    time: '08:15 AM',
    vehicleType: 'tuktuk',
    fuelType: 'gasoline_92',
    litersOrKwh: 6.5,
    pricePerLiterKHR: 4250,
    totalCostKHR: 27625,
    totalCostUSD: 6.91,
    distanceTraveledKm: 85,
    stationName: 'TotalEnergies (Monivong)',
    notes: 'Morning city deliveries & pickup runs',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fuel-2',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    time: '07:30 AM',
    vehicleType: 'tuktuk',
    fuelType: 'gasoline_92',
    litersOrKwh: 7.0,
    pricePerLiterKHR: 4250,
    totalCostKHR: 29750,
    totalCostUSD: 7.44,
    distanceTraveledKm: 92,
    stationName: 'PTT Station (Toul Kork)',
    notes: 'Inter-district parcel dispatch',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'fuel-3',
    date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    time: '08:00 AM',
    vehicleType: 'tuktuk',
    fuelType: 'gasoline_92',
    litersOrKwh: 6.0,
    pricePerLiterKHR: 4250,
    totalCostKHR: 25500,
    totalCostUSD: 6.38,
    distanceTraveledKm: 80,
    stationName: 'Tela Mart (Street 271)',
    notes: 'Express courier deliveries',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const FuelCostMonitor: React.FC<FuelCostMonitorProps> = ({
  language,
  currency,
  onNotify,
  partnerBalanceKHR = 165000,
}) => {
  const isKm = language === 'km';

  // Stored fuel logs
  const [logs, setLogs] = useState<FuelExpenseLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading fuel logs cache:', e);
    }
    return DEFAULT_INITIAL_LOGS;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Error saving fuel logs:', e);
    }
  }, [logs]);

  // Form State
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [logDate, setLogDate] = useState<string>(todayStr);
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'tuktuk' | 'van' | 'truck'>('tuktuk');
  const [fuelType, setFuelType] = useState<'gasoline_92' | 'gasoline_95' | 'diesel' | 'ev'>('gasoline_92');
  const [litersOrKwh, setLitersOrKwh] = useState<number>(6.5);
  const [pricePerLiterKHR, setPricePerLiterKHR] = useState<number>(DEFAULT_PRICES_KHR.gasoline_92);
  const [distanceKm, setDistanceKm] = useState<number>(80);
  const [stationName, setStationName] = useState<string>('TotalEnergies (Monivong)');
  const [notes, setNotes] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Daily revenue estimation state (partner can adjust or prefill from settlement)
  const [dailyGrossRevenueKHR, setDailyGrossRevenueKHR] = useState<number>(() => {
    return partnerBalanceKHR > 0 ? partnerBalanceKHR : 140000;
  });

  // Auto-update price per liter when fuel type changes
  const handleFuelTypeChange = (type: 'gasoline_92' | 'gasoline_95' | 'diesel' | 'ev') => {
    setFuelType(type);
    setPricePerLiterKHR(DEFAULT_PRICES_KHR[type]);
  };

  // Calculated form cost
  const calculatedFormCostKHR = useMemo(() => {
    return Math.round(litersOrKwh * pricePerLiterKHR);
  }, [litersOrKwh, pricePerLiterKHR]);

  const calculatedFormCostUSD = useMemo(() => {
    return Number((calculatedFormCostKHR / 4000).toFixed(2));
  }, [calculatedFormCostKHR]);

  // Today's Aggregate Calculations
  const todayLogs = useMemo(() => {
    return logs.filter((l) => l.date === todayStr);
  }, [logs, todayStr]);

  const todayFuelCostKHR = useMemo(() => {
    return todayLogs.reduce((sum, item) => sum + item.totalCostKHR, 0);
  }, [todayLogs]);

  const todayDistanceDrivenKm = useMemo(() => {
    return todayLogs.reduce((sum, item) => sum + item.distanceTraveledKm, 0);
  }, [todayLogs]);

  // Net Daily Profit Calculation
  const netDailyProfitKHR = Math.max(0, dailyGrossRevenueKHR - todayFuelCostKHR);
  const netDailyProfitUSD = Number((netDailyProfitKHR / 4000).toFixed(2));
  const profitMarginPct = dailyGrossRevenueKHR > 0
    ? Math.round((netDailyProfitKHR / dailyGrossRevenueKHR) * 100)
    : 0;

  const fuelCostPerKmKHR = todayDistanceDrivenKm > 0
    ? Math.round(todayFuelCostKHR / todayDistanceDrivenKm)
    : 0;

  // Add Log Entry
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (litersOrKwh <= 0 || pricePerLiterKHR <= 0) {
      if (onNotify) onNotify(isKm ? 'សូមបញ្ចូលបរិមាណប្រេង និងតម្លៃត្រឹមត្រូវ' : 'Please provide valid fuel liters and price');
      return;
    }

    const newLog: FuelExpenseLog = {
      id: `fuel-${Date.now()}`,
      date: logDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      vehicleType,
      fuelType,
      litersOrKwh,
      pricePerLiterKHR,
      totalCostKHR: calculatedFormCostKHR,
      totalCostUSD: calculatedFormCostUSD,
      distanceTraveledKm: distanceKm,
      stationName: stationName.trim() || 'Gas Station',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setLogs((prev) => [newLog, ...prev]);
    setIsAdding(false);
    setNotes('');

    if (onNotify) {
      onNotify(
        isKm
          ? `បានកត់ត្រាចំណាយប្រេង ${calculatedFormCostKHR.toLocaleString()} ៛ ដោយជោគជ័យ!`
          : `Fuel expense of ${calculatedFormCostKHR.toLocaleString()} KHR logged successfully!`
      );
    }
  };

  // Remove Log Entry
  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    if (onNotify) {
      onNotify(isKm ? 'បានលុបកំណត់ត្រាចំណាយប្រេង' : 'Fuel log removed');
    }
  };

  // Presets Quick Fill
  const applyPreset = (vType: 'motorcycle' | 'tuktuk' | 'van', liters: number, dist: number) => {
    setVehicleType(vType);
    setLitersOrKwh(liters);
    setDistanceKm(dist);
    if (vType === 'van') {
      handleFuelTypeChange('diesel');
    } else {
      handleFuelTypeChange('gasoline_92');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {isKm ? 'តាមដានចំណាយប្រេង & ប្រាក់ចំណេញសុទ្ធប្រចាំថ្ងៃ' : 'Fuel Cost Monitor & Daily Profitability'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {isKm ? 'សម្រាប់ដៃគូដឹកជញ្ជូន' : 'Driver Partner Tool'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKm
                ? 'កត់ត្រាបរិមាណចាក់សាំង/ម៉ាស៊ូត និងគណនាប្រាក់ចំណេញសុទ្ធពិតប្រាកដក្រោយកាត់ថ្លៃប្រេង'
                : 'Log vehicle fuel consumption, track fuel economy, and calculate net take-home earnings'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{isAdding ? (isKm ? 'បិទទម្រង់' : 'Close Form') : (isKm ? 'កត់ត្រាចាក់សាំងថ្មី' : 'Log Fuel Fill')}</span>
        </button>
      </div>

      {/* DAILY PROFITABILITY KPI SCOREBOARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Gross Earnings */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {isKm ? 'ចំណូលសរុបថ្ងៃនេះ (Gross)' : "Today's Gross Earnings"}
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {currency === 'KHR'
              ? `${dailyGrossRevenueKHR.toLocaleString()} ៛`
              : `$${(dailyGrossRevenueKHR / 4000).toFixed(2)}`}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isKm ? 'ចំណូលមុនកាត់ចំណាយ' : 'Before fuel deduction'}
          </span>
        </div>

        {/* Total Fuel Expense Today */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            {isKm ? 'ចំណាយប្រេងថ្ងៃនេះ (Fuel)' : "Today's Fuel Expense"}
          </span>
          <div className="text-base sm:text-lg font-black text-amber-700 mt-1">
            {currency === 'KHR'
              ? `${todayFuelCostKHR.toLocaleString()} ៛`
              : `$${(todayFuelCostKHR / 4000).toFixed(2)}`}
          </div>
          <span className="text-[10px] text-amber-800/80 mt-0.5 block">
            {todayLogs.length} {isKm ? 'លើកកត់ត្រា' : 'logs logged today'}
          </span>
        </div>

        {/* Net Daily Take-Home Profit */}
        <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            {isKm ? 'ប្រាក់ចំណេញសុទ្ធ (Net Profit)' : 'Daily Net Take-Home'}
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-700 mt-1">
            {currency === 'KHR'
              ? `${netDailyProfitKHR.toLocaleString()} ៛`
              : `$${netDailyProfitUSD.toFixed(2)}`}
          </div>
          <span className="text-[10px] font-bold text-emerald-800 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{isKm ? 'ចំណេញក្នុងដៃពិត' : 'Pocket take-home'}</span>
          </span>
        </div>

        {/* Profit Margin & Efficiency */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
            {isKm ? 'អត្រាចំណេញ (Margin %)' : 'Profit Margin'}
          </span>
          <div className="text-base sm:text-lg font-black text-blue-700 mt-1">
            {profitMarginPct}%
          </div>
          <span className="text-[10px] text-blue-700/80 mt-0.5 block">
            {fuelCostPerKmKHR > 0 ? `${fuelCostPerKmKHR} ៛/km fuel cost` : 'High profitability'}
          </span>
        </div>
      </div>

      {/* ADJUST GROSS REVENUE SLIDER / INPUT */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-700">
            {isKm
              ? 'កែសម្រួលចំណូលសរុបថ្ងៃនេះ ដើម្បីគណនាចំណេញ៖'
              : 'Adjust estimated daily delivery revenue for profitability calculation:'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            step="5000"
            min="0"
            value={dailyGrossRevenueKHR}
            onChange={(e) => setDailyGrossRevenueKHR(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-32 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
          />
          <span className="font-bold text-slate-500">៛ KHR</span>
        </div>
      </div>

      {/* FUEL LOGGING FORM (EXPANDABLE) */}
      {isAdding && (
        <form
          onSubmit={handleAddLog}
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-slate-50 to-white border-2 border-amber-300 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
            <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>{isKm ? 'ទម្រង់កត់ត្រាចំណាយប្រេងរថយន្ត/កង់បី/ម៉ូតូ' : 'Add Vehicle Fuel Consumption Log'}</span>
            </span>

            {/* Quick Fill Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{isKm ? 'គំរូរហ័ស៖' : 'Presets:'}</span>
              <button
                type="button"
                onClick={() => applyPreset('motorcycle', 3.0, 50)}
                className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-[10px] font-bold text-slate-700"
              >
                🏍️ Moto 3L
              </button>
              <button
                type="button"
                onClick={() => applyPreset('tuktuk', 7.0, 90)}
                className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-[10px] font-bold text-slate-700"
              >
                🛺 TukTuk 7L
              </button>
              <button
                type="button"
                onClick={() => applyPreset('van', 25.0, 310)}
                className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-[10px] font-bold text-slate-700"
              >
                🚐 Van 25L
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'កាលបរិច្ឆេទ' : 'Date'}
              </label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Vehicle Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'ប្រភេទទានយន្ត' : 'Vehicle Type'}
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 cursor-pointer"
              >
                <option value="tuktuk">🛺 {isKm ? 'កង់បីឥណ្ឌា / PassApp / Rickshaw' : 'TukTuk / Rickshaw'}</option>
                <option value="motorcycle">🏍️ {isKm ? 'ម៉ូតូដឹកឥវ៉ាន់ (Moto Delivery)' : 'Motorcycle'}</option>
                <option value="van">🚐 {isKm ? 'រថយន្តវ៉ែនអន្តរខេត្ត (Van Express)' : 'Interprovincial Van'}</option>
                <option value="truck">🚚 {isKm ? 'រថយន្តដឹកទំនិញធុនធ្ងន់ (Truck)' : 'Cargo Truck'}</option>
              </select>
            </div>

            {/* Fuel Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'ប្រភេទប្រេងឥន្ធនៈ' : 'Fuel Grade'}
              </label>
              <select
                value={fuelType}
                onChange={(e) => handleFuelTypeChange(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 cursor-pointer"
              >
                <option value="gasoline_92">⛽ {isKm ? 'សាំងធម្មតា (RON 92) ~4,250៛' : 'Regular Gasoline 92 (~4,250៛)'}</option>
                <option value="gasoline_95">⛽ {isKm ? 'សាំងស៊ុបពែរ (RON 95) ~4,650៛' : 'Super Gasoline 95 (~4,650៛)'}</option>
                <option value="diesel">🛢️ {isKm ? 'ប្រេងម៉ាស៊ូត (Diesel) ~4,200៛' : 'Diesel (~4,200៛)'}</option>
                <option value="ev">⚡ {isKm ? 'សាកអគ្គិសនី EV (~1,200៛/kWh)' : 'EV Electricity (~1,200៛/kWh)'}</option>
              </select>
            </div>

            {/* Liters Filled */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'បរិមាណចាក់ (លីត្រ/kWh)' : 'Volume (Liters / kWh)'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                required
                value={litersOrKwh}
                onChange={(e) => setLitersOrKwh(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Price per Liter */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'តម្លៃក្នុង ១ លីត្រ (៛ KHR)' : 'Price Per Liter (KHR)'}
              </label>
              <input
                type="number"
                step="50"
                min="500"
                required
                value={pricePerLiterKHR}
                onChange={(e) => setPricePerLiterKHR(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Distance Driven */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'ចម្ងាយបើកបរ (គីឡូម៉ែត្រ)' : 'Distance Traveled (Km)'}
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Gas Station */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">
                {isKm ? 'ស្ថានីយប្រេងឥន្ធនៈ' : 'Gas Station Brand / Location'}
              </label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                placeholder="e.g. TotalEnergies, PTT, Tela, Caltex"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {isKm ? 'កំណត់សម្គាល់បន្ថែម (ស្រេចចិត្ត)' : 'Notes / Shift Details (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Full morning dispatch run across Khan Chamkarmon"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Calculated Total Bar & Submit Button */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                {isKm ? 'ថ្លៃប្រេងសរុបដែលត្រូវកត់ត្រា' : 'Total Calculated Fuel Cost'}
              </span>
              <div className="text-base font-black text-white mt-0.5">
                {calculatedFormCostKHR.toLocaleString()} ៛{' '}
                <span className="text-slate-400 font-normal text-xs">(${calculatedFormCostUSD})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isKm ? 'រក្សាទុកកំណត់ត្រា' : 'Save Fuel Record'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* FUEL CONSUMPTION AUDIT LOGS TABLE */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Fuel className="w-4 h-4 text-amber-600" />
            <span>{isKm ? 'ប្រវត្តិនៃការចាក់ប្រេង និងការប្រើប្រាស់' : 'Fuel Consumption & Economy History'}</span>
          </span>
          <span className="text-[11px] text-slate-500">
            {logs.length} {isKm ? 'កំណត់ត្រា' : 'logged entries'}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
            {isKm ? 'មិនទាន់មានកំណត់ត្រាចាក់សាំងនៅឡើយទេ។ ចុច "កត់ត្រាចាក់សាំងថ្មី" ដើម្បីចាប់ផ្តើម។' : 'No fuel logs yet. Click "Log Fuel Fill" to record your first fuel receipt.'}
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-2.5">{isKm ? 'កាលបរិច្ឆេទ' : 'Date & Time'}</th>
                  <th className="p-2.5">{isKm ? 'យានយន្ត' : 'Vehicle'}</th>
                  <th className="p-2.5">{isKm ? 'ប្រភេទ & បរិមាណ' : 'Fuel / Vol'}</th>
                  <th className="p-2.5">{isKm ? 'ស្ថានីយ' : 'Station'}</th>
                  <th className="p-2.5 text-right">{isKm ? 'ចម្ងាយ' : 'Distance'}</th>
                  <th className="p-2.5 text-right">{isKm ? 'ថ្លៃប្រេងសរុប' : 'Total Expense'}</th>
                  <th className="p-2.5 text-center">{isKm ? 'សកម្មភាព' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">
                      {log.date} <span className="text-slate-400 text-[10px]">{log.time}</span>
                    </td>
                    <td className="p-2.5 whitespace-nowrap capitalize font-medium text-slate-800">
                      {log.vehicleType === 'tuktuk' ? '🛺 TukTuk' : log.vehicleType === 'motorcycle' ? '🏍️ Moto' : '🚐 Van'}
                    </td>
                    <td className="p-2.5 whitespace-nowrap text-slate-700">
                      <span className="font-bold">{log.litersOrKwh} L</span>{' '}
                      <span className="text-[10px] text-slate-400">({log.pricePerLiterKHR.toLocaleString()}៛/L)</span>
                    </td>
                    <td className="p-2.5 whitespace-nowrap text-slate-600 truncate max-w-[150px]">
                      {log.stationName}
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-600 whitespace-nowrap">
                      {log.distanceTraveledKm} km
                    </td>
                    <td className="p-2.5 text-right font-black text-rose-700 whitespace-nowrap">
                      {currency === 'KHR'
                        ? `${log.totalCostKHR.toLocaleString()} ៛`
                        : `$${log.totalCostUSD.toFixed(2)}`}
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={isKm ? 'លុបកំណត់ត្រា' : 'Delete log'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
