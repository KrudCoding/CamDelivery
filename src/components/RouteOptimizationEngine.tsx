import React, { useState, useMemo, useEffect } from 'react';
import {
  Route,
  Navigation,
  MapPin,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Play,
  Pause,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Fuel,
  Truck,
  Phone,
  Package,
  CheckCircle2,
  Info,
  Sliders,
  ExternalLink,
  Map as MapIcon,
  Compass,
  ArrowUpDown
} from 'lucide-react';
import { Language, Currency } from '../types';
import {
  DeliveryStop,
  OptimizationResult,
  optimizeDeliveryRoute,
  formatDriverItineraryText,
  calculateRoadDistanceKm
} from '../utils/routeOptimizer';
import {
  CAMBODIA_KNOWN_LOCATIONS,
  PRESET_DELIVERY_PLANS,
  LocationOption
} from '../data/cambodiaRouteLocations';

interface RouteOptimizationEngineProps {
  language: Language;
  currency: Currency;
  onNotify?: (message: string) => void;
  onNavigateTab?: (tabId: 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
}

export const RouteOptimizationEngine: React.FC<RouteOptimizationEngineProps> = ({
  language,
  currency,
  onNotify,
  onNavigateTab,
}) => {
  const isKm = language === 'km';

  // State: current stops being planned
  const [stops, setStops] = useState<DeliveryStop[]>(PRESET_DELIVERY_PLANS[0].stops);
  const [roundTrip, setRoundTrip] = useState<boolean>(false);
  const [selectedVehicleSpeed, setSelectedVehicleSpeed] = useState<number>(38); // 38 km/h Courier
  const [activeTab, setActiveTab] = useState<'optimized' | 'original'>('optimized');
  const [copiedItinerary, setCopiedItinerary] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationIndex, setSimulationIndex] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Stop input form state
  const [newStopName, setNewStopName] = useState('');
  const [newStopAddress, setNewStopAddress] = useState('');
  const [newStopRecipient, setNewStopRecipient] = useState('');
  const [newStopPhone, setNewStopPhone] = useState('');
  const [newStopNote, setNewStopNote] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('pp-toul-kork');

  // Compute optimization result
  const optimizationResult: OptimizationResult = useMemo(() => {
    return optimizeDeliveryRoute(stops, roundTrip, selectedVehicleSpeed);
  }, [stops, roundTrip, selectedVehicleSpeed]);

