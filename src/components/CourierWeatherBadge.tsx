import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sun, 
  CloudRain, 
  CloudSun, 
  CloudLightning, 
  CloudFog, 
  Wind, 
  Droplets, 
  RefreshCw, 
  Info,
  ShieldAlert,
  ShieldCheck,
  Thermometer
} from 'lucide-react';
import { Language } from '../types';
import { CourierWeatherInfo, fetchCourierWeather } from '../services/weatherService';

interface CourierWeatherBadgeProps {
  lat: number;
  lng: number;
  locationLabel?: string;
  locationLabelKm?: string;
  language: Language;
  className?: string;
  compact?: boolean;
}

export const CourierWeatherBadge: React.FC<CourierWeatherBadgeProps> = ({
  lat,
  lng,
  locationLabel,
  locationLabelKm,
  language,
  className = '',
  compact = false,
}) => {
  const isKm = language === 'km';
  const [weather, setWeather] = useState<CourierWeatherInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const loadWeather = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCourierWeather(lat, lng, locationLabel, locationLabelKm);
      setWeather(data);
    } catch {
      // Handled inside service
    } finally {
      setIsLoading(false);
    }
  }, [lat, lng, locationLabel, locationLabelKm]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  if (!weather && isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse text-xs text-slate-500 ${className}`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
        <span>{isKm ? 'កំពុងទាញទិន្នន័យអាកាសធាតុ...' : 'Checking local courier weather...'}</span>
      </div>
    );
  }

  if (!weather) return null;

  // Icon selector based on iconType
  const renderWeatherIcon = () => {
    switch (weather.iconType) {
      case 'rainy':
        return <CloudRain className="w-4 h-4 text-sky-500 animate-bounce" />;
      case 'stormy':
        return <CloudLightning className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'partly-cloudy':
        return <CloudSun className="w-4 h-4 text-amber-400" />;
      case 'foggy':
        return <CloudFog className="w-4 h-4 text-slate-400" />;
      case 'sunny':
      default:
        return <Sun className="w-4 h-4 text-amber-500 animate-[spin_12s_linear_infinite]" />;
    }
  };

  const isAdverseWeather = weather.iconType === 'rainy' || weather.iconType === 'stormy';

  if (compact) {
    return (
      <div 
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition select-none ${
          isAdverseWeather 
            ? 'bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 hover:bg-sky-100' 
            : 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 hover:bg-amber-100'
        } ${className}`}
        title={isKm ? 'ចុចដើម្បីមើលព័ត៌មានលម្អិតអាកាសធាតុតាមផ្លូវ' : 'Click to inspect courier route weather'}
      >
        {renderWeatherIcon()}
        <span>{weather.temperature}°C</span>
        <span className="text-[10px] opacity-80 truncate max-w-[100px]">
          {isKm ? weather.conditionKm : weather.conditionEn}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isAdverseWeather
        ? 'bg-gradient-to-r from-sky-50 via-slate-50 to-blue-50 dark:from-sky-950/40 dark:via-slate-900 dark:to-blue-950/40 border-sky-200 dark:border-sky-800/80 shadow-2xs'
        : 'bg-gradient-to-r from-amber-50/70 via-white to-orange-50/60 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-800 border-amber-200/80 dark:border-slate-800 shadow-2xs'
    } ${className}`}>
      {/* Main weather banner bar */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2.5">
          {/* Weather Animated Icon Frame */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
            isAdverseWeather 
              ? 'bg-sky-500/15 border border-sky-300 text-sky-600 dark:border-sky-700' 
              : 'bg-amber-500/15 border border-amber-300 text-amber-600 dark:border-amber-700'
          }`}>
            {renderWeatherIcon()}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isKm ? 'អាកាសធាតុទីតាំងអ្នកដឹក (Live Weather)' : 'Courier Live Weather (Open-Meteo API)'}
              </span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                weather.isRealTime 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {weather.isRealTime ? (isKm ? 'ផ្ទាល់ (Open API)' : 'Live Sensor') : 'Regional'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {weather.temperature}°C
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {isKm ? weather.conditionKm : weather.conditionEn}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isKm ? `មានអារម្មណ៍ដូច ${weather.feelsLike}°C` : `Feels like ${weather.feelsLike}°C`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action: Road condition and Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-center ml-auto">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Info className="w-3 h-3 text-blue-500" />
            <span>{showDetails ? (isKm ? 'បិទព័ត៌មាន' : 'Less') : (isKm ? 'លម្អិតផ្លូវ' : 'Road Impact')}</span>
          </button>

          <button
            type="button"
            onClick={loadWeather}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title={isKm ? 'ធ្វើបច្ចុប្បន្នភាពអាកាសធាតុ' : 'Refresh Weather'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Road Safety Condition & Micro-Atmospheric Metrics */}
      {showDetails && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px]">
            {isAdverseWeather ? (
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              <strong className="text-slate-900 dark:text-white font-bold">
                {isKm ? 'ស្ថានភាពផ្លូវ៖ ' : 'Highway Road Trajectory: '}
              </strong>
              {isKm ? weather.roadStatusKm : weather.roadStatusEn}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/50">
              <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{isKm ? 'សំណើម' : 'Humidity'}: <strong className="text-slate-800 dark:text-slate-200 font-mono">{weather.humidity}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/50">
              <Wind className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>{isKm ? 'ល្បឿនខ្យល់' : 'Wind'}: <strong className="text-slate-800 dark:text-slate-200 font-mono">{weather.windSpeed} km/h</strong></span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/50">
              <Thermometer className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{isKm ? 'ទឹកភ្លៀង' : 'Precip'}: <strong className="text-slate-800 dark:text-slate-200 font-mono">{weather.precipitation} mm</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
