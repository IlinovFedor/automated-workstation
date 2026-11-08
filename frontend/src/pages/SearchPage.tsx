import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchEntities } from '@/api';
import { AppBar } from '@/components/AppBar';
import { SearchIcon } from '@/components/icons';
import { scheduleHref } from '@/components/LessonParts';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { TABLE_LABEL, TABLE_SECTION } from '@/lib/format';
import { getSaved, setSaved } from '@/lib/storage';
import { TABLES, type Entity, type TableType } from '@/types';

const PAGE_SIZE = 5;

interface Section {
  items: Entity[];
  page: number;
  totalPages: number;
  loadingMore: boolean;
}

type Results = Partial<Record<TableType, Section>>;

/** Одна строка поиска сразу по группам, преподавателям, аудиториям и предметам. */
export function SearchPage() {
  const navigate = useNavigate();
  const saved = getSaved();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Results>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    requestRef.current?.abort();
    if (!q) {
      setResults({});
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus('loading');
    const timer = window.setTimeout(async () => {
      const settled = await Promise.allSettled(
        TABLES.map((t) => searchEntities(t, q, 1, PAGE_SIZE, controller.signal)),
      );
      if (controller.signal.aborted) return;
      const next: Results = {};
      settled.forEach((r, i) => {
        if (r.status === 'fulfilled') next[TABLES[i]] = { ...r.value, loadingMore: false };
      });
      setResults(next);
      setStatus(settled.every((r) => r.status === 'rejected') ? 'error' : 'done');
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const loadMore = async (table: TableType) => {
    const section = results[table];
    if (!section) return;
    setResults((r) => ({ ...r, [table]: { ...section, loadingMore: true } }));
    try {
      const next = await searchEntities(table, query.trim(), section.page + 1, PAGE_SIZE);
      setResults((r) => ({
        ...r,
        [table]: { items: [...section.items, ...next.items], page: next.page, totalPages: next.totalPages, loadingMore: false },
      }));
    } catch {
      setResults((r) => ({ ...r, [table]: { ...section, loadingMore: false } }));
    }
  };

  const choose = (table: TableType, entity: Entity) => {
    setSaved({ table, id: entity.id, name: entity.name });
    navigate(scheduleHref(table, entity.id));
  };

  const found = TABLES.filter((t) => results[t]?.items.length);

  return (
    <>
      <AppBar title="PSTU-S" subtitle="Расписание ПНИПУ" menu={() => <ThemeSwitch />} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10 pt-6">
        <h2 className="text-[28px] font-bold leading-tight">Расписание</h2>
        <p className="mt-3 text-[15px] leading-relaxed">
          Введите номер группы, фамилию преподавателя, аудиторию или предмет.
        </p>

        <label className="mt-5 flex items-center gap-3 bg-panel px-4 focus-within:outline focus-within:outline-2 focus-within:outline-link">
          <SearchIcon className="shrink-0 text-ink" width={22} height={22} />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например, АД-22-1с или Воронов"
            aria-label="Поиск расписания"
            className="h-14 w-full min-w-0 bg-transparent text-base text-ink outline-none focus-visible:outline-none placeholder:text-muted"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>

        {saved && !query && (
          <p className="mt-6 text-[15px]">
            При запуске открывается:{' '}
            <Link to={scheduleHref(saved.table, saved.id)} className="text-link hover:underline">
              {saved.name || TABLE_LABEL[saved.table]}
            </Link>
          </p>
        )}

        <div aria-live="polite">
          {status === 'loading' && !found.length && <p className="mt-6 text-sm text-muted">Ищем…</p>}
          {status === 'error' && (
            <p className="mt-6 text-sm text-muted">Не получилось выполнить поиск. Проверьте подключение к интернету.</p>
          )}
          {status === 'done' && !found.length && (
            <p className="mt-6 text-sm text-muted">Ничего не нашлось. Попробуйте написать короче, например «АД-22».</p>
          )}
        </div>

        {found.map((table) => {
          const section = results[table]!;
          return (
            <section key={table} className="mt-8">
              <h3 className="border-b-2 border-ink pb-2 text-lg font-bold">{TABLE_SECTION[table]}</h3>
              <ul>
                {section.items.map((entity) => (
                  <li key={entity.id} className="border-b border-line">
                    <button
                      type="button"
                      onClick={() => choose(table, entity)}
                      className="w-full py-3 text-left text-[15px] text-link hover:underline"
                    >
                      {entity.name}
                    </button>
                  </li>
                ))}
              </ul>
              {section.page < section.totalPages && (
                <button
                  type="button"
                  className="text-btn mt-3"
                  disabled={section.loadingMore}
                  onClick={() => loadMore(table)}
                >
                  {section.loadingMore ? 'Загружаем…' : 'Показать ещё'}
                </button>
              )}
            </section>
          );
        })}
      </main>
    </>
  );
}
