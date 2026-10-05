import { SavedAddressItem } from '../types';

export const SAVED_ADDRESSES_STORAGE_KEY = 'camdelivery_saved_addresses_v1';
export const SAVED_ADDRESSES_EVENT = 'camdelivery_saved_addresses_updated';

const DEFAULT_SAVED_ADDRESSES: SavedAddressItem[] = [
  {
    id: 'addr-home-sensok',
    label: 'Home Residence (ផ្ទះផ្ទាល់ខ្លួន)',
    labelKm: 'ផ្ទះផ្ទាល់ខ្លួន (សែនសុខ)',
    contactName: 'Chan Visal (ចាន់ វិសាល)',
    contactPhone: '012 345 678',
    provinceId: 'phnom-penh',
    provinceName: 'Phnom Penh',
    provinceNameKm: 'រាជធានីភ្នំពេញ',
    detailAddress: 'House #42, Street 2004, Sangkat Teuk Thla, Khan Sen Sok, Phnom Penh',
    isDefaultPickup: true,
    isDefaultDelivery: false,
    category: 'home',
    createdAt: '2026-08-10',
  },
  {
    id: 'addr-shop-bkk1',
    label: 'BKK1 Retail Store (ហាងលក់បឹងកេងកង)',
    labelKm: 'ហាងលក់ទំនិញ (បឹងកេងកង១)',
    contactName: 'Sokha Boutique Delivery',
    contactPhone: '098 765 432',
    provinceId: 'phnom-penh',
    provinceName: 'Phnom Penh',
    provinceNameKm: 'រាជធានីភ្នំពេញ',
    detailAddress: 'Building 18, Street 282, Sangkat Boeung Keng Kang 1, Khan Chamkarmon',
    isDefaultPickup: false,
    isDefaultDelivery: false,
    category: 'store',
    createdAt: '2026-08-15',
  },
  {
    id: 'addr-sr-hub',
    label: 'Siem Reap Regional Depot (ឃ្លាំងសៀមរាប)',
    labelKm: 'ឃ្លាំងស្តុកឥវ៉ាន់ (សៀមរាប)',
    contactName: 'Kong Sreypov (គង់ ស្រីពៅ)',
    contactPhone: '017 889 900',
    provinceId: 'siem-reap',
    provinceName: 'Siem Reap',
    provinceNameKm: 'ខេត្តសៀមរាប',
    detailAddress: 'National Road 6, Sangkat Svay Dangkum, Krong Siem Reap',
    isDefaultPickup: false,
    isDefaultDelivery: true,
    category: 'warehouse',
    createdAt: '2026-09-01',
  },
  {
    id: 'addr-btb-center',
    label: 'Battambang Central Branch (សាខាបាត់ដំបង)',
    labelKm: 'សាខាកណ្តាល (បាត់ដំបង)',
    contactName: 'Heng Dara (ហេង ដារ៉ា)',
    contactPhone: '085 112 233',
    provinceId: 'battambang',
    provinceName: 'Battambang',
    provinceNameKm: 'ខេត្តបាត់ដំបង',
    detailAddress: 'Street 1, Sangkat Svay Pao, Krong Battambang',
    isDefaultPickup: false,
    isDefaultDelivery: false,
    category: 'office',
    createdAt: '2026-09-12',
  },
];

export function getSavedAddresses(): SavedAddressItem[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(SAVED_ADDRESSES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Error reading saved addresses:', err);
  }

  // Initialize defaults
  saveAddressesToStorage(DEFAULT_SAVED_ADDRESSES);
  return DEFAULT_SAVED_ADDRESSES;
}

export function saveAddressesToStorage(items: SavedAddressItem[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(SAVED_ADDRESSES_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent(SAVED_ADDRESSES_EVENT, { detail: items }));
    }
  } catch (err) {
    console.error('Error saving addresses to localStorage:', err);
  }
}

export function saveAddress(
  item: Omit<SavedAddressItem, 'id' | 'createdAt'>,
  existingId?: string
): SavedAddressItem[] {
  const current = getSavedAddresses();
  let updatedList: SavedAddressItem[];

  if (existingId) {
    updatedList = current.map((addr) => {
      if (addr.id === existingId) {
        return {
          ...addr,
          ...item,
          isDefaultPickup: item.isDefaultPickup,
          isDefaultDelivery: item.isDefaultDelivery,
        };
      }
      return {
        ...addr,
        isDefaultPickup: item.isDefaultPickup ? false : addr.isDefaultPickup,
        isDefaultDelivery: item.isDefaultDelivery ? false : addr.isDefaultDelivery,
      };
    });
  } else {
    const newAddress: SavedAddressItem = {
      ...item,
      id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    updatedList = [
      newAddress,
      ...current.map((addr) => ({
        ...addr,
        isDefaultPickup: item.isDefaultPickup ? false : addr.isDefaultPickup,
        isDefaultDelivery: item.isDefaultDelivery ? false : addr.isDefaultDelivery,
      })),
    ];
  }

  saveAddressesToStorage(updatedList);
  return updatedList;
}

export function deleteAddress(id: string): SavedAddressItem[] {
  const current = getSavedAddresses();
  const updated = current.filter((addr) => addr.id !== id);
  saveAddressesToStorage(updated);
  return updated;
}

export function setDefaultPickup(id: string): SavedAddressItem[] {
  const current = getSavedAddresses();
  const updated = current.map((addr) => ({
    ...addr,
    isDefaultPickup: addr.id === id,
  }));
  saveAddressesToStorage(updated);
  return updated;
}

export function setDefaultDelivery(id: string): SavedAddressItem[] {
  const current = getSavedAddresses();
  const updated = current.map((addr) => ({
    ...addr,
    isDefaultDelivery: addr.id === id,
  }));
  saveAddressesToStorage(updated);
  return updated;
}

export function resetSavedAddresses(): SavedAddressItem[] {
  saveAddressesToStorage(DEFAULT_SAVED_ADDRESSES);
  return DEFAULT_SAVED_ADDRESSES;
}
