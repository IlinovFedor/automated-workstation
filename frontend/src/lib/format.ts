import type { CSSProperties } from 'react';
import type { Entity, Lesson, ScheduleContext, TableType } from '@/types';
import { addDays, sameDay } from './time';

/* ---------- Типы занятий ---------- */

interface CategoryStyle {
  label: string;
  color: string;
  ink: string;
}

const CATEGORIES: Record<string, CategoryStyle> = {
  '(лек)': { label: 'Лекция', color: '#002FE7', ink: '#FFFFFF' },
  '(пр)': { label: 'Практика', color: '#FF7641', ink: '#1B1F26' },
  '(лаб)': { label: 'Лабораторная', color: '#968AE1', ink: '#1B1F26' },
  '(кср)': { label: 'КСР', color: '#FFF854', ink: '#1B1F26' },
};

export function categoryStyle(category: string): CategoryStyle {
  const known = CATEGORIES[category];
  if (known) return known;
  const raw = category.replace(/[()]/g, '').trim();
  return {
    label: raw ? raw[0].toUpperCase() + raw.slice(1) : 'Занятие',
    color: '#81818B',
    ink: '#FFFFFF',
  };
}

/** CSS-переменные --c (цвет типа) и --ci (цвет текста на нём). */
export function categoryVars(category: string): CSSProperties {
  const { color, ink } = categoryStyle(category);
  return { '--c': color, '--ci': ink } as CSSProperties;
}

/* ---------- Подписи ---------- */

export const TABLE_LABEL: Record<TableType, string> = {
  subgroups: 'Группа',
  teachers: 'Преподаватель',
  locations: 'Аудитория',
  subjects: 'Предмет',
};

export const TABLE_SECTION: Record<TableType, string> = {
  subgroups: 'Группы',
  teachers: 'Преподаватели',
  locations: 'Аудитории',
  subjects: 'Предметы',
};

export const REPEAT_LABEL: Record<Lesson['repeat_rule'], string> = {
  0: 'Каждую неделю',
  1: 'По нечётным неделям',
  2: 'По чётным неделям',
};

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} ${one}`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

/* ---------- Даты и время (локальные) ---------- */

export function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} ч` : '', m ? `${m} мин` : ''].filter(Boolean).join(' ');
}

const WEEKDAY = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
export const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

export function formatDate(date: Date, withYear = date.getFullYear() !== new Date().getFullYear()): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

/** Дата по Перми (Пермь живёт по екатеринбургскому времени). */
export function formatPermDate(ms: number): string {
  return new Date(ms).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Yekaterinburg',
  });
}

/** «Сегодня, вторник, 10 ноября», «Завтра, …», «Среда, 11 ноября». */
export function formatDayHeading(date: Date, today: Date): string {
  const base = `${WEEKDAY[date.getDay()]}, ${formatDate(date)}`;
  if (sameDay(date, today)) return `Сегодня, ${base}`;
  if (sameDay(date, addDays(today, 1))) return `Завтра, ${base}`;
  return capitalize(base);
}

export function formatWeekday(date: Date): string {
  return capitalize(WEEKDAY[date.getDay()]);
}

/* ---------- Контекст: чьё это расписание ---------- */

/**
 * Группы в карточке: в расписании группы она сама не перечисляется.
 * Строки «преподаватель — аудитория» показываются всегда все: коллеги и соседние
 * аудитории той же пары важны и в расписании преподавателя, и в расписании аудитории.
 */
export function visibleSubgroups(lesson: Lesson, ctx: ScheduleContext): Entity[] {
  if (ctx.table !== 'subgroups') return lesson.subgroups;
  return lesson.subgroups.filter((s) => s.id !== ctx.id);
}
