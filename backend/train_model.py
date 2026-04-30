"""
Скрипт первичного обучения нейросети.

Запускать из корня проекта:
  python train_model.py

Что происходит:
  1. Генерирует 2000 синтетических обучающих примеров
  2. Обучает MLPClassifier (128 → 64 → 32)
  3. Выводит точность и отчёт по классам
  4. Сохраняет веса в app/ml/weights/
"""

import sys
import os

# Чтобы импорты app.* работали из корня проекта
sys.path.insert(0, os.path.dirname(__file__))

from app.ml.trainer import train

if __name__ == "__main__":
    print("=" * 55)
    print("  Обучение нейросети для анализа склада СТО")
    print("=" * 55)

    result = train()   # без реальных данных — только синтетика

    print(f"\n✅ Обучение завершено!")
    print(f"   Всего примеров   : {result['samples_total']}")
    print(f"   Реальных данных  : {result['real_samples']}")
    print(f"   Итераций         : {result['iterations']}")
    print(f"   Архитектура      : {result['layers']}")
    print(f"   Точность (test)  : {result['accuracy']}%")

    print("\nРезультаты по классам:")
    for cls, metrics in result["report"].items():
        if isinstance(metrics, dict):
            print(f"  [{cls:8s}]  precision={metrics['precision']:.2f}  "
                  f"recall={metrics['recall']:.2f}  "
                  f"f1={metrics['f1-score']:.2f}")

    print("\n💾 Веса сохранены в app/ml/weights/")
    print("   Теперь можно запускать: uvicorn main:app --reload")
