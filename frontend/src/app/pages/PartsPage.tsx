import { useState } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, TrendingDown, ShoppingCart, Bell } from 'lucide-react';
import { Modal } from '../../shared/components/Modal';
import { useApp } from '../context/AppContext';

const inputClass = "w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
const labelClass = "text-xs font-medium text-slate-400 uppercase tracking-wider";

type PartFormState = {
  name: string; sku: string; category: string; quantity: string;
  minStock: string; unitPrice: string; supplier: string; location: string;
};

const emptyForm: PartFormState = {
  name: '', sku: '', category: '', quantity: '', minStock: '', unitPrice: '', supplier: '', location: '',
};

function EditPartModal({ part, onClose }: { part: import('../context/AppContext').Part; onClose: () => void }) {
  const { updatePart } = useApp();
  const [form, setForm] = useState<PartFormState>({
    name: part.name, sku: part.sku, category: part.category,
    quantity: String(part.quantity), minStock: String(part.minStock),
    unitPrice: String(part.unitPrice), supplier: part.supplier, location: part.location,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePart(part.id, {
      name: form.name,
      sku: form.sku,
      category: form.category,
      quantity: Number(form.quantity) || 0,
      minStock: Number(form.minStock) || 0,
      unitPrice: Number(form.unitPrice) || 0,
      supplier: form.supplier,
      location: form.location,
      lastRestocked: part.lastRestocked,
    });
    onClose();
  };

  const field = (key: keyof PartFormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
  });

  return (
    <Modal open onClose={onClose} title="Редактировать запчасть">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 flex flex-col gap-1.5">
            <span className={labelClass}>Название <span className="text-red-400">*</span></span>
            <input className={inputClass} required {...field('name')} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Артикул (SKU)</span>
            <input className={inputClass} {...field('sku')} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Категория</span>
            <input className={inputClass} {...field('category')} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Количество</span>
            <input type="number" min={0} className={inputClass} {...field('quantity')} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Мин. остаток</span>
            <input type="number" min={0} className={inputClass} {...field('minStock')} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Цена за шт., ₽</span>
            <input type="number" min={0} step="0.01" className={inputClass} {...field('unitPrice')} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Ячейка</span>
            <input className={inputClass} {...field('location')} />
          </label>
          <label className="col-span-2 flex flex-col gap-1.5">
            <span className={labelClass}>Поставщик</span>
            <input className={inputClass} {...field('supplier')} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            Отмена
          </button>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function PartsPage() {
  const { parts, addPart, deletePart } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [editPart, setEditPart] = useState<import('../context/AppContext').Part | null>(null);
  const [newPart, setNewPart] = useState<PartFormState>(emptyForm);

  const categories = ['all', ...Array.from(new Set(parts.map(p => p.category)))];

  const filteredParts = parts.filter(part => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      part.name.toLowerCase().includes(q) ||
      part.sku.toLowerCase().includes(q) ||
      part.supplier.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'all' || part.category === categoryFilter;
    const matchesLowStock = !showLowStockOnly || part.quantity < part.minStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockParts = parts.filter(p => p.quantity < p.minStock);
  const totalValue = parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const isLowStock = (p: typeof parts[0]) => p.quantity < p.minStock;
  const availableQty = (p: typeof parts[0]) => p.quantity - p.reserved;

  // Group low-stock by supplier for reorder suggestions
  const reorderBySupplier = lowStockParts.reduce<Record<string, typeof parts>>((acc, p) => {
    if (!acc[p.supplier]) acc[p.supplier] = [];
    acc[p.supplier].push(p);
    return acc;
  }, {});

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    addPart({
      name: newPart.name || 'Новая запчасть',
      sku: newPart.sku || String(Date.now()),
      category: newPart.category || 'Прочее',
      quantity: Number(newPart.quantity) || 0,
      minStock: Number(newPart.minStock) || 0,
      unitPrice: Number(newPart.unitPrice) || 0,
      supplier: newPart.supplier || '',
      location: newPart.location || '',
      lastRestocked: new Date().toISOString().slice(0, 10),
    });
    setNewPart(emptyForm);
    setShowAddPart(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Склад запчастей</h1>
          <p className="text-sm text-slate-500 mt-0.5">Учёт остатков и стоимости склада</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-lg shadow-blue-600/20"
          onClick={() => setShowAddPart(true)}
        >
          <Plus size={16} /> Добавить запчасть
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package,      label: 'Всего позиций',       value: parts.length,                                            color: 'bg-blue-500',    glow: 'shadow-blue-500/20' },
          { icon: AlertTriangle, label: 'Низкий остаток',     value: lowStockParts.length,                                    color: 'bg-red-500',     glow: 'shadow-red-500/20' },
          { icon: TrendingDown, label: 'Стоимость склада',    value: `₽${totalValue.toLocaleString()}`,                       color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
          { icon: ShoppingCart, label: 'Всего единиц',        value: parts.reduce((s, p) => s + p.quantity, 0),               color: 'bg-violet-500',  glow: 'shadow-violet-500/20' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} p-2.5 rounded-lg shadow-lg ${stat.glow} shrink-0`}>
                <stat.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-xl font-semibold text-white mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-red-500/20 rounded-lg shrink-0">
              <AlertTriangle className="text-red-400" size={16} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-300">Низкий остаток</h3>
              <p className="text-sm text-red-400/80 mt-0.5">
                {lowStockParts.length} позиций близки к нулевому остатку и требуют дозаказа.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Suggestions */}
      {lowStockParts.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <Bell size={15} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Рекомендации к дозаказу</h3>
              <p className="text-xs text-slate-500 mt-0.5">Позиции, требующие пополнения — сгруппированы по поставщику</p>
            </div>
          </div>
          <div className="divide-y divide-slate-800">
            {Object.entries(reorderBySupplier).map(([supplier, items]) => (
              <div key={supplier} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">{supplier}</p>
                  <button
                    onClick={() => alert(`Сформировать заявку поставщику "${supplier}":\n${items.map(i => `• ${i.name} — ${i.minStock - i.quantity + i.minStock} шт.`).join('\n')}`)}
                    className="text-xs px-3 py-1.5 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"
                  >
                    Сформировать заявку
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map(item => {
                    const toOrder = item.minStock - item.quantity + item.minStock; // текущий дефицит + буфер
                    return (
                      <div key={item.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2.5">
                        <AlertTriangle size={14} className="text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.sku}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-red-400">Остаток: {item.quantity} / {item.minStock}</p>
                          <p className="text-xs text-amber-400 font-medium">Заказать: ~{toOrder} шт.</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Поиск по названию, артикулу или поставщику..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'Все категории' : cat}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={e => setShowLowStockOnly(e.target.checked)}
              className="accent-blue-500 rounded"
            />
            <span className="text-sm text-slate-400 whitespace-nowrap">Только низкий остаток</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-800">
                {['Запчасть', 'Категория', 'На складе', 'Доступно', 'Цена', 'Поставщик', 'Ячейка', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredParts.map(part => {
                const avail = availableQty(part);
                const low = isLowStock(part);
                const pct = Math.min(100, Math.round((part.quantity / part.minStock) * 100));
                return (
                  <tr key={part.id} className={`transition-colors ${low ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-slate-800/40'}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {low && <AlertTriangle size={13} className="text-red-400 shrink-0" />}
                        <div>
                          <div className="text-sm text-white">{part.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{part.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                        {part.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className={`text-sm font-medium ${low ? 'text-red-400' : 'text-white'}`}>{part.quantity} шт.</div>
                      <div className="text-xs text-slate-500 mt-0.5">Мин.: {part.minStock}</div>
                      <div className="mt-1.5 h-1 w-20 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${low ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className={`text-sm font-medium ${avail <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>{avail} шт.</div>
                      {part.reserved > 0 && (
                        <div className="text-xs text-slate-500 mt-0.5">Резерв: {part.reserved}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="text-sm text-white">₽{part.unitPrice.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Итого: ₽{(part.quantity * part.unitPrice).toLocaleString()}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-400">{part.supplier}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg font-mono">
                        {part.location}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditPart(part)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => deletePart(part.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredParts.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-500">Запчасти не найдены</p>
        </div>
      )}

      {/* Edit Part Modal */}
      {editPart && <EditPartModal part={editPart} onClose={() => setEditPart(null)} />}

      {/* Add Part Modal */}
      <Modal open={showAddPart} title="Добавить запчасть" onClose={() => setShowAddPart(false)}>
        <form className="space-y-4" onSubmit={handleAddPart}>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className={labelClass}>Название <span className="text-red-400">*</span></span>
              <input className={inputClass} value={newPart.name} onChange={e => setNewPart(p => ({ ...p, name: e.target.value }))} required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Артикул (SKU)</span>
              <input className={inputClass} value={newPart.sku} onChange={e => setNewPart(p => ({ ...p, sku: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Категория</span>
              <input className={inputClass} value={newPart.category} onChange={e => setNewPart(p => ({ ...p, category: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Количество</span>
              <input type="number" min={0} className={inputClass} value={newPart.quantity} onChange={e => setNewPart(p => ({ ...p, quantity: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Мин. остаток</span>
              <input type="number" min={0} className={inputClass} value={newPart.minStock} onChange={e => setNewPart(p => ({ ...p, minStock: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Цена за шт., ₽</span>
              <input type="number" min={0} step="0.01" className={inputClass} value={newPart.unitPrice} onChange={e => setNewPart(p => ({ ...p, unitPrice: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Ячейка</span>
              <input className={inputClass} value={newPart.location} onChange={e => setNewPart(p => ({ ...p, location: e.target.value }))} />
            </label>
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className={labelClass}>Поставщик</span>
              <input className={inputClass} value={newPart.supplier} onChange={e => setNewPart(p => ({ ...p, supplier: e.target.value }))} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
            <button type="button" onClick={() => setShowAddPart(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              Отмена
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
              Сохранить
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
