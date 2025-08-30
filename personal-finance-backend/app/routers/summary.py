from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from sqlalchemy import func

from ..db import get_session
from ..models import Transaction, Category, TxnType

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
    user_id: int = Query(...),
    from_: Optional[str] = Query(None, alias="from"),   # "YYYY-MM-DD"
    to: Optional[str] = Query(None),                    # "YYYY-MM-DD"
) -> Dict[str, Any]:
    """
    Returns:
    {
      "labels": ["Food","Transport","Uncategorized", ...],
      "values": [1234.5, 890.0, 0.0, ...],  // rupees
      "total": 2124.5                        // rupees
    }
    """
    where = [Transaction.user_id == user_id, Transaction.type == TxnType.expense]
    if from_:
        where.append(Transaction.date >= from_)
    if to:
        where.append(Transaction.date <= to)

    # COALESCE category name -> 'Uncategorized'
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
        labels.append(cat)
        rupees = _minor_to_rupees(int(sum_minor or 0))
        values.append(rupees)
        total_minor += int(sum_minor or 0)

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
    user_id: int = Query(...),
    year: int = Query(...),
) -> Dict[str, Any]:
    """
    Returns:
    {
      "year": 2025,
      "labels": ["Jan","Feb",...,"Dec"],
      "values": [100.0, 0.0, 250.5, ...]  // rupees per month, expenses only
    }
    """
    # SQLite month extraction: strftime('%m', date) -> '01'..'12'
    month_expr = func.strftime("%m", Transaction.date)

    where = [
        Transaction.user_id == user_id,
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
