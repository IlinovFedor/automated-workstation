import type { Entity, Lesson, TableType, ThemeMode, ViewMode } from '@/types';
import { isTableType } from '@/types';

/** Хранилище может быть недоступно (приватный режим и т. п.) — тогда просто ничего не помним. */
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/** Настройки старой версии фронтенда — переносим, чтобы у людей ничего не слетело. */
interface LegacySettings {
  mode?: string;
  entityId?: number | null;
  entityName?: string;
  theme?: ThemeMode;
}
const LEGACY_KEY = 'pstu-timetable-settings';

/* ---------- Основное расписание (открывается при запуске) ---------- */

export interface SavedSchedule {
  table: TableType;
  id: number;
  name: string;
}

const SAVED_KEY = 'pstu:saved';

export function getSaved(): SavedSchedule | null {
  const saved = read<SavedSchedule>(SAVED_KEY);
  if (saved && isTableType(saved.table) && saved.id) return saved;
  const legacy = read<LegacySettings>(LEGACY_KEY);
  if (legacy?.entityId && isTableType(legacy.mode)) {
    return { table: legacy.mode, id: legacy.entityId, name: legacy.entityName ?? '' };
  }
  return null;
}

export function setSaved(saved: SavedSchedule): void {
  write(SAVED_KEY, saved);
}

/* ---------- Тема ---------- */

const THEME_KEY = 'pstu:theme';

export function getThemeMode(): ThemeMode {
  const mode = read<ThemeMode>(THEME_KEY) ?? read<LegacySettings>(LEGACY_KEY)?.theme;
  return mode === 'light' || mode === 'dark' ? mode : 'system';
}

export function setThemeMode(mode: ThemeMode): void {
  write(THEME_KEY, mode);
}

/* ---------- Лента или неделя ---------- */

const VIEW_KEY = 'pstu:view';

export function getViewMode(): ViewMode {
  const view = read<ViewMode>(VIEW_KEY);
  if (view === 'feed' || view === 'week') return view;
  return window.matchMedia('(min-width: 768px)').matches ? 'week' : 'feed';
}

export function setViewMode(view: ViewMode): void {
  write(VIEW_KEY, view);
}

/* ---------- Кэш расписаний на случай отсутствия сети ---------- */

export interface CachedSchedule {
  entity: Entity;
  lessons: Lesson[];
  fetchedAt: number;
}

const CACHE_PREFIX = 'pstu:cache:';
const CACHE_INDEX = 'pstu:cache-index';
const CACHE_LIMIT = 6;

const cacheKey = (table: TableType, id: number) => `${CACHE_PREFIX}${table}:${id}`;

export function getCached(table: TableType, id: number): CachedSchedule | null {
  return read<CachedSchedule>(cacheKey(table, id));
}

export function setCached(table: TableType, id: number, value: CachedSchedule): void {
  const key = cacheKey(table, id);
  const index = (read<string[]>(CACHE_INDEX) ?? []).filter((k) => k !== key);
  index.unshift(key);
  // Храним несколько последних расписаний, основное не вытесняем.
  const saved = getSaved();
  const keep = saved ? cacheKey(saved.table, saved.id) : null;
  while (index.length > CACHE_LIMIT) {
    const victimIdx = index.map((k, i) => [k, i] as const).reverse().find(([k]) => k !== keep)?.[1];
    if (victimIdx === undefined) break;
    write(index[victimIdx], null);
    index.splice(victimIdx, 1);
  }
  write(CACHE_INDEX, index);
  write(key, value);
}
