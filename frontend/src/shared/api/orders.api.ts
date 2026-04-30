import { http } from './client';
import type { Order, OrderStatus } from '../../app/context/AppContext';

// Статусы на бэкенде отличаются от фронта
const STATUS_TO_BACKEND: Record<OrderStatus, string> = {
  'В ожидании': 'pending',
  'В работе':   'in_progress',
  'Завершён':   'completed',
  'Отменён':    'cancelled',
};

const STATUS_TO_FRONTEND: Record<string, OrderStatus> = {
  'pending':     'В ожидании',
  'in_progress': 'В работе',
  'completed':   'Завершён',
  'cancelled':   'Отменён',
};

// Тип данных как приходит с бэкенда
export interface WorkOrderResponse {
  id: number;
  order_number: string;
  vehicle_id: number;
  mechanic_id: number | null;
  status: string;          // pending | in_progress | completed | cancelled
  created_at: string;
  completed_at: string | null;
  total_cost: number;
  notes: string | null;    // TODO: бэкенд хранит услуги в notes или отдельном поле?
}

// Маппинг бэкенд → фронт
export function mapOrder(o: WorkOrderResponse): Order {
  return {
    id: String(o.id),
    orderNumber: o.order_number,
    customer: '',           // TODO: получать из клиента через vehicle_id
    phone: '',              // TODO: получать из клиента через vehicle_id
    vehicleId: String(o.vehicle_id),
    vehicle: '',            // TODO: получать из vehicle
    licensePlate: '',       // TODO: получать из vehicle
    services: o.notes ? o.notes.split(',').map(s => s.trim()) : [],
    parts: [],              // TODO: получать из /api/work-orders/{id}/parts
    status: STATUS_TO_FRONTEND[o.status] ?? 'В ожидании',
    createdDate: o.created_at.slice(0, 10),
    completedDate: o.completed_at?.slice(0, 10),
    totalAmount: o.total_cost,
    laborCost: 0,           // TODO: уточнить у бэкенда поле laborCost
    assignedTo: o.mechanic_id ? String(o.mechanic_id) : undefined,
  };
}

// GET    /api/work-orders/               → WorkOrderResponse[]
// POST   /api/work-orders/               → WorkOrderResponse
// PUT    /api/work-orders/{id}           → WorkOrderResponse  (обновление полей)
// PUT    /api/work-orders/{id}           → WorkOrderResponse  (смена статуса через status поле)
// POST   /api/work-orders/{id}/complete  → завершение заказа
// DELETE /api/work-orders/{id}           → 204
export const ordersApi = {
  getAll: () =>
    http.get<WorkOrderResponse[]>('/api/work-orders/').then(list => list.map(mapOrder)),

  create: (data: Omit<Order, 'id' | 'orderNumber'>) =>
    http.post<WorkOrderResponse>('/api/work-orders/', {
      vehicle_id: data.vehicleId ? Number(data.vehicleId) : null,
      mechanic_id: data.assignedTo ? Number(data.assignedTo) : null,
      notes: data.services.join(', '),
    }).then(mapOrder),

  update: (id: string, data: Partial<Pick<Order, 'services' | 'assignedTo'>>) =>
    http.put<WorkOrderResponse>(`/api/work-orders/${id}`, {
      notes: data.services?.join(', '),
      mechanic_id: data.assignedTo ? Number(data.assignedTo) : undefined,
    }).then(mapOrder),

  updateStatus: (id: string, status: OrderStatus) => {
    if (status === 'Завершён') {
      return http.post<WorkOrderResponse>(`/api/work-orders/${id}/complete`, {}).then(mapOrder);
    }
    return http.put<WorkOrderResponse>(`/api/work-orders/${id}`, {
      status: STATUS_TO_BACKEND[status],
    }).then(mapOrder);
  },

  remove: (id: string) =>
    http.delete<void>(`/api/work-orders/${id}`),
};
