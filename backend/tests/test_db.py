# test_db.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Замени на свои данные
DATABASE_URL = "postgresql://sto_user1:As100107As@localhost:5432/sto_db"


def test_connection():
    """Тест 1: Проверка подключения"""
    print("=== Тест 1: Проверка подключения ===")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Подключение к БД успешно!")
            return True
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return False


def test_tables_exist():
    """Тест 2: Проверка существования таблиц"""
    print("\n=== Тест 2: Проверка таблиц ===")
    engine = create_engine(DATABASE_URL)

    tables = [
        'users', 'employees', 'clients', 'vehicles',
        'parts', 'work_orders', 'order_parts',
        'stock_operations', 'low_stock_alerts'
    ]

    with engine.connect() as conn:
        for table in tables:
            result = conn.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = '{table}'
                );
            """))
            exists = result.scalar()
            status = "✅" if exists else "❌"
            print(f"{status} Таблица '{table}': {'найдена' if exists else 'НЕ НАЙДЕНА'}")


def test_insert_data():
    """Тест 3: Вставка тестовых данных"""
    print("\n=== Тест 3: Вставка данных ===")
    engine = create_engine(DATABASE_URL)

    with Session(engine) as session:
        try:
            # Вставка пользователя
            session.execute(text("""
                INSERT INTO users (username, email, password_hash, role) 
                VALUES ('test_user', 'test@example.com', 'hashed_pwd', 'manager')
                ON CONFLICT (username) DO NOTHING
                RETURNING id;
            """))

            # Вставка клиента
            session.execute(text("""
                INSERT INTO clients (full_name, phone, email) 
                VALUES ('Тестовый Клиент', '+7-999-123-4567', 'client@test.ru')
                RETURNING id;
            """))

            # Вставка запчасти
            session.execute(text("""
                INSERT INTO parts (name, article, quantity_in_stock, min_quantity, price, unit) 
                VALUES ('Тестовое масло', 'TEST-001', 50, 10, 1500.00, 'л')
                ON CONFLICT (article) DO NOTHING
                RETURNING id;
            """))

            session.commit()
            print("✅ Данные успешно вставлены!")

        except Exception as e:
            session.rollback()
            print(f"❌ Ошибка вставки: {e}")


def test_select_data():
    """Тест 4: Чтение данных"""
    print("\n=== Тест 4: Чтение данных ===")
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Проверка пользователей
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        print(f"📊 Пользователей в БД: {count}")

        # Проверка запчастей
        result = conn.execute(text("SELECT COUNT(*) FROM parts"))
        count = result.scalar()
        print(f"📊 Запчастей в БД: {count}")

        # Проверка клиентов
        result = conn.execute(text("SELECT COUNT(*) FROM clients"))
        count = result.scalar()
        print(f"📊 Клиентов в БД: {count}")

        # Детали запчастей
        result = conn.execute(text("""
            SELECT id, name, article, quantity_in_stock, price 
            FROM parts 
            LIMIT 5
        """))

        print("\n📦 Запчасти на складе:")
        for row in result:
            print(f"  ID: {row[0]}, {row[1]} ({row[2]}), Остаток: {row[3]}, Цена: {row[4]} руб")


def test_foreign_keys():
    """Тест 5: Проверка связей (Foreign Keys)"""
    print("\n=== Тест 5: Проверка связей ===")
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name;
        """))

        print("🔗 Foreign Keys:")
        for row in result:
            print(f"  {row[0]}.{row[1]} → {row[2]}")


if __name__ == "__main__":
    print("Запуск тестов БД...\n")

    if test_connection():
        test_tables_exist()
        test_insert_data()
        test_select_data()
        test_foreign_keys()
        print("\nВсе тесты завершены!")
    else:
        print("\n❌ Тесты прерваны из-за ошибки подключения")