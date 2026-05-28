import { useState } from 'react';
import { useNavigate } from 'react-router';
import { setAuthSession } from '../auth/session';
import { authApi } from '../../shared/api/auth.api';
import { Wrench, Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = username.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setLoading(true);
    try {
      // POST /api/auth/login → { access_token, username, role }
      const { access_token, username: uname, role } = await authApi.login(username.trim(), password);

      // GET /api/auth/me → { full_name, ... }
      // Сохраняем токен до запроса /me чтобы он ушёл с заголовком
      localStorage.setItem('sto.auth.token', access_token);
      const me = await authApi.me();

      setAuthSession(access_token, {
        username: uname,
        fullName: me.full_name ?? uname,
        role,
      });

      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-4">
            <Wrench size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">АвтоСервис</h1>
          <p className="text-sm text-slate-500 mt-1">Система управления СТО</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Вход в систему</h2>
          <p className="text-sm text-slate-500 mb-6">Введите данные, чтобы продолжить</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Логин</label>
              <input
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Введите логин"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Введите пароль"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
