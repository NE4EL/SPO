import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, Clock, AlertTriangle, XCircle, ChevronRight, Package, Lock } from 'lucide-react';
import { Modal } from '../../shared/components/Modal';
import { useApp, type Order, type OrderPart, type OrderStatus, SERVICE_TEMPLATES } from '../context/AppContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass = "w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
const labelClass = "text-xs font-medium text-slate-400 uppercase tracking-wider";

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'Завершён':   return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'В работе':   return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'В ожидании': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'Отменён':    return 'bg-red-500/10 text-red-400 border border-red-500/20';
  }
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'Завершён':   return <CheckCircle size={13} className="text-emerald-400" />;
    case 'В работе':   return <Clock size={13} className="text-blue-400" />;
    case 'В ожидании': return <AlertTriangle size={13} className="text-amber-400" />;
    case 'Отменён':    return <XCircle size={13} className="text-red-400" />;
  }
}

// ─── Parts Selector (inline) ──────────────────────────────────────────────────

interface PartsSelectorProps {
  selectedParts: OrderPart[];
  onChange: (parts: OrderPart[]) => void;
}

function PartsSelector({ selectedParts, onChange }: PartsSelectorProps) {
  const { parts } = useApp();
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState<Record<string, number>>({});

  const available = (partId: string) => {
    const p = parts.find(x => x.id === partId);
    return p ? p.quantity - p.reserved : 0;
  };

  const filtered = parts
    .filter(p =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
       p.sku.toLowerCase().includes(search.toLowerCase())) &&
      !selectedParts.some(sp => sp.partId === p.id)
    )
    .slice(0, 6);

  const addPart = (partId: string) => {
    const p = parts.find(x => x.id === partId);
    if (!p) return;
    const q = qty[partId] ?? 1;
    onChange([...selectedParts, { partId: p.id, partName: p.name, sku: p.sku, quantity: q, unitPrice: p.unitPrice }]);
    setSearch('');
    setQty(prev => { const n = { ...prev }; delete n[partId]; return n; });
  };

  const removePart = (partId: string) => {
    onChange(selectedParts.filter(sp => sp.partId !== partId));
  };

  const updateQty = (partId: string, q: number) => {
    onChange(selectedParts.map(sp => sp.partId === partId ? { ...sp, quantity: Math.max(1, q) } : sp));
  };

  return (
    <div className="space-y-3">
      {/* Selected parts list */}
      {selectedParts.length > 0 && (
        <div className="border border-slate-600 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/50 border-b border-slate-600">
                <th className="px-3 py-2 text-left text-xs text-slate-400">Запчасть</th>
                <th className="px-3 py-2 text-center text-xs text-slate-400 w-20">Кол-во</th>
                <th className="px-3 py-2 text-right text-xs text-slate-400 w-24">Цена</th>
                <th className="px-3 py-2 text-right text-xs text-slate-400 w-24">Итого</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {selectedParts.map(sp => {
                const avail = available(sp.partId);
                const insufficient = avail < sp.quantity;
                return (
                  <tr key={sp.partId} className={insufficient ? 'bg-red-500/5' : ''}>
                    <td className="px-3 py-2">
                      <div className="text-white text-xs">{sp.partName}</div>
                      {insufficient && (
                        <div className="text-red-400 text-xs mt-0.5">⚠ Доступно: {avail} шт.</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number" min={1}
                        value={sp.quantity}
                        onChange={e => updateQty(sp.partId, Number(e.target.value))}
                        className="w-16 bg-slate-700 border border-slate-600 text-white text-xs rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-slate-400">₽{sp.unitPrice.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-xs text-white font-medium">₽{(sp.quantity * sp.unitPrice).toLocaleString()}</td>
                    <td className="px-2 py-2">
                      <button onClick={() => removePart(sp.partId)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <XCircle size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Search to add part */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Добавить запчасть — поиск по названию или артикулу..."
          className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Search results */}
      {search.length > 0 && (
        <div className="border border-slate-600 rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500 text-center">Ничего не найдено</div>
          ) : (
            filtered.map(p => {
              const avail = p.quantity - p.reserved;
              return (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-700 last:border-0 hover:bg-slate-700/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.sku} · Доступно: <span className={avail <= 0 ? 'text-red-400' : 'text-emerald-400'}>{avail} шт.</span> · ₽{p.unitPrice.toLocaleString()}</div>
                  </div>
                  <input
                    type="number" min={1} max={Math.max(1, p.quantity)}
                    value={qty[p.id] ?? 1}
                    onChange={e => setQty(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                    className="w-14 bg-slate-600 border border-slate-500 text-white text-xs rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => addPart(p.id)}
                    className="px-2.5 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
                  >
                    + Добавить
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── New Order Form ────────────────────────────────────────────────────────────

function NewOrderForm({ onClose }: { onClose: () => void }) {
  const { vehicles, parts, addOrder } = useApp();

  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleText, setVehicleText] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [services, setServices] = useState('');
  const [orderParts, setOrderParts] = useState<OrderPart[]>([]);
  const [laborCost, setLaborCost] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const partsTotal = orderParts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
  const total = partsTotal + (Number(laborCost) || 0);

  const applyTemplate = () => {
    const tpl = SERVICE_TEMPLATES.find(t => t.name === selectedTemplate);
    if (!tpl) return;
    setLaborCost(String(tpl.laborCost));
    if (!services) setServices(tpl.name);
    const newParts: OrderPart[] = tpl.defaultParts
      .map(dp => {
        const p = parts.find(x => x.id === dp.partId);
        if (!p) return null;
        return { partId: p.id, partName: p.name, sku: p.sku, quantity: dp.quantity, unitPrice: p.unitPrice };
      })
      .filter(Boolean) as OrderPart[];
    setOrderParts(prev => {
      const merged = [...prev];
      newParts.forEach(np => {
        if (!merged.some(m => m.partId === np.partId)) merged.push(np);
      });
      return merged;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleName = selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.year}` : vehicleText;
    const plate = selectedVehicle ? selectedVehicle.licensePlate : licensePlate;
    const servicesArr = services.split(',').map(s => s.trim()).filter(Boolean);
    addOrder({
      customer: customer.trim() || 'Неизвестный клиент',
      phone: phone.trim(),
      vehicleId: vehicleId || undefined,
      vehicle: vehicleName || '—',
      licensePlate: plate || '—',
      services: servicesArr.length ? servicesArr : ['Общее обслуживание'],
      parts: orderParts,
      status: 'В ожидании',
      createdDate: new Date().toISOString().slice(0, 10),
      totalAmount: total,
      laborCost: Number(laborCost) || 0,
      assignedTo: assignedTo.trim() || undefined,
    });
    onClose();
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Section 1: Client */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Клиент</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>ФИО <span className="text-red-400">*</span></span>
            <input className={inputClass} value={customer} onChange={e => setCustomer(e.target.value)} required placeholder="Иванов Иван" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Телефон</span>
            <input className={inputClass} value={phone} inputMode="numeric" maxLength={11} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="79991234567" />
          </label>
        </div>
      </div>

      {/* Section 2: Vehicle */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Автомобиль</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Выбрать из базы</span>
            <select
              className={inputClass}
              value={vehicleId}
              onChange={e => { setVehicleId(e.target.value); setVehicleText(''); setLicensePlate(''); }}
            >
              <option value="">— Ввести вручную —</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.make} {v.model} {v.year} · {v.owner}</option>
              ))}
            </select>
          </label>
          {vehicleId ? (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Гос. номер</span>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono">
                {selectedVehicle?.licensePlate}
              </div>
            </div>
          ) : (
            <>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Авто (марка, модель, год)</span>
                <input className={inputClass} value={vehicleText} onChange={e => setVehicleText(e.target.value)} placeholder="Toyota Camry 2020" />
              </label>
              <label className="flex flex-col gap-1.5 col-start-1">
                <span className={labelClass}>Гос. номер</span>
                <input className={inputClass} value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="А123БВ77" />
              </label>
            </>
          )}
        </div>
      </div>

      {/* Section 3: Service Template */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Услуги</p>
        <div className="flex gap-2 mb-3">
          <select
            className={`flex-1 ${inputClass}`}
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
          >
            <option value="">— Выбрать шаблон услуги —</option>
            {SERVICE_TEMPLATES.map(t => (
              <option key={t.name} value={t.name}>{t.name} (работа ₽{t.laborCost.toLocaleString()})</option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyTemplate}
            disabled={!selectedTemplate}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Применить
          </button>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Услуги (через запятую)</span>
          <input className={inputClass} value={services} onChange={e => setServices(e.target.value)} placeholder="Замена масла, Ротация шин" />
        </label>
      </div>

      {/* Section 4: Parts */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Запчасти
          {orderParts.length > 0 && <span className="ml-2 text-blue-400 normal-case font-normal">{orderParts.length} позиций · ₽{orderParts.reduce((s, p) => s + p.quantity * p.unitPrice, 0).toLocaleString()}</span>}
        </p>
        <PartsSelector selectedParts={orderParts} onChange={setOrderParts} />
      </div>

      {/* Section 5: Cost */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Стоимость</p>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Стоимость работ, ₽</span>
            <input type="number" min={0} className={inputClass} value={laborCost} onChange={e => setLaborCost(e.target.value)} placeholder="0" />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Запчасти, ₽</span>
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300">
              ₽{partsTotal.toLocaleString()}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>ИТОГО, ₽</span>
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg px-3 py-2 text-sm text-blue-300 font-semibold">
              ₽{total.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Mechanic */}
      <div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Мастер</span>
          <input className={inputClass} value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="ФИО мастера" />
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
          Отмена
        </button>
        <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
          Создать заказ
        </button>
      </div>
    </form>
  );
}

// ─── Order Detail Modal ────────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { updateOrderStatus, deleteOrder } = useApp();

  const handleStatus = (newStatus: OrderStatus) => {
    if (newStatus === 'Завершён') {
      const ok = window.confirm(
        `Завершить заказ ${order.orderNumber}?\n\nЗапчасти будут автоматически списаны со склада:\n` +
        order.parts.map(p => `• ${p.partName} — ${p.quantity} шт.`).join('\n')
      );
      if (!ok) return;
    }
    updateOrderStatus(order.id, newStatus);
    onClose();
  };

  const partsTotal = order.parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);

  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Клиент', value: order.customer },
          { label: 'Телефон', value: order.phone || '—' },
          { label: 'Автомобиль', value: order.vehicle },
          { label: 'Гос. номер', value: order.licensePlate },
          { label: 'Мастер', value: order.assignedTo || '—' },
          { label: 'Дата создания', value: order.createdDate },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-700/40 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Services */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Услуги</p>
        <div className="flex flex-wrap gap-1.5">
          {order.services.map(s => (
            <span key={s} className="text-xs bg-slate-700 border border-slate-600 text-slate-300 px-2.5 py-1 rounded-lg">{s}</span>
          ))}
        </div>
      </div>

      {/* Parts */}
      {order.parts.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Запчасти</p>
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700/50 border-b border-slate-700">
                  <th className="px-3 py-2 text-left text-xs text-slate-400">Название</th>
                  <th className="px-3 py-2 text-center text-xs text-slate-400">Кол-во</th>
                  <th className="px-3 py-2 text-right text-xs text-slate-400">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {order.parts.map(p => (
                  <tr key={p.partId}>
                    <td className="px-3 py-2 text-sm text-white">{p.partName}</td>
                    <td className="px-3 py-2 text-center text-sm text-slate-400">{p.quantity} шт.</td>
                    <td className="px-3 py-2 text-right text-sm text-white">₽{(p.quantity * p.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-700">
                <tr className="bg-slate-700/30">
                  <td className="px-3 py-2 text-xs text-slate-400" colSpan={2}>Запчасти итого</td>
                  <td className="px-3 py-2 text-right text-sm font-medium text-white">₽{partsTotal.toLocaleString()}</td>
                </tr>
                <tr className="bg-slate-700/30">
                  <td className="px-3 py-2 text-xs text-slate-400" colSpan={2}>Стоимость работ</td>
                  <td className="px-3 py-2 text-right text-sm font-medium text-white">₽{order.laborCost.toLocaleString()}</td>
                </tr>
                <tr className="bg-blue-600/10">
                  <td className="px-3 py-2.5 text-sm font-semibold text-blue-300" colSpan={2}>ИТОГО</td>
                  <td className="px-3 py-2.5 text-right text-sm font-bold text-blue-300">₽{order.totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Status transitions */}
      {(order.status === 'В ожидании' || order.status === 'В работе') && (
        <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Изменить статус</p>
          <div className="flex flex-wrap gap-2">
            {order.status === 'В ожидании' && (
              <>
                <button
                  onClick={() => handleStatus('В работе')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <Clock size={14} /> В работе <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => handleStatus('Отменён')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <XCircle size={14} /> Отменить
                </button>
              </>
            )}
            {order.status === 'В работе' && (
              <>
                <button
                  onClick={() => handleStatus('Завершён')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  <CheckCircle size={14} /> Завершить
                  {order.parts.length > 0 && <span className="text-xs opacity-80 ml-1">— спишет запчасти</span>}
                </button>
                <button
                  onClick={() => handleStatus('Отменён')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <XCircle size={14} /> Отменить
                </button>
              </>
            )}
          </div>
          {order.status === 'В работе' && order.parts.length > 0 && (
            <p className="text-xs text-amber-400/80 mt-2">
              ⚠ При завершении будет списано {order.parts.reduce((s, p) => s + p.quantity, 0)} ед. запчастей со склада
            </p>
          )}
        </div>
      )}

      {/* Delete */}
      <div className="flex justify-end pt-1">
        <button
          onClick={() => { deleteOrder(order.id); onClose(); }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={13} /> Удалить заказ
        </button>
      </div>
    </div>
  );
}

// ─── Edit Order Modal ─────────────────────────────────────────────────────────

function EditOrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { vehicles, parts, updateOrder } = useApp();
  const canEditParts = order.status === 'В ожидании';

  const [customer, setCustomer] = useState(order.customer);
  const [phone, setPhone] = useState(order.phone);
  const [vehicleId, setVehicleId] = useState(order.vehicleId ?? '');
  const [vehicleText, setVehicleText] = useState(order.vehicle);
  const [licensePlate, setLicensePlate] = useState(order.licensePlate);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [services, setServices] = useState(order.services.join(', '));
  const [orderParts, setOrderParts] = useState<OrderPart[]>(order.parts);
  const [laborCost, setLaborCost] = useState(String(order.laborCost));
  const [assignedTo, setAssignedTo] = useState(order.assignedTo ?? '');

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const partsTotal = orderParts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
  const total = partsTotal + (Number(laborCost) || 0);

  const applyTemplate = () => {
    const tpl = SERVICE_TEMPLATES.find(t => t.name === selectedTemplate);
    if (!tpl) return;
    setLaborCost(String(tpl.laborCost));
    if (!services) setServices(tpl.name);
    if (!canEditParts) return;
    const newParts: OrderPart[] = tpl.defaultParts
      .map(dp => {
        const p = parts.find(x => x.id === dp.partId);
        if (!p) return null;
        return { partId: p.id, partName: p.name, sku: p.sku, quantity: dp.quantity, unitPrice: p.unitPrice };
      })
      .filter(Boolean) as OrderPart[];
    setOrderParts(prev => {
      const merged = [...prev];
      newParts.forEach(np => {
        if (!merged.some(m => m.partId === np.partId)) merged.push(np);
      });
      return merged;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleName = selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.year}` : vehicleText;
    const plate = selectedVehicle ? selectedVehicle.licensePlate : licensePlate;
    const servicesArr = services.split(',').map(s => s.trim()).filter(Boolean);
    updateOrder(order.id, {
      customer: customer.trim() || order.customer,
      phone: phone.trim(),
      vehicleId: vehicleId || undefined,
      vehicle: vehicleName || order.vehicle,
      licensePlate: plate || order.licensePlate,
      services: servicesArr.length ? servicesArr : order.services,
      parts: canEditParts ? orderParts : order.parts,
      laborCost: Number(laborCost) || 0,
      assignedTo: assignedTo.trim() || undefined,
    });
    onClose();
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Section 1: Client */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Клиент</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>ФИО <span className="text-red-400">*</span></span>
            <input className={inputClass} value={customer} onChange={e => setCustomer(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Телефон</span>
            <input className={inputClass} value={phone} inputMode="numeric" maxLength={11} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
          </label>
        </div>
      </div>

      {/* Section 2: Vehicle */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Автомобиль</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Выбрать из базы</span>
            <select className={inputClass} value={vehicleId} onChange={e => { setVehicleId(e.target.value); setVehicleText(''); setLicensePlate(''); }}>
              <option value="">— Ввести вручную —</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.make} {v.model} {v.year} · {v.owner}</option>
              ))}
            </select>
          </label>
          {vehicleId ? (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Гос. номер</span>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono">{selectedVehicle?.licensePlate}</div>
            </div>
          ) : (
            <>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Авто (марка, модель, год)</span>
                <input className={inputClass} value={vehicleText} onChange={e => setVehicleText(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 col-start-1">
                <span className={labelClass}>Гос. номер</span>
                <input className={inputClass} value={licensePlate} onChange={e => setLicensePlate(e.target.value)} />
              </label>
            </>
          )}
        </div>
      </div>

      {/* Section 3: Services */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Услуги</p>
        <div className="flex gap-2 mb-3">
          <select className={`flex-1 ${inputClass}`} value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
            <option value="">— Выбрать шаблон услуги —</option>
            {SERVICE_TEMPLATES.map(t => (
              <option key={t.name} value={t.name}>{t.name} (работа ₽{t.laborCost.toLocaleString()})</option>
            ))}
          </select>
          <button type="button" onClick={applyTemplate} disabled={!selectedTemplate} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
            Применить
          </button>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Услуги (через запятую)</span>
          <input className={inputClass} value={services} onChange={e => setServices(e.target.value)} />
        </label>
      </div>

      {/* Section 4: Parts */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          Запчасти
          {!canEditParts && (
            <span className="flex items-center gap-1 text-amber-400 normal-case font-normal text-xs">
              <Lock size={11} /> Запчасти нельзя изменить — заказ уже в работе
            </span>
          )}
          {canEditParts && orderParts.length > 0 && (
            <span className="text-blue-400 normal-case font-normal">{orderParts.length} позиций · ₽{orderParts.reduce((s, p) => s + p.quantity * p.unitPrice, 0).toLocaleString()}</span>
          )}
        </p>
        {canEditParts ? (
          <PartsSelector selectedParts={orderParts} onChange={setOrderParts} />
        ) : (
          <div className="border border-slate-700 rounded-lg overflow-hidden opacity-60">
            {order.parts.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-500 text-center">Запчасти не указаны</div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-700">
                  {order.parts.map(p => (
                    <tr key={p.partId}>
                      <td className="px-3 py-2 text-sm text-white">{p.partName}</td>
                      <td className="px-3 py-2 text-center text-xs text-slate-400">{p.quantity} шт.</td>
                      <td className="px-3 py-2 text-right text-xs text-white">₽{(p.quantity * p.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Cost */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Стоимость</p>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Стоимость работ, ₽</span>
            <input type="number" min={0} className={inputClass} value={laborCost} onChange={e => setLaborCost(e.target.value)} />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Запчасти, ₽</span>
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300">₽{partsTotal.toLocaleString()}</div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>ИТОГО, ₽</span>
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg px-3 py-2 text-sm text-blue-300 font-semibold">₽{total.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Section 6: Mechanic */}
      <div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Мастер</span>
          <input className={inputClass} value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="ФИО мастера" />
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
          Отмена
        </button>
        <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
          Сохранить
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const { orders } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(q) ||
      order.customer.toLowerCase().includes(q) ||
      order.vehicle.toLowerCase().includes(q) ||
      order.licensePlate.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: orders.length,
    'В ожидании': orders.filter(o => o.status === 'В ожидании').length,
    'В работе': orders.filter(o => o.status === 'В работе').length,
    'Завершён': orders.filter(o => o.status === 'Завершён').length,
    'Отменён': orders.filter(o => o.status === 'Отменён').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Управление заказами</h1>
          <p className="text-sm text-slate-500 mt-0.5">Создание и контроль заказ-нарядов</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} /> Новый заказ
        </button>
      </div>

      {/* Status Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-800 overflow-x-auto">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-3.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === status ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {status === 'all' ? 'Все заказы' : status}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${statusFilter === status ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-500'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Поиск по номеру, клиенту, авто или гос. номеру..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-800">
                {['№ заказа', 'Клиент', 'Автомобиль', 'Услуги', 'Запчасти', 'Мастер', 'Статус', 'Сумма', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-400">{order.orderNumber}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{order.createdDate}</div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="text-sm text-white">{order.customer}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{order.phone}</div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="text-sm text-white">{order.vehicle}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{order.licensePlate}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {order.services.slice(0, 2).map(s => (
                        <span key={s} className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                      {order.services.length > 2 && <span className="text-xs text-slate-500">+{order.services.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {order.parts.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Package size={12} />
                        {order.parts.length} поз.
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-400">{order.assignedTo || '—'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-white">₽{order.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setEditOrder(order)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-500">Заказы не найдены</p>
        </div>
      )}

      {/* New order modal */}
      <Modal open={showNewModal} title="Новый заказ" onClose={() => setShowNewModal(false)} size="lg">
        <NewOrderForm onClose={() => setShowNewModal(false)} />
      </Modal>

      {/* Edit order modal */}
      <Modal
        open={!!editOrder}
        title={editOrder ? `Редактировать ${editOrder.orderNumber}` : undefined}
        onClose={() => setEditOrder(null)}
        size="lg"
      >
        {editOrder && (
          <EditOrderModal
            order={orders.find(o => o.id === editOrder.id) ?? editOrder}
            onClose={() => setEditOrder(null)}
          />
        )}
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!selectedOrder}
        title={selectedOrder ? `Заказ ${selectedOrder.orderNumber}` : undefined}
        onClose={() => setSelectedOrder(null)}
        size="lg"
      >
        {selectedOrder && (
          <OrderDetailModal
            order={orders.find(o => o.id === selectedOrder.id) ?? selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </Modal>
    </div>
  );
}
