"""
Unit-тесты Pydantic-схем: валидация полей, округление, ошибки.
"""
import pytest
from pydantic import ValidationError

from app.schemas.warehouse import PartCreate, PartUpdate, StockOperationCreate
from app.schemas.work_order import OrderPartCreate, WorkOrderResponse
from datetime import datetime


class TestPartCreate:
    def test_valid_part(self):
        part = PartCreate(name="Фильтр масляный", article="FM-001", price=450.0)
        assert part.name == "Фильтр масляный"
        assert part.price == 450.0

    def test_default_values(self):
        part = PartCreate(name="Свеча", article="SK-002", price=100.0)
        assert part.quantity_in_stock == 0
        assert part.min_quantity == 5
        assert part.unit == "шт"

    def test_negative_price_raises(self):
        with pytest.raises(ValidationError):
            PartCreate(name="Фильтр", article="F-001", price=-10.0)

    def test_price_rounded_to_two_decimals(self):
        part = PartCreate(name="Масло", article="M-001", price=99.9999)
        assert part.price == 100.0

    def test_zero_price_allowed(self):
        part = PartCreate(name="Деталь", article="D-001", price=0.0)
        assert part.price == 0.0


class TestPartUpdate:
    def test_all_fields_optional(self):
        update = PartUpdate()
        assert update.name is None
        assert update.price is None

    def test_negative_price_raises(self):
        with pytest.raises(ValidationError):
            PartUpdate(price=-5.0)

    def test_valid_price_update(self):
        update = PartUpdate(price=199.99)
        assert update.price == 199.99

    def test_none_price_allowed(self):
        update = PartUpdate(price=None)
        assert update.price is None


class TestStockOperationCreate:
    def test_valid_in_operation(self):
        op = StockOperationCreate(part_id=1, operation_type="IN", quantity=10)
        assert op.operation_type == "IN"
        assert op.quantity == 10

    def test_valid_out_operation(self):
        op = StockOperationCreate(part_id=1, operation_type="OUT", quantity=5)
        assert op.operation_type == "OUT"

    def test_optional_fields_default_none(self):
        op = StockOperationCreate(part_id=1, operation_type="ADJUSTMENT", quantity=3)
        assert op.performed_by_id is None
        assert op.work_order_id is None
        assert op.notes is None


class TestOrderPartCreate:
    def test_valid_order_part(self):
        part = OrderPartCreate(part_id=1, quantity=2, price_at_moment=500.0)
        assert part.price_at_moment == 500.0

    def test_negative_price_raises(self):
        with pytest.raises(ValidationError):
            OrderPartCreate(part_id=1, quantity=1, price_at_moment=-1.0)

    def test_price_rounded(self):
        part = OrderPartCreate(part_id=1, quantity=1, price_at_moment=99.999)
        assert part.price_at_moment == 100.0

    def test_zero_price_allowed(self):
        part = OrderPartCreate(part_id=1, quantity=1, price_at_moment=0.0)
        assert part.price_at_moment == 0.0


class TestWorkOrderResponse:
    def _make_response(self, total_cost: float) -> WorkOrderResponse:
        return WorkOrderResponse(
            id=1,
            order_number="WO-2026-0001",
            vehicle_id=1,
            mechanic_id=None,
            status="pending",
            created_at=datetime.utcnow(),
            completed_at=None,
            total_cost=total_cost,
            notes=None,
        )

    def test_total_cost_rounded(self):
        resp = self._make_response(total_cost=1234.5678)
        assert resp.total_cost == 1234.57

    def test_total_cost_zero(self):
        resp = self._make_response(total_cost=0.0)
        assert resp.total_cost == 0.0
