import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, formatDayHeading, formatDuration, WEEKDAY_SHORT } from '@/lib/format';
import { addDays, occurrencesBetween, sameDay, startOfDay, type Occurrence } from '@/lib/time';
import type { Lesson, ScheduleContext } from '@/types';
import { LessonCard } from './LessonCard';

const CHUNK_DAYS = 21;
/** Перерыв короче этого — обычная перемена, а не окно. */
const MIN_WINDOW_MIN = 60;

type FeedItem =
  | { kind: 'day'; date: Date; occs: Occurrence[] }
  | { kind: 'empty'; from: Date; to: Date };

interface LessonFeedProps {
  lessons: Lesson[];
  ctx: ScheduleContext;
  /** С какого дня показывать (локальная полночь). */
  from: Date;
  today: Date;
  onOpen: (occs: Occurrence[]) => void;
}

export function LessonFeed({ lessons, ctx, from, today, onOpen }: LessonFeedProps) {
  const [days, setDays] = useState(CHUNK_DAYS);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => setDays(CHUNK_DAYS), [from]);

  // Дальше конца последнего периода расписания листать незачем.
  const lastDay = useMemo(() => {
    const end = Math.max(0, ...lessons.map((l) => Date.parse(l.timetable.date_end) || 0));
    return startOfDay(new Date(end));
  }, [lessons]);
  const to = useMemo(() => {
    const wanted = addDays(from, days);
    return wanted > lastDay ? addDays(lastDay, 1) : wanted;
  }, [from, days, lastDay]);
  const reachedEnd = addDays(from, days) > lastDay;

  const items = useMemo(() => buildItems(lessons, from, to, today), [lessons, from, to, today]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || reachedEnd) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDays((d) => d + CHUNK_DAYS);
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reachedEnd, items.length]);

  return (
    <div className="flex flex-col">
      {items.map((item) =>
        item.kind === 'empty' ? (
          <p key={`e${item.from.getTime()}`} className="border-t border-line py-3 text-sm text-muted">
            {WEEKDAY_SHORT[item.from.getDay()]}, {formatDate(item.from)} — {WEEKDAY_SHORT[item.to.getDay()]},{' '}
            {formatDate(item.to)}: пар нет
          </p>
        ) : (
          <section key={`d${item.date.getTime()}`} aria-label={formatDayHeading(item.date, today)}>
            <h2
              className={`pb-2 pt-5 text-sm font-bold ${
                sameDay(item.date, today) ? 'text-link' : 'text-ink'
              }`}
            >
              {formatDayHeading(item.date, today)}
            </h2>
            {item.occs.length === 0 ? (
              <p className="border-t border-line py-3 text-sm text-muted">Пар нет</p>
            ) : (
              <DayLessons occs={item.occs} ctx={ctx} onOpen={onOpen} />
            )}
          </section>
        ),
      )}
      {reachedEnd ? (
        <p className="border-t border-line py-6 text-center text-sm text-muted">Дальше пар в расписании нет</p>
      ) : (
        <div ref={sentinel} className="h-10" aria-hidden="true" />
      )}
    </div>
  );
}

function DayLessons({
  occs,
  ctx,
  onOpen,
}: {
  occs: Occurrence[];
  ctx: ScheduleContext;
  onOpen: (occs: Occurrence[]) => void;
}) {
  let busyUntil = -Infinity;
  return (
    <>
      {occs.map((occ) => {
        const gap = busyUntil === -Infinity ? 0 : Math.round((occ.start - busyUntil) / 60_000);
        busyUntil = Math.max(busyUntil, occ.end);
        return (
          <Fragment key={occ.key}>
            {gap >= MIN_WINDOW_MIN && (
              <div className="border-t border-dashed border-line py-1.5 pl-[60px] text-xs text-muted">
                Окно {formatDuration(gap)}
              </div>
            )}
            <LessonCard occ={occ} ctx={ctx} onOpen={() => onOpen([occ])} />
          </Fragment>
        );
      })}
    </>
  );
}

/** Дни подряд без пар схлопываются в одну строку; сегодняшний день всегда отдельно. */
function buildItems(lessons: Lesson[], from: Date, to: Date, today: Date): FeedItem[] {
  const occs = occurrencesBetween(lessons, from, to);
  const byDay = new Map<number, Occurrence[]>();
  for (const occ of occs) {
    const key = startOfDay(new Date(occ.start)).getTime();
    const list = byDay.get(key);
    if (list) list.push(occ);
    else byDay.set(key, [occ]);
  }

  const items: FeedItem[] = [];
  let emptyRun: Date[] = [];
  const flush = () => {
    if (emptyRun.length === 1) items.push({ kind: 'day', date: emptyRun[0], occs: [] });
    else if (emptyRun.length > 1) items.push({ kind: 'empty', from: emptyRun[0], to: emptyRun[emptyRun.length - 1] });
    emptyRun = [];
  };

  for (let date = startOfDay(from); date < to; date = addDays(date, 1)) {
    const dayOccs = byDay.get(date.getTime()) ?? [];
    if (dayOccs.length || sameDay(date, today)) {
      flush();
      items.push({ kind: 'day', date, occs: dayOccs });
    } else {
      emptyRun.push(date);
    }
  }
  flush();
  return items;
}
