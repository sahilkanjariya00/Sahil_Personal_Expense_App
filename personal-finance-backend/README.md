pytesseract → Python bindings for Tesseract (calls the system binary).

opencv-python-headless → preprocessing (binarize, denoise, deskew).

pdfplumber → parse text layer from digital PDFs (no OCR).

pdf2image → convert scanned PDFs to images (needs Poppler).

pip install "paddleocr>=2.6"  # will pull paddlepaddle; on CPU it’s fine for small loads

tesseract --version
pdftoppm -v

# Tables
## users
id            INTEGER PRIMARY KEY

email         TEXT NOT NULL UNIQUE

password_hash TEXT NOT NULL

name          TEXT

created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

## categories
CREATE TABLE categories (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL ⇒ global/default
  name       TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, name)
);

-- Helpful index
CREATE INDEX idx_categories_user ON categories(user_id);

## transactions
CREATE TABLE transactions (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('expense','income')),
  date          DATE NOT NULL,                         -- 'YYYY-MM-DD'
  category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description   TEXT,
  amount_minor  INTEGER NOT NULL,                      -- e.g., ₹123.45 → 12345
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Keep updated_at fresh
CREATE TRIGGER trg_transactions_updated_at
AFTER UPDATE ON transactions
FOR EACH ROW BEGIN
  UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Helpful indexes for listing/summaries
CREATE INDEX idx_tx_user_date         ON transactions(user_id, date);
CREATE INDEX idx_tx_user_type_date    ON transactions(user_id, type, date);
CREATE INDEX idx_tx_user_cat_date     ON transactions(user_id, category_id, date);

# conda create -n pfa-backend python=3.11 -y
conda create -n pfa-backend python=3.11 -y
# rm -f pfa.sqlite3  
# uvicorn app.main:app --reload

