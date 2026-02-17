from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_active_user
from app.api.v1.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Process chat message and return AI response.
    This will be implemented in Phase 2 with LangGraph agents.
    """
    # TODO: Implement LangGraph workflow
    return ChatResponse(
        message="Chat endpoint - To be implemented in Phase 2",
        conversation_id=request.conversation_id or "new",
        itinerary=None
    )
