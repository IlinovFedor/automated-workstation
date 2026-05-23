import { useState, useEffect, useRef } from 'react';
import type { Lesson } from '@/types';
import { LessonCard } from './LessonCard';
import { WeekView } from './WeekView';
import { getLessonsForDate, generateDates, formatDateWithDayOfWeek, isToday } from '@/utils/date';

interface LessonFeedProps {
  lessons: Lesson[];
  loading?: boolean;
}

export function LessonFeed({ lessons, loading }: LessonFeedProps) {
  const [daysAfter, setDaysAfter] = useState(14);
  const [dates, setDates] = useState<Date[]>([]);
  const [isLandscape, setIsLandscape] = useState(false);
  
  const loadMoreAfterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeOrientation = window.matchMedia('(orientation: landscape)').matches;
      const isWideScreen = window.matchMedia('(min-width: 768px)').matches;
      setIsLandscape(isLandscapeOrientation && isWideScreen);
    };

    checkOrientation();
    
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    const wideScreenQuery = window.matchMedia('(min-width: 768px)');
    
    const handler = () => checkOrientation();
    mediaQuery.addEventListener('change', handler);
    wideScreenQuery.addEventListener('change', handler);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
      wideScreenQuery.removeEventListener('change', handler);
    };
  }, []);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDates(generateDates(today, daysAfter));
  }, [daysAfter]);

  useEffect(() => {
    const observerAfter = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setDaysAfter((prev) => prev + 14);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreAfterRef.current) {
      observerAfter.observe(loadMoreAfterRef.current);
    }

    return () => {
      observerAfter.disconnect();
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Расписание не найдено
      </div>
    );
  }

  if (isLandscape) {
    return <WeekView lessons={lessons} />;
  }

  const groupedLessons = dates.map((date) => ({
    date,
    lessons: getLessonsForDate(lessons, date).sort((a, b) => a.time_start - b.time_start),
    isToday: isToday(date),
  }));

  return (
    <div className="space-y-4">
      {groupedLessons.map((group) => (
        <div key={group.date.toISOString()}>
          <h2 className={`text-sm font-medium mb-2 px-1 ${group.isToday ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
            {group.isToday ? 'Сегодня' : formatDateWithDayOfWeek(group.date)}
          </h2>
          {group.lessons.length > 0 ? (
            <div className="space-y-2">
              {group.lessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} date={group.date} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 dark:text-gray-500 py-2 px-1">
              Нет занятий
            </div>
          )}
        </div>
      ))}
      <div ref={loadMoreAfterRef} className="h-4" />
    </div>
  );
}
