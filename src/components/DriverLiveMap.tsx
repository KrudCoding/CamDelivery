import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Truck,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  Battery,
  Zap
} from 'lucide-react';
import { TrackingItem, Language } from '../types';
import { isPowerSaverMode, setPowerSaverMode, POWER_SAVER_EVENT } from '../utils/powerSaverService';

interface DriverLiveMapProps {
  shipment: TrackingItem;
  language: Language;
  onOpenDriverProfile?: () => void;
}

// Coordinate waypoint definition
interface Waypoint {
  lat: number;
  lng: number;
  label: string;
  labelKm: string;
}

// Preset realistic Cambodian national highway route coordinates
const CAMBODIA_HIGHWAY_ROUTES: Record<string, Waypoint[]> = {
  // NR6: Phnom Penh -> Kampong Cham (Skun) -> Kampong Thom -> Siem Reap
  'Phnom Penh to Siem Reap': [
    { lat: 11.5564, lng: 104.9282, label: 'Phnom Penh Central Hub', labelKm: 'ភ្នំពេញ (ឃ្លាំងកណ្តាល)' },
    { lat: 11.6052, lng: 104.9351, label: 'Chroy Changvar Bridge', labelKm: 'ស្ពានជ្រោយចង្វារ' },
    { lat: 11.8540, lng: 104.9820, label: 'National Road 6, Batheay', labelKm: 'ផ្លូវជាតិលេខ ៦ បាធាយ' },
    { lat: 12.0234, lng: 105.0210, label: 'Skun Junction', labelKm: 'រង្វង់មូលស្គន់ កំពង់ចាម' },
    { lat: 12.3591, lng: 104.8821, label: 'Kampong Thmar, NR6', labelKm: 'កំពង់ថ្ម ផ្លូវជាតិលេខ ៦' },
    { lat: 12.7111, lng: 104.8887, label: 'Steung Saen, Kampong Thom', labelKm: 'ក្រុងស្ទឹងសែន កំពង់ធំ' },
    { lat: 12.9820, lng: 104.5420, label: 'Stoung District', labelKm: 'ស្រុកស្ទោង' },
    { lat: 13.1520, lng: 104.2510, label: 'Chi Kraeng', labelKm: 'ស្រុកជីក្រែង' },
    { lat: 13.2840, lng: 104.0320, label: 'Damdek Market Junction', labelKm: 'ផ្សារដំដែក' },
    { lat: 13.3671, lng: 103.8448, label: 'Siem Reap City Depot', labelKm: 'ក្រុងសៀមរាប (សាខាផ្សារចាស់)' },
  ],

  // NR5: Phnom Penh -> Kampong Chhnang -> Pursat -> Battambang
  'Phnom Penh to Battambang': [
    { lat: 11.5621, lng: 104.9160, label: 'Toul Kork Hub, Phnom Penh', labelKm: 'ទួលគោក រាជធានីភ្នំពេញ' },
    { lat: 11.7820, lng: 104.7520, label: 'Oudong, NR5', labelKm: 'ឧដុង្គ ផ្លូវជាតិលេខ ៥' },
    { lat: 12.2500, lng: 104.6667, label: 'Kampong Chhnang Town', labelKm: 'ក្រុងកំពង់ឆ្នាំង' },
    { lat: 12.5388, lng: 103.9192, label: 'Pursat Town', labelKm: 'ក្រុងពោធិ៍សាត់' },
    { lat: 12.8210, lng: 103.5820, label: 'Moung Ruessei', labelKm: 'ស្រុកមោងឫស្សី' },
    { lat: 13.0957, lng: 103.2022, label: 'Battambang City Center', labelKm: 'ក្រុងបាត់ដំបង' },
    { lat: 13.1022, lng: 103.1989, label: 'Romchek 4 Customer Drop-off', labelKm: 'ភូមិរំចេក៤ ផ្ទះអ្នកទទួល' },
  ],

  // NR3 / NR41: Phnom Penh -> Kampot
  'Phnom Penh to Kampot': [
    { lat: 11.5450, lng: 104.8820, label: 'Chaom Chau Junction', labelKm: 'រង្វង់មូលចោមចៅ' },
    { lat: 11.2350, lng: 104.7810, label: 'Kong Pisei, NR3', labelKm: 'គងពិសី ផ្លូវជាតិលេខ ៣' },
    { lat: 10.9820, lng: 104.6520, label: 'Tram Kak, Takeo', labelKm: 'ត្រាំកក់ ខេត្តតាកែវ' },
    { lat: 10.7520, lng: 104.4520, label: 'Chhouk District, Kampot', labelKm: 'ស្រុកឈូក ខេត្តកំពត' },
    { lat: 10.6104, lng: 104.1815, label: 'Kampot Town (Durian Roundabout)', labelKm: 'រង្វង់មូលទុរេន ក្រុងកំពត' },
  ],
};

