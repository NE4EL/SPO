from sqlalchemy.orm import Session
from app.models.user import User, Employee
from app.schemas.user import UserCreate, UserUpdate
from app.auth.password import hash_password


def get_all_users(db: Session):
    return db.query(User).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.flush()  # Получаем user.id до commit

    employee = Employee(
        user_id=user.id,
        full_name=data.full_name,
        phone=data.phone,
        position=data.position,
    )
    db.add(employee)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, data: UserUpdate):
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    if data.email is not None:
        user.email = data.email
    if data.password is not None:
        user.password_hash = hash_password(data.password)
    if data.role is not None:
        user.role = data.role

    # Обновляем данные сотрудника
    if user.employee:
        if data.full_name is not None:
            user.employee.full_name = data.full_name
        if data.phone is not None:
            user.employee.phone = data.phone
        if data.position is not None:
            user.employee.position = data.position

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    db.delete(user)
    db.commit()
    return True


def create_initial_admin(db: Session, username: str, email: str, password: str) -> User:
    existing = get_user_by_username(db, username)
    if existing:
        return existing

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role="admin",
    )
    db.add(user)
    db.flush()

    employee = Employee(
        user_id=user.id,
        full_name="Администратор",
        position="admin",
    )
    db.add(employee)
    db.commit()
    db.refresh(user)
    return user
