import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Compass,
  Phone,
  Clock,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Building2,
  Store,
  Layers,
  ChevronRight,
  Crosshair
} from 'lucide-react';
import { Language, Currency } from '../types';

interface NearbyDropoffMapWidgetProps {
  language: Language;
  currency: Currency;
  onNotify?: (msg: string) => void;
  className?: string;
}

export type DropoffPointType = 'hub' | 'kiosk_24_7' | 'post_office' | 'locker';

export interface DropoffPoint {
  id: string;
  nameEn: string;
  nameKm: string;
  carrierId: string;
  carrierName: string;
  carrierNameKm: string;
  brandColor: string;
  pointType: DropoffPointType;
  pointTypeLabelEn: string;
  pointTypeLabelKm: string;
  addressEn: string;
  addressKm: string;
  cityEn: string;
  cityKm: string;
  lat: number;
  lng: number;
  phone: string;
  openingHoursEn: string;
  openingHoursKm: string;
  isOpenNow: boolean;
  servicesEn: string[];
  servicesKm: string[];
}

const DROPOFF_POINTS: DropoffPoint[] = [
  {
    id: 'vet-central-pp',
    nameEn: 'Virak Buntham (VET) Central Hub',
    nameKm: 'វិរៈប៊ុនថាំ សាខាកណ្តាល មាត់ទន្លេ',
    carrierId: 'vet',
    carrierName: 'Virak Buntham Express',
    carrierNameKm: 'វិរៈប៊ុនថាំ អេចប្រេស',
    brandColor: '#dc2626',
    pointType: 'hub',
    pointTypeLabelEn: 'Full Hub & Cargo',
    pointTypeLabelKm: 'ឃ្លាំងធំ & បញ្ញើធុនធ្ងន់',
    addressEn: 'Corner of St 106 & Sisowath Quay, Wat Phnom, Phnom Penh',
    addressKm: 'កែងផ្លូវ ១០៦ និងតីរវិថីព្រះស៊ីសុវត្ថិ, វត្តភ្នំ, ភ្នំពេញ',
    cityEn: 'Phnom Penh',
    cityKm: 'ភ្នំពេញ',
    lat: 11.5723,
    lng: 104.9298,
    phone: '012 888 888',
    openingHoursEn: 'Open 24/7 (Day & Night)',
    openingHoursKm: 'បើក ២៤/៧ ទាំងយប់ទាំងថ្ងៃ',
    isOpenNow: true,
    servicesEn: ['Parcel Drop-off', 'Interprovincial Van', 'Cold Storage', 'COD Collection'],
    servicesKm: ['ផ្ញើឥវ៉ាន់', 'ឡានវ៉ែនខេត្ត', 'ទូរត្រជាក់', 'ប្រមូលប្រាក់ COD'],
  },
  {
    id: 'jt-bkk1-pp',
    nameEn: 'J&T Express Drop-off Kiosk BKK1',
    nameKm: 'ជេ&ធី អេចប្រេស សាខាបឹងកេងកង១',
    carrierId: 'jt',
    carrierName: 'J&T Express Cambodia',
    carrierNameKm: 'ជេ&ធី អេចប្រេស កម្ពុជា',
    brandColor: '#e11d48',
    pointType: 'kiosk_24_7',
    pointTypeLabelEn: 'Express Kiosk',
    pointTypeLabelKm: 'កន្លែងទទួលរហ័ស',
    addressEn: 'St 282, Boeung Keng Kang 1, Chamkarmon, Phnom Penh',
    addressKm: 'ផ្លូវ ២៨២, បឹងកេងកង១, ចំការមន, ភ្នំពេញ',
    cityEn: 'Phnom Penh',
    cityKm: 'ភ្នំពេញ',
    lat: 11.5510,
    lng: 104.9261,
    phone: '023 999 555',
    openingHoursEn: '07:30 AM - 08:30 PM',
    openingHoursKm: '០៧:៣០ ព្រឹក - ០៨:៣០ យប់',
    isOpenNow: true,
    servicesEn: ['Small & Medium Parcels', 'Free Packaging', 'Direct Bakong KHQR'],
    servicesKm: ['កញ្ចប់តូច & មធ្យម', 'វេចខ្ចប់ឥតគិតថ្លៃ', 'ស្កេនបាគង'],
  },
  {
    id: 'cambodia-post-hq',
    nameEn: 'Cambodia Post Central Post Office',
    nameKm: 'ប្រៃសណីយ៍កម្ពុជា ការិយាល័យកណ្តាល',
    carrierId: 'post',
    carrierName: 'Cambodia Post (EMS)',
    carrierNameKm: 'ប្រៃសណីយ៍កម្ពុជា',
    brandColor: '#2563eb',
    pointType: 'post_office',
    pointTypeLabelEn: 'Official Post Office',
    pointTypeLabelKm: 'ការិយាល័យប្រៃសណីយ៍រដ្ឋ',
    addressEn: 'Post Office Square, St 13, Wat Phnom, Phnom Penh',
    addressKm: 'វិមានប្រៃសណីយ៍, ផ្លូវ ១៣, វត្តភ្នំ, ភ្នំពេញ',
    cityEn: 'Phnom Penh',
    cityKm: 'ភ្នំពេញ',
    lat: 11.5755,
    lng: 104.9242,
    phone: '023 428 080',
    openingHoursEn: '07:30 AM - 05:30 PM (Mon-Sat)',
    openingHoursKm: '០៧:៣០ ព្រឹក - ០៥:៣០ ល្ងាច (ចន្ទ-សៅរ៍)',
    isOpenNow: true,
    servicesEn: ['National EMS', 'Document Express', 'Provinces Coverage', 'Track & Trace'],
    servicesKm: ['EMS ទូទាំងប្រទេស', 'សំបុត្រឯកសារ', 'គ្រប់ស្រុក-ខេត្ត', 'តាមដាន'],
  },
  {
    id: 'zto-toulkork',
    nameEn: 'ZTO Express Station Toul Kork',
    nameKm: 'ហ្សិតធីអូ អេចប្រេស សាខាទួលគោក',
    carrierId: 'zto',
    carrierName: 'ZTO Express Cambodia',
    carrierNameKm: 'ហ្សិតធីអូ អេចប្រេស',
    brandColor: '#0284c7',
    pointType: 'hub',
    pointTypeLabelEn: 'Commercial Hub',
    pointTypeLabelKm: 'សាខាពាណិជ្ជកម្ម',
    addressEn: 'St 315, Boeng Kak 1, Toul Kork, Phnom Penh',
    addressKm: 'ផ្លូវ ៣១៥, បឹងកក់១, ទួលគោក, ភ្នំពេញ',
    cityEn: 'Phnom Penh',
    cityKm: 'ភ្នំពេញ',
    lat: 11.5780,
    lng: 104.8960,
    phone: '098 777 666',
    openingHoursEn: '08:00 AM - 09:00 PM',
    openingHoursKm: '០៨:០០ ព្រឹក - ០៩:០០ យប់',
    isOpenNow: true,
    servicesEn: ['E-Commerce Dispatch', 'High Volume Drop-off', 'Doorstep Delivery'],
    servicesKm: ['បញ្ញើអនឡាញ', 'ទំនិញបរិមាណច្រើន', 'ដឹកដល់ផ្ទះ'],
  },
  {
    id: 'capitol-orussey',
    nameEn: 'Capitol Logistics Orussey Hub',
    nameKm: 'កាពីតូល ដឹកជញ្ជូន សាខាអូរឫស្សី',
    carrierId: 'capitol',
    carrierName: 'Capitol Logistics',
    carrierNameKm: 'កាពីតូល ដឹកជញ្ជូន',
    brandColor: '#ea580c',
    pointType: 'hub',
    pointTypeLabelEn: 'Bus & Van Depot',
    pointTypeLabelKm: 'ស្ថានីយរថយន្ត & ឃ្លាំង',
    addressEn: 'St 182, Orussey 1, 7 Makara, Phnom Penh',
    addressKm: 'ផ្លូវ ១៨២, អូរឫស្សី១, ៧មករា, ភ្នំពេញ',
    cityEn: 'Phnom Penh',
    cityKm: 'ភ្នំពេញ',
    lat: 11.5620,
    lng: 104.9140,
    phone: '023 217 627',
    openingHoursEn: '06:30 AM - 08:00 PM',
    openingHoursKm: '០៦:៣០ ព្រឹក - ០៨:០០ យប់',
    isOpenNow: true,
    servicesEn: ['Intercity Parcels', 'Agricultural Produce', 'Affordable Rates'],
    servicesKm: ['បញ្ញើអន្តរខេត្ត', 'កសិផល & ម្ហូប', 'តម្លៃសមរម្យ'],
  },
  {
    id: 'vet-olympic-kiosk',
    nameEn: 'VET Express 24/7 Smart Kiosk Olympic',
    nameKm: 'វិរៈប៊ុនថាំ ទូស្វ័យប្រវត្ត ២៤/៧ ស្តាតអូឡាំពិក',
    carrierId: 'vet',
    carrierName: 'Virak Buntham Express',
    carrierNameKm: 'វិរៈប៊ុនថាំ អេចប្រេស',
    brandColor: '#dc2626',
    pointType: 'kiosk_24_7',
    pointTypeLabelEn: '24/7 Self-Service Kiosk',
    pointTypeLabelKm: 'ទូស្វ័យប្រវត្ត ២៤/៧',
    addressEn: 'Near Olympic Stadium Gate 4, 7 Makara, Phnom Penh',
    addressKm: 'ក្បែរខ្លោងទ្វារលេខ៤ ពហុកីឡដ្ឋានជាតិអូឡាំពិក, ៧មករា, ភ្នំពេញ',
    cityEn: 'Phnom Penh',
    cityKm: 'ភ្នំពេញ',
    lat: 11.5580,
    lng: 104.9100,
    phone: '012 888 888',
    openingHoursEn: 'Open 24/7 Automated',
    openingHoursKm: 'ដំណើរការ ២៤/៧ ស្វ័យប្រវត្ត',
    isOpenNow: true,
    servicesEn: ['Self Drop-off', 'QR Scanner', 'Instant Weighing', 'Zero Waiting'],
    servicesKm: ['ផ្ញើដោយខ្លួនឯង', 'ស្កេន QR', 'ថ្លឹងទម្ងន់ស្វ័យប្រវត្ត', 'មិនបាច់រង់ចាំ'],
  },
  {
    id: 'kex-sensok',
    nameEn: 'KEX Express Station Sen Sok',
    nameKm: 'ខេអេច អេចប្រេស សាខាសែនសុខ',
    carrierId: 'kex',
    carrierName: 'KEX Express Cambodia',
    carrierNameKm: 'ខេអេច អេចប្រេស',
    brandColor: '#f97316',
    pointType: 'hub',
    pointTypeLabelEn: 'Drop-off Station',
    pointTypeLabelKm: 'ស្ថានីយទទួលបញ្ញើ',
    addressEn: 'St 1003, near Aeon Mall 2, Sen Sok, Phnom Penh',
    addressKm: 'ផ្លូវ ១០០៣, ក្បែរអ៊ីអន២, សែនសុខ, ភ្នំពេញ',
    cityEn: 'Phnom Penh',
    cityKm: 'ភ្នំពេញ',
    lat: 11.5950,
    lng: 104.8810,
    phone: '023 900 888',
    openingHoursEn: '08:00 AM - 08:00 PM',
    openingHoursKm: '០៨:០០ ព្រឹក - ០៨:០០ យប់',
    isOpenNow: true,
    servicesEn: ['Same-Day Doorstep', 'Express Pouch', 'Bakong Payment'],
    servicesKm: ['ដឹកដល់ផ្ទះថ្ងៃដដែល', 'ស្រោមសំបុត្ររហ័ស', 'ទូទាត់បាគង'],
  },
  {
    id: 'vet-siemreap-pubst',
    nameEn: 'VET Express Pub Street Hub Siem Reap',
    nameKm: 'វិរៈប៊ុនថាំ សាខាផាប់ស្ទ្រីត សៀមរាប',
    carrierId: 'vet',
    carrierName: 'Virak Buntham Express',
    carrierNameKm: 'វិរៈប៊ុនថាំ អេចប្រេស',
    brandColor: '#dc2626',
    pointType: 'hub',
    pointTypeLabelEn: 'Provincial Central Hub',
    pointTypeLabelKm: 'ឃ្លាំងកណ្តាលខេត្ត',
    addressEn: 'Near Old Market (Phsar Chas) & Pub Street, Siem Reap',
    addressKm: 'ក្បែរផ្សារចាស់ & ផាប់ស្ទ្រីត, ក្រុងសៀមរាប',
    cityEn: 'Siem Reap',
    cityKm: 'សៀមរាប',
    lat: 13.3530,
    lng: 103.8550,
    phone: '012 888 888',
    openingHoursEn: '07:00 AM - 09:00 PM',
    openingHoursKm: '០៧:០០ ព្រឹក - ០៩:០០ យប់',
    isOpenNow: true,
    servicesEn: ['Tourism Parcels', 'Hotel Pickup', 'Express Van to PP'],
    servicesKm: ['បញ្ញើទេសចរណ៍', 'មកយកដល់សណ្ឋាគារ', 'ឡានវ៉ែនទៅភ្នំពេញ'],
  },
  {
    id: 'jt-battambang',
    nameEn: 'J&T Express Battambang Riverside',
    nameKm: 'ជេ&ធី អេចប្រេស សាខាមាត់ស្ទឹង បាត់ដំបង',
    carrierId: 'jt',
    carrierName: 'J&T Express Cambodia',
    carrierNameKm: 'ជេ&ធី អេចប្រេស កម្ពុជា',
    brandColor: '#e11d48',
    pointType: 'hub',
    pointTypeLabelEn: 'Provincial Office',
    pointTypeLabelKm: 'ការិយាល័យខេត្ត',
    addressEn: 'Street 1, Sangkat Svay Pao, Battambang City',
    addressKm: 'ផ្លូវលេខ១, សង្កាត់ស្វាយប៉ោ, ក្រុងបាត់ដំបង',
    cityEn: 'Battambang',
    cityKm: 'បាត់ដំបង',
    lat: 13.1020,
    lng: 103.2010,
    phone: '053 952 888',
    openingHoursEn: '07:30 AM - 07:30 PM',
    openingHoursKm: '០៧:៣០ ព្រឹក - ០៧:៣០ យប់',
    isOpenNow: true,
    servicesEn: ['Farm Produce Express', 'Consolidated Cargo', 'COD Collection'],
    servicesKm: ['កសិផលរហ័ស', 'ឥវ៉ាន់ប្រមូលផ្តុំ', 'ប្រមូលប្រាក់ COD'],
  },
];

