import type { Lesson } from '@/types';

/**
 * Всё расписание задано по пермскому времени (UTC+5, без перехода на летнее).
 * Здесь пары разворачиваются в конкретные моменты времени (UTC мс), а
 * показываются уже в часовом поясе устройства.
 */
export const PERM_OFFSET_MIN = 5 * 60;

const MIN = 60_000;
const DAY = 86_400_000;

/** Номер пермских суток от 1970-01-01. */
function permDay(ms: number): number {
  return Math.floor((ms + PERM_OFFSET_MIN * MIN) / DAY);
}

/** День недели пермских суток: 1 — понедельник … 7 — воскресенье. */
function weekday(day: number): number {
  // 1970-01-01 — четверг.
  return ((((day + 3) % 7) + 7) % 7) + 1;
}

function mondayOf(day: number): number {
  return day - (weekday(day) - 1);
}

/**
 * Понедельник первой недели периода. Периоды должны начинаться с понедельника,
 * но в данных встречаются и другие дни. Тогда первая неделя — календарная неделя
 * с датой начала, а начало в воскресенье относится к следующей неделе.
 */
function firstMonday(startDay: number): number {
  return mondayOf(startDay + 1);
}

export interface Occurrence {
  key: string;
  lesson: Lesson;
  /** UTC мс. */
  start: number;
  end: number;
}

interface PreparedLesson {
  lesson: Lesson;
  periodStart: number;
  periodEnd: number;
  firstMonday: number;
}

const prepared = new WeakMap<Lesson, PreparedLesson>();

function prepare(lesson: Lesson): PreparedLesson {
  let p = prepared.get(lesson);
  if (!p) {
    const periodStart = Date.parse(lesson.timetable.date_start);
    p = {
      lesson,
      periodStart,
      periodEnd: Date.parse(lesson.timetable.date_end),
      firstMonday: firstMonday(permDay(periodStart)),
    };
    prepared.set(lesson, p);
  }
  return p;
}

function occurrenceOn(p: PreparedLesson, day: number): Occurrence | null {
  const { lesson } = p;
  if (weekday(day) !== lesson.day) return null;

  const start = (day * 1440 + lesson.time_start - PERM_OFFSET_MIN) * MIN;
  // Как в ICS бэкенда: начало периода включительно, конец — нет.
  if (start < p.periodStart || start >= p.periodEnd) return null;

  if (lesson.repeat_rule !== 0) {
    const weekIndex = Math.round((mondayOf(day) - p.firstMonday) / 7);
    const firstIsOdd = lesson.timetable.week === 1;
    const isOdd = weekIndex % 2 === 0 ? firstIsOdd : !firstIsOdd;
    if (lesson.repeat_rule === 1 && !isOdd) return null;
    if (lesson.repeat_rule === 2 && isOdd) return null;
  }

  return {
    key: `${lesson.id}:${day}`,
    lesson,
    start,
    end: (day * 1440 + lesson.time_end - PERM_OFFSET_MIN) * MIN,
  };
}

/** Все пары, начинающиеся в интервале [from, to), по возрастанию времени. */
export function occurrencesBetween(lessons: Lesson[], from: Date, to: Date): Occurrence[] {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  const items = lessons.map(prepare);
  const result: Occurrence[] = [];
  for (let day = permDay(fromMs) - 1; day <= permDay(toMs) + 1; day++) {
    for (const p of items) {
      const occ = occurrenceOn(p, day);
      if (occ && occ.start >= fromMs && occ.start < toMs) result.push(occ);
    }
  }
  return result.sort((a, b) => a.start - b.start || a.end - b.end);
}

/* ---------- Локальные даты (часовой пояс устройства) ---------- */

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function mondayOfLocal(date: Date): Date {
  const d = startOfDay(date);
  const wd = d.getDay() === 0 ? 7 : d.getDay();
  return addDays(d, 1 - wd);
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** Минуты от локальной полуночи. */
export function localMinutes(ms: number): number {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Пояснение, если устройство не в пермском времени, например
 * «Время местное, в Перми на 2 ч больше». Для Перми — null.
 */
export function timezoneNote(now = new Date()): string | null {
  const diff = PERM_OFFSET_MIN + now.getTimezoneOffset();
  if (diff === 0) return null;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const amount = [h ? `${h} ч` : '', m ? `${m} мин` : ''].filter(Boolean).join(' ');
  return `Время местное, в Перми на ${amount} ${diff > 0 ? 'больше' : 'меньше'}`;
}

/** Группы пересекающихся по времени пар. Внутри группы у каждой пары своя дорожка. */
export interface Cluster {
  items: { occ: Occurrence; lane: number }[];
  lanes: number;
  start: number;
  end: number;
}

export function clusterOccurrences(occs: Occurrence[]): Cluster[] {
  const clusters: Cluster[] = [];
  let current: Cluster | null = null;
  let laneEnds: number[] = [];
  for (const occ of [...occs].sort((a, b) => a.start - b.start)) {
    if (!current || occ.start >= current.end) {
      current = { items: [], lanes: 0, start: occ.start, end: occ.end };
      clusters.push(current);
      laneEnds = [];
    }
    let lane = laneEnds.findIndex((end) => end <= occ.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(occ.end);
    } else {
      laneEnds[lane] = occ.end;
    }
    current.items.push({ occ, lane });
    current.lanes = Math.max(current.lanes, laneEnds.length);
    current.end = Math.max(current.end, occ.end);
  }
  return clusters;
}
