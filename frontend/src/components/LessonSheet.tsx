import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Occurrence } from '@/lib/time';
import { categoryVars, plural } from '@/lib/format';
import { CloseIcon } from './icons';
import { LessonDetails } from './LessonDetails';

/**
 * Шторка с полной информацией о паре (или о нескольких парах в одно время).
 * На телефоне выезжает снизу, на компьютере — окно по центру.
 */
export function LessonSheet({ items, onClose }: { items: Occurrence[]; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Линия сверху — цвет типа пары; если в это время пары разных типов — нейтральная,
  // а у каждой пары своя цветная полоска слева.
  const mixed = new Set(items.map((o) => o.lesson.category)).size > 1;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Фокус не уходит из шторки на страницу под ней.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="presentation">
      <div
        className="absolute inset-0 bg-brand-space/50"
        style={{ animation: 'fade-in 150ms ease-out' }}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={items.length > 1 ? 'Пары в это время' : items[0].lesson.subject.name}
        className={`pb-safe relative flex max-h-[88dvh] w-full flex-col border-t-[3px] bg-page shadow-[0_-12px_32px_rgb(0_0_0/0.25)] md:max-h-[85dvh] md:max-w-lg md:border-x md:border-b md:border-x-line md:border-b-line ${
          mixed ? 'border-t-ink' : 'border-t-[color:var(--c)]'
        }`}
        style={{ ...categoryVars(items[0].lesson.category), animation: 'sheet-up 180ms ease-out' }}
      >
        {items.length > 1 && (
          <div className="border-b border-line py-2.5 pl-4 pr-12 text-sm font-medium text-muted">
            {plural(items.length, 'пара', 'пары', 'пар')} в это время
          </div>
        )}
        <button
          ref={closeRef}
          type="button"
          className="icon-btn absolute right-0 top-0 z-10 h-10 w-10"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
        <div className="overflow-y-auto overscroll-contain px-4 pb-4 pt-4">
          <div className="flex flex-col divide-y divide-line">
            {items.map((occ) => (
              <div
                key={occ.key}
                className={`py-4 first:pt-0 last:pb-1 ${mixed ? 'border-l-[3px] border-l-[color:var(--c)] pl-3' : ''}`}
                style={categoryVars(occ.lesson.category)}
              >
                <LessonDetails
                  lesson={occ.lesson}
                  start={Number.isFinite(occ.start) ? occ.start : undefined}
                  end={Number.isFinite(occ.end) ? occ.end : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
