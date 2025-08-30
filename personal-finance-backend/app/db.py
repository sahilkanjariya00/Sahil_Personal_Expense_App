from contextlib import asynccontextmanager
from typing import Generator

from sqlmodel import SQLModel, Session, create_engine

# SQLite file in project root (adjust path if needed)
DATABASE_URL = "sqlite:///./pfa.sqlite3"

# echo=True to see SQL in logs while developing
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
