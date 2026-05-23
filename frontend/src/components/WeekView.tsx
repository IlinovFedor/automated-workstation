import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/types';
import { addDays, isToday, getLessonsForDate, getDayOfWeek } from '@/utils/date';
import { DAY_NAMES_SHORT } from '@/types';

interface WeekViewProps {
  lessons: Lesson[];
}

const START_HOUR = 7;
const END_HOUR = 23;
const HOURS_COUNT = END_HOUR - START_HOUR + 1;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const categoryColors: Record<string, string> = {
  '(лек)': 'bg-blue-500',
  '(пр)': 'bg-green-500',
  '(лаб)': 'bg-orange-500',
  '(кср)': 'bg-purple-500',
};

const categoryLabels: Record<string, string> = {
  '(лек)': 'Лекция',
  '(пр)': 'Практика',
  '(лаб)': 'Лабораторная',
  '(кср)': 'КСР',
};

function getWeekDates(baseDate: Date): Date[] {
  const dayOfWeek = getDayOfWeek(baseDate);
  const monday = addDays(baseDate, 1 - dayOfWeek);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(monday, i));
  }
  return dates;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatTimeRange(start: number, end: number): string {
  return `${minutesToTime(start)} - ${minutesToTime(end)}`;
}

export function WeekView({ lessons }: WeekViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        setContainerHeight(Math.max(height - 60, 400));
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentDate, setCurrentDate] = useState<Date>(today);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const lessonsByDay = useMemo(() => {
    const result: Record<number, Lesson[]> = {};
    for (let i = 0; i < 7; i++) {
      result[i] = getLessonsForDate(lessons, weekDates[i])
        .sort((a, b) => a.time_start - b.time_start);
    }
    return result;
  }, [lessons, weekDates]);

  const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const goToCurrentWeek = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setCurrentDate(d);
  };

  const hours = Array.from({ length: HOURS_COUNT }, (_, i) => START_HOUR + i);

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.toLocaleDateString('ru-RU', { month: 'short' });
    const endMonth = end.toLocaleDateString('ru-RU', { month: 'short' });
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${startMonth}`;
    }
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth}`;
  };

  const isCurrentWeek = isToday(weekDates[3]);

  const rowHeight = Math.floor(containerHeight / (HOURS_COUNT + 1));

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full min-h-0 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-2 shrink-0 py-2">
        <button
          onClick={goToPreviousWeek}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatWeekRange()}
          </span>
          {!isCurrentWeek && (
            <button
              onClick={goToCurrentWeek}
              className="text-xs text-blue-600 hover:underline"
            >
              Сегодня
            </button>
          )}
        </div>
        <button
          onClick={goToNextWeek}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <div 
          className="relative"
          style={{ 
            display: 'grid',
            gridTemplateColumns: '50px repeat(7, 1fr)',
            gridTemplateRows: `repeat(${HOURS_COUNT + 1}, ${rowHeight}px)`,
            minHeight: containerHeight
          }}
        >
          {/* Row 1: заголовок времени пустой + заголовки дней */}
          <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700" />
          {weekDates.map((date, idx) => (
            <div
              key={idx}
              className={`text-center border-b border-l border-gray-200 dark:border-gray-700 py-1 ${
                isToday(date) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-900'
              }`}
            >
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {DAY_NAMES_SHORT[idx + 1]}
              </div>
              <div className={`text-base font-medium ${
                isToday(date) ? 'text-blue-600' : 'text-gray-900 dark:text-white'
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}

          {/* Rows 2-17: время слева + сетка дней */}
          {hours.map((hour, hourIdx) => (
            <React.Fragment key={hour}>
              <div
                className="text-sm text-gray-400 dark:text-gray-500 text-right pr-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                style={{ gridRow: hourIdx + 2 }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
              {Array.from({ length: 7 }).map((_, dayIdx) => (
                <div
                  key={`${hour}-${dayIdx}`}
                  className="border-t border-l border-gray-200 dark:border-gray-700"
                  style={{ gridRow: hourIdx + 2, gridColumn: dayIdx + 2 }}
                />
              ))}
            </React.Fragment>
          ))}

          {/* Дни с парами - абсолютное позиционирование */}
          {weekDates.map((date, dayIdx) => (
            <div
              key={`day-${dayIdx}`}
              className="relative"
              style={{ 
                gridRow: `2 / ${HOURS_COUNT + 2}`,
                gridColumn: dayIdx + 2
              }}
            >
              {lessonsByDay[dayIdx].map((lesson) => {
                const categoryColor = categoryColors[lesson.category] || 'bg-gray-500';
                const categoryLabel = categoryLabels[lesson.category] || lesson.category;
                
                const topPercent = ((lesson.time_start - START_HOUR * 60) / TOTAL_MINUTES) * 100;
                const heightPercent = ((lesson.time_end - lesson.time_start) / TOTAL_MINUTES) * 100;

                return (
                  <Link
                    key={lesson.id}
                    to={`/lesson/${lesson.id}`}
                    state={{ date }}
                    className="absolute left-0 right-0 mx-0.5 rounded-md overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow z-10 bg-white dark:bg-gray-800 flex"
                    style={{ 
                      top: `${topPercent}%`, 
                      height: `${heightPercent}%`
                    }}
                  >
                    <div className={`${categoryColor} w-1.5 shrink-0`} />
                    <div className="flex-1 p-2 overflow-y-auto min-h-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${categoryColor} text-white`}>
                          {categoryLabel}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeRange(lesson.time_start, lesson.time_end)}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {lesson.subject.name}
                      </div>
                      {lesson.teacher_location_assignments.map((assignment, idx) => (
                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <span className="truncate">
                            {assignment.teacher.name}
                          </span>
                          <span className="text-gray-400">—</span>
                          <span className="text-blue-600 shrink-0">
                            {assignment.location.name}
                          </span>
                        </div>
                      ))}
                      {lesson.subgroups.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lesson.subgroups.map((sg) => (
                            <span
                              key={sg.id}
                              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded"
                            >
                              {sg.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
