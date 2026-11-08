import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { calendarLinks } from '@/api';
import { AppBar, MenuSection } from '@/components/AppBar';
import { CalendarIcon, GridIcon, ListIcon, OfflineIcon, SearchIcon } from '@/components/icons';
import { LessonFeed } from '@/components/LessonFeed';
import { LessonSheet } from '@/components/LessonSheet';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { WeekGrid } from '@/components/WeekGrid';
import { TABLE_LABEL } from '@/lib/format';
import { useIsDesktop, useNow, useSchedule } from '@/lib/hooks';
import { getSaved, getViewMode, setSaved, setViewMode } from '@/lib/storage';
import {
  addDays,
  fromDateInputValue,
  mondayOfLocal,
  occurrencesBetween,
  sameDay,
  startOfDay,
  timezoneNote,
  toDateInputValue,
  type Occurrence,
} from '@/lib/time';
import { isTableType, type ScheduleContext, type TableType, type ViewMode } from '@/types';

export function SchedulePage() {
  const { table, id } = useParams();
  const entityId = Number(id);
  if (!isTableType(table) || !Number.isInteger(entityId) || entityId <= 0) return <Navigate to="/" replace />;
  // key: при переходе на другое расписание состояние (неделя, дата) начинается заново.
  return <Schedule key={`${table}:${entityId}`} table={table} id={entityId} />;
}

