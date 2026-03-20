-- 1. ТАБЛИЦА: users (Пользователи)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'mechanic')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- 2. ТАБЛИЦА: employees (Сотрудники)
DROP TABLE IF EXISTS employees CASCADE;
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(50),
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- 3. ТАБЛИЦА: clients (Клиенты)
DROP TABLE IF EXISTS clients CASCADE;
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_phone ON clients(phone);

-- 4. ТАБЛИЦА: vehicles (Автомобили)
DROP TABLE IF EXISTS vehicles CASCADE;
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    plate_number VARCHAR(15) UNIQUE NOT NULL,
    mileage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicles_client FOREIGN KEY (client_id)
        REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX idx_vehicles_client_id ON vehicles(client_id);

-- 5. ТАБЛИЦА: parts (Запчасти) ⭐ ГЛАВНАЯ
DROP TABLE IF EXISTS parts CASCADE;
CREATE TABLE parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    article VARCHAR(50) UNIQUE NOT NULL,
    quantity_in_stock INTEGER DEFAULT 0 CHECK (quantity_in_stock >= 0),
    min_quantity INTEGER DEFAULT 5 CHECK (min_quantity >= 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    unit VARCHAR(10) DEFAULT 'шт'
);

CREATE INDEX idx_parts_article ON parts(article);
CREATE INDEX idx_parts_quantity ON parts(quantity_in_stock);

-- 6. ТАБЛИЦА: work_orders (Заказ-наряды)
DROP TABLE IF EXISTS work_orders CASCADE;
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_id INTEGER NOT NULL,
    mechanic_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_cost NUMERIC(10, 2) DEFAULT 0 CHECK (total_cost >= 0),
    notes TEXT,
    CONSTRAINT fk_work_orders_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_orders_mechanic FOREIGN KEY (mechanic_id)
        REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_vehicle_id ON work_orders(vehicle_id);
CREATE INDEX idx_work_orders_mechanic_id ON work_orders(mechanic_id);

-- 7. ТАБЛИЦА: order_parts (Запчасти в заказе)
DROP TABLE IF EXISTS order_parts CASCADE;
CREATE TABLE order_parts (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL,
    part_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_moment NUMERIC(10, 2) NOT NULL CHECK (price_at_moment >= 0),
    CONSTRAINT fk_order_parts_work_order FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_parts_part FOREIGN KEY (part_id)
        REFERENCES parts(id) ON DELETE RESTRICT
);

CREATE INDEX idx_order_parts_work_order_id ON order_parts(work_order_id);
CREATE INDEX idx_order_parts_part_id ON order_parts(part_id);

-- 8. ТАБЛИЦА: stock_operations (История операций склада)
DROP TABLE IF EXISTS stock_operations CASCADE;
CREATE TABLE stock_operations (
    id SERIAL PRIMARY KEY,
    part_id INTEGER NOT NULL,
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    performed_by_id INTEGER,
    work_order_id INTEGER,
    operation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT fk_stock_operations_part FOREIGN KEY (part_id)
        REFERENCES parts(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_operations_employee FOREIGN KEY (performed_by_id)
        REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_stock_operations_work_order FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_stock_operations_part_id ON stock_operations(part_id);
CREATE INDEX idx_stock_operations_operation_date ON stock_operations(operation_date);
CREATE INDEX idx_stock_operations_work_order_id ON stock_operations(work_order_id);

-- 9. ТАБЛИЦА: low_stock_alerts (Уведомления)
DROP TABLE IF EXISTS low_stock_alerts CASCADE;
CREATE TABLE low_stock_alerts (
    id SERIAL PRIMARY KEY,
    part_id INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_low_stock_alerts_part FOREIGN KEY (part_id)
        REFERENCES parts(id) ON DELETE CASCADE
);

CREATE INDEX idx_low_stock_alerts_part_id ON low_stock_alerts(part_id);
CREATE INDEX idx_low_stock_alerts_is_read ON low_stock_alerts(is_read);

-- ========================================
-- Вставка тестовых данных
-- ========================================

-- Пользователи
INSERT INTO users (username, email, password_hash, role) VALUES
('manager1', 'manager@sto.ru', 'hashed_password_123', 'manager'),
('mechanic1', 'mechanic@sto.ru', 'hashed_password_456', 'mechanic');

-- Сотрудники
INSERT INTO employees (user_id, full_name, phone, position) VALUES
(1, 'Иванов Иван Иванович', '+7-999-111-2233', 'Менеджер СТО'),
(2, 'Петров Пётр Петрович', '+7-999-444-5566', 'Механик');

-- Клиенты
INSERT INTO clients (full_name, phone, email) VALUES
('Сидоров Сидор Сидорович', '+7-999-777-8899', 'sidorov@mail.ru');

-- Автомобили
INSERT INTO vehicles (client_id, brand, model, year, plate_number, mileage) VALUES
(1, 'Toyota', 'Camry', 2020, 'А123БВ777', 50000);

-- Запчасти
INSERT INTO parts (name, article, quantity_in_stock, min_quantity, price, unit) VALUES
('Масло моторное 5W-30', 'OIL-5W30-001', 25, 10, 1500.00, 'л'),
('Фильтр масляный', 'FILTER-OIL-001', 15, 5, 350.00, 'шт'),
('Свечи зажигания NGK', 'SPARK-NGK-001', 40, 10, 450.00, 'шт'),
('Тормозные колодки передние', 'BRAKE-PAD-F-001', 8, 5, 2500.00, 'комплект'),
('Антифриз G12', 'ANTIFREEZE-G12-001', 12, 8, 800.00, 'л');