// Helper: Haversine distance in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const NearbyDropoffMapWidget: React.FC<NearbyDropoffMapWidgetProps> = ({
  language,
  currency,
  onNotify,
  className = '',
}) => {
  const isKm = language === 'km';

  // Default to central Phnom Penh (near Wat Phnom / Central Market)
  const defaultPos = { lat: 11.5621, lng: 104.9160 };
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(defaultPos);
  const [hasRealGeoLocation, setHasRealGeoLocation] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Filter state
  const [carrierFilter, setCarrierFilter] = useState<'all' | 'vet' | 'jt' | 'post' | 'zto' | 'kiosk'>('all');
  const [selectedPointId, setSelectedPointId] = useState<string>('vet-central-pp');

  // Map DOM and Leaflet instance refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Request browser GPS position
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(isKm ? 'ឧបករណ៍របស់អ្នកមិនគាំទ្រ Geolocation ទេ' : 'Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setHasRealGeoLocation(true);
        setIsLocating(false);

        if (onNotify) {
          onNotify(
            isKm
              ? 'បានកំណត់ទីតាំង GPS របស់អ្នកជោគជ័យ! បង្ហាញសាខាដែលនៅជិតបំផុត។'
              : 'GPS location detected! Showing nearest drop-off points.'
          );
        }

        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
        }
      },
      (err) => {
        setIsLocating(false);
        setGeoError(
          isKm
            ? 'មិនអាចទាញយកទីតាំងបានទេ (កំពុងប្រើទីតាំងលំនាំដើមភ្នំពេញ)'
            : 'Could not access GPS location. Using default Phnom Penh center.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  // Compute distance from user location for each dropoff point and sort nearest first
  const sortedPoints = useMemo(() => {
    const list = DROPOFF_POINTS.map((pt) => {
      const distanceKm = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, pt.lat, pt.lng);
      return {
        ...pt,
        distanceKm,
        distanceLabel: distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`,
      };
    });

    // Apply Filter
    let filtered = list;
    if (carrierFilter === 'kiosk') {
      filtered = list.filter((p) => p.pointType === 'kiosk_24_7');
    } else if (carrierFilter !== 'all') {
      filtered = list.filter((p) => p.carrierId === carrierFilter);
    }

    // Sort by nearest distance
    return filtered.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation, carrierFilter]);

  const activePoint = useMemo(() => {
    return sortedPoints.find((p) => p.id === selectedPointId) || sortedPoints[0];
  }, [sortedPoints, selectedPointId]);

  // Initialize and maintain Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13,
        zoomControl: false,
      });

      // Add Zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tiles with clean contrast
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Remove old point markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // User GPS Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: 'user-gps-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: rgba(59, 130, 246, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 16px; height: 16px; border-radius: 9999px; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<strong>${isKm ? '📍 ទីតាំងបច្ចុប្បន្នរបស់អ្នក' : '📍 Your Current Location'}</strong>`);

    // Render Drop-off Point Markers
    sortedPoints.forEach((pt) => {
      const isSelected = pt.id === selectedPointId;
      const markerHtml = `
        <div style="
          background-color: ${pt.brandColor};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)'};
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1.0)'};
          transition: transform 0.2s ease;
          white-space: nowrap;
        ">
          <span>📦</span>
          <span>${pt.carrierId.toUpperCase()}</span>
          <span style="font-size: 9px; opacity: 0.9; background: rgba(0,0,0,0.25); padding: 1px 4px; border-radius: 4px;">${pt.distanceLabel}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-dropoff-marker',
        html: markerHtml,
        iconSize: [90, 28],
        iconAnchor: [45, 14],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          setSelectedPointId(pt.id);
        });

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 2px;">
          <strong style="color: #0f172a; font-size: 13px;">${isKm ? pt.nameKm : pt.nameEn}</strong>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">${isKm ? pt.addressKm : pt.addressEn}</div>
          <div style="font-size: 11px; font-weight: bold; color: #16a34a; margin-top: 4px;">⏰ ${isKm ? pt.openingHoursKm : pt.openingHoursEn}</div>
          <div style="font-size: 11px; color: #2563eb; margin-top: 2px;">📞 ${pt.phone} (${pt.distanceLabel})</div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${pt.lat},${pt.lng}" target="_blank" style="display: inline-block; margin-top: 6px; padding: 4px 8px; background: #0f172a; color: white; border-radius: 6px; font-size: 10px; font-weight: bold; text-decoration: none;">
            ${isKm ? '🗺️ បើកទិសដៅ Google Maps' : '🗺️ Open Directions'}
          </a>
        </div>
      `);

      markersRef.current[pt.id] = marker;
    });
  }, [sortedPoints, userLocation, selectedPointId, isKm]);

  // Center map when activePoint changes
  const handleSelectPoint = (pt: DropoffPoint & { distanceLabel: string }) => {
    setSelectedPointId(pt.id);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([pt.lat, pt.lng], 15, { duration: 0.8 });
      const marker = markersRef.current[pt.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden ${className}`}>
      {/* Header Accent Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <MapPin className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base sm:text-lg text-white">
                {isKm ? 'ទីតាំងផ្ញើឥវ៉ាន់នៅក្បែរអ្នក (Nearby Drop-off Points)' : 'Nearby Drop-off Points & Kiosks'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-2xs">
                {isKm ? 'GPS ផ្ទាល់' : 'GPS Live'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {isKm
                ? 'ស្វែងរកការិយាល័យក្រុមហ៊ុនដឹកជញ្ជូន និងទូផ្ញើឥវ៉ាន់ស្វ័យប្រវត្ត ២៤/៧ ដែលនៅជិតលោកអ្នកបំផុត'
                : 'Interactive geolocation map showing the closest courier offices, express kiosks & 24/7 drop-off collection lockers.'}
            </p>
          </div>
        </div>

        {/* GPS Locate Me Button */}
        <button
          type="button"
          onClick={handleRequestLocation}
          disabled={isLocating}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          {isLocating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4 text-cyan-300" />
          )}
          <span>
            {isLocating
              ? (isKm ? 'កំពុងស្វែងរក GPS...' : 'Locating GPS...')
              : hasRealGeoLocation
              ? (isKm ? 'ធ្វើបច្ចុប្បន្នភាព GPS' : 'Update Location')
              : (isKm ? 'ប្រើទីតាំងខ្ញុំ (Locate Me)' : 'Find Near Me')}
          </span>
        </button>
      </div>

      {/* Main Map & Interactive Drop-off List Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Geo Error advisory if any */}
        {geoError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{geoError}</span>
          </div>
        )}

        {/* Carrier Brand Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <span className="text-[11px] text-slate-400 font-extrabold uppercase mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>{isKm ? 'តម្រង៖' : 'Filter:'}</span>
          </span>

          {[
            { id: 'all', labelEn: 'All Points', labelKm: 'ទាំងអស់' },
            { id: 'kiosk', labelEn: '24/7 Kiosks & Lockers', labelKm: 'ទូស្វ័យប្រវត្ត ២៤/៧' },
            { id: 'vet', labelEn: 'Virak Buntham (VET)', labelKm: 'វិរៈប៊ុនថាំ' },
            { id: 'jt', labelEn: 'J&T Express', labelKm: 'ជេ&ធី អេចប្រេស' },
            { id: 'post', labelEn: 'Cambodia Post', labelKm: 'ប្រៃសណីយ៍កម្ពុជា' },
            { id: 'zto', labelEn: 'ZTO Express', labelKm: 'ហ្សិតធីអូ' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCarrierFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                carrierFilter === tab.id
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isKm ? tab.labelKm : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Two-Column Layout: Leaflet Map (Left) & Nearest Drop-off Points List (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Map Container (7 Columns on large screens) */}
          <div className="lg:col-span-7 bg-slate-950 rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative min-h-[320px] sm:min-h-[400px]">
            <div ref={mapContainerRef} className="w-full h-full min-h-[320px] sm:min-h-[400px] z-10" />

            {/* Bottom floating helper on map */}
            <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
              <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1 rounded-full border border-slate-700 shadow-md">
                {isKm ? 'ចុចលើ Marker លើផែនទី ដើម្បីមើលព័ត៌មានលម្អិត' : 'Click any marker to inspect hub details & directions'}
              </span>
            </div>
          </div>

          {/* Nearest Drop-off Points List (5 Columns on large screens) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                {isKm ? `សាខានៅក្បែរ (${sortedPoints.length} កន្លែង)` : `Nearest Locations (${sortedPoints.length})`}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {isKm ? 'តម្រៀបតាមចម្ងាយ' : 'Sorted by distance'}
              </span>
            </div>

            {/* Scrollable list */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {sortedPoints.map((pt) => {
                const isSelected = selectedPointId === pt.id;
                return (
                  <div
                    key={pt.id}
                    onClick={() => handleSelectPoint(pt)}
                    className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: pt.brandColor }}
                          >
                            {pt.carrierId.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                              {isKm ? pt.nameKm : pt.nameEn}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {isKm ? pt.pointTypeLabelKm : pt.pointTypeLabelEn}
                            </span>
                          </div>
                        </div>

                        {/* Distance pill */}
                        <span className="text-xs font-mono font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg shrink-0">
                          {pt.distanceLabel}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-1">
                        📍 {isKm ? pt.addressKm : pt.addressEn}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{isKm ? pt.openingHoursKm : pt.openingHoursEn}</span>
                        </span>

                        <span className="text-slate-600 font-mono font-bold">
                          📞 {pt.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Point Action Box */}
            {activePoint && (
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2 mt-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white truncate max-w-[200px]">
                    {isKm ? activePoint.nameKm : activePoint.nameEn}
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono font-bold">
                    {activePoint.distanceLabel} {isKm ? 'ពីអ្នក' : 'away'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activePoint.lat},${activePoint.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isKm ? 'ទិសដៅ Google Map' : 'Directions'}</span>
                  </a>

                  <a
                    href={`tel:${activePoint.phone.replace(/[^0-9]/g, '')}`}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1 border border-slate-700"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isKm ? 'ហៅទូរស័ព្ទ' : 'Call'}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
