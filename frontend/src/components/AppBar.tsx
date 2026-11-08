import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { MenuIcon, CloseIcon } from './icons';

interface AppBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Содержимое меню за синей квадратной кнопкой, как на pstu.ru. */
  menu: (close: () => void) => ReactNode;
}

export function AppBar({ title, subtitle, actions, menu }: AppBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

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
    <header ref={ref} className="pt-safe sticky top-0 z-30 border-b border-line bg-page">
      <div className="flex items-stretch">
        <div className="min-w-0 flex-1 py-2.5 pl-4 pr-2">
          <h1 className="line-clamp-2 text-[17px] font-bold leading-tight [overflow-wrap:anywhere]">{title}</h1>
          {subtitle && <div className="mt-0.5 text-xs text-muted">{subtitle}</div>}
        </div>
        {actions && <div className="flex items-center">{actions}</div>}
        <button
          type="button"
          className="flex w-14 shrink-0 items-center justify-center bg-accent text-white transition-colors hover:bg-[#0026BD]"
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

export function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-3 first:border-t-0 first:pt-1">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}