// Historical Traffic Optimized Bypass Routes (Bypasses heavy town center congestions & market bottlenecks)
const CAMBODIA_OPTIMIZED_TRAFFIC_ROUTES: Record<string, Waypoint[]> = {
  'Phnom Penh to Siem Reap': [
    { lat: 11.5564, lng: 104.9282, label: 'Phnom Penh Hub', labelKm: 'ភ្នំពេញ (ឃ្លាំងកណ្តាល)' },
    { lat: 11.6600, lng: 104.8900, label: 'Win-Win Blvd Outer Bypass', labelKm: 'មហាវិថីឈ្នះ-ឈ្នះ (វាងក្រុង)' },
    { lat: 11.9200, lng: 104.9200, label: 'Prek Kdam Direct Expressway Link', labelKm: 'ស្ពានព្រែកក្តាម កាត់ត្រង់' },
    { lat: 12.2100, lng: 104.8200, label: 'Kampong Leng Express Corridor', labelKm: 'ច្រករបៀងល្បឿនលឿន កំពង់លែង' },
    { lat: 12.7200, lng: 104.8600, label: 'Steung Saen North Bypass', labelKm: 'ផ្លូវវាងខាងជើង ស្ទឹងសែន' },
    { lat: 13.0100, lng: 104.4800, label: 'Stoung Outer Highway', labelKm: 'ផ្លូវវាងស្ទោង (គ្មានស្ទះ)' },
    { lat: 13.2500, lng: 103.9800, label: 'Siem Reap East Ring Expressway', labelKm: 'ផ្លូវក្រវាត់ក្រុងសៀមរាប ខាងកើត' },
    { lat: 13.3671, lng: 103.8448, label: 'Siem Reap City Depot', labelKm: 'ក្រុងសៀមរាប (សាខាផ្សារចាស់)' },
  ],
  'Phnom Penh to Battambang': [
    { lat: 11.5621, lng: 104.9160, label: 'Toul Kork Hub', labelKm: 'ទួលគោក' },
    { lat: 11.6800, lng: 104.7800, label: 'Kob Srov Bypass Highway', labelKm: 'ទំនប់កប់ស្រូវ (ជៀសវាងស្ទះ)' },
    { lat: 12.2200, lng: 104.6000, label: 'Kampong Chhnang Outer Ring', labelKm: 'ផ្លូវក្រវាត់ក្រុងកំពង់ឆ្នាំង' },
    { lat: 12.5100, lng: 103.8800, label: 'Pursat Express Bypass', labelKm: 'ផ្លូវវាងទីរួមខេត្តពោធិ៍សាត់' },
    { lat: 12.8000, lng: 103.5400, label: 'Moung Ruessei Highway Cut', labelKm: 'ច្រកកាត់មោងឫស្សី' },
    { lat: 13.1022, lng: 103.1989, label: 'Romchek 4 Customer Drop-off', labelKm: 'ភូមិរំចេក៤ ផ្ទះអ្នកទទួល' },
  ],
  'Phnom Penh to Kampot': [
    { lat: 11.5450, lng: 104.8820, label: 'Chaom Chau Link', labelKm: 'រង្វង់មូលចោមចៅ' },
    { lat: 11.1800, lng: 104.6200, label: 'NR41 Expressway Link', labelKm: 'ផ្លូវជាតិ ៤១ (ល្បឿនលឿន)' },
    { lat: 10.8200, lng: 104.4200, label: 'Chhouk South Cutoff', labelKm: 'ផ្លូវកាត់ឈូក ខាងត្បូង' },
    { lat: 10.6104, lng: 104.1815, label: 'Kampot Town Depot', labelKm: 'ក្រុងកំពង់ផែ ក្រុងកំពត' },
  ],
};

export interface RouteOptimizationData {
  standardDistanceKm: number;
  standardDurationMinutes: number;
  optimizedDistanceKm: number;
  optimizedDurationMinutes: number;
  timeSavingsMinutes: number;
  timeSavingsPct: number;
  bottlenecksAvoided: number;
  co2SavedKg: number;
  chokePoints: { nameEn: string; nameKm: string; delayMin: number }[];
}

interface DriverLiveMapProps {
  shipment: TrackingItem;
  language: Language;
  onOpenDriverProfile?: () => void;
  externalShowOptimized?: boolean;
  onOptimizedChange?: (isOptimized: boolean) => void;
  externalShowPastRoute?: boolean;
  onPastRouteChange?: (showPastRoute: boolean) => void;
  onProgressUpdate?: (progressPct: number, currentSpeedKmH: number) => void;
}

