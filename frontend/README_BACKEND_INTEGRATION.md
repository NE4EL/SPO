# Подключение бэкенда к фронтенду

## Оглавление

1. [Быстрый старт](#1-быстрый-старт)
2. [Статус интеграции](#2-статус-интеграции)
3. [Что уже готово на фронте](#3-что-уже-готово-на-фронте)
4. [Маппинг полей: фронт ↔ бэкенд](#4-маппинг-полей-фронт--бэкенд)
5. [Авторизация](#5-авторизация)
6. [Что нужно доделать](#6-что-нужно-доделать)
7. [Подключение AppContext к API](#7-подключение-appcontext-к-api)
8. [Запуск вместе](#8-запуск-вместе)

---

## 1. Быстрый старт

### Шаг 1. Создай файл `.env` в корне фронта

```
VITE_API_URL=http://localhost:8000
```

> Порт 8000 — стандартный для FastAPI/Uvicorn. Измени если бэкенд запускается на другом порту.

### Шаг 2. Убедись что CORS на бэкенде открыт

В бэкенде уже настроен `allow_origins: ["*"]` — всё ок.

### Шаг 3. Запусти оба сервера

```bash
# Терминал 1 — бэкенд
uvicorn main:app --reload

# Терминал 2 — фронт
npm run dev
```

---

## 2. Что уже готово на фронте

В папке `src/shared/api/` лежат готовые файлы с запросами к бэкенду:

### `client.ts` — базовый HTTP-клиент
- Берёт базовый URL из `.env` (`VITE_API_URL`)
- Автоматически добавляет JWT-токен в заголовок `Authorization: Bearer ...`
- При ответе `401 Unauthorized` — чистит токен и редиректит на `/login`
- Обрабатывает ошибки: достаёт `detail` из FastAPI-ответа и показывает пользователю

### `auth.api.ts`
```
POST /api/auth/login  — вход
GET  /api/auth/me     — данные текущего пользователя
POST /api/auth/refresh — обновить токен
```

### `parts.api.ts`
```
GET    /api/parts/       — список запчастей
POST   /api/parts/       — создать
PUT    /api/parts/{id}   — обновить
DELETE /api/parts/{id}   — удалить
```

Уже написан маппинг полей бэкенд → фронт (см. раздел 3).

### `orders.api.ts`
```
GET    /api/work-orders/              — список заказов
POST   /api/work-orders/              — создать
PUT    /api/work-orders/{id}          — обновить
POST   /api/work-orders/{id}/complete — завершить заказ
DELETE /api/work-orders/{id}          — удалить
```

Уже написан маппинг статусов: `pending` ↔ `В ожидании` и т.д.

### `vehicles.api.ts`
```
GET    /api/vehicles/      — список авто
GET    /api/clients/       — список клиентов (нужен для owner/ownerPhone)
POST   /api/clients/       — создать клиента
POST   /api/vehicles/      — создать авто
PUT    /api/vehicles/{id}  — обновить
DELETE /api/vehicles/{id}  — удалить
```

---

## 3. Маппинг полей: фронт ↔ бэкенд

Фронт и бэкенд называют одни и те же поля по-разному. Маппинг уже реализован в файлах `src/shared/api/`.

### Запчасти

| Фронт | Бэкенд |
|---|---|
| `sku` | `article` |
| `quantity` | `quantity_in_stock` |
| `minStock` | `min_quantity` |
| `unitPrice` | `price` |
| `category` | ❌ нет поля — сейчас подставляется `unit` |
| `supplier` | ❌ нет поля |
| `location` | ❌ нет поля |
| `reserved` | ❌ нет поля |
| `lastRestocked` | ❌ нет поля |

### Заказы (Work Orders)

| Фронт | Бэкенд |
|---|---|
| `orderNumber` | `order_number` |
| `vehicleId` | `vehicle_id` |
| `createdDate` | `created_at` |
| `completedDate` | `completed_at` |
| `totalAmount` | `total_cost` |
| `services` | `notes` (через запятую) |
| `customer` | ❌ нет поля (нужно получать через vehicle → client) |
| `phone` | ❌ нет поля (нужно получать через vehicle → client) |
| `laborCost` | ❌ нет поля |
| `parts` (список) | через `POST /api/work-orders/{id}/parts` |

#### Статусы

| Фронт | Бэкенд |
|---|---|
| `В ожидании` | `pending` |
| `В работе` | `in_progress` |
| `Завершён` | `completed` |
| `Отменён` | `cancelled` |

### Автомобили

| Фронт | Бэкенд |
|---|---|
| `make` | `brand` |
| `licensePlate` | `plate_number` |
| `owner` | `client.full_name` (из отдельной сущности Client) |
| `ownerPhone` | `client.phone` |
| `vin` | ❌ нет поля |
| `color` | ❌ нет поля |
| `lastService` | ❌ нет поля |
| `nextService` | ❌ нет поля |
| `serviceRecords` | нужно собирать из завершённых work-orders |

---

## 4. Авторизация

Авторизация уже полностью подключена к бэкенду.

### Как работает

1. Пользователь вводит логин/пароль
2. Фронт делает `POST /api/auth/login` → получает `access_token`
3. Токен сохраняется в `localStorage`
4. Фронт делает `GET /api/auth/me` → получает `full_name`
5. Все последующие запросы идут с заголовком `Authorization: Bearer <token>`
6. При ответе `401` — автоматический редирект на `/login`

### Дефолтные учётки (из бэкенда)

| Логин | Пароль | Роль |
|---|---|---|
| `admin` | `admin123` | Администратор |

Дополнительных пользователей можно создать через `POST /api/users/` (только admin).

---

## 5. Что нужно доделать

В файлах `src/shared/api/` расставлены комментарии `// TODO` в местах где модели данных расходятся. Вот полный список:

### Запчасти (`parts.api.ts`)

```typescript
category: p.unit,      // TODO: бэкенд не возвращает category — добавить поле в бэкенде
reserved: 0,           // TODO: бэкенд не возвращает reserved — добавить поле в бэкенде
supplier: '',          // TODO: добавить поле supplier в бэкенде
location: '',          // TODO: добавить поле location в бэкенде
lastRestocked: '',     // TODO: добавить поле lastRestocked в бэкенде
```

**Решение:** добавить эти поля в модель `Part` на бэкенде (или договориться как их не использовать).

### Автомобили (`vehicles.api.ts`)

```typescript
vin: '',              // TODO: добавить поле vin в бэкенде
color: '',            // TODO: добавить поле color в бэкенде
lastService: '',      // TODO: вычислять из последнего completed work-order
nextService: '',      // TODO: добавить поле или вычислять
serviceRecords: [],   // TODO: загружать из completed work-orders по vehicle_id
```

**Решение:** 
- `serviceRecords` — сделать эндпоинт `GET /api/vehicles/{id}/history` который возвращает завершённые заказы по этому авто
- остальные поля — добавить в модель Vehicle на бэкенде

### Заказы (`orders.api.ts`)

```typescript
customer: '',     // TODO: получать через vehicle_id → client_id → client.full_name
phone: '',        // TODO: получать через vehicle_id → client_id → client.phone
laborCost: 0,     // TODO: добавить поле labor_cost в work-orders на бэкенде
parts: [],        // TODO: загружать через GET /api/work-orders/{id}/parts
```

**Решение:**
- `customer` и `phone` — при загрузке заказов подгружать клиента через `vehicle_id`
- `laborCost` — добавить поле `labor_cost` в модель WorkOrder на бэкенде
- `parts` — сделать запрос к `/api/work-orders/{id}/parts` для каждого заказа (или добавить в ответ work-order сразу)

---

## 6. Подключение AppContext к API

После того как маппинг согласован — нужно обновить `src/app/context/AppContext.tsx`.

Сейчас там хранятся mock-данные. Их нужно заменить на вызовы API.

### Пример для запчастей

```typescript
// Добавить импорты в AppContext.tsx
import { partsApi } from '../../shared/api/parts.api';
import { useEffect } from 'react';

// Заменить:
const [parts, setParts] = useState<Part[]>(initialParts); // ← mock

// На:
const [parts, setParts] = useState<Part[]>([]);
useEffect(() => {
  partsApi.getAll().then(setParts).catch(console.error);
}, []);

// Заменить addPart:
const addPart = (data) => {
  const id = String(Date.now());            // ← mock
  setParts(prev => [{ ...data, id }, ...prev]);
}

// На:
const addPart = async (data) => {
  const created = await partsApi.create(data);
  setParts(prev => [created, ...prev]);
};
```

### То же самое для заказов и автомобилей

```typescript
import { ordersApi } from '../../shared/api/orders.api';
import { vehiclesApi } from '../../shared/api/vehicles.api';

// Начальная загрузка всех данных
useEffect(() => {
  Promise.all([
    partsApi.getAll().then(setParts),
    ordersApi.getAll().then(setOrders),
    vehiclesApi.getAll().then(setVehicles),
  ]).catch(console.error);
}, []);
```

### Важно: updateOrderStatus

Функция `updateOrderStatus` содержит всю логику резервирования запчастей. При подключении бэкенда эту логику не нужно дублировать — бэкенд сам всё делает при `complete`. После смены статуса — просто перезагрузить запчасти и автомобили:

```typescript
const updateOrderStatus = async (orderId, newStatus) => {
  const updated = await ordersApi.updateStatus(orderId, newStatus);
  setOrders(prev => prev.map(o => o.id === orderId ? updated : o));

  // Бэкенд обновил остатки и историю ТО — синхронизируем
  const [updatedParts, updatedVehicles] = await Promise.all([
    partsApi.getAll(),
    vehiclesApi.getAll(),
  ]);
  setParts(updatedParts);
  setVehicles(updatedVehicles);
};
```

---

## 7. Запуск вместе

```bash
# Терминал 1: бэкенд (FastAPI)
cd путь/к/бэкенду
uvicorn main:app --reload --port 8000

# Терминал 2: фронт (React)
cd путь/к/фронту
npm run dev
```

Открыть: **http://localhost:5173**

Войти: логин `admin`, пароль `admin123`
