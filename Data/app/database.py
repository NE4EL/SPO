from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from decouple import config

# Читаем URL из .env
DATABASE_URL = config("DATABASE_URL")

# Создаём движок SQLAlchemy
engine = create_engine(DATABASE_URL, echo=True)  # echo=True показывает SQL в консоли

# Создаём фабрику сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()

# Dependency для получения сессии БД в FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()