export const DriverLiveMap: React.FC<DriverLiveMapProps> = ({
  shipment,
  language,
  onOpenDriverProfile,
  externalShowOptimized,
  onOptimizedChange,
  externalShowPastRoute,
  onPastRouteChange,
  onProgressUpdate,
}) => {
  const isKm = language === 'km';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const traveledPolylineRef = useRef<L.Polyline | null>(null);
  const realTimeRemainingPolylineRef = useRef<L.Polyline | null>(null);
  const optimizedPolylineRef = useRef<L.Polyline | null>(null);
  const optimizedMarkersRef = useRef<L.Marker[]>([]);

  const [mapTileStyle, setMapTileStyle] = useState<'osm' | 'voyager' | 'dark'>('voyager');
  const [progressPct, setProgressPct] = useState<number>(68);
  const [isLiveMoving, setIsLiveMoving] = useState<boolean>(true);
  const [currentSpeedKmH, setCurrentSpeedKmH] = useState<number>(68);
  const [isOptimizedRouteActive, setIsOptimizedRouteActive] = useState<boolean>(externalShowOptimized || false);
  const [showPastRoute, setShowPastRoute] = useState<boolean>(externalShowPastRoute !== undefined ? externalShowPastRoute : true);
  const [isCalculatingOptimization, setIsCalculatingOptimization] = useState<boolean>(false);
  const [showComparisonPanel, setShowComparisonPanel] = useState<boolean>(false);
  const [isPowerSaver, setIsPowerSaver] = useState<boolean>(isPowerSaverMode);

  useEffect(() => {
    const handlePowerSaver = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail && typeof custom.detail.enabled === 'boolean') {
        setIsPowerSaver(custom.detail.enabled);
      } else {
        setIsPowerSaver(isPowerSaverMode());
      }
    };
    window.addEventListener(POWER_SAVER_EVENT, handlePowerSaver);
    return () => window.removeEventListener(POWER_SAVER_EVENT, handlePowerSaver);
  }, []);

  const driverName = shipment.driverName || (isKm ? 'អ្នកដឹកជញ្ជូនសហគមន៍' : 'Community Courier');
  const driverPlate = shipment.driverPlate || 'PP-3B-8912';
  const driverRating = shipment.driverRating || 4.9;

  // Sync external prop if provided
  useEffect(() => {
    if (externalShowOptimized !== undefined && externalShowOptimized !== isOptimizedRouteActive) {
      setIsOptimizedRouteActive(externalShowOptimized);
      if (externalShowOptimized) setShowComparisonPanel(true);
    }
  }, [externalShowOptimized]);

  // Sync external past route prop if provided
  useEffect(() => {
    if (externalShowPastRoute !== undefined && externalShowPastRoute !== showPastRoute) {
      setShowPastRoute(externalShowPastRoute);
    }
  }, [externalShowPastRoute]);

  // Resolve waypoints based on route endpoints
  const routeWaypoints = useMemo(() => {
    const routeKey = `${shipment.senderCity.split(' ')[0]} to ${shipment.receiverCity.split(' ')[0]}`;
    if (CAMBODIA_HIGHWAY_ROUTES[routeKey]) {
      return CAMBODIA_HIGHWAY_ROUTES[routeKey];
    }
    // Fallback: use coordinates from shipment
    const start = shipment.routeCoordinates.start;
    const current = shipment.routeCoordinates.current;
    const end = shipment.routeCoordinates.end;

    return [
      { lat: start.lat, lng: start.lng, label: start.label, labelKm: shipment.senderCityKm || start.label },
      { lat: current.lat, lng: current.lng, label: current.label, labelKm: 'កំពុងឆ្លងកាត់' },
      { lat: end.lat, lng: end.lng, label: end.label, labelKm: shipment.receiverCityKm || end.label },
    ];
  }, [shipment]);

  // Resolve optimized bypass waypoints
  const optimizedWaypoints = useMemo(() => {
    const routeKey = `${shipment.senderCity.split(' ')[0]} to ${shipment.receiverCity.split(' ')[0]}`;
    if (CAMBODIA_OPTIMIZED_TRAFFIC_ROUTES[routeKey]) {
      return CAMBODIA_OPTIMIZED_TRAFFIC_ROUTES[routeKey];
    }
    // Generate intelligent bypass waypoints slightly adjusted around current highway
    return routeWaypoints.map((w, idx) => {
      if (idx === 0 || idx === routeWaypoints.length - 1) return w;
      return {
        lat: w.lat + 0.045,
        lng: w.lng - 0.035,
        label: `${w.label} Express Bypass`,
        labelKm: `ផ្លូវវាងកាត់បន្ថយស្ទះ ${w.labelKm}`,
      };
    });
  }, [shipment, routeWaypoints]);

  // Traffic optimization statistics calculation
  const optimizationStats: RouteOptimizationData = useMemo(() => {
    return {
      standardDistanceKm: 314,
      standardDurationMinutes: 290, // ~4h 50m
      optimizedDistanceKm: 298,
      optimizedDurationMinutes: 235, // ~3h 55m
      timeSavingsMinutes: 55,
      timeSavingsPct: 19,
      bottlenecksAvoided: 2,
      co2SavedKg: 4.8,
      chokePoints: [
        { nameEn: 'Skun Market Roundabout Congestion', nameKm: 'ការកកស្ទះផ្សាររង្វង់មូលស្គន់', delayMin: 32 },
        { nameEn: 'Stoung Bridge Reconstruction Detour', nameKm: 'ការដ្ឋានស្ពានស្ទោងផ្លូវចាស់', delayMin: 23 },
      ],
    };
  }, []);

  // Calculate interpolated position along the highway polyline based on progress percentage
  const currentDriverPosition = useMemo<{ lat: number; lng: number; currentWaypoint?: Waypoint }>(() => {
    if (routeWaypoints.length === 0) return { lat: 11.5564, lng: 104.9282, currentWaypoint: undefined };
    if (routeWaypoints.length === 1) return { lat: routeWaypoints[0].lat, lng: routeWaypoints[0].lng, currentWaypoint: routeWaypoints[0] };

    // Total distance approximation
    const totalSegments = routeWaypoints.length - 1;
    const t = Math.max(0, Math.min(100, progressPct)) / 100;
    const segmentIndex = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
    const segmentFraction = (t * totalSegments) - segmentIndex;

    const p1 = routeWaypoints[segmentIndex];
    const p2 = routeWaypoints[segmentIndex + 1];

    const lat = p1.lat + (p2.lat - p1.lat) * segmentFraction;
    const lng = p1.lng + (p2.lng - p1.lng) * segmentFraction;

    return { lat, lng, currentWaypoint: p1 };
  }, [routeWaypoints, progressPct]);

  // Simulation effect: driver moves gently forward along highway
  // When Power Saver is enabled, refresh interval is 6000ms instead of 1500ms to preserve device battery
  useEffect(() => {
    if (!isLiveMoving) return;

    const intervalMs = isPowerSaver ? 6000 : 1500;
    const progressStep = isPowerSaver ? 1.4 : 0.35;

    const interval = setInterval(() => {
      setProgressPct((prev) => {
        if (prev >= 98) {
          return 30; // reset loop for simulation demonstration
        }
        return Number((prev + progressStep).toFixed(2));
      });

      // Realistic slight speed fluctuation (60 - 75 km/h)
      setCurrentSpeedKmH((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.round(Math.min(80, Math.max(55, prev + delta)));
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isLiveMoving, isPowerSaver]);

  // Notify parent component of live courier movement
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(progressPct, currentSpeedKmH);
    }
  }, [progressPct, currentSpeedKmH, onProgressUpdate]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy previous instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startPos = routeWaypoints[0] || { lat: 11.5564, lng: 104.9282 };
    const centerLat = (routeWaypoints[0]?.lat + routeWaypoints[routeWaypoints.length - 1]?.lat) / 2 || startPos.lat;
    const centerLng = (routeWaypoints[0]?.lng + routeWaypoints[routeWaypoints.length - 1]?.lng) / 2 || startPos.lng;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Tile URLs
    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (mapTileStyle === 'osm') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (mapTileStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Prepare path coordinates
    const latLngs = routeWaypoints.map((w) => [w.lat, w.lng] as [number, number]);

    // Draw remaining route (dashed line)
    const remainingPolyline = L.polyline(latLngs, {
      color: '#94a3b8',
      weight: 4,
      dashArray: '6, 8',
      opacity: 0.8,
    }).addTo(map);
    routePolylineRef.current = remainingPolyline;

    // Draw traveled route polyline (solid royal violet for past route historical path)
    const traveledPolyline = L.polyline([], {
      color: '#8b5cf6', // Royal Violet / Purple
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(map);
    traveledPolyline.bindPopup(`
      <div style="font-family:system-ui, sans-serif; padding:4px;">
        <strong style="color:#7c3aed;">🟣 ${isKm ? 'គន្លងផ្លូវបានឆ្លងកាត់រួច (Past Route Traveled)' : 'Past Traveled Route'}</strong><br/>
        <span style="font-size:11px; color:#475569;">${isKm ? 'ផ្លូវជាតិដែលអ្នកដឹកជញ្ជូនបានឆ្លងកាត់រួចរាល់' : 'Historical highway segment completed by courier'}</span>
      </div>
    `);
    traveledPolylineRef.current = traveledPolyline;

    // Draw real-time active path between current location and destination (vibrant glowing rose dashed vector)
    const realTimeRemainingPolyline = L.polyline([], {
      color: '#f43f5e', // Vibrant Rose-500
      weight: 5,
      opacity: 0.95,
      dashArray: '8, 8',
      lineCap: 'round',
    }).addTo(map);
    realTimeRemainingPolyline.bindPopup(`
      <div style="font-family:system-ui, sans-serif; padding:4px;">
        <strong style="color:#e11d48;">🔴 ${isKm ? 'គន្លងផ្លូវនៅសល់ឆ្ពោះទៅគោលដៅ (Remaining Route)' : 'Remaining Route Ahead'}</strong><br/>
        <span style="font-size:11px; color:#475569;">${isKm ? 'ផ្លូវដែលអ្នកដឹកត្រូវបន្តធ្វើដំណើរ' : 'Upcoming highway segment toward destination'}</span>
      </div>
    `);
    realTimeRemainingPolylineRef.current = realTimeRemainingPolyline;

    // Create Start (Origin) Custom Marker
    const originIcon = L.divIcon({
      className: 'custom-origin-icon',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
          <div style="background:#0284c7; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.3); border:1px solid #bae6fd; white-space:nowrap; margin-bottom:4px;">
            ${shipment.senderCity.split(' ')[0]}
          </div>
          <div style="width:26px; height:26px; border-radius:50%; background:#0284c7; border:3px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px;">
            📦
          </div>
        </div>
      `,
      iconSize: [0, 0],
    });

    const startPoint = routeWaypoints[0];
    if (startPoint) {
      L.marker([startPoint.lat, startPoint.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <strong style="color:#0369a1;">${isKm ? 'ចំណុចចាប់ផ្ដើមផ្ញើ (Origin)' : 'Origin Hub'}</strong><br/>
            <span style="font-size:11px; color:#475569;">${startPoint.label}</span>
          </div>
        `);
    }

    // Create End (Destination) Custom Marker
    const endPoint = routeWaypoints[routeWaypoints.length - 1];
    if (endPoint) {
      const destIcon = L.divIcon({
        className: 'custom-dest-icon',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
            <div style="background:#15803d; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.3); border:1px solid #bbf7d0; white-space:nowrap; margin-bottom:4px;">
              ${shipment.receiverCity.split(' ')[0]}
            </div>
            <div style="width:26px; height:26px; border-radius:50%; background:#16a34a; border:3px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px;">
              🏠
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker([endPoint.lat, endPoint.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <strong style="color:#15803d;">${isKm ? 'គោលដៅអ្នកទទួល (Destination)' : 'Destination Point'}</strong><br/>
            <span style="font-size:11px; color:#475569;">${endPoint.label}</span>
          </div>
        `);
    }

    // Create Real-Time Driver Marker
    const driverIcon = L.divIcon({
      className: 'custom-driver-pulse-icon',
      html: `
        <div style="position:relative; width:48px; height:48px; display:flex; align-items:center; justify-content:center; transform: translate(-50%, -50%);">
          <!-- Pulsing animated radar rings -->
          <div style="position:absolute; width:44px; height:44px; border-radius:50%; background:rgba(225, 29, 72, 0.35); animation: leaflet-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:rgba(225, 29, 72, 0.5);"></div>
          <!-- Vehicle Core Badge -->
          <div style="position:relative; z-index:10; width:30px; height:30px; border-radius:50%; background:#e11d48; border:2.5px solid #ffffff; box-shadow:0 4px 10px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:13px;">
            🚚
          </div>
          <!-- License Plate Micro Tag -->
          <div style="position:absolute; bottom:-16px; left:50%; transform:translateX(-50%); background:#0f172a; color:#f59e0b; border:1px solid #334155; font-family:monospace; font-size:8.5px; font-weight:bold; padding:1px 5px; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.3); white-space:nowrap; z-index:20;">
            ${driverPlate}
          </div>
        </div>
      `,
      iconSize: [0, 0],
    });

    const driverMarker = L.marker([currentDriverPosition.lat, currentDriverPosition.lng], {
      icon: driverIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    driverMarkerRef.current = driverMarker;

    // Bind rich popup to driver marker
    driverMarker.bindPopup(`
      <div style="font-family:system-ui, sans-serif; min-width:180px; padding:4px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
          <strong style="color:#0f172a; font-size:13px;">${driverName}</strong>
          <span style="color:#d97706; font-size:11px; font-weight:bold;">★ ${driverRating.toFixed(1)}</span>
        </div>
        <div style="background:#0f172a; color:#f59e0b; font-family:monospace; font-weight:bold; font-size:11px; padding:2px 6px; border-radius:4px; display:inline-block; margin-bottom:6px;">
          ${driverPlate}
        </div>
        <div style="font-size:11px; color:#64748b; line-height:1.4;">
          ${isKm ? 'ល្បឿនបច្ចុប្បន្ន' : 'Current Speed'}: <strong style="color:#e11d48;">${currentSpeedKmH} km/h</strong><br/>
          ${isKm ? 'ស្ថានភាព' : 'Status'}: <strong style="color:#059669;">${isKm ? 'កំពុងដឹកជញ្ជូនលើផ្លូវជាតិ' : 'On National Transit'}</strong>
        </div>
      </div>
    `);

    // Fit bounds gracefully to route with padding
    if (latLngs.length > 0) {
      map.fitBounds(latLngs, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [routeWaypoints, mapTileStyle]);

  // Manage Historical Traffic Optimized Route Polyline & Bypass Markers on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clean up previous optimized layer if present
    if (optimizedPolylineRef.current) {
      map.removeLayer(optimizedPolylineRef.current);
      optimizedPolylineRef.current = null;
    }
    optimizedMarkersRef.current.forEach((m) => map.removeLayer(m));
    optimizedMarkersRef.current = [];

    if (!isOptimizedRouteActive) return;

    // Build optimized path coordinates
    const optLatLngs = optimizedWaypoints.map((w) => [w.lat, w.lng] as [number, number]);

    // Create glowing electric cyan polyline for optimized bypass route
    const optPolyline = L.polyline(optLatLngs, {
      color: '#06b6d4', // Cyan-500
      weight: 5,
      dashArray: '8, 6',
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(map);

    optPolyline.bindPopup(`
      <div style="font-family:system-ui, sans-serif; padding:4px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
          <strong style="color:#0891b2; font-size:12px;">⚡ ${isKm ? 'គន្លងផ្លូវកាត់បន្ថយស្ទះ (Traffic Optimized)' : 'Historical Traffic Optimized Route'}</strong>
        </div>
        <div style="font-size:11px; color:#334155; line-height:1.4;">
          ${isKm ? 'សន្សំសំចៃពេល' : 'Time Savings'}: <strong style="color:#059669;">~${optimizationStats.timeSavingsMinutes} ${isKm ? 'នាទី' : 'mins'} (${optimizationStats.timeSavingsPct}%)</strong><br/>
          ${isKm ? 'ចម្ងាយ' : 'Distance'}: <strong>${optimizationStats.optimizedDistanceKm} km</strong> (vs ${optimizationStats.standardDistanceKm} km)<br/>
          ${isKm ? 'ចៀសវាងចំណុចកកស្ទះចំនួន' : 'Avoids'}: <strong>${optimizationStats.bottlenecksAvoided} ${isKm ? 'តំបន់ស្ទះខ្លាំង' : 'bottlenecks'}</strong>
        </div>
      </div>
    `);

    optimizedPolylineRef.current = optPolyline;

    // Add bypass waypoint markers
    optimizedWaypoints.forEach((wp, idx) => {
      // Skip start and destination as they already have main icons
      if (idx === 0 || idx === optimizedWaypoints.length - 1) return;

      const bypassIcon = L.divIcon({
        className: 'custom-bypass-icon',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
            <div style="background:#0891b2; color:#fff; font-size:9px; font-weight:800; padding:1.5px 6px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.3); border:1px solid #67e8f9; white-space:nowrap; margin-bottom:2px;">
              ⚡ ${isKm ? wp.labelKm : wp.label}
            </div>
            <div style="width:20px; height:20px; border-radius:50%; background:#06b6d4; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px;">
              ⚡
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: bypassIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <strong style="color:#0891b2; font-size:12px;">⚡ ${isKm ? 'ចំណុចវាងស្ទះ (Traffic Bypass Point)' : 'Smart Bypass Point'}</strong><br/>
            <span style="font-size:11px; color:#475569;">${isKm ? wp.labelKm : wp.label}</span>
          </div>
        `);

      optimizedMarkersRef.current.push(marker);
    });

    // Fit map bounds to show both routes gracefully
    const combinedLatLngs = [...routeWaypoints, ...optimizedWaypoints].map((w) => [w.lat, w.lng] as [number, number]);
    map.fitBounds(combinedLatLngs, { padding: [45, 45], duration: 1 });
  }, [isOptimizedRouteActive, optimizedWaypoints, routeWaypoints, isKm, optimizationStats]);

  // Update driver position and traveled path when currentDriverPosition changes
  useEffect(() => {
    if (!driverMarkerRef.current || !traveledPolylineRef.current) return;

    // Smoothly update marker position
    driverMarkerRef.current.setLatLng([currentDriverPosition.lat, currentDriverPosition.lng]);

    // Update traveled path polyline (from start up to current interpolated position)
    const totalSegments = routeWaypoints.length - 1;
    const t = Math.max(0, Math.min(100, progressPct)) / 100;
    const segmentIndex = Math.min(Math.floor(t * totalSegments), totalSegments - 1);

    const traveledPoints: [number, number][] = [];
    if (showPastRoute) {
      for (let i = 0; i <= segmentIndex; i++) {
        traveledPoints.push([routeWaypoints[i].lat, routeWaypoints[i].lng]);
      }
      traveledPoints.push([currentDriverPosition.lat, currentDriverPosition.lng]);
    }

    traveledPolylineRef.current.setLatLngs(traveledPoints);

    // Update real-time remaining path polyline (from current position to destination)
    if (realTimeRemainingPolylineRef.current) {
      const remainingPoints: [number, number][] = [];
      remainingPoints.push([currentDriverPosition.lat, currentDriverPosition.lng]);
      for (let i = segmentIndex + 1; i < routeWaypoints.length; i++) {
        remainingPoints.push([routeWaypoints[i].lat, routeWaypoints[i].lng]);
      }
      realTimeRemainingPolylineRef.current.setLatLngs(remainingPoints);
    }
  }, [currentDriverPosition, progressPct, routeWaypoints, showPastRoute]);

  // Actions
  const handleFocusDriver = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([currentDriverPosition.lat, currentDriverPosition.lng], 12, {
      duration: 1.2,
    });
    if (driverMarkerRef.current) {
      driverMarkerRef.current.openPopup();
    }
  };

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    const latLngs = routeWaypoints.map((w) => [w.lat, w.lng] as [number, number]);
    mapInstanceRef.current.flyToBounds(latLngs, { padding: [40, 40], duration: 1.2 });
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 md:p-5 shadow-lg border border-slate-800 overflow-hidden relative flex flex-col space-y-3">
      {/* Top Header Row with Route Status, Optimization Trigger, and Speed */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-rose-500 animate-pulse" />
          <h3 className="text-xs font-bold tracking-wide uppercase text-slate-200 flex items-center gap-1.5">
            <span>{isKm ? 'ផែនទីធ្វើដំណើរផ្ទាល់ Leaflet (Live GPS)' : 'Live Leaflet Route Map'}</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              GPS Active
            </span>
          </h3>
        </div>

        {/* Action Controls: Optimize Route, Speed & Moving status badge, Tile Layer */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Historical Traffic Route Optimization Button */}
          <button
            type="button"
            onClick={() => {
              if (!isOptimizedRouteActive) {
                setIsCalculatingOptimization(true);
                setTimeout(() => {
                  setIsCalculatingOptimization(false);
                  setIsOptimizedRouteActive(true);
                  setShowComparisonPanel(true);
                  if (onOptimizedChange) onOptimizedChange(true);
                }, 600);
              } else {
                setIsOptimizedRouteActive(false);
                setShowComparisonPanel(false);
                if (onOptimizedChange) onOptimizedChange(false);
              }
            }}
            disabled={isCalculatingOptimization}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition flex items-center gap-1.5 border shadow-xs cursor-pointer ${
              isOptimizedRouteActive
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-cyan-400/80 shadow-cyan-900/40 ring-1 ring-cyan-300'
                : 'bg-slate-800 hover:bg-slate-750 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
            }`}
            title={isKm ? 'ទាញយក និងបង្ហាញគន្លងផ្លូវវាងកាត់បន្ថយការកកស្ទះផ្អែកលើទិន្នន័យចរាចរណ៍ប្រវត្តិសាស្ត្រ' : 'Fetch & overlay traffic-optimized route based on historical congestion data'}
          >
            {isCalculatingOptimization ? (
              <RefreshCw className="w-3 h-3 text-cyan-300 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            )}
            <span>
              {isCalculatingOptimization
                ? (isKm ? 'កំពុងគណនាផ្លូវ...' : 'Optimizing Route...')
                : isOptimizedRouteActive
                ? (isKm ? '⚡ ផ្លូវវាងឆ្លាតវៃ (បើក)' : '⚡ Optimized Route (Active)')
                : (isKm ? '⚡ គណនាផ្លូវវាងស្ទះ (AI)' : '⚡ Optimize Route')}
            </span>
            {isOptimizedRouteActive && (
              <span className="bg-cyan-950/80 text-cyan-200 text-[9px] px-1 rounded-xs font-mono">
                -55m
              </span>
            )}
          </button>

          {/* Past Route Historical Overlay Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !showPastRoute;
              setShowPastRoute(nextVal);
              if (onPastRouteChange) onPastRouteChange(nextVal);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition flex items-center gap-1.5 border shadow-xs cursor-pointer ${
              showPastRoute
                ? 'bg-purple-900/60 text-purple-200 border-purple-400/80 shadow-purple-950/40 ring-1 ring-purple-400/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={isKm ? 'បើក/បិទ បង្ហាញគន្លងផ្លូវដែលអ្នកដឹកបានឆ្លងកាត់រួច' : 'Toggle overlay of courier past historical route'}
          >
            <span className={`w-2 h-2 rounded-full ${showPastRoute ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{isKm ? 'ផ្លូវបានកន្លង (Past Route)' : 'Past Route'}</span>
            <span className="text-[9px] font-mono px-1 rounded-xs bg-slate-900/80">
              {showPastRoute ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Speed & Moving status badge */}
          <button
            type="button"
            onClick={() => setIsLiveMoving(!isLiveMoving)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
              isLiveMoving
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isLiveMoving ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isLiveMoving ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isLiveMoving ? (isKm ? `ផ្លាស់ទី ${currentSpeedKmH} km/h` : `${currentSpeedKmH} km/h`) : (isKm ? 'ផ្អាក' : 'Paused')}</span>
          </button>

          {/* Power Saver Toggle Button */}
          <button
            type="button"
            onClick={() => setPowerSaverMode(!isPowerSaver)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border cursor-pointer ${
              isPowerSaver
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-xs'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={
              isPowerSaver
                ? (isKm ? 'ម៉ូដសន្សំថ្មសកម្ម (Power Saver Active) កាត់បន្ថយការ refresh ផែនទី' : 'Power Saver Active: 6s low-frequency polling, saves ~45% battery')
                : (isKm ? 'បើកម៉ូដសន្សំថ្ម (Power Saver) សម្រាប់ការដឹកផ្លូវឆ្ងាយ' : 'Enable Power Saver mode for long-distance deliveries')
            }
          >
            <Zap className={`w-3 h-3 ${isPowerSaver ? 'text-amber-300' : 'text-slate-400'}`} />
            <span>{isPowerSaver ? (isKm ? 'សន្សំថ្ម (ON)' : 'Power Saver (ON)') : (isKm ? 'សន្សំថ្ម' : 'Power Saver')}</span>
          </button>

          {/* Tile Layer Selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[10px]">
            <button
              type="button"
              onClick={() => setMapTileStyle('voyager')}
              className={`px-2 py-0.5 rounded-md font-semibold transition ${
                mapTileStyle === 'voyager' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setMapTileStyle('dark')}
              className={`px-2 py-0.5 rounded-md font-semibold transition ${
                mapTileStyle === 'dark' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setMapTileStyle('osm')}
              className={`px-2 py-0.5 rounded-md font-semibold transition ${
                mapTileStyle === 'osm' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              OSM
            </button>
          </div>
        </div>
      </div>

      {/* Main Leaflet Map Viewport */}
      <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
        {/* Leaflet DOM Node Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Custom Map Control Buttons */}
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 shadow-md">
          <button
            type="button"
            onClick={handleFocusDriver}
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition active:scale-95 shadow-sm group"
            title={isKm ? 'ផ្ដោតលើទីតាំងអ្នកដឹក' : 'Center on Driver'}
          >
            <Crosshair className="w-4 h-4 text-rose-400 group-hover:rotate-45 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleResetView}
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition active:scale-95 shadow-sm"
            title={isKm ? 'មើលផ្លូវទាំងមូល' : 'View Full Route'}
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
          </button>

          <div className="h-px bg-slate-700/60 my-0.5" />

          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition active:scale-95 shadow-sm"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-slate-300" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition active:scale-95 shadow-sm"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Top-Left GPS Real-Time Path Coordinates Overlay */}
        <div className="absolute top-3 left-3 z-30 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 text-[10px] text-slate-300 shadow-md max-w-[280px] sm:max-w-none space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-white flex-wrap">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-400 uppercase tracking-wider text-[9px] font-black">
              {isKm ? 'គន្លងផ្លូវផ្ទាល់' : 'Real-Time Path'}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400 font-mono">
              {currentDriverPosition.lat.toFixed(4)}°N, {currentDriverPosition.lng.toFixed(4)}°E
            </span>
            <span className="text-slate-400">➔</span>
            <span className="text-emerald-400 font-mono">
              {routeWaypoints[routeWaypoints.length - 1]
                ? `${routeWaypoints[routeWaypoints.length - 1].lat.toFixed(4)}°N, ${routeWaypoints[routeWaypoints.length - 1].lng.toFixed(4)}°E`
                : ''}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-2">
            <span className="text-slate-300">
              {isKm ? (currentDriverPosition.currentWaypoint?.labelKm || 'កំពុងធ្វើដំណើរ') : (currentDriverPosition.currentWaypoint?.label || 'In Transit')}
            </span>
            <span>•</span>
            <span className="text-rose-400 font-bold">
              {Math.max(0, Math.round(((100 - progressPct) / 100) * 314))} km {isKm ? 'ទៅដល់គោលដៅ' : 'remaining'}
            </span>
          </div>
        </div>

        {/* Historical Traffic Optimized Route Comparison Drawer Overlay */}
        {showComparisonPanel && isOptimizedRouteActive && (
          <div className="absolute top-14 left-3 right-3 z-30 bg-slate-950/95 backdrop-blur-md rounded-2xl p-3.5 border border-cyan-500/70 shadow-2xl text-white space-y-2.5 animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-black uppercase text-cyan-300 tracking-wider">
                  {isKm ? 'ការប្រៀបធៀបគន្លងផ្លូវ (Traffic AI Optimization)' : 'Historical Traffic Route Comparison'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowComparisonPanel(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md text-xs cursor-pointer"
                title="Minimize Comparison"
              >
                ✕
              </button>
            </div>

            {/* Side-by-side stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Standard Route */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {isKm ? 'ផ្លូវធម្មតា (Standard Highway)' : 'Current Standard Route'}
                </span>
                <div className="text-sm font-bold text-slate-300 mt-0.5">
                  ~4h 50m • {optimizationStats.standardDistanceKm} km
                </div>
                <div className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <span>⚠ ស្ទះ ២ កន្លែង (Skun / Stoung)</span>
                </div>
              </div>

              {/* Optimized Bypass Route */}
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-cyan-300 block">
                    {isKm ? 'ផ្លូវវាងឆ្លាតវៃ (Optimized)' : 'Traffic Bypass Route'}
                  </span>
                  <span className="text-[9px] bg-cyan-500 text-slate-950 font-black px-1.5 py-0.2 rounded-xs">
                    {optimizationStats.timeSavingsPct}% Faster
                  </span>
                </div>
                <div className="text-sm font-black text-cyan-200 mt-0.5">
                  ~3h 55m • {optimizationStats.optimizedDistanceKm} km
                </div>
                <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                  <span>⚡ {isKm ? `សន្សំសំចៃពេល ${optimizationStats.timeSavingsMinutes} នាទី` : `Save ${optimizationStats.timeSavingsMinutes} mins`}</span>
                </div>
              </div>
            </div>

            {/* Choke Points Avoided Info */}
            <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800 flex-wrap gap-2">
              <span className="text-slate-400">
                {isKm 
                  ? 'ជៀសវាងការស្ទះតាមរង្វង់មូល និងផ្សារទីប្រជុំជន ដោយប្រើផ្លូវក្រវាត់ក្រុង' 
                  : 'Reroutes courier via outer expressway bypass, avoiding downtown bottlenecks'}
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                CO₂ -{optimizationStats.co2SavedKg}kg
              </span>
            </div>
          </div>
        )}

        {/* Polyline Route Legend Overlay */}
        <div className="absolute bottom-16 left-3 z-30 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-[9.5px] text-slate-300 shadow-md flex items-center gap-2.5 flex-wrap">
          {showPastRoute && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-purple-500 shadow-xs" />
              <span className="font-semibold text-purple-300">
                {isKm ? 'ផ្លូវបានកន្លង (Past Route)' : 'Past Route'}: ~{Math.round((progressPct / 100) * 314)}km
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-rose-500" />
            <span className="font-semibold text-rose-300">
              {isKm ? 'ផ្លូវនៅសល់ (Remaining)' : 'Remaining'}: ~{Math.max(0, Math.round(((100 - progressPct) / 100) * 314))}km
            </span>
          </div>
          {isOptimizedRouteActive && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-cyan-400" />
              <span className="font-semibold text-cyan-300">
                ⚡ {isKm ? 'ផ្លូវវាងឆ្លាតវៃ' : 'Optimized Bypass'}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Driver Badge & Profile Link Overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              🚚
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-white truncate">{driverName}</span>
                <span className="bg-slate-950 text-amber-400 font-mono text-[10px] px-1.5 py-0.2 rounded-sm border border-slate-800">
                  {driverPlate}
                </span>
                {isOptimizedRouteActive && (
                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[9px] font-black px-1.5 py-0.2 rounded-xs">
                    ⚡ Express Path
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {isKm ? `វាយតម្លៃ ${driverRating.toFixed(1)} ★ • គោរពម៉ោង 99.4%` : `Rating ${driverRating.toFixed(1)} ★ • 99.4% On-Time`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isOptimizedRouteActive && !showComparisonPanel && (
              <button
                type="button"
                onClick={() => setShowComparisonPanel(true)}
                className="px-2 py-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900/80 text-[10px] font-bold transition border border-cyan-500/40 cursor-pointer"
                title="View Route Comparison"
              >
                ⚡ {isKm ? 'ប្រៀបធៀបផ្លូវ' : 'Compare'}
              </button>
            )}

            {onOpenDriverProfile && (
              <button
                type="button"
                onClick={onOpenDriverProfile}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition shrink-0 border border-white/15 shadow-2xs"
              >
                {isKm ? 'មើលប្រវត្តិរូប' : 'Profile'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Route Completion Progress & Distance Indicators */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isKm ? 'ចម្ងាយធ្វើដំណើររួចរាល់' : 'Route Completion'}</span>
          </span>
          <span className="font-black text-rose-400 font-mono text-sm">
            {progressPct.toFixed(0)}%
          </span>
        </div>

        {/* Progress Bar with Gradient */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1 text-sky-400 font-semibold">
            <MapPin className="w-3 h-3 text-sky-400" />
            <span>{isKm ? shipment.senderCityKm : shipment.senderCity}</span>
          </span>
          <span className="text-slate-500 font-mono">
            {isKm ? `ល្បឿនជាមធ្យម ${currentSpeedKmH} km/h` : `Avg ~${currentSpeedKmH} km/h`}
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>{isKm ? shipment.receiverCityKm : shipment.receiverCity}</span>
          </span>
        </div>
      </div>

      {/* Customer Hotline Support Box */}
      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">
            {isKm ? 'លេខបម្រើអតិថិជន ២៤/៧' : 'Customer Service Hotline'}
          </span>
          <span className="font-bold text-white">012 522 225 / 023 901 888</span>
        </div>
        <a
          href="tel:012522225"
          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition shadow-xs"
        >
          {isKm ? 'ខលសាកសួរ' : 'Call Dispatch'}
        </a>
      </div>
    </div>
  );
};
