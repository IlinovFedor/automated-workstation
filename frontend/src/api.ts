import type { Entity, Lesson, Pagination, TableType } from '@/types';

const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number) {
    super(`API error ${status}`);
  }
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    signal,
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new ApiError(response.status);
  return response.json() as Promise<T>;
}

export interface EntityPage {
  items: Entity[];
  page: number;
  totalPages: number;
}

/** Поиск по одному типу сущностей. Страницы в API нумеруются с 1. */
export async function searchEntities(
  table: TableType,
  search: string,
  page = 1,
  pageSize = 5,
  signal?: AbortSignal,
): Promise<EntityPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);
  // Ключ списка в ответе совпадает с названием таблицы: { subgroups: [...] }, { teachers: [...] } …
  const data = await get<{ pagination: Pagination } & Partial<Record<TableType, Entity[]>>>(
    `/${table}?${params}`,
    signal,
  );
  return {
    items: data[table] ?? [],
    page: data.pagination.page,
    totalPages: data.pagination.total_pages,
  };
}

export function getEntity(table: TableType, id: number, signal?: AbortSignal) {
  return get<Entity>(`/${table}/${id}`, signal);
}

export async function getLessons(table: TableType, id: number, signal?: AbortSignal) {
  try {
    return await get<Lesson[]>(`/lessons/${table}/${id}`, signal);
  } catch (error) {
    // 404 означает «пар нет», а не ошибку.
    if (error instanceof ApiError && error.status === 404) return [];
    throw error;
  }
}

export function getLesson(id: string, signal?: AbortSignal) {
  return get<Lesson>(`/lessons/${id}`, signal);
}

/**
 * Ссылки для подписки в календаре — прямо на ICS из API, тот же адрес, что у приложения.
 * Календарь (Google и т. п.) скачивает его сам, поэтому адрес должен быть абсолютным и публичным;
 * VITE_WEBCAL_URL позволяет задать его явно (например, при разработке на localhost).
 */
export function calendarLinks(table: TableType, id: number) {
  const base = new URL(import.meta.env.VITE_WEBCAL_URL || BASE, window.location.href).href.replace(/\/$/, '');
  const https = `${base}/lessons/${table}/${id}?format=ics`;
  const webcal = https.replace(/^https?:\/\//, 'webcal://');
  return {
    https,
    webcal,
    // addbyurl?url= Google больше не подставляет. render?cid= сразу предлагает подписаться,
    // но принимает только webcal:// (с https:// отвечает «Unable to add calendar»).
    google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
  };
}
