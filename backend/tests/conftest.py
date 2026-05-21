import os

# Устанавливаем тестовые переменные ДО импорта любых модулей приложения.
# python-decouple читает env vars с приоритетом над .env-файлом.
os.environ["DATABASE_URL"] = "sqlite:///./test_sto.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-must-be-32chars!"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"
os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD"] = "admin123"
os.environ["ADMIN_EMAIL"] = "admin@test.com"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.models.user import User, Employee
from app.auth.password import hash_password
from app.auth.jwt import create_access_token
from main import app

TEST_DB_URL = "sqlite:///./test_sto.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


# Включаем поддержку внешних ключей для SQLite
@event.listens_for(test_engine, "connect")
def enable_foreign_keys(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA foreign_keys=ON")


@pytest.fixture(autouse=True)
def reset_db():
    """Сбрасывает и пересоздаёт таблицы перед каждым тестом."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield


@pytest.fixture
def db(reset_db):
    """Сессия БД для прямой работы с данными в тестах."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(reset_db):
    """TestClient с подменённой зависимостью get_db → SQLite."""
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


# ── Вспомогательные фикстуры пользователей ───────────────────────────────────

def _create_user(db, username: str, role: str) -> User:
    user = User(
        username=username,
        email=f"{username}@test.com",
        password_hash=hash_password("password123"),
        role=role,
    )
    db.add(user)
    db.flush()  # получаем user.id не делая commit

    employee = Employee(
        user_id=user.id,
        full_name=f"Test {username.title()}",
        phone="+79990000000",
        position="Тестовый сотрудник",
    )
    db.add(employee)
    db.commit()
    db.refresh(user)
    return user


def _auth_headers(user: User) -> dict:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user(db):
    return _create_user(db, "test_admin", "admin")


@pytest.fixture
def manager_user(db):
    return _create_user(db, "test_manager", "manager")


@pytest.fixture
def mechanic_user(db):
    return _create_user(db, "test_mechanic", "mechanic")


@pytest.fixture
def admin_headers(admin_user):
    return _auth_headers(admin_user)


@pytest.fixture
def manager_headers(manager_user):
    return _auth_headers(manager_user)


@pytest.fixture
def mechanic_headers(mechanic_user):
    return _auth_headers(mechanic_user)
