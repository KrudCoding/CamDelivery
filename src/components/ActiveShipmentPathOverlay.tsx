import React, { useState, useEffect, useMemo } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  Compass,
  Zap,
  ArrowRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Layers,
  ChevronRight,
  Radio,
  Share2,
  Eye,
  CheckCircle2,
  Sparkles,
  Truck
} from 'lucide-react';
import { TrackingItem, Language, Currency } from '../types';

interface ActiveShipmentPathOverlayProps {
  shipments: TrackingItem[];
  currentShipment: TrackingItem;
  language: Language;
  currency: Currency;
  onSelectShipment: (shipment: TrackingItem) => void;
  onOpenDriverProfile?: () => void;
  onOpenChat?: () => void;
}

// Cambodia bounding box for GPS to SVG projection
const CAMBODIA_GEO = {
  minLat: 10.25,
  maxLat: 14.70,
  minLng: 102.30,
  maxLng: 107.65,
};

// Major Cambodian Provincial Hubs for the visual map background
const CAMBODIA_MAJOR_HUBS = [
  { id: 'pp', name: 'Phnom Penh', nameKm: 'រាជធានីភ្នំពេញ', lat: 11.5564, lng: 104.9282, isCapital: true },
  { id: 'sr', name: 'Siem Reap', nameKm: 'សៀមរាប', lat: 13.3671, lng: 103.8448 },
  { id: 'bb', name: 'Battambang', nameKm: 'បាត់ដំបង', lat: 13.0957, lng: 103.2022 },
  { id: 'shv', name: 'Sihanoukville', nameKm: 'ព្រះសីហនុ', lat: 10.6275, lng: 103.5221 },
  { id: 'kp', name: 'Kampot', nameKm: 'កំពត', lat: 10.6104, lng: 104.1815 },
  { id: 'kc', name: 'Kampong Cham', nameKm: 'កំពង់ចាម', lat: 11.9934, lng: 105.4635 },
  { id: 'kt', name: 'Kampong Thom', nameKm: 'កំពង់ធំ', lat: 12.7111, lng: 104.8887 },
  { id: 'ps', name: 'Pursat', nameKm: 'ពោធិ៍សាត់', lat: 12.5388, lng: 103.9192 },
  { id: 'kr', name: 'Kratie', nameKm: 'ក្រចេះ', lat: 12.4881, lng: 106.0188 },
  { id: 'sr2', name: 'Svay Rieng', nameKm: 'ស្វាយរៀង', lat: 11.0879, lng: 105.7994 },
];

// Helper: project GPS (lat, lng) to SVG viewBox [0,0, 640, 360]
const projectGeoToSvg = (lat: number, lng: number, width = 640, height = 360) => {
  const x = ((lng - CAMBODIA_GEO.minLng) / (CAMBODIA_GEO.maxLng - CAMBODIA_GEO.minLng)) * width;
  const y = ((CAMBODIA_GEO.maxLat - lat) / (CAMBODIA_GEO.maxLat - CAMBODIA_GEO.minLat)) * height;
  return { x: Math.max(15, Math.min(width - 15, x)), y: Math.max(15, Math.min(height - 15, y)) };
};

// Calculate Haversine distance in km between two lat/lng coordinates
const calculateCoordinateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Add realistic 1.22x factor for Cambodian highway road curves
  return Number((R * c * 1.22).toFixed(1));
};

// Calculate compass bearing in degrees from point 1 to point 2
const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return Math.round(((theta * 180) / Math.PI + 360) % 360);
};

// Convert degrees to cardinal compass text
const getCardinalDirection = (degrees: number, isKm: boolean): string => {
  const cardinals = [
    { en: 'North (N)', km: 'ជើង (N)' },
    { en: 'Northeast (NE)', km: 'ឦសាន (NE)' },
    { en: 'East (E)', km: 'កើត (E)' },
    { en: 'Southeast (SE)', km: 'អាគ្នេយ៍ (SE)' },
    { en: 'South (S)', km: 'ត្បូង (S)' },
    { en: 'Southwest (SW)', km: 'និរតី (SW)' },
    { en: 'West (W)', km: 'លិច (W)' },
    { en: 'Northwest (NW)', km: 'ពាយព្យ (NW)' },
  ];
  const index = Math.round(degrees / 45) % 8;
  return isKm ? cardinals[index].km : cardinals[index].en;
};

