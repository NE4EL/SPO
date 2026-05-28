import { http } from './client';
import type { Order, OrderStatus } from '../../app/context/AppContext';
import type { VehicleResponse, ClientResponse } from './vehicles.api';

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

export interface WorkOrderResponse {
  id: number;
  order_number: string;
  vehicle_id: number;
  mechanic_id: number | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  total_cost: number;
  notes: string | null;
}

export interface OrderPartResponse {
  id: number;
  work_order_id: number;
  part_id: number;
  quantity: number;
  price_at_moment: number;
}

export function mapOrder(
  o: WorkOrderResponse,
  vehicle?: VehicleResponse,
  client?: ClientResponse,
): Order {
  return {
    id: String(o.id),
    orderNumber: o.order_number,
    customer: client?.full_name ?? '',
    phone: client?.phone ?? '',
    vehicleId: String(o.vehicle_id),
    vehicle: vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : '',
    licensePlate: vehicle?.plate_number ?? '',
    services: o.notes ? o.notes.split(',').map(s => s.trim()).filter(Boolean) : [],
    parts: [],
    status: STATUS_TO_FRONTEND[o.status] ?? 'В ожидании',
    createdDate: o.created_at.slice(0, 10),
    completedDate: o.completed_at?.slice(0, 10),
    totalAmount: o.total_cost,
    laborCost: 0,
    assignedTo: o.mechanic_id ? String(o.mechanic_id) : undefined,
  };
}

export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    const [orders, vehicles, clients] = await Promise.all([
      http.get<WorkOrderResponse[]>('/api/work-orders/'),
      http.get<VehicleResponse[]>('/api/vehicles/'),
      http.get<ClientResponse[]>('/api/clients/'),
    ]);
    const clientMap = new Map(clients.map(c => [c.id, c]));
    const vehicleMap = new Map(
      vehicles.map(v => [v.id, { vehicle: v, client: clientMap.get(v.client_id) }])
    );
    return orders.map(o => {
      const vc = vehicleMap.get(o.vehicle_id);
      return mapOrder(o, vc?.vehicle, vc?.client);
    });
  },

  create: (data: Omit<Order, 'id' | 'orderNumber'>): Promise<Order> =>
    http.post<WorkOrderResponse>('/api/work-orders/', {
      vehicle_id: data.vehicleId ? Number(data.vehicleId) : undefined,
      mechanic_id: null,
      notes: data.services.join(', '),
    }).then(o => mapOrder(o)),

  addPart: (orderId: string, partId: string, quantity: number, price: number): Promise<OrderPartResponse> =>
    http.post<OrderPartResponse>(`/api/work-orders/${orderId}/parts`, {
      part_id: Number(partId),
      quantity,
      price_at_moment: price,
    }),

  update: (id: string, data: Partial<Pick<Order, 'services' | 'assignedTo'>>): Promise<Order> =>
    http.put<WorkOrderResponse>(`/api/work-orders/${id}`, {
      notes: data.services?.join(', '),
      mechanic_id: null,
    }).then(o => mapOrder(o)),

  updateStatus: (id: string, status: OrderStatus): Promise<Order> => {
    if (status === 'Завершён') {
      return http.post<WorkOrderResponse>(`/api/work-orders/${id}/complete`, {}).then(o => mapOrder(o));
    }
    return http.put<WorkOrderResponse>(`/api/work-orders/${id}`, {
      status: STATUS_TO_BACKEND[status],
    }).then(o => mapOrder(o));
  },

  remove: (id: string): Promise<void> =>
    http.delete<void>(`/api/work-orders/${id}`),
};
