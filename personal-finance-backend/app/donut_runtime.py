from functools import lru_cache
from transformers import DonutProcessor, VisionEncoderDecoderModel
import torch

MODEL_ID = "naver-clova-ix/donut-base-finetuned-cord-v2"
DEVICE = "cpu"  # keep simple

@lru_cache(maxsize=1)
def get_donut():
    processor = DonutProcessor.from_pretrained(MODEL_ID)
    model = VisionEncoderDecoderModel.from_pretrained(MODEL_ID)
    model.to(DEVICE)
    model.eval()
    return processor, model, DEVICE
