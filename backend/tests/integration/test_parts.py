"""
Интеграционные тесты эндпоинтов запчастей (CRUD + права доступа).
"""
import pytest


PART_DATA = {
    "name": "Фильтр масляный",
    "article": "FM-2026",
    "quantity_in_stock": 20,
    "min_quantity": 5,
    "price": 450.00,
    "unit": "шт",
}


class TestListParts:
    def test_mechanic_can_list_parts(self, client, mechanic_headers):
        response = client.get("/api/parts/", headers=mechanic_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_manager_can_list_parts(self, client, manager_headers):
        response = client.get("/api/parts/", headers=manager_headers)
        assert response.status_code == 200

    def test_unauthenticated_cannot_list_parts(self, client):
        response = client.get("/api/parts/")
        assert response.status_code == 403

    def test_returns_created_parts(self, client, manager_headers):
        client.post("/api/parts/", json=PART_DATA, headers=manager_headers)
        response = client.get("/api/parts/", headers=manager_headers)
        assert len(response.json()) >= 1


class TestGetPart:
    def test_get_existing_part(self, client, manager_headers):
        created = client.post("/api/parts/", json=PART_DATA, headers=manager_headers)
        part_id = created.json()["id"]

        response = client.get(f"/api/parts/{part_id}", headers=manager_headers)
        assert response.status_code == 200
        assert response.json()["article"] == "FM-2026"

    def test_get_nonexistent_part_returns_404(self, client, mechanic_headers):
        response = client.get("/api/parts/99999", headers=mechanic_headers)
        assert response.status_code == 404


class TestCreatePart:
    def test_manager_can_create_part(self, client, manager_headers):
        response = client.post("/api/parts/", json=PART_DATA, headers=manager_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Фильтр масляный"
        assert data["article"] == "FM-2026"
        assert data["price"] == 450.0
        assert "id" in data

    def test_admin_can_create_part(self, client, admin_headers):
        response = client.post("/api/parts/", json={**PART_DATA, "article": "FM-ADM"}, headers=admin_headers)
        assert response.status_code == 200

    def test_mechanic_cannot_create_part(self, client, mechanic_headers):
        response = client.post("/api/parts/", json=PART_DATA, headers=mechanic_headers)
        assert response.status_code == 403

    def test_unauthenticated_cannot_create_part(self, client):
        response = client.post("/api/parts/", json=PART_DATA)
        assert response.status_code == 403

    def test_negative_price_rejected(self, client, manager_headers):
        bad_data = {**PART_DATA, "price": -100.0}
        response = client.post("/api/parts/", json=bad_data, headers=manager_headers)
        assert response.status_code == 422

    def test_missing_required_fields_rejected(self, client, manager_headers):
        response = client.post("/api/parts/", json={"name": "Test"}, headers=manager_headers)
        assert response.status_code == 422


class TestUpdatePart:
    def test_manager_can_update_part(self, client, manager_headers):
        created = client.post("/api/parts/", json=PART_DATA, headers=manager_headers)
        part_id = created.json()["id"]

        response = client.put(f"/api/parts/{part_id}", json={"price": 600.0}, headers=manager_headers)
        assert response.status_code == 200
        assert response.json()["price"] == 600.0

    def test_mechanic_cannot_update_part(self, client, manager_headers, mechanic_headers):
        created = client.post("/api/parts/", json=PART_DATA, headers=manager_headers)
        part_id = created.json()["id"]

        response = client.put(f"/api/parts/{part_id}", json={"price": 100.0}, headers=mechanic_headers)
        assert response.status_code == 403

    def test_update_nonexistent_part_returns_404(self, client, manager_headers):
        response = client.put("/api/parts/99999", json={"price": 100.0}, headers=manager_headers)
        assert response.status_code == 404


class TestDeletePart:
    def test_manager_can_delete_part(self, client, manager_headers):
        created = client.post("/api/parts/", json=PART_DATA, headers=manager_headers)
        part_id = created.json()["id"]

        response = client.delete(f"/api/parts/{part_id}", headers=manager_headers)
        assert response.status_code == 200

        # Проверяем что запчасть удалена
        get_response = client.get(f"/api/parts/{part_id}", headers=manager_headers)
        assert get_response.status_code == 404

    def test_mechanic_cannot_delete_part(self, client, manager_headers, mechanic_headers):
        created = client.post("/api/parts/", json=PART_DATA, headers=manager_headers)
        part_id = created.json()["id"]

        response = client.delete(f"/api/parts/{part_id}", headers=mechanic_headers)
        assert response.status_code == 403

    def test_delete_nonexistent_part_returns_404(self, client, manager_headers):
        response = client.delete("/api/parts/99999", headers=manager_headers)
        assert response.status_code == 404
