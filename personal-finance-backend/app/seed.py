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
    "Other",
]

def seed_categories(session: Session) -> None:
    # Global defaults use user_id = None
    result = session.exec(
        select(Category.name).where(Category.user_id.is_(None))
    )
    # In many SQLModel versions, `result` is already a ScalarResult of str
    existing_names = set(result.all())

    new_items = [
        Category(user_id=None, name=name)
        for name in DEFAULT_CATEGORIES
        if name not in existing_names
    ]
    if new_items:
        session.add_all(new_items)
        session.commit()
