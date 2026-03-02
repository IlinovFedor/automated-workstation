export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function formatTimeRange(start: number, end: number): string {
  return `${minutesToTime(start)} - ${minutesToTime(end)}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

export function formatDateWithYear(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getWeekNumber(date: Date, startDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const currentDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((currentDay.getTime() - startDay.getTime()) / msPerDay);
  return Math.floor(diffDays / 7) + 1;
}

export function isWeekOddForTimetable(weekNumber: number, timetableStartWeek: 1 | 2): boolean {
  return (weekNumber % 2) === (timetableStartWeek % 2);
}

export function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return d >= start && d <= end;
}

export function shouldShowLesson(
  lesson: { 
    day: number; 
    repeat_rule: 0 | 1 | 2; 
    timetable: { date_start: string; date_end: string; week: 1 | 2 } 
  },
  date: Date
): boolean {
  const dayOfWeek = getDayOfWeek(date);
  if (dayOfWeek !== lesson.day) return false;

  const startDate = parseDate(lesson.timetable.date_start);
  const endDate = parseDate(lesson.timetable.date_end);
  
  if (!isDateInRange(date, startDate, endDate)) return false;

  if (lesson.repeat_rule === 0) return true;

  const weekNumber = getWeekNumber(date, startDate);
  const isOdd = isWeekOddForTimetable(weekNumber, lesson.timetable.week);

  if (lesson.repeat_rule === 1) return isOdd;
  if (lesson.repeat_rule === 2) return !isOdd;

  return false;
}

export function getLessonsForDate(
  lessons: import('@/types').Lesson[],
  date: Date
): import('@/types').Lesson[] {
  return lessons.filter((lesson) => shouldShowLesson(lesson, date));
}

export function generateDates(startDate: Date, count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(addDays(startDate, i));
  }
  return dates;
}

export function generateDatesRange(startDate: Date, daysBefore: number, daysAfter: number): Date[] {
  const dates: Date[] = [];
  for (let i = -daysBefore; i <= daysAfter; i++) {
    dates.push(addDays(startDate, i));
  }
  return dates;
}
