import { http } from './client';
import type { Part } from '../../app/context/AppContext';

// Тип данных как приходит с бэкенда
export interface PartResponse {
  id: number;
  name: string;
  article: string;       // → sku на фронте
  quantity_in_stock: number; // → quantity на фронте
  min_quantity: number;  // → minStock на фронте
  price: number;         // → unitPrice на фронте
  unit: string;
}

// Маппинг бэкенд → фронт
export function mapPart(p: PartResponse): Part {
  return {
    id: String(p.id),
    name: p.name,
    sku: p.article,
    category: p.unit,      // TODO: уточнить у бэкенда поле category
    quantity: p.quantity_in_stock,
    reserved: 0,           // TODO: уточнить у бэкенда поле reserved
    minStock: p.min_quantity,
    unitPrice: p.price,
    supplier: '',          // TODO: уточнить у бэкенда поле supplier
    location: '',          // TODO: уточнить у бэкенда поле location
    lastRestocked: '',     // TODO: уточнить у бэкенда поле lastRestocked
  };
}

// Маппинг фронт → бэкенд
function toDto(data: Omit<Part, 'id' | 'reserved'>) {
  return {
    name: data.name,
    article: data.sku,
    quantity_in_stock: data.quantity,
    min_quantity: data.minStock,
    price: data.unitPrice,
    unit: data.category,
  };
}

// GET    /api/parts/       → PartResponse[]
// POST   /api/parts/       → PartResponse
// PUT    /api/parts/{id}   → PartResponse
// DELETE /api/parts/{id}   → 204
export const partsApi = {
  getAll: () =>
    http.get<PartResponse[]>('/api/parts/').then(list => list.map(mapPart)),

  create: (data: Omit<Part, 'id' | 'reserved'>) =>
    http.post<PartResponse>('/api/parts/', toDto(data)).then(mapPart),

  update: (id: string, data: Omit<Part, 'id' | 'reserved'>) =>
    http.put<PartResponse>(`/api/parts/${id}`, toDto(data)).then(mapPart),

  remove: (id: string) =>
    http.delete<void>(`/api/parts/${id}`),
};
