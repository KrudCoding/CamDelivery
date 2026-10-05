// Open-Meteo Real-time Weather Service for Courier Location
// No API key required - Free open weather API

export interface CourierWeatherInfo {
  temperature: number; // in Celsius
  feelsLike: number;
  humidity: number; // in %
  precipitation: number; // in mm
  windSpeed: number; // in km/h
  weatherCode: number;
  conditionEn: string;
  conditionKm: string;
  iconType: 'sunny' | 'partly-cloudy' | 'rainy' | 'stormy' | 'foggy';
  roadStatusEn: string;
  roadStatusKm: string;
  locationName: string;
  locationNameKm: string;
  lastUpdated: string;
  isRealTime: boolean;
}

// Map WMO Weather Interpretation Codes to readable descriptions and road condition impact
function parseWmoWeatherCode(code: number): {
  conditionEn: string;
  conditionKm: string;
  iconType: 'sunny' | 'partly-cloudy' | 'rainy' | 'stormy' | 'foggy';
  roadStatusEn: string;
  roadStatusKm: string;
} {
  // Clear sky
  if (code === 0) {
    return {
      conditionEn: 'Sunny & Clear',
      conditionKm: 'មេឃស្រឡះល្អ',
      iconType: 'sunny',
      roadStatusEn: 'Dry pavement • Optimal dispatch conditions',
      roadStatusKm: 'ផ្លូវស្ងួតល្អ • លក្ខខណ្ឌដឹកជញ្ជូនល្អឥតខ្ចោះ',
    };
  }
  // Mainly clear, partly cloudy
  if (code === 1 || code === 2) {
    return {
      conditionEn: 'Partly Cloudy',
      conditionKm: 'មានពពកខ្លះ',
      iconType: 'partly-cloudy',
      roadStatusEn: 'Dry highway • Smooth traffic visibility',
      roadStatusKm: 'ផ្លូវស្ងួតស្រួលបើកបរ • អាចមើលផ្លូវបានឆ្ងាយ',
    };
  }
  // Overcast
  if (code === 3) {
    return {
      conditionEn: 'Overcast & Shaded',
      conditionKm: 'មេឃស្រអាប់ចុះត្រជាក់',
      iconType: 'partly-cloudy',
      roadStatusEn: 'Good road traction • Comfortable delivery pace',
      roadStatusKm: 'ផ្លូវល្អមិនក្តៅ • ល្បឿនដឹកជញ្ជូនថេរ',
    };
  }
  // Fog
  if (code === 45 || code === 48) {
    return {
      conditionEn: 'Misty / Foggy',
      conditionKm: 'មានចុះអ័ព្ទ',
      iconType: 'foggy',
      roadStatusEn: 'Low visibility • Courier driving with headlights',
      roadStatusKm: 'អ័ព្ទបាំងផ្លូវ • អ្នកដឹកបើកភ្លើងប្រុងប្រយ័ត្ន',
    };
  }
  // Drizzle
  if (code >= 51 && code <= 57) {
    return {
      conditionEn: 'Light Drizzle',
      conditionKm: 'ភ្លៀងរលឹមស្រិចៗ',
      iconType: 'rainy',
      roadStatusEn: 'Damp roads • Parcels protected under waterproof cover',
      roadStatusKm: 'ផ្លូវសើមតិចតួច • កញ្ចប់ទំនិញត្រូវបានគ្របតង់ការពារជិត',
    };
  }
  // Rain
  if (code >= 61 && code <= 67) {
    return {
      conditionEn: 'Rainy',
      conditionKm: 'ភ្លៀងធ្លាក់',
      iconType: 'rainy',
      roadStatusEn: 'Wet highway • Moderate transit speed for safety',
      roadStatusKm: 'ផ្លូវជាតិសើម • អ្នកដឹកបន្ថយល្បឿនដើម្បីសុវត្ថិភាព',
    };
  }
  // Rain showers
  if (code >= 80 && code <= 82) {
    return {
      conditionEn: 'Rain Showers',
      conditionKm: 'ភ្លៀងមេធំ',
      iconType: 'rainy',
      roadStatusEn: 'Pavement water spray • Driver taking cautious pace',
      roadStatusKm: 'មានទឹកដក់លើផ្លូវ • អ្នកដឹកបើកបរដោយប្រុងប្រយ័ត្នខ្ពស់',
    };
  }
  // Thunderstorm
  if (code >= 95) {
    return {
      conditionEn: 'Monsoon Thunderstorm',
      conditionKm: 'ផ្គររន្ទះ & ភ្លៀងខ្លាំង',
      iconType: 'stormy',
      roadStatusEn: 'Heavy rain • Expect +10-15m safety delay',
      roadStatusKm: 'ភ្លៀងធ្លាក់ខ្លាំង • អាចយឺតពេល ១០-១៥ នាទីដោយសារសុវត្ថិភាព',
    };
  }

  return {
    conditionEn: 'Fair Weather',
    conditionKm: 'អាកាសធាតុល្អធម្មតា',
    iconType: 'sunny',
    roadStatusEn: 'Standard highway conditions',
    roadStatusKm: 'ស្ថានភាពផ្លូវធម្មតា',
  };
}

