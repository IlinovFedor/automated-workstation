import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { WEEKDAY_SHORT, categoryStyle, categoryVars, formatTime, plural } from '@/lib/format';
import {
  addDays,
  clusterOccurrences,
  localMinutes,
  occurrencesBetween,
  sameDay,
  type Cluster,
  type Occurrence,
} from '@/lib/time';
import type { Lesson, ScheduleContext } from '@/types';
import { ChevronLeft, ChevronRight } from './icons';

const TIME_COL = 40;
const HEAD = 44;
/** На телефоне на экране три дня, остальные — свайпом. */
const PHONE_DAYS = 3;
const MONTH_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

interface WeekGridProps {
  lessons: Lesson[];
  ctx: ScheduleContext;
  monday: Date;
  now: Date;
  desktop: boolean;
  onOpen: (occs: Occurrence[]) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekGrid({ lessons, ctx, monday, now, desktop, onOpen, onPrev, onNext }: WeekGridProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const pxPerMin = desktop ? 1.1 : 1;

  const occs = useMemo(() => occurrencesBetween(lessons, monday, addDays(monday, 7)), [lessons, monday]);

  // Пн–Сб всегда, воскресенье — только если в него есть пары.
  const days = useMemo(() => {
    const list = Array.from({ length: 6 }, (_, i) => addDays(monday, i));
    const sunday = addDays(monday, 6);
    if (occs.some((o) => sameDay(new Date(o.start), sunday))) list.push(sunday);
    return list;
  }, [monday, occs]);

  const clustersByDay = useMemo(
    () => days.map((day) => clusterOccurrences(occs.filter((o) => sameDay(new Date(o.start), day)))),
    [days, occs],
  );

  const [fromHour, toHour] = useMemo(() => {
    let min = 8 * 60;
    let max = 18 * 60;
    for (const o of occs) {
      min = Math.min(min, localMinutes(o.start));
      const endMin = sameDay(new Date(o.start), new Date(o.end)) ? localMinutes(o.end) : 24 * 60;
      max = Math.max(max, endMin);
    }
    return [Math.floor(min / 60), Math.min(24, Math.ceil(max / 60))];
  }, [occs]);

  const total = (toHour - fromHour) * 60 * pxPerMin;
  const visibleDays = desktop ? days.length : PHONE_DAYS;
  const colW = width ? Math.max(desktop ? 110 : 90, (width - TIME_COL) / visibleDays) : 110;
  const todayIdx = days.findIndex((d) => sameDay(d, now));

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // При открытии недели: на телефоне — к сегодняшнему дню, по вертикали — к «сейчас» или к первой паре.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !width) return;
    el.scrollLeft = !desktop && todayIdx > 0 ? todayIdx * colW : 0;
    const anchor =
      todayIdx >= 0 ? localMinutes(now.getTime()) : occs.length ? Math.min(...occs.map((o) => localMinutes(o.start))) : 0;
    el.scrollTop = Math.max(0, (anchor - fromHour * 60) * pxPerMin - 60);
    // Только при смене недели или появлении ширины, а не каждую минуту.
  }, [monday.getTime(), width > 0, desktop]);

  const nowTop = (localMinutes(now.getTime()) - fromHour * 60) * pxPerMin;

  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col">
      {/* Листание недель — в строке дней: ‹ в углу над временем, › у правого края. */}
      <button
        type="button"
        onClick={onPrev}
        aria-label="Предыдущая неделя"
        className="absolute left-0 top-0 z-40 flex items-center justify-center border-b border-r border-line bg-page text-ink hover:bg-panel"
        style={{ width: TIME_COL, height: HEAD }}
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Следующая неделя"
        className="absolute right-0 top-0 z-40 flex w-9 items-center justify-center border-b border-l border-line bg-page/95 text-ink hover:bg-panel"
        style={{ height: HEAD }}
      >
        <ChevronRight />
      </button>
      <div
        ref={scroller}
        className={`min-h-0 flex-1 overflow-auto overscroll-none ${desktop ? '' : 'snap-x snap-mandatory'}`}
      >
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `${TIME_COL}px repeat(${days.length}, ${colW}px)`,
            gridTemplateRows: `${HEAD}px ${total}px`,
            width: TIME_COL + colW * days.length,
          }}
        >
          <div className="sticky left-0 top-0 z-30 border-b border-line bg-page" />
          {days.map((day, i) => (
            <div
              key={day.getTime()}
              className={`sticky top-0 z-20 flex snap-start flex-col items-center justify-center border-b border-l border-line ${
                i === todayIdx ? 'bg-today' : 'bg-page'
              }`}
              style={{ scrollMarginLeft: TIME_COL }}
            >
              <span className="text-[11px] text-muted">{WEEKDAY_SHORT[day.getDay()]}</span>
              <span className={`text-[15px] font-bold tabular-nums ${i === todayIdx ? 'text-link' : ''}`}>
                {day.getDate()}{' '}
                <span className="text-[11px] font-normal text-muted">{MONTH_SHORT[day.getMonth()]}</span>
              </span>
            </div>
          ))}

          <div className="sticky left-0 z-10 border-r border-line bg-page">
            {Array.from({ length: toHour - fromHour - 1 }, (_, i) => fromHour + i + 1).map((h) => (
              <span
                key={h}
                className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-muted"
                style={{ top: (h - fromHour) * 60 * pxPerMin }}
              >
                {h}:00
              </span>
            ))}
          </div>

          {days.map((day, i) => (
            <div
              key={day.getTime()}
              className={`relative border-l border-line ${i === todayIdx ? 'bg-today/60' : ''}`}
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, rgb(var(--line)) 0 1px, transparent 1px ${60 * pxPerMin}px)`,
              }}
            >
              {clustersByDay[i].map((cluster) => (
                <ClusterCells
                  key={cluster.items[0].occ.key}
                  cluster={cluster}
                  ctx={ctx}
                  desktop={desktop}
                  top={(m) => (m - fromHour * 60) * pxPerMin}
                  pxPerMin={pxPerMin}
                  onOpen={onOpen}
                />
              ))}
              {i === todayIdx && nowTop > 0 && nowTop < total && (
                <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-now" style={{ top: nowTop }}>
                  <span className="absolute -left-1 -top-[3px] h-2 w-2 bg-now" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClusterCells({
  cluster,
  ctx,
  desktop,
  top,
  pxPerMin,
  onOpen,
}: {
  cluster: Cluster;
  ctx: ScheduleContext;
  desktop: boolean;
  top: (minutes: number) => number;
  pxPerMin: number;
  onOpen: (occs: Occurrence[]) => void;
}) {
  // На компьютере пары одного времени стоят рядом; на телефоне — первая и пометка «+N».
  if (desktop) {
    return (
      <>
        {cluster.items.map(({ occ, lane }) => (
          <Cell
            key={occ.key}
            occ={occ}
            ctx={ctx}
            style={{
              top: top(localMinutes(occ.start)),
              height: height(occ, pxPerMin),
              left: `calc(${(lane / cluster.lanes) * 100}% + 2px)`,
              width: `calc(${100 / cluster.lanes}% - 4px)`,
            }}
            onClick={() => onOpen([occ])}
          />
        ))}
      </>
    );
  }
  const first = cluster.items[0].occ;
  const extra = cluster.items.length - 1;
  return (
    <Cell
      occ={first}
      ctx={ctx}
      extra={extra}
      style={{
        top: top(localMinutes(first.start)),
        height: Math.max(height(first, pxPerMin), extra ? (cluster.end - first.start) / 60_000 * pxPerMin - 2 : 0),
        left: 2,
        right: 2,
      }}
      onClick={() => onOpen(cluster.items.map((i) => i.occ))}
    />
  );
}

const height = (occ: Occurrence, pxPerMin: number) => Math.max(22, ((occ.end - occ.start) / 60_000) * pxPerMin - 2);

function Cell({
  occ,
  ctx,
  extra = 0,
  style,
  onClick,
}: {
  occ: Occurrence;
  ctx: ScheduleContext;
  extra?: number;
  style: CSSProperties;
  onClick: () => void;
}) {
  const { lesson } = occ;
  const assignments = lesson.teacher_location_assignments;
  const single = assignments.length === 1 ? assignments[0] : null;
  const type = categoryStyle(lesson.category);
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute z-[5] flex flex-col gap-px overflow-hidden border-l-[3px] border-[var(--c)] bg-[color-mix(in_srgb,var(--c)_16%,rgb(var(--page)))] px-1 py-0.5 text-left transition-[filter] hover:brightness-95 dark:hover:brightness-110"
      style={{ ...categoryVars(lesson.category), ...style }}
      aria-label={`${type.label}: ${lesson.subject.name}, ${formatTime(occ.start)}–${formatTime(occ.end)}${extra ? `, ещё ${extra} в это время` : ''}`}
    >
      {/* Тип словом, а не только цветом; время цветом основного текста — контраст на тонированном фоне. */}
      <span className="truncate text-[10.5px] leading-tight tabular-nums text-ink">
        <b className="font-bold">{type.short}</b> · {formatTime(occ.start)}–{formatTime(occ.end)}
      </span>
      <span className="line-clamp-3 text-[11px] font-bold leading-[1.2] break-words hyphens-auto md:text-xs">
        {lesson.subject.name}
      </span>
      {single ? (
        <span className="line-clamp-2 text-[10.5px] font-medium leading-tight text-ink break-words hyphens-auto">
          {ctx.table === 'locations' ? single.teacher.name : single.location.name}
        </span>
      ) : assignments.length > 1 ? (
        <span className="text-[10.5px] font-medium leading-tight">
          {plural(assignments.length, 'преп.', 'преп.', 'преп.')} ›
        </span>
      ) : null}
      {extra > 0 && (
        <span className="absolute bottom-0.5 right-0.5 bg-ink px-1 text-[10px] font-bold leading-[15px] text-page">
          +{extra}
        </span>
      )}
    </button>
  );
}
