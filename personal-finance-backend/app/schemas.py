from typing import Optional, List
from datetime import date
from pydantic import BaseModel, field_validator
from .models import TxnType

class TransactionBulkItem(BaseModel):
    user_id: int
    type: TxnType
    date: date
    category_id: Optional[int] = None
    description: Optional[str] = None
    amount: Optional[str] = None        # rupees, e.g. "123.45"
    amount_minor: Optional[int] = None  # paise

    @field_validator("description")
    @classmethod
    def norm_desc(cls, v):
        if v is None:
            return None
        v2 = v.strip()
        return v2 or None
