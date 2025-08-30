from datetime import datetime, date
from typing import Optional, Literal
from enum import Enum

from sqlmodel import SQLModel, Field, Relationship

# ---------- Users ----------

class UserBase(SQLModel):
    email: str
    name: Optional[str] = None

class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # relationships
    transactions: list["Transaction"] = Relationship(back_populates="user")
    categories: list["Category"] = Relationship(back_populates="user")

class UserRead(UserBase):
    id: int
    created_at: datetime

# ---------- Categories ----------

class CategoryBase(SQLModel):
    name: str

class Category(CategoryBase, table=True):
    __tablename__ = "categories"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")  # NULL => global/default
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    user: Optional[User] = Relationship(back_populates="categories")
    transactions: list["Transaction"] = Relationship(back_populates="category")

class CategoryRead(CategoryBase):
    id: int
    user_id: Optional[int]
    created_at: datetime

# ---------- Transactions ----------

class TxnType(str, Enum):
    expense = "expense"
    income = "income"

class TransactionBase(SQLModel):
    type: TxnType
    date: date
    category_id: Optional[int] = Field(default=None, foreign_key="categories.id")
    description: Optional[str] = None
    amount_minor: int  # INR in paise

class Transaction(TransactionBase, table=True):
    __tablename__ = "transactions"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    user: "User" = Relationship(back_populates="transactions")
    category: Optional["Category"] = Relationship(back_populates="transactions")

class TransactionCreate(TransactionBase):
    user_id: int  # for now you can pass a default user id

class TransactionRead(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
