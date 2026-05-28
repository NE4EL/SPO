import pytest


def login(client, username: str, password: str) -> dict:
    """Логинится и возвращает заголовок Authorization."""
    resp = client.post("/api/auth/login", json={
        "username": username,
        "password": password,
    })
    assert resp.status_code == 200, f"Ошибка входа для {username}: {resp.json()}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def register_user(client, admin_headers: dict, username: str,
                  password: str, role: str) -> dict:
    """Администратор создаёт нового пользователя, возвращает его данные."""
    resp = client.post("/api/users/", json={
        "username": username,
        "email": f"{username}@test.com",
        "password": password,
        "role": role,
        "full_name": f"Тест {username.title()}",
    }, headers=admin_headers)
    assert resp.status_code == 200, f"Ошибка создания пользователя {username}: {resp.json()}"
    return resp.json()


# ─── Основной сценарий ────────────────────────────────────────────────────────

class TestFullBusinessFlow:

    def test_complete_order_lifecycle(self, client):
        """
        Полный цикл: регистрация → создание данных → заказ → завершение.
        Проверяем все эффекты бизнес-логики после завершения заказа.
        """

        # ── Шаг 1: Вход администратора ────────────────────────────────────────
        # Администратор создаётся автоматически при старте приложения
        # (lifespan-хук в main.py, ADMIN_USERNAME=admin, ADMIN_PASSWORD=admin123)
        admin = login(client, "admin", "admin123")

        # Проверяем что /me возвращает корректного пользователя
        me = client.get("/api/auth/me", headers=admin)
        assert me.status_code == 200
        assert me.json()["role"] == "admin"

        # ── Шаг 2: Регистрация менеджера и механика ───────────────────────────
        register_user(client, admin, "manager1", "manager_pass", "manager")
        register_user(client, admin, "mechanic1", "mechanic_pass", "mechanic")

        # Проверяем что в системе теперь 3 пользователя (admin + manager + mechanic)
        users_resp = client.get("/api/users/", headers=admin)
        assert users_resp.status_code == 200
        usernames = [u["username"] for u in users_resp.json()]
        assert "admin" in usernames
        assert "manager1" in usernames
        assert "mechanic1" in usernames

        # ── Шаг 3: Вход менеджера ─────────────────────────────────────────────
        manager = login(client, "manager1", "manager_pass")

        # Убеждаемся что менеджер не видит список пользователей (только admin)
        forbidden = client.get("/api/users/", headers=manager)
        assert forbidden.status_code == 403

        # ── Шаг 4: Создание клиента и автомобиля ─────────────────────────────
        client_resp = client.post("/api/clients/", json={
            "full_name": "Иван Петров",
            "phone": "+79161234567",
            "email": "ivan@example.com",
        }, headers=manager)
        assert client_resp.status_code == 200
        client_id = client_resp.json()["id"]

        vehicle_resp = client.post("/api/vehicles/", json={
            "client_id": client_id,
            "brand": "Toyota",
            "model": "Camry",
            "year": 2021,
            "plate_number": "B456BB99",
            "mileage": 35000,
        }, headers=manager)
        assert vehicle_resp.status_code == 200
        vehicle_id = vehicle_resp.json()["id"]

        # ── Шаг 5: Создание запчасти на складе ───────────────────────────────
        # Начальный остаток: 10 штук, минимум: 3 штуки
        part_resp = client.post("/api/parts/", json={
            "name": "Моторное масло 5W-30",
            "article": "OIL-5W30",
            "quantity_in_stock": 10,
            "min_quantity": 3,
            "price": 850.00,
            "unit": "л",
        }, headers=manager)
        assert part_resp.status_code == 200
        part_id = part_resp.json()["id"]

        # Проверяем начальный остаток
        part_before = client.get(f"/api/parts/{part_id}", headers=manager)
        assert part_before.json()["quantity_in_stock"] == 10

        # ── Шаг 6: Получение employee_id механика для назначения на заказ ─────
        # mechanic_id в work_orders ссылается на employees.id, а не users.id
        all_users = client.get("/api/users/", headers=admin).json()
        mechanic_data = next(u for u in all_users if u["username"] == "mechanic1")
        mechanic_user_id = mechanic_data["id"]

        # Получаем employee_id через прямой запрос к auth/me от лица механика
        mechanic = login(client, "mechanic1", "mechanic_pass")
        mechanic_me = client.get("/api/auth/me", headers=mechanic).json()
        # employee_id — это id в таблице employees; берём из структуры пользователя
        # В нашей схеме UserResponse не возвращает employee.id напрямую,
        # поэтому назначим заказ без механика и проверим другую логику
        # (тест видимости заказов механиком — в отдельном тесте ниже)

        # ── Шаг 7: Создание заказ-наряда ─────────────────────────────────────
        order_resp = client.post("/api/work-orders/", json={
            "vehicle_id": vehicle_id,
            "notes": "Плановая замена масла",
        }, headers=manager)
        assert order_resp.status_code == 200
        order = order_resp.json()
        order_id = order["id"]

        # Проверяем автогенерацию номера заказа
        assert order["order_number"].startswith("WO-")
        assert order["status"] == "pending"
        assert order["total_cost"] == 0.0

        # ── Шаг 8: Добавление запчасти в заказ ───────────────────────────────
        # Добавляем 9 литров масла по 850 руб.
        add_part_resp = client.post(f"/api/work-orders/{order_id}/parts", json={
            "part_id": part_id,
            "quantity": 9,
            "price_at_moment": 850.00,
        }, headers=manager)
        assert add_part_resp.status_code == 200
        assert add_part_resp.json()["quantity"] == 9

        # ── Шаг 9: Завершение заказа ──────────────────────────────────────────
        complete_resp = client.post(
            f"/api/work-orders/{order_id}/complete",
            headers=manager,
        )
        assert complete_resp.status_code == 200
        result = complete_resp.json()

        # Проверяем что метод вернул информацию о списанных запчастях
        assert "parts_deducted" in result
        assert len(result["parts_deducted"]) == 1

        deducted = result["parts_deducted"][0]
        assert deducted["part_id"] == part_id
        assert deducted["quantity_used"] == 9
        assert deducted["old_stock"] == 10
        assert deducted["new_stock"] == 1   # 10 - 9 = 1

        # ── Проверка 1: Остаток на складе уменьшился ─────────────────────────
        part_after = client.get(f"/api/parts/{part_id}", headers=manager)
        assert part_after.status_code == 200
        assert part_after.json()["quantity_in_stock"] == 1  # было 10, потратили 9

        # ── Проверка 2: Статус заказа изменился на completed ─────────────────
        order_after = client.get(f"/api/work-orders/{order_id}", headers=manager)
        assert order_after.status_code == 200
        order_data = order_after.json()
        assert order_data["status"] == "completed"
        assert order_data["completed_at"] is not None

        # ── Проверка 3: Итоговая стоимость рассчитана верно ───────────────────
        # 9 литров × 850 руб. = 7650 руб.
        assert order_data["total_cost"] == 9 * 850.0

        # ── Проверка 4: Создана складская операция (OUT) ─────────────────────
        ops_resp = client.get("/api/stock/operations", headers=manager)
        assert ops_resp.status_code == 200
        operations = ops_resp.json()

        out_ops = [op for op in operations
                   if op["part_id"] == part_id and op["operation_type"] == "OUT"]
        assert len(out_ops) == 1, "Должна создаться ровно одна OUT-операция"
        assert out_ops[0]["quantity"] == 9

        # ── Проверка 5: Создан алерт о низком остатке ────────────────────────
        # Остаток 1 < min_quantity 3 → должен появиться алерт
        alerts_resp = client.get("/api/stock/alerts", headers=manager)
        assert alerts_resp.status_code == 200
        alerts = alerts_resp.json()

        low_stock = [a for a in alerts if a["part_id"] == part_id]
        assert len(low_stock) >= 1, "Алерт о низком остатке должен быть создан"
        assert low_stock[0]["current_quantity"] == 1

    def test_stock_manual_replenishment(self, client):
        """
        Тест ручного пополнения склада через складские операции.
        Проверяем что операция IN увеличивает остаток.
        """
        admin = login(client, "admin", "admin123")
        register_user(client, admin, "manager2", "pass123", "manager")
        manager = login(client, "manager2", "pass123")

        # Создаём запчасть с нулевым остатком
        part = client.post("/api/parts/", json={
            "name": "Тормозные колодки",
            "article": "BP-001",
            "quantity_in_stock": 0,
            "min_quantity": 2,
            "price": 1200.0,
        }, headers=manager).json()
        part_id = part["id"]

        # Пополняем склад на 5 штук
        client.post("/api/stock/operations", json={
            "part_id": part_id,
            "operation_type": "IN",
            "quantity": 5,
            "notes": "Поставка от поставщика",
        }, headers=manager)

        # Остаток должен стать 5
        updated = client.get(f"/api/parts/{part_id}", headers=manager).json()
        assert updated["quantity_in_stock"] == 5

        # Корректировка инвентаризацией: устанавливаем точное значение 4
        # (ADJUSTMENT задаёт абсолютный остаток, а не дельту)
        client.post("/api/stock/operations", json={
            "part_id": part_id,
            "operation_type": "ADJUSTMENT",
            "quantity": 4,
            "notes": "Инвентаризация: фактически 4 штуки",
        }, headers=manager)

        # Остаток должен стать ровно 4 (не 5-1, а именно 4 как задали)
        updated2 = client.get(f"/api/parts/{part_id}", headers=manager).json()
        assert updated2["quantity_in_stock"] == 4

    def test_mechanic_role_restrictions(self, client):
        """
        Тест ролевых ограничений механика:
        - видит только свои заказы
        - не может создавать заказы
        - не может создавать запчасти
        - не может удалять заказы
        """
        admin = login(client, "admin", "admin123")
        register_user(client, admin, "manager3", "pass123", "manager")
        register_user(client, admin, "mechanic3", "pass123", "mechanic")
        manager = login(client, "manager3", "pass123")
        mechanic = login(client, "mechanic3", "pass123")

        # Механик НЕ может создать запчасть
        r = client.post("/api/parts/", json={
            "name": "Фильтр", "article": "F-001", "price": 100.0
        }, headers=mechanic)
        assert r.status_code == 403

        # Механик НЕ может создать клиента
        r = client.post("/api/clients/", json={
            "full_name": "Тест", "phone": "+70000000000"
        }, headers=mechanic)
        assert r.status_code == 403

        # Механик НЕ может создать заказ
        r = client.post("/api/work-orders/", json={
            "vehicle_id": 1
        }, headers=mechanic)
        assert r.status_code == 403

        # Механик НЕ видит список пользователей
        r = client.get("/api/users/", headers=mechanic)
        assert r.status_code == 403

        # Механик МОЖЕТ читать список запчастей
        r = client.get("/api/parts/", headers=mechanic)
        assert r.status_code == 200

        # Механик видит пустой список заказов (ни одного не назначено)
        r = client.get("/api/work-orders/", headers=mechanic)
        assert r.status_code == 200
        assert r.json() == []

    def test_double_complete_is_idempotent(self, client):
        """
        Повторное завершение уже завершённого заказа
        не должно списывать запчасти дважды.
        """
        admin = login(client, "admin", "admin123")
        register_user(client, admin, "manager4", "pass123", "manager")
        manager = login(client, "manager4", "pass123")

        # Создаём клиента, авто, запчасть, заказ
        cl = client.post("/api/clients/", json={
            "full_name": "Клиент", "phone": "+71234567890"
        }, headers=manager).json()

        vh = client.post("/api/vehicles/", json={
            "client_id": cl["id"], "brand": "Lada", "model": "Vesta",
            "year": 2022, "plate_number": "X999XX99",
        }, headers=manager).json()

        part = client.post("/api/parts/", json={
            "name": "Свеча зажигания", "article": "SP-001",
            "quantity_in_stock": 4, "min_quantity": 1, "price": 300.0,
        }, headers=manager).json()

        order = client.post("/api/work-orders/", json={
            "vehicle_id": vh["id"]
        }, headers=manager).json()

        client.post(f"/api/work-orders/{order['id']}/parts", json={
            "part_id": part["id"], "quantity": 4, "price_at_moment": 300.0
        }, headers=manager)

        # Первое завершение
        r1 = client.post(f"/api/work-orders/{order['id']}/complete", headers=manager)
        assert r1.status_code == 200

        # Второе завершение — заказ уже завершён, должна быть ошибка или ответ с error
        r2 = client.post(f"/api/work-orders/{order['id']}/complete", headers=manager)
        # Ожидаем либо ошибку, либо ответ с полем "error"
        if r2.status_code == 200:
            assert "error" in r2.json()
        else:
            assert r2.status_code >= 400

        # Ключевая проверка: остаток НЕ изменился после второго вызова
        part_check = client.get(f"/api/parts/{part['id']}", headers=manager).json()
        assert part_check["quantity_in_stock"] == 0  # 4 - 4 = 0, не -4
