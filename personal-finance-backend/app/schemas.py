from typing import Optional, List
from datetime import date
from pydantic import BaseModel, field_validator
from .models import TxnType
from datetime import date as Date

class TransactionBulkItem(BaseModel):
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
    
class TransactionUpdate(BaseModel):
    type: Optional[TxnType] = None
    date: Optional[Date] = None          # <-- IMPORTANT: Optional[Date], not None
    category_id: Optional[int] = None
    description: Optional[str] = None
    amount: Optional[str] = None
    amount_minor: Optional[int] = None

    @field_validator("description")
    @classmethod
    def norm_desc(cls, v):
        if v is None:
            return None
        v2 = v.strip()
        return v2 or None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str

class UserRead(BaseModel):
    id: int
    email: str
    full_name: str | None = None
