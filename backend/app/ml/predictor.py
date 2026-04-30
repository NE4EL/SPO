"""
Предсказание нейросетью по данным из БД.

Принимает на вход список запчастей (уже посчитанных),
возвращает urgency + рекомендуемый объём заказа для каждой.
"""

import numpy as np
from app.ml.trainer import load, model_exists
from app.ml.data_generator import MAX_DAYS_CAP

# Горизонт заказа: на сколько дней вперёд рассчитываем закупку
ORDER_HORIZON_DAYS = 45


def _build_feature_row(part: dict) -> list[float]:
    """
    Преобразует словарь с данными запчасти в вектор признаков.
    Порядок ДОЛЖЕН совпадать с data_generator.py:
      [current_stock, min_stock, daily_rate, stock_ratio,
       days_until_stockout, monthly_consumption]
    """
    current  = float(part["current_stock"])
    min_s    = float(part["min_stock"])
    daily    = float(part["daily_rate"])
    monthly  = float(part["monthly_consumption"])

    ratio    = (current / min_s) if min_s > 0 else 1.0
    days     = (current / daily) if daily > 0 else MAX_DAYS_CAP
    days     = min(days, MAX_DAYS_CAP)

    return [current, min_s, daily, ratio, days, monthly]


def _recommended_order(part: dict, urgency: int) -> int:
    """
    Формула расчёта рекомендуемого количества для заказа.
    Если нейросеть говорит ok → 0.
    Иначе — покрыть ORDER_HORIZON_DAYS дней + добить до min_stock.
    """
    if urgency == 0:
        return 0

    daily   = part["daily_rate"]
    current = part["current_stock"]
    min_s   = part["min_stock"]

    if daily > 0:
        needed = int(daily * ORDER_HORIZON_DAYS)
    else:
        # Нет расхода, но запас ниже минимума → заказываем до 2×min
        needed = min_s * 2

    order = max(0, needed - current)
    return order


URGENCY_MAP = {0: "ok", 1: "warning", 2: "critical"}


def predict(parts: list[dict]) -> list[dict]:
    """
    parts — список словарей с ключами:
      part_id, part_name, article,
      current_stock, min_stock,
      daily_rate, monthly_consumption

    Возвращает тот же список + поля:
      urgency (str), urgency_code (int),
      days_until_stockout (int|None),
      recommended_order_qty (int),
      confidence (float, %)
    """
    if not parts:
        return []

    if not model_exists():
        raise RuntimeError(
            "Модель не обучена. Запусти: python train_model.py"
        )

    model, scaler = load()

    # Собираем матрицу признаков
    X_raw = np.array([_build_feature_row(p) for p in parts], dtype=np.float32)
    X_scaled = scaler.transform(X_raw)

    # Предсказание класса и вероятностей
    urgency_codes = model.predict(X_scaled)
    probabilities = model.predict_proba(X_scaled)   # shape: (N, 3)

    results = []
    for i, part in enumerate(parts):
        code       = int(urgency_codes[i])
        confidence = float(probabilities[i][code]) * 100

        daily = part["daily_rate"]
        current = part["current_stock"]
        days_until = int(current / daily) if daily > 0 else None

        results.append({
            **part,
            "urgency":               URGENCY_MAP[code],
            "urgency_code":          code,
            "days_until_stockout":   days_until,
            "recommended_order_qty": _recommended_order(part, code),
            "confidence":            round(confidence, 1),
        })

    return results
