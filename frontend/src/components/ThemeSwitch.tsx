import { setTheme, useThemeMode } from '@/lib/theme';
import type { ThemeMode } from '@/types';
import { MenuSection, Segmented } from './AppBar';

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Как в системе' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

export function ThemeSwitch() {
  const mode = useThemeMode();
  return (
    <MenuSection title="Тема">
      <Segmented label="Тема" value={mode} options={OPTIONS} onChange={setTheme} />
    </MenuSection>
  );
}
