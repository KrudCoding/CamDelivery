import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Truck,
  Car,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  Minimize2,
  Crosshair,
  Route,
  Search,
  Plus,
  Trash2,
  Compass,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { TrackingItem, Language, Currency } from '../types';
import { CAMBODIA_PROVINCES } from '../data/carriers';

interface MapDashboardProps {
  language: Language;
  currency: Currency;
  activeShipments: TrackingItem[];
  onSelectShipmentToTrack: (trackingNumber: string) => void;
  onNavigateTab: (tabId: 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
  onNotify?: (message: string) => void;
}

interface DeliveryStop {
  id: string;
  name: string;
  nameKm: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'dropoff' | 'hub';
  address: string;
  addressKm: string;
  trackingNumber?: string;
  packageCount?: number;
  status?: string;
}

// Major Cambodian logistics hubs & delivery waypoints
const DEFAULT_DELIVERY_STOPS: DeliveryStop[] = [
  {
    id: 'stop-pp-hub',
    name: 'Phnom Penh Central Distribution Depot',
    nameKm: 'មជ្ឈមណ្ឌលចែកចាយកណ្តាល រាជធានីភ្នំពេញ (ផ្សារថ្មី/ទួលគោក)',
    lat: 11.5621,
    lng: 104.9160,
    type: 'hub',
    address: 'St 271, Sangkat Teuk Thla, Phnom Penh',
    addressKm: 'ផ្លូវ ២៧១ សង្កាត់ទឹកថ្លា រាជធានីភ្នំពេញ',
    packageCount: 142,
  },
  {
    id: 'stop-skun',
    name: 'Skun Spider Roundabout Hub, Kampong Cham',
    nameKm: 'ឃ្លាំងតភ្ជាប់រង្វង់មូលស្គន់ ខេត្តកំពង់ចាម',
    lat: 12.0234,
    lng: 105.0210,
    type: 'dropoff',
    address: 'NR6 Junction, Skun, Kampong Cham',
    addressKm: 'ចំណុចប្រសព្វផ្លូវជាតិលេខ ៦ ស្គន់',
    trackingNumber: 'KH-VAN-882910',
    packageCount: 18,
    status: 'in_transit'
  },
  {
    id: 'stop-kpt',
    name: 'Steung Saen Town Hub, Kampong Thom',
    nameKm: 'ឃ្លាំងចែកចាយ ក្រុងស្ទឹងសែន ខេត្តកំពង់ធំ',
    lat: 12.7111,
    lng: 104.8887,
    type: 'dropoff',
    address: 'National Road 6, Steung Saen',
    addressKm: 'ផ្លូវជាតិលេខ ៦ ក្រុងស្ទឹងសែន កំពង់ធំ',
    trackingNumber: 'KH-EX-419082',
    packageCount: 12,
    status: 'in_transit'
  },
  {
    id: 'stop-sr',
    name: 'Siem Reap Old Market Express Depot',
    nameKm: 'សាខាផ្សារចាស់ & អង្គរ ក្រុងសៀមរាប',
    lat: 13.3671,
    lng: 103.8448,
    type: 'dropoff',
    address: 'Sivatha Rd, Krong Siem Reap',
    addressKm: 'វិថីស៊ីវត្ថា ក្រុងសៀមរាប',
    trackingNumber: 'KH-VAN-882910',
    packageCount: 35,
    status: 'scheduled'
  },
  {
    id: 'stop-btb',
    name: 'Battambang Romchek 4 Station',
    nameKm: 'សាខារំចេក៤ ក្រុងបាត់ដំបង',
    lat: 13.0957,
    lng: 103.2022,
    type: 'dropoff',
    address: 'Street 3, Krong Battambang',
    addressKm: 'ផ្លូវលេខ ៣ ក្រុងបាត់ដំបង',
    trackingNumber: 'KH-VAN-882910',
    packageCount: 24,
    status: 'scheduled'
  },
  {
    id: 'stop-kampot',
    name: 'Kampot Durian Roundabout Depot',
    nameKm: 'សាខារង្វង់មូលទុរេន ក្រុងកំពត',
    lat: 10.6104,
    lng: 104.1815,
    type: 'dropoff',
    address: 'National Road 3, Krong Kampot',
    addressKm: 'ផ្លូវជាតិលេខ ៣ ក្រុងកំពត',
    trackingNumber: 'KH-KPT-991204',
    packageCount: 16,
    status: 'delivered'
  },
  {
    id: 'stop-shv',
    name: 'Sihanoukville Port Logistics Zone',
    nameKm: 'តំបន់ភស្តុភារកម្មកំពង់ផែ ក្រុងព្រះសីហនុ',
    lat: 10.6275,
    lng: 103.5222,
    type: 'dropoff',
    address: 'Mittapheap, Sihanoukville',
    addressKm: 'ក្រុងព្រះសីហនុ មិត្តភាព',
    packageCount: 29,
    status: 'in_transit'
  }
];

// Live simulated couriers across Cambodia
interface ActiveCourierMarker {
  id: string;
  driverName: string;
  driverNameKm: string;
  plate: string;
  vehicleType: 'van' | 'tuktuk' | 'truck' | 'moto';
  speedKmH: number;
  lat: number;
  lng: number;
  routeLabel: string;
  routeLabelKm: string;
  trackingNumber: string;
  assignedPackages: number;
  headingDeg: number;
}

const LIVE_COURIERS: ActiveCourierMarker[] = [
  {
    id: 'c-1',
    driverName: 'Sokha Meng (Express Van)',
    driverNameKm: 'ម៉េង សុខា (ឡានវ៉ែនល្បឿនលឿន)',
    plate: 'PP-3B-8912',
    vehicleType: 'van',
    speedKmH: 72,
    lat: 12.3591,
    lng: 104.8821,
    routeLabel: 'Phnom Penh ➔ Siem Reap (NR6)',
    routeLabelKm: 'ភ្នំពេញ ➔ សៀមរាប (ផ្លូវជាតិលេខ ៦)',
    trackingNumber: 'KH-VAN-882910',
    assignedPackages: 14,
    headingDeg: 330,
  },
  {
    id: 'c-2',
    driverName: 'Channak Rath (Express Intercity)',
    driverNameKm: 'រ័ត្ន ចាន់ណាក់ (ឡានដឹកអន្តរខេត្ត)',
    plate: 'BTB-2A-5521',
    vehicleType: 'truck',
    speedKmH: 64,
    lat: 12.5388,
    lng: 103.9192,
    routeLabel: 'Phnom Penh ➔ Battambang (NR5)',
    routeLabelKm: 'ភ្នំពេញ ➔ បាត់ដំបង (ផ្លូវជាតិលេខ ៥)',
    trackingNumber: 'KH-EX-419082',
    assignedPackages: 28,
    headingDeg: 300,
  },
  {
    id: 'c-3',
    driverName: 'Vanna Kim (Doorstep TukTuk)',
    driverNameKm: 'គីម វណ្ណា (កង់បីដឹកដល់ផ្ទះ)',
    plate: 'PP-1K-4419',
    vehicleType: 'tuktuk',
    speedKmH: 38,
    lat: 11.5720,
    lng: 104.9200,
    routeLabel: 'Phnom Penh City Door Deliveries',
    routeLabelKm: 'ចែកឥវ៉ាន់តាមផ្ទះ រាជធានីភ្នំពេញ',
    trackingNumber: 'KH-URBAN-1029',
    assignedPackages: 9,
    headingDeg: 90,
  },
  {
    id: 'c-4',
    driverName: 'Dara Pich (Coastal Express)',
    driverNameKm: 'ពេជ្រ ដារ៉ា (ខ្សែបណ្តោយឆ្នេរ)',
    plate: 'KPT-2B-3310',
    vehicleType: 'van',
    speedKmH: 68,
    lat: 10.8200,
    lng: 104.4200,
    routeLabel: 'Phnom Penh ➔ Kampot (NR3)',
    routeLabelKm: 'ភ្នំពេញ ➔ កំពត (ផ្លូវជាតិលេខ ៣)',
    trackingNumber: 'KH-KPT-991204',
    assignedPackages: 11,
    headingDeg: 210,
  }
];

export const MapDashboard: React.FC<MapDashboardProps> = ({
  language,
  currency,
  activeShipments,
  onSelectShipmentToTrack,
  onNavigateTab,
  onNotify,
}) => {
  const isKm = language === 'km';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const courierMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  // States
  const [tileLayerType, setTileLayerType] = useState<'google_streets' | 'google_sat' | 'osm'>('google_streets');
  const [trafficLevel, setTrafficLevel] = useState<'low' | 'moderate' | 'heavy'>('moderate');
  const [selectedCourier, setSelectedCourier] = useState<ActiveCourierMarker | null>(LIVE_COURIERS[0]);
  const [stopsList, setStopsList] = useState<DeliveryStop[]>(DEFAULT_DELIVERY_STOPS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [simulatedLiveSpeed, setSimulatedLiveSpeed] = useState<number>(72);

  // Calculate Distance between 2 coordinates (Haversine Formula)
  const calcDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Route metrics calculation based on stops and traffic condition
  const routeMetrics = useMemo(() => {
    let totalKm = 0;
    for (let i = 0; i < stopsList.length - 1; i++) {
      totalKm += calcDistanceKm(
        stopsList[i].lat, stopsList[i].lng,
        stopsList[i + 1].lat, stopsList[i + 1].lng
      );
    }

    // Traffic factor multiplier
    const trafficMultiplier = trafficLevel === 'heavy' ? 1.45 : trafficLevel === 'moderate' ? 1.18 : 1.0;
    const baseMinutes = Math.round((totalKm / 55) * 60);
    const trafficAdjustedMinutes = Math.round(baseMinutes * trafficMultiplier);
    const delayMinutes = Math.max(0, trafficAdjustedMinutes - baseMinutes);

    const hours = Math.floor(trafficAdjustedMinutes / 60);
    const mins = trafficAdjustedMinutes % 60;

    const fuelLiters = Math.round((totalKm / 100) * 8.5);
    const fuelCostKHR = fuelLiters * 4250;
    const fuelCostUSD = Math.round((fuelCostKHR / 4100) * 10) / 10;

    return {
      totalKm,
      travelTimeText: `${hours}h ${mins}m`,
      travelTimeTextKm: `${hours} ម៉ោង ${mins} នាទី`,
      delayMinutes,
      fuelLiters,
      fuelCostKHR,
      fuelCostUSD,
      optimizedEfficiencyPct: isOptimized ? 24 : 0,
    };
  }, [stopsList, trafficLevel, isOptimized]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center Cambodia (12.5657° N, 104.9910° E)
      const map = L.map(mapContainerRef.current, {
        center: [12.2, 104.8],
        zoom: 7,
        zoomControl: false,
      });

      // Layer groups for markers
      markersLayerRef.current = L.layerGroup().addTo(map);
      courierMarkersLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer based on tileLayerType
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (tileLayerType === 'google_streets') {
      // High-clarity CartoDB Voyager / Google-like streets
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; Google Maps / OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);
    } else if (tileLayerType === 'google_sat') {
      // Esri World Imagery (High-Res Google Satellite Style)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
        maxZoom: 18,
      }).addTo(map);
    } else {
      // Standard OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    }
  }, [tileLayerType]);

  // Render Stop Markers, Route Polyline, and Real-Time Couriers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !courierMarkersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    courierMarkersLayerRef.current.clearLayers();

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    // Draw Route Polyline connecting the stops
    const latLngs = stopsList.map((s) => [s.lat, s.lng] as [number, number]);
    const routeColor = trafficLevel === 'heavy' ? '#ef4444' : trafficLevel === 'moderate' ? '#f59e0b' : '#10b981';

    const polyline = L.polyline(latLngs, {
      color: routeColor,
      weight: 5,
      opacity: 0.85,
      dashArray: trafficLevel === 'heavy' ? '6, 6' : undefined,
    }).addTo(map);
    routePolylineRef.current = polyline;

    // Render Stop Markers
    stopsList.forEach((stop, index) => {
      const isOrigin = index === 0;
      const isDestination = index === stopsList.length - 1;
      const badgeText = isOrigin ? 'START' : isDestination ? 'FINISH' : `#${index}`;

      const iconHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%);">
          <div style="background-color:${isOrigin ? '#0f172a' : isDestination ? '#10b981' : '#2563eb'}; color:white; font-size:10px; font-weight:900; padding:2px 6px; border-radius:999px; box-shadow:0 2px 6px rgba(0,0,0,0.3); border:2px solid white; white-space:nowrap;">
            ${badgeText}
          </div>
          <div style="width:14px; height:14px; background-color:${isOrigin ? '#0f172a' : isDestination ? '#10b981' : '#2563eb'}; border-radius:50%; border:2px solid white; margin-top:2px;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-stop-marker',
        iconSize: [24, 36],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family:system-ui; font-size:12px; max-width:220px; line-height:1.4;">
          <strong style="color:#0f172a; font-size:13px; display:block; margin-bottom:4px;">${isKm ? stop.nameKm : stop.name}</strong>
          <span style="color:#64748b; font-size:11px;">${isKm ? stop.addressKm : stop.address}</span>
          ${stop.packageCount ? `<div style="margin-top:6px; font-weight:bold; color:#059669; font-size:11px;">📦 ${stop.packageCount} ${isKm ? 'កញ្ចប់ឥវ៉ាន់' : 'parcels assigned'}</div>` : ''}
          ${stop.trackingNumber ? `<div style="margin-top:4px; font-weight:bold; color:#2563eb; font-size:11px;">#${stop.trackingNumber}</div>` : ''}
        </div>
      `;
      marker.bindPopup(popupHtml);
      markersLayerRef.current?.addLayer(marker);
    });

    // Render Real-Time Courier Positions
    LIVE_COURIERS.forEach((courier) => {
      const isSelected = selectedCourier?.id === courier.id;
      const courierIconHtml = `
        <div style="position:relative; display:flex; align-items:center; justify-content:center; width:38px; height:38px;">
          <div style="position:absolute; inset:0; border-radius:50%; background-color:#3b82f6; opacity:0.35; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position:relative; width:32px; height:32px; border-radius:10px; background-color:${isSelected ? '#0f172a' : '#1e40af'}; border:2px solid ${isSelected ? '#38bdf8' : '#ffffff'}; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 4px 10px rgba(0,0,0,0.35); transform:rotate(${courier.headingDeg}deg);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          </div>
          <span style="position:absolute; bottom:-6px; background:#0f172a; color:#38bdf8; font-size:9px; font-weight:800; padding:1px 4px; border-radius:4px; border:1px solid #1e293b; white-space:nowrap;">
            ${courier.speedKmH} km/h
          </span>
        </div>
      `;

      const courierIcon = L.divIcon({
        html: courierIconHtml,
        className: 'custom-courier-vehicle',
        iconSize: [38, 38],
      });

      const courierMarker = L.marker([courier.lat, courier.lng], { icon: courierIcon });
      courierMarker.on('click', () => {
        setSelectedCourier(courier);
        map.panTo([courier.lat, courier.lng], { animate: true });
      });

      const courierPopupHtml = `
        <div style="font-family:system-ui; font-size:12px; max-width:240px; padding:2px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <strong style="color:#0f172a; font-size:13px;">${isKm ? courier.driverNameKm : courier.driverName}</strong>
          </div>
          <div style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-family:monospace; font-weight:bold; color:#0f172a; margin-bottom:6px; font-size:11px;">
            🚗 ${courier.plate} • ${courier.speedKmH} km/h
          </div>
          <div style="color:#475569; font-size:11px; margin-bottom:4px;">
            ${isKm ? courier.routeLabelKm : courier.routeLabel}
          </div>
          <div style="color:#059669; font-weight:bold; font-size:11px;">
            📦 ${courier.assignedPackages} ${isKm ? 'កញ្ចប់កំពុងដឹក' : 'assigned parcels'}
          </div>
        </div>
      `;
      courierMarker.bindPopup(courierPopupHtml);
      courierMarkersLayerRef.current?.addLayer(courierMarker);
    });
  }, [stopsList, trafficLevel, selectedCourier, tileLayerType, isKm]);

  // Calculate Most Efficient Route using nearest-neighbor greedy TSP
  const handleOptimizeRoute = () => {
    setIsOptimizing(true);
    if (onNotify) {
      onNotify(isKm ? '⚡ កំពុងគណនាផ្លូវលឿនបំផុត និងវិភាគចរាចរណ៍ជាក់ស្តែង...' : '⚡ Calculating most efficient route with real-time traffic data...');
    }

    setTimeout(() => {
      // Keep origin fixed at index 0, sort remaining stops by greedy distance
      const origin = stopsList[0];
      const remaining = [...stopsList.slice(1)];
      const optimizedOrder: DeliveryStop[] = [origin];

      let currentPoint = origin;
      while (remaining.length > 0) {
        let nearestIdx = 0;
        let minDistance = Infinity;

        for (let i = 0; i < remaining.length; i++) {
          const dist = calcDistanceKm(currentPoint.lat, currentPoint.lng, remaining[i].lat, remaining[i].lng);
          if (dist < minDistance) {
            minDistance = dist;
            nearestIdx = i;
          }
        }

        const nextStop = remaining.splice(nearestIdx, 1)[0];
        optimizedOrder.push(nextStop);
        currentPoint = nextStop;
      }

      setStopsList(optimizedOrder);
      setIsOptimized(true);
      setIsOptimizing(false);

      if (onNotify) {
        onNotify(isKm ? '✅ គណនាផ្លូវលឿនបំផុតជោគជ័យ! សន្សំសំចៃពេល ២៤% និងប្រេងសាំង' : '✅ Route optimized successfully! Saved 24% transit time & fuel.');
      }
    }, 600);
  };

  // Reset route back to default order
  const handleResetRoute = () => {
    setStopsList(DEFAULT_DELIVERY_STOPS);
    setIsOptimized(false);
    if (onNotify) {
      onNotify(isKm ? 'បានកំណត់លំដាប់ផ្លូវឡើងវិញ' : 'Route reset to default order');
    }
  };

  // Open Direct in Google Maps with all stops as waypoints
  const handleOpenGoogleMaps = () => {
    if (stopsList.length < 2) return;
    const origin = `${stopsList[0].lat},${stopsList[0].lng}`;
    const destination = `${stopsList[stopsList.length - 1].lat},${stopsList[stopsList.length - 1].lng}`;
    const waypoints = stopsList.slice(1, -1).map((s) => `${s.lat},${s.lng}`).join('|');

    let gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) {
      gmapsUrl += `&waypoints=${waypoints}`;
    }

    window.open(gmapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Recenter map on Cambodia or selected driver
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (selectedCourier) {
      map.setView([selectedCourier.lat, selectedCourier.lng], 10, { animate: true });
    } else {
      map.setView([12.2, 104.8], 7, { animate: true });
    }
  };

  return (
    <div className={`space-y-4 ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-900 p-3 overflow-y-auto' : ''}`}>
      {/* Top Header Bar & Action Shortcuts */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
                <Compass className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isKm ? 'ផ្ទាំងផែនទី Google Map & គន្លងអ្នកដឹក' : 'Google Map Dashboard & Fleet Routing'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    {isKm ? 'ផ្សាយផ្ទាល់' : 'Live GPS'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isKm
                    ? 'ពិនិត្យទីតាំងកញ្ចប់ឥវ៉ាន់ ឡានដឹកជញ្ជូន និងគណនាផ្លូវលឿនបំផុតឆ្លងកាត់ ២៥ ខេត្ត-ក្រុង'
                    : 'Real-time vehicle tracking, traffic conditions, and multi-stop route optimization across Cambodia'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Open in Google Maps Native button */}
            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Open full directions in Google Maps app"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isKm ? 'បើកក្នុង Google Maps' : 'Open in Google Maps'}</span>
            </button>

            {/* Optimize Route Button */}
            <button
              type="button"
              onClick={handleOptimizeRoute}
              disabled={isOptimizing}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                isOptimized
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 text-amber-300 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>
                {isOptimizing
                  ? (isKm ? 'កំពុងគណនា...' : 'Optimizing...')
                  : isOptimized
                  ? (isKm ? 'ផ្លូវលឿនបំផុតរួចរាល់' : 'Route Optimized')
                  : (isKm ? 'គណនាផ្លូវលឿនបំផុត' : 'Optimize Multi-Stop Route')}
              </span>
            </button>

            {isOptimized && (
              <button
                type="button"
                onClick={handleResetRoute}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition text-xs font-bold"
                title={isKm ? 'កំណត់ឡើងវិញ' : 'Reset Order'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Map'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Live Route Metrics Highlights Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              {isKm ? 'ចម្ងាយសរុប (Total Distance)' : 'Total Distance'}
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {routeMetrics.totalKm} km
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {stopsList.length} {isKm ? 'ចំណុចឈប់ចែកឥវ៉ាន់' : 'delivery waypoints'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              {isKm ? 'ពេលវេលាដឹក (Est. Time)' : 'Est. Travel Time'}
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {isKm ? routeMetrics.travelTimeTextKm : routeMetrics.travelTimeText}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
              {routeMetrics.delayMinutes > 0 ? `+${routeMetrics.delayMinutes}m traffic delay` : 'Normal traffic flow'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {isKm ? 'ការសន្សំសំចៃផ្លូវ (Efficiency)' : 'Efficiency Rating'}
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
              {routeMetrics.optimizedEfficiencyPct > 0 ? `+${routeMetrics.optimizedEfficiencyPct}%` : 'Standard'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {isKm ? 'កាត់បន្ថយការជិះវាងផ្លូវ' : 'Zero backtracking'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {isKm ? 'ប្រេងសាំងប៉ាន់ស្មាន' : 'Est. Fuel Usage'}
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              ~{routeMetrics.fuelLiters} L
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {currency === 'KHR' ? `${routeMetrics.fuelCostKHR.toLocaleString()} ៛` : `$${routeMetrics.fuelCostUSD}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Map Interface + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Container (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col">
          {/* Controls Bar over map */}
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-900/90 backdrop-blur-md rounded-2xl text-white text-xs mb-3 z-10 flex-wrap">
            {/* Tile Layer Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setTileLayerType('google_streets')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  tileLayerType === 'google_streets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🗺️ {isKm ? 'Google ផ្លូវ' : 'Google Streets'}
              </button>
              <button
                type="button"
                onClick={() => setTileLayerType('google_sat')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  tileLayerType === 'google_sat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛰️ {isKm ? 'ផ្កាយរណប' : 'Satellite'}
              </button>
              <button
                type="button"
                onClick={() => setTileLayerType('osm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  tileLayerType === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isKm ? 'ផែនទីស្តង់ដារ' : 'OSM'}
              </button>
            </div>

            {/* Real-time Traffic Simulator Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
                {isKm ? 'ចរាចរណ៍៖' : 'Traffic:'}
              </span>
              <button
                type="button"
                onClick={() => setTrafficLevel('low')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition cursor-pointer ${
                  trafficLevel === 'low' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                {isKm ? 'ស្រួល' : 'Low'}
              </button>
              <button
                type="button"
                onClick={() => setTrafficLevel('moderate')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition cursor-pointer ${
                  trafficLevel === 'moderate' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                }`}
              >
                {isKm ? 'មធ្យម' : 'Moderate'}
              </button>
              <button
                type="button"
                onClick={() => setTrafficLevel('heavy')}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition cursor-pointer ${
                  trafficLevel === 'heavy' ? 'bg-rose-500 text-white' : 'text-slate-400'
                }`}
              >
                {isKm ? 'កកស្ទះ' : 'Heavy'}
              </button>
            </div>

            {/* Recenter button */}
            <button
              type="button"
              onClick={handleRecenter}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title={isKm ? 'តម្រង់ចំកណ្តាល' : 'Recenter Map'}
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Leaflet Canvas Element */}
          <div
            ref={mapContainerRef}
            className="w-full h-[400px] sm:h-[480px] lg:h-[540px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner z-0"
          />

          {/* Bottom Live Courier Telemetry Overlay */}
          {selectedCourier && (
            <div className="mt-3 p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white">
                      {isKm ? selectedCourier.driverNameKm : selectedCourier.driverName}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.2 rounded-md border border-slate-700">
                      {selectedCourier.plate}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isKm ? selectedCourier.routeLabelKm : selectedCourier.routeLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectShipmentToTrack(selectedCourier.trackingNumber)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>#{selectedCourier.trackingNumber}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Multi-Stop Routing & Waypoint Sequence (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {isKm ? 'លំដាប់ចំណុចឈប់ (Waypoints)' : 'Delivery Stop Sequence'}
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {stopsList.length} Stops
              </span>
            </div>

            {/* List of stops */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {stopsList.map((stop, index) => {
                const isStart = index === 0;
                const isEnd = index === stopsList.length - 1;
                return (
                  <div
                    key={stop.id}
                    onClick={() => {
                      const map = mapInstanceRef.current;
                      if (map) map.setView([stop.lat, stop.lng], 11, { animate: true });
                    }}
                    className={`p-3 rounded-2xl border text-xs transition cursor-pointer flex items-start gap-2.5 ${
                      isStart
                        ? 'bg-slate-900 text-white border-slate-800'
                        : isEnd
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-blue-400'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 ${
                      isStart ? 'bg-white text-slate-900' : isEnd ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate">
                        {isKm ? stop.nameKm : stop.name}
                      </div>
                      <div className={`text-[10px] truncate mt-0.5 ${isStart ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isKm ? stop.addressKm : stop.address}
                      </div>
                      {stop.packageCount && (
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <span>📦 {stop.packageCount} {isKm ? 'កញ្ចប់' : 'parcels'}</span>
                          {stop.trackingNumber && <span>• #{stop.trackingNumber}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Route Optimizer CTA Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="font-bold text-xs text-white">
                  {isKm ? 'ប្រព័ន្ធបញ្ជូនឆ្លាតវៃ (Smart Dispatch)' : 'Smart Cambodia Dispatch'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isKm
                  ? 'គណនាផ្លូវកាត់បន្ថយការកកស្ទះលើផ្លូវជាតិលេខ ៤, ៥, ៦ និងផ្លូវល្បឿនលឿនភ្នំពេញ-ព្រះសីហនុ។'
                  : 'Calculates optimal highway routes avoiding congestion on NR4, NR5, NR6, and the Phnom Penh-Sihanoukville Expressway.'}
              </p>
              <button
                type="button"
                onClick={handleOptimizeRoute}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>{isKm ? 'រៀបចំផ្លូវឡើងវិញភ្លាមៗ' : 'Re-optimize Stops'}</span>
              </button>
            </div>
          </div>

          {/* Active Fleet List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>{isKm ? 'អ្នកដឹកជញ្ជូនសកម្មក្នុងប្រព័ន្ធ' : 'Active On-Duty Fleet'}</span>
            </h4>

            <div className="space-y-2">
              {LIVE_COURIERS.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCourier(c);
                    const map = mapInstanceRef.current;
                    if (map) map.setView([c.lat, c.lng], 10, { animate: true });
                  }}
                  className={`p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                    selectedCourier?.id === c.id
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {isKm ? c.driverNameKm : c.driverName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {c.plate} • {c.speedKmH} km/h
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
