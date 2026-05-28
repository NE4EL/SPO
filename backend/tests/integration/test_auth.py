"""
Интеграционные тесты эндпоинтов авторизации.
"""
import pytest


class TestLogin:
    def test_login_success(self, client, admin_user):
        response = client.post("/api/auth/login", json={
            "username": "test_admin",
            "password": "password123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == "admin"
        assert data["username"] == "test_admin"

    def test_login_wrong_password(self, client, admin_user):
        response = client.post("/api/auth/login", json={
            "username": "test_admin",
            "password": "wrong_password",
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/api/auth/login", json={
            "username": "nobody",
            "password": "password123",
        })
        assert response.status_code == 401

    def test_login_manager(self, client, manager_user):
        response = client.post("/api/auth/login", json={
            "username": "test_manager",
            "password": "password123",
        })
        assert response.status_code == 200
        assert response.json()["role"] == "manager"

    def test_login_mechanic(self, client, mechanic_user):
        response = client.post("/api/auth/login", json={
            "username": "test_mechanic",
            "password": "password123",
        })
        assert response.status_code == 200
        assert response.json()["role"] == "mechanic"


class TestGetMe:
    def test_get_me_success(self, client, admin_headers):
        response = client.get("/api/auth/me", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "test_admin"
        assert data["role"] == "admin"

    def test_get_me_no_token(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 403

    def test_get_me_invalid_token(self, client):
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalid.token.here"
        })
        assert response.status_code in (401, 403)

    def test_get_me_manager(self, client, manager_headers):
        response = client.get("/api/auth/me", headers=manager_headers)
        assert response.status_code == 200
        assert response.json()["username"] == "test_manager"


class TestRefreshToken:
    def test_refresh_success(self, client, admin_user):
        login = client.post("/api/auth/login", json={
            "username": "test_admin",
            "password": "password123",
        })
        refresh_token = login.json()["refresh_token"]

        response = client.post("/api/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_refresh_with_invalid_token(self, client):
        response = client.post("/api/auth/refresh", json={
            "refresh_token": "invalid.token.here",
        })
        assert response.status_code == 401
