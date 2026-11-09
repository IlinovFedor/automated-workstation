import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MenuIcon, CloseIcon } from './icons';

interface AppBarProps {
  /** Одна строка; длинное название обрезается многоточием. */
  title: string;
  /** Если задано, название — ссылка со стрелкой ▾ (например, на выбор другого расписания). */
  titleHref?: string;
  titleHint?: string;
  actions?: ReactNode;
  /** Содержимое меню за синей квадратной кнопкой, как на pstu.ru. */
  menu: (close: () => void) => ReactNode;
  /** Прятать шапку при прокрутке страницы вниз и показывать при прокрутке вверх. */
  autoHide?: boolean;
}

export function AppBar({ title, titleHref, titleHint, actions, menu, autoHide = false }: AppBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const menuId = useId();
  const [focusInside, setFocusInside] = useState(false);
  const hidden = useHideOnScroll(autoHide && !open && !focusInside);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header
      ref={ref}
      onFocus={() => setFocusInside(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusInside(false);
      }}
      className={`pt-safe sticky top-0 z-40 border-b border-line bg-page transition-transform duration-200 ${
        hidden ? '-translate-y-full' : ''
      }`}
    >
      <div className="flex h-[52px] items-stretch">
        <h1 className="flex min-w-0 flex-1 items-stretch text-[17px] font-bold">
          {titleHref ? (
            <Link
              to={titleHref}
              className="flex min-w-0 items-center gap-1 pl-4 pr-2 transition-colors hover:bg-panel"
              title={titleHint ? `${title} — ${titleHint.toLowerCase()}` : title}
              aria-label={titleHint ? `${title}. ${titleHint}` : title}
            >
              <span className="truncate">{title}</span>
              <ChevronDown width={18} height={18} className="shrink-0 text-muted" />
            </Link>
          ) : (
            <span className="flex min-w-0 items-center pl-4 pr-2" title={title}>
              <span className="truncate">{title}</span>
            </span>
          )}
        </h1>
        {actions && <div className="flex items-center">{actions}</div>}
        <button
          type="button"
          className="flex w-[52px] shrink-0 items-center justify-center bg-accent text-white transition-colors hover:bg-[#0026BD]"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
        </button>
      </div>
      {open && (
        <div
          id={menuId}
          className="absolute inset-x-0 top-full border-b border-line bg-page shadow-[0_12px_24px_rgb(0_0_0/0.12)] md:left-auto md:right-0 md:w-80 md:border-l"
          style={{ animation: 'fade-in 120ms ease-out' }}
        >
          <div className="max-h-[calc(100dvh-80px)] overflow-y-auto px-4 py-3">{menu(() => setOpen(false))}</div>
        </div>
      )}
    </header>
  );
}

/** Шапка уезжает при прокрутке вниз и возвращается при небольшой прокрутке вверх. */
function useHideOnScroll(enabled: boolean): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return;
    }
    let last = window.scrollY;
    let upTravel = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      last = y;
      if (y < 60) {
        upTravel = 0;
        setHidden(false);
      } else if (delta > 0) {
        upTravel = 0;
        setHidden(true);
      } else if (delta < 0) {
        upTravel -= delta;
        if (upTravel > 24) setHidden(false);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled]);
  return hidden;
}

export function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-3 first:border-t-0 first:pt-1">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

/** Переключатель в меню: несколько вариантов, выбранный — синий. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="grid border border-line"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex items-center justify-center gap-1.5 px-2 py-2 text-[13px] font-medium transition-colors ${
            value === o.value ? 'bg-accent text-white' : 'text-ink hover:bg-panel'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
