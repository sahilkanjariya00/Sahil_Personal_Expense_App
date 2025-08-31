# app/routers/transactions.py
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, SQLModel, Field
from sqlalchemy import func

from ..db import get_session
from ..models import Transaction, TransactionRead, Category, TxnType, User
from ..schemas import TransactionBulkItem, TransactionUpdate
from ..routers.auth import get_current_user


router = APIRouter(prefix="/transactions", tags=["transactions"])


class TransactionCreateIn(SQLModel):
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
    category_id: Optional[int] = None

def _rupees_to_minor(rupees_str: str) -> int:
    try:
        return int((Decimal(rupees_str) * 100).to_integral_value())
    except (InvalidOperation, TypeError):
        raise HTTPException(status_code=400, detail="Invalid 'amount' format. Use e.g. '123.45'.")

def _minor_to_rupees_str(minor: int) -> str:
    return f"{Decimal(minor) / Decimal(100):.2f}"

@router.post("", response_model=TransactionRead, status_code=201)
def create_transaction(payload: TransactionCreateIn, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
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
                (Category.user_id == current_user.id) | (Category.user_id.is_(None)),
            )
        ).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found for this user.")
        category_id = payload.category_id
    else:
        # Income: ignore any provided category (store NULL)
        category_id = None

    tx = Transaction(
        user_id=current_user.id,
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
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    from_: Optional[date] = Query(None, alias="from"),
    to: Optional[date] = None,
    type: Optional[TxnType] = None,
    category_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
):
    where = [Transaction.user_id == current_user.id]

    if from_:
        where.append(Transaction.date >= from_)
    if to:
        where.append(Transaction.date <= to)
    if type:
        where.append(Transaction.type == type)
    if category_id:
        where.append(Transaction.category_id == category_id)

    # total count
    total = session.exec(
        select(func.count()).select_from(Transaction).where(*where)
    ).first() or 0

    # query page
    stmt = (
        select(
            Transaction.id,
            Transaction.date,
            Transaction.type,
            Category.name,
            Transaction.description,
            Transaction.amount_minor,
            Transaction.category_id,
        )
        .where(*where)
        .join(Category, Category.id == Transaction.category_id, isouter=True)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )

    rows = session.exec(stmt).all()

    items = [
        TransactionRowOut(
            id=r[0],
            date=r[1],
            type=r[2],
            category=r[3],
            description=r[4],
            amount=_minor_to_rupees_str(r[5]),
            category_id=r[6],
        )
        for r in rows
    ]

    return {"items": items, "page": page, "limit": limit, "total": total}


@router.post("/bulk", response_model=List[TransactionRead], status_code=201)
def create_transactions_bulk(
    items: List[TransactionBulkItem],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not items:
        raise HTTPException(status_code=400, detail="Provide at least one transaction.")

    # Collect per-row errors first (so user sees all problems at once)
    errors: List[Dict[str, Any]] = []

    # Preload categories referenced
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
        if (it.amount is None and it.amount_minor is None) or (
            it.amount is not None and it.amount_minor is not None
        ):
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
            if not cat or not (cat.user_id is None or cat.user_id == current_user.id):
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
                row_errs.append(str(he.detail))

        if amount_minor is None:
            row_errs.append("Resolved amount is invalid or <= 0.")

        if row_errs:
            errors.append({"index": idx, "errors": row_errs})
            continue

        tx = Transaction(
            user_id=current_user.id,
            type=it.type,
            date=it.date,
            category_id=None if it.type == TxnType.income else it.category_id, 
            description=(it.description or "").strip() or None,
            amount_minor=amount_minor,                     
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
    for tx in prepared:
        session.refresh(tx)

    return prepared

@router.patch("/{tx_id}", response_model=TransactionRead)
def update_transaction(
    tx_id: int,
    payload: TransactionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),   # ← inject user from JWT
):
    """
    Partial update (user-scoped):
    - Must belong to current_user.
    - Cannot edit user_id.
    - If providing amount, must not provide amount_minor (and vice-versa).
    - For expense: category_id required (either keep existing or provide one).
    - For income: category_id must be null.
    """
    tx = session.get(Transaction, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Enforce ownership
    if tx.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to modify this transaction")

    # ---- Validate amount fields (exclusive) ----
    if payload.amount is not None and payload.amount_minor is not None:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'amount' (rupees) or 'amount_minor' (paise), not both.",
        )

    # ---- Apply simple fields first ----
    if payload.date is not None:
        tx.date = payload.date

    if payload.description is not None:
        tx.description = payload.description  # normalized in validator

    # ---- If type changes, enforce category rules later ----
    new_type: TxnType = payload.type or tx.type

    # ---- Resolve amount_minor if supplied ----
    if payload.amount_minor is not None:
        if payload.amount_minor <= 0:
            raise HTTPException(status_code=400, detail="'amount_minor' must be > 0")
        tx.amount_minor = payload.amount_minor

    if payload.amount is not None:
        tx.amount_minor = _rupees_to_minor(payload.amount)

    # ---- Category rules & validation ----
    # Determine what category_id should be after update
    desired_category_id: Optional[int]
    if payload.category_id is not None:
        desired_category_id = payload.category_id  # may be None explicitly
    else:
        desired_category_id = tx.category_id  # unchanged

    if new_type == TxnType.income:
        # income must not have category
        if desired_category_id is not None:
            raise HTTPException(status_code=400, detail="category_id must be null for income transactions.")
        tx.type = TxnType.income
        tx.category_id = None
    else:
        # expense must have a valid category (global or owned by current user)
        if desired_category_id is None:
            raise HTTPException(status_code=400, detail="category_id is required for expense transactions.")
        cat = session.exec(
            select(Category).where(
                Category.id == desired_category_id,
                (Category.user_id == current_user.id) | (Category.user_id.is_(None)),  # ← user/global
            )
        ).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found or not accessible for this user.")
        tx.type = TxnType.expense
        tx.category_id = desired_category_id

    tx.updated_at = datetime.utcnow()
    session.add(tx)
    session.commit()
    session.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),  # enforce auth
):
    tx = session.get(Transaction, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Ownership check
    if tx.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this transaction")

    session.delete(tx)
    session.commit()
    # 204 No Content has no body
    return None