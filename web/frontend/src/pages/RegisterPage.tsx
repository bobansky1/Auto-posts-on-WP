import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated, setToken } from '../auth';
import { register } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setLoading(true);
    try {
      const data = await register({ email, password });
      setToken(data.access_token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-100 pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-blue-500 flex items-center justify-center animate-pulse-glow">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
          <span className="font-display text-base font-700 text-white tracking-tight">AI Article Generator</span>
        </div>

        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-700 text-white mb-1 tracking-tight">Регистрация</h1>
          <p className="text-sm text-gray-400 mb-6">Создайте аккаунт для доступа к панели управления</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900/80 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all duration-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Пароль <span className="text-gray-600 font-normal">(минимум 8 символов)</span>
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900/80 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all duration-200" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Создание аккаунта...
                </span>
              ) : 'Создать аккаунт'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
