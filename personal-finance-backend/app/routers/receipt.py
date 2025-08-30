from __future__ import annotations
import io, re
from typing import Dict, Any, List
from fastapi import APIRouter, UploadFile, File, HTTPException
from pdf2image import convert_from_bytes
from PIL import Image
import torch

from ..donut_runtime import get_donut

router = APIRouter(prefix="/extract", tags=["receipt"])

def _kind(file: UploadFile) -> str:
    ct = (file.content_type or "").lower()
    if ct == "application/pdf" or (file.filename and file.filename.lower().endswith(".pdf")):
        return "pdf"
    return "image"

def _pil_from_bytes(raw: bytes) -> Image.Image:
    return Image.open(io.BytesIO(raw)).convert("RGB")

@router.post("/receipt")
async def extract_receipt_raw(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Minimal Donut call. Returns whatever JSON string the model generates.
    No preprocessing, no parsing.
    """
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty upload")

    images: List[Image.Image]
    source = "image"
    if _kind(file) == "pdf":
        # First page only, default DPI
        pages = convert_from_bytes(raw, fmt="png")
        if not pages:
            raise HTTPException(status_code=400, detail="Could not rasterize PDF")
        images = [pages[0]]
        source = "pdf"
    else:
        images = [_pil_from_bytes(raw)]

    processor, model, device = get_donut()

    # Donut CORD model requires a task prompt
    task_prompt = "<s_cord-v2>"
    decoder_input_ids = processor.tokenizer(
        task_prompt, add_special_tokens=False, return_tensors="pt"
    ).input_ids.to(device)

    # Run on first image only (keep it minimal)
    img = images[0]
    pixel_values = processor(images=img, return_tensors="pt").pixel_values.to(device)

    with torch.no_grad():
        output_ids = model.generate(
            pixel_values=pixel_values,
            decoder_input_ids=decoder_input_ids,
            max_length=512,
            num_beams=1,
            early_stopping=True,
        )

    raw_out = processor.batch_decode(output_ids, skip_special_tokens=True)[0]
    # If the model wrapped JSON in extra text, keep the JSON object/s only
    m = re.search(r"\{.*\}", raw_out, flags=re.S)
    json_str = m.group(0) if m else raw_out

    return {
        "raw_json": json_str,
        "diagnostics": {"source": f"donut-{source}"}
    }
