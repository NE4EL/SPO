"""
Генератор синтетических данных для обучения нейросети.

Зачем нужен:
  В новом проекте БД пустая — нейросеть не на чём обучаться.
  Генерируем 2000 реалистичных примеров поведения склада автосервиса,
  затем дообучаем на реальных данных из БД.

Признаки (X):
  0  current_stock        — текущий остаток (шт)
  1  min_stock            — минимальный порог (шт)
  2  daily_rate           — средний дневной расход за 30 дней
  3  stock_ratio          — current / min  (насколько склад заполнен)
  4  days_until_stockout  — расчётных дней до нуля (макс. 180)
  5  monthly_consumption  — суммарный расход за 30 дней

Метки (y):
  urgency  — 0 = ok, 1 = warning, 2 = critical
"""

import numpy as np

RANDOM_SEED  = 42
N_SAMPLES    = 2000
MAX_DAYS_CAP = 180   # ограничение признака days_until_stockout


def _compute_urgency(current: float, min_s: float, days: float) -> int:
    """Детерминированное правило → метка urgency."""
    if current == 0 or days < 7:
        return 2   # critical
    if days < 14 or current < min_s:
        return 1   # warning
    return 0       # ok


def generate(n_samples: int = N_SAMPLES) -> tuple[np.ndarray, np.ndarray]:
    """
    Возвращает (X, y) — готовый датасет для обучения.
    """
    rng = np.random.default_rng(RANDOM_SEED)

    X, y = [], []

    for _ in range(n_samples):
        min_stock = int(rng.integers(3, 60))          # минимальный запас 3–60

        # --- сценарии разного наполнения склада ---
        scenario = rng.choice(["empty", "critical", "low", "normal", "full"],
                              p=[0.1, 0.15, 0.2, 0.35, 0.2])

        if scenario == "empty":
            current = 0
        elif scenario == "critical":
            current = int(rng.integers(1, max(2, min_stock // 3)))
        elif scenario == "low":
            current = int(rng.integers(min_stock // 3, min_stock))
        elif scenario == "normal":
            current = int(rng.integers(min_stock, min_stock * 2))
        else:  # full
            current = int(rng.integers(min_stock * 2, min_stock * 4))

        # --- расход: быстрые / средние / медленные запчасти ---
        speed = rng.choice(["fast", "medium", "slow", "idle"],
                           p=[0.15, 0.35, 0.35, 0.15])

        if speed == "fast":
            daily_rate = float(rng.uniform(3, 10))
        elif speed == "medium":
            daily_rate = float(rng.uniform(0.5, 3))
        elif speed == "slow":
            daily_rate = float(rng.uniform(0.05, 0.5))
        else:  # idle — запчасть лежит, почти не используется
            daily_rate = float(rng.uniform(0, 0.05))

        monthly_consumption = round(daily_rate * 30)

        days_until = (current / daily_rate) if daily_rate > 0 else MAX_DAYS_CAP
        days_until = min(days_until, MAX_DAYS_CAP)

        stock_ratio = (current / min_stock) if min_stock > 0 else 1.0

        urgency = _compute_urgency(current, min_stock, days_until)

        X.append([
            current,
            min_stock,
            round(daily_rate, 3),
            round(stock_ratio, 3),
            round(days_until, 1),
            monthly_consumption,
        ])
        y.append(urgency)

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


# Названия признаков (для отладки)
FEATURE_NAMES = [
    "current_stock",
    "min_stock",
    "daily_rate",
    "stock_ratio",
    "days_until_stockout",
    "monthly_consumption",
]

URGENCY_LABELS = {0: "ok", 1: "warning", 2: "critical"}
