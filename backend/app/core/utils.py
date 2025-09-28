import json
from pathlib import Path
from typing import Any


def save_json(path: str, obj: Any):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def append_jsonl(path: str, obj: Any):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")
