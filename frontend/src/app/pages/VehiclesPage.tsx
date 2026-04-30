import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Car, Activity, History } from 'lucide-react';
import { Modal } from '../../shared/components/Modal';
import { useApp, type Vehicle } from '../context/AppContext';

const inputClass = "w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
const labelClass = "text-xs font-medium text-slate-400 uppercase tracking-wider";

const colorDot: Record<string, string> = {
  'Серебристый': 'bg-slate-400',
  'Синий': 'bg-blue-500',
  'Чёрный': 'bg-slate-900 border border-slate-600',
  'Белый': 'bg-white',
  'Красный': 'bg-red-500',
  'Серый': 'bg-slate-500',
};

// ─── Vehicle Detail Modal ──────────────────────────────────────────────────────

function VehicleDetailModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [tab, setTab] = useState<'info' | 'history'>('info');

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-5">
        <button
          onClick={() => setTab('info')}
          className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${tab === 'info' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Информация
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2.5 text-sm border-b-2 transition-colors flex items-center gap-2 ${tab === 'history' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <History size={14} />
          История ТО
          {vehicle.serviceRecords.length > 0 && (
            <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">{vehicle.serviceRecords.length}</span>
          )}
        </button>
      </div>

      {tab === 'info' && (
        <div className="space-y-2.5">
          {[
            { label: 'Владелец', value: vehicle.owner },
            { label: 'Телефон', value: vehicle.ownerPhone },
            { label: 'Гос. номер', value: vehicle.licensePlate },
            { label: 'Цвет', value: vehicle.color },
            { label: 'VIN', value: vehicle.vin },
            { label: 'Пробег', value: `${vehicle.mileage.toLocaleString()} км` },
            { label: 'Последнее ТО', value: vehicle.lastService },
            { label: 'Следующее ТО', value: vehicle.nextService },
            { label: 'Посещений сервиса', value: vehicle.serviceRecords.length },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {vehicle.serviceRecords.length === 0 ? (
            <div className="text-center py-10">
              <History size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">История обслуживания пуста</p>
              <p className="text-slate-600 text-xs mt-1">Записи появятся после завершения заказов</p>
            </div>
          ) : (
            vehicle.serviceRecords.map((record, idx) => (
              <div key={idx} className="bg-slate-700/40 border border-slate-700 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">{record.date}</p>
                    <p className="text-xs text-blue-400 mt-0.5">{record.orderNumber}</p>
                  </div>
                  <p className="text-sm font-semibold text-white">₽{record.totalCost.toLocaleString()}</p>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {record.services.map(s => (
                    <span key={s} className="text-xs bg-slate-600 text-slate-300 border border-slate-500 px-2 py-0.5 rounded-md">{s}</span>
                  ))}
                </div>

                {/* Parts */}
                {record.parts.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {record.parts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{p.name} × {p.quantity}</span>
                        <span className="text-slate-500">₽{(p.quantity * p.unitPrice).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {record.mechanic && (
                  <p className="text-xs text-slate-500 border-t border-slate-600 pt-2 mt-2">
                    Мастер: <span className="text-slate-400">{record.mechanic}</span>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit Vehicle Modal ────────────────────────────────────────────────────────

function EditVehicleModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const { updateVehicle } = useApp();
  const [form, setForm] = useState({
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    licensePlate: vehicle.licensePlate,
    vin: vehicle.vin,
    owner: vehicle.owner,
    ownerPhone: vehicle.ownerPhone,
    color: vehicle.color,
    mileage: String(vehicle.mileage),
    lastService: vehicle.lastService,
    nextService: vehicle.nextService,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicle(vehicle.id, {
      make: form.make,
      model: form.model,
      year: Number(form.year) || vehicle.year,
      licensePlate: form.licensePlate,
      vin: form.vin,
      owner: form.owner,
      ownerPhone: form.ownerPhone,
      color: form.color,
      mileage: Number(form.mileage) || 0,
      lastService: form.lastService,
      nextService: form.nextService,
    });
    onClose();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Марка</span>
          <input className={inputClass} value={form.make} onChange={e => setForm(p => ({ ...p, make: e.target.value }))} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Модель</span>
          <input className={inputClass} value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Год</span>
          <input type="number" className={inputClass} value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Гос. номер</span>
          <input className={inputClass} value={form.licensePlate} onChange={e => setForm(p => ({ ...p, licensePlate: e.target.value }))} />
        </label>
        <label className="col-span-2 flex flex-col gap-1.5">
          <span className={labelClass}>VIN</span>
          <input className={inputClass} value={form.vin} onChange={e => setForm(p => ({ ...p, vin: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Владелец</span>
          <input className={inputClass} value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Телефон</span>
          <input className={inputClass} value={form.ownerPhone} onChange={e => setForm(p => ({ ...p, ownerPhone: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Цвет</span>
          <input className={inputClass} value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Пробег, км</span>
          <input type="number" min={0} className={inputClass} value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Последнее ТО</span>
          <input type="date" className={inputClass} value={form.lastService} onChange={e => setForm(p => ({ ...p, lastService: e.target.value }))} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Следующее ТО</span>
          <input type="date" className={inputClass} value={form.nextService} onChange={e => setForm(p => ({ ...p, nextService: e.target.value }))} />
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
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function VehiclesPage() {
  const { vehicles, addVehicle, deleteVehicle } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: '', model: '', year: '', licensePlate: '', vin: '',
    owner: '', ownerPhone: '', color: '', mileage: '',
    lastService: '', nextService: '',
  });

  const filteredVehicles = vehicles.filter(vehicle => {
    const q = searchTerm.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(q) ||
      vehicle.model.toLowerCase().includes(q) ||
      vehicle.licensePlate.toLowerCase().includes(q) ||
      vehicle.owner.toLowerCase().includes(q) ||
      vehicle.vin.toLowerCase().includes(q)
    );
  });

  const isServiceDue = (nextServiceDate: string) => {
    const today = new Date();
    const serviceDate = new Date(nextServiceDate);
    const days = Math.floor((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days <= 30;
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    addVehicle({
      make: newVehicle.make || 'Неизвестно',
      model: newVehicle.model || '',
      year: Number(newVehicle.year) || new Date().getFullYear(),
      licensePlate: newVehicle.licensePlate || '',
      vin: newVehicle.vin || '',
      owner: newVehicle.owner || '',
      ownerPhone: newVehicle.ownerPhone || '',
      color: newVehicle.color || '',
      mileage: Number(newVehicle.mileage) || 0,
      lastService: newVehicle.lastService || today,
      nextService: newVehicle.nextService || today,
    });
    setNewVehicle({ make: '', model: '', year: '', licensePlate: '', vin: '', owner: '', ownerPhone: '', color: '', mileage: '', lastService: '', nextService: '' });
    setShowAddVehicle(false);
  };

  // Keep detail in sync with live context
  const liveSelectedVehicle = selectedVehicle ? vehicles.find(v => v.id === selectedVehicle.id) ?? null : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Автомобили клиентов</h1>
          <p className="text-sm text-slate-500 mt-0.5">Учёт автомобилей и истории обслуживания</p>
        </div>
        <button
          onClick={() => setShowAddVehicle(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} /> Добавить авто
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Car,      label: 'Всего автомобилей', value: vehicles.length,                                           color: 'bg-blue-500',    glow: 'shadow-blue-500/20' },
          { icon: Calendar, label: 'ТО скоро',           value: vehicles.filter(v => isServiceDue(v.nextService)).length, color: 'bg-amber-500',   glow: 'shadow-amber-500/20' },
          { icon: Activity, label: 'Всего обслуживаний', value: vehicles.reduce((s, v) => s + v.serviceRecords.length, 0), color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Поиск по марке, модели, гос. номеру, владельцу или VIN..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col">
            {/* Card header */}
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg shrink-0">
                    <Car size={18} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono">
                        {vehicle.licensePlate}
                      </span>
                      {colorDot[vehicle.color] && (
                        <div className={`w-3 h-3 rounded-full ${colorDot[vehicle.color]}`} title={vehicle.color} />
                      )}
                    </div>
                  </div>
                </div>
                {isServiceDue(vehicle.nextService) && (
                  <span className="shrink-0 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2 py-1 rounded-full">
                    ТО скоро
                  </span>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="p-5 space-y-2 flex-1">
              {[
                { label: 'Владелец', value: vehicle.owner },
                { label: 'Телефон', value: vehicle.ownerPhone },
                { label: 'Пробег', value: `${vehicle.mileage.toLocaleString()} км` },
                { label: 'Следующее ТО', value: vehicle.nextService },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs text-slate-300 font-medium">{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">Обслуживаний</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full">
                  {vehicle.serviceRecords.length} записей
                </span>
              </div>
            </div>

            {/* Card footer */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <Eye size={14} /> Подробнее
                </button>
                <button
                  onClick={() => setEditVehicle(vehicle)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => deleteVehicle(vehicle.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-500">Автомобили не найдены</p>
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!liveSelectedVehicle}
        title={liveSelectedVehicle ? `${liveSelectedVehicle.year} ${liveSelectedVehicle.make} ${liveSelectedVehicle.model}` : undefined}
        onClose={() => setSelectedVehicle(null)}
        size="lg"
      >
        {liveSelectedVehicle && (
          <VehicleDetailModal vehicle={liveSelectedVehicle} onClose={() => setSelectedVehicle(null)} />
        )}
      </Modal>

      {/* Edit vehicle modal */}
      <Modal
        open={!!editVehicle}
        title={editVehicle ? `Редактировать: ${editVehicle.make} ${editVehicle.model}` : undefined}
        onClose={() => setEditVehicle(null)}
      >
        {editVehicle && (
          <EditVehicleModal vehicle={editVehicle} onClose={() => setEditVehicle(null)} />
        )}
      </Modal>

      {/* Add vehicle modal */}
      <Modal open={showAddVehicle} title="Добавить автомобиль" onClose={() => setShowAddVehicle(false)}>
        <form className="space-y-4" onSubmit={handleAddVehicle}>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Марка <span className="text-red-400">*</span></span>
              <input className={inputClass} value={newVehicle.make} onChange={e => setNewVehicle(p => ({ ...p, make: e.target.value }))} required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Модель <span className="text-red-400">*</span></span>
              <input className={inputClass} value={newVehicle.model} onChange={e => setNewVehicle(p => ({ ...p, model: e.target.value }))} required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Год</span>
              <input type="number" className={inputClass} value={newVehicle.year} onChange={e => setNewVehicle(p => ({ ...p, year: e.target.value }))} placeholder={String(new Date().getFullYear())} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Гос. номер</span>
              <input className={inputClass} value={newVehicle.licensePlate} onChange={e => setNewVehicle(p => ({ ...p, licensePlate: e.target.value }))} placeholder="А123БВ77" />
            </label>
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className={labelClass}>VIN</span>
              <input className={inputClass} value={newVehicle.vin} onChange={e => setNewVehicle(p => ({ ...p, vin: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Владелец</span>
              <input className={inputClass} value={newVehicle.owner} onChange={e => setNewVehicle(p => ({ ...p, owner: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Телефон</span>
              <input className={inputClass} value={newVehicle.ownerPhone} onChange={e => setNewVehicle(p => ({ ...p, ownerPhone: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Цвет</span>
              <input className={inputClass} value={newVehicle.color} onChange={e => setNewVehicle(p => ({ ...p, color: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Пробег, км</span>
              <input type="number" min={0} className={inputClass} value={newVehicle.mileage} onChange={e => setNewVehicle(p => ({ ...p, mileage: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Последнее ТО</span>
              <input type="date" className={inputClass} value={newVehicle.lastService} onChange={e => setNewVehicle(p => ({ ...p, lastService: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Следующее ТО</span>
              <input type="date" className={inputClass} value={newVehicle.nextService} onChange={e => setNewVehicle(p => ({ ...p, nextService: e.target.value }))} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
            <button type="button" onClick={() => setShowAddVehicle(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
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
