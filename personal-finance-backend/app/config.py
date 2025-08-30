import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DB_FILE = BASE_DIR / "pfa.sqlite3"
DATABASE_URL = f"sqlite:///{DB_FILE}"

# OCR/Donut
DONUT_MODEL_ID = os.getenv("DONUT_MODEL_ID", "naver-clova-ix/donut-base-finetuned-cord-v2")
DONUT_DEVICE = os.getenv("DONUT_DEVICE", "cpu")  # "cpu" (recommended for now)
PDF_RASTER_DPI = int(os.getenv("PDF_RASTER_DPI", "300"))
OCR_MAX_PAGES = int(os.getenv("OCR_MAX_PAGES", "3"))  # receipts rarely need >1
