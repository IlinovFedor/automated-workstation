import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLesson } from '@/api';
import { AppBar } from '@/components/AppBar';
import { LessonDetails } from '@/components/LessonDetails';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import type { Lesson } from '@/types';

/** Старые ссылки вида #/lesson/<id>: пара без конкретной даты. */
export function LessonPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    getLesson(id, controller.signal)
      .then(setLesson)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [id]);

  return (
    <>
      <AppBar title="Пара" menu={() => <ThemeSwitch />} />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {lesson ? (
          <LessonDetails lesson={lesson} />
        ) : failed ? (
          <p className="text-[15px] text-muted">
            Не получилось загрузить пару.{' '}
            <Link to="/" className="text-link hover:underline">
              К расписанию
            </Link>
          </p>
        ) : (
          <p className="text-[15px] text-muted">Загружаем…</p>
        )}
      </main>
    </>
  );
}
