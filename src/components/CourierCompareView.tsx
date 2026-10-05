import React, { useState } from 'react';
import { 
  Package, 
  MapPin, 
  Scale, 
  ArrowRightLeft, 
  Clock, 
  ShieldCheck, 
  Truck, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Calendar,
  AlertCircle,
  Building2,
  DollarSign,
  Calculator
} from 'lucide-react';
import { CAMBODIA_PROVINCES, calculateCourierQuotes } from '../data/carriers';
import { Language, Currency, TrackingItem } from '../types';
import { calculateEstimatedDeliverySchedule } from '../utils/deliveryCalculator';
import { BakongKHQRModal } from './BakongKHQRModal';
import { ShippingCostEstimator } from './ShippingCostEstimator';

interface CourierCompareViewProps {
  language: Language;
  currency: Currency;
  onBookSuccess: (newShipment: TrackingItem) => void;
}

export const CourierCompareView: React.FC<CourierCompareViewProps> = ({
  language,
  currency,
  onBookSuccess,
}) => {
  const isKm = language === 'km';
  const [originId, setOriginId] = useState('phnom-penh');
  const [destinationId, setDestinationId] = useState('siem-reap');
  const [weightKg, setWeightKg] = useState(1.5);
  const [packageType, setPackageType] = useState('general');
  const [filterSort, setFilterSort] = useState<'best' | 'cheapest' | 'fastest'>('best');
  const [compareViewMode, setCompareViewMode] = useState<'matrix' | 'estimator'>('matrix');

  // Booking Modal State
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [senderName, setSenderName] = useState('Chan Visal');
  const [senderPhone, setSenderPhone] = useState('012 345 678');
  const [senderAddress, setSenderAddress] = useState('St 2004, Sen Sok, Phnom Penh');
  const [receiverName, setReceiverName] = useState('Kong Sreypov');
  const [receiverPhone, setReceiverPhone] = useState('098 765 432');
  const [receiverAddress, setReceiverAddress] = useState('Street 07, Wat Bo, Siem Reap');
  const [isCod, setIsCod] = useState(false);
  const [codAmountKHR, setCodAmountKHR] = useState(50000);

  // Payment Modal State
  const [isKHQRModalOpen, setIsKHQRModalOpen] = useState(false);
  const [pendingShipment, setPendingShipment] = useState<TrackingItem | null>(null);

  // Quotes
  const quotesData = calculateCourierQuotes(originId, destinationId, weightKg);
  let sortedQuotes = [...quotesData.quotes];

  if (filterSort === 'cheapest') {
    sortedQuotes.sort((a, b) => a.priceKHR - b.priceKHR);
  } else if (filterSort === 'fastest') {
    sortedQuotes.sort((a, b) => {
      const aSpeed = a.carrierId === 'cam-van-express' ? 0 : a.carrierId === 'cam-cold-chain' ? 1 : a.carrierId === 'cam-priority-express' ? 2 : 3;
      const bSpeed = b.carrierId === 'cam-van-express' ? 0 : b.carrierId === 'cam-cold-chain' ? 1 : b.carrierId === 'cam-priority-express' ? 2 : 3;
      return aSpeed - bSpeed;
    });
  }

  const handleSwapProvinces = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
  };

  const handleSelectQuoteToBook = (quote: any) => {
    setSelectedQuote(quote);
    setIsBookingModalOpen(true);
  };

  const handleBookFromEstimator = (estimate: {
    vehicleName: string;
    vehicleNameKm: string;
    weightKg: number;
    distanceKm: number;
    priceKHR: number;
    priceUSD: number;
    packageType: string;
  }) => {
    setSelectedQuote({
      carrierId: 'cam-van-express',
      carrierName: estimate.vehicleName,
      carrierNameKm: estimate.vehicleNameKm,
      serviceType: '0% Commission Fair Transport',
      serviceTypeKm: 'សេវាដឹកជញ្ជូន 0% កម្រៃជើងសារ',
      priceKHR: estimate.priceKHR,
      priceUSD: estimate.priceUSD,
      estimatedTransitTime: 'Same Day / Express',
      estimatedTransitTimeKm: 'ថ្ងៃដដែល ឬរហ័ស',
      pickupMethod: 'door_pickup',
      pickupMethodKm: 'មកយកដល់ផ្ទះ',
      deliveryMethod: 'door_delivery',
      deliveryMethodKm: 'ដឹកដល់មាត់ទ្វារ',
    });
    setWeightKg(estimate.weightKg);
    setPackageType(estimate.packageType);
    setIsBookingModalOpen(true);
  };

  const originName = CAMBODIA_PROVINCES.find((p) => p.id === originId)?.[isKm ? 'nameKm' : 'name'] || originId;
  const destinationName = CAMBODIA_PROVINCES.find((p) => p.id === destinationId)?.[isKm ? 'nameKm' : 'name'] || destinationId;

  const handleConfirmBooking = () => {
    if (!selectedQuote) return;

    // Generate realistic independent Cambodian tracking code
    let prefix = 'KH-VAN';
    if (selectedQuote.carrierId === 'cam-door-express') prefix = 'KH-DIR';
    else if (selectedQuote.carrierId === 'cam-priority-express') prefix = 'KH-PRI';
    else if (selectedQuote.carrierId === 'cam-cold-chain') prefix = 'KH-ICE';
    else if (selectedQuote.carrierId === 'cam-postal-express') prefix = 'KH-POS';
    else if (selectedQuote.carrierId === 'cam-freight-express') prefix = 'KH-FRT';

    const trackingNum = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTracking: TrackingItem = {
      trackingNumber: trackingNum,
      carrierId: selectedQuote.carrierId,
      carrierName: selectedQuote.carrierName,
      carrierNameKm: selectedQuote.carrierNameKm,
      brandColor: selectedQuote.brandColor,
      logoBg: selectedQuote.logoBg,
      serviceTitle: selectedQuote.serviceType,
      serviceTitleKm: selectedQuote.serviceTypeKm,
      senderName,
      senderPhone,
      senderCity: originName,
      senderCityKm: originName,
      receiverName,
      receiverPhone,
      receiverCity: destinationName,
      receiverCityKm: destinationName,
      weightKg,
      packageType: packageType === 'fresh_food' ? 'Fresh Food (Cold-chain)' : packageType === 'electronics' ? 'Electronics' : 'General Goods',
      packageTypeKm: packageType === 'fresh_food' ? 'ម្ហូបស្រស់ (កញ្ចប់ត្រជាក់)' : packageType === 'electronics' ? 'គ្រឿងអេឡិចត្រូនិច' : 'ទំនិញទូទៅ',
      totalPriceKHR: selectedQuote.priceKHR,
      totalPriceUSD: selectedQuote.priceUSD,
      codAmountKHR: isCod ? codAmountKHR : 0,
      isCod,
      status: 'pending',
      statusKm: isKm ? 'បានចុះបញ្ជីកក់ - រង់ចាំការប្រគល់ឥវ៉ាន់' : 'Booking Confirmed - Awaiting Dispatch',
      estimatedDelivery: selectedQuote.estimatedTransitTime,
      estimatedDeliveryKm: selectedQuote.estimatedTransitTimeKm,
      dispatchedAt: new Date().toISOString(),
      estimatedSchedule: calculateEstimatedDeliverySchedule(
        selectedQuote.carrierId,
        new Date().toISOString(),
        originName,
        destinationName
      ),
      driverName: 'Keo Rattanak',
      driverPhone: '097 889 772',
      driverVehicle: `${selectedQuote.carrierName} Dispatch Fleet`,
      milestones: [
        {
          time: 'Just now',
          date: 'Today',
          status: 'Shipment Created',
          statusKm: 'បានបង្កើតការផ្ញើឥវ៉ាន់ជោគជ័យ',
          location: originName,
          locationKm: originName,
          description: `Booking registered with ${selectedQuote.carrierName}`,
          descriptionKm: `បានកក់ជាមួយ ${selectedQuote.carrierNameKm} រួចរាល់`,
          completed: true,
          current: true,
        },
      ],
      routeCoordinates: {
        start: { lat: 11.5564, lng: 104.9282, label: originName },
        current: { lat: 11.5564, lng: 104.9282, label: originName },
        end: { lat: 13.3671, lng: 103.8448, label: destinationName },
      },
    };

    setPendingShipment(newTracking);
    setIsBookingModalOpen(false);
    setIsKHQRModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsKHQRModalOpen(false);
    if (pendingShipment) {
      onBookSuccess(pendingShipment);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Mode Switcher: 25 Provinces Carrier Matrix vs Real-Time Weight & Distance Estimator (0% Commission) */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCompareViewMode('matrix')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              compareViewMode === 'matrix'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-rose-600" />
            <span>{isKm ? 'ប្រៀបធៀបតាមខេត្ត (២៥ ខេត្ត)' : '25 Provinces Carrier Matrix'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCompareViewMode('estimator')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              compareViewMode === 'estimator'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{isKm ? 'គណនាតាមគីឡូ & ចម្ងាយ (កម្រៃ 0%)' : 'Shipping Cost Estimator'}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
              compareViewMode === 'estimator' ? 'bg-emerald-300 text-slate-950' : 'bg-emerald-100 text-emerald-800'
            }`}>
              0% Fee
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden md:flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{isKm ? 'គ្មានការកាត់កម្រៃជើងសារ ២០% លើគ្រប់ជើងដឹក' : '0% Commission • 100% Free Cambodia Platform'}</span>
        </div>
      </div>

      {/* Conditionally Render Cost Estimator vs Provincial Carrier Matrix */}
      {compareViewMode === 'estimator' ? (
        <ShippingCostEstimator
          language={language}
          currency={currency}
          onBookEstimate={handleBookFromEstimator}
        />
      ) : (
        <>
          {/* Quick Informational Banner pointing to 0% Commission Cost Estimator */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-emerald-950 block">
                  {isKm ? 'ចង់គណនាតម្លៃតាមទម្ងន់ (គីឡូ) និងចម្ងាយ (គ.ម) ជាក់លាក់?' : 'Need custom pricing based on parcel weight (kg) and distance (km)?'}
                </span>
                <span className="text-[11px] text-emerald-800">
                  {isKm
                    ? 'ប្រើម៉ាស៊ីនគណនាតម្លៃដឹកជញ្ជូនពេលវេលាជាក់ស្តែង ជាមួយអត្ថប្រយោជន៍កម្រៃជើងសារ 0% (ចំណេញ ២០% - ២៥%)'
                    : 'Use our Real-Time Cost Estimator highlighting the 0% middleman commission advantage!'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCompareViewMode('estimator')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>{isKm ? 'គណនាតាមចម្ងាយ & គីឡូ' : 'Open Cost Estimator'}</span>
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Route & Package Configuration Card */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-rose-600" />
                  <span>{isKm ? 'ប្រៀបធៀបតម្លៃផ្ញើឥវ៉ាន់ ២៥ ខេត្ត-ក្រុង' : 'Compare 25 Provinces Shipping Rates'}</span>
                </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKm 
                ? 'VET Express, J&T, KEX, Cambodia Post និង ZTO Express នៅក្នុងកន្លែងតែមួយ'
                : 'Real-time rates from VET, J&T, KEX, Cambodia Post & ZTO in one place'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isKm ? 'តម្លៃផ្ទាល់ពីក្រុមហ៊ុន' : 'Official Rates'}</span>
          </div>
        </div>

        {/* Origin & Destination Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          {/* Origin */}
          <div className="md:col-span-5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{isKm ? 'ទីតាំងផ្ញើចេញ (Origin)' : 'Shipping From'}</span>
            </label>
            <select
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              {CAMBODIA_PROVINCES.map((prov) => (
                <option key={`orig-${prov.id}`} value={prov.id}>
                  {isKm ? prov.nameKm : prov.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwapProvinces}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 shadow-xs transition"
              title={isKm ? 'ប្តូរទីតាំង' : 'Swap Origin & Destination'}
            >
              <ArrowRightLeft className="w-4 h-4 rotate-90 md:rotate-0" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>{isKm ? 'ទីតាំងអ្នកទទួល (Destination)' : 'Shipping To'}</span>
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              {CAMBODIA_PROVINCES.map((prov) => (
                <option key={`dest-${prov.id}`} value={prov.id}>
                  {isKm ? prov.nameKm : prov.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Weight & Package Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                <span>{isKm ? 'ទម្ងន់ឥវ៉ាន់ (Weight)' : 'Parcel Weight'}</span>
              </span>
              <span className="text-rose-600 font-bold">{weightKg} kg</span>
            </div>
            {/* Quick Weight Pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[0.5, 1, 2, 3, 5, 10, 20].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeightKg(w)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                    weightKg === w
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {w} kg
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0.5"
              max="30"
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value))}
              className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              {isKm ? 'ប្រភេទឥវ៉ាន់ (Package Type)' : 'Parcel Category'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'general', label: isKm ? 'ទំនិញទូទៅ' : 'General' },
                { id: 'electronics', label: isKm ? 'អេឡិចត្រូនិច' : 'Electronics' },
                { id: 'fresh_food', label: isKm ? 'ម្ហូបស្រស់ (ត្រជាក់)' : 'Fresh Food (Cold)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPackageType(item.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                    packageType === item.id
                      ? 'bg-rose-50 border-rose-500 text-rose-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sort & Filter Tabs */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100 flex-wrap gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {isKm ? `រកឃើញ ${sortedQuotes.length} ក្រុមហ៊ុនដឹកជញ្ជូន:` : `Found ${sortedQuotes.length} available carriers:`}
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilterSort('best')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterSort === 'best' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isKm ? 'ពេញនិយម' : 'Recommended'}
            </button>
            <button
              type="button"
              onClick={() => setFilterSort('cheapest')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterSort === 'cheapest' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isKm ? 'តម្លៃទាបជាងគេ' : 'Cheapest'}
            </button>
            <button
              type="button"
              onClick={() => setFilterSort('fastest')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterSort === 'fastest' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isKm ? 'លឿនរហ័ស' : 'Fastest'}
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {sortedQuotes.map((quote, idx) => {
          const displayPrice = currency === 'KHR' 
            ? `${quote.priceKHR.toLocaleString()} ៛` 
            : `$${quote.priceUSD.toFixed(2)}`;

          const badgeCode = quote.carrierId
            .replace('cam-', '')
            .replace('-express', '')
            .slice(0, 4)
            .toUpperCase();

          return (
            <div
              key={quote.carrierId}
              className={`bg-white rounded-2xl p-4 md:p-5 border transition hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden ${
                idx === 0 && filterSort === 'best'
                  ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                  : 'border-slate-200'
              }`}
            >
              {/* Badge for Best Value or Fast */}
              {idx === 0 && filterSort === 'best' && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  {isKm ? 'ជម្រើសសហគមន៍ល្អបំផុត' : 'Community Choice'}
                </div>
              )}

              {/* Carrier Brand & Specs */}
              <div className="flex items-start gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: quote.brandColor }}
                >
                  {badgeCode}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm md:text-base">
                      {isKm ? quote.carrierNameKm : quote.carrierName}
                    </h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {isKm ? quote.serviceTypeKm : quote.serviceType}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isKm ? quote.estimatedTransitTimeKm : quote.estimatedTransitTime}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isKm ? quote.pickupMethodKm : quote.pickupMethod.replace('_', ' ')}</span>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isKm ? 'គាំទ្រ COD' : 'COD Supported'}</span>
                    </span>
                  </div>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(isKm ? quote.featuresKm : quote.features).map((feat, fidx) => (
                      <span
                        key={fidx}
                        className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{feat}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <div className="text-left md:text-right">
                  <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {displayPrice}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {currency === 'KHR' ? `$${quote.priceUSD.toFixed(2)}` : `${quote.priceKHR.toLocaleString()} ៛`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectQuoteToBook(quote)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 group"
                >
                  <span>{isKm ? 'កក់ការផ្ញើឥវ៉ាន់' : 'Book Dispatch'}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}

      {/* Booking Form Modal */}
      {isBookingModalOpen && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 md:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center"
                  style={{ backgroundColor: selectedQuote.brandColor }}
                >
                  {selectedQuote.carrierId.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isKm ? `កក់ការផ្ញើជាមួយ ${selectedQuote.carrierNameKm}` : `Book with ${selectedQuote.carrierName}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {originName} ➔ {destinationName} ({weightKg} kg)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>

            {/* Sender Details */}
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{isKm ? 'ព័ត៌មានអ្នកផ្ញើ (Sender Info)' : 'Sender Details'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">{isKm ? 'ឈ្មោះអ្នកផ្ញើ' : 'Sender Name'}</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">{isKm ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">{isKm ? 'អាសយដ្ឋានយកឥវ៉ាន់' : 'Pickup Address'}</label>
                <input
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Receiver Details */}
            <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>{isKm ? 'ព័ត៌មានអ្នកទទួល (Receiver Info)' : 'Receiver Details'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">{isKm ? 'ឈ្មោះអ្នកទទួល' : 'Receiver Name'}</label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">{isKm ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</label>
                  <input
                    type="text"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">{isKm ? 'អាសយដ្ឋានដឹកទៅ' : 'Delivery Address'}</label>
                <input
                  type="text"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Cash on Delivery (COD) Options */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">{isKm ? 'សេវាប្រមូលប្រាក់ជំនួស (COD)' : 'Cash on Delivery (COD)'}</div>
                  <div className="text-[11px] text-slate-500">{isKm ? 'ឱ្យអ្នកដឹកយកលុយពីអ្នកទទួល' : 'Collect payment from receiver'}</div>
                </div>
                <input
                  type="checkbox"
                  checked={isCod}
                  onChange={(e) => setIsCod(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
              </div>
              {isCod && (
                <div className="mt-2.5 pt-2 border-t border-slate-200">
                  <label className="text-[11px] text-slate-600 block mb-1">
                    {isKm ? 'ចំនួនប្រាក់ត្រូវប្រមូល (KHR)' : 'COD Amount (KHR)'}
                  </label>
                  <input
                    type="number"
                    value={codAmountKHR}
                    onChange={(e) => setCodAmountKHR(Number(e.target.value))}
                    step="5000"
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Price Summary & Submit */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">{isKm ? 'សរុបថ្លៃដឹកជញ្ជូន' : 'Total Delivery Fee'}</span>
                <span className="text-lg font-black text-rose-600">
                  {currency === 'KHR' ? `${selectedQuote.priceKHR.toLocaleString()} ៛` : `$${selectedQuote.priceUSD.toFixed(2)}`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <span>{isKm ? 'បន្តទៅបង់ប្រាក់ KHQR' : 'Pay with Bakong KHQR'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bakong KHQR Modal */}
      {selectedQuote && pendingShipment && (
        <BakongKHQRModal
          isOpen={isKHQRModalOpen}
          onClose={() => setIsKHQRModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          amountKHR={selectedQuote.priceKHR}
          amountUSD={selectedQuote.priceUSD}
          currency={currency}
          language={language}
          merchantName={selectedQuote.carrierName}
          orderReference={pendingShipment.trackingNumber}
        />
      )}
    </div>
  );
};
