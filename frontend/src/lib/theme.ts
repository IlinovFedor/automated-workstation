import { useSyncExternalStore } from 'react';
import type { ThemeMode } from '@/types';
import { getThemeMode, setThemeMode } from './storage';

const media = window.matchMedia('(prefers-color-scheme: dark)');
let mode: ThemeMode = getThemeMode();
const listeners = new Set<() => void>();

function apply() {
  const dark = mode === 'dark' || (mode === 'system' && media.matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute('content', dark ? '#1B1F26' : '#FFFFFF'));
}

export function initTheme() {
  apply();
  media.addEventListener('change', () => {
    if (mode === 'system') apply();
  });
}

export function setTheme(next: ThemeMode) {
  mode = next;
  setThemeMode(next);
  apply();
  listeners.forEach((l) => l());
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => mode,
  );
}