  // Handle simulation animation step
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulating) {
      timer = setInterval(() => {
        setSimulationIndex((prev) => {
          if (prev >= optimizationResult.optimizedStops.length - 1) {
            setIsSimulating(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isSimulating, optimizationResult.optimizedStops.length]);

  // Load a preset plan
  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_DELIVERY_PLANS.find((p) => p.id === presetId);
    if (preset) {
      setStops(preset.stops);
      setIsSimulating(false);
      setSimulationIndex(0);
      if (onNotify) {
        onNotify(
          isKm
            ? `បានបញ្ចូលទម្រង់៖ ${preset.nameKm}`
            : `Loaded preset: ${preset.name}`
        );
      }
    }
  };

  // Add custom stop
  const handleAddStop = () => {
    const loc = CAMBODIA_KNOWN_LOCATIONS.find((l) => l.id === selectedLocationId);
    const stopName = newStopName.trim() || (loc ? (isKm ? loc.nameKm : loc.name) : 'New Delivery Stop');
    const stopAddress = newStopAddress.trim() || (loc ? (isKm ? loc.defaultAddressKm : loc.defaultAddress) : 'Phnom Penh');
    const lat = loc ? loc.lat : 11.56 + (Math.random() - 0.5) * 0.08;
    const lng = loc ? loc.lng : 104.90 + (Math.random() - 0.5) * 0.08;

    const newStop: DeliveryStop = {
      id: `stop-custom-${Date.now()}`,
      name: stopName,
      nameKm: stopName,
      address: stopAddress,
      lat,
      lng,
      recipientName: newStopRecipient.trim() || undefined,
      recipientPhone: newStopPhone.trim() || undefined,
      packageNote: newStopNote.trim() || undefined,
      packageNoteKm: newStopNote.trim() || undefined,
    };

    setStops((prev) => [...prev, newStop]);
    setNewStopName('');
    setNewStopAddress('');
    setNewStopRecipient('');
    setNewStopPhone('');
    setNewStopNote('');
    setShowAddModal(false);

    if (onNotify) {
      onNotify(isKm ? `បានបន្ថែមចំណតថ្មី៖ ${stopName}` : `Added delivery stop: ${stopName}`);
    }
  };

  // Remove stop
  const handleRemoveStop = (id: string) => {
    if (stops.length <= 2) {
      if (onNotify) {
        onNotify(isKm ? 'យ៉ាងហោចណាស់ត្រូវមានចំណតដើម និងកន្លែងទម្លាក់ ១' : 'Need at least 1 origin and 1 delivery drop');
      }
      return;
    }
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  // Move stop up or down in input order
  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    if (index === 0) return; // Origin stays at index 0
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex <= 0 || targetIndex >= stops.length) return;

    const newStops = [...stops];
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;
    setStops(newStops);
  };

  // Shuffle stops order to simulate disordered routing
  const handleShuffleOrder = () => {
    if (stops.length <= 2) return;
    const origin = stops[0];
    const rest = [...stops.slice(1)];
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    setStops([origin, ...rest]);
    if (onNotify) {
      onNotify(isKm ? 'បានផ្លាស់ប្តូរលំដាប់ចំណតដោយចៃដន្យ' : 'Shuffled stop sequence');
    }
  };

  // Copy driver dispatch itinerary
  const handleCopyItinerary = () => {
    const text = formatDriverItineraryText(optimizationResult, isKm ? 'km' : 'en');
    navigator.clipboard?.writeText?.(text);
    setCopiedItinerary(true);
    setTimeout(() => setCopiedItinerary(false), 2500);

    if (onNotify) {
      onNotify(
        isKm
          ? `បានចម្លងកាលវិភាគដឹកជញ្ជូនរៀបចំរួច (សន្សំបាន ${optimizationResult.savedDistanceKm} គ.ម)`
          : `Copied optimized driver itinerary (Saved ${optimizationResult.savedDistanceKm} km)`
      );
    }
  };

  // Estimated fuel savings in KHR (approx 450 KHR per km saved at Cambodian fuel rates)
  const savedFuelCostKHR = Math.round(optimizationResult.savedDistanceKm * 450);
  const savedFuelCostUSD = Number((savedFuelCostKHR / 4100).toFixed(2));

  // Stops to display based on active tab
  const displayStops =
    activeTab === 'optimized'
      ? optimizationResult.optimizedStops
      : stops;

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-7 border border-slate-200 shadow-sm space-y-6">
      {/* Header with Title & Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>
                  {isKm
                    ? 'ម៉ាស៊ីនរៀបចំលំដាប់ផ្លូវដឹកជញ្ជូនប្រសើរបំផុត'
                    : 'Multi-Stop Delivery Route Optimizer'}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  TSP Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKm
                  ? 'បញ្ចូលអាសយដ្ឋានដឹកច្រើនទីតាំង ប្រព័ន្ធគណនារកផ្លូវខ្លីបំផុតដើម្បីសន្សំចម្ងាយ ពេលវេលា និងសាំង'
                  : 'Input multiple drop-offs to calculate the most distance-efficient sequence and minimize mileage'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets Picker */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-500 shrink-0">
            {isKm ? 'គំរូរហ័ស៖' : 'Presets:'}
          </span>
          {PRESET_DELIVERY_PLANS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition flex items-center gap-1 shrink-0 border border-slate-200"
            >
              <span>{preset.icon}</span>
              <span className="text-[11px]">
                {preset.id === 'phnom-penh-express-circuit'
                  ? isKm ? 'ភ្នំពេញ ៥ កន្លែង' : 'Phnom Penh'
                  : preset.id === 'nr6-highway-line'
                  ? isKm ? 'ផ្លូវជាតិលេខ ៦' : 'NR6 Siem Reap'
                  : isKm ? 'ឆ្នេរសមុទ្រ' : 'Coastal Loop'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* PARAMETERS BAR: Vehicle Speed & Route Mode (One-way vs Round Trip) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
        {/* Vehicle Mode */}
        <div className="lg:col-span-5 flex items-center gap-2">
          <Truck className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold text-slate-700 shrink-0">
            {isKm ? 'មធ្យោបាយដឹក៖' : 'Transport Mode:'}
          </span>
          <select
            value={selectedVehicleSpeed}
            onChange={(e) => setSelectedVehicleSpeed(Number(e.target.value))}
            className="w-full bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            <option value={28}>🛵 {isKm ? 'ម៉ូតូដឹកបន្ទាន់ (28 គ.ម/ម៉)' : 'City Moto Express (28 km/h)'}</option>
            <option value={38}>🚪 {isKm ? 'អ្នកដឹកតាមផ្ទះ (38 គ.ម/ម៉)' : 'Door-to-Door Courier (38 km/h)'}</option>
            <option value={60}>🚐 {isKm ? 'ឡានវ៉ែនអន្តរខេត្ត (60 គ.ម/ម៉)' : 'Interprovincial Van (60 km/h)'}</option>
            <option value={42}>🚚 {isKm ? 'ឡានធំដឹកទំនិញ (42 គ.ម/ម៉)' : 'Heavy Freight Truck (42 km/h)'}</option>
          </select>
        </div>

        {/* Route Type: One-way vs Round Trip */}
        <div className="lg:col-span-4 flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-bold text-slate-700 shrink-0">
            {isKm ? 'ប្រភេទផ្លូវ៖' : 'Route Type:'}
          </span>
          <div className="inline-flex rounded-xl p-0.5 bg-slate-200 w-full">
            <button
              type="button"
              onClick={() => setRoundTrip(false)}
              className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition ${
                !roundTrip ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isKm ? 'បញ្ចប់នៅចំណតចុងក្រោយ' : 'Open (End at Last Drop)'}
            </button>
            <button
              type="button"
              onClick={() => setRoundTrip(true)}
              className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition ${
                roundTrip ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isKm ? 'វិលត្រឡប់ឃ្លាំង' : 'Round Trip'}
            </button>
          </div>
        </div>

        {/* Action Controls: Shuffle test & Add Stop */}
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleShuffleOrder}
            title={isKm ? 'ច្របល់លំដាប់ដើម្បីសាកល្បងម៉ាស៊ីនរៀបចំ' : 'Shuffle stop order to test optimizer'}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center gap-1 text-[11px]"
          >
            <Shuffle className="w-3.5 h-3.5 text-slate-500" />
            <span>{isKm ? 'ច្របល់លំដាប់' : 'Shuffle'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1 shadow-xs text-[11px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isKm ? 'បន្ថែមចំណត' : 'Add Stop'}</span>
          </button>
        </div>
      </div>

      {/* MODAL: Add New Delivery Stop */}
      {showAddModal && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-700 space-y-3.5 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="font-bold text-sm flex items-center gap-2 text-rose-400">
              <MapPin className="w-4 h-4" />
              <span>{isKm ? 'បញ្ចូលចំណតដឹកជញ្ជូនថ្មី' : 'Add New Delivery Stop'}</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded-md hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Quick Cambodian Location Selector */}
            <div className="sm:col-span-2">
              <label className="text-slate-300 block mb-1 font-semibold">
                {isKm ? 'ជ្រើសរើសទីតាំងរហ័ស (ខេត្ត ឬខណ្ឌក្នុងភ្នំពេញ)' : 'Quick Select Cambodian Hub / District'}
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  const loc = CAMBODIA_KNOWN_LOCATIONS.find((l) => l.id === e.target.value);
                  if (loc) {
                    setNewStopName(isKm ? loc.nameKm : loc.name);
                    setNewStopAddress(isKm ? loc.defaultAddressKm : loc.defaultAddress);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <optgroup label="Phnom Penh Commercial Hubs">
                  {CAMBODIA_KNOWN_LOCATIONS.filter((l) => l.category === 'phnom_penh').map((l) => (
                    <option key={l.id} value={l.id}>
                      {isKm ? l.nameKm : l.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Provincial Centers">
                  {CAMBODIA_KNOWN_LOCATIONS.filter((l) => l.category === 'province').map((l) => (
                    <option key={l.id} value={l.id}>
                      {isKm ? l.nameKm : l.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                {isKm ? 'ឈ្មោះចំណត / ឈ្មោះហាង' : 'Stop / Store Name'}
              </label>
              <input
                type="text"
                value={newStopName}
                onChange={(e) => setNewStopName(e.target.value)}
                placeholder={isKm ? 'ឧ. ហាងកាហ្វេ BKK1' : 'e.g. BKK1 Coffee Store'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                {isKm ? 'អាសយដ្ឋានលម្អិត' : 'Specific Address'}
              </label>
              <input
                type="text"
                value={newStopAddress}
                onChange={(e) => setNewStopAddress(e.target.value)}
                placeholder={isKm ? 'ផ្លូវលេខ...' : 'Street / Sangkat...'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                {isKm ? 'ឈ្មោះអ្នកទទួល (បើមាន)' : 'Recipient Name (Optional)'}
              </label>
              <input
                type="text"
                value={newStopRecipient}
                onChange={(e) => setNewStopRecipient(e.target.value)}
                placeholder={isKm ? 'ឧ. លោក សុខា' : 'e.g. Mr. Sokha'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                {isKm ? 'លេខទូរស័ព្ទ' : 'Contact Phone'}
              </label>
              <input
                type="text"
                value={newStopPhone}
                onChange={(e) => setNewStopPhone(e.target.value)}
                placeholder="012 xxx xxx"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-300 block mb-1 font-semibold">
                {isKm ? 'ចំណាំឥវ៉ាន់ / បញ្ជាក់' : 'Package Note / Special Handling'}
              </label>
              <input
                type="text"
                value={newStopNote}
                onChange={(e) => setNewStopNote(e.target.value)}
                placeholder={isKm ? 'ឧ. កញ្ចប់ម្ហូបស្រស់ ២ ប្រអប់' : 'e.g. 2 boxes organic food'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              {isKm ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleAddStop}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
            >
              {isKm ? 'យល់ព្រមបន្ថែម' : 'Confirm Add'}
            </button>
          </div>
        </div>
      )}

      {/* OPTIMIZATION RESULTS SUMMARY CARD */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white shadow-lg space-y-4 border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                {isKm ? 'លទ្ធផលរៀបចំផ្លូវកាត់បន្ថយចម្ងាយ' : 'Distance-Minimization Benchmark'}
              </span>
              {optimizationResult.savedDistanceKm > 0 ? (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>{isKm ? `សន្សំបាន ${optimizationResult.savedPercent}%` : `Saved ${optimizationResult.savedPercent}%`}</span>
                </span>
              ) : (
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-sky-500/40">
                  {isKm ? 'ផ្លូវខ្លីបំផុតរួចរាល់' : 'Already Optimal'}
                </span>
              )}
            </div>
            <h3 className="text-lg md:text-xl font-black text-white mt-1 flex items-center gap-2">
              <span>{stops[0]?.[isKm ? 'nameKm' : 'name']}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span>{stops.length - 1} {isKm ? 'កន្លែងទម្លាក់' : 'Delivery Drops'}</span>
            </h3>
          </div>

          {/* Quick Tab Switcher: Optimized vs Original */}
          <div className="inline-flex rounded-xl p-1 bg-black/40 border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('optimized')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'optimized'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isKm ? 'លំដាប់ខ្លីបំផុត (Optimized)' : 'Optimized Sequence'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('original')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'original'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{isKm ? 'លំដាប់ដើម (Original)' : 'Original Input'}</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Optimized Distance */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">
              {isKm ? 'ចម្ងាយសរុប (Optimized)' : 'Optimized Total Distance'}
            </span>
            <div className="text-lg font-black text-rose-400 mt-0.5">
              {optimizationResult.optimizedDistanceKm} km
            </div>
            <span className="text-[10px] text-slate-400">
              {isKm ? `ពី ${optimizationResult.originalDistanceKm} km លំដាប់ដើម` : `vs ${optimizationResult.originalDistanceKm} km unoptimized`}
            </span>
          </div>

          {/* Distance Saved */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[11px] text-emerald-300 font-bold block flex items-center justify-between">
              <span>{isKm ? 'ចម្ងាយសន្សំបាន' : 'Distance Saved'}</span>
              <span className="text-[9px] bg-emerald-500 text-slate-950 px-1 py-0.2 rounded-sm font-black">
                -{optimizationResult.savedPercent}%
              </span>
            </span>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {optimizationResult.savedDistanceKm} km
            </div>
            <span className="text-[10px] text-emerald-300">
              {isKm ? 'កាត់បន្ថយការបើកផ្លូវវាង' : 'Less road detour'}
            </span>
          </div>

          {/* Fuel & Cost Saved */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[11px] text-amber-300 font-bold block flex items-center justify-between">
              <span>{isKm ? 'សន្សំថ្លៃសាំង & ឡាន' : 'Fuel Cost Saved'}</span>
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="text-lg font-black text-amber-300 mt-0.5">
              {currency === 'KHR' ? `${savedFuelCostKHR.toLocaleString()} ៛` : `$${savedFuelCostUSD.toFixed(2)}`}
            </div>
            <span className="text-[10px] text-amber-300">
              {isKm ? 'គិតជាមធ្យម ៤៥០៛/គ.ម' : '~450 KHR/km fuel burn'}
            </span>
          </div>

          {/* Duration & Time Saved */}
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <span className="text-[11px] text-sky-300 font-bold block flex items-center justify-between">
              <span>{isKm ? 'រយៈពេលដឹកជញ្ជូន' : 'Estimated Duration'}</span>
              <Clock className="w-3.5 h-3.5 text-sky-400" />
            </span>
            <div className="text-lg font-black text-sky-300 mt-0.5">
              ~{Math.floor(optimizationResult.optimizedDurationMinutes / 60)}h {optimizationResult.optimizedDurationMinutes % 60}m
            </div>
            <span className="text-[10px] text-sky-300">
              {optimizationResult.savedMinutes > 0
                ? isKm ? `លឿនជាងមុន ${optimizationResult.savedMinutes} នាទី` : `Faster by ${optimizationResult.savedMinutes} mins`
                : isKm ? 'រួមបញ្ចូលពេលលើកដាក់ ៨ន./កន្លែង' : 'Includes 8m stop handling'}
            </span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                isSimulating
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>{isKm ? 'ផ្អាកការធ្វើដំណើរ' : 'Pause Simulation'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{isKm ? 'ចាក់ត្រាប់តាមផ្លូវ' : 'Simulate Route'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyItinerary}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
            >
              {copiedItinerary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">{isKm ? 'បានចម្លងកាលវិភាគ!' : 'Itinerary Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isKm ? 'ចម្លងកាលវិភាគបញ្ជូនឱ្យអ្នកដឹក' : 'Copy Driver Itinerary'}</span>
                </>
              )}
            </button>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('courier')}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md"
            >
              <span>{isKm ? 'កក់ការផ្ញើឥវ៉ាន់ (Book Fleet)' : 'Book Shipment Fleet'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SCHEMATIC ROUTE PROGRESS BAR (Visual Breadcrumb of Sequence) */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Navigation className="w-4 h-4 text-rose-600" />
            <span>
              {activeTab === 'optimized'
                ? isKm ? 'លំដាប់ចំណតដែលបានរៀបចំរួច (Optimized Stop Order)' : 'Suggested Sequence of Stops'
                : isKm ? 'លំដាប់ចំណតដែលបានបញ្ចូលដើម (Original Order)' : 'Original Stop Sequence'}
            </span>
          </span>
          <span className="text-[11px] text-slate-500">
            {isKm ? `សរុប ${displayStops.length} ចំណត` : `${displayStops.length} checkpoints`}
          </span>
        </div>

        {/* Horizontal Waypoint Track */}
        <div className="relative py-2 overflow-x-auto">
          <div className="flex items-center min-w-[580px] gap-2">
            {displayStops.map((stop, idx) => {
              const isStart = idx === 0;
              const isEnd = idx === displayStops.length - 1;
              const isCurrentSim = isSimulating && simulationIndex === idx;

              return (
                <React.Fragment key={`${stop.id}-${idx}`}>
                  <div
                    className={`flex flex-col items-center text-center p-2 rounded-xl transition min-w-[100px] border ${
                      isCurrentSim
                        ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400/40 scale-105 shadow-sm'
                        : isStart
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : isEnd && roundTrip
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs mb-1 ${
                        isCurrentSim
                          ? 'bg-amber-500 text-slate-950 animate-bounce'
                          : isStart
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-white'
                      }`}
                    >
                      {isStart ? '🏁' : idx}
                    </div>
                    <span className="text-[11px] font-bold truncate max-w-[90px]">
                      {isKm ? stop.nameKm : stop.name}
                    </span>
                    <span className="text-[9px] text-slate-500 truncate max-w-[90px]">
                      {stop.recipientName || (isKm ? 'ចំណតទម្លាក់' : 'Drop point')}
                    </span>
                  </div>

                  {!isEnd && (
                    <div className="flex-1 flex flex-col items-center justify-center shrink-0 px-1">
                      <ArrowRight className="w-4 h-4 text-rose-500 animate-pulse" />
                      {activeTab === 'optimized' && optimizationResult.legs[idx] && (
                        <span className="text-[9px] font-bold text-slate-500">
                          +{optimizationResult.legs[idx].distanceKm}km
                        </span>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAILED STOP-BY-STOP TIMELINE & ACTION CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-600" />
            <span>{isKm ? 'ព័ត៌មានលម្អិតនៃចំណតនីមួយៗ (Turn-by-Turn Waypoints)' : 'Step-by-Step Delivery Schedule'}</span>
          </h4>
          <span className="text-[11px] text-slate-500">
            {isKm ? 'គណនាលើល្បឿនមធ្យម ' + selectedVehicleSpeed + ' គ.ម/ម៉' : `Calculated at ${selectedVehicleSpeed} km/h avg pace`}
          </span>
        </div>

        <div className="space-y-2.5">
          {displayStops.map((stop, idx) => {
            const isStart = idx === 0;
            const leg = activeTab === 'optimized' && idx > 0 ? optimizationResult.legs[idx - 1] : null;

            return (
              <div
                key={`${stop.id}-card-${idx}`}
                className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isStart
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Sequence Number and Name/Address */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${
                      isStart
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    {isStart ? '🏁' : `#${idx}`}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-slate-900 text-xs md:text-sm">
                        {isKm ? stop.nameKm : stop.name}
                      </h5>
                      {isStart && (
                        <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-black">
                          {isKm ? 'ចំណតដើម / ឃ្លាំង' : 'Origin / Depot'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{stop.address}</span>
                    </p>

                    {/* Recipient & Package details */}
                    {(stop.recipientName || stop.packageNote) && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px]">
                        {stop.recipientName && (
                          <span className="text-slate-700 font-semibold flex items-center gap-1">
                            <span>👤 {stop.recipientName}</span>
                            {stop.recipientPhone && (
                              <a
                                href={`tel:${stop.recipientPhone}`}
                                className="text-rose-600 hover:underline font-bold"
                              >
                                ({stop.recipientPhone})
                              </a>
                            )}
                          </span>
                        )}
                        {stop.packageNote && (
                          <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 font-medium">
                            📦 {isKm ? stop.packageNoteKm || stop.packageNote : stop.packageNote}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Distance, ETA, and Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {leg ? (
                    <div className="text-right">
                      <div className="text-xs font-black text-rose-700">
                        {isKm ? leg.etaClockKm : leg.etaClockEn}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        +{leg.distanceKm} km (~{leg.travelMinutes}m drive)
                      </div>
                    </div>
                  ) : isStart ? (
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-600">
                        {isKm ? 'ម៉ោង ០៨:០០ ព្រឹក' : '08:00 AM Departure'}
                      </div>
                      <div className="text-[10px] text-slate-400">0.0 km</div>
                    </div>
                  ) : null}

                  {/* Move & Delete Controls (Only in original tab to rearrange raw stops) */}
                  {activeTab === 'original' && !isStart && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveStop(idx, 'up')}
                        disabled={idx === 1}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                        title={isKm ? 'រំកិលឡើងលើ' : 'Move up'}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStop(idx, 'down')}
                        disabled={idx === stops.length - 1}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                        title={isKm ? 'រំកិលចុះក្រោម' : 'Move down'}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(stop.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                        title={isKm ? 'លុបចំណត' : 'Delete stop'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
