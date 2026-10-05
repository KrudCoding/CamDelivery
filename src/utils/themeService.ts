export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'camdelivery_theme_mode';
export const THEME_CHANGE_EVENT = 'camdelivery_theme_changed';

/**
 * Retrieve saved theme or detect system preference
 */
export function getSavedTheme(): ThemeMode {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
  } catch (e) {
    console.warn('Error reading theme mode from localStorage:', e);
  }
  return 'light';
}

/**
 * Apply theme class to HTML root and body
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  if (theme === 'dark') {
    root.classList.add('dark');
    body.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    body.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // Update theme-color meta tag for mobile browsers
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', theme === 'dark' ? '#090d16' : '#0f172a');

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } }));
    }
  } catch (e) {
    console.warn('Error saving theme mode:', e);
  }
}

/**
 * Toggle between light and dark mode
 */
export function toggleThemeMode(currentTheme: ThemeMode): ThemeMode {
  const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  return nextTheme;
}
