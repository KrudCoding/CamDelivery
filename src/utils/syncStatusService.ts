export type SyncMode = 'cloud' | 'local_only';

export interface SyncStatusData {
  mode: SyncMode;
  lastSyncTimestamp: string; // ISO string
  lastSyncFormattedEn: string;
  lastSyncFormattedKm: string;
  isOnline: boolean;
  serverNode: string;
  pendingChangesCount: number;
}

const STORAGE_KEY = 'camdelivery_sync_status_v1';
export const SYNC_STATUS_EVENT = 'camdelivery_sync_status_updated';

function formatTimestampEn(d: Date): string {
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `Today at ${time}`;
}

function formatTimestampKm(d: Date): string {
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `ថ្ងៃនេះ ម៉ោង ${time}`;
}

export function getSyncStatus(): SyncStatusData {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...parsed,
          isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        };
      }
    }
  } catch (err) {
    console.warn('Error reading sync status:', err);
  }

  const now = new Date();
  const initial: SyncStatusData = {
    mode: 'cloud',
    lastSyncTimestamp: now.toISOString(),
    lastSyncFormattedEn: formatTimestampEn(now),
    lastSyncFormattedKm: formatTimestampKm(now),
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    serverNode: 'phnom-penh-gw01.camdelivery.gov.kh',
    pendingChangesCount: 0,
  };

  saveSyncStatus(initial);
  return initial;
}

export function saveSyncStatus(data: SyncStatusData): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: data }));
    }
  } catch (err) {
    console.error('Error saving sync status:', err);
  }
}

export function setSyncMode(newMode: SyncMode): SyncStatusData {
  const current = getSyncStatus();
  const now = new Date();
  const updated: SyncStatusData = {
    ...current,
    mode: newMode,
    lastSyncTimestamp: newMode === 'cloud' ? now.toISOString() : current.lastSyncTimestamp,
    lastSyncFormattedEn: newMode === 'cloud' ? formatTimestampEn(now) : current.lastSyncFormattedEn,
    lastSyncFormattedKm: newMode === 'cloud' ? formatTimestampKm(now) : current.lastSyncFormattedKm,
  };
  saveSyncStatus(updated);
  return updated;
}

export async function performServerSync(): Promise<SyncStatusData> {
  const current = getSyncStatus();
  // Simulate network roundtrip latency with server node
  await new Promise((resolve) => setTimeout(resolve, 800));

  const now = new Date();
  const updated: SyncStatusData = {
    ...current,
    lastSyncTimestamp: now.toISOString(),
    lastSyncFormattedEn: formatTimestampEn(now),
    lastSyncFormattedKm: formatTimestampKm(now),
    pendingChangesCount: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
  saveSyncStatus(updated);
  return updated;
}
