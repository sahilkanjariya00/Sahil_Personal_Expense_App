from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, SQLModel

from ..db import get_session
from ..models import Category, User
from ..routers.auth import get_current_user


router = APIRouter(prefix="/categories", tags=["categories"])


# ---------- Response / Request Models ----------

class CategoryOut(SQLModel):
    id: int
    name: str
    user_id: Optional[int] = None

class CategoryCreateIn(SQLModel):
    user_id: int                      # owner user id (required for new categories)
    name: str


# ---------- GET: list categories ----------

@router.get("", response_model=List[CategoryOut])
def list_categories(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    # user_id: Optional[int] = Query(None, description="If provided, return user's categories; optionally include global"),
    include_global: bool = Query(True, description="Include global (user_id = NULL) categories when user_id is provided"),
    q: Optional[str] = Query(None, description="Optional name search (case-insensitive substring)"),
):
    stmt = select(Category)

    if current_user.id is None:
        # Only global categories
        stmt = stmt.where(Category.user_id.is_(None))
    else:
        # User's categories + optionally global
        if include_global:
            stmt = stmt.where((Category.user_id == current_user.id) | (Category.user_id.is_(None)))
        else:
            stmt = stmt.where(Category.user_id == current_user.id)

    if q:
        # SQLite: LIKE is case-insensitive by default for ASCII
        like = f"%{q}%"
        stmt = stmt.where(Category.name.like(like))

    stmt = stmt.order_by(Category.name.asc(), Category.id.asc())
    rows = session.exec(stmt).all()

    return [CategoryOut(id=c.id, name=c.name, user_id=c.user_id) for c in rows]


# ---------- POST: create a category (user-scoped) ----------

@router.post("", response_model=CategoryOut, status_code=201)
def create_category(payload: CategoryCreateIn, session: Session = Depends(get_session)):
    # Enforce uniqueness per user (matches UNIQUE(user_id, name))
    existing = session.exec(
        select(Category).where(
            (Category.user_id == payload.user_id) & (Category.name == payload.name)
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category with this name already exists for the user.")

    cat = Category(user_id=payload.user_id, name=payload.name)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return CategoryOut(id=cat.id, name=cat.name, user_id=cat.user_id)
