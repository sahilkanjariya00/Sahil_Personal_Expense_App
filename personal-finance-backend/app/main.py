from fastapi import FastAPI
from sqlmodel import Session

from .db import create_db_and_tables, engine
from .seed import seed_categories
from .routers.transactions import router as transactions_router
from .routers.categories import router as categories_router
from .routers.summary import router as summary_router
from .routers.receipt import router as receipt_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Personal Finance Assistant API")

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # or ["*"] during development
    allow_credentials=True,          # if you use cookies/auth headers
    allow_methods=["*"],             # GET, POST, PUT, etc.
    allow_headers=["*"],             # Authorization, Content-Type, etc.
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    with Session(engine) as session:
        seed_categories(session)

app.include_router(transactions_router)

app.include_router(categories_router)

app.include_router(summary_router)

app.include_router(receipt_router)

@app.get("/")
def health():
    return {"status": "ok"}

