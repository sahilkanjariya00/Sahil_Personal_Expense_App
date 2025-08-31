from datetime import date as Date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from sqlalchemy import func

from ..db import get_session
from ..models import Transaction, Category, TxnType, User
from ..routers.auth import get_current_user


router = APIRouter(prefix="/summary", tags=["summary"])

# -------- Helpers --------

def _minor_to_rupees(n: int) -> float:
    # return as numeric rupees (two decimals)
    return round(n / 100.0, 2)


# -------- 1) Category-wise (date range) --------
# GET /summary/category?user_id=1&from=2025-08-01&to=2025-08-31
@router.get("/category")
def summary_by_category(
    session: Session = Depends(get_session),
    from_: Optional[Date] = Query(None, alias="from"),  # YYYY-MM-DD
    to: Optional[Date] = Query(None),                   # YYYY-MM-DD
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Returns:
    {
      "labels": ["Food","Transport","Uncategorized", ...],
      "values": [1234.5, 890.0, 0.0, ...],  // rupees
      "total": 2124.5                        // rupees
    }
    """
    # user-scoped + expense only
    where = [Transaction.user_id == current_user.id, Transaction.type == TxnType.expense]
    if from_:
        where.append(Transaction.date >= from_)
    if to:
        where.append(Transaction.date <= to)

    category_name = func.coalesce(Category.name, "Uncategorized")

    stmt = (
        select(
            category_name.label("cat"),
            func.sum(Transaction.amount_minor).label("sum_minor"),
        )
        .where(*where)
        .join(Category, Category.id == Transaction.category_id, isouter=True)
        .group_by(category_name)
        .order_by(func.sum(Transaction.amount_minor).desc())
    )

    rows = session.exec(stmt).all()

    labels: List[str] = []
    values: List[float] = []
    total_minor = 0

    for cat, sum_minor in rows:
        sum_minor_int = int(sum_minor or 0)
        labels.append(cat)
        values.append(_minor_to_rupees(sum_minor_int))
        total_minor += sum_minor_int

    return {
        "labels": labels,
        "values": values,
        "total": _minor_to_rupees(total_minor),
    }


# -------- 2) Monthly (year-wise) --------
# GET /summary/monthly?user_id=1&year=2025
@router.get("/monthly")
def summary_monthly(
    session: Session = Depends(get_session),
    year: int = Query(..., description="Year, e.g., 2025"),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Returns:
    {
      "year": 2025,
      "labels": ["Jan","Feb",...,"Dec"],
      "values": [100.0, 0.0, 250.5, ...]  // rupees per month, expenses only
    }
    """
    month_expr = func.strftime("%m", Transaction.date)

    where = [
        Transaction.user_id == current_user.id,
        Transaction.type == TxnType.expense,
        func.strftime("%Y", Transaction.date) == str(year),
    ]

    stmt = (
        select(
            month_expr.label("m"),
            func.sum(Transaction.amount_minor).label("sum_minor"),
        )
        .where(*where)
        .group_by(month_expr)
    )

    rows = session.exec(stmt).all()

    # Initialize 12 months = 0
    totals_minor = [0] * 12
    for m_str, sum_minor in rows:
        idx = int(m_str) - 1  # '01' -> 0
        totals_minor[idx] = int(sum_minor or 0)

    labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    values = [_minor_to_rupees(n) for n in totals_minor]

    return {
        "year": year,
        "labels": labels,
        "values": values,
    }
