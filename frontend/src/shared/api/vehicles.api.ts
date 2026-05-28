import { http } from './client';
import type { Vehicle } from '../../app/context/AppContext';

export interface VehicleResponse {
  id: number;
  client_id: number;
  brand: string;
  model: string;
  year: number;
  plate_number: string;
  mileage: number;
  created_at: string;
}

export interface ClientResponse {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
}

export function mapVehicle(v: VehicleResponse, client?: ClientResponse): Vehicle {
  return {
    id: String(v.id),
    make: v.brand,
    model: v.model,
    year: v.year,
    licensePlate: v.plate_number,
    vin: '',
    owner: client?.full_name ?? '',
    ownerPhone: client?.phone ?? '',
    color: '',
    mileage: v.mileage,
    lastService: '',
    nextService: '',
    serviceRecords: [],
  };
}

export const vehiclesApi = {
  getAll: async (): Promise<Vehicle[]> => {
    const [vehicles, clients] = await Promise.all([
      http.get<VehicleResponse[]>('/api/vehicles/'),
      http.get<ClientResponse[]>('/api/clients/'),
    ]);
    const clientMap = new Map(clients.map(c => [c.id, c]));
    return vehicles.map(v => mapVehicle(v, clientMap.get(v.client_id)));
  },

  getClients: (): Promise<ClientResponse[]> =>
    http.get<ClientResponse[]>('/api/clients/'),

  createClient: (data: { full_name: string; phone: string; email?: string }): Promise<ClientResponse> =>
    http.post<ClientResponse>('/api/clients/', data),

  create: (clientId: number, data: Omit<Vehicle, 'id' | 'serviceRecords'>): Promise<Vehicle> =>
    http.post<VehicleResponse>('/api/vehicles/', {
      client_id: clientId,
      brand: data.make,
      model: data.model,
      year: data.year,
      plate_number: data.licensePlate,
      mileage: data.mileage,
    }).then(v => mapVehicle(v)),

  update: (id: string, data: Omit<Vehicle, 'id' | 'serviceRecords'>): Promise<Vehicle> =>
    http.put<VehicleResponse>(`/api/vehicles/${id}`, {
      brand: data.make,
      model: data.model,
      year: data.year,
      plate_number: data.licensePlate,
      mileage: data.mileage,
    }).then(v => mapVehicle(v)),

  remove: (id: string): Promise<void> =>
    http.delete<void>(`/api/vehicles/${id}`),
};