export const ActiveShipmentPathOverlay: React.FC<ActiveShipmentPathOverlayProps> = ({
  shipments,
  currentShipment,
  language,
  currency,
  onSelectShipment,
  onOpenDriverProfile,
  onOpenChat,
}) => {
  const isKm = language === 'km';
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [progressOffset, setProgressOffset] = useState<number>(0);
  const [mapTheme, setMapTheme] = useState<'satellite' | 'blueprint' | 'light'>('satellite');

  // Filter only active shipments (not delivered)
  const activeShipmentsList = useMemo(() => {
    return shipments.filter((s) => s.status !== 'delivered');
  }, [shipments]);

  // Fallback to all if all are delivered
  const displayShipments = activeShipmentsList.length > 0 ? activeShipmentsList : shipments;

  // Extract coordinates for the active shipment
  const coords = currentShipment.routeCoordinates;
  const startCoord = coords?.start || { lat: 11.5564, lng: 104.9282, label: currentShipment.senderCity };
  const currentCoord = coords?.current || { lat: 12.7111, lng: 104.8887, label: 'En-Route' };
  const endCoord = coords?.end || { lat: 13.3671, lng: 103.8448, label: currentShipment.receiverCity };

  // Calculate distance remaining between current location and destination
  const remainingDistanceKm = useMemo(() => {
    return calculateCoordinateDistance(
      currentCoord.lat,
      currentCoord.lng,
      endCoord.lat,
      endCoord.lng
    );
  }, [currentCoord.lat, currentCoord.lng, endCoord.lat, endCoord.lng]);

  // Calculate total road distance from origin to destination
  const totalDistanceKm = useMemo(() => {
    return calculateCoordinateDistance(
      startCoord.lat,
      startCoord.lng,
      endCoord.lat,
      endCoord.lng
    );
  }, [startCoord.lat, startCoord.lng, endCoord.lat, endCoord.lng]);

  // Traveled distance
  const traveledDistanceKm = Math.max(0, Number((totalDistanceKm - remainingDistanceKm).toFixed(1)));
  const completionPercentage = totalDistanceKm > 0
    ? Math.min(99, Math.max(5, Math.round((traveledDistanceKm / totalDistanceKm) * 100)))
    : 65;

  // Bearing from current position to destination
  const bearingDegrees = useMemo(() => {
    return calculateBearing(
      currentCoord.lat,
      currentCoord.lng,
      endCoord.lat,
      endCoord.lng
    );
  }, [currentCoord.lat, currentCoord.lng, endCoord.lat, endCoord.lng]);

  // Estimated driving hours remaining at average 55 km/h
  const remainingMinutes = Math.round((remainingDistanceKm / 55) * 60);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMinsOnly = remainingMinutes % 60;

  // Project points to SVG canvas coordinates
  const svgStart = useMemo(() => projectGeoToSvg(startCoord.lat, startCoord.lng), [startCoord.lat, startCoord.lng]);
  const svgCurrent = useMemo(() => projectGeoToSvg(currentCoord.lat, currentCoord.lng), [currentCoord.lat, currentCoord.lng]);
  const svgEnd = useMemo(() => projectGeoToSvg(endCoord.lat, endCoord.lng), [endCoord.lat, endCoord.lng]);

  // Simulated beacon pulse along the path between current location and destination
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setProgressOffset((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 120);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Interpolated animated position between Current and Destination
  const interpolatedSimPoint = useMemo(() => {
    const fraction = progressOffset / 100;
    const x = svgCurrent.x + (svgEnd.x - svgCurrent.x) * fraction;
    const y = svgCurrent.y + (svgEnd.y - svgCurrent.y) * fraction;
    return { x, y };
  }, [svgCurrent, svgEnd, progressOffset]);

  return (
    <div className="bg-slate-900 text-white rounded-2xl md:rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative transition-all">
      {/* Top Banner & Active Shipments Switcher Bar */}
      <div className="p-3.5 md:p-4.5 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs md:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>
                  {isKm
                    ? 'ផ្ទាំងផែនទីតាមដានផ្លូវផ្ទាល់ (Real-Time Path Overlay)'
                    : 'Real-Time Path & Coordinate Overlay'}
                </span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● LIVE GPS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isKm
                ? 'បង្ហាញគន្លងផ្លូវជាក់ស្តែងតាមរយៈកូអរដោនេ (Coordinates) រវាងទីតាំងបច្ចុប្បន្ន និងគោលដៅ'
                : 'Live coordinate path projection between current driver location and final destination'}
            </p>
          </div>
        </div>

        {/* Action Controls: Expand/Collapse & Map Theme */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 text-[10px]">
            <button
              type="button"
              onClick={() => setMapTheme('satellite')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                mapTheme === 'satellite'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isKm ? 'រាត្រី' : 'Night'}
            </button>
            <button
              type="button"
              onClick={() => setMapTheme('blueprint')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                mapTheme === 'blueprint'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isKm ? 'រ៉ាដា' : 'Radar'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isSimulating
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={isSimulating ? 'Pause Pulse' : 'Resume Pulse'}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ACTIVE SHIPMENTS QUICK SELECTOR CAROUSEL */}
      <div className="px-3.5 py-2 bg-slate-900/95 border-b border-slate-800/80 overflow-x-auto flex items-center gap-2 scrollbar-thin">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Truck className="w-3 h-3 text-rose-400" />
          <span>{isKm ? 'កញ្ចប់សកម្ម៖' : 'Active Parcels:'}</span>
        </span>

        {displayShipments.map((ship) => {
          const isSelected = ship.trackingNumber === currentShipment.trackingNumber;
          return (
            <button
              key={ship.trackingNumber}
              type="button"
              onClick={() => onSelectShipment(ship)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-1 ring-rose-400/50'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? '#ffffff' : ship.brandColor || '#10b981' }}
              />
              <span className="font-mono text-[11px]">{ship.trackingNumber}</span>
              <span className="text-[10px] opacity-80 hidden sm:inline">
                ({isKm ? ship.senderCityKm : ship.senderCity} ➔ {isKm ? ship.receiverCityKm : ship.receiverCity})
              </span>
            </button>
          );
        })}
      </div>

      {isExpanded && (
        <div className="p-4 md:p-5 space-y-4">
          {/* TELEMETRY TELEGRAPH BAR: Coordinates & Path Distance to Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {/* 1. Current Location Coordinates */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{isKm ? 'ទីតាំងបច្ចុប្បន្ន (Current)' : 'Current Coordinates'}</span>
                </span>
                <span className="font-mono text-amber-300">{currentShipment.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="font-bold text-white text-xs mt-1 truncate">
                {isKm ? (coords?.current?.label || currentShipment.senderCityKm) : (coords?.current?.label || currentShipment.senderCity)}
              </div>
              <div className="font-mono text-[11px] text-amber-400/90 mt-0.5">
                {currentCoord.lat.toFixed(4)}° N, {currentCoord.lng.toFixed(4)}° E
              </div>
            </div>

            {/* 2. Destination Coordinates */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1 text-emerald-400">
                  <MapPin className="w-3 h-3" />
                  <span>{isKm ? 'គោលដៅអ្នកទទួល (Destination)' : 'Destination Coordinates'}</span>
                </span>
                <span className="text-emerald-400 font-mono">FINISH</span>
              </div>
              <div className="font-bold text-white text-xs mt-1 truncate">
                {isKm ? currentShipment.receiverCityKm : currentShipment.receiverCity}
              </div>
              <div className="font-mono text-[11px] text-emerald-400/90 mt-0.5">
                {endCoord.lat.toFixed(4)}° N, {endCoord.lng.toFixed(4)}° E
              </div>
            </div>

            {/* 3. Real-Time Remaining Path Distance */}
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <div className="flex items-center justify-between text-rose-300 text-[10px] uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  <span>{isKm ? 'គម្លាតផ្លូវនៅសល់' : 'Path to Destination'}</span>
                </span>
                <span className="font-mono bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded">
                  -{remainingDistanceKm} km
                </span>
              </div>
              <div className="text-base font-black text-rose-400 mt-1 flex items-baseline gap-1">
                <span>{remainingDistanceKm}</span>
                <span className="text-xs font-normal text-rose-300/80">km remaining</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isKm
                  ? `បានធ្វើដំណើរ ${traveledDistanceKm} km (${completionPercentage}%)`
                  : `Traveled ${traveledDistanceKm} of ${totalDistanceKm} km (${completionPercentage}%)`}
              </div>
            </div>

            {/* 4. Compass Bearing & ETA */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              <div className="flex items-center justify-between text-indigo-300 text-[10px] uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  <span>{isKm ? 'ទិសដៅ & ពេលមកដល់' : 'Bearing & Estimated ETA'}</span>
                </span>
                <span className="font-mono">{bearingDegrees}°</span>
              </div>
              <div className="text-xs font-black text-indigo-200 mt-1 flex items-center gap-1">
                <span>{getCardinalDirection(bearingDegrees, isKm)}</span>
                <span className="text-indigo-400">•</span>
                <span className="text-emerald-400">
                  ~{remainingHours > 0 ? `${remainingHours}h ` : ''}{remainingMinsOnly}m
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                {currentShipment.driverName
                  ? `${currentShipment.driverName} (${currentShipment.driverPlate || 'PP-Transit'})`
                  : (isKm ? 'កំពុងធ្វើដំណើរលើផ្លូវជាតិ' : 'Transit on National Highway')}
              </div>
            </div>
          </div>

          {/* LIGHTWEIGHT INTERACTIVE SVG MAP OVERLAY VIEWPORT */}
          <div className="relative w-full h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 select-none">
            {/* Cambodia Map Projection SVG Canvas */}
            <svg
              viewBox="0 0 640 360"
              className="w-full h-full pointer-events-auto"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Glow filter for active real-time path */}
                <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Gradient for traveled path */}
                <linearGradient id="traveled-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                </linearGradient>

                {/* Gradient for remaining real-time path between Current and Destination */}
                <linearGradient id="remaining-path-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background Topography Grid Lines */}
              <g opacity="0.12" stroke="#64748b" strokeWidth="0.6">
                {[80, 160, 240, 320, 400, 480, 560].map((x) => (
                  <line key={`grid-x-${x}`} x1={x} y1="0" x2={x} y2="360" strokeDasharray="3, 4" />
                ))}
                {[60, 120, 180, 240, 300].map((y) => (
                  <line key={`grid-y-${y}`} x1="0" y1={y} x2="640" y2={y} strokeDasharray="3, 4" />
                ))}
              </g>

              {/* Tonle Sap Lake & Mekong Waterway Artistic Reference */}
              <path
                d="M 230 150 Q 280 180 340 210 Q 300 230 240 180 Z"
                fill="#0369a1"
                opacity="0.22"
              />
              <text x="250" y="185" fill="#38bdf8" opacity="0.35" fontSize="9" fontWeight="bold">
                បឹងទន្លេសាប (Tonle Sap)
              </text>

              {/* Major Cambodian Hubs as subtle waypoint markers */}
              {CAMBODIA_MAJOR_HUBS.map((hub) => {
                const pt = projectGeoToSvg(hub.lat, hub.lng);
                return (
                  <g key={hub.id} transform={`translate(${pt.x}, ${pt.y})`}>
                    <circle r={hub.isCapital ? 4 : 2.5} fill="#475569" opacity="0.6" />
                    <text
                      x="6"
                      y="3"
                      fill="#94a3b8"
                      fontSize="8"
                      fontWeight="500"
                      opacity="0.6"
                      className="pointer-events-none select-none"
                    >
                      {isKm ? hub.nameKm : hub.name}
                    </text>
                  </g>
                );
              })}

              {/* 1. Traveled Highway Path (Origin to Current Location) */}
              <line
                x1={svgStart.x}
                y1={svgStart.y}
                x2={svgCurrent.x}
                y2={svgCurrent.y}
                stroke="url(#traveled-grad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* 2. REAL-TIME PATH: Current Location to Destination */}
              {/* Underlying glowing beam */}
              <line
                x1={svgCurrent.x}
                y1={svgCurrent.y}
                x2={svgEnd.x}
                y2={svgEnd.y}
                stroke="#e11d48"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.28"
                filter="url(#path-glow)"
              />

              {/* Main Animated Vector Line between Current Location and Destination */}
              <line
                x1={svgCurrent.x}
                y1={svgCurrent.y}
                x2={svgEnd.x}
                y2={svgEnd.y}
                stroke="url(#remaining-path-grad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="6, 6"
                className="animate-[dash_1.5s_linear_infinite]"
              />

              {/* Animated beacon moving between Current and Destination */}
              {isSimulating && (
                <circle
                  cx={interpolatedSimPoint.x}
                  cy={interpolatedSimPoint.y}
                  r="3.5"
                  fill="#ffffff"
                  filter="url(#path-glow)"
                />
              )}

              {/* ORIGIN HUB MARKER */}
              <g transform={`translate(${svgStart.x}, ${svgStart.y})`}>
                <circle r="7" fill="#0284c7" opacity="0.4" />
                <circle r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="-35" y="-22" width="70" height="15" rx="4" fill="#0f172a" opacity="0.85" stroke="#334155" strokeWidth="0.8" />
                <text x="0" y="-12" textAnchor="middle" fill="#bae6fd" fontSize="7.5" fontWeight="bold">
                  {startCoord.label || currentShipment.senderCity}
                </text>
              </g>

              {/* DESTINATION HUB MARKER */}
              <g transform={`translate(${svgEnd.x}, ${svgEnd.y})`}>
                <circle r="9" fill="#10b981" opacity="0.3" className="animate-ping" />
                <circle r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.8" />
                <rect x="-36" y="-23" width="72" height="16" rx="4" fill="#064e3b" opacity="0.9" stroke="#10b981" strokeWidth="0.8" />
                <text x="0" y="-12" textAnchor="middle" fill="#d1fae5" fontSize="7.5" fontWeight="bold">
                  🏁 {endCoord.label || currentShipment.receiverCity}
                </text>
              </g>

              {/* CURRENT DRIVER / VEHICLE MARKER WITH PULSING RADAR RINGS */}
              <g transform={`translate(${svgCurrent.x}, ${svgCurrent.y})`}>
                {/* Radar waves */}
                <circle r="18" fill="#f59e0b" opacity="0.18" className="animate-ping" />
                <circle r="12" fill="#f59e0b" opacity="0.3" />
                <circle r="6" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />

                {/* Dynamic Bearing Arrow */}
                <g transform={`rotate(${bearingDegrees})`}>
                  <polygon points="0,-13 4,-7 -4,-7" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.8" />
                </g>

                {/* Live Position Label Callout */}
                <rect
                  x="-55"
                  y="12"
                  width="110"
                  height="20"
                  rx="5"
                  fill="#0f172a"
                  stroke="#e11d48"
                  strokeWidth="1"
                  opacity="0.95"
                  filter="url(#path-glow)"
                />
                <text x="0" y="24" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                  🚚 {currentShipment.driverName ? currentShipment.driverName.split(' ')[0] : 'Courier'} • {remainingDistanceKm}km Left
                </text>
              </g>
            </svg>

            {/* Overlaid Live Status Floating HUD Box (Top Left) */}
            <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-lg text-[10px] space-y-1 pointer-events-none">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {isKm ? 'គន្លងផ្លូវជាក់ស្តែង (Real-Time Path)' : 'Live Highway Vector Corridor'}
                </span>
              </div>
              <div className="text-slate-400 flex items-center gap-1">
                <span className="text-amber-400 font-mono">
                  {currentCoord.lat.toFixed(3)}°N, {currentCoord.lng.toFixed(3)}°E
                </span>
                <span>➔</span>
                <span className="text-emerald-400 font-mono">
                  {endCoord.lat.toFixed(3)}°N, {endCoord.lng.toFixed(3)}°E
                </span>
              </div>
            </div>

            {/* Floating Compass Rose (Top Right) */}
            <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-lg flex flex-col items-center pointer-events-none">
              <Compass
                className="w-5 h-5 text-amber-400 transition-transform duration-500"
                style={{ transform: `rotate(${bearingDegrees}deg)` }}
              />
              <span className="text-[9px] font-mono font-bold text-slate-300 mt-0.5">
                {bearingDegrees}°
              </span>
            </div>

            {/* Bottom HUD: Progress Bar & Driver Quick Connect */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] mb-1 font-bold">
                  <span className="text-slate-300 flex items-center gap-1 truncate">
                    <span>{isKm ? currentShipment.senderCityKm : currentShipment.senderCity}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-emerald-400">{isKm ? currentShipment.receiverCityKm : currentShipment.receiverCity}</span>
                  </span>
                  <span className="text-rose-400 font-mono shrink-0 ml-2">
                    {completionPercentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Quick Driver Profile or Chat */}
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenDriverProfile && (
                  <button
                    type="button"
                    onClick={onOpenDriverProfile}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition border border-slate-700 flex items-center gap-1 cursor-pointer"
                    title={currentShipment.isCourierVerified ? (isKm ? 'អ្នកដឹកបានផ្ទៀងផ្ទាត់អត្តសញ្ញាណ' : 'Verified Courier') : undefined}
                  >
                    {currentShipment.isCourierVerified && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    <span>{isKm ? 'អ្នកដឹក' : 'Driver'}</span>
                    {currentShipment.isCourierVerified && (
                      <span className="text-[10px] text-emerald-400 font-black">✓</span>
                    )}
                  </button>
                )}
                {onOpenChat && (
                  <button
                    type="button"
                    onClick={onOpenChat}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-xs"
                  >
                    {isKm ? 'ឆាតផ្ទាល់' : 'Chat'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
