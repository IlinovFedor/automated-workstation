export interface Pagination {
  total_pages: number;
  page: number;
}

export interface Subgroup {
  id: number;
  name: string;
}

export interface ListSubgroups {
  pagination: Pagination;
  subgroups: Subgroup[];
}

export interface Teacher {
  id: number;
  name: string;
}

export interface ListTeachers {
  pagination: Pagination;
  teachers: Teacher[];
}

export interface Location {
  id: number;
  name: string;
}

export interface ListLocations {
  pagination: Pagination;
  locations: Location[];
}

export interface Subject {
  id: number;
  name: string;
}

export interface ListSubjects {
  pagination: Pagination;
  subjects: Subject[];
}

export interface Timetable {
  id: number;
  name: string;
  date_start: string;
  date_end: string;
  week: 1 | 2;
}

export interface ListTimetables {
  pagination: Pagination;
  timetables: Timetable[];
}

export interface TeacherLocationAssignment {
  teacher: Teacher;
  location: Location;
}

export interface Lesson {
  id: string;
  subject: Subject;
  category: string;
  day: number;
  time_start: number;
  time_end: number;
  repeat_rule: 0 | 1 | 2;
  timetable: Timetable;
  teacher_location_assignments: TeacherLocationAssignment[];
  subgroups: Subgroup[];
}

export type TableType = 'subgroups' | 'teachers' | 'locations' | 'subjects';

export interface AppSettings {
  mode: TableType;
  entityId: number | null;
  entityName: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  '(лек)': 'bg-blue-500',
  '(пр)': 'bg-green-500',
  '(лаб)': 'bg-orange-500',
  '(кср)': 'bg-purple-500',
};

export const CATEGORY_LABELS: Record<string, string> = {
  '(лек)': 'Лекция',
  '(пр)': 'Практика',
  '(лаб)': 'Лабораторная',
  '(кср)': 'КСР',
};

export const REPEAT_RULE_LABELS: Record<number, string> = {
  0: 'Каждую неделю',
  1: 'Нечётная неделя',
  2: 'Чётная неделя',
};

export const DAY_NAMES = [
  '', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
];

export const DAY_NAMES_SHORT = [
  '', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'
];
