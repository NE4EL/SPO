import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  ClipboardList,
  Car,
  Package,
  Menu,
  X,
  Bell,
  AlertTriangle,
  Wrench,
  ChevronRight,
  Users,
  BrainCircuit,
} from 'lucide-react';
import { useLowStockNotifications } from '../../shared/hooks/useLowStockNotifications';
import { getAuthUser } from '../auth/session';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const lowStockItems = useLowStockNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const user = getAuthUser();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Дашборд', exact: true },
    { path: '/orders', icon: ClipboardList, label: 'Заказы' },
    { path: '/vehicles', icon: Car, label: 'Автомобили' },
    { path: '/warehouse', icon: Package, label: 'Склад запчастей' },
    ...(user?.role !== 'mechanic' ? [{ path: '/ai', icon: BrainCircuit, label: 'AI-анализ' }] : []),
    ...(user?.role === 'admin' ? [{ path: '/users', icon: Users, label: 'Пользователи' }] : []),
  ];

  const initials = user
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || 'U'
    : 'U';

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo area */}
        <div className={`flex items-center border-b border-slate-800 px-4 py-5 ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0">
                <Wrench size={16} className="text-white" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-white text-sm font-semibold leading-none">АвтоСервис</p>
                <p className="text-slate-500 text-xs mt-0.5">Управление СТО</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className="shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="text-sm flex-1">{item.label}</span>
                      {isActive && <ChevronRight size={14} className="opacity-70" />}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user area */}
        {user && (
          <div className={`p-3 border-t border-slate-800 ${!sidebarOpen && 'flex justify-center'}`}>
            <button
              onClick={() => navigate('/profile')}
              className={`flex items-center gap-3 rounded-lg hover:bg-slate-800 transition-colors ${sidebarOpen ? 'w-full px-3 py-2' : 'p-2'}`}
              title={!sidebarOpen ? user.fullName : undefined}
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shrink-0">
                {initials}
              </div>
              {sidebarOpen && (
                <div className="text-left overflow-hidden">
                  <p className="text-sm text-white truncate leading-none">{user.fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">@{user.username}</p>
                </div>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Панель управления СТО</h2>
              <p className="text-xs text-slate-500 mt-0.5">Сервисный центр</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Bell size={20} />
                  {lowStockItems.length > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {lowStockItems.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl z-50">
                    <div className="p-4 border-b border-slate-700">
                      <h3 className="text-sm font-medium text-white">Оповещения</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Низкий остаток на складе</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {lowStockItems.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                          Нет оповещений
                        </div>
                      ) : (
                        lowStockItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-1.5 bg-red-500/10 rounded-lg shrink-0">
                                <AlertTriangle size={14} className="text-red-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-white">{item.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Остаток: {item.quantity} шт. · Минимум: {item.minStock}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Артикул: {item.sku}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
