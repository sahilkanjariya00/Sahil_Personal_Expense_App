# Personal Finance Assistant

A full-stack web application to track, manage, and understand financial activities.  
Users can log income and expenses, categorize transactions, view summaries, and extract transactions from receipts.

---

## Setup Instructions

### Backend (FastAPI + SQLite + OCR)
```bash
# go to backend folder
cd personal-finance-backend

# activate env (assuming conda or use venv)
conda activate "EnvName"

# install dependencies
pip install -r requirements.txt

# run dev server
uvicorn app.main:app --reload
```

```bash
# Manual Installation
conda create -n pfa-backend python=3.11 -y

conda activate pfa-backend

# library installation (manual)
pip install fastapi uvicorn[standard] sqlmodel sqlalchemy alembic pydantic[dotenv]

pip install pytesseract opencv-python-headless pdfplumber pdf2image "paddleocr>=2.6" 

pip install "torch==2.*" torchvision --index-url https://download.pytorch.org/whl/cpu 

pip install transformers accelerate pillow  python-multipart sentencepiece timm protobuf

# Ubuntu/Debian
sudo apt-get install -y tesseract-ocr poppler-utils
```

### Frontend (React + Vite + MUI + Storybook)
```bash
# go to frontend folder
cd personal-finance-frontend

# install deps
npm install

# run dev server
npm run dev

# run storybook
npm run storybook
```


