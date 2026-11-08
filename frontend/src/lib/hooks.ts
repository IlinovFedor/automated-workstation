import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getEntity, getLessons } from '@/api';
import type { Entity, Lesson, TableType } from '@/types';
import { getCached, setCached } from './storage';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
  );
}

export const useIsDesktop = () => useMediaQuery('(min-width: 768px)');

/** Текущее время, обновляется раз в минуту (для линии «сейчас» и «Сегодня»). */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return now;
}

export interface ScheduleState {
  entity: Entity | null;
  lessons: Lesson[];
  /** Первая загрузка ещё идёт и показать нечего. */
  loading: boolean;
  /** Сеть недоступна, показан сохранённый вариант от этого момента. */
  staleSince: number | null;
  error: boolean;
}

/**
 * Расписание всегда грузится из сети. Сохранённая копия показывается сразу,
 * пока идёт запрос, и остаётся на экране с плашкой, если сети нет.
 * При возвращении в приложение расписание перезагружается.
 */
export function useSchedule(table: TableType, id: number): ScheduleState & { reload: () => void } {
  const [state, setState] = useState<ScheduleState>(() => initial(table, id));
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    Promise.all([getEntity(table, id, controller.signal), getLessons(table, id, controller.signal)])
      .then(([entity, lessons]) => {
        setCached(table, id, { entity, lessons, fetchedAt: Date.now() });
        setState({ entity, lessons, loading: false, staleSince: null, error: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error('Не удалось загрузить расписание', error);
        const cached = getCached(table, id);
        setState(
          cached
            ? { entity: cached.entity, lessons: cached.lessons, loading: false, staleSince: cached.fetchedAt, error: false }
            : { entity: null, lessons: [], loading: false, staleSince: null, error: true },
        );
      });
  }, [table, id]);

  useEffect(() => {
    setState(initial(table, id));
    load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', load);
    return () => {
      requestRef.current?.abort();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', load);
    };
  }, [table, id, load]);

  return { ...state, reload: load };
}

function initial(table: TableType, id: number): ScheduleState {
  const cached = getCached(table, id);
  return cached
    ? { entity: cached.entity, lessons: cached.lessons, loading: false, staleSince: null, error: false }
    : { entity: null, lessons: [], loading: true, staleSince: null, error: false };
}
