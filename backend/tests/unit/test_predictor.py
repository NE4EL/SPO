"""
Unit-тесты предиктора: вычисление признаков и рекомендаций по заказу.
Тестируем чистые функции без БД, HTTP и обученной модели.
"""
import pytest

from app.ml.predictor import _build_feature_row, _recommended_order, ORDER_HORIZON_DAYS


def make_part(
    current_stock: float = 20.0,
    min_stock: float = 5.0,
    daily_rate: float = 1.0,
    monthly_consumption: float = 30.0,
) -> dict:
    stock_ratio = current_stock / min_stock if min_stock > 0 else 0.0
    days = current_stock / daily_rate if daily_rate > 0 else 180.0
    return {
        "current_stock": current_stock,
        "min_stock": min_stock,
        "daily_rate": daily_rate,
        "stock_ratio": stock_ratio,
        "days_until_stockout": min(days, 180.0),
        "monthly_consumption": monthly_consumption,
    }


class TestBuildFeatureRow:
    def test_returns_six_elements(self):
        row = _build_feature_row(make_part())
        assert len(row) == 6

    def test_correct_order(self):
        part = make_part(
            current_stock=10.0,
            min_stock=5.0,
            daily_rate=2.0,
            monthly_consumption=60.0,
        )
        row = _build_feature_row(part)
        assert row[0] == 10.0   # current_stock
        assert row[1] == 5.0    # min_stock
        assert row[2] == 2.0    # daily_rate
        assert row[3] == 2.0    # stock_ratio = 10/5
        assert row[4] == 5.0    # days_until_stockout = 10/2
        assert row[5] == 60.0   # monthly_consumption

    def test_zero_stock(self):
        part = make_part(current_stock=0.0, daily_rate=1.0)
        row = _build_feature_row(part)
        assert row[0] == 0.0


class TestRecommendedOrder:
    def test_ok_urgency_returns_zero(self):
        part = make_part(current_stock=100.0, daily_rate=1.0)
        assert _recommended_order(part, urgency=0) == 0

    def test_warning_with_daily_rate(self):
        # needed = daily_rate * ORDER_HORIZON_DAYS = 2 * 45 = 90
        # order = needed - current = 90 - 10 = 80
        part = make_part(current_stock=10.0, daily_rate=2.0)
        result = _recommended_order(part, urgency=1)
        expected = max(0, int(2.0 * ORDER_HORIZON_DAYS) - 10)
        assert result == expected

    def test_critical_with_daily_rate(self):
        part = make_part(current_stock=5.0, daily_rate=1.0)
        result = _recommended_order(part, urgency=2)
        expected = max(0, int(1.0 * ORDER_HORIZON_DAYS) - 5)
        assert result == expected

    def test_warning_no_consumption_uses_min_stock(self):
        # daily_rate=0 → needed = min_stock * 2
        part = make_part(current_stock=3.0, min_stock=10.0, daily_rate=0.0)
        result = _recommended_order(part, urgency=1)
        expected = max(0, 10 * 2 - 3)
        assert result == expected

    def test_order_never_negative(self):
        # Если current_stock уже больше нужного — заказ = 0
        part = make_part(current_stock=1000.0, daily_rate=1.0)
        result = _recommended_order(part, urgency=1)
        assert result >= 0

    def test_order_horizon_constant(self):
        assert ORDER_HORIZON_DAYS == 45
