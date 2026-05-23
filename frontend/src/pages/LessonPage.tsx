import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components';
import { api } from '@/api';
import { formatTimeRange, formatDateWithYear, parseDate } from '@/utils/date';
import type { Lesson, CATEGORY_COLORS, CATEGORY_LABELS, REPEAT_RULE_LABELS, DAY_NAMES } from '@/types';

const categoryColors: typeof CATEGORY_COLORS = {
  '(лек)': 'bg-blue-500',
  '(пр)': 'bg-green-500',
  '(лаб)': 'bg-orange-500',
  '(кср)': 'bg-purple-500',
};

const categoryLabels: typeof CATEGORY_LABELS = {
  '(лек)': 'Лекция',
  '(пр)': 'Практика',
  '(лаб)': 'Лабораторная',
  '(кср)': 'КСР',
};

const repeatRuleLabels: typeof REPEAT_RULE_LABELS = {
  0: 'Каждую неделю',
  1: 'Нечётная неделя',
  2: 'Чётная неделя',
};

const dayNames: typeof DAY_NAMES = [
  '', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
];

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    api.lessons
      .get(id)
      .then(setLesson)
      .catch((err) => {
        console.error('Failed to load lesson:', err);
        setError('Не удалось загрузить информацию о паре');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error || 'Пара не найдена'}
          </div>
          <button onClick={() => navigate(-1)} className="mt-4 inline-block text-blue-600 hover:underline">
            На главную
          </button>
        </main>
      </div>
    );
  }

  const categoryColor = categoryColors[lesson.category] || 'bg-gray-500';
  const categoryLabel = categoryLabels[lesson.category] || lesson.category;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-4">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className={`${categoryColor} h-2`} />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${categoryColor} text-white`}>
                {categoryLabel}
              </span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              <Link
                to={`/timetable/subjects/${lesson.subject.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {lesson.subject.name}
              </Link>
            </h1>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatTimeRange(lesson.time_start, lesson.time_end)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{dayNames[lesson.day]}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {repeatRuleLabels[lesson.repeat_rule]}
                </div>
              </div>

              {lesson.timetable && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {lesson.timetable.name}
                    <br />
                    {formatDateWithYear(parseDate(lesson.timetable.date_start))} — {formatDateWithYear(parseDate(lesson.timetable.date_end))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {lesson.teacher_location_assignments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mt-4 p-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Преподаватели и аудитории</h2>
            <div className="space-y-2">
              {lesson.teacher_location_assignments.map((assignment, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Link
                    to={`/timetable/teachers/${assignment.teacher.id}`}
                    className="flex-1 text-blue-600 hover:underline truncate"
                  >
                    {assignment.teacher.name}
                  </Link>
                  <span className="text-gray-400">—</span>
                  <Link
                    to={`/timetable/locations/${assignment.location.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {assignment.location.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {lesson.subgroups.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mt-4 p-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Группы</h2>
            <div className="flex flex-wrap gap-2">
              {lesson.subgroups.map((subgroup) => (
                <Link
                  key={subgroup.id}
                  to={`/timetable/subgroups/${subgroup.id}`}
                  className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {subgroup.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
