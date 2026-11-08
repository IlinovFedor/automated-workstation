export type TableType = 'subgroups' | 'teachers' | 'locations' | 'subjects';

export const TABLES: TableType[] = ['subgroups', 'teachers', 'locations', 'subjects'];

export function isTableType(value: string | undefined): value is TableType {
  return !!value && (TABLES as string[]).includes(value);
}

export interface Entity {
  id: number;
  name: string;
}

export interface Pagination {
  page: number;
  total_pages: number;
}

export interface Timetable {
  id: number;
  name: string;
  /** Момент начала периода (UTC), обычно полночь по Перми. */
  date_start: string;
  /** Момент конца периода (UTC), не включительно. */
  date_end: string;
  /** Чётность первой недели периода: 1 — нечётная, 2 — чётная. */
  week: 1 | 2;
}

export interface TeacherLocationAssignment {
  teacher: Entity;
  location: Entity;
}

export interface Lesson {
  id: string;
  subject: Entity;
  category: string;
  /** День недели по Перми: 1 — понедельник … 7 — воскресенье. */
  day: number;
  /** Минуты от полуночи по Перми. */
  time_start: number;
  time_end: number;
  /** 0 — каждую неделю, 1 — по нечётным, 2 — по чётным. */
  repeat_rule: 0 | 1 | 2;
  timetable: Timetable;
  teacher_location_assignments: TeacherLocationAssignment[];
  subgroups: Entity[];
}

/** Чьё расписание открыто: от этого зависит, что не повторять в карточках. */
export interface ScheduleContext {
  table: TableType;
  id: number;
}

export type ViewMode = 'feed' | 'week';
export type ThemeMode = 'system' | 'light' | 'dark';
