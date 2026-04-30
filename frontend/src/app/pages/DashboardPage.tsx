import {
  TrendingUp,
  TrendingDown,
  Car,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useLowStockNotifications } from '../../shared/hooks/useLowStockNotifications';
import { useApp } from '../context/AppContext';

const monthlyRevenue = [
  { month: 'Янв', revenue: 45000 },
  { month: 'Фев', revenue: 52000 },
  { month: 'Мар', revenue: 48000 },
  { month: 'Апр', revenue: 61000 },
  { month: 'Май', revenue: 55000 },
  { month: 'Июн', revenue: 67000 },
];

const CustomTooltipRevenue = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-white font-medium">₽{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipPie = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-white font-medium">{payload[0].name}: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const STATUS_COLORS: Record<string, string> = {
  'Завершён': '#10b981',
  'В работе': '#3b82f6',
  'В ожидании': '#f59e0b',
  'Отменён': '#ef4444',
};

export function DashboardPage() {
  const { orders, vehicles, parts } = useApp();
  const lowStockItems = useLowStockNotifications();

  const totalRevenue = orders
    .filter(o => o.status === 'Завершён')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeOrders = orders.filter(o => o.status === 'В работе' || o.status === 'В ожидании').length;
  const totalParts = parts.reduce((sum, p) => sum + p.quantity, 0);

  const orderStats = ['Завершён', 'В работе', 'В ожидании', 'Отменён'].map(status => ({
    name: status,
    value: orders.filter(o => o.status === status).length,
    color: STATUS_COLORS[status],
  }));

  const recentOrders = [...orders]
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate))
    .slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Завершён':   return <CheckCircle size={14} className="text-emerald-400" />;
      case 'В работе':   return <Clock size={14} className="text-blue-400" />;
      case 'В ожидании': return <AlertTriangle size={14} className="text-amber-400" />;
      default:           return <XCircle size={14} className="text-red-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Завершён':   return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'В работе':   return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'В ожидании': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:           return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
  };

  const stats = [
    { label: 'Выручка (завершённые)', value: `₽${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-500', glow: 'shadow-emerald-500/20', change: '+12.5%', up: true },
    { label: 'Активные заказы', value: String(activeOrders), icon: Clock, color: 'bg-blue-500', glow: 'shadow-blue-500/20', change: '+8.2%', up: true },
    { label: 'Автомобилей в базе', value: String(vehicles.length), icon: Car, color: 'bg-violet-500', glow: 'shadow-violet-500/20', change: '+15.3%', up: true },
    { label: 'Запчастей на складе', value: String(totalParts), icon: Package, color: 'bg-amber-500', glow: 'shadow-amber-500/20', change: '-5.2%', up: false },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-semibold text-white mt-2">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.up
                    ? <TrendingUp size={12} className="text-emerald-400" />
                    : <TrendingDown size={12} className="text-red-400" />
                  }
                  <p className={`text-xs ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stat.change} к прошлому месяцу
                  </p>
                </div>
              </div>
              <div className={`${stat.color} p-2.5 rounded-lg shadow-lg ${stat.glow}`}>
                <stat.icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-red-500/20 rounded-lg shrink-0">
              <AlertTriangle className="text-red-400" size={16} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-300">Низкий остаток на складе</h3>
              <p className="text-sm text-red-400/80 mt-0.5">
                {lowStockItems.length} позиций заканчиваются. Проверьте склад запчастей.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-1">Выручка по месяцам</h3>
          <p className="text-xs text-slate-500 mb-4">Динамика за последние 6 месяцев</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₽${(v / 1000).toFixed(0)}к`} />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#60a5fa' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-1">Статусы заказов</h3>
          <p className="text-xs text-slate-500 mb-4">Распределение по текущим статусам</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={240}>
              <PieChart>
                <Pie data={orderStats} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {orderStats.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {orderStats.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-slate-400">{entry.name}</span>
                  </div>
                  <span className="text-xs font-medium text-white">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-medium text-white">Последние заказы</h3>
          <p className="text-xs text-slate-500 mt-0.5">Недавняя активность</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                {['Номер', 'Клиент', 'Авто', 'Услуги', 'Статус', 'Сумма'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-blue-400">{order.orderNumber}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-white">{order.customer}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-400">{order.vehicle}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-400">{order.services[0]}{order.services.length > 1 ? ` +${order.services.length - 1}` : ''}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-white">₽{order.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
