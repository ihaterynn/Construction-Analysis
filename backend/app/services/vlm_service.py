from typing import Optional
from app.core.config import settings
import io
from PIL import Image
import logging

log = logging.getLogger(__name__)

# Optional dependencies
try:
    import torch
    from transformers import Qwen2VLForConditionalGeneration, Qwen2VLProcessor, BitsAndBytesConfig
    from peft import PeftModel, get_peft_model, LoraConfig
    HF_AVAILABLE = True
except Exception:
    HF_AVAILABLE = False

class VLMService:
    def __init__(self, model_id: Optional[str] = None, device: Optional[str] = None):
        self.model_id = model_id or settings.qwen_model
        self.device = device or ("cuda" if HF_AVAILABLE and torch.cuda.is_available() else "cpu")
        self.processor = None
        self.model = None
        self.adapter_loaded = False
        # Temporarily disable VLM model loading for YOLO testing
        # if HF_AVAILABLE:
        #     self._load_base_model()

    def _load_base_model(self):
        try:
            if torch.cuda.is_available():
                bnb = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float16,
                )
                self.model = Qwen2VLForConditionalGeneration.from_pretrained(
                    self.model_id, device_map="auto", quantization_config=bnb, use_cache=False
                )
            else:
                self.model = Qwen2VLForConditionalGeneration.from_pretrained(self.model_id, use_cache=False)
            self.processor = Qwen2VLProcessor.from_pretrained(self.model_id)
            self.processor.tokenizer.padding_side = "right"
        except Exception as e:
            log.exception("Failed to load VLM model: %s", e)
            self.model = None
            self.processor = None

    def _pil_from_bytes(self, image_bytes: bytes):
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

    def answer_bytes(self, image_bytes: bytes, instruction: str, max_new_tokens: int = 128) -> str:
        if not HF_AVAILABLE or self.model is None or self.processor is None:
            # fallback heuristic: return instruction echo
            return f"[VLM stub] instruction: {instruction}"

        image = self._pil_from_bytes(image_bytes)
        system_message = ("You are a floorplan assistant specialized in detecting electrical symbols "
                          "and returning coordinates and counts as JSON where requested.")
        prompt = [
            {"role": "system", "content": [{"type": "text", "text": system_message}]},
            {"role": "user", "content": [{"type": "image", "image": image}, {"type": "text", "text": instruction}]}
        ]
        text = self.processor.apply_chat_template(prompt, tokenize=False, add_generation_prompt=True)
        inputs = self.processor(text=[text], images=image, return_tensors="pt", padding=True)
        inputs = inputs.to(self.device)
        with torch.no_grad():
            generated_ids = self.model.generate(**inputs, max_new_tokens=max_new_tokens)
        output = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        return output

    def load_adapter(self, adapter_path: str):
        if not HF_AVAILABLE:
            raise RuntimeError("HuggingFace stack not available")
        try:
            # attempt to load adapter into model
            if self.model is None:
                self._load_base_model()
            # method depends on PEFT version; support load_adapter or PeftModel.from_pretrained
            try:
                self.model = PeftModel.from_pretrained(self.model, adapter_path)
            except Exception:
                # fallback: if using get_peft_model previously, use load_adapter API
                self.model.load_adapter(adapter_path)
            self.adapter_loaded = True
        except Exception as e:
            log.exception("Failed to load adapter: %s", e)
            raise
