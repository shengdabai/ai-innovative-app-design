from typing import Optional
from pydantic import BaseModel, HttpUrl
from enum import Enum

class TryOnQuality(str, Enum):
    fast = "fast"
    standard = "standard"
    hd = "hd"

class TryOnRequest(BaseModel):
    clothing_image_url: Optional[str] = None
    clothing_image_base64: Optional[str] = None # For direct uploads if needed
    quality: TryOnQuality = TryOnQuality.standard

class TryOnResponse(BaseModel):
    task_id: str
    status: str # processing, completed, failed
    result_image_url: Optional[str] = None
    queue_position: int = 0
    estimated_time: float = 0.0

class TryOnStatus(BaseModel):
    task_id: str
    status: str
    progress: int # 0-100
    result_image_url: Optional[str] = None
