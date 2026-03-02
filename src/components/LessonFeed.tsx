import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lesson } from '@/types';
import { LessonCard } from './LessonCard';
import { getLessonsForDate, generateDatesRange, formatDate, isToday } from '@/utils/date';

interface LessonFeedProps {
  lessons: Lesson[];
  loading?: boolean;
}

export function LessonFeed({ lessons, loading }: LessonFeedProps) {
  const [daysBefore, setDaysBefore] = useState(7);
  const [daysAfter, setDaysAfter] = useState(14);
  const [showTodayButton, setShowTodayButton] = useState(false);
  const [dates, setDates] = useState<Date[]>([]);
  
  const loadMoreBeforeRef = useRef<HTMLDivElement>(null);
  const loadMoreAfterRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDates(generateDatesRange(today, daysBefore, daysAfter));
  }, [daysBefore, daysAfter]);

  useEffect(() => {
    const observerBefore = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setDaysBefore((prev) => prev + 7);
        }
      },
      { threshold: 0.1 }
    );

    const observerAfter = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setDaysAfter((prev) => prev + 14);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreBeforeRef.current) {
      observerBefore.observe(loadMoreBeforeRef.current);
    }
    if (loadMoreAfterRef.current) {
      observerAfter.observe(loadMoreAfterRef.current);
    }

    return () => {
      observerBefore.disconnect();
      observerAfter.disconnect();
    };
  }, [loading]);

  useEffect(() => {
    const handleScroll = () => {
      if (!todayRef.current) return;
      const rect = todayRef.current.getBoundingClientRect();
      setShowTodayButton(rect.bottom < 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dates]);

  const scrollToToday = useCallback(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const groupedLessons = useCallback(() => {
    const groups: { date: Date; lessons: Lesson[]; isToday: boolean }[] = [];
    
    for (const date of dates) {
      const dayLessons = getLessonsForDate(lessons, date);
      if (dayLessons.length > 0) {
        groups.push({
          date,
          lessons: dayLessons.sort((a, b) => a.time_start - b.time_start),
          isToday: isToday(date),
        });
      }
    }
    
    return groups;
  }, [dates, lessons]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Расписание не найдено
      </div>
    );
  }

  const groups = groupedLessons();

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Нет занятий в выбранном периоде
      </div>
    );
  }

  return (
    <>
      <div ref={loadMoreBeforeRef} className="h-4" />
      <div ref={containerRef} className="space-y-6">
        {groups.map((group) => (
          <div 
            key={group.date.toISOString()} 
            ref={group.isToday ? todayRef : undefined}
          >
            <h2 className={`text-sm font-medium mb-2 px-1 ${group.isToday ? 'text-blue-600' : 'text-gray-500'}`}>
              {group.isToday ? 'Сегодня' : formatDate(group.date)}
            </h2>
            <div className="space-y-2">
              {group.lessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} date={group.date} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div ref={loadMoreAfterRef} className="h-4" />
      
      {showTodayButton && (
        <button
          onClick={scrollToToday}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-blue-700 transition-all active:scale-95 z-10"
        >
          Сегодня
        </button>
      )}
    </>
  );
}
