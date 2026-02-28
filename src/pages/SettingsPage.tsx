import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchSelect } from '@/components';
import { getSettings, saveSettings } from '@/store';
import type { TableType, AppSettings } from '@/types';

const MODE_LABELS: Record<TableType, string> = {
  subgroups: 'Группа',
  teachers: 'Преподаватель',
  locations: 'Аудитория',
  subjects: 'Предмет',
};

const MODES: TableType[] = ['subgroups', 'teachers', 'locations', 'subjects'];

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>({
    mode: 'subgroups',
    entityId: null,
    entityName: '',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Режим просмотра</h2>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  settings.mode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-3">
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
