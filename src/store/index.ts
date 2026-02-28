import type { AppSettings, TableType } from '@/types';

const STORAGE_KEY = 'pstu-timetable-settings';

const defaultSettings: AppSettings = {
  mode: 'subgroups',
  entityId: null,
  entityName: '',
};

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getWebcalUrl(table: TableType, id: number): string {
  const baseUrl = import.meta.env.VITE_WEBCAL_URL || window.location.origin;
  return `webcal://${baseUrl.replace(/^https?:\/\//, '')}/lessons/${table}/${id}?format=ics`;
}
