import { useEffect, useState } from 'react';
import { Shield, RefreshCw, Search, Filter } from 'lucide-react';
import { logsApi, AuditLog } from '../../shared/api/logs.api';

const ACTION_LABELS: Record<string, string> = {
  login:      'Вход',
  create:     'Создание',
  update:     'Изменение',
  delete:     'Удаление',
  complete:   'Завершение',
  stock_in:   'Приход',
  stock_out:  'Списание',
  ai_query:   'AI-запрос',
};

const ENTITY_LABELS: Record<string, string> = {
  user:       'Пользователь',
  work_order: 'Заказ',
  part:       'Запчасть',
  client:     'Клиент',
  vehicle:    'Автомобиль',
  stock:      'Склад',
};

const ACTION_COLORS: Record<string, string> = {
  login:    'bg-blue-500/10 text-blue-400 border-blue-500/30',
  create:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  update:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
  delete:   'bg-red-500/10 text-red-400 border-red-500/30',
  complete: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  stock_in: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  stock_out:'bg-orange-500/10 text-orange-400 border-orange-500/30',
  ai_query: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
};

const ROLE_COLORS: Record<string, string> = {
  admin:    'text-red-400',
  manager:  'text-amber-400',
  mechanic: 'text-emerald-400',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function parseDetails(raw: string | null): string {
  if (!raw) return '—';
  try {
    const obj = JSON.parse(raw);
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  } catch {
    return raw;
  }
}

const ALL_ACTIONS = ['login', 'create', 'update', 'delete', 'complete', 'stock_in', 'stock_out', 'ai_query'];
const ALL_ENTITIES = ['user', 'work_order', 'part', 'client', 'vehicle', 'stock'];

export function LogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await logsApi.getAll(500);
      setLogs(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(log => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterEntity && log.entity_type !== filterEntity) return false;
    if (search) {
      const q = search.toLowerCase();
      const user = log.user?.username ?? '';
      const details = parseDetails(log.details).toLowerCase();
      const entity = (log.entity_type ?? '').toLowerCase();
      if (!user.includes(q) && !details.includes(q) && !entity.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg">
            <Shield size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Журнал действий</h1>
            <p className="text-sm text-slate-500 mt-0.5">Аудит всех операций в системе</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Всего записей', value: logs.length },
          { label: 'Сегодня', value: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length },
          { label: 'Входов', value: logs.filter(l => l.action === 'login').length },
          { label: 'Изменений', value: logs.filter(l => ['create','update','delete'].includes(l.action)).length },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по пользователю, деталям..."
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Все действия</option>
            {ALL_ACTIONS.map(a => (
              <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
            ))}
          </select>

          <select
            value={filterEntity}
            onChange={e => setFilterEntity(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Все объекты</option>
            {ALL_ENTITIES.map(e => (
              <option key={e} value={e}>{ENTITY_LABELS[e] ?? e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-500">
            <RefreshCw size={20} className="animate-spin mr-2" /> Загрузка...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
            Записей не найдено
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-800">
                  {['#', 'Время', 'Пользователь', 'Действие', 'Объект', 'ID', 'Детали'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(log => {
                  const actionColor = ACTION_COLORS[log.action] ?? 'bg-slate-700/20 text-slate-400 border-slate-600';
                  const roleColor = ROLE_COLORS[log.user?.role ?? ''] ?? 'text-slate-400';
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-600">{log.id}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <p className="text-sm text-white">{log.user.username}</p>
                            <p className={`text-xs ${roleColor}`}>
                              {log.user.role === 'admin' ? 'Администратор' :
                               log.user.role === 'manager' ? 'Менеджер' : 'Механик'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${actionColor}`}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {log.entity_type ? (ENTITY_LABELS[log.entity_type] ?? log.entity_type) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {log.entity_id ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate" title={parseDetails(log.details)}>
                        {parseDetails(log.details)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Показано {filtered.length} из {logs.length} записей
      </p>
    </div>
  );
}
