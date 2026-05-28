"""
Unit-тесты генератора синтетических данных для ML-модели.
Тестируем чистые функции без БД и HTTP.
"""
import numpy as np
import pytest

from app.ml.data_generator import _compute_urgency, generate, MAX_DAYS_CAP, FEATURE_NAMES


class TestComputeUrgency:
    """Детерминированная функция классификации срочности."""

    def test_critical_when_stock_is_zero(self):
        assert _compute_urgency(current=0, min_s=10, days=30) == 2

    def test_critical_when_days_less_than_7(self):
        assert _compute_urgency(current=5, min_s=3, days=6) == 2

    def test_critical_when_days_exactly_6(self):
        assert _compute_urgency(current=5, min_s=3, days=6.9) == 2

    def test_warning_when_days_less_than_14(self):
        # days в [7, 14) и current >= min_s → warning
        assert _compute_urgency(current=20, min_s=5, days=10) == 1

    def test_warning_when_current_below_min(self):
        # days >= 14 но текущий запас ниже минимума → warning
        assert _compute_urgency(current=3, min_s=10, days=20) == 1

    def test_ok_when_stock_normal(self):
        # Нормальная ситуация: stock выше минимума, дней хватает
        assert _compute_urgency(current=50, min_s=10, days=30) == 0

    def test_ok_when_days_exactly_14(self):
        # Граничный случай: ровно 14 дней → ok
        assert _compute_urgency(current=20, min_s=5, days=14) == 0

    def test_zero_days_is_critical(self):
        assert _compute_urgency(current=0, min_s=5, days=0) == 2


class TestGenerate:
    """Тесты генерации синтетического датасета."""

    @pytest.fixture(scope="class")
    def dataset(self):
        X, y = generate()
        return X, y

    def test_returns_correct_shape(self, dataset):
        X, y = dataset
        assert X.shape == (2000, 6), f"Expected (2000, 6), got {X.shape}"
        assert y.shape == (2000,), f"Expected (2000,), got {y.shape}"

    def test_feature_count_matches_names(self, dataset):
        X, _ = dataset
        assert X.shape[1] == len(FEATURE_NAMES)

    def test_labels_only_valid_values(self, dataset):
        _, y = dataset
        unique = set(y.tolist())
        assert unique.issubset({0, 1, 2}), f"Unexpected labels: {unique}"

    def test_all_label_classes_present(self, dataset):
        _, y = dataset
        assert 0 in y, "Class 'ok' (0) missing from generated data"
        assert 1 in y, "Class 'warning' (1) missing from generated data"
        assert 2 in y, "Class 'critical' (2) missing from generated data"

    def test_days_until_stockout_capped(self, dataset):
        X, _ = dataset
        days_col = 4  # индекс days_until_stockout в FEATURE_NAMES
        assert np.all(X[:, days_col] <= MAX_DAYS_CAP), "days_until_stockout exceeds MAX_DAYS_CAP"

    def test_stock_ratio_non_negative(self, dataset):
        X, _ = dataset
        stock_ratio_col = 3  # индекс stock_ratio
        assert np.all(X[:, stock_ratio_col] >= 0), "stock_ratio contains negative values"

    def test_reproducible_with_fixed_seed(self):
        X1, y1 = generate()
        X2, y2 = generate()
        np.testing.assert_array_equal(X1, X2)
        np.testing.assert_array_equal(y1, y2)

    def test_custom_sample_count(self):
        X, y = generate(n_samples=100)
        assert X.shape[0] == 100
        assert y.shape[0] == 100
