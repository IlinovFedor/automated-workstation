import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsPage, TimetablePage, LessonPage } from '@/pages';
import { getTheme, applyTheme } from '@/store';
import '@/index.css';

const theme = getTheme();
applyTheme(theme);

if (theme === 'system') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => applyTheme('system');
  mediaQuery.addEventListener('change', handler);
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<SettingsPage />} />
      <Route path="/timetable/:table/:id" element={<TimetablePage />} />
      <Route path="/lesson/:id" element={<LessonPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
