import { createContext, useContext, useState, type ReactNode } from 'react';

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
  { name: 'Замена масла', laborCost: 2000, defaultParts: [{ partId: '1', quantity: 4 }, { partId: '7', quantity: 1 }] },
  { name: 'Замена тормозных колодок', laborCost: 3500, defaultParts: [{ partId: '2', quantity: 2 }] },
  { name: 'Замена тормозных дисков', laborCost: 4000, defaultParts: [{ partId: '6', quantity: 2 }] },
  { name: 'Полное ТО', laborCost: 5000, defaultParts: [{ partId: '1', quantity: 4 }, { partId: '7', quantity: 1 }, { partId: '3', quantity: 1 }, { partId: '4', quantity: 4 }] },
  { name: 'Ротация шин', laborCost: 1500, defaultParts: [] },
  { name: 'Замена аккумулятора', laborCost: 1000, defaultParts: [{ partId: '9', quantity: 1 }] },
  { name: 'Диагностика', laborCost: 2500, defaultParts: [] },
  { name: 'Замена свечей зажигания', laborCost: 1500, defaultParts: [{ partId: '4', quantity: 4 }] },
  { name: 'Замена воздушного фильтра', laborCost: 800, defaultParts: [{ partId: '3', quantity: 1 }] },
  { name: 'Замена охлаждающей жидкости', laborCost: 1200, defaultParts: [{ partId: '10', quantity: 1 }] },
  { name: 'Замена щёток стеклоочистителя', laborCost: 500, defaultParts: [{ partId: '8', quantity: 2 }] },
];

// ─── Initial Data ─────────────────────────────────────────────────────────────

const initialParts: Part[] = [
  { id: '1',  name: 'Моторное масло 5W-30',          sku: 'OIL-5W30-001', category: 'Жидкости',   quantity: 15, reserved: 4, minStock: 20, unitPrice: 850,   supplier: 'АвтоЗапчасти',       location: 'А-01', lastRestocked: '2026-02-20' },
  { id: '2',  name: 'Тормозные колодки (передние)',   sku: 'BP-FR-001',    category: 'Тормоза',    quantity: 8,  reserved: 2, minStock: 10, unitPrice: 4200,  supplier: 'Мастер Тормозов',    location: 'Б-12', lastRestocked: '2026-02-15' },
  { id: '3',  name: 'Воздушный фильтр',               sku: 'AF-001',       category: 'Фильтры',    quantity: 25, reserved: 1, minStock: 15, unitPrice: 1200,  supplier: 'ФильтрПро',          location: 'В-05', lastRestocked: '2026-03-01' },
  { id: '4',  name: 'Свечи зажигания',                sku: 'SP-001',       category: 'Двигатель',  quantity: 12, reserved: 4, minStock: 20, unitPrice: 650,   supplier: 'Запчасти Двигателя', location: 'Г-08', lastRestocked: '2026-02-25' },
  { id: '5',  name: 'Трансмиссионная жидкость',       sku: 'TF-001',       category: 'Жидкости',   quantity: 5,  reserved: 2, minStock: 10, unitPrice: 1500,  supplier: 'АвтоЗапчасти',       location: 'А-02', lastRestocked: '2026-02-10' },
  { id: '6',  name: 'Тормозные диски (передние)',      sku: 'BR-FR-001',    category: 'Тормоза',    quantity: 18, reserved: 2, minStock: 12, unitPrice: 8200,  supplier: 'Мастер Тормозов',    location: 'Б-13', lastRestocked: '2026-03-05' },
  { id: '7',  name: 'Масляный фильтр',                sku: 'OF-001',       category: 'Фильтры',    quantity: 45, reserved: 1, minStock: 30, unitPrice: 750,   supplier: 'ФильтрПро',          location: 'В-06', lastRestocked: '2026-03-03' },
  { id: '8',  name: 'Щётки стеклоочистителя',         sku: 'WW-001',       category: 'Аксессуары', quantity: 30, reserved: 0, minStock: 20, unitPrice: 1800,  supplier: 'Запчасти Плюс',      location: 'Д-10', lastRestocked: '2026-02-28' },
  { id: '9',  name: 'Аккумулятор',                    sku: 'BAT-001',      category: 'Электрика',  quantity: 10, reserved: 0, minStock: 8,  unitPrice: 11500, supplier: 'АвтоЭнергия',        location: 'Е-02', lastRestocked: '2026-03-01' },
  { id: '10', name: 'Охлаждающая жидкость',           sku: 'COOL-001',     category: 'Жидкости',   quantity: 22, reserved: 0, minStock: 15, unitPrice: 1100,  supplier: 'АвтоЗапчасти',       location: 'А-03', lastRestocked: '2026-03-02' },
];

