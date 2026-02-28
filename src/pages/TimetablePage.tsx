import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LessonFeed, Header } from '@/components';
import { api } from '@/api';
import { getWebcalUrl } from '@/store';
import type { Lesson, TableType } from '@/types';

export function TimetablePage() {
  const { table, id } = useParams<{ table: TableType; id: string }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Неверные параметры</p>
      </div>
    );
  }

  const webcalUrl = getWebcalUrl(table, entityId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Изменить
          </Link>
          <a
            href={webcalUrl}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            В календарь
          </a>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <LessonFeed lessons={lessons} loading={loading} />
      </main>
    </div>
  );
}
