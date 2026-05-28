# Команды для запуска тестов

---

## Backend — pytest

Все команды выполняются из папки `backend/`

```bash
cd backend
```

### Запустить все тесты
```bash
pytest
```

### Только юнит-тесты
```bash
pytest tests/unit/
```

### Только интеграционные тесты
```bash
pytest tests/integration/
```

### Тесты бизнес-логики (полный цикл)
```bash
pytest tests/integration/test_business_logic.py
```

### Конкретный файл
```bash
pytest tests/unit/test_schemas.py
pytest tests/unit/test_predictor.py
pytest tests/unit/test_data_generator.py
pytest tests/integration/test_auth.py
pytest tests/integration/test_parts.py
pytest tests/integration/test_work_orders.py
```

### С подробным выводом
```bash
pytest -v
```

### С подробным выводом + показать print()
```bash
pytest -v -s
```

### Показать только упавшие тесты
```bash
pytest --tb=short -q
```

---

## Frontend — Playwright (E2E)

Все команды выполняются из папки `frontend/`

> Требуется запущенный Docker (`http://localhost`)

```bash
cd frontend
```

### Запустить все E2E тесты (без браузера, быстро)
```bash
npm run e2e
```

### С видимым браузером
```bash
npm run e2e:headed
```

### С интерактивным UI для отладки
```bash
npm run e2e:ui
```

### Конкретный файл
```bash
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/navigation.spec.ts
npx playwright test e2e/dashboard.spec.ts
npx playwright test e2e/orders.spec.ts
npx playwright test e2e/parts.spec.ts
npx playwright test e2e/vehicles.spec.ts
npx playwright test e2e/users.spec.ts
npx playwright test e2e/profile.spec.ts
```

### Показать HTML-отчёт после запуска
```bash
npx playwright show-report
```