const initialOrders: Order[] = [
  {
    id: '1', orderNumber: 'ORD-001', customer: 'Иван Петров', phone: '79991234567',
    vehicleId: '1', vehicle: 'Toyota Camry 2020', licensePlate: 'А123БВ77',
    services: ['Замена масла', 'Ротация шин'],
    parts: [
      { partId: '1', partName: 'Моторное масло 5W-30', sku: 'OIL-5W30-001', quantity: 4, unitPrice: 850 },
      { partId: '7', partName: 'Масляный фильтр',       sku: 'OF-001',       quantity: 1, unitPrice: 750 },
    ],
    status: 'Завершён', createdDate: '2026-03-06', completedDate: '2026-03-06',
    laborCost: 4750, totalAmount: 8900, assignedTo: 'Михаил Иванов',
  },
  {
    id: '2', orderNumber: 'ORD-002', customer: 'Анна Смирнова', phone: '79992345678',
    vehicleId: '2', vehicle: 'Honda Accord 2019', licensePlate: 'Х456УФ99',
    services: ['Тормозная система', 'Замена тормозных колодок'],
    parts: [
      { partId: '2', partName: 'Тормозные колодки (передние)', sku: 'BP-FR-001', quantity: 2, unitPrice: 4200 },
      { partId: '6', partName: 'Тормозные диски (передние)',    sku: 'BR-FR-001', quantity: 2, unitPrice: 8200 },
    ],
    status: 'В работе', createdDate: '2026-03-07',
    laborCost: 20200, totalAmount: 45000, assignedTo: 'Алексей Орлов',
  },
  {
    id: '3', orderNumber: 'ORD-003', customer: 'Михаил Орлов', phone: '79993456789',
    vehicleId: '3', vehicle: 'Ford F-150 2021', licensePlate: 'Д789ЕЖ50',
    services: ['Ротация шин', 'Развал-схождение'],
    parts: [],
    status: 'В ожидании', createdDate: '2026-03-08',
    laborCost: 6500, totalAmount: 6500,
  },
  {
    id: '4', orderNumber: 'ORD-004', customer: 'Елена Иванова', phone: '79994567890',
    vehicleId: '4', vehicle: 'BMW 3 Series 2022', licensePlate: 'З012ИК197',
    services: ['Полное ТО'],
    parts: [
      { partId: '3', partName: 'Воздушный фильтр',        sku: 'AF-001',       quantity: 1, unitPrice: 1200 },
      { partId: '4', partName: 'Свечи зажигания',          sku: 'SP-001',       quantity: 4, unitPrice: 650  },
      { partId: '1', partName: 'Моторное масло 5W-30',     sku: 'OIL-5W30-001', quantity: 4, unitPrice: 850  },
      { partId: '7', partName: 'Масляный фильтр',          sku: 'OF-001',       quantity: 1, unitPrice: 750  },
      { partId: '5', partName: 'Трансмиссионная жидкость', sku: 'TF-001',       quantity: 2, unitPrice: 1500 },
    ],
    status: 'В работе', createdDate: '2026-03-07',
    laborCost: 78050, totalAmount: 89000, assignedTo: 'Михаил Иванов',
  },
  {
    id: '5', orderNumber: 'ORD-005', customer: 'Алексей Кузнецов', phone: '79995678901',
    vehicleId: '5', vehicle: 'Tesla Model 3 2023', licensePlate: 'Л345МН78',
    services: ['Диагностика'],
    parts: [],
    status: 'Завершён', createdDate: '2026-03-05', completedDate: '2026-03-05',
    laborCost: 12000, totalAmount: 12000, assignedTo: 'Алексей Орлов',
  },
];

