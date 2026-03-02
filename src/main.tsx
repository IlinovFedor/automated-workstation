import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsPage, TimetablePage, LessonPage } from '@/pages';
import '@/index.css';

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
