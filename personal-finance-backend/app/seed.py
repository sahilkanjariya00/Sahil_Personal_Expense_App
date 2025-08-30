from sqlmodel import Session, select
from .models import Category

DEFAULT_CATEGORIES = [
    "Food",
    "Transport",
    "Entertainment",
    "Utilites",
    "Eucation",
    "Household",
    "Electronics",
    "Family",
    "Personal Care",
    "Other"
]

def seed_categories(session: Session) -> None:
    # Global defaults use user_id = None
    existing = set(
        name for (name,) in session.exec(select(Category.name).where(Category.user_id.is_(None))).all()
    )
    new_items = [Category(user_id=None, name=name) for name in DEFAULT_CATEGORIES if name not in existing]
    if new_items:
        session.add_all(new_items)
        session.commit()
