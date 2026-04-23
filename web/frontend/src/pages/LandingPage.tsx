import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated } from '../auth';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* Фоновые элементы */}
      <div className="fixed inset-0 bg-grid opacity-100 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      {/* Шапка */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center animate-pulse-glow">
            <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
          <span className="font-display text-base font-700 tracking-tight">AI Article Generator</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/login"
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">
            Войти
          </Link>
          <Link to="/register"
            className="px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-500 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25">
            Зарегистрироваться
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">

          {/* Бейдж */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-violet-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Powered by OpenRouter · GPT-4o · Claude · Llama
          </div>

          {/* Заголовок */}
          <h1 className="animate-fade-up-delay1 font-display text-6xl font-800 leading-[1.05] tracking-tight mb-6">
            <span className="text-gradient-animated">Генерируй статьи</span>
            <br />
            <span className="text-white">с помощью ИИ</span>
          </h1>

          {/* Подзаголовок */}
          <p className="animate-fade-up-delay2 text-lg text-gray-400 leading-relaxed mb-10 max-w-lg mx-auto">
            Создавай качественный контент и публикуй прямо в WordPress — с изображениями, SEO-метатегами и отложенной публикацией.
          </p>

          {/* CTA кнопки */}
          <div className="animate-fade-up-delay3 flex items-center justify-center gap-4 mb-16">
            <Link to="/register"
              className="group px-7 py-3.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 rounded-xl transition-all duration-200 shadow-lg shadow-violet-900/50 hover:shadow-violet-500/40 hover:-translate-y-0.5">
              Начать бесплатно
              <span className="ml-2 group-hover:translate-x-1 inline-block transition-transform duration-200">→</span>
            </Link>
            <Link to="/login"
              className="px-7 py-3.5 text-sm font-semibold text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
              Войти в аккаунт
            </Link>
          </div>

          {/* Фичи */}
          <div className="animate-fade-up-delay4 grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {[
              { icon: '✦', text: 'Статьи 1500+ слов' },
              { icon: '◈', text: '2–3 AI-изображения' },
              { icon: '⬡', text: 'Yoast SEO + slug' },
            ].map((f) => (
              <div key={f.text} className="glass rounded-xl px-4 py-3 text-center hover:border-violet-700/40 transition-colors duration-200">
                <div className="text-violet-400 text-lg mb-1">{f.icon}</div>
                <p className="text-xs text-gray-400 font-medium">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center animate-fade-in">
        <p className="text-xs text-gray-700">Powered by Bobansky</p>
      </footer>
    </div>
  );
}
