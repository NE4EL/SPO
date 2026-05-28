"""
AI-сервис: мост между базой данных и нейросетью.

Что делает:
  1. Читает запчасти и историю расхода из PostgreSQL
  2. Формирует признаки (features) для нейросети
  3. Вызывает predictor → получает urgency + рекомендации
  4. При обучении — дополнительно передаёт реальные данные в trainer
"""

from datetime import datetime, timedelta

import numpy as np
from sqlalchemy.orm import Session

from app.ml import predictor, trainer
from app.models.warehouse import Part, StockOperation

ANALYSIS_PERIOD_DAYS = 30   # за сколько дней считать расход


# ─── Сбор данных из БД ───────────────────────────────────────────────────────

def _load_parts_with_stats(db: Session) -> list[dict]:
    """
    Возвращает список словарей: каждая запчасть + её статистика расхода.
    """
    parts = db.query(Part).all()
    if not parts:
        return []

    since = datetime.utcnow() - timedelta(days=ANALYSIS_PERIOD_DAYS)

    # Суммируем расход (OUT) по каждой запчасти за период
    out_ops = (
        db.query(StockOperation)
        .filter(
            StockOperation.operation_date >= since,
            StockOperation.operation_type == "OUT",
        )
        .all()
    )

    consumption: dict[int, int] = {}
    for op in out_ops:
        consumption[op.part_id] = consumption.get(op.part_id, 0) + op.quantity

    result = []
    for part in parts:
        monthly = consumption.get(part.id, 0)
        daily   = round(monthly / ANALYSIS_PERIOD_DAYS, 3)

        result.append({
            "part_id":             part.id,
            "part_name":           part.name,
            "article":             part.article,
            "current_stock":       part.quantity_in_stock,
            "min_stock":           part.min_quantity,
            "monthly_consumption": monthly,
            "daily_rate":          daily,
            "unit_price":          float(part.price),
        })

    return result


# ─── Публичные функции сервиса ────────────────────────────────────────────────

def get_stock_analysis(db: Session) -> dict:
    """
    Полный анализ склада нейросетью.
    Используется в GET /api/ai/stock/analysis
    """
    parts = _load_parts_with_stats(db)

    if not parts:
        return {
            "total_parts":    0,
            "critical_parts": 0,
            "warning_parts":  0,
            "ok_parts":       0,
            "model_accuracy": None,
            "parts":          [],
        }

    predictions = predictor.predict(parts)

    # Сортировка: critical → warning → ok
    order = {"critical": 0, "warning": 1, "ok": 2}
    predictions.sort(key=lambda p: order.get(p["urgency"], 3))

    critical = sum(1 for p in predictions if p["urgency"] == "critical")
    warning  = sum(1 for p in predictions if p["urgency"] == "warning")
    ok       = len(predictions) - critical - warning

    return {
        "total_parts":    len(predictions),
        "critical_parts": critical,
        "warning_parts":  warning,
        "ok_parts":       ok,
        "model_accuracy": None,   # заполняется после train
        "parts":          predictions,
    }


def get_reorder_list(db: Session) -> dict:
    """
    Список запчастей для закупки (только те, у кого recommended_order_qty > 0).
    Используется в GET /api/ai/stock/reorder
    """
    analysis = get_stock_analysis(db)

    items = []
    total_cost = 0.0

    # Цены из БД
    prices = {p.id: float(p.price) for p in db.query(Part).all()}

    for p in analysis["parts"]:
        qty = p["recommended_order_qty"]
        if qty <= 0:
            continue

        unit_price = prices.get(p["part_id"])
        est_cost   = round(unit_price * qty, 2) if unit_price else None
        if est_cost:
            total_cost += est_cost

        items.append({
            "part_id":               p["part_id"],
            "part_name":             p["part_name"],
            "article":               p["article"],
            "current_stock":         p["current_stock"],
            "recommended_order_qty": qty,
            "estimated_cost":        est_cost,
            "urgency":               p["urgency"],
            "confidence":            p["confidence"],
        })

    return {
        "total_items":          len(items),
        "total_estimated_cost": round(total_cost, 2) if total_cost > 0 else None,
        "items":                items,
    }


def train_model(db: Session) -> dict:
    """
    Обучает нейросеть.
    Сначала берёт синтетику (2000 примеров),
    затем дообучает на реальных данных из БД если они есть.
    Используется в POST /api/ai/train
    """
    parts = _load_parts_with_stats(db)

    extra_X, extra_y = None, None

    if parts:
        # Формируем реальные признаки из данных БД
        from app.ml.data_generator import MAX_DAYS_CAP, _compute_urgency

        rows, labels = [], []
        for p in parts:
            current = float(p["current_stock"])
            min_s   = float(p["min_stock"])
            daily   = float(p["daily_rate"])
            monthly = float(p["monthly_consumption"])
            ratio   = (current / min_s) if min_s > 0 else 1.0
            days    = min((current / daily) if daily > 0 else MAX_DAYS_CAP, MAX_DAYS_CAP)

            urgency = _compute_urgency(current, min_s, days)

            rows.append([current, min_s, daily, ratio, days, monthly])
            labels.append(urgency)

        extra_X = np.array(rows,   dtype=np.float32)
        extra_y = np.array(labels, dtype=np.int32)

    return trainer.train(extra_X=extra_X, extra_y=extra_y)
