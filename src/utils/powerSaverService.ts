export const POWER_SAVER_STORAGE_KEY = 'camdelivery_power_saver_mode';
export const POWER_SAVER_EVENT = 'camdelivery_power_saver_changed';

export function isPowerSaverMode(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = localStorage.getItem(POWER_SAVER_STORAGE_KEY);
      return val === 'true';
    }
  } catch (err) {
    console.warn('Error reading power saver mode:', err);
  }
  return false;
}

export function setPowerSaverMode(enabled: boolean): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(POWER_SAVER_STORAGE_KEY, enabled ? 'true' : 'false');
      window.dispatchEvent(
        new CustomEvent(POWER_SAVER_EVENT, { detail: { enabled } })
      );
    }
  } catch (err) {
    console.error('Error saving power saver mode:', err);
  }
  return enabled;
}

/**
 * Returns recommended map animation & simulation polling interval in ms.
 * Normal: 1500ms (1.5 seconds)
 * Power Saver: 6000ms (6.0 seconds, saves ~45% battery)
 */
export function getTrackingRefreshIntervalMs(): number {
  return isPowerSaverMode() ? 6000 : 1500;
}
