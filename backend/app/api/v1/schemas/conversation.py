from typing import List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime


class MessageSchema(BaseModel):
    """Schema for a single message in a conversation."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: str = Field(..., description="ISO timestamp")
    metadata: Optional[dict] = Field(None, description="Optional metadata")


class ConversationBase(BaseModel):
    """Base conversation schema."""
    messages: List[MessageSchema] = Field(default_factory=list)
    state: Optional[dict] = Field(None, description="LangGraph state")


class ConversationCreate(ConversationBase):
    """Schema for creating a new conversation."""
    pass


class ConversationResponse(ConversationBase):
    """Schema for conversation response."""
    id: str
    user_id: str
    is_active: bool
    last_message_at: datetime
    created_at: datetime
    updated_at: datetime
    latest_itinerary: Optional[dict] = None

    class Config:
        from_attributes = True


class AddMessageRequest(BaseModel):
    """Schema for adding a message to a conversation."""
    message: MessageSchema


class ConversationWithItinerary(ConversationResponse):
    """Extended conversation response with latest itinerary."""
    latest_itinerary: Optional[dict] = None
