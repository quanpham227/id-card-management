import json
import os
import logging
from typing import List
from fastapi import HTTPException

logger = logging.getLogger(__name__)


# --- 4. HELPER FUNCTIONS ---
def load_json_file(filepath: str) -> List[dict]:
    try:
        if not os.path.exists(filepath):
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading {filepath}: {e}")
        return []


def save_json_file(filepath: str, data: List[dict]):
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        logger.error(f"Error saving {filepath}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save data")
