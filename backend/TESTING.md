# Тестирование бэкенда — полное руководство

## Содержание

1. [Структура тестов](#1-структура-тестов)
2. [Как запустить тесты](#2-как-запустить-тесты)
3. [Инфраструктура тестирования (conftest.py)](#3-инфраструктура-тестирования-conftestpy)
4. [Unit-тесты](#4-unit-тесты)
5. [Интеграционные тесты](#5-интеграционные-тесты)
6. [Вопросы и ответы для преподавателя](#6-вопросы-и-ответы-для-преподавателя)

---

## 1. Структура тестов

```
backend/
├── pytest.ini                          # Конфигурация pytest
├── tests/
│   ├── conftest.py                     # Общие фикстуры и настройка БД
│   ├── unit/                           # Unit-тесты (без БД и HTTP)
│   │   ├── test_schemas.py             # Тесты Pydantic-схем (валидация)
│   │   ├── test_data_generator.py      # Тесты генератора ML-данных
│   │   └── test_predictor.py           # Тесты ML-предиктора
│   └── integration/                    # Интеграционные тесты (HTTP + БД)
│       ├── test_auth.py                # Тесты авторизации
│       ├── test_parts.py               # Тесты CRUD запчастей
│       └── test_work_orders.py         # Тесты заказ-нарядов
```

**Итого: 86 тестов**
- 43 unit-теста
- 43 интеграционных теста

---

## 2. Как запустить тесты

```bash
cd backend

# Все тесты
python -m pytest

# Только unit-тесты
python -m pytest tests/unit/

# Только интеграционные тесты
python -m pytest tests/integration/

# С подробным выводом (видно каждый тест)
python -m pytest -v

# Один конкретный файл
python -m pytest tests/unit/test_schemas.py

# Один конкретный тест
python -m pytest tests/unit/test_schemas.py::TestPartCreate::test_negative_price_raises
```

**PostgreSQL для тестов НЕ нужен** — используется SQLite в памяти.

---

## 3. Инфраструктура тестирования (conftest.py)

`conftest.py` — специальный файл pytest, который автоматически загружается перед тестами. В нём описаны общие фикстуры (fixtures) — переиспользуемые заготовки для тестов.

### 3.1 Подмена базы данных

```python
# Устанавливаем переменные среды ДО импорта приложения
os.environ["DATABASE_URL"] = "sqlite:///./test_sto.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-must-be-32chars!"
```

**Почему это важно:** приложение читает настройки через `python-decouple` при импорте. Если поставить переменные ДО `import main`, то всё приложение будет работать с тестовой SQLite-базой, а не с боевым PostgreSQL.

```python
# Создаём тестовый движок SQLite
test_engine = create_engine(
    "sqlite:///./test_sto.db",
    connect_args={"check_same_thread": False}  # нужно для SQLite + pytest
)

# Включаем поддержку внешних ключей (в SQLite по умолчанию выключена)
@event.listens_for(test_engine, "connect")
def enable_foreign_keys(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA foreign_keys=ON")
```

### 3.2 Изоляция тестов

```python
@pytest.fixture(autouse=True)  # autouse=True — запускается перед КАЖДЫМ тестом
def reset_db():
    Base.metadata.drop_all(bind=test_engine)   # удаляем все таблицы
    Base.metadata.create_all(bind=test_engine) # создаём заново
    yield
```

`autouse=True` означает, что эта фикстура применяется к каждому тесту автоматически, без явного указания. Это обеспечивает **изоляцию** — каждый тест начинается с чистой базой данных.

### 3.3 Подмена зависимости get_db

```python
@pytest.fixture
def client(reset_db):
    def override_get_db():           # Функция-замена для get_db
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    # FastAPI позволяет подменять зависимости через dependency_overrides
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:       # TestClient эмулирует HTTP-запросы
        yield c

    app.dependency_overrides.clear() # Восстанавливаем зависимости после теста
```

**Механизм Dependency Injection в FastAPI:** каждый эндпоинт получает сессию БД через `Depends(get_db)`. В тестах мы подменяем `get_db` на функцию, которая возвращает сессию к SQLite — так все запросы идут в тестовую базу.

### 3.4 Фикстуры пользователей

```python
def _create_user(db, username: str, role: str) -> User:
    user = User(
        username=username,
        email=f"{username}@test.com",
        password_hash=hash_password("password123"),
        role=role,
    )
    db.add(user)
    db.flush()  # получаем user.id без финального commit

    # Создаём Employee-запись (нужна для назначения на заказы)
    employee = Employee(
        user_id=user.id,
        full_name=f"Test {username.title()}",
        ...
    )
    db.add(employee)
    db.commit()  # сохраняем в БД
    db.refresh(user)
    return user

# Готовые фикстуры для каждой роли
@pytest.fixture
def admin_user(db):
    return _create_user(db, "test_admin", "admin")

@pytest.fixture
def admin_headers(admin_user):
    # Генерируем JWT-токен напрямую (без HTTP-запроса к /login)
    token = create_access_token({"sub": str(admin_user.id), "role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}
```

**Почему генерируем токен напрямую, а не через /login?** Это быстрее и изолирует тест от логики входа. Если `/login` сломается, остальные тесты не должны падать из-за этого.

---

## 4. Unit-тесты

Unit-тест проверяет **одну конкретную функцию или класс** в полной изоляции — без сети, без базы данных, без внешних зависимостей.

### 4.1 Тесты Pydantic-схем (test_schemas.py)

Pydantic-схемы отвечают за валидацию входящих данных. Если данные некорректны — поднимается `ValidationError`.

```python
class TestPartCreate:
    def test_negative_price_raises(self):
        with pytest.raises(ValidationError):
            # Pydantic должен отклонить отрицательную цену
            PartCreate(name="Фильтр", article="F-001", price=-10.0)

    def test_price_rounded_to_two_decimals(self):
        part = PartCreate(name="Масло", article="M-001", price=99.9999)
        assert part.price == 100.0  # округляется до 2 знаков
```

**Как работает валидатор в схеме:**
```python
class PartCreate(BaseModel):
    price: float

    @field_validator("price")
    @classmethod
    def round_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Цена не может быть отрицательной")
        return round(v, 2)
```

### 4.2 Тесты генератора ML-данных (test_data_generator.py)

Генератор создаёт 2000 синтетических примеров для обучения нейросети. Тестируем детерминированную функцию классификации:

```python
class TestComputeUrgency:
    def test_critical_when_stock_is_zero(self):
        # Если на складе 0 штук — критично (класс 2)
        assert _compute_urgency(current=0, min_s=10, days=30) == 2

    def test_critical_when_days_less_than_7(self):
        # До нуля осталось меньше 7 дней — критично
        assert _compute_urgency(current=5, min_s=3, days=6) == 2

    def test_warning_when_days_less_than_14(self):
        # 7-14 дней — предупреждение (класс 1)
        assert _compute_urgency(current=20, min_s=5, days=10) == 1

    def test_ok_when_stock_normal(self):
        # Всё хорошо — класс 0
        assert _compute_urgency(current=50, min_s=10, days=30) == 0
```

```python
class TestGenerate:
    def test_returns_correct_shape(self, dataset):
        X, y = dataset
        assert X.shape == (2000, 6)  # 2000 примеров, 6 признаков
        assert y.shape == (2000,)    # 2000 меток

    def test_reproducible_with_fixed_seed(self):
        X1, y1 = generate()
        X2, y2 = generate()
        np.testing.assert_array_equal(X1, X2)  # одинаковые данные каждый раз
```

**Почему важна воспроизводимость?** `random_state=42` в генераторе означает, что при каждом запуске данные будут одинаковыми. Это критично для воспроизводимости результатов обучения.

### 4.3 Тесты предиктора (test_predictor.py)

```python
class TestRecommendedOrder:
    def test_ok_urgency_returns_zero(self):
        # Если запчасть в норме — заказывать не нужно
        part = make_part(current_stock=100.0, daily_rate=1.0)
        assert _recommended_order(part, urgency=0) == 0

    def test_warning_with_daily_rate(self):
        # needed = daily_rate × 45 дней = 2 × 45 = 90
        # order = needed - current = 90 - 10 = 80
        part = make_part(current_stock=10.0, daily_rate=2.0)
        result = _recommended_order(part, urgency=1)
        expected = max(0, int(2.0 * 45) - 10)  # = 80
        assert result == expected

    def test_warning_no_consumption_uses_min_stock(self):
        # Если расход = 0, заказываем 2 × min_stock - current
        part = make_part(current_stock=3.0, min_stock=10.0, daily_rate=0.0)
        result = _recommended_order(part, urgency=1)
        expected = max(0, 10 * 2 - 3)  # = 17
        assert result == expected
```

---

## 5. Интеграционные тесты

Интеграционный тест проверяет **несколько компонентов вместе**: HTTP-запрос → маршрутизатор FastAPI → бизнес-логика → база данных → ответ.

Используется `TestClient` из Starlette, который эмулирует HTTP без реального сетевого соединения.

### 5.1 Тесты авторизации (test_auth.py)

```python
class TestLogin:
    def test_login_success(self, client, admin_user):
        response = client.post("/api/auth/login", json={
            "username": "test_admin",
            "password": "password123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data      # JWT-токен получен
        assert "refresh_token" in data     # Токен обновления получен
        assert data["token_type"] == "bearer"
        assert data["role"] == "admin"

    def test_login_wrong_password(self, client, admin_user):
        response = client.post("/api/auth/login", json={
            "username": "test_admin",
            "password": "wrong_password",
        })
        assert response.status_code == 401  # Unauthorized

    def test_get_me_no_token(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 403  # Forbidden — нет токена
```

**Как работает аутентификация:**
1. Клиент отправляет логин/пароль на `/api/auth/login`
2. Сервер проверяет пароль через bcrypt (`verify_password`)
3. Если верно — создаёт JWT-токен с `user_id` и `role` внутри
4. Клиент отправляет токен в заголовке: `Authorization: Bearer <token>`
5. Каждый защищённый эндпоинт проверяет токен через `get_current_user`

### 5.2 Тесты CRUD запчастей (test_parts.py)

```python
class TestCreatePart:
    def test_manager_can_create_part(self, client, manager_headers):
        response = client.post("/api/parts/", json={
            "name": "Фильтр масляный",
            "article": "FM-2026",
            "price": 450.00,
        }, headers=manager_headers)       # передаём JWT в заголовке
        assert response.status_code == 200
        assert response.json()["id"] is not None  # сервер присвоил ID

    def test_mechanic_cannot_create_part(self, client, mechanic_headers):
        response = client.post("/api/parts/", json={...}, headers=mechanic_headers)
        assert response.status_code == 403  # механик не имеет прав

    def test_negative_price_rejected(self, client, manager_headers):
        response = client.post("/api/parts/", json={
            "name": "Фильтр", "article": "F-001", "price": -100.0
        }, headers=manager_headers)
        assert response.status_code == 422  # Unprocessable Entity — валидация провалилась
```

**HTTP-коды в тестах:**
| Код | Значение | Когда встречается |
|-----|----------|-------------------|
| 200 | OK | Успешный запрос |
| 401 | Unauthorized | Неверный токен или пароль |
| 403 | Forbidden | Нет токена или недостаточно прав |
| 404 | Not Found | Объект не найден в БД |
| 422 | Unprocessable Entity | Ошибка валидации данных |
| 500 | Internal Server Error | Необработанная ошибка на сервере |

### 5.3 Тесты заказ-нарядов (test_work_orders.py)

```python
def create_client_and_vehicle(client_http, manager_headers) -> int:
    """Вспомогательная функция — создаёт клиента и авто через API."""
    cl = client_http.post("/api/clients/", json={
        "full_name": "Иван Тестовый",
        "phone": "+79991234567",
    }, headers=manager_headers)
    client_id = cl.json()["id"]

    vh = client_http.post("/api/vehicles/", json={
        "client_id": client_id,
        "brand": "Toyota", "model": "Camry",
        "year": 2020, "plate_number": "A100AA77",
    }, headers=manager_headers)
    return vh.json()["id"]
```

```python
class TestListOrders:
    def test_mechanic_sees_only_own_orders(self, client, manager_headers,
                                           mechanic_user, mechanic_headers):
        vehicle_id = create_client_and_vehicle(client, manager_headers)
        mechanic_employee_id = mechanic_user.employee.id  # ID в таблице employees!

        # Заказ назначен механику
        client.post("/api/work-orders/", json={
            "vehicle_id": vehicle_id,
            "mechanic_id": mechanic_employee_id,
        }, headers=manager_headers)

        # Заказ без механика
        client.post("/api/work-orders/", json={
            "vehicle_id": vehicle_id,
        }, headers=manager_headers)

        # Механик видит только свой заказ
        response = client.get("/api/work-orders/", headers=mechanic_headers)
        orders = response.json()
        assert len(orders) == 1
        assert orders[0]["mechanic_id"] == mechanic_employee_id
```

**Важный момент:** `mechanic_id` в таблице `work_orders` ссылается на `employees.id`, а не на `users.id`. Поэтому в фикстуре `_create_user` мы создаём и `User`, и `Employee` — иначе FK-ограничение сработает и тест упадёт.

---

## 6. Вопросы и ответы для преподавателя

### Общие вопросы о тестировании

**В: В чём разница между unit-тестами и интеграционными тестами?**

О: Unit-тест проверяет одну функцию в полной изоляции — без базы данных, без HTTP. Например, `test_negative_price_raises` проверяет только валидатор Pydantic. Интеграционный тест проверяет несколько слоёв вместе: HTTP-запрос проходит через FastAPI-роутер, бизнес-логику, запись в базу данных и возвращает ответ. Например, `test_manager_can_create_part` делает настоящий POST-запрос и проверяет весь путь от запроса до БД.

---

**В: Почему вы используете SQLite для тестов вместо PostgreSQL?**

О: SQLite — это встроенная база данных Python, она не требует установки сервера. Тесты можно запускать на любой машине без дополнительной настройки. SQLite полностью поддерживает SQL-синтаксис используемых запросов, включая внешние ключи (с включённым `PRAGMA foreign_keys=ON`). Это делает тесты переносимыми и быстрыми.

---

**В: Что такое фикстура (fixture) в pytest?**

О: Фикстура — это функция, помеченная `@pytest.fixture`, которая подготавливает данные или окружение для теста и убирает их после. Pytest автоматически передаёт фикстуры в тест через параметры функции. Например, фикстура `db` открывает сессию к тестовой БД и закрывает её после теста. Фикстура `admin_headers` создаёт пользователя-администратора и возвращает JWT-заголовок для HTTP-запросов.

---

**В: Зачем нужен `autouse=True` в фикстуре `reset_db`?**

О: `autouse=True` означает, что фикстура применяется к каждому тесту автоматически, без явного указания в параметрах теста. `reset_db` удаляет и пересоздаёт все таблицы перед каждым тестом — это гарантирует изоляцию: данные, созданные в одном тесте, не влияют на следующий.

---

**В: Как работает `dependency_overrides` в FastAPI?**

О: FastAPI использует паттерн Dependency Injection — каждый эндпоинт объявляет зависимости через `Depends(...)`. `app.dependency_overrides` — это словарь, который позволяет подменить любую зависимость. В тестах мы подменяем `get_db` на функцию, возвращающую SQLite-сессию вместо PostgreSQL-сессии. Таким образом, все обращения к базе данных в тестах идут в тестовую SQLite-базу.

---

**В: Что такое `pytest.raises` и зачем оно нужно?**

О: `pytest.raises(ExceptionType)` — контекстный менеджер, который проверяет, что код внутри блока поднимает исключение указанного типа. Если исключение не поднялось — тест падает. Используется когда нужно проверить, что функция корректно обрабатывает некорректные данные:
```python
with pytest.raises(ValidationError):
    PartCreate(name="Фильтр", article="F-001", price=-10.0)
```

---

### Вопросы о конкретных тестах

**В: Зачем в `test_auth.py` есть отдельный тест для refresh-токена?**

О: В системе два типа токенов: `access_token` живёт 30 минут и используется для каждого запроса; `refresh_token` живёт 7 дней и нужен только для получения нового access-токена. Тест `test_refresh_success` проверяет, что после истечения access-токена пользователь может получить новый без повторного ввода пароля.

---

**В: Почему в тесте `test_mechanic_sees_only_own_orders` используется `mechanic_user.employee.id`, а не `mechanic_user.id`?**

О: Таблица `work_orders` имеет поле `mechanic_id`, которое является внешним ключом на таблицу `employees`, а не `users`. В системе есть разделение: `User` — учётная запись (логин, пароль, роль), `Employee` — профиль сотрудника (ФИО, телефон, должность). Один пользователь соответствует одному сотруднику через связь один-к-одному. При назначении механика на заказ нужен именно `employee.id`.

---

**В: Что проверяет `test_days_until_stockout_capped`?**

О: Этот тест проверяет, что поле `days_until_stockout` в генераторе данных ограничено константой `MAX_DAYS_CAP = 180`. Без ограничения для запчасти с нулевым расходом значение было бы бесконечным, что поломало бы нейросеть (она не умеет работать с `inf`). Тест перебирает все 2000 сгенерированных примеров и проверяет, что ни один не превышает 180.

---

**В: Почему в тесте `test_reproducible_with_fixed_seed` вызывают `generate()` дважды?**

О: Генератор использует `numpy.random` с фиксированным `RANDOM_SEED = 42`. Тест проверяет, что при одинаковом seed генерируются одинаковые данные — это свойство воспроизводимости. Важно для ML: если каждый запуск даёт разные данные, нельзя сравнивать результаты обучения.

---

### Вопросы об архитектуре и инструментах

**В: Почему тесты не используют `mock`-объекты?**

О: Mock (заглушка) — это объект, имитирующий поведение реального. Мы намеренно не используем mock для базы данных, потому что подменяем всю БД целиком на SQLite. Это надёжнее — мы проверяем реальные SQL-запросы, реальные транзакции, реальные ограничения внешних ключей. Mock-база скрыла бы ошибки, которые проявились бы только в продакшне.

---

**В: Зачем в `pytest.ini` есть `filterwarnings`?**

О: FastAPI и jose (JWT-библиотека) используют функции, объявленные устаревшими в Python 3.14. Это предупреждения из сторонних библиотек, которые мы не можем исправить сами. `filterwarnings = ignore::DeprecationWarning:fastapi` говорит pytest игнорировать эти предупреждения. Предупреждения из нашего кода исправлены напрямую.

---

**В: Что произойдёт если запустить тесты пока работает Docker с PostgreSQL?**

О: Ничего не изменится. Тестовый процесс использует SQLite (через переменную окружения `DATABASE_URL=sqlite:///...`, установленную в начале `conftest.py`), которая полностью изолирована от работающего Docker. Тесты не трогают боевую базу данных.

---

**В: Как тесты проверяют права доступа (роли)?**

О: Каждая роль проходит через middleware `require_roles(*roles)` в `dependencies.py`. Тесты создают пользователей с разными ролями и отправляют их JWT-токены. Затем проверяют коды ответа: если механик пытается создать запчасть — ожидаем 403 (Forbidden). Это подтверждает, что ролевая система работает корректно на уровне HTTP, а не только на уровне бизнес-логики.

---

**В: Можно ли добавить тест, который проверяет полный цикл заказа — от создания до завершения со списанием запчастей?**

О: Да, это называется end-to-end тест. Он бы выглядел так:
1. Создать запчасть (quantity=10)
2. Создать клиента и автомобиль
3. Создать заказ
4. Добавить запчасть к заказу (quantity=2)
5. Вызвать `/complete`
6. Проверить что quantity запчасти стало 8 (10-2)

Такой тест у нас частично реализован в `test_add_part_to_order`, но без проверки завершения — это можно расширить.