const initialVehicles: Vehicle[] = [
  {
    id: '1', make: 'Toyota', model: 'Camry', year: 2020, licensePlate: 'А123БВ77',
    vin: '1HGBH41JXMN109186', owner: 'Иван Петров', ownerPhone: '79991234567',
    color: 'Серебристый', mileage: 45000, lastService: '2026-03-06', nextService: '2026-06-06',
    serviceRecords: [
      { date: '2026-03-06', orderNumber: 'ORD-001', services: ['Замена масла', 'Ротация шин'], parts: [{ name: 'Моторное масло 5W-30', quantity: 4, unitPrice: 850 }, { name: 'Масляный фильтр', quantity: 1, unitPrice: 750 }], totalCost: 8900, mechanic: 'Михаил Иванов' },
      { date: '2025-11-20', orderNumber: 'ORD-OLD-003', services: ['Замена свечей зажигания'], parts: [{ name: 'Свечи зажигания', quantity: 4, unitPrice: 600 }], totalCost: 3900 },
      { date: '2025-07-15', orderNumber: 'ORD-OLD-001', services: ['Диагностика'], parts: [], totalCost: 2500, mechanic: 'Алексей Орлов' },
    ],
  },
  {
    id: '2', make: 'Honda', model: 'Accord', year: 2019, licensePlate: 'Х456УФ99',
    vin: '2HGFC2F59JH543234', owner: 'Анна Смирнова', ownerPhone: '79992345678',
    color: 'Синий', mileage: 52000, lastService: '2026-03-01', nextService: '2026-06-01',
    serviceRecords: [
      { date: '2026-03-01', orderNumber: 'ORD-OLD-010', services: ['Замена масла'], parts: [{ name: 'Моторное масло 5W-30', quantity: 4, unitPrice: 800 }, { name: 'Масляный фильтр', quantity: 1, unitPrice: 700 }], totalCost: 7100, mechanic: 'Михаил Иванов' },
      { date: '2025-09-10', orderNumber: 'ORD-OLD-005', services: ['Диагностика', 'Полное ТО'], parts: [{ name: 'Воздушный фильтр', quantity: 1, unitPrice: 1100 }], totalCost: 12000, mechanic: 'Алексей Орлов' },
    ],
  },
  {
    id: '3', make: 'Ford', model: 'F-150', year: 2021, licensePlate: 'Д789ЕЖ50',
    vin: '1FTFW1E57KFA12345', owner: 'Михаил Орлов', ownerPhone: '79993456789',
    color: 'Чёрный', mileage: 38000, lastService: '2026-01-20', nextService: '2026-04-20',
    serviceRecords: [
      { date: '2026-01-20', orderNumber: 'ORD-OLD-012', services: ['Замена масла'], parts: [{ name: 'Моторное масло 5W-30', quantity: 5, unitPrice: 800 }], totalCost: 5500 },
    ],
  },
  {
    id: '4', make: 'BMW', model: '3 Series', year: 2022, licensePlate: 'З012ИК197',
    vin: 'WBA8E9C59HK123456', owner: 'Елена Иванова', ownerPhone: '79994567890',
    color: 'Белый', mileage: 28000, lastService: '2026-02-28', nextService: '2026-05-28',
    serviceRecords: [
      { date: '2026-02-28', orderNumber: 'ORD-OLD-015', services: ['Замена тормозных колодок'], parts: [{ name: 'Тормозные колодки (передние)', quantity: 2, unitPrice: 4000 }], totalCost: 11500, mechanic: 'Михаил Иванов' },
    ],
  },
  {
    id: '5', make: 'Tesla', model: 'Model 3', year: 2023, licensePlate: 'Л345МН78',
    vin: '5YJ3E1EA4KF123456', owner: 'Алексей Кузнецов', ownerPhone: '79995678901',
    color: 'Красный', mileage: 15000, lastService: '2026-03-05', nextService: '2026-09-05',
    serviceRecords: [
      { date: '2026-03-05', orderNumber: 'ORD-005', services: ['Диагностика'], parts: [], totalCost: 12000, mechanic: 'Алексей Орлов' },
    ],
  },
  {
    id: '6', make: 'Mercedes-Benz', model: 'C-Class', year: 2021, licensePlate: 'М678НО97',
    vin: 'WDDWF4HB3KR123456', owner: 'Ирина Сидорова', ownerPhone: '79996789012',
    color: 'Серый', mileage: 32000, lastService: '2026-02-10', nextService: '2026-05-10',
    serviceRecords: [
      { date: '2026-02-10', orderNumber: 'ORD-OLD-020', services: ['Замена масла', 'Ротация шин'], parts: [{ name: 'Моторное масло 5W-30', quantity: 4, unitPrice: 800 }], totalCost: 7000, mechanic: 'Алексей Орлов' },
    ],
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  parts: Part[];
  orders: Order[];
  vehicles: Vehicle[];
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
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);

  // Parts
  const addPart = (data: Omit<Part, 'id' | 'reserved'>) => {
    const id = String(Date.now());
    setParts(prev => [{ ...data, id, reserved: 0 }, ...prev]);
  };

  const updatePart = (id: string, data: Omit<Part, 'id' | 'reserved'>) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deletePart = (partId: string) => {
    setParts(prev => prev.filter(p => p.id !== partId));
  };

  // Orders
  const addOrder = (data: Omit<Order, 'id' | 'orderNumber'>) => {
    setOrders(prev => {
      const nextNum = prev.length + 1;
      const id = String(Date.now());
      const orderNumber = `ORD-${String(nextNum).padStart(3, '0')}`;
      return [{ ...data, id, orderNumber }, ...prev];
    });
  };

  const updateOrder = (id: string, data: Pick<Order, 'customer' | 'phone' | 'vehicleId' | 'vehicle' | 'licensePlate' | 'services' | 'parts' | 'laborCost' | 'assignedTo'>) => {
    const partsTotal = data.parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...data, totalAmount: partsTotal + data.laborCost } : o));
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
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
        setVehicles(prev => prev.map(v => v.id === order.vehicleId ? { ...v, lastService: today, serviceRecords: [record, ...v.serviceRecords] } : v));
      }
    } else if (newStatus === 'Отменён' && oldStatus === 'В работе') {
      setParts(prev => prev.map(part => {
        const op = order.parts.find(p => p.partId === part.id);
        return op ? { ...part, reserved: Math.max(0, part.reserved - op.quantity) } : part;
      }));
    }

    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o, status: newStatus,
      completedDate: newStatus === 'Завершён' ? new Date().toISOString().slice(0, 10) : o.completedDate,
    } : o));
  };

  const deleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order?.status === 'В работе') {
      setParts(prev => prev.map(part => {
        const op = order.parts.find(p => p.partId === part.id);
        return op ? { ...part, reserved: Math.max(0, part.reserved - op.quantity) } : part;
      }));
    }
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // Vehicles
  const addVehicle = (data: Omit<Vehicle, 'id' | 'serviceRecords'>) => {
    const id = String(Date.now());
    setVehicles(prev => [{ ...data, id, serviceRecords: [] }, ...prev]);
  };

  const updateVehicle = (id: string, data: Omit<Vehicle, 'id' | 'serviceRecords'>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  };

  const deleteVehicle = (vehicleId: string) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  return (
    <AppContext.Provider value={{ parts, orders, vehicles, addPart, updatePart, deletePart, addOrder, updateOrder, updateOrderStatus, deleteOrder, addVehicle, updateVehicle, deleteVehicle }}>
      {children}
    </AppContext.Provider>
  );
}
