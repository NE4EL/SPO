"""
Интеграционные тесты заказ-нарядов: CRUD, права доступа, бизнес-логика.
"""
import pytest


def create_client_and_vehicle(client_http, manager_headers) -> int:
    """Создаёт клиента и автомобиль, возвращает vehicle_id."""
    cl = client_http.post("/api/clients/", json={
        "full_name": "Иван Тестовый",
        "phone": "+79991234567",
    }, headers=manager_headers)
    client_id = cl.json()["id"]

    vh = client_http.post("/api/vehicles/", json={
        "client_id": client_id,
        "brand": "Toyota",
        "model": "Camry",
        "year": 2020,
        "plate_number": "A100AA77",
        "mileage": 50000,
    }, headers=manager_headers)
    return vh.json()["id"]


class TestListOrders:
    def test_manager_can_list_orders(self, client, manager_headers):
        response = client.get("/api/work-orders/", headers=manager_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_unauthenticated_cannot_list_orders(self, client):
        response = client.get("/api/work-orders/")
        assert response.status_code == 403

    def test_mechanic_sees_only_own_orders(self, client, manager_headers, mechanic_user, mechanic_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)
        mechanic_employee_id = mechanic_user.employee.id

        # Создаём заказ назначенный механику
        client.post("/api/work-orders/", json={
            "vehicle_id": vehicle_id,
            "mechanic_id": mechanic_employee_id,
        }, headers=manager_headers)

        # Создаём заказ без механика
        client.post("/api/work-orders/", json={
            "vehicle_id": vehicle_id,
        }, headers=manager_headers)

        response = client.get("/api/work-orders/", headers=mechanic_headers)
        orders = response.json()
        assert len(orders) == 1
        assert orders[0]["mechanic_id"] == mechanic_employee_id


class TestCreateOrder:
    def test_manager_can_create_order(self, client, manager_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)

        response = client.post("/api/work-orders/", json={
            "vehicle_id": vehicle_id,
            "notes": "Плановое ТО",
        }, headers=manager_headers)
        assert response.status_code == 200
        data = response.json()
        assert "order_number" in data
        assert data["order_number"].startswith("WO-")
        assert data["status"] == "pending"

    def test_mechanic_cannot_create_order(self, client, manager_headers, mechanic_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)

        response = client.post("/api/work-orders/", json={
            "vehicle_id": vehicle_id,
        }, headers=mechanic_headers)
        assert response.status_code == 403

    def test_invalid_vehicle_id_returns_error(self, client, manager_headers):
        response = client.post("/api/work-orders/", json={
            "vehicle_id": 99999,
        }, headers=manager_headers)
        # FK нарушение → 500 (IntegrityError не обрабатывается в API)
        assert response.status_code >= 400


class TestGetOrder:
    def test_get_existing_order(self, client, manager_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)
        created = client.post("/api/work-orders/", json={"vehicle_id": vehicle_id}, headers=manager_headers)
        order_id = created.json()["id"]

        response = client.get(f"/api/work-orders/{order_id}", headers=manager_headers)
        assert response.status_code == 200
        assert response.json()["id"] == order_id

    def test_get_nonexistent_order_returns_404(self, client, manager_headers):
        response = client.get("/api/work-orders/99999", headers=manager_headers)
        assert response.status_code == 404


class TestUpdateOrder:
    def test_manager_can_update_status(self, client, manager_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)
        created = client.post("/api/work-orders/", json={"vehicle_id": vehicle_id}, headers=manager_headers)
        order_id = created.json()["id"]

        response = client.put(f"/api/work-orders/{order_id}", json={
            "status": "in_progress",
        }, headers=manager_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"

    def test_manager_can_update_notes(self, client, manager_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)
        created = client.post("/api/work-orders/", json={"vehicle_id": vehicle_id}, headers=manager_headers)
        order_id = created.json()["id"]

        response = client.put(f"/api/work-orders/{order_id}", json={
            "notes": "Требуется замена масла",
        }, headers=manager_headers)
        assert response.status_code == 200
        assert response.json()["notes"] == "Требуется замена масла"


class TestDeleteOrder:
    def test_manager_can_delete_order(self, client, manager_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)
        created = client.post("/api/work-orders/", json={"vehicle_id": vehicle_id}, headers=manager_headers)
        order_id = created.json()["id"]

        response = client.delete(f"/api/work-orders/{order_id}", headers=manager_headers)
        assert response.status_code == 200

        get_response = client.get(f"/api/work-orders/{order_id}", headers=manager_headers)
        assert get_response.status_code == 404

    def test_mechanic_cannot_delete_order(self, client, manager_headers, mechanic_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)
        created = client.post("/api/work-orders/", json={"vehicle_id": vehicle_id}, headers=manager_headers)
        order_id = created.json()["id"]

        response = client.delete(f"/api/work-orders/{order_id}", headers=mechanic_headers)
        assert response.status_code == 403

    def test_delete_nonexistent_order_returns_404(self, client, manager_headers):
        response = client.delete("/api/work-orders/99999", headers=manager_headers)
        assert response.status_code == 404


class TestAddPartToOrder:
    def test_add_part_to_order(self, client, manager_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)
        created_order = client.post("/api/work-orders/", json={"vehicle_id": vehicle_id}, headers=manager_headers)
        order_id = created_order.json()["id"]

        part = client.post("/api/parts/", json={
            "name": "Фильтр",
            "article": "F-TEST",
            "price": 500.0,
            "quantity_in_stock": 10,
        }, headers=manager_headers)
        part_id = part.json()["id"]

        response = client.post(f"/api/work-orders/{order_id}/parts", json={
            "part_id": part_id,
            "quantity": 2,
            "price_at_moment": 500.0,
        }, headers=manager_headers)
        assert response.status_code == 200
        assert response.json()["quantity"] == 2
