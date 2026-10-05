import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Home,
  Building2,
  Store,
  Warehouse,
  CheckCircle2,
  Trash2,
  Edit3,
  Star,
  Check,
  X,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { Language, SavedAddressItem, SavedAddressCategory } from '../types';
import { CAMBODIA_PROVINCES } from '../data/carriers';
import {
  getSavedAddresses,
  saveAddress,
  deleteAddress,
  setDefaultPickup,
  setDefaultDelivery,
  SAVED_ADDRESSES_EVENT
} from '../utils/savedAddressService';

interface SavedAddressesManagerProps {
  language: Language;
  onNotify?: (msg: string) => void;
  className?: string;
}

export const SavedAddressesManager: React.FC<SavedAddressesManagerProps> = ({
  language,
  onNotify,
  className = '',
}) => {
  const isKm = language === 'km';
  const [addresses, setAddresses] = useState<SavedAddressItem[]>(getSavedAddresses);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [provinceId, setProvinceId] = useState('phnom-penh');
  const [detailAddress, setDetailAddress] = useState('');
  const [category, setCategory] = useState<SavedAddressCategory>('home');
  const [isDefaultPickupVal, setIsDefaultPickupVal] = useState(false);
  const [isDefaultDeliveryVal, setIsDefaultDeliveryVal] = useState(false);

  // Sync with storage updates
  useEffect(() => {
    const handleUpdate = () => {
      setAddresses(getSavedAddresses());
    };
    window.addEventListener(SAVED_ADDRESSES_EVENT, handleUpdate);
    return () => window.removeEventListener(SAVED_ADDRESSES_EVENT, handleUpdate);
  }, []);

  const openAddModal = () => {
    setEditingAddressId(null);
    setLabel('');
    setContactName('Chan Visal');
    setContactPhone('012 345 678');
    setProvinceId('phnom-penh');
    setDetailAddress('');
    setCategory('home');
    setIsDefaultPickupVal(false);
    setIsDefaultDeliveryVal(false);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: SavedAddressItem) => {
    setEditingAddressId(addr.id);
    setLabel(addr.label);
    setContactName(addr.contactName);
    setContactPhone(addr.contactPhone);
    setProvinceId(addr.provinceId);
    setDetailAddress(addr.detailAddress);
    setCategory(addr.category);
    setIsDefaultPickupVal(addr.isDefaultPickup);
    setIsDefaultDeliveryVal(addr.isDefaultDelivery);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailAddress.trim()) return;

    const prov = CAMBODIA_PROVINCES.find((p) => p.id === provinceId) || CAMBODIA_PROVINCES[0];

    const updated = saveAddress(
      {
        label: label.trim() || (isKm ? 'ទីតាំងផ្ទាល់ខ្លួន' : 'Saved Location'),
        labelKm: label.trim() || 'ទីតាំងផ្ទាល់ខ្លួន',
        contactName: contactName.trim() || 'Chan Visal',
        contactPhone: contactPhone.trim() || '012 345 678',
        provinceId: prov.id,
        provinceName: prov.name,
        provinceNameKm: prov.nameKm,
        detailAddress: detailAddress.trim(),
        category,
        isDefaultPickup: isDefaultPickupVal,
        isDefaultDelivery: isDefaultDeliveryVal,
      },
      editingAddressId || undefined
    );

    setAddresses(updated);
    setIsModalOpen(false);

    if (onNotify) {
      onNotify(
        isKm
          ? editingAddressId
            ? 'បានកែប្រែព័ត៌មានអាសយដ្ឋានជោគជ័យ!'
            : 'បានរក្សាទុកអាសយដ្ឋានថ្មីជោគជ័យ!'
          : editingAddressId
          ? 'Address successfully updated!'
          : 'New address successfully saved!'
      );
    }
  };

  const handleDelete = (id: string, name: string) => {
    const updated = deleteAddress(id);
    setAddresses(updated);
    if (onNotify) {
      onNotify(isKm ? `បានលុបអាសយដ្ឋាន "${name}" រួចរាល់` : `Deleted address "${name}"`);
    }
  };

  const handleSetDefaultPickup = (id: string) => {
    const updated = setDefaultPickup(id);
    setAddresses(updated);
    if (onNotify) {
      onNotify(isKm ? 'បានកំណត់ជាទីតាំងមកយកឥវ៉ាន់លំនាំដើម (Default Pickup)' : 'Set as default pickup location');
    }
  };

  const handleSetDefaultDelivery = (id: string) => {
    const updated = setDefaultDelivery(id);
    setAddresses(updated);
    if (onNotify) {
      onNotify(isKm ? 'បានកំណត់ជាទីតាំងទទួលឥវ៉ាន់លំនាំដើម (Default Delivery)' : 'Set as default delivery location');
    }
  };

  const getCategoryIcon = (cat: SavedAddressCategory) => {
    switch (cat) {
      case 'home':
        return <Home className="w-4 h-4 text-blue-600" />;
      case 'store':
        return <Store className="w-4 h-4 text-emerald-600" />;
      case 'warehouse':
        return <Warehouse className="w-4 h-4 text-amber-600" />;
      case 'office':
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      default:
        return <MapPin className="w-4 h-4 text-rose-600" />;
    }
  };

  return (
    <div className={`bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-sm md:text-base">
                {isKm ? 'គ្រប់គ្រងអាសយដ្ឋានរក្សាទុក (Saved Addresses)' : 'Saved Addresses Management'}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {addresses.length} {isKm ? 'ទីតាំង' : 'Locations'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isKm
                ? 'រក្សាទុកទីតាំងផ្ញើ ឬទទួលញឹកញាប់ ដើម្បីបំពេញដោយស្វ័យប្រវត្តក្នុង HomeHubView ដោយមិនបាច់វាយឡើងវិញ'
                : 'Store frequent pickup & delivery locations to instantly autofill shipping quotes in HomeHubView.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{isKm ? 'បន្ថែមអាសយដ្ឋានថ្មី' : 'Add New Address'}</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              addr.isDefaultPickup || addr.isDefaultDelivery
                ? 'bg-slate-50/80 border-slate-300 shadow-2xs ring-1 ring-slate-300/60'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    {getCategoryIcon(addr.category)}
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                    {isKm ? addr.labelKm : addr.label}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                    title={isKm ? 'កែប្រែ' : 'Edit'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id, isKm ? addr.labelKm : addr.label)}
                    className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                    title={isKm ? 'លុប' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  📍 {isKm ? addr.provinceNameKm : addr.provinceName}
                </span>

                {addr.isDefaultPickup && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>{isKm ? 'មកយកលំនាំដើម' : 'Default Pickup'}</span>
                  </span>
                )}

                {addr.isDefaultDelivery && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-2xs flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>{isKm ? 'ទទួលលំនាំដើម' : 'Default Delivery'}</span>
                  </span>
                )}
              </div>

              {/* Detail Address */}
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {addr.detailAddress}
              </p>

              {/* Contact Info */}
              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{addr.contactName}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{addr.contactPhone}</span>
                </span>
              </div>
            </div>

            {/* Default Toggles Buttons */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSetDefaultPickup(addr.id)}
                disabled={addr.isDefaultPickup}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  addr.isDefaultPickup
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 cursor-default'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {addr.isDefaultPickup
                  ? (isKm ? '✓ មកយកលំនាំដើម' : '✓ Default Pickup')
                  : (isKm ? 'ដាក់ជាកន្លែងមកយក' : 'Set as Pickup')}
              </button>

              <button
                type="button"
                onClick={() => handleSetDefaultDelivery(addr.id)}
                disabled={addr.isDefaultDelivery}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  addr.isDefaultDelivery
                    ? 'text-rose-700 bg-rose-50 border border-rose-200 cursor-default'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {addr.isDefaultDelivery
                  ? (isKm ? '✓ ទទួលលំនាំដើម' : '✓ Default Delivery')
                  : (isKm ? 'ដាក់ជាកន្លែងទទួល' : 'Set as Delivery')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reassurance Footer */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isKm
              ? 'អាសយដ្ឋានដែលបានរក្សាទុកនឹងបង្ហាញដោយស្វ័យប្រវត្តក្នុងម៉ាស៊ីនគណនាតម្លៃដឹកជញ្ជូន HomeHubView'
              : 'Saved addresses instantly appear as 1-click presets in HomeHubView shipping calculators!'}
          </span>
        </div>
      </div>

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5 text-rose-500" />
                </div>
                <h4 className="font-black text-slate-900 text-sm sm:text-base">
                  {editingAddressId
                    ? (isKm ? 'កែប្រែអាសយដ្ឋាន' : 'Edit Saved Address')
                    : (isKm ? 'បន្ថែមអាសយដ្ឋានថ្មី' : 'Add New Saved Address')}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              {/* Category */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  {isKm ? 'ប្រភេទទីតាំង (Location Type)' : 'Category'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'home', labelEn: 'Home', labelKm: 'ផ្ទះ', icon: '🏠' },
                    { id: 'store', labelEn: 'Shop', labelKm: 'ហាង', icon: '🏪' },
                    { id: 'warehouse', labelEn: 'Warehouse', labelKm: 'ឃ្លាំង', icon: '🏭' },
                    { id: 'office', labelEn: 'Office', labelKm: 'ការិយាល័យ', icon: '🏢' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id as any)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                        category === c.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span>{isKm ? c.labelKm : c.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKm ? 'ឈ្មោះសម្គាល់ទីតាំង (e.g. ផ្ទះភ្នំពេញ, ហាងលក់)' : 'Address Label'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isKm ? 'ឧ. ផ្ទះផ្ទាល់ខ្លួន (សែនសុខ)' : 'e.g. Home Residence (Sen Sok)'}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Province */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKm ? 'ខេត្ត-ក្រុង (Province / City)' : 'Province / City'}
                </label>
                <select
                  value={provinceId}
                  onChange={(e) => setProvinceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  {CAMBODIA_PROVINCES.map((p) => (
                    <option key={`opt-${p.id}`} value={p.id}>
                      {isKm ? p.nameKm : p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Detail Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isKm ? 'អាសយដ្ឋានលម្អិត (ផ្លូវ, សង្កាត់, ខណ្ឌ/ស្រុក)' : 'Detailed Street Address'}
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder={isKm ? 'ផ្ទះលេខ..., ផ្លូវ..., សង្កាត់..., ខណ្ឌ...' : 'Building #, Street, Sangkat, Khan...'}
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Contact Name & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKm ? 'ឈ្មោះអ្នកទាក់ទង' : 'Contact Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isKm ? 'លេខទូរស័ព្ទ' : 'Contact Phone'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Default Checkboxes */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isDefaultPickupVal}
                    onChange={(e) => setIsDefaultPickupVal(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>{isKm ? 'កំណត់ជាទីតាំងមកយកឥវ៉ាន់លំនាំដើម (Default Pickup)' : 'Set as default pickup location'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isDefaultDeliveryVal}
                    onChange={(e) => setIsDefaultDeliveryVal(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 accent-rose-600"
                  />
                  <span>{isKm ? 'កំណត់ជាទីតាំងទទួលឥវ៉ាន់លំនាំដើម (Default Delivery)' : 'Set as default delivery location'}</span>
                </label>
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-white font-black text-xs transition shadow-xs"
                >
                  {isKm ? 'រក្សាទុកអាសយដ្ឋាន' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
