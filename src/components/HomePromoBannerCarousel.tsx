import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Percent,
  ArrowRight,
} from 'lucide-react';
import { Language, Currency } from '../types';

interface HomePromoBannerCarouselProps {
  language: Language;
  currency: Currency;
  onNavigateTab: (tabId: 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
  className?: string;
}

interface PromoSlide {
  id: string;
  badgeEn: string;
  badgeKm: string;
  titleEn: string;
  titleKm: string;
  descEn: string;
  descKm: string;
  highlightEn: string;
  highlightKm: string;
  ctaEn: string;
  ctaKm: string;
  targetTab: 'courier' | 'food_ride' | 'track' | 'account';
  gradient: string;
  iconBg: string;
  icon: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'zero-commission',
    badgeEn: 'Core Platform Guarantee',
    badgeKm: 'ការធានាស្នូលរបស់កម្មវិធី',
    titleEn: '100% Free Logistics Platform • 0% Commission',
    titleKm: 'កម្មវិធីដឹកជញ្ជូនឥតគិតថ្លៃ ១០០% • គ្មានកម្រៃជើងសារ 0%',
    descEn: 'Every riel you pay goes directly to local Cambodian van drivers and couriers with zero platform middleman deduction.',
    descKm: 'រាល់ប្រាក់ដែលអ្នកបង់ គឺបានទៅដល់ដៃអ្នកបើកបរឡានវ៉ែន និងអ្នកដឹកជញ្ជូនផ្ទាល់ គ្មានការកាត់កម្រៃជើងសារ ២០-៣០% ឡើយ។',
    highlightEn: 'Save 20-30% on Every Parcel',
    highlightKm: 'សន្សំបាន ២០% ទៅ ៣០% រាល់កញ្ចប់ឥវ៉ាន់',
    ctaEn: 'Compare Free Rates',
    ctaKm: 'ប្រៀបធៀបតម្លៃឥឡូវ',
    targetTab: 'courier',
    gradient: 'from-emerald-950 via-slate-900 to-teal-950',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: '🛡️',
  },
  {
    id: 'water-festival-express',
    badgeEn: 'Seasonal Community Promo',
    badgeKm: 'ប្រូម៉ូសិនពិសេសរដូវកាល',
    titleEn: '25 Provinces Van Fleet: Fast 1-Day Provincial Transit',
    titleKm: 'ឡានវ៉ែន ២៥ ខេត្ត-ក្រុង៖ ដឹកជញ្ជូនរហ័ស ១ ថ្ងៃដល់',
    descEn: 'Connect Phnom Penh to Siem Reap, Battambang, Sihanoukville and Kampot at wholesale local depot rates.',
    descKm: 'ភ្ជាប់រាជធានីភ្នំពេញ ទៅកាន់សៀមរាប បាត់ដំបង ព្រះសីហនុ និងកំពត ក្នុងតម្លៃដើមតាមស្ថានីយ៍ឡានផ្ទាល់។',
    highlightEn: 'Depot Drop-offs from 3,000 KHR',
    highlightKm: 'ផ្ញើតាមស្ថានីយ៍ចាប់ពី ៣,០០០ ៛',
    ctaEn: 'Send Provincial Parcel',
    ctaKm: 'ផ្ញើឥវ៉ាន់តាមខេត្ត',
    targetTab: 'courier',
    gradient: 'from-blue-950 via-slate-900 to-indigo-950',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '🚐',
  },
  {
    id: 'bakong-khqr-cashless',
    badgeEn: 'National Payment Synergy',
    badgeKm: 'ទូទាត់រហ័សតាមបាគង',
    titleEn: 'Scan with Bakong KHQR • Instant Direct Settle',
    titleKm: 'ស្កេនបាគង KHQR គ្មានការខាតអត្រាប្តូរប្រាក់',
    descEn: 'Pay any driver or depot using Bakong KHQR directly from ABA, ACLEDA, Wing, Canadia, or Sathapana.',
    descKm: 'ស្កេនទូទាត់បានគ្រប់ធនាគារក្នុងស្រុក (ABA, អេស៊ីលីដា, វីង, កាណាឌីយ៉ា, ស្ថាបនា...) ចូលគណនីអ្នកដឹកភ្លាមៗ។',
    highlightEn: 'Instant Zero Surcharge Payment',
    highlightKm: 'ទូទាត់រហ័ស គ្មានកាត់កម្រៃធនាគារ',
    ctaEn: 'Manage Bank Accounts',
    ctaKm: 'គ្រប់គ្រងគណនីធនាគារ',
    targetTab: 'account',
    gradient: 'from-rose-950 via-slate-900 to-amber-950',
    iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    icon: '🇰🇭',
  },
  {
    id: 'local-merchants-discount',
    badgeEn: 'Partner Merchant Network',
    badgeKm: 'បណ្តាញដៃគូអាជីវកម្មក្នុងស្រុក',
    titleEn: 'Support 350+ Verified Local Cambodian Businesses',
    titleKm: 'គាំទ្រអាជីវកម្មខ្មែរជាង ៣៥០ ហាងទូទាំងប្រទេស',
    descEn: 'Enjoy exclusive delivery arrangements with local food vendors, grocery stalls, and Phnom Penh market sellers.',
    descKm: 'រីករាយជាមួយសេវាដឹកជញ្ជូនតម្លៃសមរម្យពីអ្នកលក់ម្ហូបអាហារ បន្លែផ្លែឈើ និងទំនិញតាមផ្សារទំនើបក្នុងស្រុក។',
    highlightEn: '0% Merchant Service Markup',
    highlightKm: 'គ្មានការដំឡើងថ្លៃម្ហូបអាហារ 0%',
    ctaEn: 'Browse Local Food & Rides',
    ctaKm: 'មើលម្ហូប & កង់បី',
    targetTab: 'food_ride',
    gradient: 'from-amber-950 via-slate-900 to-orange-950',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: '🛍️',
  },
];

export const HomePromoBannerCarousel: React.FC<HomePromoBannerCarouselProps> = ({
  language,
  onNavigateTab,
  className = '',
}) => {
  const isKm = language === 'km';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle slides every 6 seconds if not hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = PROMO_SLIDES[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-700/60 shadow-lg ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Gradient Slide */}
      <div
        className={`bg-gradient-to-r ${slide.gradient} p-5 sm:p-7 text-white transition-all duration-500 min-h-[170px] flex flex-col justify-between relative`}
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/5 to-transparent pointer-events-none" />

        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl">{slide.icon}</span>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-emerald-300">
              {isKm ? slide.badgeKm : slide.badgeEn}
            </span>
            <span className="text-[10px] font-bold text-amber-300 hidden sm:inline-flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
              <Percent className="w-3 h-3" />
              <span>{isKm ? slide.highlightKm : slide.highlightEn}</span>
            </span>
          </div>

          {/* Slide Indicator & Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Content */}
        <div className="my-3 space-y-1.5 relative z-10 max-w-2xl">
          <h3 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight leading-snug">
            {isKm ? slide.titleKm : slide.titleEn}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
            {isKm ? slide.descKm : slide.descEn}
          </p>
        </div>

        {/* Bottom Action & Pagination Dots */}
        <div className="flex items-center justify-between pt-1 relative z-10 flex-wrap gap-2">
          {/* Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {PROMO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-emerald-400' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* CTA Action Button */}
          <button
            type="button"
            onClick={() => onNavigateTab(slide.targetTab)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>{isKm ? slide.ctaKm : slide.ctaEn}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
          </button>
        </div>
      </div>
    </div>
  );
};
