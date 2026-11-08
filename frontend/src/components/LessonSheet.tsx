import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Occurrence } from '@/lib/time';
import { plural } from '@/lib/format';
import { CloseIcon } from './icons';
import { LessonDetails } from './LessonDetails';

/**
 * Шторка с полной информацией о паре (или о нескольких парах в одно время).
 * На телефоне выезжает снизу, на компьютере — окно по центру.
 */
export function LessonSheet({ items, onClose }: { items: Occurrence[]; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
        role="dialog"
        aria-modal="true"
        aria-label={items.length > 1 ? 'Пары в это время' : items[0].lesson.subject.name}
        className="pb-safe relative flex max-h-[88dvh] w-full flex-col border-t-[3px] border-link bg-page shadow-[0_-12px_32px_rgb(0_0_0/0.25)] md:max-h-[85dvh] md:max-w-lg md:border-x md:border-b md:border-line md:border-t-link"
        style={{ animation: 'sheet-up 180ms ease-out' }}
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
              <div key={occ.key} className="py-4 first:pt-0 last:pb-1">
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
