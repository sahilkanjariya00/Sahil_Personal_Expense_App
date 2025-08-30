import os
from pathlib import Path
from sqlmodel import SQLModel, Session, create_engine

DB_FILE = Path("pfa.sqlite3")
DATABASE_URL = f"sqlite:///{DB_FILE}"

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

def create_db_and_tables() -> None:
    # Only create tables if database file is missing
    if not DB_FILE.exists():
        SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
