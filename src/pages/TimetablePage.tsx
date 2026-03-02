import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LessonFeed, Header } from '@/components';
import { api } from '@/api';
import { getWebcalUrl, getIcsUrl, getGoogleCalendarUrl } from '@/store';
import type { Lesson, TableType } from '@/types';

export function TimetablePage() {
  const { table, id } = useParams<{ table: TableType; id: string }>();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const calendarMenuRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarMenuRef.current && !calendarMenuRef.current.contains(event.target as Node)) {
        setCalendarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const entityId = parseInt(id || '0', 10);

  useEffect(() => {
    if (!table || !entityId) return;

    setLoading(true);
    setError(null);

    api.lessons
      .list(table, entityId)
      .then(setLessons)
      .catch((err) => {
        console.error('Failed to load lessons:', err);
        setError('Не удалось загрузить расписание');
      })
      .finally(() => setLoading(false));
  }, [table, entityId]);

  if (!table || !entityId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Неверные параметры</p>
      </div>
    );
  }

  const webcalUrl = getWebcalUrl(table, entityId);
  const icsUrl = getIcsUrl(table, entityId);
  const googleUrl = getGoogleCalendarUrl(table, entityId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className={`${isLandscape ? 'flex flex-col h-[calc(100vh-57px)]' : 'max-w-lg'} mx-auto px-4 py-4`}>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад
          </button>
          <div className="relative" ref={calendarMenuRef}>
            <button
              onClick={() => setCalendarMenuOpen(!calendarMenuOpen)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              В календарь
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {calendarMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                <a
                  href={webcalUrl}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  WebCal (iOS/macOS)
                </a>
                <a
                  href={icsUrl}
                  download
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  ICS файл
                </a>
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Google Календарь
                </a>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className={isLandscape ? 'flex-1 overflow-hidden' : ''}>
          <LessonFeed lessons={lessons} loading={loading} />
        </div>
      </main>
    </div>
  );
}
