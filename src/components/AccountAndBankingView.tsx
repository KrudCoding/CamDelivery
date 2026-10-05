import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  CreditCard, 
  QrCode, 
  Plus, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowDownToLine, 
  ArrowUpRight, 
  ArrowRight,
  Phone, 
  MapPin, 
  Mail, 
  DollarSign, 
  RefreshCw, 
  Car, 
  Store, 
  Truck, 
  Copy, 
  Sparkles, 
  ExternalLink,
  Trash2,
  Lock,
  Wallet,
  AlertCircle,
  FileText,
  FileDown,
  Download,
  Printer,
  Calendar,
  Award,
  FileSpreadsheet,
  Bell,
  Gift,
  Crown
} from 'lucide-react';
import { 
  Language, 
  Currency, 
  UserAccountProfile, 
  BankAccount, 
  BankTransactionRecord,
  AccountRole,
  ProviderServiceCategory,
  MonthlyDeliveryHistoryItem
} from '../types';
import { 
  CAMBODIA_SUPPORTED_BANKS, 
  INITIAL_CUSTOMER_PROFILE, 
  INITIAL_PROVIDER_DRIVER_PROFILE, 
  INITIAL_PROVIDER_MERCHANT_PROFILE,
  INITIAL_TRANSACTION_RECORDS 
} from '../data/accounts';
import { MONTHLY_DELIVERY_HISTORY } from '../data/deliveryHistory';
import { downloadDeliveryHistoryPdf } from '../utils/pdfExport';
import { downloadDeliveryHistoryCsv } from '../utils/csvExport';
import { MonthlyDeliveryCostReport } from './MonthlyDeliveryCostReport';
import { MonthlyDeliveryPdfExportModal } from './MonthlyDeliveryPdfExportModal';
import { FuelCostMonitor } from './FuelCostMonitor';
import { UserLoyaltyProgramCard } from './UserLoyaltyProgramCard';
import { NotificationSettingsSection } from './NotificationSettingsSection';
import { ReferAFriendModal, hasTopRatedSenderBadge } from './ReferAFriendModal';
import { DownloadMyActivityModal } from './DownloadMyActivityModal';
import { SavedAddressesManager } from './SavedAddressesManager';
import { CourierPayoutSettingsSection } from './CourierPayoutSettingsSection';
import { getLoyaltyData, LOYALTY_EVENT } from '../utils/loyaltyService';

interface AccountAndBankingViewProps {
  language: Language;
  currency: Currency;
  onCurrencyChange?: (currency: Currency) => void;
  onNotify: (msg: string) => void;
  onLockProfile?: () => void;
}

