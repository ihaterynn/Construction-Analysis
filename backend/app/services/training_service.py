from app.core.config import settings
from app.core.utils import save_json, append_jsonl
from app.models.schemas import FeedbackIn
import subprocess
import uuid
import time
import logging
from pathlib import Path

log = logging.getLogger(__name__)

from app.core.config import settings
import subprocess

class TrainingService:
    def trigger_training(self, mode="yolo"):
        if mode == "yolo":
            subprocess.run(["python", "backend/scripts/fine_tune_yolo.py"])
            return {"job": "YOLO retraining complete"}
        elif mode == "vlm":
            subprocess.run(["python", "backend/scripts/fine_tune_vlm_lora.py"])
            return {"job": "VLM LoRA fine-tuning complete"}
        else:
            return {"error": "Unknown training mode"}

    def save_feedback(self, payload: FeedbackIn):
        # persist feedback as JSON and append training triplet line
        fname = f"{payload.id}.json"
        path = f"{settings.feedback_dir}/{fname}"
        save_json(path, payload.dict())
        # prepare triplet for VLM: raw image path, instruction, output
        triplet = {
            "image": payload.image_path,
            "instruction": payload.instruction,
            "output": payload.output or self._generate_output_from_boxes(payload)
        }
        append_jsonl(settings.finetune_file, triplet)
        return path

    def _generate_output_from_boxes(self, payload: FeedbackIn):
        boxes = [[b.x, b.y, b.w, b.h] for b in payload.boxes]
        return str(boxes)

    def trigger_training(self):
        job_id = str(uuid.uuid4())
        # launch training subprocess that runs train_vlm.py
        cmd = ["python", "backend/scripts/train_vlm.py", "--data", settings.finetune_file, "--out", settings.adapter_dir]
        log.info("Trigger training job %s: %s", job_id, " ".join(cmd))
        try:
            p = subprocess.Popen(cmd)
            self.queue.append({"job_id": job_id, "pid": p.pid, "started_at": time.time()})
            return {"job_id": job_id, "pid": p.pid}
        except Exception as e:
            log.exception("Failed to start training job: %s", e)
            return {"error": str(e)}
