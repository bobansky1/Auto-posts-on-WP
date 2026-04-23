import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ArticleForm from './components/ArticleForm';
import HistoryTab from './components/HistoryTab';
import ModelsTab from './components/ModelsTab';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  generate: { title: 'Генерация статьи',  subtitle: 'Заполните форму и опубликуйте статью в WordPress' },
  history:  { title: 'История публикаций', subtitle: 'Все статьи, опубликованные через этот инструмент' },
  models:   { title: 'Настройки моделей', subtitle: 'Выберите AI-модели и параметры генерации' },
};

function DashboardApp() {
  const [activeTab, setActiveTab] = useState('generate');
  const [historyKey, setHistoryKey] = useState(0);

  function handlePublished() {
    setHistoryKey((k) => k + 1);
  }

  const { title, subtitle } = PAGE_TITLES[activeTab];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active={activeTab} onChange={setActiveTab} />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </header>

        {/* Content */}
        <div className="flex-1 px-8 py-8">
          {activeTab === 'generate' && (
            <div className="max-w-2xl">
              <ArticleForm onPublished={handlePublished} />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="max-w-3xl">
              <HistoryTab key={historyKey} />
            </div>
          )}
          {activeTab === 'models' && (
            <div className="max-w-xl">
              <ModelsTab />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardApp />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
