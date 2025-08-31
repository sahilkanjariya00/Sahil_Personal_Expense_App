# app/routers/transactions.py
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, SQLModel, Field
from sqlalchemy import func

from ..db import get_session
from ..models import Transaction, TransactionRead, Category, TxnType

from ..schemas import TransactionBulkItem

router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionCreateIn(SQLModel):
    user_id: int
    type: TxnType                 # "expense" | "income"
    date: date                    # "YYYY-MM-DD"
    category_id: Optional[int] = None   # required only for expense; ignored for income
    description: Optional[str] = None
    amount: Optional[str] = None        # rupees string, e.g. "250.00"
    amount_minor: Optional[int] = None  # paise, e.g. 25000

class TransactionRowOut(SQLModel):
    id: int
    date: date
    type: TxnType
    category: Optional[str] = None
    description: Optional[str] = None
    amount: str  # rupees string like "250.00"

def _rupees_to_minor(rupees_str: str) -> int:
    try:
        return int((Decimal(rupees_str) * 100).to_integral_value())
    except (InvalidOperation, TypeError):
        raise HTTPException(status_code=400, detail="Invalid 'amount' format. Use e.g. '123.45'.")

def _minor_to_rupees_str(minor: int) -> str:
    return f"{Decimal(minor) / Decimal(100):.2f}"

@router.post("", response_model=TransactionRead, status_code=201)
def create_transaction(payload: TransactionCreateIn, session: Session = Depends(get_session)):
    # --- amount validation ---
    if payload.amount_minor is None and payload.amount is None:
        raise HTTPException(status_code=400, detail="Provide either 'amount' (rupees) or 'amount_minor' (paise).")
    if payload.amount_minor is not None and payload.amount is not None:
        raise HTTPException(status_code=400, detail="Provide only one of 'amount' or 'amount_minor', not both.")

    amount_minor = payload.amount_minor
    if amount_minor is None and payload.amount is not None:
        amount_minor = _rupees_to_minor(payload.amount)

    if amount_minor is None or amount_minor <= 0:
        raise HTTPException(status_code=400, detail="'amount' must be > 0.")

    # --- category handling ---
    if payload.type == "expense":
        # Expense MUST have a valid category accessible to user (or global)
        if payload.category_id is None:
            raise HTTPException(status_code=400, detail="category_id is required for expense.")
        cat = session.exec(
            select(Category).where(
                Category.id == payload.category_id,
                (Category.user_id == payload.user_id) | (Category.user_id.is_(None)),
            )
        ).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found for this user.")
        category_id = payload.category_id
    else:
        # Income: ignore any provided category (store NULL)
        category_id = None

    tx = Transaction(
        user_id=payload.user_id,
        type=payload.type,
        date=payload.date,
        category_id=category_id,
        description=(payload.description or "").strip() or None,
        amount_minor=amount_minor,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    session.add(tx)
    session.commit()
    session.refresh(tx)
    return tx


@router.get("", response_model=dict)
def list_transactions(
    session: Session = Depends(get_session),
    user_id: int = Query(..., description="Current user id"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    from_: Optional[date] = Query(None, alias="from"),
    to: Optional[date] = None,
    type: Optional[TxnType] = None,
    category_id: Optional[int] = None,
):
    """
    Returns:
      {
        "items": [{id, date, type, category, description, amount}],
        "page": 1,
        "limit": 20,
        "total": 123
      }
    """
    # --- base filter ---
    print('in get')
    where = [Transaction.user_id == user_id]

    if from_:
        where.append(Transaction.date >= from_)
    if to:
        where.append(Transaction.date <= to)
    if type:
        where.append(Transaction.type == type)
    if category_id:
        where.append(Transaction.category_id == category_id)

    # --- total count ---
    total = session.exec(
        select(func.count()).select_from(Transaction).where(*where)
    ).one()

    # --- query page, latest first ---
    stmt = (
        select(
            Transaction.id,
            Transaction.date,
            Transaction.type,
            Category.name,
            Transaction.description,
            Transaction.amount_minor,
        )
        .where(*where)
        .join(Category, Category.id == Transaction.category_id, isouter=True)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )

    rows = session.exec(stmt).all()

    items: List[TransactionRowOut] = [
        TransactionRowOut(
            id=r[0],
            date=r[1],
            type=r[2],
            category=r[3],
            description=r[4],
            amount=_minor_to_rupees_str(r[5]),
        )
        for r in rows
    ]

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
    }

@router.post("/bulk", response_model=List[TransactionRead], status_code=201)
def create_transactions_bulk(
    items: List[TransactionBulkItem],
    session: Session = Depends(get_session),
):
    if not items:
        raise HTTPException(status_code=400, detail="Provide at least one transaction.")

    # Collect per-row errors first (so user sees all problems at once)
    errors: List[Dict[str, Any]] = []

    # Preload category IDs referenced, grouped by user/global
    cat_ids = {it.category_id for it in items if it.category_id is not None}
    cats_by_id: Dict[int, Category] = {}
    if cat_ids:
        cats = session.exec(select(Category).where(Category.id.in_(cat_ids))).all()
        cats_by_id = {c.id: c for c in cats}

    prepared: List[Transaction] = []
    now = datetime.utcnow()

    for idx, it in enumerate(items):
        row_errs: List[str] = []

        # amount validation (exactly one provided)
        if (it.amount is None and it.amount_minor is None) or (it.amount is not None and it.amount_minor is not None):
            row_errs.append("Provide either 'amount' (rupees) or 'amount_minor' (paise), but not both.")

        # type/category rules
        if it.type == TxnType.expense:
            if it.category_id is None:
                row_errs.append("category_id is required for expense.")
        else:  # income
            if it.category_id is not None:
                row_errs.append("category_id must be null for income.")

        # category existence / access (global or same user)
        if it.category_id is not None:
            cat = cats_by_id.get(it.category_id)
            if not cat or not (cat.user_id is None or cat.user_id == it.user_id):
                row_errs.append("Category not found or not accessible for this user.")

        # compute amount_minor
        amount_minor: int | None = None
        if it.amount_minor is not None:
            if it.amount_minor <= 0:
                row_errs.append("'amount_minor' must be > 0")
            else:
                amount_minor = it.amount_minor
        elif it.amount is not None:
            try:
                amount_minor = _rupees_to_minor(it.amount)
            except HTTPException as he:
                row_errs.append(he.detail)

        if amount_minor is None:
            row_errs.append("Resolved amount is invalid or <= 0.")

        if row_errs:
            errors.append({"index": idx, "errors": row_errs})
            continue

        tx = Transaction(
            user_id=it.user_id,
            type=it.type,
            date=it.date,
            category_id=it.category_id,
            description=it.description,
            amount_minor=amount_minor,  # type: ignore[arg-type]
            created_at=now,
            updated_at=now,
        )
        prepared.append(tx)

    if errors:
        # If any error, fail the whole batch (atomic behavior)
        raise HTTPException(status_code=400, detail={"message": "Validation failed", "rows": errors})

    # Persist in one transaction
    session.add_all(prepared)
    session.commit()
    # refresh to get IDs
    for tx in prepared:
        session.refresh(tx)

    return prepared