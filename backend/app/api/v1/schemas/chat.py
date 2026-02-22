from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class ChatRequest(BaseModel):
    """Chat request schema."""
    message: str = Field(..., description="User message", min_length=1)
    thread_id: Optional[str] = Field(None, description="Conversation thread ID")
    save_conversation: bool = Field(True, description="Whether to save the conversation")
    currency: Optional[str] = Field("PEN", description="Currency for accommodation search (PEN or USD)")
    budget_total: Optional[int] = Field(None, description="Total trip budget")
    check_in: Optional[str] = Field(None, description="Check-in date YYYY-MM-DD")
    check_out: Optional[str] = Field(None, description="Check-out date YYYY-MM-DD")


class ChatResponse(BaseModel):
    """Chat response schema."""
    message: str = Field(..., description="Assistant response")
    thread_id: str = Field(..., description="Conversation thread ID")
    itinerary: Optional[Dict[str, Any]] = Field(None, description="Generated itinerary if applicable")
    needs_clarification: bool = Field(False, description="Whether more information is needed")
    clarification_questions: List[str] = Field(default_factory=list, description="Questions for the user")
    missing_dates: bool = Field(False, description="Whether dates are missing from first message")
    missing_budget: bool = Field(False, description="Whether budget is missing from first message")
