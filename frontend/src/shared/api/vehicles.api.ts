import { http } from './client';
import type { Vehicle } from '../../app/context/AppContext';

// Тип данных как приходит с бэкенда
export interface VehicleResponse {
  id: number;
  client_id: number;
  brand: string;        // → make на фронте
  model: string;
  year: number;
  plate_number: string; // → licensePlate на фронте
  mileage: number;
  created_at: string;
}

// Клиент (владелец автомобиля)
export interface ClientResponse {
  id: number;
  full_name: string;  // → owner на фронте
  phone: string;      // → ownerPhone на фронте
  email: string | null;
  created_at: string;
}

// Маппинг бэкенд → фронт
// Требует данных клиента для owner/ownerPhone
export function mapVehicle(v: VehicleResponse, client?: ClientResponse): Vehicle {
  return {
    id: String(v.id),
    make: v.brand,
    model: v.model,
    year: v.year,
    licensePlate: v.plate_number,
    vin: '',              // TODO: уточнить у бэкенда поле vin
    owner: client?.full_name ?? '',
    ownerPhone: client?.phone ?? '',
    color: '',            // TODO: уточнить у бэкенда поле color
    mileage: v.mileage,
    lastService: '',      // TODO: уточнить у бэкенда поле lastService
    nextService: '',      // TODO: уточнить у бэкенда поле nextService
    serviceRecords: [],   // TODO: загружать из истории заказов
  };
}

// GET    /api/vehicles/      → VehicleResponse[]
// GET    /api/clients/       → ClientResponse[]  (нужны для owner/ownerPhone)
// POST   /api/clients/       → ClientResponse    (сначала создаём клиента)
// POST   /api/vehicles/      → VehicleResponse
// PUT    /api/vehicles/{id}  → VehicleResponse
// DELETE /api/vehicles/{id}  → 204
export const vehiclesApi = {
  getAll: () =>
    http.get<VehicleResponse[]>('/api/vehicles/').then(list => list.map(v => mapVehicle(v))),

  getClients: () =>
    http.get<ClientResponse[]>('/api/clients/'),

  createClient: (data: { full_name: string; phone: string; email?: string }) =>
    http.post<ClientResponse>('/api/clients/', data),

  create: (clientId: number, data: Omit<Vehicle, 'id' | 'serviceRecords'>) =>
    http.post<VehicleResponse>('/api/vehicles/', {
      client_id: clientId,
      brand: data.make,
      model: data.model,
      year: data.year,
      plate_number: data.licensePlate,
      mileage: data.mileage,
    }).then(v => mapVehicle(v)),

  update: (id: string, data: Omit<Vehicle, 'id' | 'serviceRecords'>) =>
    http.put<VehicleResponse>(`/api/vehicles/${id}`, {
      brand: data.make,
      model: data.model,
      year: data.year,
      plate_number: data.licensePlate,
      mileage: data.mileage,
    }).then(v => mapVehicle(v)),

  remove: (id: string) =>
    http.delete<void>(`/api/vehicles/${id}`),
};
