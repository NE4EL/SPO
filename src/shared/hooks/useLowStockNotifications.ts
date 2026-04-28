import { useApp } from '../../app/context/AppContext';

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
}

export function useLowStockNotifications(): LowStockItem[] {
  const { parts } = useApp();
  return parts
    .filter(part => part.quantity < part.minStock)
    .map(p => ({ id: p.id, name: p.name, sku: p.sku, quantity: p.quantity, minStock: p.minStock }));
}
