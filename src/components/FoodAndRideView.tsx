import React, { useState } from 'react';
import { 
  Utensils, 
  Car, 
  MapPin, 
  Clock, 
  Star, 
  ShoppingBag, 
  Plus, 
  Check, 
  Phone, 
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Tag
} from 'lucide-react';
import { POPULAR_FOOD_MERCHANTS, RIDE_SERVICE_OPTIONS } from '../data/carriers';
import { Language, Currency, FoodMerchant, RideServiceOption } from '../types';
import { BakongKHQRModal } from './BakongKHQRModal';

interface FoodAndRideViewProps {
  language: Language;
  currency: Currency;
  onDispatchActive: (info: string) => void;
}

export const FoodAndRideView: React.FC<FoodAndRideViewProps> = ({
  language,
  currency,
  onDispatchActive,
}) => {
  const isKm = language === 'km';
  const [subTab, setSubTab] = useState<'food' | 'ride'>('food');

  // Food Filter category
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<{ merchant: FoodMerchant; item: any }[]>([]);
  const [isFoodOrdered, setIsFoodOrdered] = useState(false);
  const [isKHQROpen, setIsKHQROpen] = useState(false);

  // Ride Booking States
  const [ridePickup, setRidePickup] = useState('Boeung Keng Kang 1, St 51');
  const [rideDropoff, setRideDropoff] = useState('Phnom Penh International Airport');
  const [selectedRide, setSelectedRide] = useState<RideServiceOption>(RIDE_SERVICE_OPTIONS[0]);
  const [isRideSearching, setIsRideSearching] = useState(false);
  const [assignedRideDriver, setAssignedRideDriver] = useState<{
    name: string;
    plate: string;
    etaMinutes: number;
    phone: string;
    vehicle: string;
  } | null>(null);

  // Filtered food merchants
  const filteredMerchants = selectedCategory === 'all'
    ? POPULAR_FOOD_MERCHANTS
    : POPULAR_FOOD_MERCHANTS.filter(m => {
        if (selectedCategory === 'eatery') return m.id === 'food-1';
        if (selectedCategory === 'restaurant') return m.id === 'food-2';
        if (selectedCategory === 'market') return m.id === 'food-3';
        if (selectedCategory === 'bakery') return m.id === 'food-4';
        return true;
      });

  // Cart math (100% free delivery, no platform fees)
  const cartTotalKHR = cart.reduce((sum, c) => sum + c.item.priceKHR, 0);
  const cartTotalUSD = Number((cartTotalKHR / 4100).toFixed(2));

  const handleAddToCart = (merchant: FoodMerchant, item: any) => {
    setCart(prev => [...prev, { merchant, item }]);
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckoutFood = () => {
    setIsKHQROpen(true);
  };

  const handleFoodPaymentSuccess = () => {
    setIsKHQROpen(false);
    setIsFoodOrdered(true);
    setCart([]);
    onDispatchActive(isKm ? 'បានបញ្ជាទិញអាហារជោគជ័យ! អ្នកដឹកសហគមន៍កំពុងទៅយកនៅហាង' : 'Food order placed! Community courier is heading to store');
    setTimeout(() => {
      setIsFoodOrdered(false);
    }, 5000);
  };

  // Ride booking simulation
  const handleBookRide = () => {
    setIsRideSearching(true);
    setAssignedRideDriver(null);

    setTimeout(() => {
      setIsRideSearching(false);
      const driver = {
        name: 'Vannak Heng',
        plate: 'PP-1A-9812',
        etaMinutes: 3,
        phone: '012 884 123',
        vehicle: selectedRide.nameKm,
      };
      setAssignedRideDriver(driver);
      onDispatchActive(
        isKm 
          ? `អ្នកបើកបរ ${driver.name} (${driver.plate}) បានទទួលការកក់របស់អ្នក! មកដល់ក្នុង ៣ នាទី`
          : `Driver ${driver.name} (${driver.plate}) accepted your ride! Arriving in 3 mins`
      );
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Switcher */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSubTab('food')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition ${
            subTab === 'food'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>{isKm ? 'ម្ហូប & ផ្សារក្នុងស្រុក (Local Food & Produce)' : 'Food Delivery & Farm Mart'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('ride')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition ${
            subTab === 'ride'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>{isKm ? 'កង់បី & ម៉ូតូឌុបសហគមន៍ (0% Commission)' : 'Community Rides & TukTuk'}</span>
        </button>
      </div>

      {/* Free Platform Community Banner */}
      <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-900 font-bold">
          <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {isKm 
              ? 'កម្មវិធីឯករាជ្យឥតគិតថ្លៃ ១០០% ៖ គ្មានកាត់កម្រៃជើងសារពីអាជីវករ និងអ្នកបើកបរកង់បីឡើយ' 
              : '100% Free Independent Platform: 0% fee deducted from local food vendors and drivers'}
          </span>
        </div>
        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
          {isKm ? 'ឥតគិតថ្លៃ' : 'Zero Fee'}
        </span>
      </div>

      {/* SUB-TAB 1: FOOD DELIVERY */}
      {subTab === 'food' && (
        <div className="space-y-5">
          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isKm ? 'ទាំងអស់ (All Stores)' : 'All Stores'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('eatery')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === 'eatery'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              {isKm ? 'បាយ & គុយទាវ' : 'Breakfast & Noodles'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('restaurant')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === 'restaurant'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              {isKm ? 'ម្ហូបខ្មែរប្រណិត' : 'Traditional Khmer'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('market')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === 'market'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              {isKm ? 'បន្លែត្រីសាច់ស្រស់' : 'Farm Market'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('bakery')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === 'bakery'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              {isKm ? 'នំប៉័ង & ភេសជ្ជៈ' : 'Bakery & Drinks'}
            </button>
          </div>

          {/* Success Banner */}
          {isFoodOrdered && (
            <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-between shadow-md animate-in slide-in-from-top">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 bg-white text-emerald-600 rounded-full p-0.5" />
                <span className="text-xs md:text-sm font-bold">
                  {isKm ? 'បានបញ្ជាទិញអាហារជោគជ័យ! អ្នកដឹកសហគមន៍កំពុងធ្វើដំណើរទៅកាន់ហាង។' : 'Order Placed! Community courier dispatched to restaurant.'}
                </span>
              </div>
            </div>
          )}

          {/* Grid of Food Stores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMerchants.map((merchant) => (
              <div
                key={merchant.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="h-36 relative overflow-hidden bg-slate-100">
                    <img
                      src={merchant.imageUrl}
                      alt={merchant.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                    
                    {/* Badge Label */}
                    <span 
                      className="absolute top-2.5 left-2.5 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1"
                      style={{ backgroundColor: merchant.badgeColor }}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{isKm ? merchant.badgeLabelKm : merchant.badgeLabel}</span>
                    </span>

                    {/* Delivery Time & Rating */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs font-bold">
                      <span className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{merchant.deliveryMinutes} {isKm ? 'នាទី' : 'mins'}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{merchant.rating} ({merchant.reviewCount})</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm md:text-base">
                      {isKm ? merchant.nameKm : merchant.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isKm ? merchant.categoryKm : merchant.category}
                    </p>

                    {/* Featured items */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {isKm ? 'មុខម្ហូបពិសេសពេញនិយម' : 'Popular Dishes'}
                      </span>
                      {merchant.featuredDishes.map((dish, didx) => (
                        <div key={didx} className="flex items-center justify-between text-xs py-1">
                          <div>
                            <span className="font-semibold text-slate-800">{isKm ? dish.nameKm : dish.name}</span>
                            <span className="text-[11px] text-slate-500 block">
                              {currency === 'KHR' ? `${dish.priceKHR.toLocaleString()} ៛` : `$${dish.priceUSD.toFixed(2)}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(merchant, dish)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isKm ? 'ថែម' : 'Add'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Delivery Info */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{isKm ? 'ចម្ងាយ' : 'Distance'}: {merchant.distanceKm} km</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    {isKm ? 'ដឹកជញ្ជូនឥតគិតថ្លៃ 0៛' : 'Free Delivery 0 KHR'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Cart Drawer / Bar */}
          {cart.length > 0 && (
            <div className="fixed bottom-16 md:bottom-6 left-4 right-4 max-w-lg mx-auto z-40 bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">
                    {cart.length} {isKm ? 'មុខម្ហូបក្នុងកន្ត្រក' : 'items in cart'}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-extrabold">
                    {currency === 'KHR' ? `${cartTotalKHR.toLocaleString()} ៛` : `$${cartTotalUSD.toFixed(2)}`} ({isKm ? 'មិនគិតថ្លៃសេវា' : '0% commission'})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  {isKm ? 'លុប' : 'Clear'}
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutFood}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  {isKm ? 'ទូទាត់ប្រាក់ Bakong' : 'Checkout Bakong'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: COMMUNITY RIDES */}
      {subTab === 'ride' && (
        <div className="space-y-5">
          {/* Pickup & Dropoff location inputs */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>{isKm ? 'កក់កង់បី & ម៉ូតូឌុបសហគមន៍' : 'Book Community Rides & TukTuk'}</span>
              </h3>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{isKm ? 'គ្មានកាត់ភាគរយ 0%' : '0% Commission to Drivers'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isKm ? 'ទីតាំងឡើងជិះ / ទីតាំងទទួល (Pickup)' : 'Pickup Location'}</span>
                </label>
                <input
                  type="text"
                  value={ridePickup}
                  onChange={(e) => setRidePickup(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isKm ? 'ទីតាំងគោលដៅ (Destination)' : 'Dropoff Destination'}</span>
                </label>
                <input
                  type="text"
                  value={rideDropoff}
                  onChange={(e) => setRideDropoff(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Ride Options Selection */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {isKm ? 'ជ្រើសរើសប្រភេទយានជំនិះសហគមន៍' : 'Select Community Vehicle Type'}
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {RIDE_SERVICE_OPTIONS.map((opt) => {
                const estimatedDistanceKm = 6.8;
                const estimatedFareKHR = opt.baseFareKHR + Math.round(opt.pricePerKmKHR * estimatedDistanceKm);
                const estimatedFareUSD = Number((estimatedFareKHR / 4100).toFixed(2));
                const isSelected = selectedRide.id === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedRide(opt)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: opt.categoryColor }}
                      >
                        {opt.serviceCategory.slice(0, 3).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs md:text-sm">
                            {isKm ? opt.nameKm : opt.name}
                          </span>
                          {opt.recommended && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                              {isKm ? 'ពេញនិយម' : 'Popular'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          {isKm ? opt.communityBenefitsKm : opt.communityBenefitsEn}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>{opt.capacity}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{opt.etaMinutes} {isKm ? 'នាទីមកដល់' : 'mins away'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm md:text-base font-extrabold text-slate-900">
                        {currency === 'KHR' ? `${estimatedFareKHR.toLocaleString()} ៛` : `$${estimatedFareUSD.toFixed(2)}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ~{estimatedDistanceKm} km
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Book Ride Button or Assigned Driver Status */}
          {assignedRideDriver ? (
            <div className="bg-emerald-700 text-white rounded-2xl p-5 shadow-lg space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
                  {isKm ? 'អ្នកបើកបរបានទទួលការកក់' : 'Driver Accepted'}
                </span>
                <span className="text-xs font-black bg-white text-emerald-800 px-2.5 py-0.5 rounded-full">
                  {assignedRideDriver.etaMinutes} {isKm ? 'នាទីទៀតមកដល់' : 'mins away'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <h4 className="text-base font-black">{assignedRideDriver.name}</h4>
                  <p className="text-xs text-emerald-100 font-semibold">{assignedRideDriver.vehicle}</p>
                  <p className="text-xs text-emerald-200 mt-0.5">Plate: <strong className="text-white">{assignedRideDriver.plate}</strong></p>
                </div>
                <a
                  href={`tel:${assignedRideDriver.phone}`}
                  className="p-3 rounded-xl bg-white text-emerald-800 font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-emerald-50 transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>{assignedRideDriver.phone}</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setAssignedRideDriver(null)}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-xs font-semibold text-emerald-100 transition"
              >
                {isKm ? 'បញ្ចប់ការធ្វើដំណើរ (Complete Ride)' : 'Complete Ride Simulation'}
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <button
                type="button"
                disabled={isRideSearching}
                onClick={handleBookRide}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {isRideSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isKm ? 'កំពុងស្វែងរកអ្នកបើកបរដែលនៅជិតបំផុត...' : 'Searching for nearby drivers...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isKm ? `កក់ ${selectedRide.nameKm} ឥឡូវនេះ (0% Commission)` : `Book ${selectedRide.name} Now`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bakong Payment Modal for Food */}
      <BakongKHQRModal
        isOpen={isKHQROpen}
        onClose={() => setIsKHQROpen(false)}
        onSuccess={handleFoodPaymentSuccess}
        amountKHR={cartTotalKHR}
        amountUSD={cartTotalUSD}
        currency={currency}
        language={language}
        merchantName={cart[0]?.merchant.name || 'CamDelivery Community Store'}
        orderReference={`FD-${Math.floor(100000 + Math.random() * 900000)}`}
      />
    </div>
  );
};
