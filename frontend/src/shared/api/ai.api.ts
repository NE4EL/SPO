import { http } from './client';

// ─── Анализ склада ────────────────────────────────────────────────────────────

export interface PartPrediction {
  part_id:               number;
  part_name:             string;
  article:               string;
  current_stock:         number;
  min_stock:             number;
  monthly_consumption:   number;
  daily_rate:            number;
  days_until_stockout:   number | null;
  urgency:               'ok' | 'warning' | 'critical';
  recommended_order_qty: number;
  confidence:            number;
}

export interface StockAnalysisResponse {
  total_parts:    number;
  critical_parts: number;
  warning_parts:  number;
  ok_parts:       number;
  model_accuracy: number | null;
  parts:          PartPrediction[];
}

// ─── Список закупок ───────────────────────────────────────────────────────────

export interface ReorderItem {
  part_id:               number;
  part_name:             string;
  article:               string;
  current_stock:         number;
  recommended_order_qty: number;
  estimated_cost:        number | null;
  urgency:               'ok' | 'warning' | 'critical';
  confidence:            number;
}

export interface ReorderResponse {
  total_items:          number;
  total_estimated_cost: number | null;
  items:                ReorderItem[];
}

// ─── Обучение модели ──────────────────────────────────────────────────────────

export interface ClassMetrics {
  precision: number;
  recall:    number;
  f1_score:  number;
  support:   number;
}

export interface TrainResponse {
  status:            string;
  samples_total:     number;
  real_samples:      number;
  accuracy:          number;
  layers:            number[];
  iterations:        number;
  metrics_by_class:  Record<string, ClassMetrics> | null;
}

// ─── API-клиент ───────────────────────────────────────────────────────────────

export const aiApi = {
  getAnalysis: (): Promise<StockAnalysisResponse> =>
    http.get<StockAnalysisResponse>('/api/ai/stock/analysis'),

  getReorder: (): Promise<ReorderResponse> =>
    http.get<ReorderResponse>('/api/ai/stock/reorder'),

  train: (): Promise<TrainResponse> =>
    http.post<TrainResponse>('/api/ai/train', {}),
};
