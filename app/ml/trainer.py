"""
Обучение нейросети и сохранение весов на диск.

Архитектура:
  MLPClassifier (sklearn) — многослойный персептрон
  Входной слой:  6 признаков
  Скрытые слои:  128 → 64 → 32 нейронов (ReLU)
  Выходной слой: 3 класса (ok / warning / critical)
  Нормализация:  StandardScaler (обязательно сохраняем вместе с моделью)

Файлы на диске:
  app/ml/weights/model.pkl   — веса нейросети
  app/ml/weights/scaler.pkl  — параметры нормализации
"""

import os
import joblib
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from app.ml.data_generator import generate, FEATURE_NAMES, URGENCY_LABELS

# ─── Пути ────────────────────────────────────────────────────────────────────

WEIGHTS_DIR  = os.path.join(os.path.dirname(__file__), "weights")
MODEL_PATH   = os.path.join(WEIGHTS_DIR, "model.pkl")
SCALER_PATH  = os.path.join(WEIGHTS_DIR, "scaler.pkl")


# ─── Конфигурация модели ──────────────────────────────────────────────────────

MLP_CONFIG = dict(
    hidden_layer_sizes=(128, 64, 32),   # три скрытых слоя
    activation="relu",
    solver="adam",
    max_iter=500,
    random_state=42,
    early_stopping=True,               # остановка при отсутствии прогресса
    validation_fraction=0.1,
    n_iter_no_change=20,
    verbose=False,
)


# ─── Публичные функции ────────────────────────────────────────────────────────

def train(extra_X: np.ndarray | None = None,
          extra_y: np.ndarray | None = None) -> dict:
    """
    Обучает нейросеть.

    extra_X / extra_y — реальные данные из БД (опционально).
    Они добавляются к синтетическим данным перед обучением.

    Возвращает словарь с метриками.
    """
    os.makedirs(WEIGHTS_DIR, exist_ok=True)

    # 1. Базовый синтетический датасет
    X, y = generate()

    # 2. Добавляем реальные данные если есть
    if extra_X is not None and len(extra_X) > 0:
        X = np.vstack([X, extra_X])
        y = np.concatenate([y, extra_y])

    # 3. Нормализация
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 4. Разбивка train / test
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    # 5. Обучение нейросети
    model = MLPClassifier(**MLP_CONFIG)
    model.fit(X_train, y_train)

    # 6. Оценка на тестовой выборке
    y_pred   = model.predict(X_test)
    accuracy = float((y_pred == y_test).mean())
    report   = classification_report(
        y_test, y_pred,
        target_names=["ok", "warning", "critical"],
        output_dict=True,
        zero_division=0,
    )

    # 7. Сохраняем модель и scaler
    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    return {
        "status":        "trained",
        "samples_total": len(X),
        "real_samples":  len(extra_X) if extra_X is not None else 0,
        "accuracy":      round(accuracy * 100, 2),
        "layers":        list(MLP_CONFIG["hidden_layer_sizes"]),
        "iterations":    model.n_iter_,
        "report":        report,
    }


def model_exists() -> bool:
    """Проверяет, обучена ли модель (файлы существуют)."""
    return os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH)


def load():
    """Загружает модель и scaler. Вызывай после проверки model_exists()."""
    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    return model, scaler
