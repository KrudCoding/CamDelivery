import React from 'react';
import { Home, Truck, UtensilsCrossed, Search, Code2, Wallet, MapPin, Compass } from 'lucide-react';
import { Language } from '../types';

export type MainTab = 'home' | 'map' | 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code';

interface BottomNavBarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  language: Language;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  language,
}) => {
  const isKm = language === 'km';

  const tabs: { id: MainTab; labelKm: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      labelKm: 'ទំព័រដើម',
      labelEn: 'Home',
      icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'map',
      labelKm: 'ផែនទី Google',
      labelEn: 'Live Map',
      icon: <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />,
    },
    {
      id: 'courier',
      labelKm: 'ផ្ញើឥវ៉ាន់',
      labelEn: 'Courier',
      icon: <Truck className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'food_ride',
      labelKm: 'ម្ហូប & កង់បី',
      labelEn: 'Food & Rides',
      icon: <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'track',
      labelKm: 'តាមដាន',
      labelEn: 'Track',
      icon: <Search className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'account',
      labelKm: 'គណនី & ធនាគារ',
      labelEn: 'Banking',
      icon: <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />,
    },
    {
      id: 'flutter_code',
      labelKm: 'កូដ Flutter',
      labelEn: 'Flutter',
      icon: <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070b12]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg transition-colors duration-200">
      <div className="max-w-xl mx-auto px-1.5 py-1 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-xl transition group relative cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                {tab.icon}
              </div>
              <span className={`text-[9px] sm:text-[10px] mt-0.5 tracking-tight truncate max-w-[58px] sm:max-w-none text-center ${isActive ? 'font-black' : 'font-medium'}`}>
                {isKm ? tab.labelKm : tab.labelEn}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-6 sm:w-8 h-0.5 sm:h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