function Schedule({ table, id }: { table: TableType; id: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const desktop = useIsDesktop();
  const now = useNow();
  const today = startOfDay(now);
  const schedule = useSchedule(table, id);
  const ctx: ScheduleContext = useMemo(() => ({ table, id }), [table, id]);

  const [view, setView] = useState<ViewMode>(getViewMode);
  const [feedFrom, setFeedFrom] = useState<Date | null>(null); // null — с сегодняшнего дня
  const [monday, setMonday] = useState(() => defaultMonday(new Date()));
  const [, setSavedVersion] = useState(0); // перерисовать после «Открывать при запуске»
  const dateInput = useRef<HTMLInputElement>(null);

  const changeView = (next: ViewMode) => {
    setView(next);
    setViewMode(next);
  };

  /* ---------- Шторка пары: её состояние живёт в адресе, чтобы ею можно было поделиться ---------- */

  const openSheet = useCallback(
    (occs: Occurrence[]) => {
      const next = new URLSearchParams();
      next.set('lesson', occs.map((o) => o.lesson.id).join(','));
      next.set('at', String(occs[0].start));
      setParams(next, { state: { sheet: true } });
    },
    [setParams],
  );

  const closeSheet = useCallback(() => {
    if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
    else setParams({}, { replace: true });
  }, [location.state, navigate, setParams]);

  const sheetItems = useMemo(() => {
    const ids = params.get('lesson')?.split(',').filter(Boolean);
    const at = Number(params.get('at'));
    if (!ids?.length || !schedule.lessons.length) return null;
    const day = startOfDay(new Date(Number.isFinite(at) && at > 0 ? at : Date.now()));
    const occs = occurrencesBetween(schedule.lessons, day, addDays(day, 1)).filter((o) => ids.includes(o.lesson.id));
    if (occs.length) return occs;
    // Ссылка на пару без конкретного дня или день не совпал — покажем пару без даты.
    const lessons = schedule.lessons.filter((l) => ids.includes(l.id));
    return lessons.length ? lessons.map((lesson) => ({ key: lesson.id, lesson, start: NaN, end: NaN })) : null;
  }, [params, schedule.lessons]);

  /* ---------- Шапка ---------- */

  const saved = getSaved();
  const isSaved = saved?.table === table && saved.id === id;
  const name = schedule.entity?.name ?? (isSaved ? saved.name : '');
  const links = calendarLinks(table, id);
  const tzNote = timezoneNote(now);

  const menu = (close: () => void) => (
    <>
      {!isSaved && schedule.entity && (
        <MenuSection title={`${TABLE_LABEL[table]}: ${schedule.entity.name}`}>
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              setSaved({ table, id, name: schedule.entity!.name });
              setSavedVersion((v) => v + 1);
              close();
            }}
          >
            Открывать при запуске
          </button>
        </MenuSection>
      )}
      <MenuSection title="В календарь">
        <ul className="flex flex-col gap-2.5 text-[15px]">
          <li>
            <a className="text-link hover:underline" href={links.webcal}>
              Подписаться (iPhone, Mac, Outlook)
            </a>
          </li>
          <li>
            <a className="text-link hover:underline" href={links.google} target="_blank" rel="noopener noreferrer">
              Google Календарь
            </a>
          </li>
          <li>
            <a className="text-link hover:underline" href={links.https} download>
              Скачать ICS-файл
            </a>
          </li>
          <li>
            <CopyLink url={links.https} />
          </li>
        </ul>
        <p className="mt-2 text-xs leading-snug text-muted">
          Подписка обновляется сама, когда меняется расписание. Скачанный файл — нет.
        </p>
      </MenuSection>
      <ThemeSwitch />
    </>
  );

  /* ---------- Панель под шапкой ---------- */

  const feedStart = feedFrom ?? today;
  const showTodayButton = view === 'feed' ? !sameDay(feedStart, today) : !sameDay(monday, defaultMonday(now));

  const goToday = () => (view === 'feed' ? setFeedFrom(null) : setMonday(defaultMonday(new Date())));

  // Появляется, только если ушли от сегодняшнего дня или недели.
  const todayFab = showTodayButton && (
    <button
      type="button"
      onClick={goToday}
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 bg-ink px-5 py-2.5 text-sm font-medium text-page shadow-[0_6px_20px_rgb(0_0_0/0.25)]"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      Сегодня
    </button>
  );

  // Переход к дате: в ленте — к дню, в неделе — к неделе с этим днём.
  const dateJump = (
    <label className="icon-btn relative h-full w-10 cursor-pointer" title="Перейти к дате">
      <CalendarIcon width={21} height={21} />
      <input
        ref={dateInput}
        type="date"
        className="absolute inset-0 cursor-pointer opacity-0"
        value={toDateInputValue(view === 'feed' ? feedStart : monday)}
        onClick={() => dateInput.current?.showPicker?.()}
        onChange={(e) => {
          const d = fromDateInputValue(e.target.value);
          if (!d) return;
          if (view === 'feed') {
            setFeedFrom(sameDay(d, today) ? null : d);
            window.scrollTo({ top: 0 });
          } else {
            setMonday(mondayOfLocal(d));
          }
        }}
        aria-label="Перейти к дате"
      />
    </label>
  );

  const staleBanner = schedule.staleSince && (
    <p className="mx-4 mt-2 flex items-start gap-2 bg-brand-yellow px-2 py-1.5 text-xs text-brand-space">
      <OfflineIcon width={16} height={16} className="mt-px shrink-0" />
      <span>
        Нет связи. Показано расписание от{' '}
        {new Date(schedule.staleSince).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}
        , оно могло измениться.
      </span>
    </p>
  );

  const viewToggle = (
    <div role="group" aria-label="Вид расписания" className="mr-1 flex">
      {(
        [
          ['feed', 'Лента', ListIcon],
          ['week', 'Неделя', GridIcon],
        ] as const
      ).map(([value, label, Icon]) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          aria-label={label}
          title={label}
          onClick={() => changeView(value)}
          className={`flex h-9 w-9 items-center justify-center transition-colors ${
            view === value ? 'bg-panel text-link' : 'text-muted hover:text-ink'
          }`}
        >
          <Icon width={20} height={20} />
        </button>
      ))}
    </div>
  );

  /* ---------- Содержимое ---------- */

  let content;
  if (schedule.loading) {
    content = <Message>Загружаем расписание…</Message>;
  } else if (schedule.error) {
    content = (
      <Message>
        Не получилось загрузить расписание. Проверьте подключение к интернету.{' '}
        <button type="button" className="text-btn" onClick={schedule.reload}>
          Повторить
        </button>
      </Message>
    );
  } else if (!schedule.lessons.length) {
    content = (
      <Message>
        В этом расписании пока нет пар.{' '}
        <Link to="/search" className="text-link hover:underline">
          Найти другое
        </Link>
      </Message>
    );
  } else if (view === 'week') {
    content = (
      <WeekGrid
        lessons={schedule.lessons}
        ctx={ctx}
        monday={monday}
        now={now}
        desktop={desktop}
        onOpen={openSheet}
        onPrev={() => setMonday(addDays(monday, -7))}
        onNext={() => setMonday(addDays(monday, 7))}
      />
    );
  } else {
    content = (
      <main className="mx-auto w-full max-w-2xl px-4 pb-10">
        {tzNote && <p className="pt-3 text-xs text-muted">{tzNote}</p>}
        <LessonFeed lessons={schedule.lessons} ctx={ctx} from={feedStart} today={today} onOpen={openSheet} />
      </main>
    );
  }

  const weekLayout = view === 'week' && !schedule.loading && !schedule.error && schedule.lessons.length > 0;

  return (
    <div className={weekLayout ? 'flex h-dvh flex-col' : 'flex flex-1 flex-col'}>
      <AppBar
        title={name || TABLE_LABEL[table]}
        autoHide={view === 'feed'}
        actions={
          <>
            {viewToggle}
            {dateJump}
            <Link to="/search" className="icon-btn h-full w-10" aria-label="Найти другое расписание">
              <SearchIcon width={22} height={22} />
            </Link>
          </>
        }
        menu={menu}
      />
      {staleBanner}
      {content}
      {!schedule.loading && !schedule.error && schedule.lessons.length > 0 && todayFab}
      {sheetItems && <LessonSheet items={sheetItems} onClose={closeSheet} />}
    </div>
  );
}

/** Неделя по умолчанию: текущая, а в воскресенье — уже следующая. */
function defaultMonday(now: Date) {
  const monday = mondayOfLocal(now);
  return now.getDay() === 0 ? addDays(monday, 7) : monday;
}

function Message({ children }: { children: ReactNode }) {
  return <p className="mx-auto w-full max-w-2xl px-4 py-12 text-center text-[15px] text-muted">{children}</p>;
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="text-left text-link hover:underline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt('Скопируйте ссылку', url);
        }
      }}
    >
      {copied ? 'Ссылка скопирована' : 'Скопировать ссылку на подписку'}
    </button>
  );
}
