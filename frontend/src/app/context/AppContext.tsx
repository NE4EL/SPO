import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { partsApi } from '../../shared/api/parts.api';
import { ordersApi } from '../../shared/api/orders.api';
import { vehiclesApi } from '../../shared/api/vehicles.api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'В ожидании' | 'В работе' | 'Завершён' | 'Отменён';

export interface Part {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reserved: number;
  minStock: number;
  unitPrice: number;
  supplier: string;
  location: string;
  lastRestocked: string;
}

export interface OrderPart {
  partId: string;
  partName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  phone: string;
  vehicleId?: string;
  vehicle: string;
  licensePlate: string;
  services: string[];
  parts: OrderPart[];
  status: OrderStatus;
  createdDate: string;
  completedDate?: string;
  totalAmount: number;
  laborCost: number;
  assignedTo?: string;
}

export interface ServiceRecord {
  date: string;
  orderNumber: string;
  services: string[];
  parts: { name: string; quantity: number; unitPrice: number }[];
  totalCost: number;
  mechanic?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  owner: string;
  ownerPhone: string;
  color: string;
  mileage: number;
  lastService: string;
  nextService: string;
  serviceRecords: ServiceRecord[];
}

export interface ServiceTemplate {
  name: string;
  laborCost: number;
  defaultParts: { partId: string; quantity: number }[];
}

