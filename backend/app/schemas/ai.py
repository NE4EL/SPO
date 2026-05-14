from pydantic import BaseModel
from typing import Dict, List, Optional


# ─── Один результат предсказания ─────────────────────────────────────────────

class PartPrediction(BaseModel):
    part_id:               int
    part_name:             str
    article:               str
    current_stock:         int
    min_stock:             int
    monthly_consumption:   int
    daily_rate:            float
    days_until_stockout:   Optional[int]     # None = расхода не было
    urgency:               str               # "ok" | "warning" | "critical"
    recommended_order_qty: int
    confidence:            float             # уверенность нейросети, %


# ─── Полный анализ склада ────────────────────────────────────────────────────

class StockAnalysisResponse(BaseModel):
    total_parts:    int
    critical_parts: int
    warning_parts:  int
    ok_parts:       int
    model_accuracy: Optional[float]          # точность модели (из последнего обучения)
    parts:          List[PartPrediction]     # отсортировано: critical → warning → ok


# ─── Список закупок ──────────────────────────────────────────────────────────

class ReorderItem(BaseModel):
    part_id:               int
    part_name:             str
    article:               str
    current_stock:         int
    recommended_order_qty: int
    estimated_cost:        Optional[float]
    urgency:               str
    confidence:            float


class ReorderResponse(BaseModel):
    total_items:          int
    total_estimated_cost: Optional[float]
    items:                List[ReorderItem]  # отсортировано: critical → warning → ok


# ─── Обучение модели ─────────────────────────────────────────────────────────

class ClassMetrics(BaseModel):
    precision: float
    recall:    float
    f1_score:  float
    support:   int


class TrainResponse(BaseModel):
    status:            str
    samples_total:     int
    real_samples:      int
    accuracy:          float    # точность на тестовой выборке, %
    layers:            List[int]
    iterations:        int
    metrics_by_class:  Optional[Dict[str, ClassMetrics]] = None


# ─── Общий AI-чат (был раньше) ───────────────────────────────────────────────

class AIQueryRequest(BaseModel):
    question: str
    context:  Optional[str] = None


class AIQueryResponse(BaseModel):
    answer: str
    model:  str
