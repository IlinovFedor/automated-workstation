import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchSelect } from '@/components';
import { getSettings, saveSettings, saveTheme, applyTheme } from '@/store';
import type { TableType, AppSettings, ThemeMode } from '@/types';

const MODE_LABELS: Record<TableType, string> = {
  subgroups: 'Группа',
  teachers: 'Преподаватель',
  locations: 'Аудитория',
  subjects: 'Предмет',
};

const MODES: TableType[] = ['subgroups', 'teachers', 'locations', 'subjects'];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Системная' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>({
    mode: 'subgroups',
    entityId: null,
    entityName: '',
    theme: 'system',
  });

  useEffect(() => {
    const saved = getSettings();
    setSettings(saved);
  }, []);

  const handleModeChange = (mode: TableType) => {
    setSettings((prev) => ({
      ...prev,
      mode,
      entityId: null,
      entityName: '',
    }));
  };

  const handleEntityChange = (id: number, name: string) => {
    const newSettings: AppSettings = {
      ...settings,
      entityId: id,
      entityName: name,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    navigate(`/timetable/${newSettings.mode}/${id}`);
  };

  const handleThemeChange = (theme: ThemeMode) => {
    saveTheme(theme);
    applyTheme(theme);
    setSettings((prev) => ({ ...prev, theme }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Настройки</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Оформление</h2>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  settings.theme === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Режим просмотра</h2>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  settings.mode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Выберите {MODE_LABELS[settings.mode].toLowerCase()}
          </h2>
          <SearchSelect
            mode={settings.mode}
            value={{ id: settings.entityId, name: settings.entityName }}
            onChange={handleEntityChange}
          />
        </div>

        {settings.entityId && (
          <div className="mt-6">
            <button
              onClick={() => navigate(`/timetable/${settings.mode}/${settings.entityId}`)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Открыть расписание
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