// ─── Service Templates ────────────────────────────────────────────────────────

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  { name: 'Замена масла', laborCost: 2000, defaultParts: [] },
  { name: 'Замена тормозных колодок', laborCost: 3500, defaultParts: [] },
  { name: 'Замена тормозных дисков', laborCost: 4000, defaultParts: [] },
  { name: 'Полное ТО', laborCost: 5000, defaultParts: [] },
  { name: 'Ротация шин', laborCost: 1500, defaultParts: [] },
  { name: 'Замена аккумулятора', laborCost: 1000, defaultParts: [] },
  { name: 'Диагностика', laborCost: 2500, defaultParts: [] },
  { name: 'Замена свечей зажигания', laborCost: 1500, defaultParts: [] },
  { name: 'Замена воздушного фильтра', laborCost: 800, defaultParts: [] },
  { name: 'Замена охлаждающей жидкости', laborCost: 1200, defaultParts: [] },
  { name: 'Замена щёток стеклоочистителя', laborCost: 500, defaultParts: [] },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  parts: Part[];
  orders: Order[];
  vehicles: Vehicle[];
  loading: boolean;
  addPart: (part: Omit<Part, 'id' | 'reserved'>) => void;
  updatePart: (id: string, data: Omit<Part, 'id' | 'reserved'>) => void;
  deletePart: (partId: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'orderNumber'>) => void;
  updateOrder: (id: string, data: Pick<Order, 'customer' | 'phone' | 'vehicleId' | 'vehicle' | 'licensePlate' | 'services' | 'parts' | 'laborCost' | 'assignedTo'>) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'serviceRecords'>) => void;
  updateVehicle: (id: string, data: Omit<Vehicle, 'id' | 'serviceRecords'>) => void;
  deleteVehicle: (vehicleId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      partsApi.getAll(),
      ordersApi.getAll(),
      vehiclesApi.getAll(),
    ]).then(([partsData, ordersData, vehiclesData]) => {
      setParts(partsData);
      setOrders(ordersData);
      setVehicles(vehiclesData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // ─── Parts ─────────────────────────────────────────────────────────────────

  const addPart = async (data: Omit<Part, 'id' | 'reserved'>) => {
    const part = await partsApi.create(data);
    setParts(prev => [part, ...prev]);
  };

  const updatePart = async (id: string, data: Omit<Part, 'id' | 'reserved'>) => {
    const part = await partsApi.update(id, data);
    setParts(prev => prev.map(p => p.id === id ? { ...part, reserved: p.reserved } : p));
  };

  const deletePart = async (partId: string) => {
    await partsApi.remove(partId);
    setParts(prev => prev.filter(p => p.id !== partId));
  };

  // ─── Orders ────────────────────────────────────────────────────────────────

  const addOrder = async (data: Omit<Order, 'id' | 'orderNumber'>) => {
    const order = await ordersApi.create(data);
    for (const part of data.parts) {
      await ordersApi.addPart(order.id, part.partId, part.quantity, part.unitPrice).catch(console.error);
    }
    const partsTotal = data.parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
    const fullOrder: Order = {
      ...order,
      customer: data.customer,
      phone: data.phone,
      vehicle: data.vehicle,
      licensePlate: data.licensePlate,
      parts: data.parts,
      laborCost: data.laborCost,
      totalAmount: partsTotal + data.laborCost,
    };
    setOrders(prev => [fullOrder, ...prev]);
  };

  const updateOrder = async (id: string, data: Pick<Order, 'customer' | 'phone' | 'vehicleId' | 'vehicle' | 'licensePlate' | 'services' | 'parts' | 'laborCost' | 'assignedTo'>) => {
    await ordersApi.update(id, { services: data.services });
    const partsTotal = data.parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...data, totalAmount: partsTotal + data.laborCost } : o));
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const oldStatus = order.status;
    if (oldStatus === newStatus) return;

    if (newStatus === 'В работе' && oldStatus === 'В ожидании') {
      setParts(prev => prev.map(part => {
        const op = order.parts.find(p => p.partId === part.id);
        return op ? { ...part, reserved: part.reserved + op.quantity } : part;
      }));
    } else if (newStatus === 'Завершён' && oldStatus === 'В работе') {
      setParts(prev => prev.map(part => {
        const op = order.parts.find(p => p.partId === part.id);
        return op ? { ...part, quantity: Math.max(0, part.quantity - op.quantity), reserved: Math.max(0, part.reserved - op.quantity) } : part;
      }));
      if (order.vehicleId) {
        const today = new Date().toISOString().slice(0, 10);
        const record: ServiceRecord = {
          date: today,
          orderNumber: order.orderNumber,
          services: order.services,
          parts: order.parts.map(op => ({ name: op.partName, quantity: op.quantity, unitPrice: op.unitPrice })),
          totalCost: order.totalAmount,
          mechanic: order.assignedTo,
        };
        setVehicles(prev => prev.map(v => v.id === order.vehicleId
          ? { ...v, lastService: today, serviceRecords: [record, ...v.serviceRecords] }
          : v
        ));
      }
    } else if (newStatus === 'Отменён' && oldStatus === 'В работе') {
      setParts(prev => prev.map(part => {
        const op = order.parts.find(p => p.partId === part.id);
        return op ? { ...part, reserved: Math.max(0, part.reserved - op.quantity) } : part;
      }));
    }

    await ordersApi.updateStatus(orderId, newStatus);
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: newStatus,
      completedDate: newStatus === 'Завершён' ? new Date().toISOString().slice(0, 10) : o.completedDate,
    } : o));
  };

  const deleteOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order?.status === 'В работе') {
      setParts(prev => prev.map(part => {
        const op = order.parts.find(p => p.partId === part.id);
        return op ? { ...part, reserved: Math.max(0, part.reserved - op.quantity) } : part;
      }));
    }
    await ordersApi.remove(orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // ─── Vehicles ──────────────────────────────────────────────────────────────

  const addVehicle = async (data: Omit<Vehicle, 'id' | 'serviceRecords'>) => {
    const client = await vehiclesApi.createClient({
      full_name: data.owner,
      phone: data.ownerPhone,
    });
    const vehicle = await vehiclesApi.create(client.id, data);
    const fullVehicle: Vehicle = {
      ...vehicle,
      owner: data.owner,
      ownerPhone: data.ownerPhone,
      vin: data.vin,
      color: data.color,
      lastService: data.lastService,
      nextService: data.nextService,
      serviceRecords: [],
    };
    setVehicles(prev => [fullVehicle, ...prev]);
  };

  const updateVehicle = async (id: string, data: Omit<Vehicle, 'id' | 'serviceRecords'>) => {
    await vehiclesApi.update(id, data);
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  };

  const deleteVehicle = async (vehicleId: string) => {
    await vehiclesApi.remove(vehicleId);
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  return (
    <AppContext.Provider value={{
      parts, orders, vehicles, loading,
      addPart, updatePart, deletePart,
      addOrder, updateOrder, updateOrderStatus, deleteOrder,
      addVehicle, updateVehicle, deleteVehicle,
    }}>
      {children}
    </AppContext.Provider>
  );
}