// In-memory cache to prevent spamming the open API
const weatherCache = new Map<string, { data: CourierWeatherInfo; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export async function fetchCourierWeather(
  lat: number,
  lng: number,
  locationLabel?: string,
  locationLabelKm?: string
): Promise<CourierWeatherInfo> {
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const now = Date.now();

  const cached = weatherCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const locName = locationLabel || 'Courier En-Route';
  const locNameKm = locationLabelKm || 'ទីតាំងអ្នកដឹកជញ្ជូន';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP error: ${response.status}`);
    }

    const json = await response.json();
    const current = json.current;

    const weatherInterpretation = parseWmoWeatherCode(current.weather_code || 0);

    const weatherInfo: CourierWeatherInfo = {
      temperature: Math.round(current.temperature_2m ?? 31),
      feelsLike: Math.round(current.apparent_temperature ?? 34),
      humidity: Math.round(current.relative_humidity_2m ?? 65),
      precipitation: Number((current.precipitation ?? 0).toFixed(1)),
      windSpeed: Math.round(current.wind_speed_10m ?? 12),
      weatherCode: current.weather_code ?? 0,
      conditionEn: weatherInterpretation.conditionEn,
      conditionKm: weatherInterpretation.conditionKm,
      iconType: weatherInterpretation.iconType,
      roadStatusEn: weatherInterpretation.roadStatusEn,
      roadStatusKm: weatherInterpretation.roadStatusKm,
      locationName: locName,
      locationNameKm: locNameKm,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRealTime: true,
    };

    weatherCache.set(cacheKey, { data: weatherInfo, timestamp: now });
    return weatherInfo;
  } catch {
    // Fallback realistic Cambodian tropical climate data based on coordinates and time of day
    const isAfternoon = new Date().getHours() >= 13 && new Date().getHours() <= 17;
    const isRainChance = isAfternoon && Math.random() > 0.45;
    const fallbackCode = isRainChance ? 61 : 1;
    const interp = parseWmoWeatherCode(fallbackCode);

    const fallbackInfo: CourierWeatherInfo = {
      temperature: isRainChance ? 28 : 32,
      feelsLike: isRainChance ? 31 : 36,
      humidity: isRainChance ? 82 : 62,
      precipitation: isRainChance ? 3.2 : 0,
      windSpeed: isRainChance ? 16 : 10,
      weatherCode: fallbackCode,
      conditionEn: interp.conditionEn,
      conditionKm: interp.conditionKm,
      iconType: interp.iconType,
      roadStatusEn: interp.roadStatusEn,
      roadStatusKm: interp.roadStatusKm,
      locationName: locName,
      locationNameKm: locNameKm,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRealTime: false,
    };

    return fallbackInfo;
  }
}
