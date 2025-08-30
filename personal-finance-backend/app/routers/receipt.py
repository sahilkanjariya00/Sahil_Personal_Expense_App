from __future__ import annotations
import io, re
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from pdf2image import convert_from_bytes
from PIL import Image
import torch

from ..donut_runtime import get_donut

router = APIRouter(prefix="/extract", tags=["receipt"])

# ---------- helpers: minimal I/O ----------

def _kind(file: UploadFile) -> str:
    ct = (file.content_type or "").lower()
    if ct == "application/pdf" or (file.filename and file.filename.lower().endswith(".pdf")):
        return "pdf"
    return "image"

def _pil_from_bytes(raw: bytes) -> Image.Image:
    return Image.open(io.BytesIO(raw)).convert("RGB")

# ---------- Donut (minimal) ----------

def _run_donut_raw_json(img: Image.Image) -> str:
    processor, model, device = get_donut()

    task_prompt = "<s_cord-v2>"                       # REQUIRED for CORD model
    decoder_input_ids = processor.tokenizer(
        task_prompt, add_special_tokens=False, return_tensors="pt"
    ).input_ids.to(device)

    pixel_values = processor(images=img, return_tensors="pt").pixel_values.to(device)

    with torch.no_grad():
        output_ids = model.generate(
            pixel_values=pixel_values,
            decoder_input_ids=decoder_input_ids,
            max_length=512,
            num_beams=1,
            early_stopping=True,
        )

    raw = processor.batch_decode(output_ids, skip_special_tokens=True)[0]
    # Keep only the JSON-like or tag string if surrounded by extra text
    m = re.search(r"\{.*\}", raw, flags=re.S)
    return m.group(0) if m else raw

# ---------- CORD markup parser ----------

TAG_RE = re.compile(r"</?[^>]+>")  # to strip tags when needed

def _dec_to_float(s: str) -> Optional[float]:
    """Handle both 235.10 and 235,10; tolerate group separators."""
    s = s.strip()
    if not s:
        return None
    # decimal comma -> dot (but first remove group separators like '.' or spaces)
    if re.search(r"\d+,\d{2}\b", s):
        tmp = re.sub(r"(?<=\d)[.\s](?=\d{3}\b)", "", s)
        tmp = tmp.replace(",", ".")
        m = re.search(r"\d+(?:\.\d{1,2})?", tmp)
        return float(m.group(0)) if m else None
    # decimal point path (remove comma/space grouping)
    tmp = re.sub(r"(?<=\d)[,\s](?=\d{3}\b)", "", s)
    m = re.search(r"\d+(?:\.\d{1,2})?", tmp)
    return float(m.group(0)) if m else None

def _split_blocks(raw: str) -> List[str]:
    """Split CORD-style output by <sep/> markers."""
    return [b for b in raw.split("<sep/>") if b.strip()]

def _find_all(tag: str, block: str) -> List[str]:
    """Extract inner texts of repeated tags like <s_nm>...</s_nm> in a block."""
    out = []
    for m in re.finditer(fr"<{tag}>(.*?)</{tag}>", block, flags=re.S):
        out.append(m.group(1).strip())
    return out

def _looks_like_total_or_meta(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in [
        "sum", "total", "varer", "bank", "mva", "vat", "tax", "kontant", "kort",
        "authorized", "autoriser", "kasse", "kvitt", "resultat", "kopi", "psn",
        "ref", "arc", "aid", "tid", "terminal", "terminal", "operator", "time",
        "takk", "thanks", "receipt", "invoice"
    ])

DATE_PATTERNS = [
    r"\b(\d{4})-(\d{2})-(\d{2})\b",      # 2023-10-02
    r"\b(\d{2})[.\-\/](\d{2})[.\-\/](\d{2,4})\b",  # 02.10.23 or 02-10-2023
]

def _extract_date_from_raw(raw: str) -> Optional[str]:
    # Prefer ISO yyyy-mm-dd first
    m = re.search(DATE_PATTERNS[0], raw)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    m = re.search(DATE_PATTERNS[1], raw)
    if m:
        d1, d2, d3 = m.groups()
        if len(d3) == 2:  # yy -> 20yy
            d3 = "20" + d3
        try:
            return f"{int(d3):04d}-{int(d2):02d}-{int(d1):02d}"
        except Exception:
            return None
    return None

def parse_cord_items(raw: str) -> Dict[str, Any]:
    """
    Returns:
      { items: [{name, price}], total: float|None, date: 'YYYY-MM-DD'|None }
    """
    blocks = _split_blocks(raw)
    items: List[Dict[str, Any]] = []
    total: Optional[float] = None

    for b in blocks:
        names = _find_all("s_nm", b)
        unitprices = _find_all("s_unitprice", b)
        prices = _find_all("s_price", b)

        # Prefer explicit <s_price>, else unitprice
        nums = [x for x in (prices + unitprices) if x]
        last_num = nums[-1] if nums else None
        price_val = _dec_to_float(last_num) if last_num else None

        # Pick a plausible name: last <s_nm> that isn't meta-ish
        name = None
        for cand in reversed(names):
            # skip obvious numeric-only or meta-ish lines
            if _looks_like_total_or_meta(cand):
                continue
            if re.fullmatch(r"[0-9\s\-\.:]+", cand):
                continue
            # clean nested tags if any
            name = TAG_RE.sub("", cand).strip()
            if name:
                break

        # Identify totals explicitly
        if any(_looks_like_total_or_meta(n) and "total" in n.lower() for n in names) and price_val:
            # capture overall total (doesn't go into items)
            if (total is None) or (price_val > total):
                total = price_val
            continue

        # Add item when we have both
        if name and price_val is not None:
            items.append({"name": name, "price": price_val})

    date = _extract_date_from_raw(raw)
    return {"items": items, "total": total, "date": date}

# ---------- API ----------

@router.post("/receipt")
async def extract_receipt_raw(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Minimal Donut call + CORD markup parsing to item transactions.
    """
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty upload")

    # rasterize first page for PDFs; else load image
    if _kind(file) == "pdf":
        pages = convert_from_bytes(raw, fmt="png")
        if not pages:
            raise HTTPException(status_code=400, detail="Could not rasterize PDF")
        img = pages[0]
        source = "donut-pdf"
    else:
        img = _pil_from_bytes(raw)
        source = "donut-image"

    # Donut -> CORD markup (string)
    cord_str = _run_donut_raw_json(img)

    # Parse items from CORD markup
    parsed = parse_cord_items(cord_str)
    date = parsed["date"]

    # Map to your draft transactions (one per item)
    transactions = [
        {
            "type": "expense",
            "date": date,                          # may be None if not detected
            "description": it["name"],
            "amount": round(float(it["price"]), 2),
            "confidence": {"amount": 0.9, "description": 0.8, "date": 0.7 if date else 0.0}
        }
        for it in parsed["items"]
    ]

    return {
        "transactions": transactions,
        "raw_json": cord_str,     # keep for debugging/QA in frontend
        "diagnostics": {
            "source": source,
            "date_detected": date is not None,
            "items": len(parsed["items"]),
            "total": parsed["total"],
        },
    }
