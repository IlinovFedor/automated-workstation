import { Link } from 'react-router-dom';
import {
  REPEAT_LABEL,
  categoryVars,
  formatDate,
  formatPermDate,
  formatTime,
  formatWeekday,
} from '@/lib/format';
import type { Lesson } from '@/types';
import { AssignmentList, CategoryTag, SubgroupChips, scheduleHref } from './LessonParts';

const DAY_NAMES = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

function permTime(minutes: number) {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Всё о паре целиком, без сокращений. Если известен конкретный день — показываем его. */
export function LessonDetails({ lesson, start, end }: { lesson: Lesson; start?: number; end?: number }) {
  const when =
    start !== undefined && end !== undefined
      ? `${formatWeekday(new Date(start))}, ${formatDate(new Date(start))} · ${formatTime(start)}–${formatTime(end)}`
      : `${DAY_NAMES[lesson.day] ?? ''} · ${permTime(lesson.time_start)}–${permTime(lesson.time_end)} по Перми`;
  const period = lesson.timetable;
  return (
    <article className="flex flex-col gap-2" style={categoryVars(lesson.category)}>
      <CategoryTag category={lesson.category} />
      <h2 className="text-lg font-bold leading-snug break-words">
        <Link to={scheduleHref('subjects', lesson.subject.id)} className="hover:text-link">
          {lesson.subject.name}
        </Link>
      </h2>
      <div className="text-sm font-medium tabular-nums">{when}</div>
      <div className="text-[13px] leading-snug text-muted">
        {REPEAT_LABEL[lesson.repeat_rule]}
        {period && (
          <>
            {' · '}
            {period.name}, {formatPermDate(Date.parse(period.date_start))} –{' '}
            {formatPermDate(Date.parse(period.date_end) - 1)}
          </>
        )}
      </div>

      {lesson.teacher_location_assignments.length > 0 && (
        <section className="mt-2 flex flex-col gap-1.5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Преподаватели и аудитории</h3>
          <AssignmentList items={lesson.teacher_location_assignments} />
        </section>
      )}
      {lesson.subgroups.length > 0 && (
        <section className="mt-2 flex flex-col gap-1.5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Группы</h3>
          <SubgroupChips items={lesson.subgroups} />
        </section>
      )}
    </article>
  );
}
