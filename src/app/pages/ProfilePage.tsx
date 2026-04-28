import { useNavigate } from "react-router";
import { clearAuthUser, getAuthUser } from "../auth/session";
import { LogOut, User, AtSign, Shield } from "lucide-react";

export function ProfilePage() {
  const navigate = useNavigate();
  const user = getAuthUser();

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <div className="space-y-5 max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Профиль</h1>
          <p className="text-sm text-slate-500 mt-0.5">Данные текущего пользователя</p>
        </div>
        <button
          onClick={() => {
            clearAuthUser();
            navigate("/login", { replace: true });
          }}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
        >
          <LogOut size={15} />
          Выйти
        </button>
      </div>

      {/* Avatar card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold shadow-lg shadow-blue-600/30">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user.fullName}</h2>
            <p className="text-sm text-slate-500 mt-0.5">@{user.username}</p>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-medium text-white">Информация об аккаунте</h3>
        </div>
        <div className="divide-y divide-slate-800">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="p-2 bg-slate-800 rounded-lg">
              <User size={16} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">ФИО</p>
              <p className="text-sm text-white mt-0.5">{user.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="p-2 bg-slate-800 rounded-lg">
              <AtSign size={16} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Логин</p>
              <p className="text-sm text-white mt-0.5">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Shield size={16} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Роль</p>
              <p className="text-sm text-white mt-0.5">Администратор</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
