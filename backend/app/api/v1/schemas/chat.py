from pydantic import BaseModel
from typing import Optional, Dict, Any


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    itinerary: Optional[Dict[str, Any]] = None
