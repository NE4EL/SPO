# АвтоСервис — Система управления СТО

Веб-приложение для автоматизации работы автосервиса: учёт заказов, склад запчастей, база автомобилей и клиентов, AI-анализ склада.

## Стек

**Frontend:** React 18 · TypeScript · React Router v7 · Tailwind CSS v4 · Vite  
**Backend:** FastAPI · SQLAlchemy · PostgreSQL  
**AI:** scikit-learn MLPClassifier (6 признаков → 3 класса)  
**Инфраструктура:** Docker Compose · Nginx

---

## Быстрый старт (Docker)

```bash
cp .env.example .env
# Заполни .env: DB_PASSWORD, SECRET_KEY, ADMIN_PASSWORD
docker compose up --build
```

Открыть в браузере: **http://localhost**  
Swagger UI: **http://localhost/api/docs**

---

## Роли

| Роль | Описание |
|---|---|
| `admin` | Полный доступ |
| `manager` | Всё кроме управления пользователями |
| `mechanic` | Чтение запчастей и работа со своими заказами |

---

## API Endpoints

Все эндпоинты с префиксом `/api`. Требуют JWT-токен в заголовке `Authorization: Bearer <token>`, кроме `/api/auth/login`.

### Авторизация `/api/auth`

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| `POST` | `/api/auth/login` | Публичный | Получить JWT-токен |
| `POST` | `/api/auth/refresh` | Все | Обновить access-токен |
| `GET` | `/api/auth/me` | Все | Текущий пользователь |

**Тело POST /api/auth/login:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

---

### Пользователи `/api/users`

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| `GET` | `/api/users/` | admin | Список всех пользователей |
| `GET` | `/api/users/{id}` | admin | Пользователь по ID |
| `POST` | `/api/users/` | admin | Создать пользователя |
| `PUT` | `/api/users/{id}` | admin | Редактировать пользователя |
| `DELETE` | `/api/users/{id}` | admin | Удалить пользователя |

**Тело POST/PUT:**
```json
{
  "username": "mechanic1",
  "email": "mechanic@sto.ru",
  "password": "secure_password",
  "role": "mechanic"
}
```

---

### Клиенты `/api/clients`

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| `GET` | `/api/clients/` | manager, admin | Список клиентов |
| `GET` | `/api/clients/{id}` | manager, admin | Клиент по ID |
| `POST` | `/api/clients/` | manager, admin | Создать клиента |
| `PUT` | `/api/clients/{id}` | manager, admin | Редактировать клиента |
| `DELETE` | `/api/clients/{id}` | manager, admin | Удалить клиента |

---

### Автомобили `/api/vehicles`

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| `GET` | `/api/vehicles/` | manager, admin | Список автомобилей |
| `GET` | `/api/vehicles/{id}` | manager, admin | Автомобиль по ID |
| `POST` | `/api/vehicles/` | manager, admin | Добавить автомобиль |
| `PUT` | `/api/vehicles/{id}` | manager, admin | Редактировать автомобиль |
| `DELETE` | `/api/vehicles/{id}` | manager, admin | Удалить автомобиль |

---

### Заказ-наряды `/api/work-orders`

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| `GET` | `/api/work-orders/` | Все | Список заказов |
| `GET` | `/api/work-orders/{id}` | Все | Заказ по ID |
| `POST` | `/api/work-orders/` | manager, admin | Создать заказ |
| `PUT` | `/api/work-orders/{id}` | manager, admin | Редактировать заказ |
| `DELETE` | `/api/work-orders/{id}` | manager, admin | Удалить заказ |
| `POST` | `/api/work-orders/{id}/parts` | Все | Добавить запчасть к заказу |
| `POST` | `/api/work-orders/{id}/complete` | Все | Завершить заказ |

---

### Запчасти `/api/parts`

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| `GET` | `/api/parts/` | Все | Список запчастей |
| `GET` | `/api/parts/{id}` | Все | Запчасть по ID |
| `POST` | `/api/parts/` | manager, admin | Добавить запчасть |
| `PUT` | `/api/parts/{id}` | manager, admin | Редактировать запчасть |
| `DELETE` | `/api/parts/{id}` | manager, admin | Удалить запчасть |

**Тело POST /api/parts/:**
```json
{
  "name": "Масляный фильтр",
  "article": "OF-4521",
  "quantity_in_stock": 20,
  "min_quantity": 5,
  "price": 450.00,
  "unit": "шт"
}
```

---

### Складские операции `/api/stock`

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| `GET` | `/api/stock/operations` | manager, admin | История операций |
| `POST` | `/api/stock/operations` | manager, admin | Создать операцию (IN/OUT/ADJUSTMENT) |
| `GET` | `/api/stock/alerts` | manager, admin | Запчасти ниже минимума |

**Тело POST /api/stock/operations:**
```json
{
  "part_id": 1,
  "operation_type": "IN",
  "quantity": 10,
  "notes": "Поставка от поставщика"
}
```
> `operation_type`: `IN` — приход, `OUT` — расход, `ADJUSTMENT` — корректировка

---

### AI-ассистент `/api/ai`

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| `POST` | `/api/ai/train` | admin | Обучить нейросеть |
| `GET` | `/api/ai/stock/analysis` | manager, admin | AI-анализ склада |
| `GET` | `/api/ai/stock/reorder` | manager, admin | Список позиций для закупки |
| `POST` | `/api/ai/query` | Все | Вопрос AI-ассистенту (нужен ANTHROPIC_API_KEY) |

**Тело POST /api/ai/query:**
```json
{
  "question": "Какое масло подходит для Toyota Camry 2020?",
  "context": "Пробег 85000 км"
}
```

---

### Журнал аудита `/api/logs`

| Метод | URL | Доступ | Описание |
|---|---|---|---|
| `GET` | `/api/logs/` | manager, admin | Все события |
| `GET` | `/api/logs/user/{id}` | manager, admin | События конкретного пользователя |

---

## Управление Docker

```bash
docker compose up -d        # запустить в фоне
docker compose down         # остановить (данные сохраняются)
docker compose down -v      # остановить + удалить данные БД
docker compose logs -f      # логи всех контейнеров
docker compose ps           # статус контейнеров
```

## Резервное копирование БД

```bash
bash docker/backup.sh                              # создать дамп
bash docker/restore.sh backups/sto_db_*.sql        # восстановить
```
