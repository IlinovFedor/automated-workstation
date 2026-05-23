import type { AppSettings, TableType, ThemeMode } from '@/types';

const STORAGE_KEY = 'pstu-timetable-settings';

const defaultSettings: AppSettings = {
  mode: 'subgroups',
  entityId: null,
  entityName: '',
  theme: 'system',
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

export function getTheme(): ThemeMode {
  return getSettings().theme || 'system';
}

export function saveTheme(theme: ThemeMode): void {
  const settings = getSettings();
  settings.theme = theme;
  saveSettings(settings);
}

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

export function getWebcalUrl(table: TableType, id: number): string {
  const baseUrl = import.meta.env.VITE_WEBCAL_URL || window.location.origin;
  return `webcal://${baseUrl.replace(/^https?:\/\//, '')}/lessons/${table}/${id}?format=ics`;
}

export function getIcsUrl(table: TableType, id: number): string {
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  return `${baseUrl}/lessons/${table}/${id}?format=ics`;
}

export function getGoogleCalendarUrl(table: TableType, id: number): string {
  const icsUrl = getIcsUrl(table, id);
  return `https://calendar.google.com/calendar/u/0/r/settings/addbyurl?url=${encodeURIComponent(icsUrl)}`;
}
