import { setTheme, useThemeMode } from '@/lib/theme';
import type { ThemeMode } from '@/types';
import { MenuSection } from './AppBar';

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Как в системе' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

export function ThemeSwitch() {
  const mode = useThemeMode();
  return (
    <MenuSection title="Тема">
      <div className="grid grid-cols-3 border border-line" role="radiogroup" aria-label="Тема">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={mode === o.value}
            onClick={() => setTheme(o.value)}
            className={`px-2 py-2 text-[13px] font-medium transition-colors ${
              mode === o.value ? 'bg-accent text-white' : 'text-ink hover:bg-panel'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </MenuSection>
  );
}