export const AccountAndBankingView: React.FC<AccountAndBankingViewProps> = ({
  language,
  currency,
  onCurrencyChange,
  onNotify,
  onLockProfile,
}) => {
  const isKm = language === 'km';

  const handleCurrencyToggle = (targetCurrency: Currency) => {
    if (onCurrencyChange) {
      onCurrencyChange(targetCurrency);
    }
    onNotify(
      targetCurrency === 'KHR'
        ? (isKm ? 'បានប្តូររូបិយប័ណ្ណបង្ហាញទៅជា ៛ KHR (ប្រាក់រៀល) • តម្លៃដឹកជញ្ជូន និងសម្រង់តម្លៃទាំងអស់ត្រូវបានធ្វើបច្ចុប្បន្នភាព' : 'Currency switched to ៛ KHR • Price labels dynamically updated across Courier Compare & Home Hub')
        : (isKm ? 'បានប្តូររូបិយប័ណ្ណបង្ហាញទៅជា $ USD (ដុល្លារ) • តម្លៃដឹកជញ្ជូន និងសម្រង់តម្លៃទាំងអស់ត្រូវបានធ្វើបច្ចុប្បន្នភាព' : 'Currency switched to $ USD • Price labels dynamically updated across Courier Compare & Home Hub')
    );
  };

  // Active Role and Profile state
  const [activeRole, setActiveRole] = useState<AccountRole>('customer');
  const [providerCategory, setProviderCategory] = useState<ProviderServiceCategory>('driver_courier');

  // Customer & Provider profiles state with offline localStorage caching
  const [customerProfile, setCustomerProfile] = useState<UserAccountProfile>(() => {
    try {
      const cached = localStorage.getItem('camdelivery_account_customer');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Error reading customer profile cache:', e);
    }
    return INITIAL_CUSTOMER_PROFILE;
  });

  const [driverProfile, setDriverProfile] = useState<UserAccountProfile>(() => {
    try {
      const cached = localStorage.getItem('camdelivery_account_driver');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Error reading driver profile cache:', e);
    }
    return INITIAL_PROVIDER_DRIVER_PROFILE;
  });

  const [merchantProfile, setMerchantProfile] = useState<UserAccountProfile>(() => {
    try {
      const cached = localStorage.getItem('camdelivery_account_merchant');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Error reading merchant profile cache:', e);
    }
    return INITIAL_PROVIDER_MERCHANT_PROFILE;
  });

  const [transactions, setTransactions] = useState<BankTransactionRecord[]>(() => {
    try {
      const cached = localStorage.getItem('camdelivery_account_transactions');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Error reading transaction cache:', e);
    }
    return INITIAL_TRANSACTION_RECORDS;
  });

  // Sync to offline cache on change
  useEffect(() => {
    try {
      localStorage.setItem('camdelivery_account_customer', JSON.stringify(customerProfile));
    } catch {}
  }, [customerProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('camdelivery_account_driver', JSON.stringify(driverProfile));
    } catch {}
  }, [driverProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('camdelivery_account_merchant', JSON.stringify(merchantProfile));
    } catch {}
  }, [merchantProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('camdelivery_account_transactions', JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  // Active current profile based on role & subcategory
  const currentProfile = activeRole === 'customer' 
    ? customerProfile 
    : providerCategory === 'driver_courier' 
      ? driverProfile 
      : merchantProfile;

  // Modals & UI controls
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedBankForQR, setSelectedBankForQR] = useState<BankAccount | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isDownloadActivityModalOpen, setIsDownloadActivityModalOpen] = useState(false);
  const [isTopRated, setIsTopRated] = useState(hasTopRatedSenderBadge);

  useEffect(() => {
    const handleBadgeUpdate = () => {
      setIsTopRated(hasTopRatedSenderBadge());
    };
    window.addEventListener('camdelivery_badge_updated', handleBadgeUpdate);
    return () => window.removeEventListener('camdelivery_badge_updated', handleBadgeUpdate);
  }, []);

  // Loyalty Program State & Certified Reliable User status
  const [loyaltyState, setLoyaltyState] = useState(getLoyaltyData);

  useEffect(() => {
    const handleLoyaltyChange = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        setLoyaltyState(custom.detail);
      } else {
        setLoyaltyState(getLoyaltyData());
      }
    };
    window.addEventListener(LOYALTY_EVENT, handleLoyaltyChange);
    return () => window.removeEventListener(LOYALTY_EVENT, handleLoyaltyChange);
  }, []);

  // Monthly Delivery History PDF Export State
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false);
  const [pdfExportMonth, setPdfExportMonth] = useState('2026-09');

  // Direct 1-click PDF download helper
  const handleQuickDownloadPdf = (monthKey: string) => {
    try {
      const monthDeliveries = MONTHLY_DELIVERY_HISTORY.filter(d => monthKey === 'all' || d.monthKey === monthKey);
      const monthNames: Record<string, string> = {
        '2026-09': 'September 2026',
        '2026-08': 'August 2026',
        '2026-07': 'July 2026',
        'all': 'All Months (Q3 2026)',
      };
      const fileName = downloadDeliveryHistoryPdf({
        profile: currentProfile,
        monthKey,
        monthName: monthNames[monthKey] || monthKey,
        deliveries: monthDeliveries,
        language,
        currency,
        includeKpiSummary: true,
        includeBankDetails: true,
        includeTaxStamp: true,
      });
      onNotify(
        isKm
          ? `បានទាញយកឯកសារ PDF កំណត់ត្រាដឹកជញ្ជូន "${fileName}" ជោគជ័យ!`
          : `Downloaded monthly delivery PDF statement "${fileName}"!`
      );
    } catch (e) {
      console.error(e);
      onNotify(isKm ? 'មានបញ្ហាក្នុងការទាញយក PDF' : 'Error generating PDF statement');
    }
  };

  const handleQuickDownloadCsv = (monthKey: string = 'all') => {
    try {
      const monthDeliveries = MONTHLY_DELIVERY_HISTORY.filter(
        (d) => monthKey === 'all' || d.monthKey === monthKey
      );
      downloadDeliveryHistoryCsv(monthDeliveries, 'Cambodia-Logistics-Delivery-History', {
        monthKey,
        language,
        currency,
      });
      onNotify(
        isKm
          ? `បានទាញយកប្រវត្តិនៃការដឹកជញ្ជូនជាឯកសារ CSV (${monthDeliveries.length} កំណត់ត្រា) សម្រាប់កត់ត្រាផ្ទាល់ខ្លួន!`
          : `Exported ${monthDeliveries.length} delivery history records as formatted CSV for personal record-keeping!`
      );
    } catch (e) {
      console.error(e);
      onNotify(isKm ? 'មានបញ្ហាក្នុងការទាញយក CSV' : 'Error exporting delivery history as CSV');
    }
  };

  // New Bank Account Form state
  const [newBankCode, setNewBankCode] = useState<'ABA' | 'ACLEDA' | 'WING' | 'CANADIA' | 'SATHAPANA' | 'BAKONG'>('ABA');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState<Currency>('KHR');
  const [newBakongId, setNewBakongId] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);

  // New User Registration Form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserNameKm, setNewUserNameKm] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<AccountRole>('customer');
  const [newUserCategory, setNewUserCategory] = useState<ProviderServiceCategory>('driver_courier');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserCity, setNewUserCity] = useState('Phnom Penh');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    onNotify(isKm ? `បានចម្លង ${label}!` : `Copied ${label}!`);
  };

  // Switch default bank account
  const handleSetDefaultBank = (bankId: string) => {
    const updateBankList = (list: BankAccount[]) =>
      list.map(b => ({
        ...b,
        isDefault: b.id === bankId,
      }));

    if (activeRole === 'customer') {
      setCustomerProfile(prev => ({
        ...prev,
        bankAccounts: updateBankList(prev.bankAccounts),
      }));
    } else if (providerCategory === 'driver_courier') {
      setDriverProfile(prev => ({
        ...prev,
        bankAccounts: updateBankList(prev.bankAccounts),
      }));
    } else {
      setMerchantProfile(prev => ({
        ...prev,
        bankAccounts: updateBankList(prev.bankAccounts),
      }));
    }

    onNotify(isKm ? 'បានកំណត់ជាគណនីធនាគារចម្បងជោគជ័យ' : 'Set as primary bank account');
  };

  // Delete bank account
  const handleDeleteBank = (bankId: string) => {
    if (currentProfile.bankAccounts.length <= 1) {
      onNotify(isKm ? 'អ្នកត្រូវតែមានគណនីធនាគារយ៉ាងតិចមួយសម្រាប់ទូទាត់' : 'You must have at least one active bank account');
      return;
    }

    const removeBankFromList = (list: BankAccount[]) => {
      const filtered = list.filter(b => b.id !== bankId);
      if (filtered.length > 0 && !filtered.some(b => b.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    };

    if (activeRole === 'customer') {
      setCustomerProfile(prev => ({ ...prev, bankAccounts: removeBankFromList(prev.bankAccounts) }));
    } else if (providerCategory === 'driver_courier') {
      setDriverProfile(prev => ({ ...prev, bankAccounts: removeBankFromList(prev.bankAccounts) }));
    } else {
      setMerchantProfile(prev => ({ ...prev, bankAccounts: removeBankFromList(prev.bankAccounts) }));
    }

    onNotify(isKm ? 'បានលុបគណនីធនាគាររួចរាល់' : 'Bank account removed');
  };

  // Add new Bank Account handler
  const handleAddBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountNumber || !newAccountName) {
      onNotify(isKm ? 'សូមបញ្ចូលលេខគណនី និងឈ្មោះម្ចាស់គណនី' : 'Please provide account number and account name');
      return;
    }

    const selectedBankInfo = CAMBODIA_SUPPORTED_BANKS.find(b => b.code === newBankCode)!;
    const generatedId = `bank-acc-${Date.now()}`;

    const newAccount: BankAccount = {
      id: generatedId,
      bankName: selectedBankInfo.nameEn,
      bankNameKm: selectedBankInfo.nameKm,
      bankCode: newBankCode,
      accountNumber: newAccountNumber.trim(),
      accountName: newAccountName.trim().toUpperCase(),
      currency: newAccountCurrency,
      isDefault: newIsDefault || currentProfile.bankAccounts.length === 0,
      bakongAccountId: newBakongId.trim() || `${newAccountNumber.replace(/\D/g, '')}${selectedBankInfo.prefixBakong}`,
      verified: true,
      brandColor: selectedBankInfo.brandColor,
      logoBg: selectedBankInfo.logoBg,
      forRole: activeRole,
    };

    const appendBank = (list: BankAccount[]) => {
      if (newAccount.isDefault) {
        return [...list.map(b => ({ ...b, isDefault: false })), newAccount];
      }
      return [...list, newAccount];
    };

    if (activeRole === 'customer') {
      setCustomerProfile(prev => ({ ...prev, bankAccounts: appendBank(prev.bankAccounts) }));
    } else if (providerCategory === 'driver_courier') {
      setDriverProfile(prev => ({ ...prev, bankAccounts: appendBank(prev.bankAccounts) }));
    } else {
      setMerchantProfile(prev => ({ ...prev, bankAccounts: appendBank(prev.bankAccounts) }));
    }

    // Reset form
    setNewAccountNumber('');
    setNewAccountName('');
    setNewBakongId('');
    setNewIsDefault(false);
    setIsAddBankModalOpen(false);

    onNotify(
      isKm 
        ? `បានភ្ជាប់គណនី ${selectedBankInfo.nameKm} ជោគជ័យ!` 
        : `Connected ${selectedBankInfo.nameEn} successfully!`
    );
  };

  // Provider Instant Payout / Withdrawal
  const handleProviderPayout = () => {
    if (currentProfile.balanceKHR <= 0) {
      onNotify(isKm ? 'សមតុល្យមិនគ្រប់គ្រាន់សម្រាប់ដកប្រាក់' : 'No available balance to withdraw');
      return;
    }

    setIsWithdrawing(true);
    const payoutAmount = currentProfile.balanceKHR;
    const payoutUSD = Number((payoutAmount / 4100).toFixed(2));
    const defaultBank = currentProfile.bankAccounts.find(b => b.isDefault) || currentProfile.bankAccounts[0];

    setTimeout(() => {
      setIsWithdrawing(false);
      const newTx: BankTransactionRecord = {
        id: `tx-payout-${Date.now()}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        description: `Instant Settlement to ${defaultBank.bankName} (0% Fee)`,
        descriptionKm: `ដកប្រាក់ចំណូលផ្ទាល់ទៅ ${defaultBank.bankNameKm} (កាត់ថ្លៃសេវា 0%)`,
        amountKHR: payoutAmount,
        amountUSD: payoutUSD,
        type: 'payout',
        status: 'completed',
        bankName: defaultBank.bankName,
        accountNumber: defaultBank.accountNumber,
        referenceNumber: `PAYOUT-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      setTransactions(prev => [newTx, ...prev]);

      if (providerCategory === 'driver_courier') {
        setDriverProfile(prev => ({
          ...prev,
          balanceKHR: 0,
          balanceUSD: 0,
          pendingPayoutKHR: 0,
        }));
      } else {
        setMerchantProfile(prev => ({
          ...prev,
          balanceKHR: 0,
          balanceUSD: 0,
          pendingPayoutKHR: 0,
        }));
      }

      onNotify(
        isKm 
          ? `ដកប្រាក់ ${payoutAmount.toLocaleString()} ៛ ចូលទៅ ${defaultBank.bankNameKm} ជោគជ័យ (ឥតគិតថ្លៃ 0%)!` 
          : `Withdrew ${payoutAmount.toLocaleString()} KHR to ${defaultBank.bankName} with 0% fees!`
      );
    }, 1500);
  };

  // Handle register new account
  const handleCreateNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserPhone) {
      onNotify(isKm ? 'សូមបំពេញឈ្មោះ និងលេខទូរស័ព្ទ' : 'Please provide name and phone number');
      return;
    }

    const defaultBank: BankAccount = {
      id: `bank-new-${Date.now()}`,
      bankName: 'ABA Bank',
      bankNameKm: 'ធនាគារ អេ ប៊ី អេ (ABA)',
      bankCode: 'ABA',
      accountNumber: '003 ' + Math.floor(100000 + Math.random() * 900000),
      accountName: newUserName.toUpperCase(),
      currency: 'KHR',
      isDefault: true,
      bakongAccountId: `${newUserPhone.replace(/\D/g, '')}@abab`,
      verified: true,
      brandColor: '#004F98',
      logoBg: '#0A3366',
      forRole: newUserRole,
    };

    const newProfile: UserAccountProfile = {
      id: `user-custom-${Date.now()}`,
      role: newUserRole,
      providerCategory: newUserRole === 'provider' ? newUserCategory : undefined,
      name: newUserName,
      nameKm: newUserNameKm || newUserName,
      phone: newUserPhone,
      email: `${newUserName.toLowerCase().replace(/\s+/g, '.') || 'user'}@cambodia.delivery`,
      city: newUserCity,
      cityKm: newUserCity === 'Phnom Penh' ? 'រាជធានីភ្នំពេញ' : newUserCity,
      address: `សង្កាត់ទួលទំពូង, ${newUserCity}`,
      avatarUrl: newUserRole === 'customer' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      nationalIdOrLicense: `KH-ID-${Math.floor(10000000 + Math.random() * 90000000)}`,
      businessOrVehicleTitle: newUserTitle || (newUserRole === 'provider' ? 'Community Courier' : undefined),
      businessOrVehicleTitleKm: newUserTitle || (newUserRole === 'provider' ? 'អ្នកដឹកជញ្ជូនសហគមន៍' : undefined),
      vehiclePlate: newUserRole === 'provider' && newUserCategory === 'driver_courier' ? 'ភ្នំពេញ 1B-2048' : undefined,
      bankAccounts: [defaultBank],
      balanceKHR: newUserRole === 'provider' ? 80000 : 200000,
      balanceUSD: newUserRole === 'provider' ? 19.51 : 48.78,
      pendingPayoutKHR: 0,
      totalTransactions: 1,
      isVerified: true,
      commissionRate: 0,
      memberSince: 'បច្ចុប្បន្ន 2026',
    };

    if (newUserRole === 'customer') {
      setCustomerProfile(newProfile);
      setActiveRole('customer');
    } else if (newUserCategory === 'driver_courier') {
      setDriverProfile(newProfile);
      setActiveRole('provider');
      setProviderCategory('driver_courier');
    } else {
      setMerchantProfile(newProfile);
      setActiveRole('provider');
      setProviderCategory('merchant_food');
    }

    setIsNewAccountModalOpen(false);
    setNewUserName('');
    setNewUserNameKm('');
    setNewUserPhone('');
    setNewUserTitle('');

    onNotify(
      isKm 
        ? `បានបង្កើតគណនី "${newProfile.nameKm}" និងគណនីធនាគារចម្បងជោគជ័យ!` 
        : `Created account "${newProfile.name}" and linked bank account successfully!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Account Role Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Role Switching Tabs */}
        <div className="w-full sm:w-auto flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveRole('customer')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition ${
              activeRole === 'customer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isKm ? 'គណនីអតិថិជន (Customer)' : 'Customer Account'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('provider')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition ${
              activeRole === 'provider'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isKm ? 'គណនីអ្នកផ្តល់សេវា (Provider)' : 'Provider & Supplier'}</span>
          </button>
        </div>

        {/* Right: Actions (PDF Export & Register Account) */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Export Monthly Delivery History PDF button */}
          <button
            type="button"
            onClick={() => {
              setPdfExportMonth('2026-09');
              setIsPdfExportModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            title="Export Monthly Delivery History Statement into PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-200" />
            <span>{isKm ? 'ទាញយក PDF ប្រវត្តិដឹក' : 'Export Monthly PDF'}</span>
            <span className="bg-rose-900/60 text-rose-200 text-[9px] px-1.5 py-0.2 rounded font-mono">
              PDF
            </span>
          </button>

          {/* Biometric Security Lock Button */}
          {onLockProfile && (
            <button
              type="button"
              onClick={onLockProfile}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer shadow-2xs"
              title={isKm ? 'ចាក់សោសុវត្ថិភាពជីវមាត្រ' : 'Lock with Biometrics'}
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>{isKm ? 'ចាក់សោ' : 'Lock'}</span>
            </button>
          )}

          {/* Notification Settings button */}
          <button
            type="button"
            onClick={() => {
              document.getElementById('notification-settings-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-indigo-200 cursor-pointer shadow-2xs"
            title={isKm ? 'ការកំណត់ការជូនដំណឹង Push Notifications' : 'Configure Milestone Push Notifications'}
          >
            <Bell className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isKm ? 'ការកំណត់ដំណឹង' : 'Notification Settings'}</span>
          </button>

          {/* Refer a Friend Button */}
          <button
            type="button"
            onClick={() => setIsReferModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            title={isKm ? 'ណែនាំមិត្តភក្តិ & ទទួលមេដាយអ្នកផ្ញើឆ្នើម' : 'Refer a Friend & Earn Top-Rated Sender Badge'}
          >
            <Gift className="w-3.5 h-3.5 text-slate-950" />
            <span>{isKm ? 'ណែនាំមិត្តភក្តិ' : 'Refer a Friend'}</span>
            <span className="bg-slate-950 text-amber-300 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              Badge
            </span>
          </button>

          {/* Download My Activity Button */}
          <button
            type="button"
            onClick={() => setIsDownloadActivityModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            title={isKm ? 'ទាញយកប្រវត្តិសកម្មភាពដឹកជញ្ជូន (CSV / PDF)' : 'Download My Activity (CSV / PDF)'}
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>{isKm ? 'ទាញយកសកម្មភាព' : 'Download Activity'}</span>
          </button>

          {/* Jump to Saved Addresses Button */}
          <button
            type="button"
            onClick={() => {
              document.getElementById('saved-addresses-management-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title={isKm ? 'គ្រប់គ្រងអាសយដ្ឋានរក្សាទុក' : 'Manage Saved Addresses'}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>{isKm ? 'អាសយដ្ឋាន' : 'Saved Addresses'}</span>
          </button>

          {/* Payout Settings Button */}
          <button
            type="button"
            onClick={() => {
              document.getElementById('payout-settings-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title={isKm ? 'ការកំណត់ការទូទាត់ប្រាក់ចំណូល (ABA / Wing)' : 'Configure Partner Payout Settings (ABA / Wing)'}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKm ? 'ការទូទាត់ចំណូល' : 'Payout Settings'}</span>
            <span className="bg-emerald-950 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              0%
            </span>
          </button>

          {/* Register New Account Button */}
          <button
            type="button"
            onClick={() => setIsNewAccountModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isKm ? 'បង្កើតគណនីថ្មី' : 'Register Account'}</span>
          </button>
        </div>
      </div>

      {/* Offline Storage Status Indicator */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[11px] font-medium text-emerald-950">
            {isKm
              ? 'ទិន្នន័យគណនី និងធនាគារទាំងអស់ត្រូវបានរក្សាទុកក្នុងទូរស័ព្ទ/កុំព្យូទ័រ (មើលបានទោះបីគ្មានអ៊ីនធឺណិត)'
              : 'Account profiles & linked banks are stored in local cache and viewable offline'}
          </span>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 shrink-0">
          Offline Cached
        </span>
      </div>

      {/* Provider Subcategory Selector (If Provider role is active) */}
      {activeRole === 'provider' && (
        <div className="bg-emerald-900 text-white p-3.5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-semibold text-emerald-100">
              {isKm 
                ? 'ជ្រើសរើសប្រភេទដៃគូផ្គត់ផ្គង់ ឬផ្តល់សេវា (0% កាត់កម្រៃជើងសារ)' 
                : 'Select Provider Category (0% Commission Guaranteed):'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setProviderCategory('driver_courier')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                providerCategory === 'driver_courier'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{isKm ? 'អ្នកបើកបរកង់បី & ម៉ូតូឌុប' : 'TukTuk & Moto Driver'}</span>
            </button>

            <button
              type="button"
              onClick={() => setProviderCategory('merchant_food')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                providerCategory === 'merchant_food'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{isKm ? 'អាជីវករហាងម្ហូប & កសិផល' : 'Food & Farm Merchant'}</span>
            </button>

            <button
              type="button"
              onClick={() => setProviderCategory('fleet_logistics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                providerCategory === 'fleet_logistics'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{isKm ? 'ដៃគូរថយន្តវ៉ែនអន្តរខេត្ត' : 'Interprovincial Van Fleet'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Account Profile Card */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentProfile.avatarUrl}
                alt={currentProfile.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 shadow-xs" title="Verified Account">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg md:text-xl font-black text-slate-900">
                  {isKm ? currentProfile.nameKm : currentProfile.name}
                </h2>
                {loyaltyState.isCertifiedReliableUser && (
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-xs ring-1 ring-amber-400/50" title="Certified Reliable User Status Active">
                    <Award className="w-3 h-3 text-slate-950" />
                    <span>{isKm ? 'អ្នកប្រើប្រាស់គួរឲ្យទុកចិត្តបានបញ្ជាក់' : 'Certified Reliable User'}</span>
                  </span>
                )}
                {/* Top-Rated Sender Badge (Rewarding Friend Referrals) */}
                {isTopRated ? (
                  <button
                    type="button"
                    onClick={() => setIsReferModalOpen(true)}
                    className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:scale-105 active:scale-95 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm ring-1 ring-amber-400 cursor-pointer transition"
                    title={isKm ? 'អ្នកផ្ញើឆ្នើមលំដាប់កំពូល (ចុចដើម្បីមើល ឬចែករំលែក)' : 'Top-Rated Sender Badge (Click to share & view perks)'}
                  >
                    <Crown className="w-3 h-3 text-slate-950 fill-current" />
                    <span>{isKm ? 'អ្នកផ្ញើឆ្នើមលំដាប់កំពូល' : 'Top-Rated Sender'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsReferModalOpen(true)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 cursor-pointer transition"
                    title={isKm ? 'ណែនាំមិត្តភក្តិដើម្បីដោះសោមេដាយអ្នកផ្ញើឆ្នើម' : 'Refer a friend to unlock Top-Rated Sender badge'}
                  >
                    <Gift className="w-3 h-3 text-amber-600" />
                    <span>{isKm ? '+ ដោះសោមេដាយអ្នកផ្ញើឆ្នើម' : '+ Unlock Top Sender'}</span>
                  </button>
                )}
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{isKm ? (activeRole === 'customer' ? 'គណនីអតិថិជនផ្ទៀងផ្ទាត់' : 'ដៃគូផ្តល់សេវាផ្ទៀងផ្ទាត់') : 'Verified Account'}</span>
                </span>
                {activeRole === 'provider' && (
                  <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full">
                    {isKm ? 'កាត់ថ្លៃសេវា 0%' : '0% Platform Fee'}
                  </span>
                )}
              </div>

              {currentProfile.businessOrVehicleTitle && (
                <p className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                  {activeRole === 'provider' && providerCategory === 'driver_courier' ? <Car className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                  <span>{isKm ? currentProfile.businessOrVehicleTitleKm : currentProfile.businessOrVehicleTitle}</span>
                  {currentProfile.vehiclePlate && (
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded border border-slate-300 font-mono">
                      {currentProfile.vehiclePlate}
                    </span>
                  )}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{currentProfile.phone}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>{isKm ? currentProfile.cityKm : currentProfile.city}</span>
                </span>
                <span>•</span>
                <span className="text-slate-400">
                  {isKm ? `សមាជិកតាំងពី៖ ${currentProfile.memberSince}` : `Member since: ${currentProfile.memberSince}`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats & Balance Box with Quick Currency Switcher */}
          <div className="w-full md:w-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between md:justify-end gap-4 sm:gap-6">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {activeRole === 'customer' 
                  ? (isKm ? 'សមតុល្យកាបូប / Wallet' : 'Wallet Balance') 
                  : (isKm ? 'ប្រាក់ចំណូលត្រៀមដក / Payout' : 'Settlement Revenue')}
              </span>
              <div className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
                {currency === 'KHR' 
                  ? `${currentProfile.balanceKHR.toLocaleString()} ៛` 
                  : `$${currentProfile.balanceUSD.toFixed(2)}`}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block">
                {activeRole === 'customer' 
                  ? (isKm ? 'អាចទូទាត់ភ្លាមៗ' : 'Ready for payment') 
                  : (isKm ? 'គ្មានកាត់កម្រៃជើងសារ 0%' : '100% direct to you')}
              </span>
            </div>

            {/* Quick Currency Switcher Pill in Balance Box */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {isKm ? 'រូបិយប័ណ្ណ' : 'Currency'}
              </span>
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300 text-xs font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleCurrencyToggle('KHR')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-black ${
                    currency === 'KHR'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={isKm ? 'ប្តូរទៅប្រាក់រៀល (៛ KHR)' : 'Switch to Cambodian Riel (៛ KHR)'}
                >
                  ៛ KHR
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencyToggle('USD')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs font-black ${
                    currency === 'USD'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={isKm ? 'ប្តូរទៅប្រាក់ដុល្លារ ($ USD)' : 'Switch to US Dollars ($ USD)'}
                >
                  $ USD
                </button>
              </div>
            </div>

            {activeRole === 'provider' && (
              <button
                type="button"
                disabled={isWithdrawing || currentProfile.balanceKHR <= 0}
                onClick={handleProviderPayout}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
              >
                {isWithdrawing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isKm ? 'កំពុងផ្ទេរ...' : 'Transferring...'}</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>{isKm ? 'ដកប្រាក់ចំណូល' : 'Instant Payout'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Address and ID Information */}
        <div className="mt-4 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium">{currentProfile.address}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Lock className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-mono">
              ID: {currentProfile.nationalIdOrLicense}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: GLOBAL DISPLAY CURRENCY SWITCHER (KHR / USD) */}
      <div id="currency-switcher-section" className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-500 to-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-rose-950/20 shrink-0">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-slate-900">
                  {isKm ? 'រូបិយប័ណ្ណបង្ហាញតម្លៃទូទាំងកម្មវិធី (Global Display Currency)' : 'Global Display Currency Switcher'}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  currency === 'KHR'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {currency === 'KHR' ? '៛ KHR Active' : '$ USD Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isKm
                  ? 'ប្តូររវាងប្រាក់រៀល (៛ KHR) និងប្រាក់ដុល្លារ ($ USD) • ធ្វើបច្ចុប្បន្នភាពតម្លៃដឹកជញ្ជូនក្នុង HomeHubView និង CourierCompareView ភ្លាមៗ'
                  : 'Toggle between Cambodian Riel (៛ KHR) and US Dollar ($ USD) • Dynamically updates all courier quotes and price tags across the app'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 self-start sm:self-auto">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{isKm ? 'អត្រាប្តូរប្រាក់គោល' : 'Benchmark Rate'}</span>
            <span className="font-bold text-slate-800">1 USD = 4,100 KHR (NBC)</span>
          </div>
        </div>

        {/* Currency Switcher Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* KHR Button */}
          <button
            type="button"
            onClick={() => handleCurrencyToggle('KHR')}
            className={`p-4 rounded-2xl border-2 transition text-left flex items-center justify-between cursor-pointer group ${
              currency === 'KHR'
                ? 'bg-rose-50/80 border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl transition ${
                currency === 'KHR'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
              }`}>
                ៛
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900">
                    {isKm ? 'ប្រាក់រៀលខ្មែរ (KHR)' : 'Cambodian Riel (KHR)'}
                  </span>
                  <span className="text-base leading-none">🇰🇭</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isKm ? 'រូបិយវត្ថុជាតិកម្ពុជា • គ្មានកន្ទុយសេន' : 'Official national currency • Standard rounded Riel'}
                </p>
              </div>
            </div>
            {currency === 'KHR' && (
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* USD Button */}
          <button
            type="button"
            onClick={() => handleCurrencyToggle('USD')}
            className={`p-4 rounded-2xl border-2 transition text-left flex items-center justify-between cursor-pointer group ${
              currency === 'USD'
                ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl transition ${
                currency === 'USD'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
              }`}>
                $
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900">
                    {isKm ? 'ប្រាក់ដុល្លារអាមេរិក (USD)' : 'US Dollar (USD)'}
                  </span>
                  <span className="text-base leading-none">💵</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isKm ? 'ប្រើប្រាស់ទូទៅក្នុងការទូទាត់អន្តរជាតិ' : 'Standard cross-border commercial currency'}
                </p>
              </div>
            </div>
            {currency === 'USD' && (
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>
        </div>

        {/* Sync notification strip */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
            <span className="font-medium">
              {isKm
                ? `តម្លៃសេវាដឹកជញ្ជូនក្នុង HomeHubView និង CourierCompareView កំពុងបង្ហាញជា ${currency === 'KHR' ? '៛ ប្រាក់រៀល' : '$ ដុល្លារ'}`
                : `Active pricing format in HomeHubView and CourierCompareView: ${currency}`}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            {currency === 'KHR' ? 'Format: #,### ៛' : 'Format: $#.##'}
          </span>
        </div>
      </div>

      {/* SECTION: DELIVERY POINTS LOYALTY PROGRAM & CERTIFIED RELIABLE USER PROGRESS */}
      <UserLoyaltyProgramCard
        language={language}
        currency={currency}
        onNotify={onNotify}
      />

      {/* SECTION: FUEL COST MONITOR & DAILY PROFITABILITY FOR DELIVERY PARTNERS */}
      <FuelCostMonitor
        language={language}
        currency={currency}
        onNotify={onNotify}
        partnerBalanceKHR={currentProfile.balanceKHR}
      />

      {/* SECTION: COURIER PARTNER PAYOUT SETTINGS (ABA / WING & 0% COMMISSION PROMISE) */}
      <CourierPayoutSettingsSection
        language={language}
        currency={currency}
        onNotify={onNotify}
      />

      {/* SECTION: BANK ACCOUNTS FOR PAYMENT & SETTLEMENT */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>
                {activeRole === 'customer'
                  ? (isKm ? 'គណនីធនាគារអតិថិជនសម្រាប់ទូទាត់' : 'Customer Payment Bank Accounts')
                  : (isKm ? 'គណនីធនាគារអ្នកផ្តល់សេវាសម្រាប់ទទួលប្រាក់ចំណូល' : 'Provider Settlement Bank Accounts')}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {activeRole === 'customer'
                ? (isKm ? 'ភ្ជាប់គណនី ABA, ACLEDA, Wing ឬបាគង KHQR សម្រាប់ទូទាត់រហ័ស ឬទទួលប្រាក់ត្រឡប់មកវិញ' : 'Link ABA, ACLEDA, Wing or Bakong KHQR for seamless checkout & refunds')
                : (isKm ? 'ប្រាក់ចំណូលពីអតិថិជននឹងត្រូវទូទាត់ចូលគណនីចម្បងនេះផ្ទាល់ ដោយមិនកាត់កម្រៃជើងសារ 0%' : 'Customer payments settle directly into this primary bank account with zero deductions')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddBankModalOpen(true)}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isKm ? 'បន្ថែមគណនីធនាគារ' : 'Add Bank Account'}</span>
          </button>
        </div>

        {/* Bank Account Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentProfile.bankAccounts.map((bank) => (
            <div
              key={bank.id}
              className={`rounded-2xl p-4 border transition relative overflow-hidden flex flex-col justify-between shadow-xs ${
                bank.isDefault
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Primary badge */}
              {bank.isDefault && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{isKm ? 'គណនីចម្បង' : 'Primary'}</span>
                </div>
              )}

              <div>
                {/* Bank Header & Brand */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                    style={{ backgroundColor: bank.brandColor }}
                  >
                    {bank.bankCode}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {isKm ? bank.bankNameKm : bank.bankName}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {bank.currency === 'KHR' ? 'ប្រាក់រៀល (KHR)' : 'ប្រាក់ដុល្លារ (USD)'}
                    </span>
                  </div>
                </div>

                {/* Account Number & Name */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {isKm ? 'លេខគណនីធនាគារ' : 'Account Number'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bank.accountNumber, bank.bankName)}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5"
                    >
                      {copiedText === bank.bankName ? (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          <span>{isKm ? 'បានចម្លង' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>{isKm ? 'ចម្លង' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm font-black text-slate-800 tracking-wider">
                    {bank.accountNumber}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 truncate uppercase">
                    {bank.accountName}
                  </div>
                </div>

                {/* Bakong Account ID if available */}
                {bank.bakongAccountId && (
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Bakong ID:</span>
                    <span className="font-mono text-slate-700 font-semibold">{bank.bakongAccountId}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Set Default, View QR, Delete */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBankForQR(bank);
                    setIsQRModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                  title="Show Bakong KHQR for this bank"
                >
                  <QrCode className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isKm ? 'កូដ QR' : 'View QR'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {!bank.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultBank(bank.id)}
                      className="px-2.5 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition"
                    >
                      {isKm ? 'ដាក់ជាចម្បង' : 'Set Primary'}
                    </button>
                  )}

                  {currentProfile.bankAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBank(bank.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove bank account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: SAVED ADDRESSES MANAGEMENT */}
      <div id="saved-addresses-management-section">
        <SavedAddressesManager
          language={language}
          onNotify={onNotify}
        />
      </div>

      {/* SECTION: MILESTONE PUSH NOTIFICATION SETTINGS */}
      <div id="notification-settings-section">
        <NotificationSettingsSection
          language={language}
          onNotify={onNotify}
        />
      </div>

      {/* SECTION: OFFICIAL MERCHANT / DRIVER BAKONG KHQR STAND */}
      {activeRole === 'provider' && (
        <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-rose-700/60 border border-rose-500/40 text-rose-200 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5 text-white" />
              <span>{isKm ? 'ផ្ទាំង Bakong KHQR ផ្លូវការសម្រាប់ទទួលប្រាក់' : 'Official Bakong KHQR Merchant Stand'}</span>
            </div>

            <h3 className="text-lg md:text-xl font-black">
              {isKm ? 'ទទួលប្រាក់ពីអតិថិជនផ្ទាល់ដោយឥតគិតថ្លៃ ១០០%' : 'Accept Customer Payments with Zero Deduction'}
            </h3>
            <p className="text-xs text-rose-100 leading-relaxed">
              {isKm
                ? 'អតិថិជនអាចស្កេនទូទាត់ប្រាក់ពីគ្រប់ធនាគារក្នុងស្រុក (ABA, អេស៊ីលីដា, វីង, កាណាឌីយ៉ា...) តាមរយៈប្រព័ន្ធបាគងជាតិ។ ប្រាក់ចំណូលនឹងចូលត្រង់ទៅគណនីធនាគាររបស់អ្នកភ្លាមៗ។'
                : 'Customers can scan and pay from any Cambodian mobile banking app via Bakong KHQR. Revenue is settled directly to your registered bank account.'}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedBankForQR(currentProfile.bankAccounts[0]);
                  setIsQRModalOpen(true);
                }}
                className="px-4 py-2 bg-white text-rose-900 hover:bg-rose-50 font-black text-xs rounded-xl shadow-sm transition flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-rose-600" />
                <span>{isKm ? 'បង្ហាញផ្ទាំង KHQR ពេញលេញ' : 'Display Stand QR'}</span>
              </button>
            </div>
          </div>

          {/* Mini QR Illustration */}
          <div className="bg-white p-3 rounded-2xl shadow-xl text-slate-900 flex flex-col items-center shrink-0 w-44 text-center">
            <div className="w-full bg-rose-600 text-white font-black text-[10px] py-1 rounded-md mb-2 uppercase tracking-wider">
              KHQR • BAKONG
            </div>
            <div className="w-28 h-28 bg-slate-950 p-2 rounded-xl flex items-center justify-center">
              <QrCode className="w-full h-full text-white" />
            </div>
            <span className="text-[11px] font-black text-slate-800 mt-2 truncate w-full">
              {isKm ? currentProfile.nameKm : currentProfile.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {currentProfile.bankAccounts[0]?.accountNumber}
            </span>
          </div>
        </div>
      )}

      {/* SECTION: REFER A FRIEND & TOP-RATED SENDER REWARD CARD */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 rounded-3xl p-5 sm:p-6 text-slate-950 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-slate-950 text-amber-300 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>{isKm ? 'កម្មវិធីណែនាំមិត្តភក្តិ • ទទួលមេដាយកិត្តិយស' : 'Friend Referral Program • Exclusive Badge'}</span>
          </div>

          <h3 className="text-lg md:text-xl font-black text-slate-950">
            {isKm ? 'ណែនាំមិត្តភក្តិ & ទទួលផ្លាកសញ្ញា "អ្នកផ្ញើឆ្នើមលំដាប់កំពូល"' : 'Refer a Friend & Earn "Top-Rated Sender" Badge'}
          </h3>

          <p className="text-xs text-amber-950/90 leading-relaxed font-medium">
            {isKm
              ? 'ចែករំលែកតំណភ្ជាប់ណែនាំរបស់អ្នកទៅកាន់ Telegram, Facebook ឬ WhatsApp។ ជួយមិត្តភក្តិផ្ញើឥវ៉ាន់ ២៥ ខេត្ត-ក្រុង គ្មានកម្រៃជើងសារ 0% និងដោះសោផ្លាកសញ្ញាអ្នកផ្ញើឆ្នើមលំដាប់កំពូល +១០០ ពិន្ទុ!'
              : 'Share your unique referral link to friends on social media. Help them ship parcels with 0% middleman fees and get rewarded with the prestigious Top-Rated Sender badge + 100 points!'}
          </p>

          <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-extrabold bg-white/30 backdrop-blur-xs px-2.5 py-1 rounded-xl text-slate-950 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-slate-950 fill-current" />
              <span>{isKm ? 'មេដាយកំពូល (Top-Rated Sender)' : 'Top-Rated Sender Badge'}</span>
            </span>
            <span className="font-extrabold bg-white/30 backdrop-blur-xs px-2.5 py-1 rounded-xl text-slate-950">
              {isKm ? '+១០០ ពិន្ទុភាពស្មោះត្រង់' : '+100 Loyalty Points'}
            </span>
          </div>
        </div>

        <div className="relative z-10 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsReferModalOpen(true)}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-95 text-white font-black text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>{isKm ? 'បង្កើតតំណភ្ជាប់ & ទទួលមេដាយ' : 'Generate Link & Get Badge'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION: MONTHLY DELIVERY COST & SPENDING REPORT WITH CHARTS */}
      <MonthlyDeliveryCostReport
        language={language}
        currency={currency}
        onNotify={onNotify}
        onOpenPdfExport={(m) => {
          setPdfExportMonth(m);
          setIsPdfExportModalOpen(true);
        }}
      />

      {/* SECTION: MONTHLY DELIVERY HISTORY & PERSONAL RECORD-KEEPING (PDF EXPORT) */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-slate-900">
                {isKm
                  ? 'ប្រវត្តិដឹកជញ្ជូនប្រចាំខែ & កំណត់ត្រាផ្ទាល់ខ្លួន (PDF Documents)'
                  : 'Monthly Delivery History & Personal Record-Keeping'}
              </h3>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                {isKm ? 'ទាញយក PDF' : 'PDF Export'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isKm
                ? 'ទាញយករបាយការណ៍ប័ណ្ណដឹកជញ្ជូន និងថ្លៃសេវាជាឯកសារ PDF ផ្លូវការសម្រាប់ផ្ទៀងផ្ទាត់ការចំណាយ និងគណនេយ្យផ្ទាល់ខ្លួន'
                : 'Export itemized delivery logs, shipping expenditures, and COD audits directly into PDF documents for tax and personal records'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {/* Download My Activity (CSV or PDF) */}
            <button
              type="button"
              onClick={() => setIsDownloadActivityModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>{isKm ? 'ទាញយកប្រវត្តិសកម្មភាព (CSV / PDF)' : 'Download My Activity (CSV / PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPdfExportMonth('2026-09');
                setIsPdfExportModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-300 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>{isKm ? 'ប័ណ្ណសង្ខេប PDF' : 'PDF Statement'}</span>
            </button>
          </div>
        </div>

        {/* Quick Month-by-Month Statement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* September 2026 (Current) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 via-white to-slate-50 border border-rose-200/90 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>{isKm ? 'កញ្ញា ២០២៦ (ខែនេះ)' : 'September 2026'}</span>
              </span>
              <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                {isKm ? 'បច្ចុប្បន្ន' : 'Current'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{isKm ? 'ចំនួនកញ្ចប់ដឹកជញ្ជូន' : 'Total Shipments'}:</span>
                <span className="font-black text-slate-900">8 {isKm ? 'កញ្ចប់' : 'Parcels'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{isKm ? 'ចំណាយថ្លៃដឹកជញ្ជូន' : 'Shipping Spent'}:</span>
                <span className="font-black text-rose-700">
                  {currency === 'KHR' ? '85,500 ៛' : '$21.38'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{isKm ? 'ប្រាក់ប្រមូល COD' : 'COD Collected'}:</span>
                <span className="font-black text-emerald-700">
                  {currency === 'KHR' ? '1,350,000 ៛' : '$337.50'}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDownloadPdf('2026-09')}
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                title="Directly download September 2026 PDF"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDownloadCsv('2026-09')}
                className="py-2 px-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                title={isKm ? 'ទាញយកឯកសារ CSV សម្រាប់ Excel' : 'Export CSV for Excel/Spreadsheets'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPdfExportMonth('2026-09');
                  setIsPdfExportModalOpen(true);
                }}
                className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                title="Preview Statement"
              >
                {isKm ? 'មើល' : 'Preview'}
              </button>
            </div>
          </div>

          {/* August 2026 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{isKm ? 'សីហា ២០២៦' : 'August 2026'}</span>
              </span>
              <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                {isKm ? 'បានបិទបញ្ជី' : 'Archived'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{isKm ? 'ចំនួនកញ្ចប់ដឹកជញ្ជូន' : 'Total Shipments'}:</span>
                <span className="font-black text-slate-900">3 {isKm ? 'កញ្ចប់' : 'Parcels'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{isKm ? 'ចំណាយថ្លៃដឹកជញ្ជូន' : 'Shipping Spent'}:</span>
                <span className="font-black text-rose-700">
                  {currency === 'KHR' ? '40,000 ៛' : '$10.00'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{isKm ? 'ប្រាក់ប្រមូល COD' : 'COD Collected'}:</span>
                <span className="font-black text-emerald-700">
                  {currency === 'KHR' ? '495,000 ៛' : '$123.75'}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDownloadPdf('2026-08')}
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                title="Directly download August 2026 PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDownloadCsv('2026-08')}
                className="py-2 px-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                title={isKm ? 'ទាញយកឯកសារ CSV សម្រាប់ Excel' : 'Export CSV for Excel/Spreadsheets'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPdfExportMonth('2026-08');
                  setIsPdfExportModalOpen(true);
                }}
                className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
              >
                {isKm ? 'មើល' : 'Preview'}
              </button>
            </div>
          </div>

          {/* July 2026 */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{isKm ? 'កក្កដា ២០២៦' : 'July 2026'}</span>
              </span>
              <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                {isKm ? 'បានបិទបញ្ជី' : 'Archived'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>{isKm ? 'ចំនួនកញ្ចប់ដឹកជញ្ជូន' : 'Total Shipments'}:</span>
                <span className="font-black text-slate-900">2 {isKm ? 'កញ្ចប់' : 'Parcels'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{isKm ? 'ចំណាយថ្លៃដឹកជញ្ជូន' : 'Shipping Spent'}:</span>
                <span className="font-black text-rose-700">
                  {currency === 'KHR' ? '18,000 ៛' : '$4.50'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{isKm ? 'ប្រាក់ប្រមូល COD' : 'COD Collected'}:</span>
                <span className="font-black text-emerald-700">
                  {currency === 'KHR' ? '195,000 ៛' : '$48.75'}
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDownloadPdf('2026-07')}
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                title="Directly download July 2026 PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDownloadCsv('2026-07')}
                className="py-2 px-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                title={isKm ? 'ទាញយកឯកសារ CSV សម្រាប់ Excel' : 'Export CSV for Excel/Spreadsheets'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPdfExportMonth('2026-07');
                  setIsPdfExportModalOpen(true);
                }}
                className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
              >
                {isKm ? 'មើល' : 'Preview'}
              </button>
            </div>
          </div>
        </div>

        {/* Itemized Recent Shipments Table */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isKm ? 'ប័ណ្ណដឹកជញ្ជូនថ្មីៗ (បញ្ជាក់ការចំណាយ)' : 'Recent Itemized Waybills for Personal Audit'}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickDownloadCsv('all')}
                className="py-1.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5 text-xs shadow-2xs transition"
                title={isKm ? 'ទាញយកប្រវត្តិនៃការដឹកជញ្ជូនទាំងអស់ជា CSV' : 'Export all delivery history as CSV for personal record-keeping'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isKm ? 'ទាញយក CSV (Personal Records)' : 'Export CSV (Personal Records)'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPdfExportMonth('all');
                  setIsPdfExportModalOpen(true);
                }}
                className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 text-[11px]"
              >
                <span>{isKm ? 'ទាញយករបាយការណ៍ទាំងអស់ (Q3 PDF)' : 'Export Full Q3 PDF'}</span>
                <span>➔</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-2.5">{isKm ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                  <th className="p-2.5">{isKm ? 'លេខប័ណ្ណ / Waybill' : 'Waybill #'}</th>
                  <th className="p-2.5">{isKm ? 'ក្រុមហ៊ុនដឹក' : 'Carrier'}</th>
                  <th className="p-2.5">{isKm ? 'ផ្លូវដឹកជញ្ជូន' : 'Route'}</th>
                  <th className="p-2.5">{isKm ? 'ប្រភេទទំនិញ' : 'Item Category'}</th>
                  <th className="p-2.5 text-right">{isKm ? 'ថ្លៃដឹក' : 'Shipping Fee'}</th>
                  <th className="p-2.5 text-center">{isKm ? 'ស្ថានភាព' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-[11px]">
                {MONTHLY_DELIVERY_HISTORY.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                      {item.date.slice(0, 10)}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.trackingNumber}
                    </td>
                    <td className="p-2.5 text-slate-700 whitespace-nowrap">
                      {isKm ? item.carrierNameKm.split('(')[0] : item.carrierName.split('(')[0]}
                    </td>
                    <td className="p-2.5 text-slate-600 whitespace-nowrap">
                      {isKm ? item.originKm : item.origin} ➔ {isKm ? item.destinationKm.split('(')[0] : item.destination.split('(')[0]}
                    </td>
                    <td className="p-2.5 text-slate-600 truncate max-w-[140px]">
                      {isKm ? item.packageTypeKm : item.packageType}
                    </td>
                    <td className="p-2.5 text-right font-black text-rose-700 whitespace-nowrap">
                      {currency === 'KHR'
                        ? `${item.shippingFeeKHR.toLocaleString()} ៛`
                        : `$${item.shippingFeeUSD.toFixed(2)}`}
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status === 'delivered'
                          ? (isKm ? 'ជោគជ័យ' : 'Delivered')
                          : (isKm ? 'កំពុងដឹក' : 'In-Transit')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION: RECENT BANK TRANSACTIONS & SETTLEMENT LOGS */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <span>{isKm ? 'ប្រវត្តិប្រតិបត្តិការទូទាត់ និងដកប្រាក់' : 'Recent Bank Transaction Records'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isKm ? 'បញ្ជីទូទាត់សេវា និងការផ្ទេរប្រាក់ចំណូលតាមប្រព័ន្ធធនាគារក្នុងស្រុក' : 'Audit logs of digital payments and instant bank settlements'}
            </p>
          </div>

          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-lg">
            {transactions.length} {isKm ? 'កំណត់ត្រា' : 'records'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.map((tx) => {
            const isPayment = tx.type === 'payment';
            return (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      isPayment 
                        ? 'bg-rose-50 text-rose-600' 
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {isPayment ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownToLine className="w-4 h-4" />}
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 text-xs md:text-sm">
                      {isKm ? tx.descriptionKm : tx.description}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-600 font-medium">{tx.referenceNumber}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">{tx.bankName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-black text-xs md:text-sm ${
                      isPayment ? 'text-slate-900' : 'text-emerald-700'
                    }`}
                  >
                    {isPayment ? '-' : '+'}
                    {currency === 'KHR'
                      ? `${tx.amountKHR.toLocaleString()} ៛`
                      : `$${tx.amountUSD.toFixed(2)}`}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                    {isKm ? 'ជោគជ័យ' : 'Completed'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: ADD NEW BANK ACCOUNT */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>{isKm ? 'ភ្ជាប់គណនីធនាគារថ្មី' : 'Add Bank Account'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isKm 
                    ? `សម្រាប់ ${activeRole === 'customer' ? 'អតិថិជនទូទាត់' : 'អ្នកផ្តល់សេវាទទួលប្រាក់'}`
                    : `For ${activeRole === 'customer' ? 'Customer Payment' : 'Provider Settlement'}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddBankModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBankAccount} className="space-y-4">
              {/* Bank selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {isKm ? 'ជ្រើសរើសធនាគារក្នុងស្រុក' : 'Select Cambodian Bank'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CAMBODIA_SUPPORTED_BANKS.map((b) => (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => setNewBankCode(b.code)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                        newBankCode === b.code
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0"
                        style={{ backgroundColor: b.brandColor }}
                      >
                        {b.code.slice(0, 3)}
                      </div>
                      <span className="font-bold text-xs text-slate-800 truncate">
                        {b.nameEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Number input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isKm ? 'លេខគណនីធនាគារ (Account Number)' : 'Bank Account Number'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={CAMBODIA_SUPPORTED_BANKS.find(b => b.code === newBankCode)?.formatExample}
                  value={newAccountNumber}
                  onChange={(e) => setNewAccountNumber(e.target.value)}
                  className="w-full text-xs md:text-sm font-mono font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isKm ? 'ឈ្មោះម្ចាស់គណនី (Account Holder Name)' : 'Account Holder Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOK CHANRA"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full text-xs md:text-sm font-semibold uppercase border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Currency & Bakong ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isKm ? 'រូបិយប័ណ្ណគណនី' : 'Currency'}
                  </label>
                  <select
                    value={newAccountCurrency}
                    onChange={(e) => setNewAccountCurrency(e.target.value as Currency)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="KHR">ប្រាក់រៀល (៛ KHR)</option>
                    <option value="USD">ដុល្លារអាមេរិក ($ USD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isKm ? 'គណនីបាគង (Bakong ID - ស្រេចចិត្ត)' : 'Bakong Account ID (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. username@abab"
                    value={newBakongId}
                    onChange={(e) => setNewBakongId(e.target.value)}
                    className="w-full text-xs font-mono font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Default checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  {isKm ? 'កំណត់ជាគណនីធនាគារចម្បង' : 'Set as primary bank account'}
                </span>
              </label>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBankModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  {isKm ? 'ភ្ជាប់គណនី' : 'Save & Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER NEW ACCOUNT (CUSTOMER OR PROVIDER) */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  <span>{isKm ? 'បង្កើតគណនីប្រើប្រាស់ថ្មី' : 'Register New Account'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isKm ? 'បង្កើតគណនីអតិថិជន ឬចុះឈ្មោះជាអ្នកផ្តល់សេវា/ផ្គត់ផ្គង់' : 'Create customer account or register as provider'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewAccount} className="space-y-4">
              {/* Account Role Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isKm ? 'ប្រភេទគណនី' : 'Account Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserRole('customer')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      newUserRole === 'customer'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{isKm ? 'អតិថិជន (Customer)' : 'Customer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewUserRole('provider')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      newUserRole === 'provider'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{isKm ? 'អ្នកផ្តល់សេវា (Provider)' : 'Provider'}</span>
                  </button>
                </div>
              </div>

              {/* Provider Category (if provider selected) */}
              {newUserRole === 'provider' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isKm ? 'ប្រភេទសេវាកម្មផ្តល់ជូន' : 'Service Offering Category'}
                  </label>
                  <select
                    value={newUserCategory}
                    onChange={(e) => setNewUserCategory(e.target.value as ProviderServiceCategory)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="driver_courier">{isKm ? 'អ្នកបើកបរកង់បី ឬម៉ូតូដឹកជញ្ជូន' : 'TukTuk or Moto Courier Driver'}</option>
                    <option value="merchant_food">{isKm ? 'អាជីវករហាងម្ហូប ឬកសិផល' : 'Food or Produce Merchant'}</option>
                    <option value="fleet_logistics">{isKm ? 'ដៃគូរថយន្តវ៉ែនអន្តរខេត្ត' : 'Interprovincial Van Fleet'}</option>
                  </select>
                </div>
              )}

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isKm ? 'ឈ្មោះជាអក្សរឡាតាំង (English Name)' : 'Full Name (English)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOK DARA"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isKm ? 'ឈ្មោះជាភាសាខ្មែរ (Khmer Name)' : 'Name (Khmer)'}
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. សុខ ដារ៉ា"
                    value={newUserNameKm}
                    onChange={(e) => setNewUserNameKm(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Phone & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isKm ? 'លេខទូរស័ព្ទ (Phone Number)' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="012 345 678"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isKm ? 'ខេត្ត-រាជធានី' : 'Province / City'}
                  </label>
                  <select
                    value={newUserCity}
                    onChange={(e) => setNewUserCity(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="Phnom Penh">រាជធានីភ្នំពេញ (Phnom Penh)</option>
                    <option value="Siem Reap">ខេត្តសៀមរាប (Siem Reap)</option>
                    <option value="Battambang">ខេត្តបាត់ដំបង (Battambang)</option>
                    <option value="Kampong Cham">ខេត្តកំពង់ចាម (Kampong Cham)</option>
                    <option value="Preah Sihanouk">ខេត្តព្រះសីហនុ (Sihanoukville)</option>
                    <option value="Kandal">ខេត្តកណ្តាល (Kandal)</option>
                    <option value="Kampot">ខេត្តកំពត (Kampot)</option>
                  </select>
                </div>
              </div>

              {/* Store or Vehicle Title if provider */}
              {newUserRole === 'provider' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {newUserCategory === 'driver_courier'
                      ? (isKm ? 'ប្រភេទយានយន្ត / ស្លាកលេខ' : 'Vehicle Type & Plate Number')
                      : (isKm ? 'ឈ្មោះហាង ឬម៉ាកអាជីវកម្ម' : 'Store / Brand Name')}
                  </label>
                  <input
                    type="text"
                    placeholder={newUserCategory === 'driver_courier' ? 'ឧ. កង់បីឥណ្ឌា (ភ្នំពេញ 1A-8822)' : 'ឧ. ហាងបាយឆ្ងាញ់ភ្នំពេញ'}
                    value={newUserTitle}
                    onChange={(e) => setNewUserTitle(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Free Guarantee Notice */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isKm 
                    ? 'ប្រព័ន្ធនឹងបង្កើតគណនីធនាគារចម្បង ABA ដោយស្វ័យប្រវត្តិ។ គ្មានការកាត់កម្រៃជើងសារ 0% ជារៀងរហូត។'
                    : 'A primary settlement bank will be automatically linked with 0% platform commission.'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAccountModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  {isKm ? 'បង្កើតគណនី' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BAKONG KHQR STAND MODAL */}
      {isQRModalOpen && selectedBankForQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-center space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-600 uppercase tracking-wider">
                National Bakong KHQR
              </span>
              <button
                type="button"
                onClick={() => setIsQRModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Stand Graphic */}
            <div className="bg-gradient-to-b from-rose-600 to-rose-700 p-4 rounded-2xl text-white shadow-lg space-y-3">
              <div className="text-[11px] font-black tracking-widest uppercase bg-rose-800/80 py-1 px-3 rounded-lg inline-block">
                KHQR • BAKONG PAYMENT
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-inner text-slate-900">
                <div className="w-48 h-48 mx-auto bg-slate-950 p-2.5 rounded-xl flex items-center justify-center shadow-xs">
                  <QrCode className="w-full h-full text-white" />
                </div>
                <div className="mt-3 font-black text-sm text-slate-900 truncate">
                  {selectedBankForQR.accountName}
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {selectedBankForQR.accountNumber} ({selectedBankForQR.bankName})
                </div>
              </div>

              <div className="text-[11px] text-rose-100 font-semibold">
                {isKm ? 'ស្កេនទូទាត់ពីគ្រប់កម្មវិធីធនាគារក្នុងប្រទេសកម្ពុជា' : 'Scan to pay from any Cambodian Mobile Banking App'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleCopy(selectedBankForQR.accountNumber, selectedBankForQR.bankName);
                setIsQRModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isKm ? 'ចម្លងលេខគណនី' : 'Copy Account Number'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: MONTHLY DELIVERY HISTORY PDF EXPORT & STATEMENT GENERATOR */}
      <MonthlyDeliveryPdfExportModal
        isOpen={isPdfExportModalOpen}
        onClose={() => setIsPdfExportModalOpen(false)}
        profile={currentProfile}
        language={language}
        currency={currency}
        initialMonth={pdfExportMonth}
        onNotify={onNotify}
      />

      {/* MODAL 5: REFER A FRIEND & TOP-RATED SENDER REWARD */}
      <ReferAFriendModal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
        profile={currentProfile}
        language={language}
        onNotify={onNotify}
      />

      {/* MODAL 6: DOWNLOAD MY ACTIVITY (CSV & PDF EXPORT) */}
      <DownloadMyActivityModal
        isOpen={isDownloadActivityModalOpen}
        onClose={() => setIsDownloadActivityModalOpen(false)}
        profile={currentProfile}
        language={language}
        currency={currency}
        onNotify={onNotify}
      />
    </div>
  );
};
