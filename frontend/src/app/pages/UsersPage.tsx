import { useState, useEffect } from 'react';
import {
  Users, Plus, Pencil, Trash2, X, Shield, Eye, EyeOff,
  UserCheck, Search,
} from 'lucide-react';
import { usersApi, type UserResponse, type UserCreate, type UserUpdate } from '../../shared/api/users.api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'admin' | 'manager' | 'mechanic';

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  mechanic: 'Механик',
};

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-red-500/15 text-red-400 border border-red-500/30',
  manager: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  mechanic: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function RoleBadge({ role }: { role: string }) {
  const r = role as Role;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[r] ?? 'bg-slate-700 text-slate-300'}`}>
      <Shield size={10} />
      {ROLE_LABELS[r] ?? role}
    </span>
  );
}

// ─── Empty form states ─────────────────────────────────────────────────────────

const EMPTY_CREATE: UserCreate = {
  username: '',
  email: '',
  password: '',
  role: 'mechanic',
  full_name: '',
  phone: '',
  position: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserResponse | null>(null);

  const [createForm, setCreateForm] = useState<UserCreate>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<UserUpdate>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    usersApi.getAll()
      .then(setUsers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ─── Derived ────────────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.full_name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const roleCount = (role: Role) => users.filter(u => u.role === role).length;

  // ─── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!createForm.username || !createForm.email || !createForm.password || !createForm.full_name) {
      setFormError('Заполните все обязательные поля');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const user = await usersApi.create(createForm);
      setUsers(prev => [user, ...prev]);
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Edit ───────────────────────────────────────────────────────────────────

  const openEdit = (u: UserResponse) => {
    setEditUser(u);
    setEditForm({
      email: u.email,
      role: u.role as Role,
      full_name: u.full_name ?? '',
      phone: u.phone ?? '',
      position: u.position ?? '',
    });
    setFormError(null);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    const data: UserUpdate = { ...editForm };
    if (!data.password) delete data.password;
    setSubmitting(true);
    setFormError(null);
    try {
      const user = await usersApi.update(editUser.id, data);
      setUsers(prev => prev.map(u => u.id === editUser.id ? user : u));
      setEditUser(null);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSubmitting(true);
    try {
      await usersApi.remove(deleteUser.id);
      setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
      setDeleteUser(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Загрузка пользователей…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        Ошибка: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Пользователи</h1>
          <p className="text-sm text-slate-500 mt-0.5">Управление учётными записями и ролями</p>
        </div>
        <button
          onClick={() => { setCreateOpen(true); setFormError(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={16} />
          Добавить пользователя
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Всего', value: users.length, icon: Users, color: 'text-blue-400' },
          { label: 'Администраторы', value: roleCount('admin'), icon: Shield, color: 'text-red-400' },
          { label: 'Менеджеры', value: roleCount('manager'), icon: UserCheck, color: 'text-amber-400' },
          { label: 'Механики', value: roleCount('mechanic'), icon: UserCheck, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени, логину, email или роли…"
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Пользователь</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Роль</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Должность</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Телефон</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Создан</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500">
                  Пользователи не найдены
                </td>
              </tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium shrink-0">
                      {initials(u.full_name)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.full_name ?? '—'}</p>
                      <p className="text-slate-500 text-xs">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">{u.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 text-slate-400">{u.position ?? '—'}</td>
                <td className="px-4 py-3 text-slate-400">{u.phone ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Редактировать"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteUser(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Create Modal ─────────────────────────────────────────────────────── */}
      {createOpen && (
        <Modal title="Новый пользователь" onClose={() => setCreateOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Полное имя *">
                <input
                  value={createForm.full_name}
                  onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Иван Иванов"
                  className={inputCls}
                />
              </Field>
              <Field label="Логин *">
                <input
                  value={createForm.username}
                  onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="ivan_ivanov"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Email *">
              <input
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                placeholder="ivan@example.com"
                className={inputCls}
              />
            </Field>

            <Field label="Пароль *">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Минимум 6 символов"
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Роль *">
                <select
                  value={createForm.role}
                  onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as Role }))}
                  className={inputCls}
                >
                  <option value="mechanic">Механик</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </Field>
              <Field label="Должность">
                <input
                  value={createForm.position ?? ''}
                  onChange={e => setCreateForm(f => ({ ...f, position: e.target.value }))}
                  placeholder="Старший механик"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Телефон">
              <input
                value={createForm.phone ?? ''}
                onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+7 999 123-45-67"
                className={inputCls}
              />
            </Field>

            {formError && <p className="text-sm text-red-400">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {submitting ? 'Создание…' : 'Создать'}
              </button>
              <button
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Edit Modal ──────────────────────────────────────────────────────── */}
      {editUser && (
        <Modal title={`Редактировать: ${editUser.username}`} onClose={() => setEditUser(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Полное имя">
                <input
                  value={editForm.full_name ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Роль">
                <select
                  value={editForm.role ?? editUser.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value as Role }))}
                  className={inputCls}
                >
                  <option value="mechanic">Механик</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </Field>
            </div>

            <Field label="Email">
              <input
                type="email"
                value={editForm.email ?? ''}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </Field>

            <Field label="Новый пароль (оставьте пустым, чтобы не менять)">
              <div className="relative">
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editForm.password ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Новый пароль"
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Должность">
                <input
                  value={editForm.position ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Телефон">
                <input
                  value={editForm.phone ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>

            {formError && <p className="text-sm text-red-400">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleEdit}
                disabled={submitting}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Delete Modal ─────────────────────────────────────────────────────── */}
      {deleteUser && (
        <Modal title="Удалить пользователя" onClose={() => setDeleteUser(null)}>
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              Вы уверены, что хотите удалить пользователя{' '}
              <span className="text-white font-medium">@{deleteUser.username}</span>?
              Это действие необратимо.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {submitting ? 'Удаление…' : 'Удалить'}
              </button>
              <button
                onClick={() => setDeleteUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
