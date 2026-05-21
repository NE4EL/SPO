from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from decouple import config
from app.database import engine, SessionLocal
from app.models import Base
from app.api import clients, vehicles, work_orders, parts, stock_operations
from app.api import auth, users, logs, ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    from app.services.user_service import create_initial_admin
    db = SessionLocal()
    try:
        admin_username = config("ADMIN_USERNAME", default="admin")
        admin_password = config("ADMIN_PASSWORD", default="admin123")
        admin_email = config("ADMIN_EMAIL", default="admin@sto.ru")
        create_initial_admin(db, admin_username, admin_email, admin_password)
        print(f"[INFO] Администратор '{admin_username}' готов к работе.")
    finally:
        db.close()
    yield


app = FastAPI(
    title="СТО API",
    version="2.0.0",
    description="Backend для системы управления автосервисом. Роли: admin / manager / mechanic.",
    lifespan=lifespan,
)

# CORS (разрешаем все источники — для разработки)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Роутеры ----------
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(vehicles.router, prefix="/api")
app.include_router(work_orders.router, prefix="/api")
app.include_router(parts.router, prefix="/api")
app.include_router(stock_operations.router, prefix="/api")



@app.get("/")
def root():
    return {
        "message": "СТО API v2.0 работает",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth/login",
            "users": "/api/users/",
            "clients": "/api/clients/",
            "vehicles": "/api/vehicles/",
            "work_orders": "/api/work-orders/",
            "parts": "/api/parts/",
            "stock": "/api/stock/operations",
            "logs": "/api/logs/",
            "ai": "/api/ai/query",
        },
    }
