import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import '@fontsource/roboto/cyrillic-400.css';
import '@fontsource/roboto/cyrillic-500.css';
import '@fontsource/roboto/cyrillic-700.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import '@/index.css';
import { getSaved } from '@/lib/storage';
import { initTheme } from '@/lib/theme';
import { LessonPage } from '@/pages/LessonPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { SearchPage } from '@/pages/SearchPage';

initTheme();

/** При запуске сразу открываем основное расписание, а если его нет — поиск. */
function Home() {
  const saved = getSaved();
  return <Navigate to={saved ? `/timetable/${saved.table}/${saved.id}` : '/search'} replace />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Hash-адреса (#/timetable/…) — как в прежней версии, чтобы старые ссылки работали. */}
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/timetable/:table/:id" element={<SchedulePage />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
